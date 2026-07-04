/**
 * File:        apps/api/src/graphql/types/analytics.type.ts
 * Module:      API · GraphQL Types
 * Purpose:     Analytics and dashboard DTOs (standalone - no entity imports)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-04
 */
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

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
