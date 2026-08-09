/**
 * File:        apps/api/src/typeorm/entities/subscription.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Subscription — a customer's (company's) commitment to N seats
 *              of a Plan, with billing dates. Drives the monthly-seat
 *              allocation model: M3 fans each Subscription out into per-seat
 *              Bookings (Booking.planId) and generates Invoices per cycle.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { SubscriptionStatus } from '../../graphql/types/user.type';
import { Customer } from './customer.entity';
import { Plan } from './plan.entity';
import { Center } from './center.entity';

@Entity('subscriptions')
// Explicit GQL type name: "Subscription" collides with GraphQL's reserved
// Subscription root type, so the schema generator errors on duplicate names.
// The TS class stays `Subscription`; only the GraphQL type is aliased.
@ObjectType('MembershipSubscription')
@Index(['customerId'])
@Index(['planId'])
export class Subscription {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'customerId', type: 'uuid' })
  customerId!: string;

  @Field(() => ID)
  @Column({ name: 'planId', type: 'uuid' })
  planId!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId?: string | null;

  /** Contracted seat count (the company's monthly allocation). */
  @Field(() => Int)
  @Column({ name: 'seatCount', type: 'int' })
  seatCount!: number;

  /** Snapshot of the plan price at subscription time, in case the plan changes later. */
  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  unitPrice!: number;

  /** seatCount * unitPrice, denormalised for fast reporting. */
  @Field(() => Float)
  @Column({ type: 'decimal', precision: 14, scale: 2 })
  amount!: number;

  @Field(() => SubscriptionStatus, { defaultValue: SubscriptionStatus.ACTIVE })
  @Column({ type: 'enum', enum: SubscriptionStatus, default: SubscriptionStatus.ACTIVE })
  status!: SubscriptionStatus;

  @Field()
  @Column({ name: 'startDate', type: 'timestamp' })
  startDate!: Date;

  /** When the current billing period ends / next invoice is generated. */
  @Field()
  @Column({ name: 'nextBillingDate', type: 'timestamp' })
  nextBillingDate!: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'endDate', type: 'timestamp', nullable: true })
  endDate?: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => Customer, { nullable: true })
  @ManyToOne(() => Customer, (customer) => customer.subscriptions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @Field(() => Plan, { nullable: true })
  @ManyToOne(() => Plan, (plan) => plan.subscriptions, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'planId' })
  plan?: Plan;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'centerId' })
  center?: Center;
}
