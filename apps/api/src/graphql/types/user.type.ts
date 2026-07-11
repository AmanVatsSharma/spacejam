/**
 * File:        apps/api/src/graphql/types/user.type.ts
 * Module:      API · GraphQL Types
 * Purpose:     GraphQL object types for SpaceJam domain
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { User } from '../../typeorm/entities/user.entity';

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
export enum UserRole {
  ADMIN = 'ADMIN',
  CENTER_MANAGER = 'CENTER_MANAGER',
  MEMBER = 'MEMBER',
}

export enum CenterStatus {
  ACTIVE = 'ACTIVE',
  FULL = 'FULL',
  MAINTENANCE = 'MAINTENANCE',
}

export enum SeatType {
  HOT_DESK = 'HOT_DESK',
  DEDICATED = 'DEDICATED',
  CABIN = 'CABIN',
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

  @Field(() => User, { nullable: true })
  user?: User | null;
}