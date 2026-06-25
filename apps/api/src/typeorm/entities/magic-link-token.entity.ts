/**
 * File:        apps/api/src/typeorm/entities/magic-link-token.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Single-use passwordless login tokens. We store the SHA-256
 *              hash of the token; the raw token only ever lives in the
 *              email link.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
@Entity({ name: 'magic_link_tokens' })
@Index(['tokenHash'], { unique: true })
@Index(['userId'])
@Index(['expiresAt'])
export class MagicLinkToken {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 128 })
  tokenHash!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 255, nullable: true })
  redirectTo!: string | null;

  @Field()
  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  usedAt!: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 64, nullable: true })
  ipAddress!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;
}
