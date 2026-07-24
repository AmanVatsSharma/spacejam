/**
 * File:        apps/api/src/typeorm/entities/customer-employee.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Employee / team member belonging to a customer.
 *              An employee is someone who gets workspace access (seat, login, etc.).
 *              Multiple employees per customer — one is the billing contact (Customer.name/email).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-23
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
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Customer } from './customer.entity';

@Entity('customer_employees')
@ObjectType()
export class CustomerEmployee {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'customerId', type: 'uuid' })
  customerId!: string;

  @Field(() => Customer, { nullable: true })
  @ManyToOne(() => Customer, (customer) => customer.employees, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  phone?: string;

  @Field()
  @Column({ type: 'varchar', length: 100, default: 'Member' })
  role!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  department?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 50, nullable: true })
  seatNumber?: string;

  @Field()
  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  invitedAt?: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  joinedAt?: Date;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
