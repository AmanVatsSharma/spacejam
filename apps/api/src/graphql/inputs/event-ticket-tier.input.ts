/**
 * File:        apps/api/src/graphql/inputs/event-ticket-tier.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     EventTicketTier inputs.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Field, InputType, ID, Int, Float } from '@nestjs/graphql';

@InputType()
export class CreateTicketTierInput {
  @Field(() => ID) eventId!: string;
  @Field() name!: string;
  @Field(() => Float) price!: number;
  @Field(() => Int) quantity!: number;
  @Field({ nullable: true }) earlyBirdEndDate?: string;
  @Field({ nullable: true }) description?: string;
}

@InputType()
export class UpdateTicketTierInput {
  @Field({ nullable: true }) name?: string;
  @Field(() => Float, { nullable: true }) price?: number;
  @Field(() => Int, { nullable: true }) quantity?: number;
  @Field({ nullable: true }) earlyBirdEndDate?: string;
  @Field({ nullable: true }) description?: string;
  @Field(() => Boolean, { nullable: true }) active?: boolean;
}
