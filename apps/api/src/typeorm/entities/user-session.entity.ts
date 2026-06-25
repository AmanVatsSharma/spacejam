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
import { User } from './user.entity';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'userId' })
  userId!: string;

  @Column({ unique: true })
  token!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'ipAddress', type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'userAgent', type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.sessions)
  @JoinColumn({ name: 'userId' })
  user!: User;
}