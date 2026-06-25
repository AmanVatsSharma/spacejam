/**
 * File:        graphql/inputs/center.input.ts
 * Module:      Api · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for center/location/floor/seat mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */
import { Field, Float, ID, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateCenterInput {
  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  address?: string;

  @Field(() => String, { nullable: true })
  city?: string;

  @Field(() => String, { nullable: true })
  state?: string;

  @Field(() => String, { nullable: true })
  country?: string;

  @Field(() => String, { nullable: true })
  postalCode?: string;

  @Field(() => String, { nullable: true })
  phone?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  timezone?: string;

  @Field(() => String, { nullable: true })
  currency?: string;

  @Field(() => ID, { nullable: true })
  locationId?: string;
}

@InputType()
export class UpdateCenterInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  address?: string;

  @Field(() => String, { nullable: true })
  city?: string;

  @Field(() => String, { nullable: true })
  state?: string;

  @Field(() => String, { nullable: true })
  country?: string;

  @Field(() => String, { nullable: true })
  postalCode?: string;

  @Field(() => String, { nullable: true })
  phone?: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => String, { nullable: true })
  timezone?: string;

  @Field(() => String, { nullable: true })
  currency?: string;

  @Field(() => String, { nullable: true })
  status?: string;
}

@InputType()
export class CreateLocationInput {
  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  address?: string;

  @Field(() => String, { nullable: true })
  city?: string;

  @Field(() => String, { nullable: true })
  state?: string;

  @Field(() => String, { nullable: true })
  country?: string;

  @Field(() => String, { nullable: true })
  postalCode?: string;
}

@InputType()
export class UpdateLocationInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  address?: string;

  @Field(() => String, { nullable: true })
  city?: string;

  @Field(() => String, { nullable: true })
  state?: string;

  @Field(() => String, { nullable: true })
  country?: string;

  @Field(() => String, { nullable: true })
  postalCode?: string;
}

@InputType()
export class CreateFloorInput {
  @Field()
  name!: string;

  @Field(() => ID)
  centerId!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Int, { nullable: true })
  level?: number;
}

@InputType()
export class UpdateFloorInput {
  @Field(() => String, { nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => Int, { nullable: true })
  level?: number;
}

@InputType()
export class CreateSeatInput {
  @Field()
  label!: string;

  @Field(() => ID)
  floorId!: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => String, { nullable: true })
  status?: string;

  @Field(() => Float, { nullable: true })
  x?: number;

  @Field(() => Float, { nullable: true })
  y?: number;
}

@InputType()
export class UpdateSeatInput {
  @Field(() => String, { nullable: true })
  label?: string;

  @Field(() => String, { nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  type?: string;

  @Field(() => String, { nullable: true })
  status?: string;

  @Field(() => Float, { nullable: true })
  x?: number;

  @Field(() => Float, { nullable: true })
  y?: number;
}