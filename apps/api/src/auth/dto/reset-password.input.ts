/**
 * File:        auth/dto/reset-password.input.ts
 * Module:      Api · Auth · DTOs
 * Purpose:     Reset-password mutation arguments
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsString()
  token!: string;

  @Field()
  @IsString()
  @MinLength(8)
  newPassword!: string;
}