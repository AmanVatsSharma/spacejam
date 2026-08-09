/**
 * File:        apps/api/src/subscription/billing.spec.ts
 * Module:      API · Subscription · Tests
 * Purpose:     Pure unit tests for the M2 billing math (no entity imports, so
 *              they run despite the pre-existing entity-decorator enum-load
 *              bug — see spacejam-1cza). Covers amount computation, the four
 *              billing-cycle next-date rules, and month-end clamping.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { describe, it, expect } from 'vitest';
import { addMonths, computeNextBilling, computeAmount } from './billing';
import { BillingCycle } from '../graphql/types/user.type';

describe('computeAmount', () => {
  it('multiplies seatCount by unitPrice', () => {
    expect(computeAmount(5, 8000)).toBe(40000);
  });

  it('coerces decimal-string prices (as PG returns them)', () => {
    expect(computeAmount(3, '8000.00')).toBe(24000);
  });
});

describe('addMonths', () => {
  it('advances the month', () => {
    const out = addMonths(new Date('2026-01-15'), 1);
    expect(out.getMonth()).toBe(1); // Feb (0-indexed)
    expect(out.getDate()).toBe(15);
  });

  it('clamps Jan 31 + 1 month to Feb 28 (non-leap)', () => {
    const out = addMonths(new Date('2026-01-31'), 1);
    expect(out.getMonth()).toBe(1);
    expect(out.getDate()).toBe(28); // 2026 is not a leap year
  });

  it('handles quarter (3 months) advance', () => {
    const out = addMonths(new Date('2026-01-31'), 3);
    expect(out.getMonth()).toBe(3); // Apr
    expect(out.getDate()).toBe(30); // Apr has 30 days
  });
});

describe('computeNextBilling', () => {
  it('DAILY = +24h', () => {
    const start = new Date('2026-08-09T10:00:00Z');
    const next = computeNextBilling(start, BillingCycle.DAILY);
    expect(next.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
  });

  it('WEEKLY = +7d', () => {
    const start = new Date('2026-08-09T10:00:00Z');
    const next = computeNextBilling(start, BillingCycle.WEEKLY);
    expect(next.getTime() - start.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('MONTHLY advances exactly one calendar month', () => {
    const start = new Date('2026-08-09T00:00:00Z');
    const next = computeNextBilling(start, BillingCycle.MONTHLY);
    expect(next.getMonth()).toBe(8); // Sep
    expect(next.getDate()).toBe(9);
  });

  it('QUARTERLY advances three calendar months', () => {
    const start = new Date('2026-01-15T00:00:00Z');
    const next = computeNextBilling(start, BillingCycle.QUARTERLY);
    expect(next.getMonth()).toBe(3); // Apr
    expect(next.getDate()).toBe(15);
  });
});
