/**
 * File:        typeorm/migrations/20260827100000-ExtendPaymentMethodEnums.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Add CASH, CHEQUE, NET_BANKING, ONLINE to the invoice and
 *              payment method enums. The GraphQL PaymentMethod enum already
 *              exposes them (matching the values the align migration added
 *              to legacy DBs), but invoices_paymentmethod_enum /
 *              payments_method_enum never got them — persisting those
 *              methods failed at the DB layer. Idempotent.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-27
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExtendPaymentMethodEnums20260827100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const enumName of ['invoices_paymentmethod_enum', 'payments_method_enum']) {
      for (const value of ['CASH', 'CHEQUE', 'NET_BANKING', 'ONLINE']) {
        await queryRunner.query(`
          DO $$ BEGIN
            ALTER TYPE "${enumName}" ADD VALUE '${value}';
          EXCEPTION WHEN duplicate_object THEN null;
                    WHEN undefined_object THEN null; END $$;
        `);
      }
    }
    await queryRunner.query(`
      INSERT INTO "migrations" (timestamp, name)
      VALUES (20260827100000, 'ExtendPaymentMethodEnums20260827100000')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(): Promise<void> {
    // Enum values are intentionally not removable (unsafe with live rows).
  }
}
