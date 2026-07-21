/**
 * File:        apps/api/src/graphql/inputs/equipment.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     Equipment create/update/filter input types.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-20
 */
import { Field, InputType, ID, Float, Int } from '@nestjs/graphql';
import { EquipmentType, EquipmentStatus } from '../../typeorm/entities/equipment.entity';

@InputType()
export class CreateEquipmentInput {
  @Field() name!: string;
  @Field(() => EquipmentType) type!: EquipmentType;
  @Field(() => ID) centerId!: string;
  @Field({ nullable: true }) serialNumber?: string;
  @Field({ nullable: true }) brand?: string;
  @Field({ nullable: true }) model?: string;
  @Field(() => Float, { nullable: true }) purchasePrice?: number;
  @Field({ nullable: true }) purchaseDate?: string;
  @Field(() => Int, { nullable: true }) warrantyMonths?: number;
  @Field({ nullable: true }) notes?: string;
  @Field({ nullable: true }) location?: string;
}

@InputType()
export class UpdateEquipmentInput {
  @Field({ nullable: true }) name?: string;
  @Field(() => EquipmentType, { nullable: true }) type?: EquipmentType;
  @Field({ nullable: true }) serialNumber?: string;
  @Field({ nullable: true }) brand?: string;
  @Field({ nullable: true }) model?: string;
  @Field(() => Float, { nullable: true }) purchasePrice?: number;
  @Field({ nullable: true }) purchaseDate?: string;
  @Field(() => Int, { nullable: true }) warrantyMonths?: number;
  @Field({ nullable: true }) notes?: string;
  @Field({ nullable: true }) location?: string;
  @Field(() => EquipmentStatus, { nullable: true }) status?: EquipmentStatus;
}

@InputType()
export class EquipmentFiltersInput {
  @Field(() => ID, { nullable: true }) centerId?: string;
  @Field(() => EquipmentType, { nullable: true }) type?: EquipmentType;
  @Field(() => EquipmentStatus, { nullable: true }) status?: EquipmentStatus;
  @Field(() => ID, { nullable: true }) assignedTo?: string;
  @Field({ nullable: true }) search?: string;
  @Field(() => Int, { nullable: true }) limit?: number;
  @Field(() => Int, { nullable: true }) offset?: number;
}
