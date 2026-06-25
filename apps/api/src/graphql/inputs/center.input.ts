/**
 * File:        graphql/inputs/center.input.ts
 * Module:      Api · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for center/location/floor/seat mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-24
 */
import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class CreateCenterInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  postalCode?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  currency?: string;

  @Field(() => ID, { nullable: true })
  locationId?: string;
}

@InputType()
export class UpdateCenterInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  postalCode?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  currency?: string;

  @Field({ nullable: true })
  status?: string;
}

@InputType()
export class CreateLocationInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  postalCode?: string;
}

@InputType()
export class UpdateLocationInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  postalCode?: string;
}

@InputType()
export class CreateFloorInput {
  @Field()
  name!: string;

  @Field(() => ID)
  centerId!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  level?: number;
}

@InputType()
export class UpdateFloorInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  level?: number;
}

@InputType()
export class CreateSeatInput {
  @Field()
  label!: string;

  @Field(() => ID)
  floorId!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  x?: number;

  @Field({ nullable: true })
  y?: number;
}

@InputType()
export class UpdateSeatInput {
  @Field({ nullable: true })
  label?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  x?: number;

  @Field({ nullable: true })
  y?: number;
}