/**
 * File:        graphql/inputs/booking.input.ts
 * Module:      Api · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for booking mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsDate, IsOptional, IsUUID, IsInt, IsEmail, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

@InputType()
export class CreateBookingInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  seatId!: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  customerId?: string;

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

  /** Optional promo/offer code. If valid, the booking's discount is applied. */
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  discountCode?: string;
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

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  seatId?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  meetingRoomId?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  requestedById?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  paymentId?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  planId?: string;

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

@InputType()
export class UpdateBookingInput {
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

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}
/** One team member collected during onboarding; seatName is matched against
 *  the center's inventory seat names (optional — unmatched people get
 *  auto-assigned the next available seat). */
@InputType()
export class SeatAllocationIndividualInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  seatName?: string;
}

@InputType()
export class AllocateCustomerSeatsInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  /** HOT_DESK | DEDICATED | CABIN | MEETING_ROOM — omit/ANY for any type. */
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  seatType?: string;

  /** Booking duration in months (default 1). */
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(36)
  months?: number;

  /** Total seats wanted (individuals may be fewer — extras are unnamed). */
  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(200)
  count!: number;

  @Field(() => [SeatAllocationIndividualInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SeatAllocationIndividualInput)
  individuals?: SeatAllocationIndividualInput[];
}
