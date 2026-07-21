/**
 * File:        apps/api/src/meeting-room/meeting-room.module.ts
 * Module:      API · Meeting Room Module
 * Purpose:     Meeting Room feature module
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-04
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { MeetingRoomResolver } from '../graphql/resolvers/meeting-room.resolver';
import { MeetingRoom } from '../typeorm/entities/meeting-room.entity';
import { Booking } from '../typeorm/entities/booking.entity';
import { Notification } from '../typeorm/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MeetingRoom, Booking, Notification]),
    CacheModule,
  ],
  providers: [
    MeetingRoomResolver,
  ],
  exports: [MeetingRoomResolver],
})
export class MeetingRoomModule {}
