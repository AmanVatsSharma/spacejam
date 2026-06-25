/**
 * File:        graphql/inputs/booking.input.ts
 * Module:      Api · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for booking mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */
import { Field, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateBookingInput {
  @Field(() => ID)
  seatId!: string;

  @Field()
  startTime!: Date;

  @Field()
  endTime!: Date;

  @Field(() => String, { nullable: true })
  notes?: string;
}

@InputType()
export class BookingFiltersInput {
  @Field(() => ID, { nullable: true })
  centerId?: string;

  @Field(() => ID, { nullable: true })
  userId?: string;

  @Field(() => String, { nullable: true })
  status?: string;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;
}