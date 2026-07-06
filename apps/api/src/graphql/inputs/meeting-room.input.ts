/**
 * File:        graphql/inputs/meeting-room.input.ts
 * Module:      API · GraphQL · Inputs · MeetingRoom
 * Purpose:     GraphQL input types for meeting room queries and mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { InputType, Field, Int } from '@nestjs/graphql';
import { RoomType, RoomStatus } from '../types/user.type';
import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, IsArray, IsNumber } from 'class-validator';

@InputType()
export class RoomFiltersInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  floorId?: string;

  @Field(() => RoomType, { nullable: true })
  @IsEnum(RoomType)
  @IsOptional()
  type?: RoomType;

  @Field(() => RoomStatus, { nullable: true })
  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;

  @Field({ nullable: true, description: 'Minimum capacity required' })
  @IsInt()
  @IsOptional()
  minCapacity?: number;

  @Field({ nullable: true, description: 'Search by room name' })
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

@InputType()
export class MeetingRoomFiltersInput extends RoomFiltersInput {}

@InputType()
export class CreateMeetingRoomInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  centerId!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  floorId?: string;

  @Field(() => RoomType)
  @IsEnum(RoomType)
  @IsNotEmpty()
  type!: RoomType;

  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  capacity!: number;

  @Field(() => RoomStatus, { nullable: true })
  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  pricePerHour?: number;
}

@InputType()
export class UpdateMeetingRoomInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  floorId?: string;

  @Field(() => RoomType, { nullable: true })
  @IsEnum(RoomType)
  @IsOptional()
  type?: RoomType;

  @Field({ nullable: true, type: () => Int })
  @IsInt()
  @IsOptional()
  capacity?: number;

  @Field(() => RoomStatus, { nullable: true })
  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;

  @Field(() => [String], { nullable: true })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  pricePerHour?: number;
}
