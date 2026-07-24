/**
 * File:        apps/api/src/typeorm/entities/customer-document.entity.ts
 * Module:      API · TypeORM Entities
 * Purpose:     Document uploaded for a customer during onboarding.
 *              Types: id_proof, agreement, kyc, gst_certificate, other.
 *              Stores URLs to S3/Cloudinary storage.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-23
 */
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Customer } from './customer.entity';

@Entity('customer_documents')
@ObjectType()
export class CustomerDocument {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => ID)
  @Column({ name: 'customerId', type: 'uuid' })
  customerId!: string;

  @Field(() => Customer, { nullable: true })
  @ManyToOne(() => Customer, (customer) => customer.documents, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Field()
  @Column({ type: 'varchar', length: 50 })
  documentType!: string;

  @Field()
  @Column({ type: 'text' })
  fileUrl!: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'bigint', nullable: true })
  fileSize?: string;

  @Field(() => String, { nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  mimeType?: string;

  @Field(() => Date, { nullable: true })
  @Column({ type: 'timestamp', nullable: true })
  uploadedAt?: Date;

  @Field(() => Date)
  @CreateDateColumn({ name: 'createdAt' })
  createdAt!: Date;
}
