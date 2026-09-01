/**
 * File:        typeorm/migrations/20260828200000-AddCustomerAutoRecharge.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Store per-customer token-wallet auto-recharge preferences
 *              collected during onboarding (enabled flag, contact channel
 *              value, low-balance threshold). Idempotent.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-28
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerAutoRecharge20260828200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customers"
        ADD COLUMN IF NOT EXISTS "autoRechargeEnabled" boolean NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS "autoRechargeContact" varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS "autoRechargeThreshold" int NULL;
    `);
    await queryRunner.query(`
      INSERT INTO "migrations" (timestamp, name)
      VALUES (20260828200000, 'AddCustomerAutoRecharge20260828200000')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN IF EXISTS "autoRechargeEnabled";`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN IF EXISTS "autoRechargeContact";`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN IF EXISTS "autoRechargeThreshold";`);
  }
}
