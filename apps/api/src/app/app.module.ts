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
import { TypeormConfigModule } from '../typeorm/typeorm.module';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    // Configuration
    ConfigModule,

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: process.env.NODE_ENV !== 'production',
      autoSchemaFile: true,
      sortSchema: true,
      introspection: process.env.NODE_ENV !== 'production',
      context: ({ req, res }) => ({ req, res }),
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
    ]),

    // Caching
    CacheModule,

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
  ],
})
export class AppModule {}