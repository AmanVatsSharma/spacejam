/**
 * File:        apps/api/src/integrations/payments-webhook.controller.spec.ts
 * Module:      API · Integrations · Payments Webhook · Tests
 * Purpose:     POST /api/payments/webhook:
 *                - authenticates with HMAC-SHA256 over the RAW body using the
 *                  webhook secret a super-admin saved (nothing is processed
 *                  before the signature passes)
 *                - routes events to the ledger (captured / order.paid /
 *                  authorized → settle; failed → record)
 *                - response policy Razorpay's retry logic depends on: permanent
 *                  problems (4xx) are acknowledged, transient ones (5xx / any
 *                  unexpected error) return 500 so Razorpay retries — safe
 *                  because settlement is idempotent
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import { PaymentsWebhookController } from './payments-webhook.controller';

const SECRET = 'whsec_test_12345678';

const sig = (body: string, secret = SECRET) => createHmac('sha256', secret).update(body, 'utf8').digest('hex');
const request = (body: string, signature?: string) =>
  ({ headers: signature === undefined ? {} : { 'x-razorpay-signature': signature }, rawBody: Buffer.from(body, 'utf8') }) as any;
const event = (name: string, payment: Record<string, unknown> = { id: 'pay_1', order_id: 'order_1', status: 'captured' }) =>
  JSON.stringify({ event: name, payload: { payment: { entity: payment } } });

function build(webhookSecret = SECRET) {
  const settings = { getRazorpayConfig: vi.fn(async () => ({ keyId: 'k', keySecret: 's', webhookSecret, mode: 'test' })) };
  const orders = {
    settleFromWebhook: vi.fn(async (p: any) => ({ order: { providerOrderId: p.order_id }, alreadySettled: false })),
    recordFailure: vi.fn(async () => {}),
  };
  return { controller: new PaymentsWebhookController(settings as any, orders as any), orders, settings };
}

describe('PaymentsWebhookController', () => {
  let h: ReturnType<typeof build>;
  beforeEach(() => {
    h = build();
  });

  describe('authentication', () => {
    it('rejects when no webhook secret is configured', async () => {
      const unconfigured = build('');
      const body = event('payment.captured');
      await expect(unconfigured.controller.handleWebhook(request(body, sig(body)))).rejects.toThrow(BadRequestException);
      expect(unconfigured.orders.settleFromWebhook).not.toHaveBeenCalled();
    });

    it('rejects a missing raw body and a missing signature header', async () => {
      await expect(h.controller.handleWebhook({ headers: { 'x-razorpay-signature': 'x' }, rawBody: undefined } as any)).rejects.toThrow(BadRequestException);
      await expect(h.controller.handleWebhook(request(event('payment.captured')))).rejects.toThrow(UnauthorizedException);
    });

    it('rejects a wrong signature (wrong secret, tampered body, garbage) and processes NOTHING', async () => {
      const body = event('payment.captured');
      await expect(h.controller.handleWebhook(request(body, sig(body, 'another-secret')))).rejects.toThrow(UnauthorizedException);
      await expect(h.controller.handleWebhook(request(body.replace('order_1', 'order_2'), sig(body)))).rejects.toThrow(UnauthorizedException);
      await expect(h.controller.handleWebhook(request(body, 'deadbeef'))).rejects.toThrow(UnauthorizedException);
      expect(h.orders.settleFromWebhook).not.toHaveBeenCalled();
      expect(h.orders.recordFailure).not.toHaveBeenCalled();
    });

    it('signs the RAW bytes: re-serialised JSON with the same content fails verification', async () => {
      const body = event('payment.captured');
      const reformatted = JSON.stringify(JSON.parse(body), null, 2);
      await expect(h.controller.handleWebhook(request(reformatted, sig(body)))).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('event routing', () => {
    it.each(['payment.captured', 'order.paid', 'payment.authorized'])('%s → settles through the ledger', async (name) => {
      const body = event(name);
      await expect(h.controller.handleWebhook(request(body, sig(body)))).resolves.toEqual({ received: true });
      expect(h.orders.settleFromWebhook).toHaveBeenCalledWith(expect.objectContaining({ id: 'pay_1', order_id: 'order_1' }));
    });

    it('payment.failed → records the failure, does not settle', async () => {
      const body = event('payment.failed', { id: 'pay_9', order_id: 'order_1', status: 'failed', error_description: 'Card declined' });
      await h.controller.handleWebhook(request(body, sig(body)));
      expect(h.orders.recordFailure).toHaveBeenCalledWith(expect.objectContaining({ id: 'pay_9' }));
      expect(h.orders.settleFromWebhook).not.toHaveBeenCalled();
    });

    it('unhandled events (refunds, disputes…) are acknowledged without side effects', async () => {
      const body = event('refund.processed');
      await expect(h.controller.handleWebhook(request(body, sig(body)))).resolves.toEqual({ received: true });
      expect(h.orders.settleFromWebhook).not.toHaveBeenCalled();
      expect(h.orders.recordFailure).not.toHaveBeenCalled();
    });

    it('an authenticated body that is not JSON is acknowledged (a retry could not fix it)', async () => {
      const body = 'not json at all';
      await expect(h.controller.handleWebhook(request(body, sig(body)))).resolves.toEqual({ received: true });
    });

    it('a captured event with no payment entity is acknowledged and ignored', async () => {
      const body = JSON.stringify({ event: 'payment.captured', payload: {} });
      await expect(h.controller.handleWebhook(request(body, sig(body)))).resolves.toEqual({ received: true });
      expect(h.orders.settleFromWebhook).not.toHaveBeenCalled();
    });
  });

  describe('response policy (what makes Razorpay retry)', () => {
    const send = () => {
      const body = event('payment.captured');
      return h.controller.handleWebhook(request(body, sig(body)));
    };

    it.each([
      ['BadRequest (amount mismatch)', new BadRequestException('The paid amount does not match the order.')],
      ['Forbidden', new ForbiddenException()],
      ['NotFound', new NotFoundException()],
    ])('permanent %s → 200, so Razorpay stops retrying', async (_label, error) => {
      h.orders.settleFromWebhook.mockRejectedValueOnce(error);
      await expect(send()).resolves.toEqual({ received: true });
    });

    it.each([
      ['gateway outage (503)', new ServiceUnavailableException('down')],
      ['unexpected error / DB failure', new Error('connection terminated')],
    ])('transient %s → 500, so Razorpay retries (settlement is idempotent)', async (_label, error) => {
      h.orders.settleFromWebhook.mockRejectedValueOnce(error);
      await expect(send()).rejects.toThrow(InternalServerErrorException);
    });

    it('a retry after a transient failure then succeeds', async () => {
      h.orders.settleFromWebhook.mockRejectedValueOnce(new Error('connection terminated'));
      await expect(send()).rejects.toThrow(InternalServerErrorException);
      await expect(send()).resolves.toEqual({ received: true });
      expect(h.orders.settleFromWebhook).toHaveBeenCalledTimes(2);
    });
  });
});
