/**
 * File:        apps/api/src/graphql/inputs/event.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     Input types for Event mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

import { ObjectType, Field, InputType, Int } from '@nestjs/graphql';
import { EventType, EventStatus } from '../entities/event.entity';

@InputType()
export class CreateEventInput {
  @Field()
  title!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  company?: string;

  @Field()
  eventDate!: string;

  @Field()
  startTime!: string;

  @Field()
  endTime!: string;

  @Field(() => Int)
  attendeesCount!: number;

  @Field(() => EventType)
  type!: EventType;

  @Field({ nullable: true })
  specialRequests?: string;

  @Field(() => [String], { nullable: true })
  addons?: string[];

  @Field(() => Float, { nullable: true })
  cost?: number;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  meetingRoomId!: string;

  @Field({ nullable: true })
  centerId?: string;
}

@InputType()
export class UpdateEventInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  company?: string;

  @Field({ nullable: true })
  eventDate?: string;

  @Field({ nullable: true })
  startTime?: string;

  @Field({ nullable: true })
  endTime?: string;

  @Field(() => Int, { nullable: true })
  attendeesCount?: number;

  @Field(() => EventType, { nullable: true })
  type?: EventType;

  @Field({ nullable: true })
  specialRequests?: string;

  @Field(() => [String], { nullable: true })
  addons?: string[];

  @Field(() => Float, { nullable: true })
  cost?: number;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => EventStatus, { nullable: true })
  status?: EventStatus;

  @Field({ nullable: true })
  meetingRoomId?: string;

  @Field({ nullable: true })
  centerId?: string;
}

@InputType()
export class EventFiltersInput {
  @Field({ nullable: true })
  status?: EventStatus;

  @Field({ nullable: true })
  type?: EventType;

  @Field({ nullable: true })
  centerId?: string;

  @Field({ nullable: true })
  meetingRoomId?: string;

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
  requestedById?: string;
}

@ObjectType()
export class EventStatistics {
  @Field(() => Int)
  totalEvents!: number;

  @Field(() => Int)
  pendingEvents!: number;

  @Field(() => Int)
  confirmedEvents!: number;

  @Field(() => Int)
  completedEvents!: number;

  @Field(() => Int)
  cancelledEvents!: number;
}

@ObjectType()
export class CreateEventPayload {
  @Field()
  success!: boolean;

  @Field({ nullable: true })
  event?: any;

  @Field({ nullable: true })
  error?: string;
}