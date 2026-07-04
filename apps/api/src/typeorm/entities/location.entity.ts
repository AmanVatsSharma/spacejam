/**
 * File:        apps/api/src/typeorm/entities/location.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Location entity for TypeORM
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
  OneToMany,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Center } from './center.entity';

@Entity('locations')
@ObjectType()
export class Location {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Field()
  @Column({ type: 'varchar', length: 120 })
  city!: string;

  @Field()
  @Column({ type: 'varchar', length: 120 })
  state!: string;

  @Field()
  @Column({ type: 'varchar', length: 120 })
  country!: string;

  @Field()
  @Column({ name: 'fullAddress' })
  fullAddress!: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true, type: 'varchar' })
  coordinates!: string;

  @Field()
  @Column({ default: 'Asia/Kolkata' })
  timezone!: string;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations
  @Field(() => [Center])
  @OneToMany(() => Center, (center) => center.location)
  centers!: Center[];
}