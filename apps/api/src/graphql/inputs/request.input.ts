/**
 * File:        apps/api/src/graphql/inputs/request.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     Input types for Request mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

import { ObjectType, Field, InputType, Int } from '@nestjs/graphql';
import { RequestType, RequestStatus } from '../entities/request.entity';

@InputType()
export class CreateRequestInput {
  @Field(() => RequestType)
  type!: RequestType;

  @Field()
  title!: string;

  @Field()
  description!: string;

  @Field(() => String, { nullable: true })
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';

  @Field(() => String, { nullable: true })
  dueDate?: string;

  @Field(() => String, { nullable: true })
  centerId?: string;

  @Field(() => String, { nullable: true })
  assignedToId?: string;

  @Field(() => Float, { nullable: true })
  cost?: number;

  @Field({ nullable: true })
  attachedFile?: string;

  @Field(() => Object, { nullable: true })
  metadata?: any;
}

@InputType()
export class UpdateRequestInput {
  @Field(() => RequestType, { nullable: true })
  type?: RequestType;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => String, { nullable: true })
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';

  @Field(() => RequestStatus, { nullable: true })
  status?: RequestStatus;

  @Field(() => String, { nullable: true })
  dueDate?: string;

  @Field(() => String, { nullable: true })
  assignedToId?: string;

  @Field(() => String, { nullable: true })
  resolution?: string;

  @Field(() => Float, { nullable: true })
  cost?: number;

  @Field({ nullable: true })
  attachedFile?: string;

  @Field(() => Object, { nullable: true })
  metadata?: any;
}

@InputType()
export class RequestFiltersInput {
  @Field({ nullable: true })
  status?: RequestStatus;

  @Field({ nullable: true })
  type?: RequestType;

  @Field({ nullable: true })
  centerId?: string;

  @Field({ nullable: true })
  assignedToId?: string;

  @Field({ nullable: true })
  requestedById?: string;

  @Field({ nullable: true })
  startDate?: string;

  @Field({ nullable: true })
  endDate?: string;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;

  @Field({ nullable: true })
  search?: string;

  @Field({ nullable: true })
  urgency?: 'LOW' | 'MEDIUM' | 'HIGH';

  @Field({ nullable: true })
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