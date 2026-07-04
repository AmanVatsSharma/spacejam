/**
 * File:        apps/api/src/graphql/inputs/request.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     Input types for Request mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

import { ObjectType, Field, InputType, Int, Float } from '@nestjs/graphql';
import { RequestType, RequestStatus } from '../types/user.type';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsNumber, IsBoolean } from 'class-validator';

@InputType()
export class CreateRequestInput {
  @Field(() => RequestType)
  @IsEnum(RequestType)
  @IsNotEmpty()
  type!: RequestType;

  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  dueDate?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  cost?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  attachedFile?: string;

  @Field(() => Object, { nullable: true })
  @IsOptional()
  metadata?: any;
}

@InputType()
export class UpdateRequestInput {
  @Field(() => RequestType, { nullable: true })
  @IsEnum(RequestType)
  @IsOptional()
  type?: RequestType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';

  @Field(() => RequestStatus, { nullable: true })
  @IsEnum(RequestStatus)
  @IsOptional()
  status?: RequestStatus;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  dueDate?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  resolution?: string;

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  cost?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  attachedFile?: string;

  @Field(() => Object, { nullable: true })
  @IsOptional()
  metadata?: any;
}

@InputType()
export class RequestFiltersInput {
  @Field({ nullable: true })
  @IsEnum(RequestStatus)
  @IsOptional()
  status?: RequestStatus;

  @Field({ nullable: true })
  @IsEnum(RequestType)
  @IsOptional()
  type?: RequestType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  assignedToId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  requestedById?: string;

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

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  pendingOnly?: boolean;
}

@ObjectType()
export class RequestStatistics {
  @Field(() => Int)
  totalRequests!: number;

  @Field(() => Int)
  pendingRequests!: number;

  @Field(() => Int)
  inProgressRequests!: number;

  @Field(() => Int)
  completedRequests!: number;

  @Field(() => Int)
  cancelledRequests!: number;

  @Field(() => Int)
  highUrgencyRequests!: number;
}

@ObjectType()
export class CreateRequestPayload {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  request?: any;

  @Field({ nullable: true })
  error?: string;
}