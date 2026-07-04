/**
 * File:        graphql/inputs/center.input.ts
 * Module:      Api · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for center/location/floor/seat mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, IsInt } from 'class-validator';

@InputType()
export class CreateCenterInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  city?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  state?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  country?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  timezone?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  currency?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  locationId?: string;
}

@InputType()
export class UpdateCenterInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  city?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  state?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  country?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field(() => String, { nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  timezone?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  currency?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  status?: string;
}

@InputType()
export class CreateLocationInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  city?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  state?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  country?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  postalCode?: string;
}

@InputType()
export class UpdateLocationInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  address?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  city?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  state?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  country?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  postalCode?: string;
}

@InputType()
export class CreateFloorInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  centerId!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  level?: number;
}

@InputType()
export class UpdateFloorInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  level?: number;
}

@InputType()
export class CreateSeatInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  label!: string;

  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  floorId!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  type?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  status?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  x?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  y?: number;
}

@InputType()
export class UpdateSeatInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  label?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  type?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  status?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  x?: number;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  y?: number;
}