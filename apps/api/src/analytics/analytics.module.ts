/**
 * File:        apps/api/src/analytics/analytics.module.ts
 * Module:      API · Analytics Module
 * Purpose:     Analytics feature module
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-04
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { AnalyticsResolver } from '../graphql/resolvers/analytics.resolver';
import { Booking } from '../typeorm/entities/booking.entity';
import { Seat } from '../typeorm/entities/seat.entity';
import { Payment } from '../typeorm/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Seat, Payment]),
    CacheModule,
  ],
  providers: [
    AnalyticsResolver,
  ],
  exports: [AnalyticsResolver],
})
export class AnalyticsModule {}
