/**
 * File:        apps/api/src/typeorm/entities/lead.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Lead / Customer entity for CRM
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-01
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from '../../graphql/types/user.type';
import { User } from './user.entity';
import { Center } from './center.entity';

export enum LeadStatus {
  NEW = 'New',
  VISITED = 'Visited',
  NEGOTIATION = 'Negotiation',
  CONVERTED = 'Converted',
  COLD = 'Cold',
}

export enum LeadSource {
  WEBSITE = 'Website',
  REFERRAL = 'Referral',
  WALK_IN = 'Walk-in',
  SOCIAL = 'Social',
  EMAIL = 'Email',
}

@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  company?: string;

  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status!: LeadStatus;

  @Column({ type: 'enum', enum: LeadSource, nullable: true })
  source?: LeadSource;

  @Column({ type: 'text', nullable: true })
  requirement?: string;

  @Column({ type: 'varchar', nullable: true })
  budget?: string;

  @Column({ type: 'varchar', nullable: true })
  location?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'assignedToId', type: 'uuid', nullable: true })
  assignedToId!: string | null;

  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  lastContact?: string;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo?: User;

  @ManyToOne(() => Center, { eager: false })
  @JoinColumn({ name: 'centerId' })
  center?: Center;
}
