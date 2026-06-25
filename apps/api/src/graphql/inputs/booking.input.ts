/**
 * File:        graphql/inputs/booking.input.ts
 * Module:      Api · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for booking mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */
import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class CreateBookingInput {
  @Field(() => ID)
  seatId!: string;

  @Field()
  startTime!: Date;

  @Field()
  endTime!: Date;

  @Field({ nullable: true })
  notes?: string;
}