/**
 * File:        apps/api/src/typeorm/entities/plan.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Plan — a center's billable seat offering (seatType +
 *              billingCycle + price). Per-center so each location prices
 *              independently. A Subscription references exactly one Plan.
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
  OneToMany,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import {
  BillingCycle,
  PlanStatus,
  SeatType,
} from '../../graphql/types/user.type';
import { Center } from './center.entity';
import { Subscription } from './subscription.entity';

@Entity('plans')
@ObjectType()
@Index(['centerId'])
export class Plan {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'centerId', type: 'uuid' })
  centerId!: string;

  @Field()
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  /** Which seat category this plan covers (hot desk / dedicated / cabin). */
  @Field(() => SeatType)
  @Column({ type: 'enum', enum: SeatType })
  seatType!: SeatType;

  @Field(() => BillingCycle)
  @Column({ type: 'enum', enum: BillingCycle, default: BillingCycle.MONTHLY })
  billingCycle!: BillingCycle;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  @Field({ defaultValue: 'INR' })
  @Column({ type: 'varchar', length: 8, default: 'INR' })
  currency!: string;

  /** Minimum committed seats for this plan, if any (0 = no minimum). */
  @Field(() => Int, { defaultValue: 1 })
  @Column({ type: 'int', default: 1 })
  minSeats!: number;

  @Field(() => PlanStatus, { defaultValue: PlanStatus.ACTIVE })
  @Column({ type: 'enum', enum: PlanStatus, default: PlanStatus.ACTIVE })
  status!: PlanStatus;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'centerId' })
  center?: Center;

  @Field(() => [Subscription], { nullable: true })
  @OneToMany(() => Subscription, (sub) => sub.plan)
  subscriptions?: Subscription[];
}
