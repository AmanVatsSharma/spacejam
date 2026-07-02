/**
 * File:        apps/api/src/typeorm/entities/request.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Request entity for service requests and inquiries
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
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
import { User } from './user.entity';
import { Center } from './center.entity';

export enum RequestType {
  EVENT_BOOKING = 'EVENT_BOOKING',
  PRINTER_ACCESS = 'PRINTER_ACCESS',
  FURNITURE_UPGRADE = 'FURNITURE_UPGRADE',
  MAINTENANCE = 'MAINTENANCE',
  CLEANING = 'CLEANING',
  SECURITY = 'SECURITY',
  SUPPLIES = 'SUPPLIES',
  INTERNET_SUPPORT = 'INTERNET_SUPPORT',
  OTHER = 'OTHER',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED',
}

@Entity('requests')
export class Request {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'centerId' })
  centerId!: string;

  @Column({ name: 'requestedById' })
  requestedById!: string;

  @Column({ name: 'assignedToId', nullable: true })
  assignedToId!: string | null;

  @Column({
    type: 'enum',
    enum: RequestType,
  })
  type!: RequestType;

  @Column({ type: 'varchar' })
  title!: string;

  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Column({ name: 'urgency', type: 'enum', enum: ['LOW', 'MEDIUM', 'HIGH'], default: 'MEDIUM' })
  urgency!: 'LOW' | 'MEDIUM' | 'HIGH';

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  status!: RequestStatus;

  @Column({ name: 'dueDate', type: 'date', nullable: true })
  dueDate!: Date | null;

  @Column({ name: 'completedDate', type: 'date', nullable: true })
  completedDate!: Date | null;

  @Column({ name: 'resolution', type: 'text', nullable: true })
  resolution!: string | null;

  @Column({ name: 'cost', type: 'float', default: 0 })
  cost!: number;

  @Column({ name: 'attachedFile', type: 'varchar', nullable: true })
  attachedFile!: string | null;

  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata!: any;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Center, (center) => center.requests)
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @ManyToOne(() => User, (user) => user.requests)
  @JoinColumn({ name: 'requestedById' })
  requestedBy!: User;

  @ManyToOne(() => User, (user) => user.assignedRequests)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo!: User;
}
