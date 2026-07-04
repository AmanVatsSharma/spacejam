/**
 * File:        apps/api/src/typeorm/entities/user-session.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     User session entity for TypeORM
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from './user.entity';

@Entity('user_sessions')
@ObjectType()
export class UserSession {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'userId' })
  userId!: string;

  @Field()
  @Column({ unique: true })
  token!: string;

  @Field()
  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Field(() => String, { nullable: true })
  @Column({ name: 'ipAddress', type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'userAgent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Field()
  @Column({ default: true })
  isActive!: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  // Relations
  @Field(() => User)
  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'userId' })
  user!: User;
}