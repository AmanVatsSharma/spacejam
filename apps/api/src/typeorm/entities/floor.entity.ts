/**
 * File:        apps/api/src/typeorm/entities/floor.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Floor entity for TypeORM
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
import { Center } from './center.entity';
import { Seat } from './seat.entity';

@Entity('floors')
export class Floor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'centerId' })
  centerId!: string;

  @Column()
  name!: string;

  @Column({ type: 'jsonb', nullable: true })
  layout!: Record<string, any> | null;

  @Column({ name: 'totalSeats', default: 0 })
  totalSeats!: number;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Center, (center) => center.floors)
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @OneToMany(() => Seat, (seat) => seat.floor)
  seats!: Seat[];
}