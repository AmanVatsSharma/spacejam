/**
 * File:        auth/dto/enable-two-factor.input.ts
 * Module:      Api · Auth · DTOs
 * Purpose:     Confirm 2FA setup with the first valid TOTP code
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Field, InputType } from '@nestjs/graphql';
import { IsString, Length, Matches } from 'class-validator';

@InputType()
export class EnableTwoFactorInput {
  @Field()
  @IsString()
  @Length(6, 6)
  @Matches(/^\d+$/)
  code!: string;
}