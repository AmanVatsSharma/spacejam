/**
 * File:        apps/api/src/typeorm/entities/recurring-booking.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     RecurringBooking — defines a booking template that expands
 *              into individual Event rows for each occurrence.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from './user.entity';
import { MeetingRoom } from './meeting-room.entity';
import { Center } from './center.entity';

export enum RecurrencePattern {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
}

@ObjectType()
@Entity('recurring_bookings')
@Index(['roomId', 'active'])
@Index(['endDate'])
export class RecurringBooking {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column()
  title!: string;

  @Field(() => ID)
  @Column({ name: 'roomId' })
  roomId!: string;

  @Field(() => MeetingRoom)
  @ManyToOne(() => MeetingRoom, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room!: MeetingRoom;

  @Field(() => ID)
  @Column({ name: 'centerId' })
  centerId!: string;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @Field(() => ID)
  @Column({ name: 'userId' })
  userId!: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => RecurrencePattern)
  @Column({ type: 'varchar' })
  pattern!: RecurrencePattern;

  /** Days of week for WEEKLY pattern. 0=Sunday, 6=Saturday */
  @Field(() => [Int], { nullable: true })
  @Column({ type: 'int', array: true, nullable: true })
  daysOfWeek!: number[] | null;

  @Field()
  @Column({ type: 'date' })
  startDate!: string;

  @Field()
  @Column({ type: 'date' })
  endDate!: string;

  @Field()
  @Column({ type: 'time' })
  startTime!: string;

  @Field()
  @Column({ type: 'time' })
  endTime!: string;

  @Field(() => Int, { defaultValue: 0 })
  @Column({ type: 'int', default: 0 })
  occurrencesCreated!: number;

  @Field(() => Boolean, { defaultValue: true })
  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt!: Date;
}
