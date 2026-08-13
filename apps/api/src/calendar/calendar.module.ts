/**
 * File:        apps/api/src/calendar/calendar.module.ts
 * Module:      API · Calendar Module
 * Purpose:     Provides the Visit and Calendar (unified feed) resolvers.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-13
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitResolver } from '../graphql/resolvers/visit.resolver';
import { CalendarResolver } from '../graphql/resolvers/calendar.resolver';
import { Visit } from '../typeorm/entities/visit.entity';
import { Event } from '../typeorm/entities/event.entity';
import { Booking } from '../typeorm/entities/booking.entity';
import { Customer } from '../typeorm/entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Visit, Event, Booking, Customer])],
  providers: [VisitResolver, CalendarResolver],
  exports: [VisitResolver, CalendarResolver],
})
export class CalendarModule {}
