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
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { PaymentMethod, PaymentStatus } from '../../graphql/types/user.type';
import { Booking } from './booking.entity';

@Entity('payments')
@ObjectType()
export class Payment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'bookingId', unique: true })
  bookingId!: string;

  @Field(() => Float)
  @Column({ type: 'float' })
  amount!: number;

  @Field()
  @Column({ default: 'INR' })
  currency!: string;

  @Field(() => PaymentMethod)
  @Column({ type: 'enum', enum: PaymentMethod })
  method!: PaymentMethod;

  @Field(() => PaymentStatus)
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Field(() => String, { nullable: true })
  @Column({ name: 'transactionId', type: 'varchar', nullable: true })
  transactionId!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'gatewayRef', type: 'varchar', nullable: true })
  gatewayRef!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => Booking)
  @OneToOne(() => Booking, (booking) => booking.payment)
  @JoinColumn({ name: 'bookingId' })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  booking!: any;
}