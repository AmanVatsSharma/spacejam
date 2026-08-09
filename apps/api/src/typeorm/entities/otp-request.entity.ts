/**
 * File:        apps/api/src/typeorm/entities/otp-request.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Phone-OTP login attempts. Stores a bcrypt-hashed code (never
 *              the plaintext), an expiry, an attempt counter, and a consumed
 *              timestamp so verifyOtp can enforce single-use + rate limits.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@Entity('otp_requests')
@ObjectType()
@Index(['phone'])
export class OtpRequest {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ type: 'varchar', length: 30 })
  phone!: string;

  /** bcrypt hash of the 6-digit code. Never persisted in plaintext. */
  @Column({ name: 'codeHash', type: 'varchar' })
  codeHash!: string;

  @Field()
  @Column({ name: 'expiresAt', type: 'timestamp' })
  expiresAt!: Date;

  @Field(() => Int, { defaultValue: 0 })
  @Column({ name: 'attempts', type: 'int', default: 0 })
  attempts!: number;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'consumedAt', type: 'timestamp', nullable: true })
  consumedAt?: Date | null;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}
