/**
 * File:        apps/api/src/typeorm/entities/notification-automation.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     NotificationAutomation — event-triggered notification rules
 *              (e.g. "when a booking is created, send a WhatsApp message").
 *              Backs the Settings > Notifications > Automations tab.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-24
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
import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { Center } from './center.entity';

/** Domain events that can trigger an automation. */
export enum AutomationTrigger {
  BOOKING_CREATED = 'BOOKING_CREATED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  LEAD_CREATED = 'LEAD_CREATED',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  DEPOSIT_RECEIVED = 'DEPOSIT_RECEIVED',
  REQUEST_CREATED = 'REQUEST_CREATED',
  EVENT_CREATED = 'EVENT_CREATED',
}

/** Delivery channel for the automation's message. */
export enum AutomationChannel {
  WHATSAPP = 'WHATSAPP',
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
}

registerEnumType(AutomationTrigger, { name: 'AutomationTrigger' });
registerEnumType(AutomationChannel, { name: 'AutomationChannel' });

@ObjectType()
@Entity('notification_automations')
@Index(['centerId', 'enabled'])
export class NotificationAutomation {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'centerId', type: 'uuid' })
  centerId!: string;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Field(() => AutomationTrigger)
  @Column({ type: 'varchar' })
  triggerEvent!: AutomationTrigger;

  @Field(() => AutomationChannel)
  @Column({ type: 'varchar' })
  channel!: AutomationChannel;

  /** Message template body; may contain {{variable}} placeholders. */
  @Field()
  @Column({ type: 'text' })
  template!: string;

  /** Optional variable metadata (e.g. available placeholders). */
  @Field(() => String, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  variables!: Record<string, any> | null;

  /** Minutes to wait after the trigger before sending. 0 = immediate. */
  @Field(() => Int, { defaultValue: 0 })
  @Column({ type: 'int', default: 0 })
  delayMinutes!: number;

  @Field(() => Boolean, { defaultValue: true })
  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @Field()
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
