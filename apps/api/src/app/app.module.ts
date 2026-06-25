/**
 * File:        apps/api/src/app/app.module.ts
 * Module:      API · Main Application Module
 * Purpose:     Main application module with all features
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
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
import { UserResolver } from '../graphql/resolvers/user.resolver';
import { AuthResolver } from '../graphql/resolvers/auth.resolver';
import { CenterResolver } from '../graphql/resolvers/center.resolver';
import { BookingResolver } from '../graphql/resolvers/booking.resolver';
import { AnalyticsResolver } from '../graphql/resolvers/analytics.resolver';
import { GqlDataLoaders } from '../graphql/dataloaders';
import { FieldRateLimitGuard } from '../graphql/guards/field-rate-limit.guard';
import { PubSubModule } from '../graphql/pubsub/pub-sub.module';
import { ObservabilityModule } from '../observability/observability.module';
import { MetricsService } from '../observability/metrics.service';
import { User } from '../typeorm/entities/user.entity';
import { Center } from '../typeorm/entities/center.entity';
import { Location } from '../typeorm/entities/location.entity';
import { Floor } from '../typeorm/entities/floor.entity';
import { Seat } from '../typeorm/entities/seat.entity';
import { Booking } from '../typeorm/entities/booking.entity';
import { Payment } from '../typeorm/entities/payment.entity';
import { RevenueAnalytics } from '../typeorm/entities/revenue-analytics.entity';
import { UserSession } from '../typeorm/entities/user-session.entity';
import { AuditLog } from '../typeorm/entities/audit-log.entity';
import { Invitation } from '../typeorm/entities/invitation.entity';
import { RecoveryCode } from '../typeorm/entities/recovery-code.entity';
import { MagicLinkToken } from '../typeorm/entities/magic-link-token.entity';

import { UserRepository } from '../typeorm/repositories/user.repository';
import { CenterRepository } from '../typeorm/repositories/center.repository';
import { SeatRepository } from '../typeorm/repositories/seat.repository';
import { BookingRepository } from '../typeorm/repositories/booking.repository';

@Module({
  imports: [
    // Configuration
    ConfigModule,

    // Structured logging via pino. LOG_LEVEL controls verbosity.
    // In production, logs are newline-delimited JSON; in dev, pretty.
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        autoLogging: true,
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                  translateTime: 'SYS:HH:MM:ss.l',
                },
              },
        // Add request id to every log emitted during the request
        genReqId: (req, res) => {
          const existing = req.headers['x-request-id'];
          if (existing) {
            res.setHeader('x-request-id', existing as string);
            return existing as string;
          }
          const id =
            (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)).toUpperCase();
          res.setHeader('x-request-id', id);
          return id;
        },
      },
    }),

    // GraphQL
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [TypeOrmModule.forFeature([])],
      inject: [getDataSourceToken(), MetricsService],
      useFactory: (
        ds: import('typeorm').DataSource,
        metrics: MetricsService,
      ) => buildSchemaOptions(ds, metrics),
    }),

    // Database
    TypeOrmConfigModule,
    TypeOrmModule.forFeature([
      User,
      Center,
      Location,
      Floor,
      Seat,
      Booking,
      Payment,
      RevenueAnalytics,
      UserSession,
      AuditLog,
      Invitation,
      RecoveryCode,
      MagicLinkToken,
    ]),

    // Caching
    CacheModule,

    // Real-time pub/sub (singleton)
    PubSubModule,

    // Metrics, traces, structured logging
    ObservabilityModule,

    // Authentication
    AuthModule,

    // Features
    RevenueModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    UserResolver,
    AuthResolver,
    CenterResolver,
    BookingResolver,
    AnalyticsResolver,
    GqlDataLoaders,
    FieldRateLimitGuard,
    UserRepository,
    CenterRepository,
    SeatRepository,
    BookingRepository,
  ],
})
export class AppModule {}