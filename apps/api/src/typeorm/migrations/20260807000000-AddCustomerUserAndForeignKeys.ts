/**
 * File:        apps/api/src/typeorm/migrations/20260807000000-AddCustomerUserAndForeignKeys.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     (1) Add the nullable `userId` column on customers so an
 *              onboarded customer can be linked to a self-service login
 *              account. (2) Backfill the foreign-key constraints that the
 *              original lead/onboarding/customer migrations omitted, so that
 *              deleting a Customer/Lead/User cascades or nulls dependents
 *              instead of leaving orphaned rows.
 *
 *              All statements are idempotent (IF NOT EXISTS / caught errors).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-07
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerUserAndForeignKeys20260807000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. customers.userId column + index ────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "customers"
        ADD COLUMN IF NOT EXISTS "userId" uuid NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_CUSTOMERS_USER_ID"
        ON "customers" ("userId");
    `);

    // ── 2. customers.userId → users.id (SET NULL when user deleted) ───────
    await this.addFk(queryRunner, 'FK_CUSTOMERS_USER', 'customers', 'userId', 'users', 'id', 'SET NULL');

    // ── 3. leads.customerId → customers.id (SET NULL when customer deleted)
    //       (the column + index were added by 20260721000001 but the FK was
    //        never created, so deletes orphaned leads.)
    await this.addFk(queryRunner, 'FK_LEADS_CUSTOMER', 'leads', 'customerId', 'customers', 'id', 'SET NULL');

    // ── 4. leads.assignedToId → users.id (SET NULL) ───────────────────────
    await this.addFk(queryRunner, 'FK_LEADS_ASSIGNED_TO_USER', 'leads', 'assignedToId', 'users', 'id', 'SET NULL');

    // ── 5. leads.centerId → centers.id (SET NULL) ─────────────────────────
    await this.addFk(queryRunner, 'FK_LEADS_CENTER', 'leads', 'centerId', 'centers', 'id', 'SET NULL');

    // ── 6. onboardings.leadId → leads.id (CASCADE — paperwork dies with lead)
    await this.addFk(queryRunner, 'FK_ONBOARDINGS_LEAD', 'onboardings', 'leadId', 'leads', 'id', 'CASCADE');

    // ── 7. onboardings.customerId → customers.id (CASCADE) ────────────────
    await this.addFk(queryRunner, 'FK_ONBOARDINGS_CUSTOMER', 'onboardings', 'customerId', 'customers', 'id', 'CASCADE');

    // ── 8. onboardings.assignedToId → users.id (SET NULL) ─────────────────
    await this.addFk(queryRunner, 'FK_ONBOARDINGS_ASSIGNED_TO_USER', 'onboardings', 'assignedToId', 'users', 'id', 'SET NULL');

    // ── 9. onboardings.centerId → centers.id (SET NULL) ───────────────────
    await this.addFk(queryRunner, 'FK_ONBOARDINGS_CENTER', 'onboardings', 'centerId', 'centers', 'id', 'SET NULL');

    // ── 10. customers.centerId → centers.id (SET NULL) ────────────────────
    await this.addFk(queryRunner, 'FK_CUSTOMERS_CENTER', 'customers', 'centerId', 'centers', 'id', 'SET NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const fk of [
      'FK_CUSTOMERS_CENTER',
      'FK_ONBOARDINGS_CENTER',
      'FK_ONBOARDINGS_ASSIGNED_TO_USER',
      'FK_ONBOARDINGS_CUSTOMER',
      'FK_ONBOARDINGS_LEAD',
      'FK_LEADS_CENTER',
      'FK_LEADS_ASSIGNED_TO_USER',
      'FK_LEADS_CUSTOMER',
      'FK_CUSTOMERS_USER',
    ]) {
      await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT IF EXISTS "${fk}";`);
      await queryRunner.query(`ALTER TABLE "leads" DROP CONSTRAINT IF EXISTS "${fk}";`);
      await queryRunner.query(`ALTER TABLE "onboardings" DROP CONSTRAINT IF EXISTS "${fk}";`);
    }
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_CUSTOMERS_USER_ID";`);
    await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN IF EXISTS "userId";`);
  }

  /**
   * Add a foreign key idempotently. Postgres raises a duplicate-object
   * error if the constraint already exists, so we wrap it in a PL/pgSQL
   * DO block that checks information_schema first.
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
