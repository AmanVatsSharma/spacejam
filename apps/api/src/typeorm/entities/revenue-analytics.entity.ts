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
import { Center } from './center.entity';

@Entity('revenue_analytics')
export class RevenueAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'centerId' })
  centerId!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ type: 'float', default: 0 })
  revenue!: number;

  @Column({ name: 'occupancyRate', type: 'float', default: 0 })
  occupancyRate!: number;

  @Column({ name: 'newBookings', default: 0 })
  newBookings!: number;

  @Column({ name: 'cancelledBookings', default: 0 })
  cancelledBookings!: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => Center, (center) => center.analytics)
  @JoinColumn({ name: 'centerId' })
  center!: Center;
}