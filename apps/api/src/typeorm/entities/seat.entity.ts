/**
 * File:        apps/api/src/typeorm/entities/seat.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Unified Seat entity (desks + meeting rooms)
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-19
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
import { SeatType, SeatStatus } from '../../graphql/types/user.type';
import { Floor } from './floor.entity';
import { Center } from './center.entity';
import { Booking } from './booking.entity';
import { Event } from './event.entity';

@ObjectType()
@Entity('seats')
export class Seat {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'floorId' })
  floorId!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId!: string | null;

  @Field(() => String)
  @Column()
  name!: string;

  @Field(() => String)
  @Column({ type: 'varchar' })
  seatType!: SeatType;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  capacity!: number | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  amenities!: string[] | null;

  @Field(() => Float)
  @Column({ type: 'float', default: 0 })
  price!: number;

  @Field(() => SeatStatus)
  @Column({ type: 'enum', enum: SeatStatus, default: SeatStatus.AVAILABLE })
  status!: SeatStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  /** Manual map position in grid units (1 unit ≈ 40px at zoom 1). NULL = unplaced (tray). */
  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  x!: number | null;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  y!: number | null;

  /** Manual map size in grid units (NULL = 1×1 default). */
  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  w!: number | null;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  h!: number | null;

  /** Clockwise rotation in degrees (NULL = 0). */
  @Field(() => Float, { nullable: true })
  @Column({ type: 'float', nullable: true })
  rotation!: number | null;

  @Field(() => Int)
  @Column({ name: 'minBookingDuration', type: 'int', default: 30 })
  minBookingDuration!: number;

  @Field(() => Int)
  @Column({ name: 'maxBookingDuration', type: 'int', default: 480 })
  maxBookingDuration!: number;

  @Field()
  @Column({ name: 'active', type: 'boolean', default: true })
  active!: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => Floor)
  @ManyToOne(() => Floor, (floor) => floor.seats)
  @JoinColumn({ name: 'floorId' })
  floor!: Floor;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { nullable: true })
  @JoinColumn({ name: 'centerId' })
  center!: Center | null;

  @OneToMany(() => Booking, (booking) => booking.seat)
  bookings!: Booking[];

  @OneToMany(() => Event, (event: any) => event.seat)
  events!: Event[];
}
