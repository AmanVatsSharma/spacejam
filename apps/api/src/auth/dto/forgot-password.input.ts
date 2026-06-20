/**
 * File:        auth/dto/forgot-password.input.ts
 * Module:      Api · Auth · DTOs
 * Purpose:     Forgot-password mutation arguments
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail } from 'class-validator';

@InputType()
export class ForgotPasswordInput {
  @Field()
  @IsEmail()
  email!: string;
}