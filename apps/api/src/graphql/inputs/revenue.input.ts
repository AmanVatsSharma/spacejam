/**
 * File:        apps/api/src/graphql/inputs/revenue.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for revenue mutations and filters
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-02
 */
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { InvoiceStatus, PaymentMethod } from '../types/user.type';
import { IsString, IsNotEmpty, IsOptional, IsEmail, IsNumber, IsInt, IsEnum, IsBoolean, IsDate } from 'class-validator';

@InputType()
export class CreateInvoiceInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  planName?: string;

  @Field()
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @Field(() => InvoiceStatus, { nullable: true })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  issueDate?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @Field(() => PaymentMethod, { nullable: true })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class UpdateInvoiceInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  customerName?: string;

  @Field({ nullable: true })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  planName?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  tax?: number;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  totalAmount?: number;

  @Field(() => InvoiceStatus, { nullable: true })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  issueDate?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  paidDate?: Date;

  @Field(() => PaymentMethod, { nullable: true })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class InvoiceFiltersInput {
  @Field(() => InvoiceStatus, { nullable: true })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  customerId?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dateFrom?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dateTo?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  offset?: number;
}

@InputType()
export class CreateDepositInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field()
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  type?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  receivedDate?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class UpdateDepositInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  customerName?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  receivedDate?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  releasedDate?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}

@InputType()
export class DepositFiltersInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  type?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  customerId?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dateFrom?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dateTo?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  offset?: number;
}

@InputType()
export class CreateContractInput {
  @Field(() => ID)
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  planName?: string;

  @Field()
  @IsDate()
  @IsNotEmpty()
  startDate!: Date;

  @Field()
  @IsDate()
  @IsNotEmpty()
  endDate!: Date;

  @Field()
  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  paymentFrequency?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  terms?: string;
}

@InputType()
export class UpdateContractInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  customerName?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  planName?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  startDate?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  status?: string;

  @Field({ nullable: true })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  paymentFrequency?: string;

  @Field({ nullable: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  terms?: string;
}

@InputType()
export class ContractFiltersInput {
  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  status?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  centerId?: string;

  @Field(() => ID, { nullable: true })
  @IsString()
  @IsOptional()
  customerId?: string;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dateFrom?: Date;

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  dateTo?: Date;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  search?: string;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  offset?: number;
}
