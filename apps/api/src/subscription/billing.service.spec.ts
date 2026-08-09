/**
 * File:        apps/api/src/subscription/billing.service.spec.ts
 * Module:      API · Subscription · Tests
 * Purpose:     Unit tests for BillingService covering the M3 fan-out invariants:
 *                - idempotency: re-running a processed cycle is a no-op
 *                - cancelled/expired subscriptions refuse billing
 *                - the transaction path allocates seats, creates bookings with
 *                  planId + subscriptionId, generates an invoice, advances
 *                  nextBillingDate
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, vi as jest, beforeEach } from 'vitest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BillingService } from './billing.service';
import { Subscription } from '../typeorm/entities/subscription.entity';
import { Booking } from '../typeorm/entities/booking.entity';
import { Seat } from '../typeorm/entities/seat.entity';
import { CustomerEmployee } from '../typeorm/entities/customer-employee.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { SubscriptionStatus } from '../graphql/types/user.type';

// Fake EntityManager that records writes and returns canned reads.
function buildTx(opts: {
  seats?: any[];
  employees?: any[];
  savedBookings?: any[];
  savedInvoices?: any[];
}) {
  const savedBookings: any[] = [];
  const savedInvoices: any[] = [];
  const seatUpdates: any[] = [];
  const employeeUpdates: any[] = [];
  const subSaves: any[] = [];

  const repoFor = (target: any) => ({
    find: jest.fn(async () => {
      if (target === Seat) return opts.seats ?? [];
      if (target === CustomerEmployee) return opts.employees ?? [];
      return [];
    }),
    create: jest.fn((x) => x),
    save: jest.fn(async (x: any) => {
      if (target === Booking) savedBookings.push(x);
      if (target === Invoice) savedInvoices.push(x);
      if (target === Subscription) subSaves.push(x);
      return Array.isArray(x) ? x : { ...x, id: x.id ?? 'saved' };
    }),
    update: jest.fn(async (id: string, patch: any) => {
      if (target === Seat) seatUpdates.push({ id, patch });
      if (target === CustomerEmployee) employeeUpdates.push({ id, patch });
    }),
  });

  const tx: any = {
    getRepository: jest.fn((target: any) => repoFor(target)),
  };

  return { tx, savedBookings, savedInvoices, seatUpdates, employeeUpdates, subSaves };
}

describe('BillingService (M3)', () => {
  let service: BillingService;
  let subRepo: any;
  let bookingRepo: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dataSource: any;

  const baseSub = {
    id: 'sub-1',
    customerId: 'cust-1',
    planId: 'plan-1',
    centerId: 'center-1',
    seatCount: 2,
    unitPrice: '8000.00',
    amount: '16000.00',
    status: SubscriptionStatus.ACTIVE,
    startDate: new Date('2026-08-01'),
    nextBillingDate: new Date('2026-09-01'),
    plan: {
      id: 'plan-1',
      centerId: 'center-1',
      name: 'Dedicated Desk',
      seatType: 'DEDICATED',
      billingCycle: 'MONTHLY',
      price: '8000.00',
      minSeats: 1,
    },
    customer: { id: 'cust-1', name: 'Acme', email: 'acme@test', centerId: 'center-1' },
  };

  beforeEach(async () => {
    subRepo = {
      findOne: jest.fn().mockResolvedValue(baseSub),
      find: jest.fn().mockResolvedValue([]),
    };
    bookingRepo = { count: jest.fn().mockResolvedValue(0), createQueryBuilder: jest.fn(() => ({ where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getCount: jest.fn().mockResolvedValue(0) })) };
    dataSource = { transaction: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: getRepositoryToken(Subscription), useValue: subRepo },
        { provide: getRepositoryToken(Booking), useValue: bookingRepo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get(BillingService);
  });

  it('refuses to bill a CANCELLED subscription', async () => {
    subRepo.findOne.mockResolvedValue({ ...baseSub, status: SubscriptionStatus.CANCELLED });
    await expect(service.processSubscription('sub-1')).rejects.toThrow(BadRequestException);
  });

  it('refuses to bill an EXPIRED subscription', async () => {
    subRepo.findOne.mockResolvedValue({ ...baseSub, status: SubscriptionStatus.EXPIRED });
    await expect(service.processSubscription('sub-1')).rejects.toThrow(BadRequestException);
  });

  it('skips (idempotent) when the cycle already has bookings in-window', async () => {
    bookingRepo.count.mockResolvedValue(1); // has bookings
    bookingRepo.createQueryBuilder.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(3), // 3 in this exact window
    });
    const result = await service.processSubscription('sub-1');
    expect(result.skipped).toBe(true);
    expect(result.bookingsCreated).toBe(0);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('processes a fresh cycle: allocates seats, creates bookings + invoice, advances billing', async () => {
    const { tx, savedBookings, savedInvoices, seatUpdates, subSaves } = buildTx({
      seats: [
        { id: 'seat-1', status: 'AVAILABLE', centerId: 'center-1', seatType: 'DEDICATED' },
        { id: 'seat-2', status: 'AVAILABLE', centerId: 'center-1', seatType: 'DEDICATED' },
      ],
      employees: [
        { id: 'emp-1', customerId: 'cust-1', seatId: null, userId: 'u-1' },
        { id: 'emp-2', customerId: 'cust-1', seatId: null, userId: 'u-2' },
      ],
    });
    dataSource.transaction.mockImplementation(async (cb: any) => cb(tx));

    const result = await service.processSubscription('sub-1');

    // Two seats reserved.
    expect(seatUpdates.length).toBe(2);
    expect(seatUpdates[0].patch.status).toBe('RESERVED');

    // Two bookings created, each carrying planId + subscriptionId + CONFIRMED.
    expect(savedBookings.length).toBe(2);
    expect(savedBookings[0].planId).toBe('plan-1');
    expect(savedBookings[0].subscriptionId).toBe('sub-1');
    expect(savedBookings[0].status).toBe('CONFIRMED');
    expect(savedBookings[0].customerId).toBe('cust-1');

    // One invoice generated for the full amount.
    expect(savedInvoices.length).toBe(1);
    expect(Number(savedInvoices[0].amount)).toBe(16000);
    expect(Number(savedInvoices[0].totalAmount)).toBe(16000);
    expect(savedInvoices[0].customerId).toBe('cust-1');

    // Subscription advanced: nextBillingDate moved + startDate rolled forward.
    // Note: the service mutates the subscription in place, so capture the
    // original nextBillingDate before asserting.
    const originalNextBilling = new Date('2026-09-01').getTime();
    expect(subSaves.length).toBe(1);
    expect(subSaves[0].nextBillingDate.getTime()).toBeGreaterThan(originalNextBilling);
    expect(subSaves[0].startDate.getTime()).toBe(originalNextBilling);

    expect(result.skipped).toBe(false);
    expect(result.bookingsCreated).toBe(2);
    expect(result.seatsAllocated).toBe(2);
    expect(result.amount).toBe(16000);
  });
});
