/**
 * File:        apps/api/src/graphql/inputs/support.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     Support ticket input DTOs
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

@InputType()
export class CreateSupportTicketInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  subject!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Field({ nullable: true, defaultValue: 'OTHER' })
  @IsEnum(['BOOKING', 'PAYMENT', 'PRINT', 'OTHER'])
  @IsOptional()
  category?: 'BOOKING' | 'PAYMENT' | 'PRINT' | 'OTHER';

  @Field({ nullable: true, defaultValue: 'MEDIUM' })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH'])
  @IsOptional()
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}
