/**
 * File:        apps/api/src/typeorm/migrations/20260813100000-CreateVisits.ts
 * Module:      API · TypeORM Migrations
 * Purpose:     Create the `visits` table + its enum types. Idempotent and
 *              prod-safe (works on Postgres < 11 which lacks
 *              `CREATE TYPE IF NOT EXISTS` — uses DO/EXCEPTION guards).
 *
 * Author:      ZCode
 * Last-updated: 2026-08-13
 */
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateVisits20260813100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // tour_type_enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."tour_type_enum" AS ENUM ('WALK_IN', 'SCHEDULED_TOUR', 'VIRTUAL', 'FOLLOW_UP');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
    // visit_status_enum
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."visit_status_enum" AS ENUM ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "visits" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "centerId"      uuid,
        "leadId"        uuid,
        "requestedById" uuid,
        "assignedToId"  uuid,
        "visitorName"   varchar NOT NULL,
        "visitorPhone"  varchar NOT NULL,
        "visitorEmail"  varchar,
        "company"       varchar,
        "visitDate"     timestamp NOT NULL,
        "startTime"     varchar NOT NULL,
        "endTime"       varchar NOT NULL,
        "tourType"      "public"."tour_type_enum" NOT NULL DEFAULT 'SCHEDULED_TOUR',
        "interestedPlan" varchar,
        "partySize"     int NOT NULL DEFAULT 1,
        "status"        "public"."visit_status_enum" NOT NULL DEFAULT 'SCHEDULED',
        "notes"         text,
        "createdAt"     timestamp NOT NULL DEFAULT now(),
        "updatedAt"     timestamp NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_VISITS_CENTER_DATE"
        ON "visits" ("centerId", "visitDate");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_VISITS_STATUS_DATE"
        ON "visits" ("status", "visitDate");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_VISITS_STATUS_DATE";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_VISITS_CENTER_DATE";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "visits";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."visit_status_enum";`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."tour_type_enum";`);
  }
}
