/**
 * File:        apps/api/src/typeorm/entities/print-job.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Print job requests submitted by mobile/web users
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';

@ObjectType()
@Entity('print_jobs')
@Index(['userId', 'createdAt'])
export class PrintJob {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Index()
  @Column({ name: 'userId', type: 'uuid' })
  userId!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId?: string | null;

  @Field()
  @Column({ name: 'fileUrl', type: 'varchar' })
  fileUrl!: string;

  @Field()
  @Column({ name: 'fileName', type: 'varchar' })
  fileName!: string;

  @Field(() => Int)
  @Column({ type: 'int' })
  pages!: number;

  @Field(() => Int)
  @Column({ type: 'int', default: 1 })
  copies!: number;

  @Field()
  @Column({ name: 'color', type: 'boolean', default: false })
  color!: boolean;

  @Field()
  @Column({ name: 'paperSize', type: 'varchar', default: 'A4' })
  paperSize!: string;

  @Field()
  @Column({ name: 'sides', type: 'varchar', default: 'single' })
  sides!: string;

  @Field(() => Float)
  @Column({ type: 'float', default: 0 })
  cost!: number;

  @Field()
  @Column({
    type: 'enum',
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  })
  status!: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  @Field({ nullable: true })
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes?: string | null;

  @Field()
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field()
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;
}
