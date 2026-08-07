/**
 * File:        apps/api/src/typeorm/entities/offer.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Promo-code offers and their redemptions
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
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
@Entity('offers')
export class Offer {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @Field()
  @Column({ type: 'varchar' })
  title!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Field()
  @Column({
    type: 'enum',
    enum: ['PERCENTAGE', 'FIXED', 'TOKENS'],
    default: 'PERCENTAGE',
  })
  type!: 'PERCENTAGE' | 'FIXED' | 'TOKENS';

  @Field(() => Float)
  @Column({ type: 'float' })
  value!: number;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'minOrderAmount', type: 'float', nullable: true })
  minOrderAmount?: number | null;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'maxDiscount', type: 'float', nullable: true })
  maxDiscount?: number | null;

  @Field()
  @Column({ name: 'validFrom', type: 'timestamp' })
  validFrom!: Date;

  @Field()
  @Column({ name: 'validUntil', type: 'timestamp' })
  validUntil!: Date;

  @Field()
  @Column({ name: 'isActive', type: 'boolean', default: true })
  isActive!: boolean;

  @Field(() => Int)
  @Column({ name: 'usageCount', type: 'int', default: 0 })
  usageCount!: number;

  @Field(() => Int, { nullable: true })
  @Column({ name: 'usageLimit', type: 'int', nullable: true })
  usageLimit?: number | null;

  @Field()
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}

@ObjectType()
@Entity('offer_redemptions')
@Index(['offerId', 'userId'])
export class OfferRedemption {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Index()
  @Column({ name: 'offerId', type: 'uuid' })
  offerId!: string;

  @Field(() => ID)
  @Index()
  @Column({ name: 'userId', type: 'uuid' })
  userId!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'bookingId', type: 'uuid', nullable: true })
  bookingId?: string | null;

  @Field(() => Float, { nullable: true })
  @Column({ name: 'discountAmount', type: 'float', nullable: true })
  discountAmount?: number | null;

  @Field()
  @Column({ name: 'redeemedAt', type: 'timestamp' })
  redeemedAt!: Date;
}
