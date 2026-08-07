/**
 * File:        apps/api/src/typeorm/entities/support-ticket.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Support tickets and threaded messages
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('support_tickets')
@Index(['userId', 'createdAt'])
export class SupportTicket {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Index()
  @Column({ name: 'userId', type: 'uuid' })
  userId!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId?: string | null;

  @Field()
  @Column({ type: 'varchar' })
  subject!: string;

  @Field()
  @Column({ type: 'text' })
  description!: string;

  @Field()
  @Column({
    type: 'enum',
    enum: ['BOOKING', 'PAYMENT', 'PRINT', 'OTHER'],
    default: 'OTHER',
  })
  category!: 'BOOKING' | 'PAYMENT' | 'PRINT' | 'OTHER';

  @Field()
  @Column({
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
  })
  priority!: 'LOW' | 'MEDIUM' | 'HIGH';

  @Field()
  @Column({
    type: 'enum',
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN',
  })
  status!: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

  @Field()
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}

@ObjectType()
@Entity('support_messages')
@Index(['ticketId', 'createdAt'])
export class SupportMessage {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Index()
  @Column({ name: 'ticketId', type: 'uuid' })
  ticketId!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'userId', type: 'uuid', nullable: true })
  userId?: string | null;

  @Field()
  @Column({ name: 'isAdmin', type: 'boolean', default: false })
  isAdmin!: boolean;

  @Field()
  @Column({ type: 'text' })
  message!: string;

  @Field()
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}
