/**
 * File:        apps/api/src/typeorm/entities/calendar-connection.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     CalendarConnection — stores OAuth tokens for external
 *              calendar providers (Google, Outlook).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from './user.entity';

export enum CalendarProvider {
  GOOGLE = 'GOOGLE',
  OUTLOOK = 'OUTLOOK',
  APPLE = 'APPLE',
}

registerEnumType(CalendarProvider, { name: 'CalendarProvider' });

@ObjectType()
@Entity('calendar_connections')
@Index(['userId', 'provider'], { unique: true })
export class CalendarConnection {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'userId' })
  userId!: string;

  @Field(() => User)
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Field(() => CalendarProvider)
  @Column({ type: 'varchar' })
  provider!: CalendarProvider;

  @Field(() => String)
  @Column({ name: 'accessToken', type: 'text' })
  accessToken!: string;

  @Field(() => String)
  @Column({ name: 'refreshToken', type: 'text' })
  refreshToken!: string;

  @Field()
  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Field(() => String, { nullable: true })
  @Column({ name: 'externalCalendarId', type: 'varchar', nullable: true })
  externalCalendarId!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Field(() => Boolean, { defaultValue: true })
  @Column({ type: 'boolean', default: true })
  syncEnabled!: boolean;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  lastSyncedAt!: Date | null;
}
