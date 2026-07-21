/**
 * File:        apps/api/src/graphql/inputs/event-attendee.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     EventAttendee inputs.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Field, InputType, ID, Int } from '@nestjs/graphql';

@InputType()
export class AddAttendeeInput {
  @Field(() => ID) eventId!: string;
  @Field(() => ID) userId!: string;
  @Field({ nullable: true }) ticketTier?: string;
  @Field(() => Int, { nullable: true }) seatNumber?: number;
  @Field({ nullable: true }) notes?: string;
}

@InputType()
export class CheckInInput {
  @Field(() => ID) eventId!: string;
  @Field(() => ID) userId!: string;
}

@InputType()
export class AttendeeFiltersInput {
  @Field(() => ID, { nullable: true }) eventId?: string;
  @Field(() => ID, { nullable: true }) userId?: string;
  @Field({ nullable: true }) checkedIn?: boolean;
  @Field(() => Int, { nullable: true }) limit?: number;
  @Field(() => Int, { nullable: true }) offset?: number;
}
