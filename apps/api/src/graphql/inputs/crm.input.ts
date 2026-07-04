/**
 * File:        apps/api/src/graphql/inputs/crm.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for CRM mutations and filters
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { LeadStatus, LeadSource } from '../types/user.type';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsInt } from 'class-validator';

@InputType()
export class CreateLeadInput {
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
  company?: string;

  @Field(() => LeadStatus, { nullable: true })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @Field(() => LeadSource, { nullable: true })
  @IsEnum(LeadSource)
  @IsOptional()
  source?: LeadSource;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  requirement?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  budget?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  location?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  lastContact?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;
}

@InputType()
export class UpdateLeadInput {
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
  company?: string;

  @Field(() => LeadStatus, { nullable: true })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @Field(() => LeadSource, { nullable: true })
  @IsEnum(LeadSource)
  @IsOptional()
  source?: LeadSource;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  requirement?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  budget?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  location?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  lastContact?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;
}

@InputType()
export class LeadFiltersInput {
  @Field(() => LeadStatus, { nullable: true })
  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @Field(() => LeadSource, { nullable: true })
  @IsEnum(LeadSource)
  @IsOptional()
  source?: LeadSource;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  offset?: number;
}
