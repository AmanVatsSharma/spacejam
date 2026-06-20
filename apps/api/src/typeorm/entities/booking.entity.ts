/**
 * File:        apps/api/src/typeorm/entities/booking.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Booking entity for TypeORM
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
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { BookingStatus } from '../../graphql/types/user.type';
import { User } from './user.entity';
import { Seat } from './seat.entity';
import { Center } from './center.entity';
import { Payment } from './payment.entity';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'userId' })
  userId!: string;

  @Column({ name: 'seatId' })
  seatId!: string;

  @Column({ name: 'centerId' })
  centerId!: string;

  @Column({ name: 'planId', nullable: true })
  planId!: string | null;

  @Column({ type: 'timestamp' })
  startDate!: Date;

  @Column({ type: 'timestamp' })
  endDate!: Date;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Column({ name: 'paymentId', nullable: true })
  paymentId!: string | null;

  @Column({ type: 'float' })
  totalPrice!: number;

  @Column({ type: 'float', default: 0 })
  discount!: number;

  @Column({ name: 'discountCode', nullable: true })
  discountCode!: string | null;

  @Column({ nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Seat, (seat) => seat.bookings)
  @JoinColumn({ name: 'seatId' })
  seat!: Seat;

  @ManyToOne(() => Center, (center) => center.bookings)
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @OneToOne(() => Payment, (payment) => payment.booking)
  payment!: Payment;
}