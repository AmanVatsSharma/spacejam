/**
 * File:        apps/api/src/typeorm/migrations/20260724000000-CreateNotificationAutomations.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Create notification_automations table for event-triggered
 *              notification rules (Settings > Notifications > Automations).
 *              Idempotent (IF NOT EXISTS) so it is safe to re-run on prod.
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-24
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationAutomations20260724000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_automations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "centerId" uuid NOT NULL REFERENCES "centers"("id") ON DELETE CASCADE,
        "name" varchar(255) NOT NULL,
        "triggerEvent" varchar(50) NOT NULL,
        "channel" varchar(20) NOT NULL,
        "template" text NOT NULL,
        "variables" jsonb NULL,
        "delayMinutes" int NOT NULL DEFAULT 0,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_notification_automations_center_enabled"
        ON "notification_automations" ("centerId", "enabled");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_automations";`);
  }
}
