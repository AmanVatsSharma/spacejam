/**
 * File:        typeorm/migrations/20261003000000-BaselineIndexes.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Indexes and constraints the application relies on that the
 *              ENTITY decorators do not declare. A database bootstrapped with
 *              DATABASE_SYNCHRONIZE=true (a fresh dev/prod DB) has the tables
 *              and columns but would otherwise miss these, because they only
 *              ever existed in hand-written migrations:
 *                - UQ_ONBOARDINGS_IDEMPOTENCY_KEY: what makes a retried
 *                  submitOnboarding resolve to the SAME application (the race
 *                  fallback depends on this unique violation).
 *                - IDX_INVOICES_PAYMENT_REFERENCE: duplicate-UTR checks.
 *                - lookup indexes for onboarding status, audit logs, plans,
 *                  subscriptions, customer employees, OTP phone, booking
 *                  subscription.
 *                - unique offer code / one notification-preferences row per user.
 *              Fully idempotent (IF NOT EXISTS / duplicate-safe), additive only.
 *
 * Author:      Claude Sonnet 5.5
 * Last-updated: 2026-10-03
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

const INDEXES: [name: string, ddl: string][] = [
  ['UQ_ONBOARDINGS_IDEMPOTENCY_KEY', `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_ONBOARDINGS_IDEMPOTENCY_KEY" ON "onboardings" ("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL`],
  ['IDX_ONBOARDINGS_PAYMENT_STATUS', `CREATE INDEX IF NOT EXISTS "IDX_ONBOARDINGS_PAYMENT_STATUS" ON "onboardings" ("paymentStatus")`],
  ['IDX_INVOICES_PAYMENT_REFERENCE', `CREATE INDEX IF NOT EXISTS "IDX_INVOICES_PAYMENT_REFERENCE" ON "invoices" ("paymentReference")`],
  ['IDX_AUDIT_LOGS_CENTER_ID', `CREATE INDEX IF NOT EXISTS "IDX_AUDIT_LOGS_CENTER_ID" ON "audit_logs" ("centerId")`],
  ['IDX_BOOKINGS_SUB', `CREATE INDEX IF NOT EXISTS "IDX_BOOKINGS_SUB" ON "bookings" ("subscriptionId")`],
  ['IDX_CE_CUSTOMER', `CREATE INDEX IF NOT EXISTS "IDX_CE_CUSTOMER" ON "customer_employees" ("customerId")`],
  ['IDX_OTP_REQUESTS_PHONE', `CREATE INDEX IF NOT EXISTS "IDX_OTP_REQUESTS_PHONE" ON "otp_requests" ("phone")`],
  ['IDX_PLANS_CENTER', `CREATE INDEX IF NOT EXISTS "IDX_PLANS_CENTER" ON "plans" ("centerId")`],
  ['IDX_SUB_CUSTOMER', `CREATE INDEX IF NOT EXISTS "IDX_SUB_CUSTOMER" ON "subscriptions" ("customerId")`],
  ['IDX_SUB_PLAN', `CREATE INDEX IF NOT EXISTS "IDX_SUB_PLAN" ON "subscriptions" ("planId")`],
];

/** [table, constraint, column] — added only if the column has no unique constraint/index yet. */
const UNIQUES: [table: string, constraint: string, column: string][] = [
  ['offers', 'UQ_offers_code', 'code'],
  ['notification_preferences', 'UQ_notif_pref_user', 'userId'],
];

export class BaselineIndexes20261003000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [, ddl] of INDEXES) await queryRunner.query(ddl);

    for (const [table, constraint, column] of UNIQUES) {
      // Skip when the entity already produced a unique constraint/index on exactly this column.
      await queryRunner.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
              FROM pg_index i
              JOIN pg_class c ON c.oid = i.indrelid
              JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = ANY (i.indkey)
             WHERE c.relname = '${table}' AND i.indisunique AND i.indnatts = 1 AND a.attname = '${column}'
          ) THEN
            ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" UNIQUE ("${column}");
          END IF;
        EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
        END $$;
      `);
    }

    // Bookkeeping for DBs that track migrations; a DB bootstrapped via synchronize has no such table.
    await queryRunner.query(`
      DO $$
      BEGIN
        IF to_regclass('public.migrations') IS NOT NULL THEN
          INSERT INTO "migrations" (timestamp, name)
          SELECT 20261003000000, 'BaselineIndexes20261003000000'
          WHERE NOT EXISTS (SELECT 1 FROM "migrations" WHERE name = 'BaselineIndexes20261003000000');
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [name] of INDEXES) await queryRunner.query(`DROP INDEX IF EXISTS "${name}"`);
    for (const [table, constraint] of UNIQUES) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT IF EXISTS "${constraint}"`);
    }
    await queryRunner.query(`DELETE FROM "migrations" WHERE name = 'BaselineIndexes20261003000000'`);
  }
}
