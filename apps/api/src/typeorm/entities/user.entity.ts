/**
 * File:        apps/api/src/typeorm/entities/user.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     User entity for TypeORM
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
import { UserRole } from '../../graphql/types/user.type';
import { Center } from './center.entity';
import { Booking } from './booking.entity';
import { Payment } from './payment.entity';
import { UserSession } from './user-session.entity';
import { AuditLog } from './audit-log.entity';
import { Event } from './event.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Field()
  @Column()
  name!: string;

  @Field(() => UserRole)
  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role!: UserRole;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  centerId!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  avatar!: string | null;

  @Field()
  @Column({ name: 'isActive', default: true })
  isActive!: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'lastLogin', type: 'timestamp', nullable: true })
  lastLogin!: Date | null;

  @Field()
  @Column({ name: 'emailVerified', default: false })
  emailVerified!: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, (center) => center.users, { nullable: true })
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  // Note: Inverse relations removed to break circular GraphQL references - use queries instead
}