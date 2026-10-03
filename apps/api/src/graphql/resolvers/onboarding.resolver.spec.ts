/**
 * File:        apps/api/src/graphql/resolvers/onboarding.resolver.spec.ts
 * Module:      API · Onboarding Resolver Tests
 * Purpose:     Tests for the hardened OnboardingResolver, run against an
 *              in-memory database (see testing/fake-datasource.ts):
 *
 *                - the class is staff-only (SUPER_ADMIN, CENTER_MANAGER) behind
 *                  the auth + roles guards
 *                - queries are center-scoped: a CENTER_MANAGER never sees another
 *                  center's onboardings, whatever centerId the client sends;
 *                  cancelled ones are hidden unless asked for; page size capped
 *                - the status machine: an onboarding can only be COMPLETED once
 *                  its client exists AND payment is settled — it used to be one
 *                  call away from any state, by any signed-in user
 *                - centerId can't be edited (it would move a record between
 *                  centers); delete is refused once money or a client exists
 *                - the payment-lifecycle mutations delegate to OnboardingService
 *
 *              (The earlier version of this file asserted the unguarded
 *              behaviour — e.g. completeOnboarding jumping straight from PENDING.)
 *
 * Author:      Claude Fable 5.1 (original) · Claude Sonnet 5.5 (rewrite for the hardened resolver)
 * Last-updated: 2026-10-02
 */
import 'reflect-metadata';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OnboardingStatus, UserRole } from '@enums';
import { OnboardingResolver } from './onboarding.resolver';
import { FakeDb } from '../../testing/fake-datasource';
import { Onboarding } from '../../typeorm/entities/onboarding.entity';
import { OnboardingPaymentStatus } from '../enums/onboarding-payment.enums';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';

const CENTER_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const CENTER_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const user = (role: UserRole, centerId: string | null = null): any => ({
  sub: `u-${role}`,
  email: 'x@y.test',
  role,
  centerId,
  sid: 's',
  typ: 'access',
});
const SUPER = user(UserRole.SUPER_ADMIN);
const MGR_A = user(UserRole.CENTER_MANAGER, CENTER_A);

function build() {
  const db = new FakeDb().onInsert(Onboarding, (r) => {
    r.status ??= OnboardingStatus.PENDING;
    r.paymentStatus ??= OnboardingPaymentStatus.NOT_REQUIRED;
  });
  const cache = { invalidatePattern: vi.fn(async () => {}), del: vi.fn(async () => {}) };
  const service = {
    submit: vi.fn(async () => 'submitted'),
    confirmOnlinePayment: vi.fn(async () => 'confirmed'),
    collectPayment: vi.fn(async () => 'collected'),
    confirmChequeCleared: vi.fn(async () => 'cleared'),
    markChequeBounced: vi.fn(async () => 'bounced'),
    cancel: vi.fn(async () => 'cancelled'),
  };
  const resolver = new OnboardingResolver(cache as any, db.getRepository(Onboarding) as any, service as any);
  return { db, resolver, cache, service };
}

const row = (over: Record<string, unknown> = {}) => ({
  id: `ob-${Math.random().toString(36).slice(2, 8)}`,
  status: OnboardingStatus.PENDING,
  paymentStatus: OnboardingPaymentStatus.NOT_REQUIRED,
  centerId: CENTER_A,
  companyName: 'Acme',
  contactName: 'Asha',
  contactEmail: 'asha@acme.test',
  cancelledAt: null,
  customerId: null,
  ...over,
});

describe('OnboardingResolver', () => {
  let h: ReturnType<typeof build>;
  beforeEach(() => {
    h = build();
  });

  // ── access control ────────────────────────────────────────────────────
  describe('access control', () => {
    it('is staff-only: SUPER_ADMIN and CENTER_MANAGER behind GqlAuthGuard + RolesGuard', () => {
      expect(Reflect.getMetadata('roles', OnboardingResolver)).toEqual([UserRole.SUPER_ADMIN, UserRole.CENTER_MANAGER]);
      const guards: any[] = Reflect.getMetadata('__guards__', OnboardingResolver);
      expect(guards).toEqual(expect.arrayContaining([GqlAuthGuard, RolesGuard]));
    });
  });

  // ── queries ───────────────────────────────────────────────────────────
  describe('onboardings()', () => {
    beforeEach(() => {
      h.db.seed(Onboarding, [
        row({ id: 'a1', centerId: CENTER_A, companyName: 'Acme' }),
        row({ id: 'a2', centerId: CENTER_A, companyName: 'Globex', paymentStatus: OnboardingPaymentStatus.AWAITING_CLEARANCE }),
        row({ id: 'a3', centerId: CENTER_A, companyName: 'Hidden Co', cancelledAt: new Date() }),
        row({ id: 'b1', centerId: CENTER_B, companyName: 'Initech' }),
      ]);
    });
    const ids = (list: any[]) => list.map((r) => r.id).sort();

    it('a center manager only ever sees their own center — a client-supplied centerId is ignored', async () => {
      expect(ids(await h.resolver.onboardings({ centerId: CENTER_B } as any, MGR_A))).toEqual(['a1', 'a2']);
      expect(ids(await h.resolver.onboardings(undefined, MGR_A))).toEqual(['a1', 'a2']);
    });

    it('a super admin sees all centers, or can filter to one', async () => {
      expect(ids(await h.resolver.onboardings(undefined, SUPER))).toEqual(['a1', 'a2', 'b1']);
      expect(ids(await h.resolver.onboardings({ centerId: CENTER_B } as any, SUPER))).toEqual(['b1']);
    });

    it('hides cancelled applications unless includeCancelled is set', async () => {
      expect(ids(await h.resolver.onboardings({ includeCancelled: true } as any, SUPER))).toEqual(['a1', 'a2', 'a3', 'b1']);
    });

    it('filters by payment status (e.g. cheques waiting on the bank)', async () => {
      const list = await h.resolver.onboardings({ paymentStatus: OnboardingPaymentStatus.AWAITING_CLEARANCE } as any, SUPER);
      expect(ids(list)).toEqual(['a2']);
    });

    it('searches company, contact name and email case-insensitively and literally (no LIKE wildcards)', async () => {
      expect(ids(await h.resolver.onboardings({ search: 'globe' } as any, SUPER))).toEqual(['a2']);
      expect(ids(await h.resolver.onboardings({ search: 'ASHA@acme' } as any, SUPER))).toEqual(['a1', 'a2', 'b1']);
      // "%" must not match everything
      expect(await h.resolver.onboardings({ search: '%' } as any, SUPER)).toEqual([]);
    });

    it('caps the page size', async () => {
      const spy = vi.spyOn((h.resolver as any).onboardingRepo, 'find');
      await h.resolver.onboardings({ limit: 5_000_000 } as any, SUPER);
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ take: 200 }));
    });
  });

  describe('onboarding(id) / onboardingCount()', () => {
    beforeEach(() => {
      h.db.seed(Onboarding, [row({ id: 'a1', centerId: CENTER_A }), row({ id: 'b1', centerId: CENTER_B }), row({ id: 'a9', centerId: CENTER_A, cancelledAt: new Date() })]);
    });

    it('refuses to return another center\'s onboarding to a manager', async () => {
      expect((await h.resolver.onboarding('a1', MGR_A))?.id).toBe('a1');
      await expect(h.resolver.onboarding('b1', MGR_A)).rejects.toThrow(ForbiddenException);
      expect(await h.resolver.onboarding('nope', MGR_A)).toBeNull();
    });

    it('counts only non-cancelled onboardings, scoped to the manager\'s center', async () => {
      expect(await h.resolver.onboardingCount(undefined, SUPER)).toBe(2);
      expect(await h.resolver.onboardingCount(undefined, MGR_A)).toBe(1);
    });
  });

  // ── status machine ────────────────────────────────────────────────────
  describe('completing an onboarding', () => {
    it('refuses to complete one whose client does not exist yet (e.g. a cheque still clearing)', async () => {
      h.db.seed(Onboarding, [row({ id: 'chq', paymentStatus: OnboardingPaymentStatus.AWAITING_CLEARANCE })]);
      await expect(h.resolver.completeOnboarding('chq', SUPER)).rejects.toThrow(/cannot be completed yet/);
      expect(h.db.byId<any>(Onboarding, 'chq').status).toBe(OnboardingStatus.PENDING);
    });

    it('refuses when the client exists but the payment is not confirmed', async () => {
      h.db.seed(Onboarding, [row({ id: 'unpaid', customerId: 'cust-1', paymentStatus: OnboardingPaymentStatus.PENDING })]);
      await expect(h.resolver.completeOnboarding('unpaid', SUPER)).rejects.toThrow(BadRequestException);
    });

    it('completes once the client exists and the payment is settled (PAID or not required)', async () => {
      h.db.seed(Onboarding, [
        row({ id: 'paid', customerId: 'c1', paymentStatus: OnboardingPaymentStatus.PAID }),
        row({ id: 'free', customerId: 'c2', paymentStatus: OnboardingPaymentStatus.NOT_REQUIRED }),
      ]);
      const paid = await h.resolver.completeOnboarding('paid', SUPER);
      expect(paid.status).toBe(OnboardingStatus.COMPLETED);
      expect(paid.completedAt).toBeInstanceOf(Date);
      expect((await h.resolver.completeOnboarding('free', SUPER)).status).toBe(OnboardingStatus.COMPLETED);
    });

    it('is idempotent on an already-completed onboarding', async () => {
      const at = new Date('2026-01-01');
      h.db.seed(Onboarding, [row({ id: 'done', status: OnboardingStatus.COMPLETED, completedAt: at, customerId: 'c', paymentStatus: OnboardingPaymentStatus.PAID })]);
      const res = await h.resolver.completeOnboarding('done', SUPER);
      expect(res.completedAt).toEqual(at);
    });

    it('404s on an unknown id and 403s across centers', async () => {
      h.db.seed(Onboarding, [row({ id: 'b1', centerId: CENTER_B, customerId: 'c', paymentStatus: OnboardingPaymentStatus.PAID })]);
      await expect(h.resolver.completeOnboarding('missing', SUPER)).rejects.toThrow(NotFoundException);
      await expect(h.resolver.completeOnboarding('b1', MGR_A)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('advanceOnboardingStatus', () => {
    it('PENDING → IN_PROGRESS', async () => {
      h.db.seed(Onboarding, [row({ id: 'p' })]);
      expect((await h.resolver.advanceOnboardingStatus('p', SUPER)).status).toBe(OnboardingStatus.IN_PROGRESS);
    });

    it('IN_PROGRESS → COMPLETED only when settled; stamps completedAt', async () => {
      h.db.seed(Onboarding, [
        row({ id: 'ok', status: OnboardingStatus.IN_PROGRESS, customerId: 'c', paymentStatus: OnboardingPaymentStatus.NOT_REQUIRED }),
        row({ id: 'blocked', status: OnboardingStatus.IN_PROGRESS, customerId: null, paymentStatus: OnboardingPaymentStatus.PENDING }),
      ]);
      const ok = await h.resolver.advanceOnboardingStatus('ok', SUPER);
      expect(ok.status).toBe(OnboardingStatus.COMPLETED);
      expect(ok.completedAt).toBeInstanceOf(Date);
      await expect(h.resolver.advanceOnboardingStatus('blocked', SUPER)).rejects.toThrow(BadRequestException);
    });

    it('is a no-op once COMPLETED', async () => {
      h.db.seed(Onboarding, [row({ id: 'd', status: OnboardingStatus.COMPLETED, customerId: 'c' })]);
      expect((await h.resolver.advanceOnboardingStatus('d', SUPER)).status).toBe(OnboardingStatus.COMPLETED);
    });
  });

  describe('updateOnboarding', () => {
    it('updates ordinary fields but never moves a record to another center', async () => {
      h.db.seed(Onboarding, [row({ id: 'u1', centerId: CENTER_A })]);
      const res = await h.resolver.updateOnboarding('u1', { companyName: 'NewName', centerId: CENTER_B } as any, SUPER);
      expect(res.companyName).toBe('NewName');
      expect(res.centerId).toBe(CENTER_A);
    });

    it('cannot be used to force COMPLETED around the payment rules', async () => {
      h.db.seed(Onboarding, [row({ id: 'u2', paymentStatus: OnboardingPaymentStatus.AWAITING_CLEARANCE })]);
      await expect(h.resolver.updateOnboarding('u2', { status: OnboardingStatus.COMPLETED } as any, SUPER)).rejects.toThrow(BadRequestException);
      expect(h.db.byId<any>(Onboarding, 'u2').status).toBe(OnboardingStatus.PENDING);
    });

    it('is center-scoped', async () => {
      h.db.seed(Onboarding, [row({ id: 'ub', centerId: CENTER_B })]);
      await expect(h.resolver.updateOnboarding('ub', { notes: 'x' } as any, MGR_A)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createOnboarding (legacy)', () => {
    it('pins a center manager to their own center and defaults to PENDING', async () => {
      const saved = await h.resolver.createOnboarding({ companyName: 'X' } as any, MGR_A);
      expect(saved.centerId).toBe(CENTER_A);
      expect(saved.status).toBe(OnboardingStatus.PENDING);
    });

    it('refuses another center for a manager, and refuses creating one already COMPLETED', async () => {
      await expect(h.resolver.createOnboarding({ centerId: CENTER_B } as any, MGR_A)).rejects.toThrow(ForbiddenException);
      await expect(h.resolver.createOnboarding({ status: OnboardingStatus.COMPLETED } as any, SUPER)).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteOnboarding', () => {
    it('deletes an onboarding that never produced a client or took money', async () => {
      h.db.seed(Onboarding, [row({ id: 'del', paymentStatus: OnboardingPaymentStatus.FAILED })]);
      expect(await h.resolver.deleteOnboarding('del', SUPER)).toBe(true);
      expect(h.db.count(Onboarding)).toBe(0);
      expect(h.cache.invalidatePattern).toHaveBeenCalledWith('onboardings:*');
    });

    it('refuses once a client exists, money was taken, or a cheque is clearing — cancel instead', async () => {
      h.db.seed(Onboarding, [
        row({ id: 'client', customerId: 'c1' }),
        row({ id: 'paid', paymentStatus: OnboardingPaymentStatus.PAID }),
        row({ id: 'cheque', paymentStatus: OnboardingPaymentStatus.AWAITING_CLEARANCE }),
      ]);
      await expect(h.resolver.deleteOnboarding('client', SUPER)).rejects.toThrow(/cannot be deleted/);
      await expect(h.resolver.deleteOnboarding('paid', SUPER)).rejects.toThrow(/cannot be deleted/);
      await expect(h.resolver.deleteOnboarding('cheque', SUPER)).rejects.toThrow(/cancel the onboarding instead/);
      expect(h.db.count(Onboarding)).toBe(3);
    });

    it('404s when missing and is center-scoped', async () => {
      h.db.seed(Onboarding, [row({ id: 'bb', centerId: CENTER_B })]);
      await expect(h.resolver.deleteOnboarding('zzz', SUPER)).rejects.toThrow(NotFoundException);
      await expect(h.resolver.deleteOnboarding('bb', MGR_A)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── payment lifecycle delegates to the service ────────────────────────
  describe('payment lifecycle mutations', () => {
    it('submitOnboarding → service.submit(input, caller)', async () => {
      const input = { idempotencyKey: 'k' } as any;
      expect(await h.resolver.submitOnboarding(input, MGR_A)).toBe('submitted');
      expect(h.service.submit).toHaveBeenCalledWith(input, MGR_A);
    });

    it('confirmOnboardingPayment passes the Razorpay triple and the caller', async () => {
      await h.resolver.confirmOnboardingPayment(
        { onboardingId: 'o1', razorpayOrderId: 'order_1', razorpayPaymentId: 'pay_1', razorpaySignature: 'sig' } as any,
        MGR_A,
      );
      expect(h.service.confirmOnlinePayment).toHaveBeenCalledWith(
        { onboardingId: 'o1', razorpayOrderId: 'order_1', razorpayPaymentId: 'pay_1', razorpaySignature: 'sig' },
        MGR_A,
      );
    });

    it('collect / clear / bounce / cancel delegate with their arguments', async () => {
      const payment = { method: 'CHEQUE' } as any;
      await h.resolver.collectOnboardingPayment('o1', payment, MGR_A);
      expect(h.service.collectPayment).toHaveBeenCalledWith('o1', payment, MGR_A);

      await h.resolver.confirmChequeCleared('o1', '2026-10-01', 'ok', MGR_A);
      expect(h.service.confirmChequeCleared).toHaveBeenCalledWith('o1', { clearedOn: '2026-10-01', remarks: 'ok' }, MGR_A);

      await h.resolver.markChequeBounced('o1', 'NSF', MGR_A);
      expect(h.service.markChequeBounced).toHaveBeenCalledWith('o1', 'NSF', MGR_A);

      await h.resolver.cancelOnboarding('o1', 'changed mind', MGR_A);
      expect(h.service.cancel).toHaveBeenCalledWith('o1', 'changed mind', MGR_A);
    });
  });
});
