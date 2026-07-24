/**
 * File:        apps/api/src/typeorm/entities/event.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Event entity for booking meeting rooms and spaces
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
import { User } from './user.entity';
import { MeetingRoom } from './meeting-room.entity';
import { Center } from './center.entity';
import { RecurringBooking } from './recurring-booking.entity';
import { EventAttendee } from './event-attendee.entity';
import { EventType, EventStatus } from '../../graphql/types/user.type';

@ObjectType()
@Entity('events')
export class Event {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', nullable: true })
  centerId?: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'meetingRoomId', type: 'uuid', nullable: true })
  meetingRoomId?: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'requestedById', nullable: true })
  requestedById?: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'recurringBookingId', type: 'uuid', nullable: true })
  recurringBookingId!: string | null;

  @Field(() => RecurringBooking, { nullable: true })
  @ManyToOne(() => RecurringBooking, (rb) => rb.events, { nullable: true })
  @JoinColumn({ name: 'recurringBookingId' })
  recurringBooking!: RecurringBooking | null;

  @Field()
  @Column({ type: 'varchar' })
  title!: string;

  @Field(() => String, { nullable: true })
  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'company', type: 'varchar', nullable: true })
  company!: string | null;

  @Field()
  @Column({ name: 'eventDate', type: 'timestamp' })
  eventDate!: Date;

  @Field()
  @Column({ name: 'startTime', type: 'time' })
  startTime!: string;

  @Field()
  @Column({ name: 'endTime', type: 'time' })
  endTime!: string;

  @Field(() => Int)
  @Column({ name: 'durationMinutes', type: 'int' })
  durationMinutes!: number;

  @Field(() => Int)
  @Column({ name: 'attendeesCount', type: 'int', default: 1 })
  attendeesCount!: number;

  @Field(() => EventType)
  @Column({
    type: 'enum',
    enum: EventType,
    default: 'MEETING_ROOM',
  })
  eventType!: EventType;

  @Field(() => EventStatus)
  @Column({
    type: 'enum',
    enum: EventStatus,
    default: 'PENDING',
  })
  status!: EventStatus;

  @Field(() => String, { nullable: true })
  @Column({ name: 'specialRequests', type: 'text', nullable: true })
  specialRequests!: string | null;

  @Field(() => [String], { nullable: true })
  @Column({ name: 'addons', type: 'json', nullable: true })
  addons!: string[] | null;

  @Field(() => Float)
  @Column({ name: 'cost', type: 'float', default: 0 })
  cost!: number;

  @Field(() => String, { nullable: true })
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, (center) => center.events)
  @JoinColumn({ name: 'centerId' })
  center?: Center;

  @Field(() => MeetingRoom, { nullable: true })
  @ManyToOne(() => MeetingRoom, (room) => room.events)
  @JoinColumn({ name: 'meetingRoomId' })
  meetingRoom?: MeetingRoom;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, (user: any) => user.events)
  @JoinColumn({ name: 'requestedById' })
  requestedBy?: User;

  @Field(() => [EventAttendee])
  @OneToMany(() => EventAttendee, (a) => a.event)
  attendees!: EventAttendee[];
}
