/**
 * File:        apps/api/src/notification/notification.module.ts
 * Module:      API · Notification Module
 * Purpose:     Notification feature module
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-11
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { NotificationResolver } from '../graphql/resolvers/notification.resolver';
import { Notification } from '../typeorm/entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    CacheModule,
  ],
  providers: [NotificationResolver],
  exports: [NotificationResolver],
})
export class NotificationModule {}
