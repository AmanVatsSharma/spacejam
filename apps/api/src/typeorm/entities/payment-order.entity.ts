/**
 * File:        apps/api/src/typeorm/entities/payment-order.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Gateway payment ledger. One row per Razorpay order we create,
 *              bound at creation time to the thing it pays for (an onboarding
 *              or an invoice) and to the amount the SERVER computed. Verify
 *              and webhook handlers look the order up here instead of
 *              trusting client-supplied ids/amounts, and settle it with a
 *              single guarded UPDATE so a replayed verify/webhook can never
 *              finalize the same payment twice.
 *
 *              Internal only — deliberately not a GraphQL type.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { PaymentOrderPurpose, PaymentOrderStatus } from '../../graphql/enums/onboarding-payment.enums';

/** bigint comes back from pg as a string; amounts here are far below 2^53. */
const bigintAsNumber = {
  to: (value?: number | null) => value,
  from: (value?: string | number | null) => (value == null ? value : Number(value)),
};

@Entity('payment_orders')
@Index('UQ_PAYMENT_ORDERS_PROVIDER_ORDER', ['providerOrderId'], { unique: true })
@Index('IDX_PAYMENT_ORDERS_ONBOARDING', ['onboardingId'])
@Index('IDX_PAYMENT_ORDERS_INVOICE', ['invoiceId'])
export class PaymentOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, default: 'RAZORPAY' })
  provider!: string;

  /** Razorpay order id (order_xxx). */
  @Column({ name: 'providerOrderId', type: 'varchar', length: 64 })
  providerOrderId!: string;

  /** Amount in paise, as sent to Razorpay. */
  @Column({ name: 'amountPaise', type: 'bigint', transformer: bigintAsNumber })
  amountPaise!: number;

  @Column({ type: 'varchar', length: 3, default: 'INR' })
  currency!: string;

  @Column({ type: 'varchar', length: 16, default: PaymentOrderStatus.CREATED })
  status!: PaymentOrderStatus;

  @Column({ type: 'varchar', length: 20 })
  purpose!: PaymentOrderPurpose;

  @Column({ name: 'onboardingId', type: 'uuid', nullable: true })
  onboardingId!: string | null;

  @Column({ name: 'invoiceId', type: 'uuid', nullable: true })
  invoiceId!: string | null;

  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  receipt!: string | null;

  /** Razorpay payment id (pay_xxx) once a payment against this order is confirmed. */
  @Index('UQ_PAYMENT_ORDERS_PROVIDER_PAYMENT', { unique: true, where: '"providerPaymentId" IS NOT NULL' })
  @Column({ name: 'providerPaymentId', type: 'varchar', length: 64, nullable: true })
  providerPaymentId!: string | null;

  @Column({ name: 'signatureVerifiedAt', type: 'timestamp', nullable: true })
  signatureVerifiedAt!: Date | null;

  @Column({ name: 'paidAt', type: 'timestamp', nullable: true })
  paidAt!: Date | null;

  @Column({ name: 'failureReason', type: 'text', nullable: true })
  failureReason!: string | null;

  @Column({ name: 'createdById', type: 'uuid', nullable: true })
  createdById!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
