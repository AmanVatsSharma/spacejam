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
import { buildSchemaOptions } from '../graphql/graphql.config';
import { TypeormConfigModule } from '../typeorm/typeorm.module';
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

@Module({
  imports: [
    // Configuration
    ConfigModule,

    // GraphQL
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [TypeOrmModule.forFeature([])],
      inject: [getDataSourceToken()],
      useFactory: (ds: import('typeorm').DataSource) => buildSchemaOptions(ds),
    }),

    // Database
    TypeormConfigModule,
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
  ],
})
export class AppModule {}