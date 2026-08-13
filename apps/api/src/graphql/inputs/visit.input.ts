/**
 * File:        apps/api/src/graphql/inputs/visit.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     Input types for Visit mutations (scheduled tours/site visits).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-13
 */
import { InputType, Field, Int, ID } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  Min,
} from 'class-validator';
import { TourType, VisitStatus } from '../enums/visit.enums';

@InputType()
export class CreateVisitInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  leadId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  visitorName!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  visitorPhone!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  visitorEmail?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  company?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  visitDate!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @Field(() => TourType, { nullable: true })
  @IsEnum(TourType)
  @IsOptional()
  tourType?: TourType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  interestedPlan?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  partySize?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class UpdateVisitInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  visitorName?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  visitorPhone?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  visitorEmail?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  company?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  visitDate?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  startTime?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  endTime?: string;

  @Field(() => TourType, { nullable: true })
  @IsEnum(TourType)
  @IsOptional()
  tourType?: TourType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  interestedPlan?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  partySize?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class VisitFiltersInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  leadId?: string;

  @Field(() => VisitStatus, { nullable: true })
  @IsEnum(VisitStatus)
  @IsOptional()
  status?: VisitStatus;

  @Field(() => TourType, { nullable: true })
  @IsEnum(TourType)
  @IsOptional()
  tourType?: TourType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  startDate?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  endDate?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  offset?: number;
}
