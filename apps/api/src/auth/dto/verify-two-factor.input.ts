/**
 * File:        auth/dto/verify-two-factor.input.ts
 * Module:      Api · Auth · DTOs
 * Purpose:     2FA verify-challenge mutation arguments
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Field, InputType } from '@nestjs/graphql';
import { IsString, Length, Matches } from 'class-validator';

@InputType()
export class VerifyTwoFactorInput {
  @Field()
  @IsString()
  challengeToken!: string;

  @Field()
  @IsString()
  @Length(6, 6, { message: 'code must be 6 digits' })
  @Matches(/^\d+$/, { message: 'code must contain only digits' })
  code!: string;
}