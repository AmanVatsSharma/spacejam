/**
 * File:        graphql/inputs/meeting-room.input.ts
 * Module:      API · GraphQL · Inputs · MeetingRoom
 * Purpose:     GraphQL input types for meeting room queries and mutations
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { InputType, Field, Int } from '@nestjs/graphql';
import { RoomType, RoomStatus } from '../../typeorm/entities/meeting-room.entity';

@InputType()
export class MeetingRoomFiltersInput {
  @Field({ nullable: true })
  centerId?: string;

  @Field({ nullable: true })
  floorId?: string;

  @Field({ nullable: true })
  type?: RoomType;

  @Field({ nullable: true })
  status?: RoomStatus;

  @Field({ nullable: true, description: 'Minimum capacity required' })
  minCapacity?: number;

  @Field({ nullable: true, description: 'Search by room name' })
  search?: string;
}

@InputType()
export class CreateMeetingRoomInput {
  @Field()
  name!: string;

  @Field()
  centerId!: string;

  @Field({ nullable: true })
  floorId?: string;

  @Field()
  type!: RoomType;

  @Field(() => Int)
  capacity!: number;

  @Field({ nullable: true })
  status?: RoomStatus;

  @Field({ nullable: true })
  amenities?: string[];

  @Field({ nullable: true })
  pricePerHour?: number;
}

@InputType()
export class UpdateMeetingRoomInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  centerId?: string;

  @Field({ nullable: true })
  floorId?: string;

  @Field({ nullable: true })
  type?: RoomType;

  @Field({ nullable: true, type: () => Int })
  capacity?: number;

  @Field({ nullable: true })
  status?: RoomStatus;

  @Field({ nullable: true })
  amenities?: string[];

  @Field({ nullable: true })
  pricePerHour?: number;
}
