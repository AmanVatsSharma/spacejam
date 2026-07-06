/**
 * File:        apps/api/src/graphql/resolvers/analytics.resolver.ts
 * Module:      API · GraphQL Resolvers
 * Purpose:     Analytics and metrics resolvers
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { CacheService } from '../../cache/cache.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  BookingStatus,
  PaymentStatus,
  SeatStatus,
  SeatType,
} from '../types/user.type';
import {
  DashboardMetrics,
  RevenueReport,
  OccupancyReport,
  OccupancyDay,
  SeatTypeOccupancy,
  TimePeriod,
} from '../types/analytics.type';
import { Booking as BookingEntity } from '../../typeorm/entities/booking.entity';
import { Seat as SeatEntity } from '../../typeorm/entities/seat.entity';
import { Payment as PaymentEntity } from '../../typeorm/entities/payment.entity';

@Resolver(() => DashboardMetrics)
export class AnalyticsResolver {
  constructor(
    private cache: CacheService,
    @InjectRepository(BookingEntity)
    private bookingRepo: Repository<BookingEntity>,
    @InjectRepository(SeatEntity)
    private seatRepo: Repository<SeatEntity>,
    @InjectRepository(PaymentEntity)
    private paymentRepo: Repository<PaymentEntity>,
  ) {}

  @Query(() => DashboardMetrics)
  async dashboardMetrics(
    @Args('centerId', { type: () => ID, nullable: true }) centerId?: string
  ): Promise<DashboardMetrics> {
    const cacheKey = centerId ? `metrics:dashboard:${centerId}` : 'metrics:dashboard:global';

    return this.cache.getOrSet<DashboardMetrics>(async () => {
      const where: any = centerId ? { centerId } : {};
      const now = new Date();
      const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

      const recentBookings = await this.bookingRepo.find({
        where: {
          ...where,
          status: 'CONFIRMED',
          createdAt: { $gte: thirtyDaysAgo }
        } as any,
        relations: ['seat', 'payment'],
      });

      // Calculate metrics
      const totalRevenue = recentBookings
        .filter(b => b.payment?.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.totalPrice, 0);

      const activeBookings = recentBookings.filter(
        b => b.status === BookingStatus.CONFIRMED
      ).length;

      // Calculate occupancy
      const seatWhere: any = centerId ? { floor: { centerId } } : {};
      const totalSeats = await this.seatRepo.count({
        where: seatWhere as any,
      });

      const occupiedSeats = await this.seatRepo.count({
        where: {
          status: SeatStatus.OCCUPIED,
          ...(centerId ? { floor: { centerId } } : {})
        } as any,
      });

      const occupancyRate = totalSeats > 0 ? occupiedSeats / totalSeats : 0;

      // Pending payments
      const pendingPayments = await this.bookingRepo.find({
        where: {
          ...where,
          status: 'CONFIRMED',
          payment: { status: PaymentStatus.PENDING }
        } as any,
      });

      const pendingAmount = pendingPayments.reduce(
        (sum, b) => sum + b.totalPrice, 0
      );

      // Upcoming maintenance
      const upcomingMaintenance = await this.seatRepo.find({
        where: {
          status: SeatStatus.MAINTENANCE,
          ...(centerId ? { floor: { centerId } } : {})
        } as any,
      });

      return {
        totalRevenue,
        occupancyRate,
        activeBookings,
        pendingPayments: pendingAmount,
        upcomingMaintenance: upcomingMaintenance as any,
        totalSeats,
        availableSeats: totalSeats - occupiedSeats,
      };
    }, 1800); // Cache for 30 minutes
  }

  @Query(() => RevenueReport)
  async revenueReport(
    @Args('centerId', { type: () => ID, nullable: true }) centerId?: string,
    @Args('period', { type: () => TimePeriod, nullable: true }) period?: TimePeriod
  ): Promise<RevenueReport> {
    const cacheKey = centerId ? `revenue:report:${centerId}` : 'revenue:report:global';

    return this.cache.getOrSet<RevenueReport>(async () => {
      const now = new Date();
      let dateRange = { since: new Date(), until: now };

      switch (period) {
        case 'month':
          dateRange.since = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          dateRange.since = new Date(
            now.getFullYear(),
            Math.floor(now.getMonth() / 3) * 3,
            1
          );
          break;
        case 'year':
          dateRange.since = new Date(now.getFullYear(), 0, 1);
          break;
      }

      if (centerId) {
        // For center-specific, join through booking
        const bookings = await this.bookingRepo.find({
          where: {
            centerId,
            createdAt: { $gte: dateRange.since, $lte: dateRange.until }
          } as any,
          relations: ['payment'],
        });

        const totalRevenue = bookings
          .filter(b => b.payment?.status === PaymentStatus.COMPLETED)
          .reduce((sum, b) => sum + b.totalPrice, 0);

        // Calculate month-by-month breakdown
        const byMonth: { month: string; revenue: number; target: number }[] = [];
        const yearBase = dateRange.since.getFullYear();

        for (let i = 0; i < 12; i++) {
          const monthStart = new Date(yearBase, dateRange.since.getMonth() + i, 1);
          const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

          const monthRevenue = bookings
            .filter(b => b.createdAt >= monthStart && b.createdAt <= monthEnd)
            .reduce((sum, b) => sum + b.totalPrice, 0);

          if (monthRevenue > 0) {
            byMonth.push({
              month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
              revenue: monthRevenue,
              target: 1000000,
            });
          }
        }

        // Calculate growth compared to previous period
        const prevPeriodEnd = new Date(dateRange.since);
        const prevPeriodStart = new Date(prevPeriodEnd);
        prevPeriodStart.setFullYear(prevPeriodStart.getFullYear() - 1);

        const prevBookings = await this.bookingRepo.find({
          where: {
            centerId,
            createdAt: { $gte: prevPeriodStart, $lte: prevPeriodEnd }
          } as any,
        });

        const prevRevenue = prevBookings.reduce((sum, b) => sum + b.totalPrice, 0);
        const growth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

        return {
          total: totalRevenue,
          byMonth,
          growth,
        };
      }

      // Default global calculation
      const payments = await this.paymentRepo.find({
        where: {
          status: PaymentStatus.COMPLETED,
          createdAt: { $gte: dateRange.since, $lte: dateRange.until }
        } as any,
        relations: ['booking'],
      });

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

      return {
        total: totalRevenue,
        byMonth: [],
        growth: 0,
      };
    }, 86400); // Cache for 24 hours
  }

  @Query(() => OccupancyReport)
  async occupancyReport(
    @Args('centerId', { type: () => ID }) centerId: string,
    @Args('period', { type: () => TimePeriod, nullable: true }) period: TimePeriod = TimePeriod.MONTH
  ): Promise<OccupancyReport> {
    const now = new Date();
    let dateRange = { since: new Date(), until: now };

    switch (period) {
      case 'week':
        dateRange.since = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        dateRange.since = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    // Get all bookings in the period
    const bookings = await this.bookingRepo.find({
      where: {
        centerId,
        createdAt: { $gte: dateRange.since, $lte: dateRange.until }
      } as any,
      relations: ['seat'],
    });

    // Daily occupancy
    const byDay: OccupancyDay[] = [];
    const seatTypeOccupancies: SeatTypeOccupancy[] = [];
    const seatTypes: SeatType[] = ['HOT_DESK', 'DEDICATED', 'CABIN'];

    for (let d = new Date(dateRange.since); d <= dateRange.until; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      const dayBookings = bookings.filter(
        b => b.createdAt >= dayStart && b.createdAt <= dayEnd
      );

      const totalSeats = await this.seatRepo.count({
        where: { floor: { centerId } } as any,
      });

      const occupiedSeats = await this.seatRepo.count({
        where: {
          status: SeatStatus.OCCUPIED,
          floor: { centerId }
        } as any,
      });

      byDay.push({
        date: new Date(d),
        totalBookings: dayBookings.length,
        occupancyRate: totalSeats > 0 ? occupiedSeats / totalSeats : 0,
        revenue: dayBookings
          .filter(b => b.payment?.status === PaymentStatus.COMPLETED)
          .reduce((sum, b) => sum + b.totalPrice, 0),
      });
    }

    // By seat type
    for (const type of seatTypes) {
      const seats = await this.seatRepo.count({
        where: {
          type,
          floor: { centerId }
        } as any,
      });

      const occupied = await this.seatRepo.count({
        where: {
          type,
          status: SeatStatus.OCCUPIED,
          floor: { centerId }
        } as any,
      });

      seatTypeOccupancies.push({
        type,
        count: seats,
        occupancyRate: seats > 0 ? occupied / seats : 0,
      });
    }

    // Calculate average
    const totalAverage =
      byDay.reduce((sum, day) => sum + day.occupancyRate, 0) / byDay.length;

    return {
      centerId,
      byDay,
      bySeatType: seatTypeOccupancies,
      averageRate: totalAverage,
    };
  }
}
