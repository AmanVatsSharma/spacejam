/**
 * File:        apps/api/src/graphql/types/user.type.ts
 * Module:      API · GraphQL Types
 * Purpose:     GraphQL object types for SpaceJam domain
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

// NOTE: the User entity is intentionally NOT imported at the top level here.
// user.entity.ts imports enums from this file, so a static `import { User }`
// forms a cycle that leaves the enums undefined when entity decorators
// evaluate (TS hoists the import). We resolve User lazily inside the
// @Field(() => …) arrow below, which runs at schema-build time after all
// modules have loaded.
type UserType = import('../../typeorm/entities/user.entity').User;

// ============================================================================
// ENUMS ONLY - Pure registry for GraphQL enums
// ============================================================================
export enum RoomType {
  BOARDROOM = 'BOARDROOM',
  CONFERENCE = 'CONFERENCE',
  MEETING_ROOM = 'MEETING_ROOM',
  WORKSHOP = 'WORKSHOP',
  TRAINING = 'TRAINING',
}

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  BOOKED = 'BOOKED',
}

// Event Enums
export enum EventType {
  MEETING = 'MEETING',
  MEETING_ROOM = 'MEETING_ROOM',
  CONFERENCE = 'CONFERENCE',
  WORKSHOP = 'WORKSHOP',
  TRAINING = 'TRAINING',
  SOCIAL = 'SOCIAL',
  OTHER = 'OTHER',
}

export enum EventStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

// Notification Enums
export enum NotificationType {
  BOOKING = 'BOOKING',
  PAYMENT = 'PAYMENT',
  DEPOSIT = 'DEPOSIT',
  LEAD = 'LEAD',
  SYSTEM = 'SYSTEM',
  REQUEST = 'REQUEST',
  EVENT = 'EVENT',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

// Request Enums
export enum RequestType {
  PRINTER = 'PRINTER',
  UPGRADE = 'UPGRADE',
  SERVICES = 'SERVICES',
  EVENTS = 'EVENTS',
  MAINTENANCE = 'MAINTENANCE',
  CLEANING = 'CLEANING',
  SECURITY = 'SECURITY',
  OTHER = 'OTHER',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

// Register new enums
registerEnumType(RoomType, { name: 'RoomType' });
registerEnumType(RoomStatus, { name: 'RoomStatus' });
registerEnumType(EventType, { name: 'EventType' });
registerEnumType(EventStatus, { name: 'EventStatus' });
registerEnumType(RequestType, { name: 'RequestType' });
registerEnumType(RequestStatus, { name: 'RequestStatus' });
registerEnumType(NotificationType, { name: 'NotificationType' });
registerEnumType(NotificationPriority, { name: 'NotificationPriority' });

// Object Types
// UserRole is a single source of truth — `apps/api/src/auth/roles.enum.ts`
// just re-exports it. New values (EMPLOYEE, COMPANY_ADMIN) power OTP-driven
// logins: an onboarded company employee resolves to EMPLOYEE, a customer's
// billing contact resolves to COMPANY_ADMIN.
export enum UserRole {
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  CENTER_OWNER = 'CENTER_OWNER',
  CENTER_MANAGER = 'CENTER_MANAGER',
  MEMBER = 'MEMBER',
  STAFF = 'STAFF',
  FINANCE = 'FINANCE',
  SUPPORT = 'SUPPORT',
  EMPLOYEE = 'EMPLOYEE',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
}

export enum CenterStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FULL = 'FULL',
  MAINTENANCE = 'MAINTENANCE',
}

export enum SeatType {
  HOT_DESK = 'HOT_DESK',
  DEDICATED = 'DEDICATED',
  CABIN = 'CABIN',
  MEETING_ROOM = 'MEETING_ROOM',
}

export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE',
  RESERVED = 'RESERVED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

// ─── Plans & Subscriptions (M2) ──────────────────────────────────────────
// A Plan is a center's billable seat offering (seatType + billingCycle +
// price). A Subscription is a customer's commitment to N seats of a plan.
export enum BillingCycle {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
}

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

export enum PaymentMethod {
  CARD = 'CARD',
  UPI = 'UPI',
  WALLET = 'WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum RecurrencePatternEnum {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

export enum LeadStatus {
  NEW = 'New',
  VISITED = 'Visited',
  NEGOTIATION = 'Negotiation',
  CONVERTED = 'Converted',
  COLD = 'Cold',
}

export enum LeadSource {
  WEBSITE = 'Website',
  REFERRAL = 'Referral',
  WALK_IN = 'Walk-in',
  SOCIAL = 'Social',
  EMAIL = 'Email',
}

registerEnumType(RecurrencePatternEnum, { name: 'RecurrencePattern' });
registerEnumType(LeadStatus, { name: 'LeadStatus' });
registerEnumType(LeadSource, { name: 'LeadSource' });

export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
}

export enum PaymentFrequency {
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  HALF_YEARLY = 'Half-Yearly',
  YEARLY = 'Yearly',
}

export enum ContractStatus {
  ACTIVE = 'Active',
  EXPIRING_SOON = 'Expiring Soon',
  EXPIRED = 'Expired',
  TERMINATED = 'Terminated',
}

export enum DepositStatus {
  HELD = 'Held',
  RELEASED = 'Released',
  REFUNDED = 'Refunded',
  FROZEN = 'Frozen',
  RELEASE_REQUESTED = 'Release Requested',
}

export enum DepositType {
  SECURITY = 'Security',
  ADVANCE = 'Advance',
  OTHER = 'Other',
}

export enum OnboardingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

registerEnumType(OnboardingStatus, { name: 'OnboardingStatus' });

export enum CustomerStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  EXPIRING_SOON = 'Expiring Soon',
  UPGRADED = 'Upgraded',
}

registerEnumType(InvoiceStatus, { name: 'InvoiceStatus' });
registerEnumType(PaymentFrequency, { name: 'PaymentFrequency' });
registerEnumType(ContractStatus, { name: 'ContractStatus' });
registerEnumType(DepositStatus, { name: 'DepositStatus' });
registerEnumType(DepositType, { name: 'DepositType' });
registerEnumType(CustomerStatus, { name: 'CustomerStatus' });
registerEnumType(UserRole, { name: 'UserRole' });
registerEnumType(CenterStatus, { name: 'CenterStatus' });
registerEnumType(SeatType, { name: 'SeatType' });
registerEnumType(SeatStatus, { name: 'SeatStatus' });
registerEnumType(BookingStatus, { name: 'BookingStatus' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });
registerEnumType(RecurrencePatternEnum, { name: 'RecurrencePattern' });
// M2 enums — registered here (after declaration) so module-eval order is safe.
registerEnumType(BillingCycle, { name: 'BillingCycle' });
registerEnumType(PlanStatus, { name: 'PlanStatus' });
registerEnumType(SubscriptionStatus, { name: 'SubscriptionStatus' });

// Re-export analytics DTOs from their dedicated file
export * from './analytics.type';

// ============================================================================
// UNIQUE DTOs - Auth result types
// ============================================================================

/**
 * Result of an out-of-band action (e.g. verify-email). The frontend can use
 * `ok` to decide whether to show a success or error banner.
 */
@ObjectType()
export class GenericActionResult {
  @Field()
  ok!: boolean;

  @Field()
  message!: string;
}

/**
 * Authentication payload with tokens and user info.
 */
@ObjectType()
export class AuthPayload {
  @Field(() => String, { nullable: true })
  accessToken?: string | null;

  @Field(() => String, { nullable: true })
  refreshToken?: string | null;

  @Field(() => Int, { nullable: true })
  expiresIn?: number | null;

  @Field()
  accessTokenExpiresAt!: Date;

  @Field()
  refreshTokenExpiresAt!: Date;

  @Field()
  twoFactorRequired!: boolean;

  @Field(() => String, { nullable: true })
  challengeToken?: string | null;

  @Field(() => getUserType(), { nullable: true })
  user?: UserType | null;
}

/**
 * Result of requestOtp. In dev (OTP_DEV_BYPASS=true) `devCode` carries the
 * fixed bypass code so the mobile client can auto-fill; in prod it is null and
 * the code is delivered out-of-band via the SMS provider.
 */
@ObjectType()
export class RequestOtpResult {
  @Field()
  ok!: boolean;

  /** Seconds until the most-recent code expires. */
  @Field(() => Int)
  expiresInSeconds!: number;

  @Field(() => String, { nullable: true })
  devCode?: string | null;
}

/**
 * Lazy resolver for the User class, used by AuthPayload.user's @Field above.
 * Returning the class via a function (called at schema-build time, after every
 * module has finished loading) avoids the user.type ↔ user.entity import cycle
 * that otherwise leaves the enums undefined during decorator evaluation.
 */
let _userType: any = null;
function getUserType(): any {
  if (_userType === null) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _userType = require('../../typeorm/entities/user.entity').User;
  }
  return _userType;
}