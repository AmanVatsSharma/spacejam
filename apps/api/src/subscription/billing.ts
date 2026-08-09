/**
 * File:        apps/api/src/subscription/billing.ts
 * Module:      API · Subscription · Billing helpers
 * Purpose:     Pure helpers for the M2 subscription billing math, kept free
 *              of entity imports so they can be unit-tested in isolation
 *              (the entity graph has a circular-import enum-load issue).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { BillingCycle } from '../graphql/types/user.type';

/** Add `months` to `date`, clamping the day to the target month's length. */
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const targetDay = d.getDate();
  d.setMonth(d.getMonth() + months, 1);
  const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(targetDay, maxDay));
  return d;
}

/**
 * Compute when the next billing period starts, given a cycle start and the
 * plan's billing cycle. DAILY/WEEKLY use fixed millisecond offsets;
 * MONTHLY/QUARTERLY use calendar arithmetic (so a Jan-31 start renews on the
 * 28th/29th of Feb, not Mar 3).
 */
export function computeNextBilling(start: Date, cycle: BillingCycle): Date {
  const DAY = 24 * 60 * 60 * 1000;
  switch (cycle) {
    case BillingCycle.DAILY:
      return new Date(start.getTime() + DAY);
    case BillingCycle.WEEKLY:
      return new Date(start.getTime() + 7 * DAY);
    case BillingCycle.QUARTERLY:
      return addMonths(start, 3);
    case BillingCycle.MONTHLY:
    default:
      return addMonths(start, 1);
  }
}

/** amount = seatCount * unitPrice. Coerces decimal-string prices from PG. */
export function computeAmount(seatCount: number, unitPrice: number | string): number {
  return Number(unitPrice) * seatCount;
}
