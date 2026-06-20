/**
 * File:        apps/api/src/typeorm/typeorm.service.ts
 * Module:      API · TypeORM Service
 * Purpose:     Custom TypeORM data source service with repository support
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
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

@Injectable()
export class TypeormService implements OnModuleDestroy {
  constructor(private dataSource: DataSource) {}

  async onModuleDestroy() {
    await this.dataSource.destroy();
  }

  // User Repository
  get userRepository(): Repository<User> {
    return this.dataSource.getRepository(User);
  }

  // Center Repository
  get centerRepository(): Repository<Center> {
    return this.dataSource.getRepository(Center);
  }

  // Location Repository
  get locationRepository(): Repository<Location> {
    return this.dataSource.getRepository(Location);
  }

  // Floor Repository
  get floorRepository(): Repository<Floor> {
    return this.dataSource.getRepository(Floor);
  }

  // Seat Repository
  get seatRepository(): Repository<Seat> {
    return this.dataSource.getRepository(Seat);
  }

  // Booking Repository
  get bookingRepository(): Repository<Booking> {
    return this.dataSource.getRepository(Booking);
  }

  // Payment Repository
  get paymentRepository(): Repository<Payment> {
    return this.dataSource.getRepository(Payment);
  }

  // Analytics Repository
  get analyticsRepository(): Repository<RevenueAnalytics> {
    return this.dataSource.getRepository(RevenueAnalytics);
  }

  // Session Repository
  get sessionRepository(): Repository<UserSession> {
    return this.dataSource.getRepository(UserSession);
  }

  // Audit Repository
  get auditRepository(): Repository<AuditLog> {
    return this.dataSource.getRepository(AuditLog);
  }

  // Invitation Repository
  get invitationRepository(): Repository<Invitation> {
    return this.dataSource.getRepository(Invitation);
  }

  // Health check
  async isConnected(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  // Get query runner for transactions
  getQueryRunner() {
    return this.dataSource.createQueryRunner();
  }

  // Custom query executor
  async query(sql: string, params?: any[]): Promise<any> {
    return this.dataSource.query(sql, params);
  }
}