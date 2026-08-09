/**
 * File:        apps/api/src/subscription/billing.service.ts
 * Module:      API · Subscription · Billing Service
 * Purpose:     Fans an active Subscription out into the operational layer:
 *                1. allocates N available seats of the plan's seatType to the
 *                   customer's employees (CustomerEmployee.seatId),
 *                2. creates one monthly Booking per seat (Booking.planId +
 *                   subscriptionId set, status CONFIRMED),
 *                3. generates one Invoice for the cycle,
 *                4. advances subscription.nextBillingDate.
 *              Idempotent per cycle: re-running for the same window is a no-op.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, LessThan, EntityManager } from 'typeorm';

import { Subscription } from '../typeorm/entities/subscription.entity';
import { Plan } from '../typeorm/entities/plan.entity';
import { Customer } from '../typeorm/entities/customer.entity';
import { CustomerEmployee } from '../typeorm/entities/customer-employee.entity';
import { Seat } from '../typeorm/entities/seat.entity';
import { Booking } from '../typeorm/entities/booking.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import {
  BookingStatus,
  InvoiceStatus,
  SeatStatus,
  SubscriptionStatus,
} from '../graphql/types/user.type';
import { computeNextBilling } from './billing';

export interface BillingCycleResult {
  subscriptionId: string;
  customerId: string;
  invoiceId: string;
  bookingsCreated: number;
  seatsAllocated: number;
  cycleStart: Date;
  cycleEnd: Date;
  amount: number;
  skipped: boolean;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Process a single subscription's current billing cycle. Idempotent: if the
   * cycle window already has bookings for this subscription, returns skipped.
   */
  async processSubscription(subscriptionId: string): Promise<BillingCycleResult> {
    const sub = await this.subRepo.findOne({
      where: { id: subscriptionId },
      relations: ['plan', 'customer'],
    });
    if (!sub) throw new BadRequestException('Subscription not found');
    if (sub.status === SubscriptionStatus.CANCELLED || sub.status === SubscriptionStatus.EXPIRED) {
      throw new BadRequestException(`Subscription is ${sub.status}; cannot bill.`);
    }

    const cycleStart = sub.startDate;
    const cycleEnd = sub.nextBillingDate;

    // ── Idempotency / due-guard ───────────────────────────────────────────
    // A subscription's current cycle is only billable once it's due
    // (nextBillingDate <= now). This is what makes re-running safe: after a
    // cycle is processed, nextBillingDate advances a full period, so an
    // immediate re-run finds the cycle not-yet-due and skips. Combined with
    // the in-window booking check below, the same window can never be billed
    // twice.
    const now = new Date();
    const isDue = cycleEnd.getTime() <= now.getTime();

    const existing = await this.bookingRepo.count({
      where: { subscriptionId },
    });
    if (existing > 0) {
      // Bookings exist for this subscription — if any fall in this exact
      // window, the cycle was already processed.
      const inWindow = await this.bookingRepo
        .createQueryBuilder('b')
        .where('b."subscriptionId" = :subscriptionId', { subscriptionId })
        .andWhere('b."startDate" >= :cycleStart', { cycleStart })
        .andWhere('b."endDate" <= :cycleEnd', { cycleEnd })
        .getCount();
      if (inWindow > 0) {
        this.logger.log(`processSubscription ${subscriptionId}: cycle already processed (${inWindow} bookings), skipping.`);
        return {
          subscriptionId,
          customerId: sub.customerId,
          invoiceId: '',
          bookingsCreated: 0,
          seatsAllocated: 0,
          cycleStart,
          cycleEnd,
          amount: Number(sub.amount),
          skipped: true,
        };
      }
      // Bookings exist but none in this window AND the cycle isn't due yet →
      // the next period hasn't elapsed; don't bill it early.
      if (!isDue) {
        this.logger.log(
          `processSubscription ${subscriptionId}: next cycle not due until ${cycleEnd.toISOString()}, skipping.`,
        );
        return {
          subscriptionId,
          customerId: sub.customerId,
          invoiceId: '',
          bookingsCreated: 0,
          seatsAllocated: 0,
          cycleStart,
          cycleEnd,
          amount: Number(sub.amount),
          skipped: true,
        };
      }
    }

    return this.dataSource.transaction(async (tx) => {
      const plan = sub.plan;
      if (!plan) throw new BadRequestException('Plan not found for subscription');
      const customer = sub.customer;
      if (!customer) throw new BadRequestException('Customer not found for subscription');

      // ── 1. Allocate seats ──────────────────────────────────────────────
      const { seatsAllocated, assignedSeats } = await this.allocateSeats(tx, sub, plan);

      // ── 2. Create per-seat bookings ────────────────────────────────────
      const employees = await tx.getRepository(CustomerEmployee).find({
        where: { customerId: sub.customerId },
        order: { createdAt: 'ASC' },
      });
      const bookingsCreated = await this.createCycleBookings(
        tx,
        sub,
        plan,
        customer,
        assignedSeats,
        employees,
        cycleStart,
        cycleEnd,
      );

      // ── 3. Generate invoice ────────────────────────────────────────────
      const invoice = await this.generateInvoice(tx, sub, plan, customer, cycleStart, cycleEnd);

      // ── 4. Advance nextBillingDate ─────────────────────────────────────
      sub.nextBillingDate = computeNextBilling(cycleEnd, plan.billingCycle);
      // If a new window has been pushed out and startDate is in the past,
      // roll startDate forward so the next cycle window is contiguous.
      sub.startDate = cycleEnd;
      await tx.getRepository(Subscription).save(sub);

      this.logger.log(
        `processSubscription ${subscriptionId}: ${bookingsCreated} bookings, ${seatsAllocated} seats, invoice ${invoice.invoiceNumber}.`,
      );

      return {
        subscriptionId,
        customerId: sub.customerId,
        invoiceId: invoice.id,
        bookingsCreated,
        seatsAllocated,
        cycleStart,
        cycleEnd,
        amount: Number(sub.amount),
        skipped: false,
      } satisfies BillingCycleResult;
    });
  }

  /**
   * Process every ACTIVE subscription whose nextBillingDate is due (≤ now).
   * Returns one result per processed subscription.
   */
  async processDueSubscriptions(): Promise<BillingCycleResult[]> {
    const due = await this.subRepo.find({
      where: {
        status: SubscriptionStatus.ACTIVE,
        nextBillingDate: LessThan(new Date()),
      },
      relations: ['plan', 'customer'],
    });
    this.logger.log(`processDueSubscriptions: ${due.length} subscription(s) due.`);
    const results: BillingCycleResult[] = [];
    for (const sub of due) {
      try {
        results.push(await this.processSubscription(sub.id));
      } catch (err: any) {
        this.logger.warn(`processDueSubscriptions: failed for ${sub.id}: ${err?.message}`);
      }
    }
    return results;
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  /**
   * Find `seatCount` AVAILABLE seats of the plan's seatType in the center and
   * reserve them. Assigns each to an unseated employee. Returns the count of
   * seats actually allocated (may be < seatCount if inventory is short) plus
   * the seat rows so bookings can be created against them.
   */
  private async allocateSeats(
    tx: EntityManager,
    sub: Subscription,
    plan: Plan,
  ): Promise<{ seatsAllocated: number; assignedSeats: Seat[] }> {
    const seatRepo = tx.getRepository(Seat);
    const employeeRepo = tx.getRepository(CustomerEmployee);

    // Seats already reserved for this customer in this center (idempotent-ish:
    // reuse rather than over-allocating on re-runs).
    const alreadyAssigned = await seatRepo.find({
      where: { centerId: sub.centerId ?? plan.centerId, status: SeatStatus.RESERVED },
    });

    // Pull available seats of the matching type.
    const available = await seatRepo.find({
      where: {
        centerId: sub.centerId ?? plan.centerId,
        seatType: plan.seatType,
        status: SeatStatus.AVAILABLE,
        active: true,
      },
      order: { createdAt: 'ASC' },
      take: sub.seatCount,
    });

    const pool = [...alreadyAssigned, ...available].slice(0, sub.seatCount);

    // Unseated employees, oldest first.
    const unseated = await employeeRepo.find({
      where: { customerId: sub.customerId, seatId: null as any },
      order: { createdAt: 'ASC' },
      take: pool.length,
    });

    let allocated = 0;
    for (let i = 0; i < pool.length; i++) {
      const seat = pool[i];
      if (seat.status === SeatStatus.AVAILABLE) {
        await seatRepo.update(seat.id, { status: SeatStatus.RESERVED });
      }
      if (unseated[i]) {
        await employeeRepo.update(unseated[i].id, { seatId: seat.id, status: 'active' });
      }
      allocated++;
    }

    return { seatsAllocated: allocated, assignedSeats: pool };
  }

  private async createCycleBookings(
    tx: EntityManager,
    sub: Subscription,
    plan: Plan,
    customer: Customer,
    seats: Seat[],
    employees: CustomerEmployee[],
    cycleStart: Date,
    cycleEnd: Date,
  ): Promise<number> {
    const bookingRepo = tx.getRepository(Booking);
    // Map seatId → employee (for userId linkage) using the employees we have.
    const seatToEmployee = new Map<string, CustomerEmployee>();
    for (const emp of employees) {
      if (emp.seatId) seatToEmployee.set(emp.seatId, emp);
    }

    let count = 0;
    for (const seat of seats) {
      const emp = seatToEmployee.get(seat.id);
      const booking = bookingRepo.create({
        seatId: seat.id,
        customerId: sub.customerId,
        userId: emp?.userId ?? undefined,
        centerId: sub.centerId ?? plan.centerId ?? customer.centerId ?? null,
        planId: plan.id,
        subscriptionId: sub.id,
        startDate: cycleStart,
        endDate: cycleEnd,
        status: BookingStatus.CONFIRMED,
        totalPrice: Number(plan.price),
        notes: `${plan.name} — ${plan.billingCycle.toLowerCase()} seat (subscription ${sub.id.slice(0, 8)})`,
      } as any);
      await bookingRepo.save(booking);
      count++;
    }
    return count;
  }

  private async generateInvoice(
    tx: EntityManager,
    sub: Subscription,
    plan: Plan,
    customer: Customer,
    cycleStart: Date,
    cycleEnd: Date,
  ): Promise<Invoice> {
    const invoiceRepo = tx.getRepository(Invoice);
    const amount = Number(sub.amount);
    const invoiceNumber = `INV-${sub.customerId.slice(0, 4).toUpperCase()}-${cycleStart.getFullYear()}${String(cycleStart.getMonth() + 1).padStart(2, '0')}-${sub.id.slice(0, 4).toUpperCase()}`;
    const issueDate = new Date();
    const dueDate = cycleEnd;

    const invoice = invoiceRepo.create({
      invoiceNumber,
      customerId: sub.customerId,
      customerName: customer.name,
      customerEmail: customer.email,
      centerId: sub.centerId ?? plan.centerId ?? customer.centerId ?? null,
      planName: plan.name,
      amount,
      tax: 0,
      totalAmount: amount,
      // InvoiceStatus.DRAFT === 'Draft' (the enum uses capitalized string
      // values — see InvoiceStatus in user.type.ts). Use the enum member, not
      // the uppercase literal, so the value matches the DB enum type.
      status: InvoiceStatus.DRAFT,
      issueDate,
      dueDate,
      notes: `${plan.name} × ${sub.seatCount} seat(s), ${cycleStart.toISOString().slice(0, 10)} → ${cycleEnd.toISOString().slice(0, 10)}`,
    } as any);
    return invoiceRepo.save(invoice) as unknown as Promise<Invoice>;
  }
}
