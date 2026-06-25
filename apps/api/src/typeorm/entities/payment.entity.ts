/**
 * File:        apps/api/src/typeorm/entities/payment.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Payment entity for TypeORM
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentMethod, PaymentStatus } from '../../graphql/types/user.type';
import { Booking } from './booking.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'bookingId', unique: true })
  bookingId!: string;

  @Column({ type: 'float' })
  amount!: number;

  @Column({ default: 'INR' })
  currency!: string;

  @Column({ type: 'enum', enum: PaymentMethod })
  method!: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ name: 'transactionId', type: 'varchar', nullable: true })
  transactionId!: string | null;

  @Column({ name: 'gatewayRef', type: 'varchar', nullable: true })
  gatewayRef!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @OneToOne(() => Booking, (booking) => booking.payment)
  @JoinColumn({ name: 'bookingId' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  booking!: any;
}