/**
 * File:        apps/api/src/integrations/payments-webhook.controller.ts
 * Module:      API · Integrations · Payments Webhook
 * Purpose:     Public REST endpoint (POST /api/payments/webhook) receiving
 *              Razorpay webhook events. Authenticates the call by verifying
 *              x-razorpay-signature (HMAC-SHA256 over the RAW body, constant-
 *              time compare) against the webhook secret a super-admin saved in
 *              Settings → Integrations.
 *
 *              Events are settled through PaymentOrdersService, which looks the
 *              order up in OUR ledger (never trusting `notes` from the payload)
 *              and settles idempotently:
 *                payment.captured / order.paid / payment.authorized → settle
 *                payment.failed                                     → record reason
 *              This is what completes an onboarding or invoice when the browser
 *              closed right after the customer paid.
 *
 *              Response policy (Razorpay retries non-2xx for ~24h):
 *                - bad signature            → 401 (never processed)
 *                - permanent problem (4xx)  → 200, logged (a retry can't fix it)
 *                - transient problem (5xx)  → 500, so Razorpay retries; safe
 *                                             because settlement is idempotent
 *
 * Author:      ZCode (original) · Claude Sonnet 5.5 (ledger-based rewrite)
 * Last-updated: 2026-10-02
 */
import {
  Controller,
  Post,
  Req,
  HttpCode,
  HttpException,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { createHmac } from 'crypto';
import type { Request } from 'express';
import type { RawBodyRequest } from '@nestjs/common';

import { IntegrationSettingsService } from './integration-settings.service';
import { PaymentOrdersService } from './payment-orders.service';
import { RazorpayPayment, safeEqual } from './razorpay.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('payments')
export class PaymentsWebhookController {
  private readonly logger = new Logger(PaymentsWebhookController.name);

  constructor(
    private readonly settings: IntegrationSettingsService,
    private readonly orders: PaymentOrdersService,
  ) {}

  @Post('webhook')
  @Public()
  @HttpCode(200)
  async handleWebhook(@Req() req: RawBodyRequest<Request>): Promise<{ received: boolean }> {
    const cfg = await this.settings.getRazorpayConfig();
    if (!cfg.webhookSecret) {
      throw new BadRequestException('Razorpay webhook secret is not configured.');
    }

    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody;
    if (!rawBody || !rawBody.length) {
      throw new BadRequestException('Missing raw request body.');
    }
    if (typeof signature !== 'string' || !signature) {
      throw new UnauthorizedException('Missing webhook signature.');
    }

    // Razorpay signs HMAC-SHA256(rawBody, webhookSecret).
    const expected = createHmac('sha256', cfg.webhookSecret).update(rawBody).digest('hex');
    if (!safeEqual(expected, signature)) {
      this.logger.warn('Razorpay webhook signature mismatch — rejecting.');
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody.toString('utf8'));
    } catch {
      // Authenticated but unparseable: nothing a retry could fix.
      this.logger.error('Razorpay webhook body is not valid JSON; acknowledging.');
      return { received: true };
    }

    const event: string | undefined = payload?.event;
    const payment: RazorpayPayment | undefined = payload?.payload?.payment?.entity;

    try {
      switch (event) {
        case 'payment.captured':
        case 'order.paid':
        case 'payment.authorized':
          if (payment) {
            const result = await this.orders.settleFromWebhook(payment);
            if (result) {
              this.logger.log(
                `Webhook ${event}: order ${result.order.providerOrderId} ${
                  result.alreadySettled ? 'already settled' : 'settled'
                }.`,
              );
            }
          }
          break;
        case 'payment.failed':
          if (payment) await this.orders.recordFailure(payment);
          break;
        default:
          // Other events (refunds, disputes, …) aren't handled yet.
          break;
      }
    } catch (err: any) {
      if (err instanceof HttpException && err.getStatus() < 500) {
        this.logger.error(`Webhook ${event} not processable (permanent): ${err.message}`);
        return { received: true };
      }
      this.logger.error(`Webhook ${event} failed (will be retried by Razorpay): ${err?.message}`);
      throw new InternalServerErrorException('Webhook processing failed.');
    }
    return { received: true };
  }
}
