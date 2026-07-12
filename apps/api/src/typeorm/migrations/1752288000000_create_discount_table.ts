/**
 * File:        apps/api/src/typeorm/migrations/1752288000000_create_discount_table.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Create discounts table
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-12
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDiscountTable1752288000000 implements MigrationInterface {
  name = 'CreateDiscountTable1752288000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "discounts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying NOT NULL UNIQUE,
        "percentage" numeric(5,2) NOT NULL,
        "maxAmount" numeric(10,2),
        "description" text,
        "isActive" boolean NOT NULL DEFAULT true,
        "validFrom" timestamp,
        "validUntil" timestamp,
        "minOrderAmount" numeric(10,2),
        "usageLimit" integer,
        "usedCount" integer NOT NULL DEFAULT 0,
        "applicableTo" varchar,
        "centerId" uuid,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "PK_discounts_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_discounts_code" ON "discounts" ("code")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_discounts_code"`);
    await queryRunner.query(`DROP TABLE "discounts"`);
  }
}
