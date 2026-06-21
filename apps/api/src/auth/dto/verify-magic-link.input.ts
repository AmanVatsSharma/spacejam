/**
 * File:        apps/api/src/auth/dto/verify-magic-link.input.ts
 * Module:      Api · Auth · DTOs
 * Purpose:     Magic-link consume mutation arguments
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-21
 */
import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class VerifyMagicLinkInput {
  @Field()
  @IsString()
  @MinLength(8)
  token!: string;
}
