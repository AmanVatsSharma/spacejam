/**
 * File:        apps/api/src/crm/onboarding-filters.spec.ts
 * Module:      API · CRM · Onboarding · Filters · Tests
 * Purpose:     The `onboardings` query filter. The important rule: "still needs
 *              money" is decided HERE, on the server, over the whole table — a
 *              client that fetched the newest N onboardings and filtered them
 *              itself silently lost old pending cheques once N newer ones existed.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-03
 */
import { describe, it, expect } from 'vitest';
import { ILike, In, IsNull } from 'typeorm';
import { OnboardingStatus } from '@enums';
import { OnboardingPaymentStatus } from '../graphql/enums/onboarding-payment.enums';
import { buildOnboardingWhere, OPEN_PAYMENT_STATES } from './onboarding-filters';

describe('buildOnboardingWhere', () => {
  it('hides cancelled applications unless asked for', () => {
    expect(buildOnboardingWhere({}, undefined)).toEqual({ cancelledAt: IsNull() });
    expect(buildOnboardingWhere(undefined, undefined)).toEqual({ cancelledAt: IsNull() });
    expect(buildOnboardingWhere({ includeCancelled: true }, undefined)).toEqual({});
  });

  it('pins a center manager to their center whatever the client sends', () => {
    expect(buildOnboardingWhere({ centerId: 'other' }, 'mine')).toEqual({ centerId: 'mine', cancelledAt: IsNull() });
    expect(buildOnboardingWhere({ centerId: 'asked' }, undefined)).toEqual({ centerId: 'asked', cancelledAt: IsNull() });
  });

  it('passes status, payment status and assignee straight through', () => {
    expect(
      buildOnboardingWhere(
        { status: OnboardingStatus.PENDING, paymentStatus: OnboardingPaymentStatus.AWAITING_CLEARANCE, assignedToId: 'u1' },
        undefined,
      ),
    ).toEqual({
      status: OnboardingStatus.PENDING,
      paymentStatus: OnboardingPaymentStatus.AWAITING_CLEARANCE,
      assignedToId: 'u1',
      cancelledAt: IsNull(),
    });
  });

  it('search matches company, contact name or email and keeps every other condition on each branch', () => {
    const where = buildOnboardingWhere({ search: ' acme ', centerId: 'c1' }, undefined) as any[];
    expect(where).toHaveLength(3);
    expect(where.map((w) => Object.keys(w).find((k) => k.startsWith('company') || k.startsWith('contact')))).toEqual([
      'companyName',
      'contactName',
      'contactEmail',
    ]);
    for (const w of where) {
      expect(w).toMatchObject({ centerId: 'c1', cancelledAt: IsNull() });
    }
    expect(where[0].companyName).toEqual(ILike('%acme%'));
  });

  it('escapes LIKE wildcards in the search term', () => {
    const where = buildOnboardingWhere({ search: '50%_off' }, undefined) as any[];
    expect(where[0].companyName).toEqual(ILike('%50\\%\\_off%'));
  });

  describe('needsPayment', () => {
    it('keeps only applications with no client yet and an open payment state', () => {
      expect(OPEN_PAYMENT_STATES).toEqual([
        OnboardingPaymentStatus.PENDING,
        OnboardingPaymentStatus.AWAITING_CLEARANCE,
        OnboardingPaymentStatus.FAILED,
      ]);
      expect(buildOnboardingWhere({ needsPayment: true }, undefined)).toEqual({
        customerId: IsNull(),
        paymentStatus: In(OPEN_PAYMENT_STATES),
        cancelledAt: IsNull(),
      });
    });

    it('is off by default and when false', () => {
      expect(buildOnboardingWhere({ needsPayment: false }, undefined)).toEqual({ cancelledAt: IsNull() });
    });

    it('can be narrowed by an explicit open payment status', () => {
      expect(
        buildOnboardingWhere({ needsPayment: true, paymentStatus: OnboardingPaymentStatus.FAILED }, undefined),
      ).toEqual({
        customerId: IsNull(),
        paymentStatus: In([OnboardingPaymentStatus.FAILED]),
        cancelledAt: IsNull(),
      });
    });

    it('matches nothing when the explicit payment status is not an open one', () => {
      expect(
        buildOnboardingWhere({ needsPayment: true, paymentStatus: OnboardingPaymentStatus.PAID }, undefined),
      ).toBeNull();
    });

    it('combines with search, scope and the other filters on every branch', () => {
      const where = buildOnboardingWhere({ needsPayment: true, search: 'acme' }, 'mine') as any[];
      expect(where).toHaveLength(3);
      for (const w of where) {
        expect(w).toMatchObject({
          centerId: 'mine',
          customerId: IsNull(),
          paymentStatus: In(OPEN_PAYMENT_STATES),
          cancelledAt: IsNull(),
        });
      }
    });
  });
});
