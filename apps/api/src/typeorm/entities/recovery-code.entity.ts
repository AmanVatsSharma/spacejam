/**
 * File:        apps/api/src/typeorm/entities/recovery-code.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     One-time backup codes issued when a user enables TOTP 2FA.
 *              We store the SHA-256 hash, never the plaintext.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { User } from './user.entity';

@ObjectType()
@Entity({ name: 'recovery_codes' })
@Index(['userId'])
@Index(['userId', 'codeHash'], { unique: true })
export class RecoveryCode {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user?: User;

  @Column({ type: 'varchar', length: 128 })
  codeHash!: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date | null;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;
}
