/**
 * File:        apps/api/src/typeorm/entities/wallet-transaction.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Wallet transaction history (token credits/debits)
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
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
@Entity('wallet_transactions')
@Index(['userId', 'createdAt'])
export class WalletTransaction {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Index()
  @Column({ name: 'userId', type: 'uuid' })
  userId!: string;

  @Field()
  @Column({ type: 'enum', enum: ['CREDIT', 'DEBIT'] })
  type!: 'CREDIT' | 'DEBIT';

  @Field(() => Int)
  @Column({ type: 'int' })
  amount!: number;

  @Field(() => Int)
  @Column({ name: 'balanceAfter', type: 'int' })
  balanceAfter!: number;

  @Field({ nullable: true })
  @Column({ name: 'reference', type: 'varchar', nullable: true })
  reference?: string | null;

  @Field()
  @Column({ type: 'varchar', length: 100 })
  description!: string;

  @Field()
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}
