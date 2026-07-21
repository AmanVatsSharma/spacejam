/**
 * File:        apps/api/src/typeorm/entities/contract.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Contract entity for revenue management
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
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ContractStatus, PaymentFrequency } from '../../graphql/types/user.type';
import { Center } from './center.entity';
import { Customer } from './customer.entity';

@Entity('contracts')
@ObjectType()
export class Contract {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column()
  contractNumber!: string;

  @Field(() => ID)
  @Column({ name: 'customerId' })
  customerId!: string;

  @Field()
  @Column()
  customerName!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId?: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  planName?: string;

  @Field()
  @Column({ name: 'startDate', type: 'timestamp' })
  startDate!: Date;

  @Field()
  @Column({ name: 'endDate', type: 'timestamp' })
  endDate!: Date;

  @Field(() => ContractStatus)
  @Column({ type: 'enum', enum: ContractStatus })
  status!: ContractStatus;

  @Field()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Field(() => PaymentFrequency)
  @Column({ type: 'enum', enum: PaymentFrequency, name: 'paymentFrequency' })
  paymentFrequency!: PaymentFrequency;

  @Field()
  @Column({ name: 'autoRenew', type: 'boolean', default: false })
  autoRenew!: boolean;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  terms?: string;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { eager: false })
  @JoinColumn({ name: 'centerId' })
  center?: Center;

  @Field(() => Customer, { nullable: true })
  @ManyToOne(() => Customer, (customer) => customer.contracts, { eager: false })
  @JoinColumn({ name: 'customerId' })
  customer?: Customer;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
