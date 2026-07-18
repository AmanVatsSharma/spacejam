/**
 * File:        apps/api/src/typeorm/entities/booking.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Booking entity for TypeORM
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { BookingStatus } from '../../graphql/types/user.type';
export { BookingStatus };
import { User } from './user.entity';
import { Seat } from './seat.entity';
import { Center } from './center.entity';
import { Payment } from './payment.entity';
import { MeetingRoom } from './meeting-room.entity';

@ObjectType()
@Entity('bookings')
export class Booking {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'userId', nullable: true })
  userId?: string;

  @Field(() => ID)
  @Column({ name: 'seatId', nullable: true })
  seatId?: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', nullable: true })
  centerId?: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'planId', type: 'uuid', nullable: true })
  planId?: string | null;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Field(() => BookingStatus)
  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Field(() => String, { nullable: true })
  @Column({ name: 'paymentId', type: 'uuid', nullable: true })
  paymentId?: string | null;

  @Field({ nullable: true })
  @Column({ type: 'float', nullable: true, default: 0 })
  totalPrice?: number;

  @Field({ nullable: true })
  @Column({ type: 'float', default: 0, nullable: true })
  discount?: number;

  @Field(() => String, { nullable: true })
  @Column({ name: 'discountCode', type: 'varchar', nullable: true })
  discountCode!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => Seat)
  @ManyToOne(() => Seat, (seat) => seat.bookings)
  @JoinColumn({ name: 'seatId' })
  seat!: Seat;

  @Field(() => Center)
  @ManyToOne(() => Center, (center) => center.bookings)
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @Field(() => MeetingRoom, { nullable: true })
  @ManyToOne(() => MeetingRoom, (room) => room.bookings)
  @JoinColumn({ name: 'meetingRoomId' })
  meetingRoom!: MeetingRoom;

  @Column({ name: 'meetingRoomId', type: 'uuid', nullable: true })
  meetingRoomId!: string | null;

  @Column({ name: 'eventDate', type: 'date', nullable: true })
  eventDate!: Date | null;

  @Column({ name: 'title', type: 'varchar', nullable: true })
  title!: string | null;

  @Column({ name: 'requestedById', type: 'varchar', nullable: true })
  requestedById!: string | null;

  @Field(() => Payment, { nullable: true })
  @OneToOne(() => Payment, (payment) => payment.booking)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payment!: any;
}