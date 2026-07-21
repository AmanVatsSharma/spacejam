/**
 * File:        apps/api/src/enterprise/enterprise.module.ts
 * Module:      API · Enterprise Module
 * Purpose:     Bundles enterprise features — audit log, equipment,
 *              event attendees, ticket tiers, recurring bookings,
 *              scheduled reports, calendar sync.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';

import { AuditLog } from '../typeorm/entities/audit-log.entity';
import { Equipment } from '../typeorm/entities/equipment.entity';
import { EventAttendee } from '../typeorm/entities/event-attendee.entity';
import { EventTicketTier } from '../typeorm/entities/event-ticket-tier.entity';
import { RecurringBooking } from '../typeorm/entities/recurring-booking.entity';
import { ScheduledReport } from '../typeorm/entities/scheduled-report.entity';
import { CalendarConnection } from '../typeorm/entities/calendar-connection.entity';

import { AuditLogResolver } from '../graphql/resolvers/audit-log.resolver';
import { EquipmentResolver } from '../graphql/resolvers/equipment.resolver';
import { EventAttendeeResolver } from '../graphql/resolvers/event-attendee.resolver';
import { EventTicketTierResolver } from '../graphql/resolvers/event-ticket-tier.resolver';
import { RecurringBookingResolver } from '../graphql/resolvers/recurring-booking.resolver';
import { ScheduledReportResolver } from '../graphql/resolvers/scheduled-report.resolver';
import { CalendarSyncResolver } from '../graphql/resolvers/calendar-sync.resolver';

import { ScheduledReportsService } from './scheduled-reports.service';
import { CalendarSyncService } from './calendar-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditLog,
      Equipment,
      EventAttendee,
      EventTicketTier,
      RecurringBooking,
      ScheduledReport,
      CalendarConnection,
    ]),
    CacheModule,
  ],
  providers: [
    AuditLogResolver,
    EquipmentResolver,
    EventAttendeeResolver,
    EventTicketTierResolver,
    RecurringBookingResolver,
    ScheduledReportResolver,
    CalendarSyncResolver,
    ScheduledReportsService,
    CalendarSyncService,
  ],
  exports: [
    AuditLogResolver,
    EquipmentResolver,
    EventAttendeeResolver,
    EventTicketTierResolver,
    RecurringBookingResolver,
    ScheduledReportResolver,
    CalendarSyncResolver,
  ],
})
export class EnterpriseModule {}
