/**
 * File:        apps/api/src/crm/onboarding-application.spec.ts
 * Module:      API · CRM · Onboarding · Tests
 * Purpose:     Pure-function tests for the onboarding application rules:
 *              normalization of the wizard payload and validation of each
 *              payment method's details (cheque window, transfer date, UTR…).
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { describe, it, expect } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { PaymentFrequency } from '@enums';
import { OnboardingPaymentMethod } from '../graphql/enums/onboarding-payment.enums';
import {
  appendNote,
  CYCLE_TO_FREQUENCY,
  escapeLike,
  normalizeApplication,
  normalizePayment,
  parseIsoDate,
  round2,
} from './onboarding-application';

const NOW = new Date('2026-10-02T09:30:00.000Z');

const base = (over: Record<string, unknown> = {}): any => ({
  idempotencyKey: 'key-12345678',
  centerId: 'c1',
  contactName: '  Asha Rao ',
  contactEmail: 'ASHA@Example.COM ',
  contactPhone: '+91 98765 43210',
  companyName: 'Acme Pvt Ltd',
  planType: 'Hot Desk',
  billingCycle: 'Monthly',
  depositAmount: 50000,
  ...over,
});

describe('normalizeApplication', () => {
  it('trims, lower-cases the email and fills sensible defaults', () => {
    const app = normalizeApplication(base(), NOW);
    expect(app.contact.name).toBe('Asha Rao');
    expect(app.contact.email).toBe('asha@example.com');
    expect(app.plan).toMatchObject({
      planType: 'Hot Desk',
      billingCycle: 'Monthly',
      seatType: 'HOT_DESK', // Hot Desk plan → hot-desk seats
      seatCount: 1, // at least one seat
      durationMonths: 1, // one billing cycle
      startDate: '2026-10-02',
    });
    expect(app.provisionLogin).toBe(true);
    expect(app.finance.depositAmount).toBe(50000);
  });

  it('maps every billing cycle to a valid contract frequency — "Annually" must become Yearly', () => {
    expect(CYCLE_TO_FREQUENCY.Monthly).toBe(PaymentFrequency.MONTHLY);
    expect(CYCLE_TO_FREQUENCY.Quarterly).toBe(PaymentFrequency.QUARTERLY);
    // The old browser saga sent "Annually", which is not a contracts.paymentFrequency
    // value ("Yearly" is) — so annual contracts silently failed to save.
    expect(CYCLE_TO_FREQUENCY.Annually).toBe(PaymentFrequency.YEARLY);
    expect(normalizeApplication(base({ billingCycle: 'Annually' }), NOW).plan.durationMonths).toBe(12);
    expect(normalizeApplication(base({ billingCycle: 'Quarterly' }), NOW).plan.durationMonths).toBe(3);
  });

  it('rejects an unknown billing cycle', () => {
    expect(() => normalizeApplication(base({ billingCycle: 'Weekly' }), NOW)).toThrow(BadRequestException);
  });

  it('rounds the deposit to 2 decimals', () => {
    expect(normalizeApplication(base({ depositAmount: 1000.005 }), NOW).finance.depositAmount).toBe(1000.01);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it('rejects a future date of birth and an invalid calendar date', () => {
    expect(() => normalizeApplication(base({ dob: '2027-01-01' }), NOW)).toThrow(/future/);
    expect(() => normalizeApplication(base({ dob: '2026-02-31' }), NOW)).toThrow(/not a valid date/);
    expect(normalizeApplication(base({ dob: '1990-05-17' }), NOW).contact.dob).toBe('1990-05-17');
  });

  it('rejects a phone number with too few digits', () => {
    expect(() => normalizeApplication(base({ contactPhone: '12345' }), NOW)).toThrow(/phone/i);
  });

  it('seat count is at least the number of team rows; seat-only rows reserve unnamed seats', () => {
    const app = normalizeApplication(
      base({
        seatCount: 2,
        members: [
          { name: 'A', seatName: 'A-1' },
          { name: 'B' },
          { seatName: 'A-3' }, // seat-only row
          {}, // empty row is dropped
        ],
      }),
      NOW,
    );
    expect(app.members).toHaveLength(3);
    expect(app.plan.seatCount).toBe(3); // max(requested 2, rows 3)
  });

  it('rejects the same seat assigned to two people (case-insensitive)', () => {
    expect(() =>
      normalizeApplication(
        base({ members: [{ name: 'A', seatName: 'A-1' }, { name: 'B', seatName: 'a-1' }] }),
        NOW,
      ),
    ).toThrow(/same seat/);
  });

  it('only accepts a start date within the last 30 days or next year', () => {
    expect(() => normalizeApplication(base({ startDate: '2025-01-01' }), NOW)).toThrow(/Start date/);
    expect(normalizeApplication(base({ startDate: '2026-11-01' }), NOW).plan.startDate).toBe('2026-11-01');
  });

  it('normalizes the refund account and de-duplicates documents', () => {
    const app = normalizeApplication(
      base({
        refundAccount: { holderName: ' A B ', accountNumber: '1234 5678 9012', ifsc: 'hdfc0001234', bankName: 'HDFC Bank' },
        documents: [
          { name: 'PAN', documentType: 'id_proof', fileUrl: '/uploads/a.png' },
          { name: 'PAN again', documentType: 'id_proof', fileUrl: '/uploads/a.png' },
        ],
      }),
      NOW,
    );
    expect(app.finance.refundAccount).toEqual({
      holderName: 'A B',
      accountNumber: '123456789012',
      ifsc: 'HDFC0001234',
      bankName: 'HDFC Bank',
    });
    expect(app.documents).toHaveLength(1);
  });
});

describe('normalizePayment', () => {
  it('returns null when there is nothing to collect (zero deposit) and ignores any method', () => {
    expect(normalizePayment(undefined, 0, NOW)).toBeNull();
    expect(normalizePayment({ method: OnboardingPaymentMethod.CHEQUE } as any, 0, NOW)).toBeNull();
  });

  it('requires a payment method when there is an amount to collect', () => {
    expect(() => normalizePayment(undefined, 1000, NOW)).toThrow(/how the security deposit is being paid/);
  });

  it('Razorpay needs no extra details', () => {
    expect(normalizePayment({ method: OnboardingPaymentMethod.RAZORPAY } as any, 1000, NOW)).toEqual({
      method: OnboardingPaymentMethod.RAZORPAY,
    });
  });

  describe('cheque', () => {
    const cheque = (chequeDate: string) =>
      ({ method: OnboardingPaymentMethod.CHEQUE, cheque: { chequeNumber: '000123', bankName: ' HDFC Bank ', chequeDate } }) as any;

    it('accepts a current cheque and trims the bank', () => {
      const p = normalizePayment(cheque('2026-10-01'), 5000, NOW)!;
      expect(p.cheque).toEqual({ chequeNumber: '000123', bankName: 'HDFC Bank', chequeDate: '2026-10-01' });
    });

    it('accepts a post-dated cheque up to 90 days ahead, rejects further', () => {
      expect(normalizePayment(cheque('2026-12-30'), 5000, NOW)).not.toBeNull(); // +89d
      expect(() => normalizePayment(cheque('2027-01-15'), 5000, NOW)).toThrow(/post-dated/);
    });

    it('rejects a stale cheque (> 90 days old)', () => {
      expect(() => normalizePayment(cheque('2026-06-01'), 5000, NOW)).toThrow(/stale/);
    });

    it('requires the cheque details', () => {
      expect(() => normalizePayment({ method: OnboardingPaymentMethod.CHEQUE } as any, 5000, NOW)).toThrow(/cheque number/i);
    });
  });

  describe('bank transfer', () => {
    const transfer = (over: Record<string, unknown> = {}) =>
      ({
        method: OnboardingPaymentMethod.BANK_TRANSFER,
        bankTransfer: { utr: 'hdfcr52026100212345', transferDate: '2026-10-02', ...over },
      }) as any;

    it('upper-cases the UTR and keeps the date', () => {
      const p = normalizePayment(transfer(), 5000, NOW)!;
      expect(p.bankTransfer?.utr).toBe('HDFCR52026100212345');
      expect(p.bankTransfer?.transferDate).toBe('2026-10-02');
    });

    it('tolerates "tomorrow" (timezone slack) but not further into the future', () => {
      expect(normalizePayment(transfer({ transferDate: '2026-10-03' }), 5000, NOW)).not.toBeNull();
      expect(() => normalizePayment(transfer({ transferDate: '2026-10-09' }), 5000, NOW)).toThrow(/future/);
    });

    it('rejects a transfer older than 90 days', () => {
      expect(() => normalizePayment(transfer({ transferDate: '2026-05-01' }), 5000, NOW)).toThrow(/older than 90 days/);
    });

    it('requires the UTR and date', () => {
      expect(() => normalizePayment({ method: OnboardingPaymentMethod.BANK_TRANSFER } as any, 5000, NOW)).toThrow(/UTR/);
    });
  });
});

describe('small helpers', () => {
  it('parseIsoDate rejects calendar rollovers', () => {
    expect(parseIsoDate('2026-02-30')).toBeNull();
    expect(parseIsoDate('2026-02-28')?.toISOString()).toBe('2026-02-28T00:00:00.000Z');
    expect(parseIsoDate('not-a-date')).toBeNull();
  });

  it('escapeLike makes an email match literally (underscore and percent are wildcards in ILIKE)', () => {
    expect(escapeLike('john_doe@x.com')).toBe('john\\_doe@x.com');
    expect(escapeLike('50%')).toBe('50\\%');
  });

  it('appendNote stamps the date and keeps earlier notes', () => {
    expect(appendNote(null, 'first', NOW)).toBe('[2026-10-02] first');
    expect(appendNote('earlier', 'second', NOW)).toBe('earlier\n[2026-10-02] second');
  });
});
