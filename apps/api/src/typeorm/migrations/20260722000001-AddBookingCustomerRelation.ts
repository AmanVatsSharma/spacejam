/**
 * File:        apps/api/src/typeorm/migrations/20260722000001-AddBookingCustomerRelation.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Add customerId column to bookings table so booking history
 *              can be traced back to the customer record. Mirrors the
 *              pattern used by Invoice, Deposit, and Contract entities.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddBookingCustomerRelation20260722000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasCustomerId = await queryRunner.hasColumn('bookings', 'customerId');
    if (!hasCustomerId) {
      await queryRunner.addColumn(
        'bookings',
        new TableColumn({
          name: 'customerId',
          type: 'uuid',
          isNullable: true,
        }),
      );
    }

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_BOOKINGS_CUSTOMER_ID" ON "bookings" ("customerId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_BOOKINGS_CUSTOMER_ID"`);
    const hasCustomerId = await queryRunner.hasColumn('bookings', 'customerId');
    if (hasCustomerId) {
      await queryRunner.dropColumn('bookings', 'customerId');
    }
  }
}
