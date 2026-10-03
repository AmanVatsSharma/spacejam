/**
 * File:        apps/api/src/integrations/payment.resolver.spec.ts
 * Module:      API · Integrations · Payment Resolver · Tests
 * Purpose:     The dashboard payment operations:
 *                - paymentConfig exposes the receiving bank account and cheque
 *                  payee to STAFF only, and never any secret
 *                - createPaymentOrder / verifyPayment are staff-only, center-
 *                  scoped, and settle through the ledger — the charged amount is
 *                  always the invoice's own total, and verification can only ever
 *                  mark the invoice the order was created for
 *                - verifyPayment keeps its boolean contract (false on a bad
 *                  signature) because the web modal depends on it
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@enums';
import { PaymentResolver } from './payment.resolver';
import { PaymentSignatureError } from './payment-orders.service';
import { PaymentOrderPurpose } from '../graphql/enums/onboarding-payment.enums';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

const CENTER_A = 'center-a';
const CENTER_B = 'center-b';
const caller = (role: UserRole, centerId: string | null = null): any => ({ sub: `u-${role}`, email: 'x@y.test', role, centerId, sid: 's', typ: 'access' });
const SUPER = caller(UserRole.SUPER_ADMIN);
const MGR_A = caller(UserRole.CENTER_MANAGER, CENTER_A);
const MEMBER = caller(UserRole.MEMBER, CENTER_A);

function build(invoice: any = { id: 'inv-1', invoiceNumber: 'INV-1', totalAmount: '5000.00', amount: 4237.29, centerId: CENTER_A }) {
  const settings = {
    getRazorpayConfig: vi.fn(async () => ({ keyId: 'rzp_test_pub', keySecret: 'TOP-SECRET', webhookSecret: 'WH-SECRET', mode: 'test' })),
    getQrPaymentConfig: vi.fn(async () => ({ upiId: 'space@bank', imagePath: '/uploads/qr.png', payeeName: 'SpaceJam' })),
    getBankAccountConfig: vi.fn(async () => ({ accountName: 'SpaceJam Pvt Ltd', accountNumber: '123456789012', ifsc: 'HDFC0001234', bankName: 'HDFC Bank', branch: 'Madhapur' })),
    getChequeConfig: vi.fn(async () => ({ payeeName: 'SpaceJam Pvt Ltd', instructions: 'Drop at the front desk' })),
  };
  const orders = {
    createInvoiceOrder: vi.fn(async () => ({ providerOrderId: 'order_INV' })),
    createOrder: vi.fn(async () => ({ providerOrderId: 'order_GEN' })),
    findByProviderOrderId: vi.fn(async (id: string) => ({ providerOrderId: id, centerId: CENTER_A })),
    confirmCheckout: vi.fn(async () => ({ alreadySettled: false })),
  };
  const invoiceRepo = { findOne: vi.fn(async () => invoice) };
  return { resolver: new PaymentResolver(orders as any, settings as any, invoiceRepo as any), orders, settings, invoiceRepo };
}

describe('PaymentResolver', () => {
  let h: ReturnType<typeof build>;
  beforeEach(() => {
    h = build();
  });

  describe('access control metadata', () => {
    it('createPaymentOrder and verifyPayment are staff-only', () => {
      for (const method of ['createPaymentOrder', 'verifyPayment'] as const) {
        const target = (PaymentResolver.prototype as any)[method];
        expect(Reflect.getMetadata('roles', target)).toEqual([UserRole.SUPER_ADMIN, UserRole.CENTER_MANAGER]);
        expect(Reflect.getMetadata('__guards__', target)).toEqual(expect.arrayContaining([GqlAuthGuard, RolesGuard]));
      }
    });

    it('paymentConfig needs a signed-in user (the checkout UIs call it) but no staff role', () => {
      const target = (PaymentResolver.prototype as any).paymentConfig;
      expect(Reflect.getMetadata('__guards__', target)).toEqual([GqlAuthGuard]);
      expect(Reflect.getMetadata('roles', target)).toBeUndefined();
    });
  });

  describe('paymentConfig', () => {
    it('gives STAFF the Razorpay key id, UPI QR, bank account and cheque payee', async () => {
      const cfg = await h.resolver.paymentConfig(MGR_A);
      expect(cfg).toMatchObject({
        configured: true,
        keyId: 'rzp_test_pub',
        mode: 'test',
        qrConfigured: true,
        bankConfigured: true,
        bankAccountName: 'SpaceJam Pvt Ltd',
        bankAccountNumber: '123456789012',
        bankIfsc: 'HDFC0001234',
        bankName: 'HDFC Bank',
        bankBranch: 'Madhapur',
        chequeConfigured: true,
        chequePayeeName: 'SpaceJam Pvt Ltd',
        chequeInstructions: 'Drop at the front desk',
      });
    });

    it('hides the bank account and cheque details from non-staff users', async () => {
      const cfg = await h.resolver.paymentConfig(MEMBER);
      expect(cfg.configured).toBe(true);
      expect(cfg.keyId).toBe('rzp_test_pub'); // publishable — needed to open Checkout
      expect(cfg.qrUpiId).toBe('space@bank');
      expect(cfg.bankConfigured).toBe(false);
      expect(cfg.bankAccountNumber).toBeNull();
      expect(cfg.bankAccountName).toBeNull();
      expect(cfg.chequeConfigured).toBe(false);
      expect(cfg.chequePayeeName).toBeNull();
      expect(await h.resolver.paymentConfig(undefined)).toMatchObject({ bankConfigured: false, bankAccountNumber: null });
    });

    it('NEVER returns the key secret or webhook secret to anyone', async () => {
      for (const who of [SUPER, MGR_A, MEMBER, undefined]) {
        const serialized = JSON.stringify(await h.resolver.paymentConfig(who));
        expect(serialized).not.toContain('TOP-SECRET');
        expect(serialized).not.toContain('WH-SECRET');
      }
    });

    it('reports an unconfigured gateway as not configured', async () => {
      h.settings.getRazorpayConfig.mockResolvedValueOnce({ keyId: '', keySecret: '', webhookSecret: '', mode: '' } as any);
      expect(await h.resolver.paymentConfig(SUPER)).toMatchObject({ configured: false, keyId: null, mode: null });
    });
  });

  describe('createPaymentOrder', () => {
    it('charges the INVOICE total whatever amount the client sends', async () => {
      const id = await h.resolver.createPaymentOrder(1 /* tampered */, 'inv-1', MGR_A);
      expect(id).toBe('order_INV');
      expect(h.orders.createInvoiceOrder).toHaveBeenCalledWith(expect.objectContaining({ id: 'inv-1', totalAmount: '5000.00' }), MGR_A.sub);
      expect(h.orders.createOrder).not.toHaveBeenCalled();
    });

    it('404s on an unknown invoice', async () => {
      h.invoiceRepo.findOne.mockResolvedValueOnce(null);
      await expect(h.resolver.createPaymentOrder(5000, 'nope', SUPER)).rejects.toThrow(NotFoundException);
    });

    it('a center manager cannot create an order for another center\'s invoice', async () => {
      const other = build({ id: 'inv-9', totalAmount: '100.00', centerId: CENTER_B });
      await expect(other.resolver.createPaymentOrder(100, 'inv-9', MGR_A)).rejects.toThrow(ForbiddenException);
      expect(other.orders.createInvoiceOrder).not.toHaveBeenCalled();
      await expect(other.resolver.createPaymentOrder(100, 'inv-9', SUPER)).resolves.toBe('order_INV'); // super admin may
    });

    it('an amount-only order is recorded as GENERAL — bound to nothing, scoped to the caller\'s center', async () => {
      const id = await h.resolver.createPaymentOrder(2499.5, undefined, MGR_A);
      expect(id).toBe('order_GEN');
      expect(h.orders.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ purpose: PaymentOrderPurpose.GENERAL, amountPaise: 249_950, centerId: CENTER_A, createdById: MGR_A.sub }),
      );
    });
  });

  describe('verifyPayment', () => {
    const input = (over: Record<string, unknown> = {}): any => ({
      razorpayOrderId: 'order_INV',
      razorpayPaymentId: 'pay_1',
      razorpaySignature: 'sig',
      invoiceId: 'inv-1',
      ...over,
    });

    it('settles through the ledger bound to the invoice, and returns true', async () => {
      expect(await h.resolver.verifyPayment(input(), MGR_A)).toBe(true);
      expect(h.orders.confirmCheckout).toHaveBeenCalledWith({
        providerOrderId: 'order_INV',
        providerPaymentId: 'pay_1',
        signature: 'sig',
        bindTo: { invoiceId: 'inv-1' },
        actorId: MGR_A.sub,
      });
    });

    it('with no invoiceId, nothing is bound — the order\'s own purpose decides what is finalized', async () => {
      await h.resolver.verifyPayment(input({ invoiceId: undefined }), SUPER);
      expect(h.orders.confirmCheckout).toHaveBeenCalledWith(expect.objectContaining({ bindTo: undefined }));
    });

    it('returns false (not an error) for a bad signature — the web modal depends on this', async () => {
      h.orders.confirmCheckout.mockRejectedValueOnce(new PaymentSignatureError());
      expect(await h.resolver.verifyPayment(input(), SUPER)).toBe(false);
    });

    it('propagates every other failure (unknown order, mismatch, outage)', async () => {
      h.orders.confirmCheckout.mockRejectedValueOnce(new ForbiddenException('This payment belongs to a different invoice.'));
      await expect(h.resolver.verifyPayment(input(), SUPER)).rejects.toThrow(/different invoice/);
    });

    it('404s on an unknown order before touching the gateway', async () => {
      h.orders.findByProviderOrderId.mockResolvedValueOnce(null as any);
      await expect(h.resolver.verifyPayment(input(), SUPER)).rejects.toThrow(NotFoundException);
      expect(h.orders.confirmCheckout).not.toHaveBeenCalled();
    });

    it('a center manager cannot verify another center\'s order', async () => {
      h.orders.findByProviderOrderId.mockResolvedValueOnce({ providerOrderId: 'order_INV', centerId: CENTER_B } as any);
      await expect(h.resolver.verifyPayment(input(), MGR_A)).rejects.toThrow(ForbiddenException);
      expect(h.orders.confirmCheckout).not.toHaveBeenCalled();
    });
  });
});
