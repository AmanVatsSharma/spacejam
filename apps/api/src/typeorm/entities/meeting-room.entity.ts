/**
 * File:        apps/api/src/typeorm/entities/meeting-room.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Meeting room entity for TypeORM
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Center } from './center.entity';
import { RoomType, RoomStatus } from '../../graphql/types/user.type';
import { Booking } from './booking.entity';
import { Event } from './event.entity';

@ObjectType()
@Entity('meeting_rooms')
export class MeetingRoom {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'centerId' })
  centerId!: string;

  @Field(() => ID)
  @Column({ name: 'floorId', type: 'varchar' })
  floorId!: string;

  @Field()
  @Column({ type: 'varchar' })
  name!: string;

  @Field(() => RoomType)
  @Column({ type: 'enum', enum: RoomType, default: RoomType.MEETING_ROOM })
  roomType!: RoomType;

  @Field(() => Int)
  @Column({ type: 'int' })
  capacity!: number;

  @Field(() => RoomStatus)
  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status!: RoomStatus;

  @Field(() => String, { nullable: true })
  @Column({ name: 'locationName', type: 'varchar', nullable: true })
  locationName!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'locationFullAddress', type: 'text', nullable: true })
  locationFullAddress!: string | null;

  @Field(() => Int)
  @Column({ name: 'minBookingDuration', type: 'int', default: 30 })
  minBookingDuration!: number;

  @Field(() => Int)
  @Column({ name: 'maxBookingDuration', type: 'int', default: 480 })
  maxBookingDuration!: number;

  @Field(() => [String], { nullable: true })
  @Column({ name: 'amenities', type: 'json', nullable: true })
  amenities!: string[] | null;

  @Field(() => Float)
  @Column({ name: 'hourlyRate', type: 'float', default: 0 })
  hourlyRate!: number;

  @Field()
  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @Field(() => Center)
  @ManyToOne(() => Center, (center: any) => center.meetingRooms)
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @OneToMany(() => Booking, (booking) => booking.meetingRoom)
  bookings!: Booking[];

  @OneToMany(() => Event, (event) => event.meetingRoom)
  events!: Event[];
}
