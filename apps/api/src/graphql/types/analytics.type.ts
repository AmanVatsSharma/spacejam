/**
 * File:        apps/api/src/graphql/types/analytics.type.ts
 * Module:      API · GraphQL Types
 * Purpose:     Analytics and dashboard DTOs (standalone - no entity imports)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-04
 */
import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum TimePeriod {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

registerEnumType(TimePeriod, {
  name: 'TimePeriod',
  description: 'Predefined time periods for analytics reports',
});

@ObjectType()
export class MetricTrend {
  @Field()
  value!: number;

  @Field()
  direction!: string;
}

@ObjectType()
export class DashboardMetrics {
  @Field()
  totalRevenue!: number;

  @Field()
  occupancyRate!: number;

  @Field()
  activeBookings!: number;

  @Field()
  pendingPayments!: number;

  @Field()
  totalSeats!: number;

  @Field()
  availableSeats!: number;

  @Field(() => MetricTrend, { nullable: true })
  revenueTrend!: MetricTrend | null;

  @Field(() => MetricTrend, { nullable: true })
  occupancyTrend!: MetricTrend | null;

  @Field(() => MetricTrend, { nullable: true })
  bookingsTrend!: MetricTrend | null;
}

@ObjectType()
export class RevenueMonth {
  @Field()
  month!: string;

  @Field()
  revenue!: number;

  @Field()
  target!: number;
}

@ObjectType()
export class RevenueReport {
  @Field()
  total!: number;

  @Field(() => [RevenueMonth])
  byMonth!: RevenueMonth[];

  @Field()
  growth!: number;
}

@ObjectType()
export class OccupancyDay {
  @Field()
  date!: Date;

  @Field(() => Int)
  totalBookings!: number;

  @Field()
  occupancyRate!: number;

  @Field()
  revenue!: number;
}

@ObjectType()
export class SeatTypeOccupancy {
  @Field(() => String)
  type!: string;

  @Field(() => Int)
  count!: number;

  @Field()
  occupancyRate!: number;
}

@ObjectType()
export class OccupancyReport {
  @Field(() => ID)
  centerId!: string;

  @Field(() => [OccupancyDay])
  byDay!: OccupancyDay[];

  @Field(() => [SeatTypeOccupancy])
  bySeatType!: SeatTypeOccupancy[];

  @Field()
  averageRate!: number;
}
