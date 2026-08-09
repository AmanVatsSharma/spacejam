/**
 * File:        apps/api/src/typeorm/entities/app-setting.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Platform-level integration settings (SMS provider, payment
 *              gateway). Single-row-per-key store so super-admin config can
 *              be read/written without a dedicated table per integration.
 *              Secrets (API keys) are stored encrypted-at-rest by the DB and
 *              only ever written via the super-admin resolver — never
 *              returned in full on read (masked).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
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

@Entity('app_settings')
@ObjectType()
@Index(['key'], { unique: true })
export class AppSetting {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Logical group: 'sms' | 'payment' | … */
  @Field()
  @Column({ type: 'varchar', length: 40 })
  group!: string;

  /** Setting key, e.g. 'sms.provider', 'razorpay.keyId'. */
  @Field()
  @Column({ type: 'varchar', length: 80 })
  key!: string;

  /** Stored value. Secret keys should be masked before returning to clients. */
  @Field()
  @Column({ type: 'text' })
  value!: string;

  /** True if this value is a secret (API key / secret) — masked on read. */
  @Field({ defaultValue: false })
  @Column({ type: 'boolean', default: false })
  secret!: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
