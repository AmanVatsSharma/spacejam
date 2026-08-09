/**
 * File:        apps/api/src/graphql/inputs/subscription.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     Input DTOs for Subscription CRUD + lifecycle (suspend/cancel)
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { SubscriptionStatus } from '../types/user.type';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

@InputType()
export class CreateSubscriptionInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  planId!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  seatCount!: number;

  /** ISO date for the first billing period start. Defaults to now server-side. */
  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @Field(() => SubscriptionStatus, { nullable: true, defaultValue: SubscriptionStatus.ACTIVE })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class UpdateSubscriptionInput {
  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  seatCount?: number;

  @Field(() => SubscriptionStatus, { nullable: true })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  nextBillingDate?: string;

  @Field({ nullable: true })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class SubscriptionFiltersInput {
  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  customerId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  planId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field(() => SubscriptionStatus, { nullable: true })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}
