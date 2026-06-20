/**
 * File:        apps/api/src/typeorm/entities/seat.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Seat entity for TypeORM
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
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { SeatType, SeatStatus } from '../../graphql/types/user.type';
import { Floor } from './floor.entity';
import { Booking } from './booking.entity';

@Entity('seats')
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'floorId' })
  floorId!: string;

  @Column()
  number!: string;

  @Column({ type: 'enum', enum: SeatType })
  type!: SeatType;

  @Column({ type: 'jsonb', nullable: true })
  features!: Record<string, any> | null;

  @Column({ nullable: true })
  location!: string | null;

  @Column({ type: 'float', default: 0 })
  price!: number;

  @Column({ type: 'enum', enum: SeatStatus, default: SeatStatus.AVAILABLE })
  status!: SeatStatus;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Floor, (floor) => floor.seats)
  @JoinColumn({ name: 'floorId' })
  floor!: Floor;

  @OneToMany(() => Booking, (booking) => booking.seat)
  bookings!: Booking[];
}