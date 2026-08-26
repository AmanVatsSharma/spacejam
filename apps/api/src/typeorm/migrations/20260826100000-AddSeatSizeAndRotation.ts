/**
 * File:        typeorm/migrations/20260826100000-AddSeatSizeAndRotation.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Floor map builder amendment: seats get w/h grid-unit size
 *              (NULL = 1×1 default) and rotation degrees (NULL = 0). Zone
 *              rotation lives in the layout JSON, not a column. Idempotent.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-26
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSeatSizeAndRotation20260826100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "seats"
        ADD COLUMN IF NOT EXISTS "w" float,
        ADD COLUMN IF NOT EXISTS "h" float,
        ADD COLUMN IF NOT EXISTS "rotation" float;
    `);
    await queryRunner.query(`
      INSERT INTO "migrations" (timestamp, name)
      VALUES (20260826100000, 'AddSeatSizeAndRotation20260826100000')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "seats" DROP COLUMN IF EXISTS "w";`);
    await queryRunner.query(`ALTER TABLE "seats" DROP COLUMN IF EXISTS "h";`);
    await queryRunner.query(`ALTER TABLE "seats" DROP COLUMN IF EXISTS "rotation";`);
  }
}
