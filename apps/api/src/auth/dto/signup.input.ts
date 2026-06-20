/**
 * File:        auth/dto/signup.input.ts
 * Module:      Api · Auth · DTOs
 * Purpose:     Sign-up mutation arguments
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-06-20
 */
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class SignupInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;
}