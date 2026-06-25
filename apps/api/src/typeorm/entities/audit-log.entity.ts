/**
 * File:        apps/api/src/typeorm/entities/audit-log.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Audit log entity for TypeORM. Append-only — no updates,
 *              no soft deletes. Indexed on (userId, createdAt) and
 *              (action, createdAt) for the two main query patterns.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('audit_logs')
@Index(['userId', 'createdAt'])
@Index(['action', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  // userId is nullable because we want to record events for unknown
  // actors too (e.g. sign-in failures against an email we have no row
  // for, or anonymous permission denials).
  @Column({ name: 'userId', type: 'uuid', nullable: true })
  userId!: string | null;

  @Column()
  action!: string;

  @Column({ name: 'entityType', type: 'varchar', nullable: true })
  entityType!: string | null;

  @Column({ name: 'entityId', type: 'uuid', nullable: true })
  entityId!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  changes!: Record<string, any> | null;

  @Column({ name: 'ipAddress', type: 'varchar', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'userAgent', type: 'text', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.auditLogs, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User;
}