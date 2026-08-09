/**
 * File:        apps/api/src/typeorm/migrations/20260809200000-AddBookingSubscriptionId.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Add `subscriptionId` to the `bookings` table so the M3 billing
 *              fan-out can (a) detect an already-processed cycle per
 *              subscription and (b) link a seat booking back to its company
 *              subscription. Idempotent (PG < 11, synchronize:false).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-09
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBookingSubscriptionId20260809200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bookings"
        ADD COLUMN IF NOT EXISTS "subscriptionId" uuid NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_BOOKINGS_SUBSCRIPTION_ID"
        ON "bookings" ("subscriptionId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_BOOKINGS_SUBSCRIPTION_ID";`);
    await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN IF EXISTS "subscriptionId";`);
  }
}
