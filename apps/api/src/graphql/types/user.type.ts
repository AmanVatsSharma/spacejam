/**
 * File:        apps/api/src/graphql/types/user.type.ts
 * Module:      API · GraphQL Types
 * Purpose:     GraphQL object types for SpaceJam domain
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';

// Enums
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

registerEnumType(UserRole, { name: 'UserRole' });
registerEnumType(CenterStatus, { name: 'CenterStatus' });
registerEnumType(SeatType, { name: 'SeatType' });
registerEnumType(SeatStatus, { name: 'SeatStatus' });
registerEnumType(BookingStatus, { name: 'BookingStatus' });
registerEnumType(PaymentMethod, { name: 'PaymentMethod' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });

// Object Types
@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field(() => UserRole)
  role!: UserRole;

  @Field({ nullable: true })
  centerId?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  avatar?: string;

  @Field()
  isActive!: boolean;

  @Field()
  active!: boolean;

  @Field()
  emailVerified!: boolean;

  @Field()
  twoFactorEnabled!: boolean;

  @Field({ nullable: true })
  lastLogin?: Date;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

@ObjectType()
export class Location {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  city!: string;

  @Field()
  state!: string;

  @Field()
  country!: string;

  @Field()
  fullAddress!: string;

  @Field({ nullable: true })
  coordinates?: string;

  @Field()
  timezone!: string;
}

@ObjectType()
export class Center {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => ID)
  locationId!: string;

  @Field(() => CenterStatus)
  status!: CenterStatus;

  @Field({ nullable: true })
  settings?: any;

  @Field()
  owner!: string;

  @Field(() => Location, { nullable: true })
  location?: Location;

  @Field(() => [Floor])
  floors?: Floor[];

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class Floor {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  centerId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  layout?: any;

  @Field()
  totalSeats!: number;

  @Field()
  active!: boolean;

  @Field(() => [Seat])
  seats?: Seat[];
}

@ObjectType()
export class Seat {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  floorId!: string;

  @Field()
  number!: string;

  @Field(() => SeatType)
  type!: SeatType;

  @Field({ nullable: true })
  features?: any;

  @Field({ nullable: true })
  location?: string;

  @Field()
  price!: number;

  @Field(() => SeatStatus)
  status!: SeatStatus;
}

@ObjectType()
export class Booking {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  userId!: string;

  @Field(() => ID)
  seatId!: string;

  @Field(() => ID)
  centerId!: string;

  @Field(() => ID, { nullable: true })
  planId?: string;

  @Field()
  startDate!: Date;

  @Field()
  endDate!: Date;

  @Field(() => BookingStatus)
  status!: BookingStatus;

  @Field(() => ID, { nullable: true })
  paymentId?: string;

  @Field()
  totalPrice!: number;

  @Field()
  discount!: number;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => Seat, { nullable: true })
  seat?: Seat;

  @Field(() => Payment, { nullable: true })
  payment?: Payment;

  @Field()
  createdAt!: Date;
}

@ObjectType()
export class Payment {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  bookingId!: string;

  @Field()
  amount!: number;

  @Field()
  currency!: string;

  @Field(() => PaymentMethod)
  method!: PaymentMethod;

  @Field(() => PaymentStatus)
  status!: PaymentStatus;

  @Field({ nullable: true })
  transactionId?: string;

  @Field({ nullable: true })
  gatewayRef?: string;
}

@ObjectType()
export class RevenueAnalytics {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  centerId!: string;

  @Field()
  date!: Date;

  @Field()
  revenue!: number;

  @Field()
  occupancyRate!: number;

  @Field()
  newBookings!: number;

  @Field()
  cancelledBookings!: number;
}

@ObjectType()
export class DashboardMetrics {
  @Field()
  totalRevenue!: number;

  @Field()
  occupancyRate!: number;

  @Field()
  activeBookings!: number;

  @Field()
  pendingPayments!: number;

  @Field(() => [Seat])
  upcomingMaintenance!: Seat[];

  @Field()
  totalSeats!: number;

  @Field()
  availableSeats!: number;
}

@ObjectType()
export class RevenueMonth {
  @Field()
  month!: string;

  @Field()
  revenue!: number;

  @Field()
  target!: number;
}

@ObjectType()
export class RevenueReport {
  @Field()
  total!: number;

  @Field(() => [RevenueMonth])
  byMonth!: RevenueMonth[];

  @Field()
  growth!: number;
}

/**
 * Result of a successful authentication. Either tokens are populated OR
 * `twoFactorRequired` is true and `challengeToken` carries a short-lived
 * credential for `verifyTwoFactor`.
 */
@ObjectType()
export class AuthPayload {
  @Field(() => User, { nullable: true })
  user?: User | null;

  @Field({ nullable: true })
  accessToken?: string | null;

  @Field({ nullable: true })
  refreshToken?: string | null;

  @Field({ nullable: true })
  expiresIn?: number | null;

  @Field()
  accessTokenExpiresAt!: Date;

  @Field()
  refreshTokenExpiresAt!: Date;

  @Field()
  twoFactorRequired!: boolean;

  @Field({ nullable: true })
  challengeToken?: string | null;
}