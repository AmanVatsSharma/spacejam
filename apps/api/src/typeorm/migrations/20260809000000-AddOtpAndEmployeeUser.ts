/**
 * File:        apps/api/src/typeorm/migrations/20260809000000-AddOtpAndEmployeeUser.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     (1) Create the `otp_requests` table backing phone-OTP login.
 *              (2) Add the nullable `userId` column + FK on
 *              `customer_employees` so an onboarded employee can be linked
 *              to a self-service EMPLOYEE login account.
 *
 *              All statements are idempotent (IF NOT EXISTS / DO $$ blocks).
 *              Prod is PG < 11 with synchronize:false, so every new entity
 *              requires an explicit migration like this.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOtpAndEmployeeUser20260809000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. otp_requests table ──────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "otp_requests" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone"         varchar(30) NOT NULL,
        "codeHash"      varchar NOT NULL,
        "expiresAt"     timestamp NOT NULL,
        "attempts"      int NOT NULL DEFAULT 0,
        "consumedAt"    timestamp NULL,
        "createdAt"     timestamp NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_OTP_REQUESTS_PHONE"
        ON "otp_requests" ("phone");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_OTP_REQUESTS_CREATED_AT"
        ON "otp_requests" ("createdAt");
    `);

    // ── 2. customer_employees.userId column + index ────────────────────────
    await queryRunner.query(`
      ALTER TABLE "customer_employees"
        ADD COLUMN IF NOT EXISTS "userId" uuid NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_CUSTOMER_EMPLOYEES_USER_ID"
        ON "customer_employees" ("userId");
    `);

    // Detach orphaned rows before adding the FK (matches the 20260807 pattern).
    await queryRunner.query(`
      UPDATE "customer_employees" t
      SET "userId" = NULL
      WHERE "userId" IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM "users" r WHERE r."id" = t."userId"
        );
    `);

    // ── 3. customer_employees.userId → users.id (SET NULL) ─────────────────
    await this.addFk(
      queryRunner,
      'FK_CUSTOMER_EMPLOYEES_USER',
      'customer_employees',
      'userId',
      'users',
      'id',
      'SET NULL',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customer_employees"
        DROP CONSTRAINT IF EXISTS "FK_CUSTOMER_EMPLOYEES_USER";
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_CUSTOMER_EMPLOYEES_USER_ID";`);
    await queryRunner.query(`ALTER TABLE "customer_employees" DROP COLUMN IF EXISTS "userId";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_OTP_REQUESTS_CREATED_AT";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_OTP_REQUESTS_PHONE";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "otp_requests";`);
  }

  /**
   * Add a foreign key idempotently. Postgres raises a duplicate-object error
   * if the constraint already exists, so we wrap it in a PL/pgSQL DO block.
   */
  private async addFk(
    queryRunner: QueryRunner,
    constraintName: string,
    table: string,
    column: string,
    refTable: string,
    refColumn: string,
    onDelete: 'CASCADE' | 'SET NULL',
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
