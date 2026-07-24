/**
 * File:        apps/api/src/graphql/inputs/customer-employee.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     CustomerEmployee inputs (create/update) for the team-member
 *              management on the customer detail page.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-24
 */
import { Field, InputType, ID } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsUUID,
} from 'class-validator';

@InputType()
export class CreateCustomerEmployeeInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  role?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  department?: string;

  /** Seat FK to the Inventory module (seats table). Optional. */
  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  seatId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  status?: string;
}

@InputType()
export class UpdateCustomerEmployeeInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  email?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  phone?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  role?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  department?: string;

  @Field(() => ID, { nullable: true })
  @IsUUID()
  @IsOptional()
  seatId?: string | null;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  status?: string;
}
