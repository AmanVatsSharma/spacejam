/**
 * File:        apps/api/src/typeorm/entities/audit-log.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Audit log entity for TypeORM
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

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'userId' })
  userId!: string;

  @Column()
  action!: string;

  @Column({ name: 'entityType' })
  entityType!: string;

  @Column({ name: 'entityId' })
  entityId!: string;

  @Column({ type: 'jsonb', nullable: true })
  changes!: Record<string, any> | null;

  @Column({ name: 'ipAddress', nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'userAgent', nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.auditLogs)
  @JoinColumn({ name: 'userId' })
  user!: User;
}