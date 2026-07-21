/**
 * File:        apps/api/src/typeorm/migrations/20260721000001-AddLeadCustomerRelation.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Add customerId column to leads table so converted leads can be
 *              traced back to their originating customer record.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-21
 */
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddLeadCustomerRelation20260721000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'leads',
      new TableColumn({
        name: 'customerId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.createIndex('leads', ['customerId']);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('leads', 'IDX_LEADS_CUSTOMER_ID');
    await queryRunner.dropColumn('leads', 'customerId');
  }
}
