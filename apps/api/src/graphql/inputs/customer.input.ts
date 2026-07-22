/**
 * File:        apps/api/src/graphql/inputs/customer.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for Customer mutations and filters
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-06
 */
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import { CustomerStatus } from '../types/user.type';
import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsEmail,
    IsEnum,
    IsInt,
    IsDate,
} from 'class-validator';

@InputType()
export class CreateCustomerInput {
    @Field()
    @IsString()
    @IsNotEmpty()
    name!: string;

    @Field()
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    phone?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    company?: string;

    @Field(() => CustomerStatus, { nullable: true })
    @IsEnum(CustomerStatus)
    @IsOptional()
    status?: CustomerStatus;

    @Field(() => ID, { nullable: true })
    @IsString()
    @IsOptional()
    centerId?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    teamSize?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    location?: string;

    @Field({ nullable: true })
    @IsDate()
    @IsOptional()
    joinDate?: Date;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    notes?: string;
}

@InputType()
export class UpdateCustomerInput {
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    name?: string;

    @Field({ nullable: true })
    @IsEmail()
    @IsOptional()
    email?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    phone?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    company?: string;

    @Field(() => CustomerStatus, { nullable: true })
    @IsEnum(CustomerStatus)
    @IsOptional()
    status?: CustomerStatus;

    @Field(() => ID, { nullable: true })
    @IsString()
    @IsOptional()
    centerId?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    teamSize?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    location?: string;

    @Field({ nullable: true })
    @IsDate()
    @IsOptional()
    joinDate?: Date;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    notes?: string;
}

@InputType()
export class CustomerFiltersInput {
    @Field(() => CustomerStatus, { nullable: true })
    @IsEnum(CustomerStatus)
    @IsOptional()
    status?: CustomerStatus;

    @Field(() => ID, { nullable: true })
    @IsString()
    @IsOptional()
    centerId?: string;

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
