/**
 * File:        apps/api/src/subscription/subscription.module.ts
 * Module:      API · Subscription Module
 * Purpose:     Plan + Subscription + Billing feature module. M2 wired the
 *              contract layer (CRUD); M3 adds the BillingService that fans
 *              subscriptions out into bookings + invoices.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '../cache/cache.module';
import { Plan } from '../typeorm/entities/plan.entity';
import { Subscription } from '../typeorm/entities/subscription.entity';
import { Customer } from '../typeorm/entities/customer.entity';
import { CustomerEmployee } from '../typeorm/entities/customer-employee.entity';
import { Seat } from '../typeorm/entities/seat.entity';
import { Booking } from '../typeorm/entities/booking.entity';
import { Invoice } from '../typeorm/entities/invoice.entity';
import { PlanResolver } from '../graphql/resolvers/subscription.resolver';
import { BillingService } from './billing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Plan,
      Subscription,
      Customer,
      CustomerEmployee,
      Seat,
      Booking,
      Invoice,
    ]),
    CacheModule,
  ],
  providers: [PlanResolver, BillingService],
  exports: [BillingService, TypeOrmModule],
})
export class SubscriptionModule {}
