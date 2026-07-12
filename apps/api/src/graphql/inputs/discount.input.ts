/**
 * File:        apps/api/src/graphql/inputs/discount.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for discount mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-12
 */
import { Field, ID, InputType, Float } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsDate } from 'class-validator';

@InputType()
export class CreateDiscountInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  code!: string;

  @Field(() => Float)
  @IsNumber()
  percentage!: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true, defaultValue: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  validFrom?: Date;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  validUntil?: Date;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  minOrderAmount?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  usageLimit?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  applicableTo?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;
}

@InputType()
export class UpdateDiscountInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  code?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  percentage?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  maxAmount?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  validFrom?: Date;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  validUntil?: Date;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  minOrderAmount?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  usageLimit?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  applicableTo?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;
}
