/**
 * File:        typeorm/migrations/20260828100000-AddQrPaymentMethod.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Manual UPI QR payments: adds the QR value to the invoice
 *              payment-method enums and a paymentReference column to
 *              invoices so admins can attach the UPI transaction id as
 *              proof when accepting a manual QR payment. Idempotent.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-28
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddQrPaymentMethod20260828100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const enumName of ['invoices_paymentmethod_enum', 'payments_method_enum']) {
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TYPE "${enumName}" ADD VALUE 'QR';
        EXCEPTION WHEN duplicate_object THEN null;
                  WHEN undefined_object THEN null; END $$;
      `);
    }
    await queryRunner.query(`
      ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "paymentReference" varchar(100) NULL;
    `);
    await queryRunner.query(`
      INSERT INTO "migrations" (timestamp, name)
      VALUES (20260828100000, 'AddQrPaymentMethod20260828100000')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN IF EXISTS "paymentReference";`);
  }
}
