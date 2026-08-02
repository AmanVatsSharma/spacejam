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
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { User } from './user.entity';
import { Center } from './center.entity';
import { RequestType, RequestStatus } from '../../graphql/types/user.type';

@ObjectType()
@Entity('requests')
export class Request {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', nullable: true })
  centerId?: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'requestedById', nullable: true })
  requestedById?: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'assignedToId', type: 'uuid', nullable: true })
  assignedToId!: string | null;

  @Field(() => RequestType)
  @Column({
    type: 'enum',
    enum: RequestType,
  })
  requestType!: RequestType;

  @Field()
  @Column({ type: 'varchar' })
  title!: string;

  @Field(() => String, { nullable: true })
  @Column({ name: 'description', type: 'text' })
  description!: string;

  @Field()
  @Column({
    name: 'urgency',
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
  })
  urgency!: 'LOW' | 'MEDIUM' | 'HIGH';

  @Field(() => RequestStatus)
  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: 'PENDING',
  })
  status!: RequestStatus;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'dueDate', type: 'timestamp', nullable: true })
  dueDate!: Date | null;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'completedDate', type: 'timestamp', nullable: true })
  completedDate!: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'resolution', type: 'text', nullable: true })
  resolution!: string | null;

  @Field(() => Float)
  @Column({ name: 'cost', type: 'float', default: 0 })
  cost!: number;

  @Field(() => String, { nullable: true })
  @Column({ name: 'attachedFile', type: 'varchar', nullable: true })
  attachedFile!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'metadata', type: 'json', nullable: true })
  metadata!: any;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations — nullable in the GraphQL schema because the underlying FK
  // columns (centerId, requestedById) are nullable and createRequest may save
  // rows without them. Declaring these non-nullable makes GraphQL reject the
  // whole `requests` query with "Cannot return null for non-nullable field".
  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center)
  @JoinColumn({ name: 'centerId' })
  center!: Center | null;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedById' })
  requestedBy!: User | null;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo!: User;
}
