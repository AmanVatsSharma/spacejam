/**
 * File:        apps/api/src/typeorm/entities/event-ticket-tier.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     EventTicketTier — defines pricing tiers (early-bird,
 *              VIP, regular) with quantity caps and sold-count.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
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
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { Event } from './event.entity';

@Entity('event_ticket_tiers')
@Index(['eventId'])
@ObjectType()
export class EventTicketTier {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'eventId' })
  eventId!: string;

  @Field(() => Event)
  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Field()
  @Column()
  name!: string;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price!: number;

  @Field(() => Int)
  @Column({ type: 'int' })
  quantity!: number;

  @Field(() => Int, { defaultValue: 0 })
  @Column({ type: 'int', default: 0 })
  soldCount!: number;

  @Field({ nullable: true })
  @Column({ type: 'date', nullable: true })
  earlyBirdEndDate!: string | null;

  @Field({ nullable: true })
  @Column({ type: 'varchar', length: 128, nullable: true })
  description!: string | null;

  @Field({ defaultValue: true })
  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt!: Date;
}
