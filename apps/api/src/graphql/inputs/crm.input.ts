/**
 * File:        apps/api/src/graphql/inputs/crm.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for CRM mutations and filters
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-01
 */
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { LeadStatus, LeadSource } from '../types/user.type';

@InputType()
export class CreateLeadInput {
  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  company?: string;

  @Field(() => LeadStatus, { nullable: true })
  status?: LeadStatus;

  @Field(() => LeadSource, { nullable: true })
  source?: LeadSource;

  @Field({ nullable: true })
  requirement?: string;

  @Field({ nullable: true })
  budget?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  lastContact?: string;

  @Field(() => ID, { nullable: true })
  assignedToId?: string;

  @Field(() => ID, { nullable: true })
  centerId?: string;
}

@InputType()
export class UpdateLeadInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  company?: string;

  @Field(() => LeadStatus, { nullable: true })
  status?: LeadStatus;

  @Field(() => LeadSource, { nullable: true })
  source?: LeadSource;

  @Field({ nullable: true })
  requirement?: string;

  @Field({ nullable: true })
  budget?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  lastContact?: string;

  @Field(() => ID, { nullable: true })
  assignedToId?: string;

  @Field(() => ID, { nullable: true })
  centerId?: string;
}

@InputType()
export class LeadFiltersInput {
  @Field(() => LeadStatus, { nullable: true })
  status?: LeadStatus;

  @Field(() => LeadSource, { nullable: true })
  source?: LeadSource;

  @Field(() => ID, { nullable: true })
  centerId?: string;

  @Field(() => ID, { nullable: true })
  assignedToId?: string;

  @Field({ nullable: true })
  search?: string;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;
}
