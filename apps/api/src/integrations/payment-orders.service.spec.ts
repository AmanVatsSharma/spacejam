/**
 * File:        apps/api/src/integrations/payment-orders.service.spec.ts
 * Module:      API · Integrations · Payment Orders · Tests
 * Purpose:     The gateway ledger's integrity guarantees:
 *
 *                BINDING     an order is created server-side for a known record
 *                            and amount; settling it can only ever finalize THAT
 *                            record (the old verifyPayment marked any invoice paid
 *                            given any valid signature)
 *                VERIFICATION signature, order id, amount, currency and payment
 *                            status are all checked; authorized payments are
 *                            captured only if still authorized
 *                ATOMICITY   one guarded CREATED → PAID transition; the finalizer
 *                            runs on every settlement attempt (self-healing) and is
 *                            idempotent; a SECOND, different payment on a settled
 *                            order is flagged for refund and never re-finalizes
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { InvoiceStatus, PaymentMethod } from '@enums';
import {
  PaymentOrdersService,
  PaymentSignatureError,
} from './payment-orders.service';
import { RazorpayService } from './razorpay.service';
import {
  PaymentOrderPurpose,
  PaymentOrderStatus,
} from '../graphql/enums/onboarding-payment.enums';

const SECRET = 'key-secret-0123456789';

// ── tiny in-memory repos (the ledger uses a guarded UPDATE via the query builder) ──
function ordersRepo() {
  const rows: any[] = [];
  const matches = (r: any, where: any) => Object.entries(where).every(([k, v]) => r[k] === v);
  return {
    rows,
    create: (p: any) => ({ ...p }),
    save: vi.fn(async (o: any) => {
      const row = { id: o.id ?? `po-${rows.length + 1}`, createdAt: new Date(), ...o };
      rows.push(row);
      return row;
    }),
    findOne: vi.fn(async ({ where }: any) => rows.find((r) => matches(r, where)) ?? null),
    find: vi.fn(async ({ where }: any) => rows.filter((r) => matches(r, where)).reverse()),
    update: vi.fn(async (id: string, patch: any) => {
      Object.assign(rows.find((r) => r.id === id) ?? {}, patch);
    }),
    // .createQueryBuilder().update(E).set(patch).where('"id" = :id AND "status" <> :paid', {id, paid}).execute()
    createQueryBuilder: () => {
      let patch: any = {};
      const qb: any = {
        update: () => qb,
        set: (p: any) => ((patch = p), qb),
        where: (_sql: string, params: { id: string; paid: string }) => ({
          execute: async () => {
            const row = rows.find((r) => r.id === params.id && r.status !== params.paid);
            if (!row) return { affected: 0 };
            Object.assign(row, patch);
            return { affected: 1 };
          },
        }),
      };
      return qb;
    },
  };
}

function invoicesRepo(initial: any[] = []) {
  const rows = [...initial];
  return {
    rows,
    findOne: vi.fn(async ({ where }: any) => rows.find((r) => r.id === where.id) ?? null),
    update: vi.fn(async (id: string, patch: any) => {
      Object.assign(rows.find((r) => r.id === id) ?? {}, patch);
    }),
  };
}

const sign = (orderId: string, paymentId: string) =>
  createHmac('sha256', SECRET).update(`${orderId}|${paymentId}`).digest('hex');

const payment = (over: Record<string, unknown> = {}): any => ({
  id: 'pay_1',
  entity: 'payment',
  amount: 5_000_000,
  currency: 'INR',
  status: 'captured',
  order_id: 'order_1',
  ...over,
});

function build(opts: { invoices?: any[]; secret?: string } = {}) {
  const orders = ordersRepo();
  const invoices = invoicesRepo(opts.invoices);
  const razorpay = {
    createOrderPaise: vi.fn(async ({ amountPaise, receipt }: any) => ({
      id: 'order_1',
      amount: amountPaise,
      currency: 'INR',
      receipt,
      status: 'created',
    })),
    verifySignature: new RazorpayService({ getRazorpayConfig: async () => ({}) } as any).verifySignature,
    fetchPayment: vi.fn(async () => payment()),
    capturePayment: vi.fn(async () => payment({ status: 'captured' })),
  };
  const settings = { getRazorpayConfig: vi.fn(async () => ({ keyId: 'rzp_test_x', keySecret: opts.secret ?? SECRET, webhookSecret: 'w', mode: 'test' })) };
  const service = new PaymentOrdersService(orders as any, invoices as any, razorpay as any, settings as any);
  const finalizer = vi.fn(async () => {});
  service.registerFinalizer(PaymentOrderPurpose.ONBOARDING, finalizer);
  return { service, orders, invoices, razorpay, settings, finalizer };
}

/** An onboarding order already in the ledger. */
async function withOnboardingOrder(h: ReturnType<typeof build>) {
  return h.service.createOrder({
    purpose: PaymentOrderPurpose.ONBOARDING,
    amountPaise: 5_000_000,
    receipt: 'onb_1',
    onboardingId: 'ob-1',
    centerId: 'center-1',
    createdById: 'staff-1',
  });
}

describe('PaymentOrdersService', () => {
  let h: ReturnType<typeof build>;
  beforeEach(() => {
    h = build();
  });

  // ══════════════════════════════════════════════════════════════════════
  describe('creating orders', () => {
    it('creates the gateway order and records it bound to the onboarding, with the SERVER amount', async () => {
      const order = await withOnboardingOrder(h);
      expect(h.razorpay.createOrderPaise).toHaveBeenCalledWith({
        amountPaise: 5_000_000,
        receipt: 'onb_1',
        notes: { purpose: 'ONBOARDING', onboardingId: 'ob-1' },
      });
      expect(order).toMatchObject({
        provider: 'RAZORPAY',
        providerOrderId: 'order_1',
        amountPaise: 5_000_000,
        currency: 'INR',
        status: PaymentOrderStatus.CREATED,
        purpose: PaymentOrderPurpose.ONBOARDING,
        onboardingId: 'ob-1',
        invoiceId: null,
        centerId: 'center-1',
        createdById: 'staff-1',
      });
    });

    it('an invoice order always charges the INVOICE total (never a client amount) and refuses settled/cancelled invoices', async () => {
      const order = await h.service.createInvoiceOrder(
        { id: 'inv-1', invoiceNumber: 'INV-2026-001', amount: 1000, totalAmount: '1180.00', status: InvoiceStatus.SENT, centerId: 'c1' } as any,
        'staff-1',
      );
      expect(order.amountPaise).toBe(118_000); // ₹1,180.00 incl. tax, not the pre-tax ₹1,000
      expect(order).toMatchObject({ purpose: PaymentOrderPurpose.INVOICE, invoiceId: 'inv-1', onboardingId: null, centerId: 'c1' });

      await expect(h.service.createInvoiceOrder({ id: 'i', totalAmount: 10, status: InvoiceStatus.PAID } as any)).rejects.toThrow(/already paid/);
      await expect(h.service.createInvoiceOrder({ id: 'i', totalAmount: 10, status: InvoiceStatus.CANCELLED } as any)).rejects.toThrow(/cancelled/);
    });

    it('records the invoice number in the receipt', async () => {
      await h.service.createInvoiceOrder({ id: 'inv-1', invoiceNumber: 'INV-77', totalAmount: 500, status: InvoiceStatus.SENT } as any);
      expect(h.razorpay.createOrderPaise).toHaveBeenCalledWith(expect.objectContaining({ receipt: 'inv_INV-77' }));
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  describe('confirmCheckout (browser result)', () => {
    const confirm = (h: ReturnType<typeof build>, over: Record<string, unknown> = {}) =>
      h.service.confirmCheckout({
        providerOrderId: 'order_1',
        providerPaymentId: 'pay_1',
        signature: sign('order_1', 'pay_1'),
        actorId: 'staff-1',
        ...over,
      } as any);

    it('verifies, settles the ledger and runs the finalizer with the right context', async () => {
      const order = await withOnboardingOrder(h);
      const res = await confirm(h, { bindTo: { onboardingId: 'ob-1' } });

      expect(res.alreadySettled).toBe(false);
      expect(res.order).toMatchObject({ status: PaymentOrderStatus.PAID, providerPaymentId: 'pay_1' });
      expect(res.order.paidAt).toBeInstanceOf(Date);
      expect(res.order.signatureVerifiedAt).toBeInstanceOf(Date); // checkout path proves the HMAC
      expect(h.finalizer).toHaveBeenCalledTimes(1);
      expect(h.finalizer).toHaveBeenCalledWith(expect.objectContaining({ id: order.id }), {
        paymentId: 'pay_1',
        actorId: 'staff-1',
        source: 'checkout',
      });
    });

    it('rejects an unknown order', async () => {
      await expect(confirm(h)).rejects.toThrow(NotFoundException);
    });

    it('refuses to settle an order for a DIFFERENT onboarding or invoice than the caller claims', async () => {
      await withOnboardingOrder(h);
      await expect(confirm(h, { bindTo: { onboardingId: 'someone-elses' } })).rejects.toThrow(ForbiddenException);
      await expect(confirm(h, { bindTo: { invoiceId: 'inv-9' } })).rejects.toThrow(ForbiddenException);
      expect(h.razorpay.fetchPayment).not.toHaveBeenCalled();
      expect(h.finalizer).not.toHaveBeenCalled();
      expect(h.orders.rows[0].status).toBe(PaymentOrderStatus.CREATED);
    });

    it('rejects a bad signature without ever contacting Razorpay or finalizing', async () => {
      await withOnboardingOrder(h);
      await expect(confirm(h, { signature: 'f'.repeat(64) })).rejects.toThrow(PaymentSignatureError);
      await expect(confirm(h, { signature: sign('order_1', 'pay_OTHER') })).rejects.toThrow(PaymentSignatureError); // sig for another payment
      expect(h.razorpay.fetchPayment).not.toHaveBeenCalled();
      expect(h.finalizer).not.toHaveBeenCalled();
      expect(h.orders.rows[0].status).toBe(PaymentOrderStatus.CREATED);
    });

    it('refuses when Razorpay is not configured', async () => {
      const unconfigured = build({ secret: '' });
      await withOnboardingOrder(unconfigured);
      await expect(confirm(unconfigured)).rejects.toThrow(/not configured/);
    });

    it('is a safe replay: a second confirmation reports alreadySettled but still re-runs the (idempotent) finalizer', async () => {
      await withOnboardingOrder(h);
      await confirm(h);
      const again = await confirm(h);
      expect(again.alreadySettled).toBe(true);
      expect(h.finalizer).toHaveBeenCalledTimes(2); // heals a crash between "ledger PAID" and "finalized"
      expect(h.orders.rows).toHaveLength(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  describe('settlement checks', () => {
    it('rejects a payment that belongs to a different order', async () => {
      await withOnboardingOrder(h);
      h.razorpay.fetchPayment.mockResolvedValueOnce(payment({ order_id: 'order_OTHER' }));
      await expect(
        h.service.confirmCheckout({ providerOrderId: 'order_1', providerPaymentId: 'pay_1', signature: sign('order_1', 'pay_1') }),
      ).rejects.toThrow(/does not belong to the order/);
      expect(h.finalizer).not.toHaveBeenCalled();
    });

    it('rejects a payment whose amount or currency differs from the order', async () => {
      await withOnboardingOrder(h);
      const attempt = () =>
        h.service.confirmCheckout({ providerOrderId: 'order_1', providerPaymentId: 'pay_1', signature: sign('order_1', 'pay_1') });
      h.razorpay.fetchPayment.mockResolvedValueOnce(payment({ amount: 100 }));
      await expect(attempt()).rejects.toThrow(/amount does not match/);
      h.razorpay.fetchPayment.mockResolvedValueOnce(payment({ currency: 'USD' }));
      await expect(attempt()).rejects.toThrow(/amount does not match/);
      expect(h.finalizer).not.toHaveBeenCalled();
      expect(h.orders.rows[0].status).toBe(PaymentOrderStatus.CREATED);
    });

    it.each(['failed', 'created', 'refunded'])('rejects a payment whose status is "%s"', async (status) => {
      await withOnboardingOrder(h);
      h.razorpay.fetchPayment.mockResolvedValueOnce(payment({ status }));
      await expect(
        h.service.confirmCheckout({ providerOrderId: 'order_1', providerPaymentId: 'pay_1', signature: sign('order_1', 'pay_1') }),
      ).rejects.toThrow(/not complete yet/);
      expect(h.finalizer).not.toHaveBeenCalled();
    });

    it('captures an AUTHORIZED payment (manual-capture accounts) before settling', async () => {
      await withOnboardingOrder(h);
      h.razorpay.fetchPayment.mockResolvedValue(payment({ status: 'authorized' })); // checkout fetch AND the re-read
      const res = await h.service.confirmCheckout({ providerOrderId: 'order_1', providerPaymentId: 'pay_1', signature: sign('order_1', 'pay_1') });
      expect(h.razorpay.capturePayment).toHaveBeenCalledWith('pay_1', 5_000_000, 'INR');
      expect(res.order.status).toBe(PaymentOrderStatus.PAID);
    });

    it('does not double-capture when an authorized payment auto-captured in the meantime', async () => {
      await withOnboardingOrder(h);
      h.razorpay.fetchPayment
        .mockResolvedValueOnce(payment({ status: 'authorized' })) // what the browser path sees
        .mockResolvedValueOnce(payment({ status: 'captured' })); // the re-read inside settle
      await h.service.confirmCheckout({ providerOrderId: 'order_1', providerPaymentId: 'pay_1', signature: sign('order_1', 'pay_1') });
      expect(h.razorpay.capturePayment).not.toHaveBeenCalled();
    });

    it('flags a SECOND, different payment on an already-settled order for refund — without re-finalizing', async () => {
      await withOnboardingOrder(h);
      await h.service.settleFromWebhook(payment({ id: 'pay_FIRST' }));
      h.finalizer.mockClear();

      const dup = await h.service.settleFromWebhook(payment({ id: 'pay_SECOND' }));
      expect(dup?.alreadySettled).toBe(true);
      expect(dup?.order.providerPaymentId).toBe('pay_FIRST'); // the first payment stays on the record
      expect(h.finalizer).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  describe('webhook settlement', () => {
    it('settles from a webhook payment entity (no signature proof, no refetch)', async () => {
      const order = await withOnboardingOrder(h);
      const res = await h.service.settleFromWebhook(payment());
      expect(res?.order.status).toBe(PaymentOrderStatus.PAID);
      expect(res?.order.signatureVerifiedAt).toBeNull();
      expect(h.razorpay.fetchPayment).not.toHaveBeenCalled(); // already authenticated by the webhook HMAC
      expect(h.finalizer).toHaveBeenCalledWith(expect.objectContaining({ id: order.id }), { paymentId: 'pay_1', actorId: undefined, source: 'webhook' });
    });

    it('a webhook replay after the browser settled is a no-op for the ledger', async () => {
      await withOnboardingOrder(h);
      await h.service.confirmCheckout({ providerOrderId: 'order_1', providerPaymentId: 'pay_1', signature: sign('order_1', 'pay_1') });
      const paidAt = h.orders.rows[0].paidAt;
      const replay = await h.service.settleFromWebhook(payment());
      expect(replay?.alreadySettled).toBe(true);
      expect(h.orders.rows[0].paidAt).toBe(paidAt);
    });

    it('ignores payments with no order id and orders that are not ours', async () => {
      expect(await h.service.settleFromWebhook(payment({ order_id: null }))).toBeNull();
      expect(await h.service.settleFromWebhook(payment({ order_id: 'order_NOT_OURS' }))).toBeNull();
      expect(h.finalizer).not.toHaveBeenCalled();
    });

    it('records a failed attempt on an open order but never overwrites a paid one', async () => {
      await withOnboardingOrder(h);
      await h.service.recordFailure(payment({ status: 'failed', error_description: 'Card declined by bank' }));
      expect(h.orders.rows[0]).toMatchObject({ status: PaymentOrderStatus.CREATED, failureReason: 'Card declined by bank' });

      await h.service.settleFromWebhook(payment());
      await h.service.recordFailure(payment({ status: 'failed', error_description: 'late failure event' }));
      expect(h.orders.rows[0].status).toBe(PaymentOrderStatus.PAID);
      expect(h.orders.rows[0].failureReason).toBeNull();
    });
  });

  // ══════════════════════════════════════════════════════════════════════
  describe('finalizers', () => {
    it('a GENERAL (amount-only) order settles without finalizing anything', async () => {
      const general = await h.service.createOrder({ purpose: PaymentOrderPurpose.GENERAL, amountPaise: 5_000_000, receipt: 'gen_1' });
      const res = await h.service.settleFromWebhook(payment());
      expect(res?.order.id).toBe(general.id);
      expect(res?.order.status).toBe(PaymentOrderStatus.PAID);
      expect(h.finalizer).not.toHaveBeenCalled();
    });

    it('fails LOUDLY (so the webhook is retried) when no finalizer is registered for the purpose', async () => {
      const bare = new PaymentOrdersService(ordersRepo() as any, invoicesRepo() as any, h.razorpay as any, h.settings as any);
      const order = await bare.createOrder({ purpose: PaymentOrderPurpose.ONBOARDING, amountPaise: 5_000_000, receipt: 'r', onboardingId: 'ob-1' });
      expect(order.purpose).toBe(PaymentOrderPurpose.ONBOARDING);
      await expect(bare.settleFromWebhook(payment())).rejects.toThrow(/No finalizer registered/);
    });

    describe('INVOICE', () => {
      const unpaid = (over: Record<string, unknown> = {}) => ({
        id: 'inv-1',
        invoiceNumber: 'INV-1',
        status: InvoiceStatus.SENT,
        totalAmount: '50000.00',
        centerId: 'c1',
        ...over,
      });
      const invoiceOrder = (hh: ReturnType<typeof build>) => hh.service.createInvoiceOrder(unpaid() as any, 'staff-1');

      it('marks ONLY the invoice the order was created for as PAID (ONLINE) with the payment id as reference', async () => {
        const hh = build({ invoices: [unpaid(), unpaid({ id: 'inv-other', invoiceNumber: 'INV-2' })] });
        await invoiceOrder(hh);
        await hh.service.settleFromWebhook(payment());

        expect(hh.invoices.update).toHaveBeenCalledTimes(1);
        expect(hh.invoices.update).toHaveBeenCalledWith('inv-1', {
          status: InvoiceStatus.PAID,
          paidDate: expect.any(Date),
          paymentMethod: PaymentMethod.ONLINE,
          paymentReference: 'pay_1',
        });
        expect(hh.invoices.rows.find((r) => r.id === 'inv-other').status).toBe(InvoiceStatus.SENT); // the other invoice is untouched
      });

      it('an already-PAID invoice is left alone (idempotent)', async () => {
        const hh = build({ invoices: [unpaid()] });
        await invoiceOrder(hh);
        hh.invoices.rows[0].status = InvoiceStatus.PAID;
        await hh.service.settleFromWebhook(payment());
        expect(hh.invoices.update).not.toHaveBeenCalled();
      });

      it('does not auto-mark an invoice that was edited after the order was created (amount no longer matches)', async () => {
        const hh = build({ invoices: [unpaid()] });
        await invoiceOrder(hh);
        hh.invoices.rows[0].totalAmount = '60000.00';
        const res = await hh.service.settleFromWebhook(payment());
        expect(res?.order.status).toBe(PaymentOrderStatus.PAID); // the money IS received…
        expect(hh.invoices.update).not.toHaveBeenCalled(); // …but reconciliation is manual
      });

      it('tolerates a deleted invoice', async () => {
        const hh = build({ invoices: [] });
        await invoiceOrder(hh);
        await expect(hh.service.settleFromWebhook(payment())).resolves.toBeTruthy();
      });
    });
  });

  it('PaymentSignatureError is a 400 so callers can map it to a boolean', () => {
    const err = new PaymentSignatureError();
    expect(err).toBeInstanceOf(BadRequestException);
    expect(err.message).toMatch(/signature is invalid/);
  });
});
