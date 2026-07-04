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
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { SeatType, SeatStatus } from '../../graphql/types/user.type';
import { Floor } from './floor.entity';
import { Booking } from './booking.entity';

@ObjectType()
@Entity('seats')
export class Seat {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'floorId' })
  floorId!: string;

  @Field()
  @Column()
  number!: string;

  @Field(() => SeatType)
  @Column({ type: 'enum', enum: SeatType })
  seatType!: SeatType;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  features!: Record<string, any> | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Field(() => Float)
  @Column({ type: 'float', default: 0 })
  price!: number;

  @Field(() => SeatStatus)
  @Column({ type: 'enum', enum: SeatStatus, default: SeatStatus.AVAILABLE })
  status!: SeatStatus;

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

  @OneToMany(() => Booking, (booking) => booking.seat)
  bookings!: Booking[];
}