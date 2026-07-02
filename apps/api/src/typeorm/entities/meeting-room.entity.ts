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
import { Center } from './center.entity';

@Entity('meeting_rooms')
export class MeetingRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'centerId' })
  centerId!: string;

  @Column({ name: 'floorId', type: 'varchar' })
  floorId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  type!: string;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({
    type: 'enum',
    enum: ['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'BOOKED'],
    default: 'AVAILABLE',
  })
  status!: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'BOOKED';

  @Column({ name: 'locationName', type: 'varchar', nullable: true })
  locationName!: string | null;

  @Column({ name: 'locationFullAddress', type: 'text', nullable: true })
  locationFullAddress!: string | null;

  @Column({ name: 'minBookingDuration', type: 'int', default: 30 })
  minBookingDuration!: number;

  @Column({ name: 'maxBookingDuration', type: 'int', default: 480 })
  maxBookingDuration!: number;

  @Column({ name: 'amenities', type: 'json', nullable: true })
  amenities!: string[] | null;

  @Column({ name: 'hourlyRate', type: 'float', default: 0 })
  hourlyRate!: number;

  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  @ManyToOne(() => Center, (center) => center.meetingRooms)
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @OneToMany(() => Booking, (booking) => booking.meetingRoom)
  bookings!: Booking[];
}
