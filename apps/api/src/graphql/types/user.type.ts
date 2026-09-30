/**
 * File:        apps/api/src/graphql/types/user.type.ts
 * Module:      API · GraphQL Types
 * Purpose:     GraphQL object types for SpaceJam domain.
 *              All enums are defined in common/enums.ts and imported here
 *              so that entity files can import enums without touching this
 *              file — breaking the circular dependency chain that caused
 *              "Cannot read properties of undefined" in the webpack bundle.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-09-30
 */

import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  UserRole,
  RoomType,
  RoomStatus,
  EventType,
  EventStatus,
  NotificationType,
  NotificationPriority,
  RequestType,
  RequestStatus,
  CenterStatus,
  SeatType,
  SeatStatus,
  BookingStatus,
  BillingCycle,
  PlanStatus,
  SubscriptionStatus,
  PaymentMethod,
  PaymentStatus,
  RecurrencePatternEnum,
  LeadStatus,
  LeadSource,
  InvoiceStatus,
  PaymentFrequency,
  ContractStatus,
  DepositStatus,
  DepositType,
  OnboardingStatus,
  CustomerStatus,
} from '../../common/enums.ts';

// NOTE: User entity is resolved lazily (not a static top-level import) to
// avoid the TS-hoist circular import that would leave enums undefined at
// decorator-evaluation time.
type UserType = import('../../typeorm/entities/user.entity').User;

// ============================================================================
// ENUMS - Registered for GraphQL
// ============================================================================
registerEnumType(RoomType, { name: 'RoomType' });
registerEnumType(RoomStatus, { name: 'RoomStatus' });
registerEnumType(EventType, { name: 'EventType' });
registerEnumType(EventStatus, { name: 'EventStatus' });
registerEnumType(RequestType, { name: 'RequestType' });
registerEnumType(RequestStatus, { name: 'RequestStatus' });
registerEnumType(NotificationType, { name: 'NotificationType' });
registerEnumType(NotificationPriority, { name: 'NotificationPriority' });
registerEnumType(RecurrencePatternEnum, { name: 'RecurrencePattern' });
registerEnumType(LeadStatus, { name: 'LeadStatus' });
registerEnumType(LeadSource, { name: 'LeadSource' });
registerEnumType(OnboardingStatus, { name: 'OnboardingStatus' });
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
// M2 enums — registered here (after declaration) so module-eval order is safe.
registerEnumType(BillingCycle, { name: 'BillingCycle' });
registerEnumType(PlanStatus, { name: 'PlanStatus' });
registerEnumType(SubscriptionStatus, { name: 'SubscriptionStatus' });

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
