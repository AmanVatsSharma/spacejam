/**
 * File:        apps/api/src/typeorm/entities/customer.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Customer entity for CRM — onboarded clients (converted leads)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
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
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { CustomerStatus } from '../../graphql/types/user.type';
import { Center } from './center.entity';
import { Deposit } from './deposit.entity';
import { Contract } from './contract.entity';
import { Invoice } from './invoice.entity';
import { Lead } from './lead.entity';
import { Booking } from './booking.entity';

@Entity('customers')
@ObjectType()
export class Customer {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Field()
    @Column()
    name!: string;

    @Field()
    @Column()
    email!: string;

    @Field(() => String, { nullable: true })
    @Column({ nullable: true })
    phone?: string;

    @Field(() => String, { nullable: true })
    @Column({ nullable: true })
    company?: string;

    @Field(() => CustomerStatus)
    @Column({
        type: 'enum',
        enum: CustomerStatus,
        default: CustomerStatus.ACTIVE,
    })
    status!: CustomerStatus;

    @Field(() => Int, { defaultValue: 0 })
    @Column({ type: 'int', default: 0 })
    totalBookings!: number;

    @Field(() => Float, { defaultValue: 0 })
    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    totalSpent!: number;

    @Field(() => Date, { nullable: true })
    @Column({ type: 'date', nullable: true })
    lastBooking?: Date;

    @Field(() => ID, { nullable: true })
    @Column({ name: 'centerId', type: 'uuid', nullable: true })
    centerId?: string | null;

    @Field(() => String, { nullable: true })
    @Column({ type: 'varchar', nullable: true })
    teamSize?: string;

    @Field(() => String, { nullable: true })
    @Column({ type: 'varchar', nullable: true })
    location?: string;

    @Field(() => Date, { nullable: true })
    @Column({ type: 'date', nullable: true })
    joinDate?: Date;

    @Field(() => String, { nullable: true })
    @Column({ type: 'text', nullable: true })
    notes?: string;

    // Relations
    @Field(() => Center, { nullable: true })
    @ManyToOne(() => Center, { eager: false })
    @JoinColumn({ name: 'centerId' })
    center?: Center;

    @Field(() => [Deposit], { nullable: true })
    @OneToMany(() => Deposit, (deposit) => deposit.customer)
    deposits?: Deposit[];

    @Field(() => [Contract], { nullable: true })
    @OneToMany(() => Contract, (contract) => contract.customer)
    contracts?: Contract[];

    @Field(() => [Invoice], { nullable: true })
    @OneToMany(() => Invoice, (invoice) => invoice.customer)
    invoices?: Invoice[];

    @Field(() => [Lead], { nullable: true })
    @OneToMany(() => Lead, (lead) => lead.customer)
    leads?: Lead[];

    @Field(() => [Booking], { nullable: true })
    @OneToMany(() => Booking, (booking) => booking.customer)
    bookings?: Booking[];

    @Field(() => Date)
    @CreateDateColumn({ name: 'createdAt' })
    createdAt!: Date;

    @Field(() => Date)
    @UpdateDateColumn({ name: 'updatedAt' })
    updatedAt!: Date;
}
