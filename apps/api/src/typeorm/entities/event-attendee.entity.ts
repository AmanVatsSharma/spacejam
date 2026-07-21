/**
 * File:        apps/api/src/typeorm/entities/event-attendee.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     EventAttendee — tracks who is attending an event and their
 *              check-in status. Belongs to an Event (not a Booking).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from './user.entity';
import { Event } from './event.entity';

@Entity('event_attendees')
@Index(['eventId', 'userId'], { unique: true })
@Index(['eventId', 'checkedIn'])
@ObjectType()
export class EventAttendee {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'eventId' })
  eventId!: string;

  @Field(() => Event)
  @ManyToOne(() => Event, (e) => e.attendees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Field(() => ID)
  @Column({ name: 'userId' })
  userId!: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => Boolean, { defaultValue: false })
  @Column({ type: 'boolean', default: false })
  checkedIn!: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  checkInTime!: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  ticketTier!: string | null;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  seatNumber!: number | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;
}
