/**
 * File:        apps/api/src/typeorm/entities/discount.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Discount entity for revenue management
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-12
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Center } from './center.entity';

@Entity('discounts')
@ObjectType()
export class Discount {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ unique: true })
  code!: string;

  @Field(() => Float)
  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage!: number;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxAmount?: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @Field()
  @Column({ name: 'isActive', default: true })
  isActive!: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'validFrom', type: 'timestamp', nullable: true })
  validFrom?: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'validUntil', type: 'timestamp', nullable: true })
  validUntil?: Date;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'minOrderAmount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderAmount?: number;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'usageLimit', type: 'int', nullable: true })
  usageLimit?: number;

  @Field()
  @Column({ name: 'usedCount', default: 0 })
  usedCount!: number;

  @Field(() => String, { nullable: true })
  @Column({ name: 'applicableTo', type: 'varchar', nullable: true })
  applicableTo?: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId?: string;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { eager: false, nullable: true })
  @JoinColumn({ name: 'centerId' })
  center?: Center;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
