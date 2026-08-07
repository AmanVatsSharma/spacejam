/**
 * File:        apps/api/src/graphql/inputs/print-job.input.ts
 * Module:      API · GraphQL · Inputs
 * Purpose:     Print job input DTOs
 *
 * Author:      Developer
 * Last-updated: 2026-08-05
 */
import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsInt, IsBoolean, IsOptional, Min } from 'class-validator';

@InputType()
export class CreatePrintJobInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  pages!: number;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsInt()
  @IsOptional()
  copies?: number;

  @Field({ nullable: true, defaultValue: false })
  @IsBoolean()
  @IsOptional()
  color?: boolean;

  @Field({ nullable: true, defaultValue: 'A4' })
  @IsString()
  @IsOptional()
  paperSize?: string;

  @Field({ nullable: true, defaultValue: 'single' })
  @IsString()
  @IsOptional()
  sides?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  notes?: string;
}
