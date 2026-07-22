/**
 * File:        apps/api/src/typeorm/migrations/20260722000000-CreateOnboarding.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Create `onboardings` table tracking the lead-to-customer
 *              conversion pipeline with company / contact / document fields.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-22
 */
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateOnboarding20260722000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'onboardings',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'uuid_generate_v4()' },
          { name: 'leadId', type: 'uuid', isNullable: true },
          { name: 'customerId', type: 'uuid', isNullable: true },
          { name: 'status', type: 'enum', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'], default: "'PENDING'" },
          { name: 'companyName', type: 'varchar', isNullable: true },
          { name: 'companyAddress', type: 'text', isNullable: true },
          { name: 'gstNumber', type: 'varchar', isNullable: true },
          { name: 'planType', type: 'varchar', isNullable: true },
          { name: 'seatCount', type: 'int', isNullable: true },
          { name: 'contactName', type: 'varchar', isNullable: true },
          { name: 'contactEmail', type: 'varchar', isNullable: true },
          { name: 'contactPhone', type: 'varchar', isNullable: true },
          { name: 'emergencyContact', type: 'varchar', isNullable: true },
          { name: 'emergencyPhone', type: 'varchar', isNullable: true },
          { name: 'idProofUrl', type: 'text', isNullable: true },
          { name: 'agreementUrl', type: 'text', isNullable: true },
          { name: 'completedAt', type: 'date', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          { name: 'assignedToId', type: 'uuid', isNullable: true },
          { name: 'centerId', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex('onboardings', new TableIndex({ name: 'IDX_ONBOARDINGS_STATUS', columnNames: ['status'] }));
    await queryRunner.createIndex('onboardings', new TableIndex({ name: 'IDX_ONBOARDINGS_LEAD_ID', columnNames: ['leadId'] }));
    await queryRunner.createIndex('onboardings', new TableIndex({ name: 'IDX_ONBOARDINGS_CUSTOMER_ID', columnNames: ['customerId'] }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('onboardings', true);
  }
}
