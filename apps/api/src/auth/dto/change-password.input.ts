/**
 * File:        apps/api/src/auth/dto/change-password.input.ts
 * Module:      Api · Auth · DTOs
 * Purpose:     Change-password mutation arguments
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  @MinLength(8)
  currentPassword!: string;

  @Field()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}
