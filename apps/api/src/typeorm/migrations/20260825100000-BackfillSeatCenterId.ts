/**
 * File:        typeorm/migrations/20260825100000-BackfillSeatCenterId.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Backfill seats.centerId from the owning floor. createSeat
 *              historically never set it, so every seat had centerId=NULL
 *              — center-scoped queries (seats, dashboardMetrics) returned
 *              nothing for CENTER_MANAGER, which is why floor maps showed
 *              empty after center setup. Idempotent.
 *
 * Author:      ZCode
 * Last-updated: 2026-08-25
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillSeatCenterId20260825100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE seats s
      SET "centerId" = f."centerId"
      FROM floors f
      WHERE f.id = s."floorId"
        AND s."centerId" IS NULL
        AND f."centerId" IS NOT NULL;
    `);
  }

  public async down(): Promise<void> {
    // No-op: the backfill only fills previously-NULL values; there is
    // nothing safe to reverse.
  }
}
