/**
 * File:        graphql/inputs/booking.input.ts
 * Module:      Api · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for booking mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsDate, IsOptional, IsUUID, IsInt } from 'class-validator';

@InputType()
export class CreateBookingInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  seatId!: string;

  @Field()
  @IsDate()
  @IsNotEmpty()
  startTime!: Date;

  @Field()
  @IsDate()
  @IsNotEmpty()
  endTime!: Date;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class BookingFiltersInput {
  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  centerId?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  offset?: number;
}