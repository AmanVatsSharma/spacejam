/**
 * File:        apps/api/src/typeorm/entities/user.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     User entity for TypeORM
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
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
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserRole } from '../../graphql/types/user.type';
import { JsonScalar } from '../../graphql/scalars/json.scalar';
import { Center } from './center.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ unique: true })
  email!: string;

  @Field()
  @Column()
  name!: string;

  @Field(() => UserRole)
  @Column({ type: 'enum', enum: UserRole, default: UserRole.MEMBER })
  role!: UserRole;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  centerId!: string | null;

  /**
   * Per-user settings blob (jsonb): permissions matrix, personal security
   * and notification preferences. Distinct from Center.settings — those are
   * center-wide policy; these belong to this user regardless of center.
   * Groups are whitelisted server-side (see sanitizeUserSettings).
   */
  @Field(() => JsonScalar, { nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  settings!: Record<string, any> | null;

  /**
   * The Customer (company) this user belongs to, if any. NOT a DB column —
   * resolved via UserResolver.customerId field resolver (looks up
   * Customer.userId). Lets the mobile Plans screen know which company to
   * subscribe against.
   */
  @Field(() => String, { nullable: true })
  customerId?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  avatar!: string | null;

  @Field()
  @Column({ name: 'isActive', default: true })
  active!: boolean;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'lastLogin', type: 'timestamp', nullable: true })
  lastLoginAt!: Date | null;

  @Field()
  @Column({ type: 'int', default: 0 })
  tokenBalance!: number;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  deviceToken?: string;

  @Column({ type: 'varchar', nullable: true })
  passwordHash!: string;

  @Field()
  @Column({ default: false })
  twoFactorEnabled!: boolean;

  @Column({ type: 'varchar', nullable: true })
  twoFactorSecret?: string;

  @Column({ type: 'varchar', nullable: true })
  passwordResetToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  passwordResetExpiresAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  emailVerifyToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifyExpiresAt?: Date;

  @Field()
  @Column({ name: 'emailVerified', default: false })
  emailVerified!: boolean;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, (center: any) => center.users, { nullable: true })
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  // Note: Inverse relations removed to break circular GraphQL references - use queries instead
}