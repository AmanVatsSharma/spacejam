/**
 * File:        apps/api/src/typeorm/entities/center.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Center entity for TypeORM
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
import { CenterStatus } from '../../graphql/types/user.type';
import { User } from './user.entity';
import { Location } from './location.entity';
import { Floor } from './floor.entity';
import { Booking } from './booking.entity';
import { RevenueAnalytics } from './revenue-analytics.entity';

@Entity('centers')
export class Center {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ name: 'locationId' })
  locationId!: string;

  @Column({ type: 'enum', enum: CenterStatus, default: CenterStatus.ACTIVE })
  status!: CenterStatus;

  @Column({ type: 'jsonb', nullable: true })
  settings!: Record<string, any> | null;

  @Column()
  owner!: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner' })
  ownerUser!: User;

  @ManyToOne(() => Location, (location) => location.centers)
  @JoinColumn({ name: 'locationId' })
  location!: Location;

  @OneToMany(() => Floor, (floor) => floor.center)
  floors!: Floor[];

  @OneToMany(() => Booking, (booking) => booking.center)
  bookings!: Booking[];

  @OneToMany(() => RevenueAnalytics, (analytics) => analytics.center)
  analytics!: RevenueAnalytics[];
}