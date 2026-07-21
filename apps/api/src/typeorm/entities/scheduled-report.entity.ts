/**
 * File:        apps/api/src/typeorm/entities/scheduled-report.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     ScheduledReport — cron-style report generation and email
 *              delivery. Supports daily, weekly, monthly, custom.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
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
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from './user.entity';
import { Center } from './center.entity';

export enum ReportFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export enum ReportType {
  REVENUE = 'REVENUE',
  OCCUPANCY = 'OCCUPANCY',
  BOOKINGS = 'BOOKINGS',
  AUDIT = 'AUDIT',
  PAYMENTS = 'PAYMENTS',
}

@ObjectType()
@Entity('scheduled_reports')
@Index(['centerId', 'enabled'])
@Index(['userId'])
export class ScheduledReport {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'userId' })
  userId!: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => ID)
  @Column({ name: 'centerId' })
  centerId!: string;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @Field(() => ReportType)
  @Column({ type: 'varchar' })
  reportType!: ReportType;

  @Field(() => ReportFrequency)
  @Column({ type: 'varchar' })
  frequency!: ReportFrequency;

  /** Day of week (0=Sunday) for WEEKLY, day of month for MONTHLY */
  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  dayOfPeriod!: number | null;

  @Field(() => [String])
  @Column({ type: 'text', array: true })
  recipients!: string[];

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  filters!: Record<string, any> | null;

  @Field(() => Boolean, { defaultValue: true })
  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  lastSentAt!: string | null;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt!: Date;
}
