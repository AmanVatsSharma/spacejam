/**
 * File:        common/enums.ts
 * Module:      Api · Common
 * Purpose:     Canonical enum definitions shared across the API.
 *              Owned here (not in auth/roles.enum.ts or graphql/types)
 *              to break the circular dependency with user.type.ts.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-09-30
 */

// User roles and auth state
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CENTER_MANAGER = 'CENTER_MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  MEMBER = 'MEMBER',
}

export enum CenterStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  PENDING = 'PENDING',
}

export enum CustomerStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  EXPIRING_SOON = 'Expiring Soon',
  UPGRADED = 'Upgraded',
}

// Meeting-room / space enums
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

// Booking enums
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  CHECKED_OUT = 'CHECKED_OUT',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

// Event enums
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

// Notification enums
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

// Request enums
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

// Subscription / billing enums
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

// Payment enums
export enum PaymentMethod {
  CARD = 'CARD',
  UPI = 'UPI',
  WALLET = 'WALLET',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  NET_BANKING = 'NET_BANKING',
  ONLINE = 'ONLINE',
  QR = 'QR',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
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

export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
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

// Lead enums
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

export enum OnboardingStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum RecurrencePatternEnum {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}
