/**
 * File:        apps/api/src/typeorm/entities/onboarding.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Onboarding entity — tracks the conversion pipeline
 *              from lead → customer with all paperwork/contract setup.
 *              Created when a lead is converted (with optional custom
 *              company details) or directly as a new onboarding.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { OnboardingStatus } from '../../graphql/types/user.type';
import { Lead } from './lead.entity';
import { Customer } from './customer.entity';
import { User } from './user.entity';
import { Center } from './center.entity';

@Entity('onboardings')
@ObjectType()
@Index(['status'])
@Index(['leadId'])
@Index(['customerId'])
export class Onboarding {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    // Source tracking
    @Field(() => ID, { nullable: true })
    @Column({ name: 'leadId', type: 'uuid', nullable: true })
    leadId?: string | null;

    @Field(() => ID, { nullable: true })
    @Column({ name: 'customerId', type: 'uuid', nullable: true })
    customerId?: string | null;

    @Field(() => OnboardingStatus)
    @Column({
        type: 'enum',
        enum: OnboardingStatus,
        default: OnboardingStatus.PENDING,
    })
    status!: OnboardingStatus;

    // Company info (collected on the onboarding form)
    @Field({ nullable: true })
    @Column({ type: 'varchar', nullable: true })
    companyName?: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    companyAddress?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', nullable: true })
    gstNumber?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', nullable: true })
    planType?: string;

    @Field(() => Int, { nullable: true })
    @Column({ type: 'int', nullable: true })
    seatCount?: number;

    // Primary contact (often prefilled from lead)
    @Field({ nullable: true })
    @Column({ type: 'varchar', nullable: true })
    contactName?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', nullable: true })
    contactEmail?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', nullable: true })
    contactPhone?: string;

    // Emergency / secondary contact
    @Field({ nullable: true })
    @Column({ type: 'varchar', nullable: true })
    emergencyContact?: string;

    @Field({ nullable: true })
    @Column({ type: 'varchar', nullable: true })
    emergencyPhone?: string;

    // Documents (URLs to S3/Cloudinary once upload pipeline is wired)
    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    idProofUrl?: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    agreementUrl?: string;

    // Date the onboarding was finalised (when status flips to COMPLETED)
    @Field({ nullable: true })
    @Column({ type: 'date', nullable: true })
    completedAt?: Date;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    notes?: string;

    // Assignment + scoping
    @Field(() => ID, { nullable: true })
    @Column({ name: 'assignedToId', type: 'uuid', nullable: true })
    assignedToId?: string | null;

    @Field(() => ID, { nullable: true })
    @Column({ name: 'centerId', type: 'uuid', nullable: true })
    centerId?: string | null;

    // Relations
    @Field(() => Lead, { nullable: true })
    @ManyToOne(() => Lead, { eager: false })
    @JoinColumn({ name: 'leadId' })
    lead?: Lead;

    @Field(() => Customer, { nullable: true })
    @ManyToOne(() => Customer, { eager: false })
    @JoinColumn({ name: 'customerId' })
    customer?: Customer;

    @Field(() => User, { nullable: true })
    @ManyToOne(() => User, { eager: false })
    @JoinColumn({ name: 'assignedToId' })
    assignedTo?: User;

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
