/**
 * File:        apps/api/src/auth/dto/verify-otp.input.ts
 * Module:      Api · Auth · DTOs
 * Purpose:     Input for the verifyOtp(phone, code) mutation
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Field, InputType } from '@nestjs/graphql';
import { Matches, MaxLength, MinLength } from 'class-validator';

@InputType()
export class VerifyOtpInput {
  @Field()
  @Matches(/^\+?\d{7,15}$/, {
    message: 'phone must be 7–15 digits with an optional leading +',
  })
  @MinLength(7)
  @MaxLength(16)
  phone!: string;

  /** 6-digit numeric OTP. */
  @Field()
  @Matches(/^\d{6}$/, { message: 'code must be exactly 6 digits' })
  code!: string;
}
