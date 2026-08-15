/**
 * File:        typeorm/migrations/20260814100000-AddUserSettingsAndRoleEnums.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Backs the per-user settings feature and repairs role-enum
 *              drift: the application UserRole enum carries SUPER_ADMIN /
 *              CENTER_OWNER / EMPLOYEE / COMPANY_ADMIN, but databases
 *              bootstrapped from the original migrations never had those
 *              values added to users_role_enum (the earlier align migration
 *              targeted user_role_enum — a different type). Everything here
 *              is idempotent so it is safe on databases that already have
 *              the values (e.g. via synchronize).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-14
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserSettingsAndRoleEnums20260814100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Per-user settings blob (permissions, personal security/notification prefs).
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "settings" jsonb NULL;
    `);

    // Role enum values used by the application but missing from older
    // databases. DO/EXCEPTION keeps each ADD VALUE idempotent.
    for (const enumName of ['users_role_enum', 'user_role_enum']) {
      for (const value of ['SUPER_ADMIN', 'CENTER_OWNER', 'EMPLOYEE', 'COMPANY_ADMIN']) {
        await queryRunner.query(`
          DO $$ BEGIN
            ALTER TYPE "${enumName}" ADD VALUE '${value}';
          EXCEPTION WHEN duplicate_object THEN null;
                    WHEN undefined_object THEN null; END $$;
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Enum values are intentionally not removed — dropping values that may
    // be present in existing rows is unsafe; only the column is reversible.
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "settings";`);
  }
}
