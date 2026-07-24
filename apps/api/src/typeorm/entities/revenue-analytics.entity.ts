/**
 * File:        apps/api/src/typeorm/entities/revenue-analytics.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Revenue analytics entity for TypeORM
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import { Center } from './center.entity';

@Entity('revenue_analytics')
@ObjectType()
export class RevenueAnalytics {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'centerId' })
  centerId!: string;

  @Field()
  @Column({ type: 'timestamp' })
  date!: Date;

  @Field(() => Float)
  @Column({ type: 'float', default: 0 })
  revenue!: number;

  @Field(() => Float)
  @Column({ name: 'occupancyRate', type: 'float', default: 0 })
  occupancyRate!: number;

  @Field(() => Int)
  @Column({ name: 'newBookings', default: 0 })
  newBookings!: number;

  @Field(() => Int)
  @Column({ name: 'cancelledBookings', default: 0 })
  cancelledBookings!: number;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  // Relations
  @Field(() => Center)
  @ManyToOne(() => Center, (center) => center.analytics)
  @JoinColumn({ name: 'centerId' })
  center!: Center;
}