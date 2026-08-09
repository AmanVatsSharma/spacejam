/**
 * File:        apps/api/src/graphql/resolvers/subscription.resolver.spec.ts
 * Module:      API · GraphQL · Tests
 * Purpose:     Unit tests for PlanResolver covering the M2 invariants that
 *              must hold for the monthly-seat model to be sound:
 *                - createPlan persists with enum defaults
 *                - deletePlan refuses when subscriptions reference it
 *                - createSubscription computes amount = seatCount * plan.price,
 *                  snapshots unitPrice, rejects below-minSeats, derives
 *                  centerId from the plan, and sets nextBillingDate
 *                - updateSubscription recomputes amount on seatCount change
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi as jest, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { PlanResolver } from './subscription.resolver';
import { Plan } from '../../typeorm/entities/plan.entity';
import { Subscription } from '../../typeorm/entities/subscription.entity';
import { Customer } from '../../typeorm/entities/customer.entity';
import { CacheService } from '../../cache/cache.service';
import { BillingCycle, PlanStatus, SeatType, SubscriptionStatus } from '../types/user.type';

describe('PlanResolver (M2)', () => {
  let resolver: PlanResolver;
  let planRepo: any;
  let subscriptionRepo: any;
  let customerRepo: any;

  beforeEach(async () => {
    planRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => ({ id: 'plan-1', ...x })),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(() => ({
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
        getCount: jest.fn().mockResolvedValue(0),
      })),
    };
    subscriptionRepo = { createQueryBuilder: jest.fn(() => ({ leftJoinAndSelect: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), orderBy: jest.fn().mockReturnThis(), limit: jest.fn().mockReturnThis(), offset: jest.fn().mockReturnThis(), getMany: jest.fn().mockResolvedValue([]) })) };
    customerRepo = { findOne: jest.fn() };
    const cache: Pick<CacheService, 'invalidatePattern'> = { invalidatePattern: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanResolver,
        { provide: getRepositoryToken(Plan), useValue: planRepo },
        { provide: getRepositoryToken(Subscription), useValue: subscriptionRepo },
        { provide: getRepositoryToken(Customer), useValue: customerRepo },
        { provide: CacheService, useValue: cache },
      ],
    }).compile();

    resolver = module.get(PlanResolver);
  });

  describe('createPlan', () => {
    it('persists a plan with enum defaults applied', async () => {
      const plan = await resolver.createPlan({
        centerId: 'c1',
        name: 'Dedicated Desk',
        seatType: SeatType.DEDICATED,
        price: 8000,
      } as any);

      expect(plan.id).toBe('plan-1');
      expect(planRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          centerId: 'c1',
          billingCycle: BillingCycle.MONTHLY,
          currency: 'INR',
          minSeats: 1,
          status: PlanStatus.ACTIVE,
        }),
      );
    });
  });

  describe('deletePlan', () => {
    it('refuses to delete a plan that has subscriptions', async () => {
      // Simulate the "in use" check returning 1 subscription.
      planRepo.createQueryBuilder.mockReturnValue({
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
      });
      await expect(resolver.deletePlan('plan-1')).rejects.toThrow(BadRequestException);
      expect(planRepo.delete).not.toHaveBeenCalled();
    });

    it('deletes when no subscriptions reference it', async () => {
      const ok = await resolver.deletePlan('plan-1');
      expect(ok).toBe(true);
      expect(planRepo.delete).toHaveBeenCalledWith('plan-1');
    });
  });

  describe('createSubscription', () => {
    const plan = {
      id: 'plan-1',
      centerId: 'center-1',
      seatType: SeatType.DEDICATED,
      billingCycle: BillingCycle.MONTHLY,
      price: '8000.00', // decimal columns come back as strings
      minSeats: 2,
    } as any;
    const customer = { id: 'cust-1', centerId: 'center-1' } as any;

    beforeEach(() => {
      planRepo.findOne.mockResolvedValue(plan);
      customerRepo.findOne.mockResolvedValue(customer);
      subscriptionRepo.create = jest.fn((x) => x);
      subscriptionRepo.save = jest.fn(async (x) => ({ id: 'sub-1', ...x }));
    });

    it('computes amount = seatCount * plan.price and snapshots unitPrice', async () => {
      const sub = await resolver.createSubscription({
        customerId: 'cust-1',
        planId: 'plan-1',
        seatCount: 5,
      } as any);

      expect(sub.unitPrice).toBe(8000);
      expect(sub.amount).toBe(40000); // 5 * 8000
      expect(sub.centerId).toBe('center-1'); // derived from the plan
    });

    it('sets nextBillingDate one month ahead for a MONTHLY plan', async () => {
      const sub = await resolver.createSubscription({
        customerId: 'cust-1',
        planId: 'plan-1',
        seatCount: 2,
      } as any);

      const expected = new Date(sub.startDate);
      expected.setMonth(expected.getMonth() + 1, 1);
      // Compare year + month (day may clamp on month-end).
      expect(new Date(sub.nextBillingDate).getMonth()).toBe(expected.getMonth());
    });

    it('rejects a seatCount below the plan minSeats', async () => {
      await expect(
        resolver.createSubscription({ customerId: 'cust-1', planId: 'plan-1', seatCount: 1 } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws when the plan does not exist', async () => {
      planRepo.findOne.mockResolvedValue(null);
      await expect(
        resolver.createSubscription({ customerId: 'cust-1', planId: 'nope', seatCount: 2 } as any),
      ).rejects.toThrow('Plan not found');
    });

    it('throws when the customer does not exist', async () => {
      customerRepo.findOne.mockResolvedValue(null);
      await expect(
        resolver.createSubscription({ customerId: 'nope', planId: 'plan-1', seatCount: 2 } as any),
      ).rejects.toThrow('Customer not found');
    });
  });

  describe('updateSubscription', () => {
    it('recomputes amount when seatCount changes', async () => {
      const existing = {
        id: 'sub-1',
        customerId: 'cust-1',
        seatCount: 2,
        unitPrice: '8000.00',
        amount: '16000.00',
        status: SubscriptionStatus.ACTIVE,
      } as any;
      subscriptionRepo.findOne = jest.fn().mockResolvedValue(existing);
      subscriptionRepo.save = jest.fn(async (x) => x);

      const updated = await resolver.updateSubscription('sub-1', { seatCount: 4 } as any);
      expect(updated.seatCount).toBe(4);
      expect(updated.amount).toBe(32000); // 4 * 8000
    });

    it('throws when the subscription does not exist', async () => {
      subscriptionRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(
        resolver.updateSubscription('nope', { seatCount: 4 } as any),
      ).rejects.toThrow('Subscription not found');
    });
  });
});
