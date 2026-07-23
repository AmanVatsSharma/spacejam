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
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { CenterStatus } from '../../graphql/types/user.type';
import { User } from './user.entity';
import { Location } from './location.entity';
import { Floor } from './floor.entity';
import { Booking } from './booking.entity';
import { RevenueAnalytics } from './revenue-analytics.entity';
import { Event } from './event.entity';

@ObjectType()
@Entity('centers')
export class Center {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column()
  name!: string;

  @Field(() => ID)
  @Column({ name: 'locationId' })
  locationId!: string;

  @Field(() => CenterStatus)
  @Column({ type: 'enum', enum: CenterStatus, default: 'ACTIVE' })
  status!: CenterStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  settings!: Record<string, any> | null;

  @Field(() => ID, { nullable: true })
  @Column({ nullable: true })
  owner?: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner' })
  ownerUser!: User;

  @Field(() => Location)
  @ManyToOne(() => Location, (location) => location.centers)
  @JoinColumn({ name: 'locationId' })
  location!: Location;

  @Field(() => [Floor])
  @OneToMany(() => Floor, (floor) => floor.center)
  floors!: Floor[];

  @OneToMany(() => Booking, (booking) => booking.center)
  bookings!: Booking[];

  @OneToMany(() => RevenueAnalytics, (analytics) => analytics.center)
  analytics!: RevenueAnalytics[];

  @OneToMany(() => Event, (event) => event.center)
  events!: Event[];

}