/**
 * File:        apps/api/src/typeorm/entities/deposit.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Deposit entity for revenue management
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
import { DepositStatus, DepositType } from '../../graphql/types/user.type';
import { Center } from './center.entity';
import { Customer } from './customer.entity';

@ObjectType()
@Entity('deposits')
export class Deposit {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'customerId', type: 'uuid', nullable: true })
  customerId!: string | null;

  @Field()
  @Column()
  customerName!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId?: string;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Field(() => DepositType)
  @Column({ type: 'enum', enum: DepositType, default: 'SECURITY' })
  depositType!: DepositType;

  @Field(() => DepositStatus)
  @Column({ type: 'enum', enum: DepositStatus, default: 'HELD' })
  status!: DepositStatus;

  @Field()
  @Column()
  referenceNumber!: string;

  @Field()
  @Column({ name: 'receivedDate', type: 'timestamp' })
  receivedDate!: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'releasedDate', type: 'timestamp', nullable: true })
  releasedDate?: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'releaseRequestedDate', type: 'timestamp', nullable: true })
  releaseRequestedDate?: Date;

  @Field(() => String, { nullable: true })
  @Column({ name: 'releaseReason', type: 'text', nullable: true })
  releaseReason?: string;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ name: 'frozen', type: 'boolean', default: false })
  frozen?: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { eager: false })
  @JoinColumn({ name: 'centerId' })
  center?: Center;

  @Field(() => Customer, { nullable: true })
  @ManyToOne(() => Customer, (customer) => customer.deposits, { eager: false })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;
}
