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
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { OnboardingStatus } from '@enums';
import {
    OnboardingPaymentMethod,
    OnboardingPaymentStatus,
} from '../../graphql/enums/onboarding-payment.enums';
import { Lead } from './lead.entity';
import { Customer } from './customer.entity';
import { User } from './user.entity';
import { Center } from './center.entity';

/** numeric(12,2) comes back from pg as a string. */
const numericAsNumber = {
    to: (value?: number | null) => value,
    from: (value?: string | number | null) => (value == null ? value : Number(value)),
};

@Entity('onboardings')
@ObjectType()
@Index(['status'])
@Index(['leadId'])
@Index(['customerId'])
@Index(['paymentStatus'])
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
    @Column({ type: 'timestamp', nullable: true })
    completedAt?: Date;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    notes?: string;

    // ── Payment lifecycle ────────────────────────────────────────────────
    // Status columns are varchar (validated in the app) so new values never
    // need an ALTER TYPE migration. See 20261002100000-OnboardingPaymentLifecycle.
    @Field(() => OnboardingPaymentMethod, { nullable: true })
    @Column({ name: 'paymentMethod', type: 'varchar', length: 24, nullable: true })
    paymentMethod?: OnboardingPaymentMethod | null;

    @Field(() => OnboardingPaymentStatus)
    @Column({
        name: 'paymentStatus',
        type: 'varchar',
        length: 24,
        default: OnboardingPaymentStatus.NOT_REQUIRED,
    })
    paymentStatus!: OnboardingPaymentStatus;

    /** Amount due at onboarding (the security deposit), fixed by the server at submit time. */
    @Field(() => Float, { nullable: true })
    @Column({ name: 'paymentAmount', type: 'numeric', precision: 12, scale: 2, nullable: true, transformer: numericAsNumber })
    paymentAmount?: number | null;

    /** UTR (bank transfer), cheque number (cheque) or Razorpay payment id (online). */
    @Field(() => String, { nullable: true })
    @Column({ name: 'paymentReference', type: 'varchar', length: 100, nullable: true })
    paymentReference?: string | null;

    @Field(() => String, { nullable: true })
    @Column({ name: 'chequeNumber', type: 'varchar', length: 20, nullable: true })
    chequeNumber?: string | null;

    @Field(() => String, { nullable: true })
    @Column({ name: 'chequeBank', type: 'varchar', length: 120, nullable: true })
    chequeBank?: string | null;

    /** Date written on the cheque (YYYY-MM-DD). */
    @Field(() => String, { nullable: true })
    @Column({ name: 'chequeDate', type: 'date', nullable: true })
    chequeDate?: string | null;

    @Field(() => Date, { nullable: true })
    @Column({ name: 'chequeClearedAt', type: 'timestamp', nullable: true })
    chequeClearedAt?: Date | null;

    /** Date the bank transfer was made (YYYY-MM-DD). */
    @Field(() => String, { nullable: true })
    @Column({ name: 'transferDate', type: 'date', nullable: true })
    transferDate?: string | null;

    @Field(() => String, { nullable: true })
    @Column({ name: 'payerBank', type: 'varchar', length: 120, nullable: true })
    payerBank?: string | null;

    /** Full wizard payload, kept so a cheque / online-pending application can be provisioned later. NOT exposed via GraphQL. */
    @Column({ name: 'applicationData', type: 'jsonb', nullable: true })
    applicationData?: Record<string, unknown> | null;

    /** Client-generated per wizard session; makes submitOnboarding safely retryable. NOT exposed. */
    @Column({ name: 'idempotencyKey', type: 'varchar', length: 80, nullable: true })
    idempotencyKey?: string | null;

    @Field(() => ID, { nullable: true })
    @Column({ name: 'invoiceId', type: 'uuid', nullable: true })
    invoiceId?: string | null;

    @Field(() => ID, { nullable: true })
    @Column({ name: 'depositId', type: 'uuid', nullable: true })
    depositId?: string | null;

    @Field(() => ID, { nullable: true })
    @Column({ name: 'contractId', type: 'uuid', nullable: true })
    contractId?: string | null;

    @Field(() => ID, { nullable: true })
    @Column({ name: 'submittedById', type: 'uuid', nullable: true })
    submittedById?: string | null;

    /** Staff member who confirmed the money (cleared cheque / attested transfer). */
    @Field(() => ID, { nullable: true })
    @Column({ name: 'verifiedById', type: 'uuid', nullable: true })
    verifiedById?: string | null;

    @Field(() => Date, { nullable: true })
    @Column({ name: 'verifiedAt', type: 'timestamp', nullable: true })
    verifiedAt?: Date | null;

    @Field(() => String, { nullable: true })
    @Column({ name: 'failureReason', type: 'text', nullable: true })
    failureReason?: string | null;

    /** Set when staff abandon a pending application. */
    @Field(() => Date, { nullable: true })
    @Column({ name: 'cancelledAt', type: 'timestamp', nullable: true })
    cancelledAt?: Date | null;

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
