/**
 * File:        apps/api/src/graphql/inputs/plan.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     Input DTOs for Plan CRUD
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Field, ID, InputType, Int, Float } from '@nestjs/graphql';
import {
  BillingCycle,
  PlanStatus,
  SeatType,
} from '../types/user.type';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

@InputType()
export class CreatePlanInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  centerId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => SeatType)
  @IsEnum(SeatType)
  seatType!: SeatType;

  @Field(() => BillingCycle, { nullable: true, defaultValue: BillingCycle.MONTHLY })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price!: number;

  @Field({ nullable: true, defaultValue: 'INR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  minSeats?: number;

  @Field(() => PlanStatus, { nullable: true, defaultValue: PlanStatus.ACTIVE })
  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;
}

@InputType()
export class UpdatePlanInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => SeatType, { nullable: true })
  @IsEnum(SeatType)
  @IsOptional()
  seatType?: SeatType;

  @Field(() => BillingCycle, { nullable: true })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  currency?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  minSeats?: number;

  @Field(() => PlanStatus, { nullable: true })
  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;
}

@InputType()
export class PlanFiltersInput {
  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field(() => SeatType, { nullable: true })
  @IsEnum(SeatType)
  @IsOptional()
  seatType?: SeatType;

  @Field(() => BillingCycle, { nullable: true })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @Field(() => PlanStatus, { nullable: true })
  @IsEnum(PlanStatus)
  @IsOptional()
  status?: PlanStatus;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @Max(200)
  @IsOptional()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}
