/**
 * File:        apps/api/src/typeorm/migrations/20260724010000-AddEmployeeSeatRelation.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Add seatId column (FK to seats) to customer_employees so team
 *              members can be assigned to a real Inventory seat instead of a
 *              free-text seatNumber. Idempotent (IF NOT EXISTS).
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-24
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeeSeatRelation20260724010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "customer_employees"
        ADD COLUMN IF NOT EXISTS "seatId" uuid NULL
        REFERENCES "seats"("id") ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_customer_employees_seat"
        ON "customer_employees" ("seatId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customer_employees" DROP COLUMN IF EXISTS "seatId";`);
  }
}
