/**
 * File:        apps/api/src/typeorm/typeorm.module.ts
 * Module:      API · TypeORM Configuration
 * Purpose:     TypeORM DataSource and module setup
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeormService } from './typeorm.service';
import { User } from './entities/user.entity';
import { UserSession } from './entities/user-session.entity';
import { RecoveryCode } from './entities/recovery-code.entity';
import { MagicLinkToken } from './entities/magic-link-token.entity';
import { Invitation } from './entities/invitation.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Location } from './entities/location.entity';
import { Center } from './entities/center.entity';
import { Floor } from './entities/floor.entity';
import { Seat } from './entities/seat.entity';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { RevenueAnalytics } from './entities/revenue-analytics.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => ({
        type: 'postgres',
        host: config.get<string>('DATABASE_HOST') || 'localhost',
        port: parseInt(config.get<string>('DATABASE_PORT')) || 5432,
        username: config.get<string>('DATABASE_USER') || 'spacejam',
        password: config.get<string>('DATABASE_PASSWORD') || 'spacejam',
        database: config.get<string>('DATABASE_NAME') || 'spacejam',
        entities: [
          User,
          UserSession,
          RecoveryCode,
          MagicLinkToken,
          Invitation,
          AuditLog,
          Location,
          Center,
          Floor,
          Seat,
          Booking,
          Payment,
          RevenueAnalytics,
        ],
        synchronize: true,
        logging: process.env.NODE_ENV === 'development',
        ssl: config.get<string>('DATABASE_SSL') === 'true',
        extra: {
          max: parseInt(config.get<string>('DATABASE_POOL_SIZE')) || 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        },
      }),
    }),
  ],
  providers: [TypeormService],
  exports: [TypeOrmModule, TypeormService],
})
export class TypeOrmConfigModule {}