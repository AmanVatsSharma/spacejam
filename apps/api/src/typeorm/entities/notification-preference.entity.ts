/**
 * File:        apps/api/src/typeorm/entities/notification-preference.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Per-user notification channel preferences
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('notification_preferences')
export class NotificationPreference {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Index({ unique: true })
  @Column({ name: 'userId', type: 'uuid', unique: true })
  userId!: string;

  @Field()
  @Column({ name: 'meetingReminders', type: 'boolean', default: true })
  meetingReminders!: boolean;

  @Field()
  @Column({ name: 'billingAlerts', type: 'boolean', default: true })
  billingAlerts!: boolean;

  @Field()
  @Column({ name: 'specialOffers', type: 'boolean', default: true })
  specialOffers!: boolean;

  @Field()
  @Column({ name: 'eventUpdates', type: 'boolean', default: true })
  eventUpdates!: boolean;

  @Field()
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
