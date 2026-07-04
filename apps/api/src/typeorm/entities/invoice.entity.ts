/**
 * File:        apps/api/src/typeorm/entities/invoice.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Invoice entity for revenue management
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { InvoiceStatus, PaymentMethod } from '../../graphql/types/user.type';
import { User } from './user.entity';
import { Center } from './center.entity';

@Entity('invoices')
@ObjectType()
export class Invoice {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column()
  invoiceNumber!: string;

  @Field(() => ID)
  @Column({ name: 'customerId' })
  customerId!: string;

  @Field()
  @Column()
  customerName!: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  customerEmail?: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId?: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  planName?: string;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  tax?: number;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'totalAmount' })
  totalAmount!: number;

  @Field(() => InvoiceStatus)
  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
  status!: InvoiceStatus;

  @Field()
  @Column({ name: 'issueDate', type: 'date' })
  issueDate!: Date;

  @Field()
  @Column({ name: 'dueDate', type: 'date' })
  dueDate!: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'paidDate', type: 'date', nullable: true })
  paidDate?: Date;

  @Field(() => PaymentMethod, { nullable: true })
  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  // Relations
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'customerId' })
  customer?: User;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { eager: false })
  @JoinColumn({ name: 'centerId' })
  center?: Center;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
