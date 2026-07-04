/**
 * File:        apps/api/src/event/event.module.ts
 * Module:      API · Event Module
 * Purpose:     Event feature module
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-04
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { EventResolver } from '../graphql/resolvers/event.resolver';
import { Event } from '../typeorm/entities/event.entity';
import { MeetingRoom } from '../typeorm/entities/meeting-room.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, MeetingRoom]),
    CacheModule,
  ],
  providers: [
    EventResolver,
  ],
  exports: [EventResolver],
})
export class EventModule {}
