/**
 * File:        apps/api/src/typeorm/entities/referral.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Referral program — tracks invites and rewards
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
@Entity('referrals')
export class Referral {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Index()
  @Column({ name: 'referrerId', type: 'uuid' })
  referrerId!: string;

  @Field()
  @Index()
  @Column({ name: 'referredEmail', type: 'varchar' })
  referredEmail!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'referredUserId', type: 'uuid', nullable: true })
  referredUserId?: string | null;

  @Field()
  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Field()
  @Column({
    type: 'enum',
    enum: ['PENDING', 'SUCCESSFUL', 'REWARDED'],
    default: 'PENDING',
  })
  status!: 'PENDING' | 'SUCCESSFUL' | 'REWARDED';

  @Field(() => Float)
  @Column({ name: 'rewardAmount', type: 'float', default: 100 })
  rewardAmount!: number;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'rewardedAt', type: 'timestamp', nullable: true })
  rewardedAt?: Date | null;

  @Field()
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}
