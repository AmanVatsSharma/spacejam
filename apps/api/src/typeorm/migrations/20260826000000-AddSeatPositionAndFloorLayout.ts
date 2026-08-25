/**
 * File:        typeorm/migrations/20260826000000-AddSeatPositionAndFloorLayout.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Backs the manual floor map builder: seats get nullable x/y
 *              grid-unit coordinates (NULL = unplaced, sits in the editor
 *              tray), floors get the layout jsonb (zones + labels +
 *              version). Idempotent — prod is synchronize:false on PG <11.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-26
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeatPositionAndFloorLayout20260826000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seats"
        ADD COLUMN IF NOT EXISTS "x" float,
        ADD COLUMN IF NOT EXISTS "y" float;
    `);
    await queryRunner.query(`
      ALTER TABLE "floors"
        ADD COLUMN IF NOT EXISTS "layout" jsonb;
    `);
    await queryRunner.query(`
      INSERT INTO "migrations" (timestamp, name)
      VALUES (20260826000000, 'AddSeatPositionAndFloorLayout20260826000000')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "seats" DROP COLUMN IF EXISTS "x";`);
    await queryRunner.query(`ALTER TABLE "seats" DROP COLUMN IF EXISTS "y";`);
    await queryRunner.query(`ALTER TABLE "floors" DROP COLUMN IF EXISTS "layout";`);
  }
}
