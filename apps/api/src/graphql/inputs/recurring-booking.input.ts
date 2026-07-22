/**
 * File:        apps/api/src/graphql/inputs/recurring-booking.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     RecurringBooking create input.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Field, InputType, ID, Int } from '@nestjs/graphql';
import { RecurrencePatternEnum } from '../enums/recurrence-pattern.enum';

@InputType()
export class CreateRecurringBookingInput {
  @Field() title!: string;
  @Field(() => ID) roomId!: string;
  @Field(() => ID) centerId!: string;
  @Field(() => ID, { nullable: true }) userId?: string;
  @Field(() => RecurrencePatternEnum) pattern!: RecurrencePatternEnum;
  @Field(() => [Int], { nullable: true }) daysOfWeek?: number[];
  @Field() startDate!: string;
  @Field() endDate!: string;
  @Field() startTime!: string;
  @Field() endTime!: string;
  @Field({ nullable: true }) notes?: string;
}
