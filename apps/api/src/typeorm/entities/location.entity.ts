/**
 * File:        apps/api/src/typeorm/entities/location.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Location entity for TypeORM
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
  OneToMany,
} from 'typeorm';
import { Center } from './center.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  city!: string;

  @Column()
  state!: string;

  @Column()
  country!: string;

  @Column({ name: 'fullAddress' })
  fullAddress!: string;

  @Column({ nullable: true })
  coordinates!: string | null;

  @Column({ default: 'Asia/Kolkata' })
  timezone!: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @OneToMany(() => Center, (center) => center.location)
  centers!: Center[];
}