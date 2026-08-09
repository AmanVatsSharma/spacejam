/**
 * File:        apps/api/src/typeorm/migrations/20260809400000-CreateAppSettings.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Create the `app_settings` table backing platform-level
 *              integration config (SMS provider, Razorpay). Idempotent.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAppSettings20260809400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "app_settings" (
        "id"        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "group"     varchar(40) NOT NULL,
        "key"       varchar(80) NOT NULL,
        "value"     text NOT NULL,
        "secret"    boolean NOT NULL DEFAULT false,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_APP_SETTINGS_KEY"
        ON "app_settings" ("key");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_APP_SETTINGS_GROUP"
        ON "app_settings" ("group");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_APP_SETTINGS_GROUP";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_APP_SETTINGS_KEY";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "app_settings";`);
  }
}
