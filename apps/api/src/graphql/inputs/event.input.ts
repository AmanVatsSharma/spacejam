/**
 * File:        apps/api/src/graphql/inputs/event.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     Input types for Event mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

import { ObjectType, Field, InputType, Int, Float } from '@nestjs/graphql';
import { EventType, EventStatus } from '../types/user.type';
import { Event } from '../../typeorm/entities/event.entity';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsNumber, IsArray } from 'class-validator';

@InputType()
export class CreateEventInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  company?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  eventDate!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  endTime!: string;

  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  attendeesCount!: number;

  @Field(() => EventType)
  @IsEnum(EventType)
  @IsNotEmpty()
  type!: EventType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  specialRequests?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  addons?: string[];

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  cost?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  meetingRoomId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;
}

@InputType()
export class UpdateEventInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  company?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  eventDate?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  startTime?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  endTime?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  attendeesCount?: number;

  @Field(() => EventType, { nullable: true })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  specialRequests?: string;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  addons?: string[];

  @Field(() => Float, { nullable: true })
  @IsNumber()
  @IsOptional()
  cost?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;

  @Field(() => EventStatus, { nullable: true })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  meetingRoomId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;
}

@InputType()
export class EventFiltersInput {
  @Field(() => EventStatus, { nullable: true })
  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @Field(() => EventType, { nullable: true })
  @IsEnum(EventType)
  @IsOptional()
  type?: EventType;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  meetingRoomId?: string;

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

  @Field(() => Event, { nullable: true })
  event?: Event;

  @Field({ nullable: true })
  error?: string;
}