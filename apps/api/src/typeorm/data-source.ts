/**
 * File:        typeorm/data-source.ts
 * Module:      API · TypeORM
 * Purpose:     Standalone DataSource for CLI scripts and migrations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { RecoveryCode } from './entities/recovery-code.entity';
import { MagicLinkToken } from './entities/magic-link-token.entity';
import { Invitation } from './entities/invitation.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Location } from './entities/location.entity';
import { Center } from './entities/center.entity';
import { Floor } from './entities/floor.entity';
import { Seat } from './entities/seat.entity';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { RevenueAnalytics } from './entities/revenue-analytics.entity';
import { Lead } from './entities/lead.entity';
import { MeetingRoom } from './entities/meeting-room.entity';
import { Event } from './entities/event.entity';
import { Request } from './entities/request.entity';
import { Deposit } from './entities/deposit.entity';
import { Invoice } from './entities/invoice.entity';
import { Contract } from './entities/contract.entity';
import { Customer } from './entities/customer.entity';
import { CustomerDocument } from './entities/customer-document.entity';
import { CustomerEmployee } from './entities/customer-employee.entity';
import { Notification } from './entities/notification.entity';
import { Discount } from './entities/discount.entity';
import { Equipment } from './entities/equipment.entity';
import { EventAttendee } from './entities/event-attendee.entity';
import { EventTicketTier } from './entities/event-ticket-tier.entity';
import { RecurringBooking } from './entities/recurring-booking.entity';
import { ScheduledReport } from './entities/scheduled-report.entity';
import { CalendarConnection } from './entities/calendar-connection.entity';
import { NotificationAutomation } from './entities/notification-automation.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { PrintJob } from './entities/print-job.entity';
import { Offer, OfferRedemption } from './entities/offer.entity';
import { SupportTicket, SupportMessage } from './entities/support-ticket.entity';
import { Referral } from './entities/referral.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
// M1–M3 entities
import { OtpRequest } from './entities/otp-request.entity';
import { Plan } from './entities/plan.entity';
import { Subscription } from './entities/subscription.entity';
import { AppSetting } from './entities/app-setting.entity';


export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER || 'spacejam',
  password: process.env.DATABASE_PASSWORD || 'spacejam',
  database: process.env.DATABASE_NAME || 'spacejam',
  entities: [
  User,
  UserSession,
  RecoveryCode,
  MagicLinkToken,
  Invitation,
  AuditLog,
  Location,
  Center,
  Floor,
  Seat,
  Booking,
  Payment,
  RevenueAnalytics,
  Lead,
  MeetingRoom,
  Event,
  Request,
  Customer,
  CustomerDocument,
  CustomerEmployee,
  Deposit,
  Invoice,
  Contract,
  Notification,
  Discount,
  Equipment,
  EventAttendee,
  EventTicketTier,
  RecurringBooking,
  ScheduledReport,
  CalendarConnection,
  NotificationAutomation,
  // Mobile feature parity entities (added 2026-08-05)
  WalletTransaction,
  PrintJob,
  Offer,
  OfferRedemption,
  SupportTicket,
  SupportMessage,
  Referral,
  NotificationPreference,
  // M1–M3 entities
  OtpRequest,
  Plan,
  Subscription,
  // Integrations
  AppSetting,
],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DATABASE_SSL === 'true',
});

