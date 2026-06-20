/**
 * File:        typeorm/data-source.ts
 * Module:      API · TypeORM
 * Purpose:     Standalone DataSource for CLI scripts and migrations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';

import { User } from './entities/user.entity';
import { Center } from './entities/center.entity';
import { Location } from './entities/location.entity';
import { Floor } from './entities/floor.entity';
import { Seat } from './entities/seat.entity';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { RevenueAnalytics } from './entities/revenue-analytics.entity';
import { UserSession } from './entities/user-session.entity';
import { AuditLog } from './entities/audit-log.entity';
import { Invitation } from './entities/invitation.entity';

export const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER || 'spacejam',
  password: process.env.DATABASE_PASSWORD || 'spacejam',
  database: process.env.DATABASE_NAME || 'spacejam',
  entities: [
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
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  ssl: process.env.DATABASE_SSL === 'true',
});

export default dataSource;
