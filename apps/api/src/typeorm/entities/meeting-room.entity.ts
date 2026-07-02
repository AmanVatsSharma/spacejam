/**
 * File:        typeorm/entities/meeting-room.entity.ts
 * Module:      API · TypeORM · MeetingRoom
 * Purpose:     TypeORM entity for the meeting_rooms table.
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
  JoinColumn,
} from 'typeorm';
import { Center } from './center.entity';
import { Floor } from './floor.entity';

export enum RoomType {
  BOARDROOM = 'boardroom',
  CONFERENCE = 'conference',
  MEETING_ROOM = 'meeting_room',
  WORKSHOP = 'workshop',
  TRAINING = 'training',
}

export enum RoomStatus {
  AVAILABLE = 'available',
  OCCUPIED = 'occupied',
  BOOKED = 'booked',
  MAINTENANCE = 'maintenance',
}

@Entity('meeting_rooms')
export class MeetingRoom {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  centerId!: string;

  @Column({ nullable: true })
  floorId?: string;

  @Column({
    type: 'enum',
    enum: RoomType,
    default: RoomType.MEETING_ROOM,
  })
  type!: RoomType;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.AVAILABLE })
  status!: RoomStatus;

  @Column({ type: 'json', nullable: true })
  amenities?: string[];

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  pricePerHour?: number;

  @ManyToOne(() => Center, { eager: false })
  @JoinColumn({ name: 'centerId' })
  center?: Center;

  @ManyToOne(() => Floor, { eager: false })
  @JoinColumn({ name: 'floorId' })
  floor?: Floor;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
