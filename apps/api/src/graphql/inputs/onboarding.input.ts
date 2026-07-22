/**
 * File:        apps/api/src/graphql/inputs/onboarding.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     GraphQL input DTOs for onboarding mutations and filters
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */
import { Field, ID, InputType, Int } from '@nestjs/graphql';
import {
    IsString,
    IsOptional,
    IsEmail,
    IsEnum,
    IsInt,
} from 'class-validator';
import { OnboardingStatus } from '../types/user.type';

@InputType()
export class CreateOnboardingInput {
    // Source tracking
    @Field(() => ID, { nullable: true })
    @IsString()
    @IsOptional()
    leadId?: string;

    @Field(() => ID, { nullable: true })
    @IsString()
    @IsOptional()
    customerId?: string;

    // Status — caller can skip, defaults to PENDING
    @Field(() => OnboardingStatus, { nullable: true })
    @IsEnum(OnboardingStatus)
    @IsOptional()
    status?: OnboardingStatus;

    // Company
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    companyName?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    companyAddress?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    gstNumber?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    planType?: string;

    @Field(() => Int, { nullable: true })
    @IsInt()
    @IsOptional()
    seatCount?: number;

    // Primary contact
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    contactName?: string;

    @Field({ nullable: true })
    @IsEmail()
    @IsOptional()
    contactEmail?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    contactPhone?: string;

    // Emergency
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    emergencyContact?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    emergencyPhone?: string;

    // Documents
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    idProofUrl?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    agreementUrl?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    notes?: string;

    @Field(() => ID, { nullable: true })
    @IsString()
    @IsOptional()
    assignedToId?: string;

    @Field(() => ID, { nullable: true })
    @IsString()
    @IsOptional()
    centerId?: string;
}

@InputType()
export class UpdateOnboardingInput {
    @Field(() => OnboardingStatus, { nullable: true })
    @IsEnum(OnboardingStatus)
    @IsOptional()
    status?: OnboardingStatus;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    companyName?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    companyAddress?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    gstNumber?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    planType?: string;

    @Field(() => Int, { nullable: true })
    @IsInt()
    @IsOptional()
    seatCount?: number;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    contactName?: string;

    @Field({ nullable: true })
    @IsEmail()
    @IsOptional()
    contactEmail?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    contactPhone?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    emergencyContact?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    emergencyPhone?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    idProofUrl?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    agreementUrl?: string;

    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    notes?: string;

    @Field(() => ID, { nullable: true })
    @IsString()
    @IsOptional()
    assignedToId?: string;

    @Field(() => ID, { nullable: true })
    @IsString()
    @IsOptional()
    centerId?: string;
}

@InputType()
export class OnboardingFiltersInput {
    @Field(() => OnboardingStatus, { nullable: true })
    @IsEnum(OnboardingStatus)
    @IsOptional()
    status?: OnboardingStatus;

    @Field(() => ID, { nullable: true })
    @IsString()
    @IsOptional()
    centerId?: string;

    @Field(() => ID, { nullable: true })
    @IsString()
    @IsOptional()
    assignedToId?: string;

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
