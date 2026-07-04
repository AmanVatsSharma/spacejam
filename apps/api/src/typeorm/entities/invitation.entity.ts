/**
 * File:        apps/api/src/typeorm/entities/invitation.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Invitation entity for TypeORM
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-07
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { UserRole } from '../../graphql/types/user.type';

@Entity('invitations')
@ObjectType()
export class Invitation {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column()
  email!: string;

  @Field(() => UserRole)
  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId!: string | null;

  @Field()
  @Column({ unique: true })
  token!: string;

  @Field(() => Date)
  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'acceptedAt', type: 'timestamp', nullable: true })
  acceptedAt!: Date | null;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}