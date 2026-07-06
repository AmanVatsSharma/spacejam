/**
 * File:        apps/api/src/app/app.module.ts
 * Module:      API · Main Application Module
 * Purpose:     Main application module with all features
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { LoggerModule } from 'nestjs-pino';
import { buildSchemaOptions } from '../graphql/graphql.config';
import { TypeOrmConfigModule } from '../typeorm/typeorm.module';
import { TypeOrmModule, getDataSourceToken } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '../config/module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RevenueModule } from '../revenue';
import { CrmModule } from '../crm/crm.module';
import { BookingModule } from '../booking/booking.module';
import { CenterModule } from '../center/center.module';
import { EventModule } from '../event/event.module';
import { MeetingRoomModule } from '../meeting-room/meeting-room.module';
import { RequestModule } from '../request/request.module';
import { UserModule } from '../user/user.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        autoLogging: true,
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true, colorize: true, translateTime: 'SYS:HH:MM:ss.l' } },
        genReqId: (req, res) => {
          const existing = req.headers['x-request-id'];
          if (existing) { res.setHeader('x-request-id', existing as string); return existing as string; }
          const id = (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).toUpperCase();
          res.setHeader('x-request-id', id); return id;
        },
      },
    }),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [TypeOrmModule.forFeature([])],
      inject: [getDataSourceToken()],
      useFactory: (ds: import('typeorm').DataSource) => buildSchemaOptions(ds),
    }),
    TypeOrmConfigModule,
    CacheModule,
    AuthModule,
    RevenueModule,
    CrmModule,
    BookingModule,
    CenterModule,
    EventModule,
    MeetingRoomModule,
    RequestModule,
    UserModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
