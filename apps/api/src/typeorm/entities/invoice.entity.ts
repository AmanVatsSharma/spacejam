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
import { Center } from './center.entity';
import { Customer } from './customer.entity';
import { Contract } from './contract.entity';

@Entity('invoices')
@ObjectType()
export class Invoice {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column()
  invoiceNumber!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'customerId', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Field()
  @Column()
  customerName!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  customerEmail?: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
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
  @Column({ type: 'enum', enum: InvoiceStatus, default: 'DRAFT' })
  status!: InvoiceStatus;

  @Field()
  @Column({ name: 'issueDate', type: 'timestamp' })
  issueDate!: Date;

  @Field()
  @Column({ name: 'dueDate', type: 'timestamp' })
  dueDate!: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'paidDate', type: 'timestamp', nullable: true })
  paidDate?: Date;

  @Field(() => PaymentMethod, { nullable: true })
  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  paymentMethod?: PaymentMethod;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { eager: false })
  @JoinColumn({ name: 'centerId' })
  center?: Center;

  @Field(() => Customer, { nullable: true })
  @ManyToOne(() => Customer, (customer) => customer.invoices, { eager: false })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'contractId', type: 'uuid', nullable: true })
  contractId?: string;

  @Field(() => Contract, { nullable: true })
  @ManyToOne(() => Contract, { eager: false })
  @JoinColumn({ name: 'contractId' })
  contract?: Contract;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
