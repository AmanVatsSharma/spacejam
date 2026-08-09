/**
 * File:        apps/api/src/graphql/resolvers/subscription.resolver.ts
 * Module:      API · GraphQL · Resolvers
 * Purpose:     Plan + Subscription resolvers. Plans are center-scoped for
 *              CENTER_MANAGER callers (managers see only their center's plans);
 *              super admins see all. Subscriptions are scoped by the customer's
 *              center. Computes amount = seatCount * plan.unitPrice on create.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Args, Mutation, Query, Resolver, ID, ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { BadRequestException, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Plan } from '../../typeorm/entities/plan.entity';
import { Subscription } from '../../typeorm/entities/subscription.entity';
import { Customer } from '../../typeorm/entities/customer.entity';
import { CacheService } from '../../cache/cache.service';
import { centerScope } from '../../auth/helpers/center-scope.helper';
import { GqlAuthGuard } from '../../auth/guards/gql-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../../auth/types/jwt-payload.type';
import {
  BillingCycle,
  PlanStatus,
  SubscriptionStatus,
} from '../types/user.type';
import {
  CreatePlanInput,
  UpdatePlanInput,
  PlanFiltersInput,
} from '../inputs/plan.input';
import {
  CreateSubscriptionInput,
  UpdateSubscriptionInput,
  SubscriptionFiltersInput,
} from '../inputs/subscription.input';
import { computeNextBilling, computeAmount } from '../../subscription/billing';
import { BillingService } from '../../subscription/billing.service';

/** GraphQL result type for billing-cycle processing. */
@ObjectType()
class BillingCycleResultGql {
  @Field(() => ID)
  subscriptionId!: string;
  @Field(() => ID)
  customerId!: string;
  @Field(() => ID, { nullable: true })
  invoiceId?: string;
  @Field(() => Int)
  bookingsCreated!: number;
  @Field(() => Int)
  seatsAllocated!: number;
  @Field()
  cycleStart!: Date;
  @Field()
  cycleEnd!: Date;
  @Field(() => Float)
  amount!: number;
  @Field()
  skipped!: boolean;
}

@Resolver(() => Plan)
export class PlanResolver {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepo: Repository<Plan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    private readonly cache: CacheService,
    private readonly billing: BillingService,
  ) {}

  // ─── Plans ───────────────────────────────────────────────────────────────
  @Query(() => [Plan], { description: 'List plans, optionally filtered + center-scoped' })
  @UseGuards(GqlAuthGuard)
  async plans(
    @Args('input', { nullable: true }) input?: PlanFiltersInput,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<Plan[]> {
    const scope = caller ? centerScope(caller) : undefined;
    const qb = this.planRepo.createQueryBuilder('p');

    if (scope) qb.andWhere('p."centerId" = :scope', { scope });
    else if (input?.centerId) qb.andWhere('p."centerId" = :centerId', { centerId: input.centerId });

    if (input?.seatType) qb.andWhere('p."seatType" = :seatType', { seatType: input.seatType });
    if (input?.billingCycle) qb.andWhere('p."billingCycle" = :billingCycle', { billingCycle: input.billingCycle });
    if (input?.status) qb.andWhere('p."status" = :status', { status: input.status });

    qb.orderBy('p."createdAt"', 'DESC').limit(input?.limit ?? 100).offset(input?.offset ?? 0);
    return qb.getMany();
  }

  @Query(() => Plan, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async plan(@Args('id', { type: () => ID }) id: string): Promise<Plan | null> {
    return this.planRepo.findOne({ where: { id }, relations: ['subscriptions'] });
  }

  @Mutation(() => Plan)
  @UseGuards(GqlAuthGuard)
  async createPlan(@Args('input') input: CreatePlanInput): Promise<Plan> {
    const created = this.planRepo.create({
      ...input,
      billingCycle: input.billingCycle ?? BillingCycle.MONTHLY,
      currency: input.currency ?? 'INR',
      minSeats: input.minSeats ?? 1,
      status: input.status ?? PlanStatus.ACTIVE,
    });
    const saved = await this.planRepo.save(created);
    await this.cache.invalidatePattern('plans:*');
    return saved as unknown as Plan;
  }

  @Mutation(() => Plan)
  @UseGuards(GqlAuthGuard)
  async updatePlan(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdatePlanInput,
  ): Promise<Plan> {
    await this.planRepo.update(id, input as any);
    const updated = await this.planRepo.findOne({ where: { id } });
    if (!updated) throw new BadRequestException('Plan not found');
    await this.cache.invalidatePattern('plans:*');
    return updated;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deletePlan(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    // Refuse hard delete if subscriptions still reference it (FK is RESTRICT,
    // but check here to give a cleaner error than a DB constraint violation).
    const inUse = await this.planRepo
      .createQueryBuilder('p')
      .leftJoin('p.subscriptions', 's')
      .where('p.id = :id', { id })
      .andWhere('s.id IS NOT NULL')
      .getCount();
    if (inUse > 0) {
      throw new BadRequestException(
        'Plan has active subscriptions. Archive it instead of deleting.',
      );
    }
    const result = await this.planRepo.delete(id);
    await this.cache.invalidatePattern('plans:*');
    return (result.affected ?? 0) > 0;
  }

  // ─── Subscriptions ───────────────────────────────────────────────────────
  @Query(() => [Subscription], { description: 'List subscriptions, center-scoped for managers' })
  @UseGuards(GqlAuthGuard)
  async subscriptions(
    @Args('input', { nullable: true }) input?: SubscriptionFiltersInput,
    @CurrentUser() caller?: JwtPayload,
  ): Promise<Subscription[]> {
    const scope = caller ? centerScope(caller) : undefined;
    const qb = this.subscriptionRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.plan', 'plan')
      .leftJoinAndSelect('s.customer', 'customer');

    if (scope) qb.andWhere('s."centerId" = :scope', { scope });
    else if (input?.centerId) qb.andWhere('s."centerId" = :centerId', { centerId: input.centerId });

    if (input?.customerId) qb.andWhere('s."customerId" = :customerId', { customerId: input.customerId });
    if (input?.planId) qb.andWhere('s."planId" = :planId', { planId: input.planId });
    if (input?.status) qb.andWhere('s."status" = :status', { status: input.status });

    qb.orderBy('s."createdAt"', 'DESC').limit(input?.limit ?? 100).offset(input?.offset ?? 0);
    return qb.getMany();
  }

  @Query(() => Subscription, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async subscription(@Args('id', { type: () => ID }) id: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findOne({
      where: { id },
      relations: ['plan', 'customer', 'center'],
    });
  }

  @Mutation(() => Subscription)
  @UseGuards(GqlAuthGuard)
  async createSubscription(@Args('input') input: CreateSubscriptionInput): Promise<Subscription> {
    const plan = await this.planRepo.findOne({ where: { id: input.planId } });
    if (!plan) throw new BadRequestException('Plan not found');

    const customer = await this.customerRepo.findOne({ where: { id: input.customerId } });
    if (!customer) throw new BadRequestException('Customer not found');

    if (input.seatCount < (plan.minSeats ?? 1)) {
      throw new BadRequestException(
        `This plan requires a minimum of ${plan.minSeats} seat(s).`,
      );
    }

    const unitPrice = Number(plan.price);
    const amount = computeAmount(input.seatCount, unitPrice);
    const startDate = input.startDate ? new Date(input.startDate) : new Date();
    const nextBillingDate = computeNextBilling(startDate, plan.billingCycle);

    const created = this.subscriptionRepo.create({
      customerId: input.customerId,
      planId: input.planId,
      centerId: plan.centerId ?? customer.centerId ?? null,
      seatCount: input.seatCount,
      unitPrice,
      amount,
      status: input.status ?? SubscriptionStatus.ACTIVE,
      startDate,
      nextBillingDate,
      notes: input.notes ?? null,
    });
    const saved = await this.subscriptionRepo.save(created);
    await this.cache.invalidatePattern('subscriptions:*');
    await this.cache.invalidatePattern(`customer:${input.customerId}*`);
    return saved as unknown as Subscription;
  }

  @Mutation(() => Subscription)
  @UseGuards(GqlAuthGuard)
  async updateSubscription(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateSubscriptionInput,
  ): Promise<Subscription> {
    const existing = await this.subscriptionRepo.findOne({ where: { id } });
    if (!existing) throw new BadRequestException('Subscription not found');

    // If seatCount changes, recompute amount against the snapshot unitPrice.
    if (input.seatCount !== undefined && input.seatCount !== existing.seatCount) {
      existing.seatCount = input.seatCount;
      existing.amount = computeAmount(input.seatCount, existing.unitPrice);
    }
    if (input.status !== undefined) existing.status = input.status;
    if (input.notes !== undefined) existing.notes = input.notes;
    if (input.nextBillingDate !== undefined) {
      existing.nextBillingDate = new Date(input.nextBillingDate);
    }
    if (input.endDate !== undefined) {
      existing.endDate = input.endDate ? new Date(input.endDate) : null;
    }

    const saved = await this.subscriptionRepo.save(existing);
    await this.cache.invalidatePattern('subscriptions:*');
    await this.cache.invalidatePattern(`customer:${existing.customerId}*`);
    return saved;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async cancelSubscription(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    const existing = await this.subscriptionRepo.findOne({ where: { id } });
    if (!existing) throw new BadRequestException('Subscription not found');
    existing.status = SubscriptionStatus.CANCELLED;
    existing.endDate = new Date();
    await this.subscriptionRepo.save(existing);
    await this.cache.invalidatePattern('subscriptions:*');
    await this.cache.invalidatePattern(`customer:${existing.customerId}*`);
    return true;
  }

  // ─── Billing fan-out (M3) ────────────────────────────────────────────────
  @Mutation(() => BillingCycleResultGql, {
    description:
      'Process one subscription\'s current billing cycle: allocate seats, create per-seat monthly bookings (Booking.planId + subscriptionId), generate an invoice, and advance nextBillingDate. Idempotent per cycle.',
  })
  @UseGuards(GqlAuthGuard)
  async processSubscriptionCycle(
    @Args('subscriptionId', { type: () => ID }) subscriptionId: string,
  ): Promise<BillingCycleResultGql> {
    const result = await this.billing.processSubscription(subscriptionId);
    await this.cache.invalidatePattern('subscriptions:*');
    await this.cache.invalidatePattern('bookings:*');
    await this.cache.invalidatePattern('invoices:*');
    await this.cache.invalidatePattern(`customer:${result.customerId}*`);
    return result as BillingCycleResultGql;
  }

  @Mutation(() => [BillingCycleResultGql], {
    description:
      'Process every ACTIVE subscription whose nextBillingDate is due (≤ now). Returns one result per processed subscription. Intended for a daily cron / manual sweep.',
  })
  @UseGuards(GqlAuthGuard)
  async processDueSubscriptions(): Promise<BillingCycleResultGql[]> {
    const results = await this.billing.processDueSubscriptions();
    await this.cache.invalidatePattern('subscriptions:*');
    await this.cache.invalidatePattern('bookings:*');
    await this.cache.invalidatePattern('invoices:*');
    return results as BillingCycleResultGql[];
  }
}
