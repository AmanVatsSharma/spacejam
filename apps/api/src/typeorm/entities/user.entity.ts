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
import { UserRole } from '../../graphql/types/user.type';
import { Center } from './center.entity';
import { Booking } from './booking.entity';
import { Payment } from './payment.entity';
import { UserSession } from './user-session.entity';
import { AuditLog } from './audit-log.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role!: UserRole;

  @Column({ name: 'passwordHash', select: false })
  passwordHash!: string;

  @Column({ nullable: true })
  centerId!: string | null;

  @Column({ nullable: true })
  phone!: string | null;

  @Column({ nullable: true })
  avatar!: string | null;

  @Column({ name: 'isActive', default: true })
  isActive!: boolean;

  @Column({ name: 'lastLogin', nullable: true })
  lastLogin!: Date | null;

  @Column({ name: 'emailVerified', default: false })
  emailVerified!: boolean;

  // --- 2FA (TOTP) ---
  @Column({ name: 'twoFactorSecret', type: 'varchar', length: 64, nullable: true, select: false })
  twoFactorSecret!: string | null;

  @Column({ name: 'twoFactorEnabled', default: false })
  twoFactorEnabled!: boolean;

  // --- Account lockout / brute-force protection ---
  @Column({ name: 'failedLoginCount', type: 'int', default: 0 })
  failedLoginCount!: number;

  @Column({ name: 'lockoutUntil', type: 'timestamp', nullable: true })
  lockoutUntil!: Date | null;

  @Column({ name: 'lastFailedLoginAt', type: 'timestamp', nullable: true })
  lastFailedLoginAt!: Date | null;

  // --- Password policy / rotation ---
  @Column({ name: 'passwordChangedAt', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  passwordChangedAt!: Date;

  @Column({ name: 'passwordHistory', type: 'jsonb', nullable: true, select: false })
  passwordHistory!: string[] | null;

  // --- Password reset (short-lived tokens) ---
  @Column({ name: 'passwordResetToken', type: 'varchar', length: 128, nullable: true, select: false })
  passwordResetToken!: string | null;

  @Column({ name: 'passwordResetExpiresAt', type: 'timestamp', nullable: true })
  passwordResetExpiresAt!: Date | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Center, (center) => center.users, { nullable: true })
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings!: Booking[];

  @OneToMany(() => Payment, (payment) => payment.user)
  payments!: Payment[];

  @OneToMany(() => UserSession, (session) => session.user)
  sessions!: UserSession[];

  @OneToMany(() => AuditLog, (log) => log.user)
  auditLogs!: AuditLog[];
}