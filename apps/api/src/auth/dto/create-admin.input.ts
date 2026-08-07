/**
 * File:        auth/dto/create-admin.input.ts
 * Module:      Api · Auth · DTOs
 * Purpose:     Input for creating a new dashboard admin user.
 *              Only SUPER_ADMIN or CENTER_MANAGER (Admin) roles are allowed.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-08-07
 */
import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength, IsEnum } from 'class-validator';

/**
 * The two roles a super admin can provision on the dashboard:
 *  - SUPER_ADMIN  → full system access
 *  - CENTER_MANAGER → manages a single center (referred to as "Admin" in the UI)
 */
export enum DashboardAdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  CENTER_MANAGER = 'CENTER_MANAGER',
}

registerEnumType(DashboardAdminRole, {
  name: 'DashboardAdminRole',
  description: 'Allowed roles when provisioning a new dashboard admin account',
});

@InputType()
export class CreateAdminInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @Field()
  @IsString()
  @MaxLength(120)
  name!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field(() => DashboardAdminRole)
  @IsEnum(DashboardAdminRole)
  role!: DashboardAdminRole;

  /**
   * Required when role is CENTER_MANAGER — the center this admin will manage.
   */
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  centerId?: string;
}
