/**
 * File:        apps/api/src/booking/booking.module.ts
 * Module:      API · Booking Module
 * Purpose:     Booking feature module
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-04
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { BookingResolver } from '../graphql/resolvers/booking.resolver';
import { Booking } from '../typeorm/entities/booking.entity';
import { Seat } from '../typeorm/entities/seat.entity';
import { Payment } from '../typeorm/entities/payment.entity';
import { PubSubModule } from '../graphql/pubsub/pub-sub.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Seat, Payment]),
    CacheModule,
    PubSubModule,
  ],
  providers: [
    BookingResolver,
  ],
  exports: [BookingResolver],
})
export class BookingModule {}
