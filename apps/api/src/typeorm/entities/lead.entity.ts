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
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserRole, LeadStatus, LeadSource } from '../../graphql/types/user.type';
import { User } from './user.entity';
import { Center } from './center.entity';

@Entity('leads')
@ObjectType()
export class Lead {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column()
  name!: string;

  @Field()
  @Column()
  email!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  phone?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  company?: string;

  @Field(() => LeadStatus)
  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.NEW })
  status!: LeadStatus;

  @Field(() => LeadSource, { nullable: true })
  @Column({ type: 'enum', enum: LeadSource, nullable: true })
  source?: LeadSource;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  requirement?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  budget?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  location?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'assignedToId', type: 'uuid', nullable: true })
  assignedToId!: string | null;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  lastContact?: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo?: User;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { eager: false })
  @JoinColumn({ name: 'centerId' })
  center?: Center;
}
