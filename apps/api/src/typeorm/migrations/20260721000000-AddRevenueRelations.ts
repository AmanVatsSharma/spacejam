/**
 * File:        apps/api/src/typeorm/migrations/20260721000000-AddRevenueRelations.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Add contractId column to invoices table for Invoice↔Contract relation.
 *              Other relations (Deposit/Contract/Invoice → Customer) reuse the
 *              already-existing customerId columns.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRevenueRelations20260721000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'invoices',
      new TableColumn({
        name: 'contractId',
        type: 'uuid',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('invoices', 'contractId');
  }
}
