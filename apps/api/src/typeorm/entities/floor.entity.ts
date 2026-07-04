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
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Center } from './center.entity';
import { Seat } from './seat.entity';

@ObjectType()
@Entity('floors')
export class Floor {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'centerId' })
  centerId!: string;

  @Field()
  @Column()
  name!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  layout!: Record<string, any> | null;

  @Field(() => Int)
  @Column({ name: 'totalSeats', default: 0 })
  totalSeats!: number;

  @Field()
  @Column({ default: true })
  active!: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => Center)
  @ManyToOne(() => Center, (center) => center.floors)
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @Field(() => [Seat])
  @OneToMany(() => Seat, (seat) => seat.floor)
  seats!: Seat[];
}