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
import { User } from './user.entity';
import { MeetingRoom } from './meeting-room.entity';
import { Center } from './center.entity';

export enum EventStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EventType {
  MEETING_ROOM = 'MEETING_ROOM',
  CONFERENCE = 'CONFERENCE',
  WORKSHOP = 'WORKSHOP',
  PRIVATE_EVENT = 'PRIVATE_EVENT',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'centerId' })
  centerId!: string;

  @Column({ name: 'meetingRoomId', type: 'uuid' })
  meetingRoomId!: string;

  @Column({ name: 'requestedById' })
  requestedById!: string;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'company', type: 'varchar', nullable: true })
  company!: string | null;

  @Column({ name: 'eventDate', type: 'date' })
  eventDate!: Date;

  @Column({ name: 'startTime', type: 'time' })
  startTime!: string;

  @Column({ name: 'endTime', type: 'time' })
  endTime!: string;

  @Column({ name: 'durationMinutes', type: 'int' })
  durationMinutes!: number;

  @Column({ name: 'attendeesCount', type: 'int', default: 1 })
  attendeesCount!: number;

  @Column({
    type: 'enum',
    enum: EventType,
    default: EventType.MEETING_ROOM,
  })
  type!: EventType;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.PENDING,
  })
  status!: EventStatus;

  @Column({ name: 'specialRequests', type: 'text', nullable: true })
  specialRequests!: string | null;

  @Column({ name: 'addons', type: 'json', nullable: true })
  addons!: string[] | null;

  @Column({ name: 'cost', type: 'float', default: 0 })
  cost!: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Center, (center) => center.events)
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @ManyToOne(() => MeetingRoom, (room) => room.events)
  @JoinColumn({ name: 'meetingRoomId' })
  meetingRoom!: MeetingRoom;

  @ManyToOne(() => User, (user) => user.events)
  @JoinColumn({ name: 'requestedById' })
  requestedBy!: User;
}
