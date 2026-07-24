/**
 * File:        apps/api/src/graphql/inputs/customer-document.input.ts
 * Module:      API · GraphQL Inputs
 * Purpose:     CustomerDocument inputs (create/update) for the documents
 *              tab on the customer detail page.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-24
 */
import { Field, InputType, ID } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

@InputType()
export class CreateCustomerDocumentInput {
  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name!: string;

  /** id_proof | agreement | kyc | gst_certificate | other */
  @Field()
  @IsString()
  @IsNotEmpty()
  documentType!: string;

  /** URL to S3/Cloudinary storage. */
  @Field()
  @IsString()
  @IsNotEmpty()
  fileUrl!: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  fileSize?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  mimeType?: string;
}

@InputType()
export class UpdateCustomerDocumentInput {
  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  documentType?: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  fileUrl?: string;
}
