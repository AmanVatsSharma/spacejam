/**
 * File:        apps/api/src/graphql/inputs/onboarding-submit.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     Input DTOs for the server-orchestrated onboarding flow:
 *                submitOnboarding        — the whole wizard in ONE call
 *                collectOnboardingPayment— (re)take payment on a pending application
 *                confirmOnboardingPayment— Razorpay checkout result
 *              Dates travel as ISO strings (YYYY-MM-DD) and are parsed/validated
 *              in OnboardingService, which is the authority — these decorators
 *              only reject malformed shapes early.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-02
 */
import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { OnboardingPaymentMethod } from '../enums/onboarding-payment.enums';

/** One person on the client's team. A seat-only row (no name) reserves an unnamed seat. */
@InputType()
export class OnboardingMemberInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  /** Preferred seat name (e.g. "A-12"), matched case-insensitively. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  seatName?: string;
}

/** A file already uploaded via /api/print/upload (only its /uploads/… path is accepted). */
@InputType()
export class OnboardingDocumentInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  /** id_proof | gst_certificate | agreement | … (≤ 50 chars). */
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  documentType!: string;

  @Field()
  @IsString()
  @Matches(/^\/uploads\/[A-Za-z0-9._-]+$/, { message: 'fileUrl must be an /uploads/… path from the upload endpoint' })
  fileUrl!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\d{1,12}$/)
  fileSize?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  mimeType?: string;
}

@InputType()
export class OnboardingChequeInput {
  @Field()
  @IsString()
  @Matches(/^\d{6,12}$/, { message: 'Cheque number must be 6–12 digits' })
  chequeNumber!: string;

  /** Bank the cheque is drawn on. */
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  bankName!: string;

  /** Date written on the cheque (YYYY-MM-DD). */
  @Field()
  @IsISO8601({ strict: true })
  chequeDate!: string;
}

@InputType()
export class OnboardingBankTransferInput {
  /** UTR / transaction reference of the NEFT / RTGS / IMPS / UPI transfer. */
  @Field()
  @IsString()
  @Matches(/^[A-Za-z0-9]{8,35}$/, { message: 'UTR must be 8–35 letters/digits' })
  utr!: string;

  /** Date the money left the client's account (YYYY-MM-DD). */
  @Field()
  @IsISO8601({ strict: true })
  transferDate!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  payerBankName?: string;
}

/** The client's own bank account, kept for refunds. Never returned by GraphQL. */
@InputType()
export class OnboardingRefundAccountInput {
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  holderName!: string;

  @Field()
  @IsString()
  @Matches(/^\d{9,18}$/, { message: 'Account number must be 9–18 digits' })
  accountNumber!: string;

  @Field()
  @IsString()
  @Matches(/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/, { message: 'IFSC must look like HDFC0001234' })
  ifsc!: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  bankName!: string;
}

/** How the amount due at onboarding is being paid. Method-specific details are required for that method only. */
@InputType()
export class OnboardingPaymentInput {
  @Field(() => OnboardingPaymentMethod)
  @IsEnum(OnboardingPaymentMethod)
  method!: OnboardingPaymentMethod;

  @Field(() => OnboardingChequeInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => OnboardingChequeInput)
  cheque?: OnboardingChequeInput;

  @Field(() => OnboardingBankTransferInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => OnboardingBankTransferInput)
  bankTransfer?: OnboardingBankTransferInput;
}

@InputType()
export class SubmitOnboardingInput {
  /** Generated once per wizard session so a retried/double-clicked submit never duplicates anything. */
  @Field()
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{8,80}$/, { message: 'idempotencyKey must be 8–80 chars of letters, digits, _ or -' })
  idempotencyKey!: string;

  /** Convert an existing lead (omit to onboard a walk-in directly). */
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @Field(() => ID)
  @IsUUID()
  centerId!: string;

  // ── Company & primary contact ──────────────────────────────────────────
  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  contactName!: string;

  @Field()
  @IsEmail()
  @MaxLength(255)
  contactEmail!: string;

  @Field()
  @IsString()
  @Matches(/^\+?[0-9][0-9\s()-]{8,18}$/, { message: 'Enter a valid phone number (10–15 digits)' })
  contactPhone!: string;

  @Field()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  companyName!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  companyAddress?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  gstNumber?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  alternateEmail?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  alternatePhone?: string;

  /** Date of birth of the primary contact (YYYY-MM-DD). */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true })
  dob?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  emergencyContact?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyPhone?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  communicationChannel?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  // ── Plan & space ───────────────────────────────────────────────────────
  /** "Hot Desk" | "Custom". */
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  planType!: string;

  /** Monthly | Quarterly | Annually. */
  @Field()
  @IsString()
  @IsNotEmpty()
  billingCycle!: string;

  /** HOT_DESK | DEDICATED | CABIN | ANY (default: HOT_DESK for "Hot Desk", else ANY). */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  seatType?: string;

  /** Seats to reserve; defaults to the number of team rows (at least 1). */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(200)
  seatCount?: number;

  /** Contract term in months (custom deals); defaults to one billing cycle. */
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  durationMonths?: number;

  /** Agreed monthly rent for custom deals; otherwise the booked seats' list prices are used. */
  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100_000_000)
  monthlyRent?: number;

  /** Contract start (YYYY-MM-DD); defaults to today. */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true })
  startDate?: string;

  @Field(() => [OnboardingMemberInput], { nullable: true })
  @IsOptional()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => OnboardingMemberInput)
  members?: OnboardingMemberInput[];

  // ── Finance ────────────────────────────────────────────────────────────
  /** Security deposit collected at onboarding (₹). 0 means nothing to collect. */
  @Field(() => Float)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10_000_000)
  depositAmount!: number;

  /** Required when depositAmount > 0. */
  @Field(() => OnboardingPaymentInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => OnboardingPaymentInput)
  payment?: OnboardingPaymentInput;

  @Field(() => OnboardingRefundAccountInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => OnboardingRefundAccountInput)
  refundAccount?: OnboardingRefundAccountInput;

  // ── Services & wallet ──────────────────────────────────────────────────
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  autoRechargeEnabled?: boolean;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  autoRechargeContact?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  autoRechargeThreshold?: number;

  /** Create (or link) a login for the primary contact. Default true. */
  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  provisionLogin?: boolean;

  // ── Documents ──────────────────────────────────────────────────────────
  @Field(() => [OnboardingDocumentInput], { nullable: true })
  @IsOptional()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => OnboardingDocumentInput)
  documents?: OnboardingDocumentInput[];
}

@InputType()
export class ConfirmOnboardingPaymentInput {
  @Field(() => ID)
  @IsUUID()
  onboardingId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  razorpayOrderId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  razorpayPaymentId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  razorpaySignature!: string;
}
