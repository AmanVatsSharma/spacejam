/**
 * File:        apps/api/src/auth/dto/request-otp.input.ts
 * Module:      Api · Auth · DTOs
 * Purpose:     Input for the requestOtp(phone) mutation
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { Field, InputType } from '@nestjs/graphql';
import { Matches, MaxLength, MinLength } from 'class-validator';

@InputType()
export class RequestOtpInput {
  /** E.164-ish phone (country code + digits). 7–15 digits, optional leading +. */
  @Field()
  @Matches(/^\+?\d{7,15}$/, {
    message: 'phone must be 7–15 digits with an optional leading +',
  })
  @MinLength(7)
  @MaxLength(16)
  phone!: string;
}
