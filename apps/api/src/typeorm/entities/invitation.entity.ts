/**
 * File:        apps/api/src/typeorm/entities/invitation.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Invitation entity for TypeORM
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { UserRole } from '../../graphql/types/user.type';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  email!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId!: string | null;

  @Column({ unique: true })
  token!: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ name: 'acceptedAt', type: 'timestamp', nullable: true })
  acceptedAt!: Date | null;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}