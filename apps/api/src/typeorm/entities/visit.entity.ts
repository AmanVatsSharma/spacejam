/**
 * File:        apps/api/src/typeorm/entities/visit.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Visit entity — a scheduled center tour / site visit by a
 *              prospective member or lead. Powers the calendar's "Schedule
 *              Visit" flow and the visits shown alongside events/bookings.
 *              Modeled on the Request entity (same ownership shape).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-13
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
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from './user.entity';
import { Center } from './center.entity';
import { Lead } from './lead.entity';
import { TourType, VisitStatus } from '../../graphql/enums/visit.enums';

@ObjectType()
@Entity('visits')
@Index(['centerId', 'visitDate'])
@Index(['status', 'visitDate'])
export class Visit {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'centerId', type: 'uuid', nullable: true })
  centerId?: string | null;

  /** CRM lead this visit originated from, if any. Nullable for walk-ins. */
  @Field(() => ID, { nullable: true })
  @Column({ name: 'leadId', type: 'uuid', nullable: true })
  leadId?: string | null;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'requestedById', type: 'uuid', nullable: true })
  requestedById?: string | null;

  @Field(() => ID, { nullable: true })
  @Column({ name: 'assignedToId', type: 'uuid', nullable: true })
  assignedToId?: string | null;

  @Field()
  @Column({ name: 'visitorName', type: 'varchar' })
  visitorName!: string;

  @Field()
  @Column({ name: 'visitorPhone', type: 'varchar' })
  visitorPhone!: string;

  @Field(() => String, { nullable: true })
  @Column({ name: 'visitorEmail', type: 'varchar', nullable: true })
  visitorEmail?: string | null;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', nullable: true })
  company?: string | null;

  @Field()
  @Column({ name: 'visitDate', type: 'timestamp' })
  visitDate!: Date;

  @Field()
  @Column({ name: 'startTime', type: 'varchar' })
  startTime!: string;

  @Field()
  @Column({ name: 'endTime', type: 'varchar' })
  endTime!: string;

  @Field(() => TourType)
  @Column({ name: 'tourType', type: 'enum', enum: TourType, default: TourType.SCHEDULED_TOUR })
  tourType!: TourType;

  @Field(() => String, { nullable: true })
  @Column({ name: 'interestedPlan', type: 'varchar', nullable: true })
  interestedPlan?: string | null;

  @Field(() => Int)
  @Column({ name: 'partySize', type: 'int', default: 1 })
  partySize!: number;

  @Field(() => VisitStatus)
  @Column({ type: 'enum', enum: VisitStatus, default: VisitStatus.SCHEDULED })
  status!: VisitStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt!: Date;

  // Relations — nullable because the FK columns are nullable.
  @Field(() => Center, { nullable: true })
  @ManyToOne(() => Center)
  @JoinColumn({ name: 'centerId' })
  center!: Center | null;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedById' })
  requestedBy!: User | null;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User)
  @JoinColumn({ name: 'assignedToId' })
  assignedTo!: User | null;

  @Field(() => Lead, { nullable: true })
  @ManyToOne(() => Lead)
  @JoinColumn({ name: 'leadId' })
  lead!: Lead | null;
}
