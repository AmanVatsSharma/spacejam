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

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 120 })
  city!: string;

  @Column({ type: 'varchar', length: 120 })
  state!: string;

  @Column({ type: 'varchar', length: 120 })
  country!: string;

  @Column({ name: 'fullAddress' })
  fullAddress!: string;

  @Column({ nullable: true, type: 'varchar' })
  coordinates!: string;

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