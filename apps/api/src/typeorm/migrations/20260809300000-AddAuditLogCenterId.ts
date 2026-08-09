/**
 * File:        apps/api/src/typeorm/migrations/20260809300000-AddAuditLogCenterId.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Add `centerId` to `audit_logs` so the audit trail can be
 *              center-scoped (center managers see only their center's events).
 *              Idempotent (PG < 11, synchronize:false).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuditLogCenterId20260809300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "centerId" uuid NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_AUDIT_LOGS_CENTER_ID"
        ON "audit_logs" ("centerId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_AUDIT_LOGS_CENTER_ID";`);
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "centerId";`);
  }
}
