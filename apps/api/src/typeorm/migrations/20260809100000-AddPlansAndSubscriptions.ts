/**
 * File:        apps/api/src/typeorm/migrations/20260809100000-AddPlansAndSubscriptions.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Create the `plans` and `subscriptions` tables backing the M2
 *              Plan/Subscription model. Idempotent (IF NOT EXISTS / DO $$) so
 *              it is safe to re-run on prod PG < 11 with synchronize:false.
 *
 *              plans            — a center's billable seat offering
 *              subscriptions    — a customer's commitment to N seats of a plan
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlansAndSubscriptions20260809100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. plans ───────────────────────────────────────────────────────────
    // Enums: PG < 11 has no CREATE TYPE IF NOT EXISTS, so wrap in DO blocks.
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "plans_status_enum" AS ENUM ('ACTIVE','INACTIVE','ARCHIVED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plans" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "centerId"      uuid NOT NULL,
        "name"          varchar(120) NOT NULL,
        "description"   text NULL,
        "seatType"      varchar NOT NULL,
        "billingCycle"  varchar NOT NULL DEFAULT 'MONTHLY',
        "price"         decimal(12,2) NOT NULL,
        "currency"      varchar(8) NOT NULL DEFAULT 'INR',
        "minSeats"      int NOT NULL DEFAULT 1,
        "status"        "plans_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt"     timestamp NOT NULL DEFAULT now(),
        "updatedAt"     timestamp NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_PLANS_CENTER_ID"
        ON "plans" ("centerId");
    `);

    // ── 2. subscriptions ───────────────────────────────────────────────────
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "subscriptions_status_enum" AS ENUM (
          'ACTIVE','SUSPENDED','CANCELLED','EXPIRED','PENDING'
        );
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "customerId"      uuid NOT NULL,
        "planId"          uuid NOT NULL,
        "centerId"        uuid NULL,
        "seatCount"       int NOT NULL,
        "unitPrice"       decimal(12,2) NOT NULL,
        "amount"          decimal(14,2) NOT NULL,
        "status"          "subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "startDate"       timestamp NOT NULL,
        "nextBillingDate" timestamp NOT NULL,
        "endDate"         timestamp NULL,
        "notes"           text NULL,
        "createdAt"       timestamp NOT NULL DEFAULT now(),
        "updatedAt"       timestamp NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SUBSCRIPTIONS_CUSTOMER_ID"
        ON "subscriptions" ("customerId");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_SUBSCRIPTIONS_PLAN_ID"
        ON "subscriptions" ("planId");
    `);

    // ── 3. Detach orphaned rows before FK constraints ─────────────────────
    await this.cleanOrphans(queryRunner, 'plans', 'centerId', 'centers');
    await this.cleanOrphans(queryRunner, 'subscriptions', 'customerId', 'customers');
    await this.cleanOrphans(queryRunner, 'subscriptions', 'planId', 'plans');
    await this.cleanOrphans(queryRunner, 'subscriptions', 'centerId', 'centers');

    // ── 4. Foreign keys ────────────────────────────────────────────────────
    await this.addFk(queryRunner, 'FK_PLANS_CENTER', 'plans', 'centerId', 'centers', 'id', 'SET NULL');
    await this.addFk(queryRunner, 'FK_SUBSCRIPTIONS_CUSTOMER', 'subscriptions', 'customerId', 'customers', 'id', 'CASCADE');
    await this.addFk(queryRunner, 'FK_SUBSCRIPTIONS_PLAN', 'subscriptions', 'planId', 'plans', 'id', 'RESTRICT');
    await this.addFk(queryRunner, 'FK_SUBSCRIPTIONS_CENTER', 'subscriptions', 'centerId', 'centers', 'id', 'SET NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const fk of [
      'FK_SUBSCRIPTIONS_CENTER',
      'FK_SUBSCRIPTIONS_PLAN',
      'FK_SUBSCRIPTIONS_CUSTOMER',
      'FK_PLANS_CENTER',
    ]) {
      await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT IF EXISTS "${fk}";`);
      await queryRunner.query(`ALTER TABLE "plans" DROP CONSTRAINT IF EXISTS "${fk}";`);
    }
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_SUBSCRIPTIONS_PLAN_ID";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_SUBSCRIPTIONS_CUSTOMER_ID";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_PLANS_CENTER_ID";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "plans";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "subscriptions_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "plans_status_enum";`);
  }

  private async cleanOrphans(
    queryRunner: QueryRunner,
    table: string,
    column: string,
    refTable: string,
  ): Promise<void> {
    await queryRunner.query(`
      UPDATE "${table}" t
      SET "${column}" = NULL
      WHERE "${column}" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "${refTable}" r WHERE r."id" = t."${column}"
        );
    `);
  }

  private async addFk(
    queryRunner: QueryRunner,
    constraintName: string,
    table: string,
    column: string,
    refTable: string,
    refColumn: string,
    onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT',
  ): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = '${constraintName}'
        ) THEN
          ALTER TABLE "${table}"
            ADD CONSTRAINT "${constraintName}"
            FOREIGN KEY ("${column}")
            REFERENCES "${refTable}"("${refColumn}")
            ON DELETE ${onDelete};
        END IF;
      END $$;
    `);
  }
}
