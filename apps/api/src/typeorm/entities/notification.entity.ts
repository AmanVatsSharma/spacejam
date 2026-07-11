/**
 * File:        apps/api/src/typeorm/entities/notification.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Notification entity for user-facing notifications (booking,
 *              payment, deposit, lead, request, event, system).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-11
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from './user.entity';
import { Center } from './center.entity';
import { NotificationType, NotificationPriority } from '../../graphql/types/user.type';

@ObjectType()
@Entity('notifications')
@Index(['userId', 'createdAt'])
@Index(['centerId', 'createdAt'])
export class Notification {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'userId', type: 'uuid', nullable: true })
  userId!: string | null;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId!: string | null;

  @Field()
  @Column({ type: 'varchar' })
  title!: string;

  @Field()
  @Column({ type: 'text' })
  message!: string;

  @Field(() => NotificationType)
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type!: NotificationType;

  @Field(() => NotificationPriority)
  @Column({
    name: 'priority',
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority!: NotificationPriority;

  @Field(() => Boolean)
  @Column({ name: 'read', type: 'boolean', default: false })
  read!: boolean;

  @Field(() => String, { nullable: true })
  @Column({ name: 'actionUrl', type: 'varchar', nullable: true })
  actionUrl!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user!: User | null;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'centerId' })
  center!: Center | null;
}
