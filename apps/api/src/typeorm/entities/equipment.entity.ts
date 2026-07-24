/**
 * File:        apps/api/src/typeorm/entities/equipment.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Equipment and assets assigned to centers — track ownership,
 *              assignment, maintenance, and depreciation.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, Int, Float, registerEnumType } from '@nestjs/graphql';
import { User } from './user.entity';
import { Center } from './center.entity';

export enum EquipmentStatus {
  AVAILABLE = 'AVAILABLE',
  ASSIGNED = 'ASSIGNED',
  IN_MAINTENANCE = 'IN_MAINTENANCE',
  RETIRED = 'RETIRED',
}

export enum EquipmentType {
  CHAIR = 'CHAIR',
  DESK = 'DESK',
  MONITOR = 'MONITOR',
  LAPTOP = 'LAPTOP',
  PROJECTOR = 'PROJECTOR',
  WHITEBOARD = 'WHITEBOARD',
  PRINTER = 'PRINTER',
  CAMERA = 'CAMERA',
  MICROPHONE = 'MICROPHONE',
  NETWORK = 'NETWORK',
  OTHER = 'OTHER',
}

registerEnumType(EquipmentStatus, { name: 'EquipmentStatus' });
registerEnumType(EquipmentType, { name: 'EquipmentType' });

@ObjectType()
@Entity('equipment')
@Index(['centerId', 'status'])
@Index(['type'])
@Index(['assignedTo'])
export class Equipment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column()
  name!: string;

  @Field(() => EquipmentType)
  @Column({ type: 'varchar' })
  type!: EquipmentType;

  @Field(() => EquipmentStatus, { defaultValue: EquipmentStatus.AVAILABLE })
  @Column({ type: 'varchar', default: EquipmentStatus.AVAILABLE })
  status!: EquipmentStatus;

  @Field(() => ID)
  @Column({ name: 'centerId' })
  centerId!: string;

  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'centerId' })
  center!: Center;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  serialNumber!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  brand!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  model!: string | null;

  @Field(() => Float, { nullable: true })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  purchasePrice!: number | null;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  purchaseDate!: string | null;

  @Field(() => Int, { nullable: true })
  @Column({ type: 'int', nullable: true })
  warrantyMonths!: number | null;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'assignedTo', type: 'uuid', nullable: true })
  assignedTo!: string | null;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assignedTo' })
  assignedUser!: User | null;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  assignedAt!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  location!: string | null;

  @Field()
  @CreateDateColumn()
  createdAt!: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt!: Date;
}
