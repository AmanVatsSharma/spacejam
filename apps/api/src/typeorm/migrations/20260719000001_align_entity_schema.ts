/**
 * File:        apps/api/src/typeorm/migrations/20260719000001_align_entity_schema.ts
 * Module:      API · TypeORM · Migrations
 * Purpose:     Align database schema with current entity definitions.
 *              Adds missing columns to bookings, seats, meeting_rooms, notifications.
 *              Adds missing enum values to PostgreSQL enums.
 *              Adds composite indexes for availability queries.
 *              Adds exclusion constraints for double-booking prevention.
 *
 *              Use: `npm run migration:run`
 *
 * Author:      AmanVatsSharma
 * Last-updated: 2026-07-19
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AlignEntitySchema20260719000001 implements MigrationInterface {
  name = 'AlignEntitySchema20260719000001';

  // ─── up ───────────────────────────────────────────────────────────────────
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Add missing enum values (PG < v11 requires DO blocks) ────────────
    await this.addEnumValues(queryRunner);

    // ── 2. Add missing columns ───────────────────────────────────────────────
    await this.addMissingColumns(queryRunner);

    // ── 3. Add composite indexes ─────────────────────────────────────────────
    await this.addIndexes(queryRunner);

    // ── 4. Add exclusion constraints for double-booking prevention ───────────
    await this.addExclusionConstraints(queryRunner);
  }

  // ─── down ─────────────────────────────────────────────────────────────────
  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop exclusion constraints
    await queryRunner.query(
      `ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "no_overlapping_room_bookings";`,
    );
    await queryRunner.query(
      `ALTER TABLE "booking" DROP CONSTRAINT IF EXISTS "no_overlapping_seat_bookings";`,
    );

    // Drop indexes
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_booking_seat_dates";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_booking_room_dates";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_booking_center_dates";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_booking_status_center";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_seat_floor_active";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_meeting_room_center_active";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_user_read";`);

    // Drop added columns
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "meetingRoomId";`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "eventDate";`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "title";`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "requestedById";`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "totalPrice";`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "discount";`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "discountCode";`);
    await queryRunner.query(`ALTER TABLE "booking" DROP COLUMN IF EXISTS "paymentId";`);

    await queryRunner.query(`ALTER TABLE "seat" DROP COLUMN IF EXISTS "amenities";`);
    await queryRunner.query(`ALTER TABLE "seat" DROP COLUMN IF EXISTS "price";`);
    await queryRunner.query(`ALTER TABLE "seat" DROP COLUMN IF EXISTS "location";`);
    await queryRunner.query(
      `ALTER TABLE "seat" DROP COLUMN IF EXISTS "minBookingDuration";`,
    );
    await queryRunner.query(
      `ALTER TABLE "seat" DROP COLUMN IF EXISTS "maxBookingDuration";`,
    );
    await queryRunner.query(`ALTER TABLE "seat" DROP COLUMN IF EXISTS "active";`);

    await queryRunner.query(`ALTER TABLE "meeting_room" DROP COLUMN IF EXISTS "roomType";`);
    await queryRunner.query(
      `ALTER TABLE "meeting_room" DROP COLUMN IF EXISTS "locationName";`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_room" DROP COLUMN IF EXISTS "locationFullAddress";`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_room" DROP COLUMN IF EXISTS "minBookingDuration";`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_room" DROP COLUMN IF EXISTS "maxBookingDuration";`,
    );
    await queryRunner.query(`ALTER TABLE "meeting_room" DROP COLUMN IF EXISTS "hourlyRate";`);
    await queryRunner.query(`ALTER TABLE "meeting_room" DROP COLUMN IF EXISTS "active";`);

    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "centerId";`);
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "title";`);
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "priority";`);
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "actionUrl";`);
    await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN IF EXISTS "metadata";`);
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async addEnumValues(queryRunner: QueryRunner): Promise<void> {
    // user_role_enum — entities use MEMBER, migration has SUPER_ADMIN/ADMIN/MANAGER/USER
    await this.addEnumValueIfMissing(
      queryRunner,
      'user_role_enum',
      ['MEMBER', 'STAFF', 'FINANCE', 'SUPPORT'],
    );

    // booking_status_enum — entities use CHECKED_IN, CHECKED_OUT
    await this.addEnumValueIfMissing(
      queryRunner,
      'booking_status_enum',
      ['CHECKED_IN', 'CHECKED_OUT'],
    );

    // payment_method_enum — entities use UPI, WALLET, NET_BANKING, CHEQUE
    await this.addEnumValueIfMissing(
      queryRunner,
      'payment_method_enum',
      ['UPI', 'WALLET', 'NET_BANKING', 'CHEQUE'],
    );

    // center_status_enum — entities use FULL
    await this.addEnumValueIfMissing(queryRunner, 'center_status_enum', ['FULL']);

    // seat_type_enum — entities use CABIN
    await this.addEnumValueIfMissing(queryRunner, 'seat_type_enum', ['CABIN']);

    // notification_type_enum — entities use DEPOSIT, LEAD, REQUEST, EVENT
    await this.addEnumValueIfMissing(
      queryRunner,
      'notification_type_enum',
      ['DEPOSIT', 'LEAD', 'REQUEST', 'EVENT'],
    );

    // notification_priority_enum — create if missing
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "notification_priority_enum" AS ENUM ('LOW','MEDIUM','HIGH','URGENT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);
  }

  private async addEnumValueIfMissing(
    queryRunner: QueryRunner,
    enumName: string,
    values: string[],
  ): Promise<void> {
    for (const value of values) {
      // Idempotent: ALTER TYPE ADD VALUE IF NOT EXISTS requires PG 9.6+ but use DO block for safety
      await queryRunner.query(`
        DO $$ BEGIN
          ALTER TYPE "${enumName}" ADD VALUE '${value}';
        EXCEPTION WHEN duplicate_object THEN null;
                  WHEN OTHERS THEN null; END $$;
      `);
    }
  }

  private async addMissingColumns(queryRunner: QueryRunner): Promise<void> {
    // ── bookings ──
    await queryRunner.query(`
      ALTER TABLE "booking"
        ADD COLUMN IF NOT EXISTS "meetingRoomId" uuid,
        ADD COLUMN IF NOT EXISTS "eventDate" date,
        ADD COLUMN IF NOT EXISTS "title" varchar(255),
        ADD COLUMN IF NOT EXISTS "requestedById" uuid,
        ADD COLUMN IF NOT EXISTS "totalPrice" numeric(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "discount" numeric(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "discountCode" varchar(100),
        ADD COLUMN IF NOT EXISTS "paymentId" uuid;
    `);

    // ── seats ──
    await queryRunner.query(`
      ALTER TABLE "seat"
        ADD COLUMN IF NOT EXISTS "amenities" jsonb DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "price" numeric(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "location" varchar(255),
        ADD COLUMN IF NOT EXISTS "minBookingDuration" int DEFAULT 30,
        ADD COLUMN IF NOT EXISTS "maxBookingDuration" int DEFAULT 480,
        ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true;
    `);

    // ── meeting_rooms ──
    await queryRunner.query(`
      ALTER TABLE "meeting_room"
        ADD COLUMN IF NOT EXISTS "roomType" "seat_type_enum" DEFAULT 'MEETING_ROOM',
        ADD COLUMN IF NOT EXISTS "locationName" varchar(255),
        ADD COLUMN IF NOT EXISTS "locationFullAddress" text,
        ADD COLUMN IF NOT EXISTS "minBookingDuration" int DEFAULT 30,
        ADD COLUMN IF NOT EXISTS "maxBookingDuration" int DEFAULT 480,
        ADD COLUMN IF NOT EXISTS "hourlyRate" numeric(10,2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "active" boolean DEFAULT true;
    `);

    // ── notifications ──
    await queryRunner.query(`
      ALTER TABLE "notification"
        ADD COLUMN IF NOT EXISTS "centerId" uuid,
        ADD COLUMN IF NOT EXISTS "title" varchar(255),
        ADD COLUMN IF NOT EXISTS "priority" "notification_priority_enum" DEFAULT 'MEDIUM',
        ADD COLUMN IF NOT EXISTS "actionUrl" varchar(500),
        ADD COLUMN IF NOT EXISTS "metadata" jsonb;
    `);
  }

  private async addIndexes(queryRunner: QueryRunner): Promise<void> {
    // Composite indexes for availability queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_booking_seat_dates"
      ON "booking" ("seatId", "startTime", "endTime")
      WHERE "seatId" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_booking_room_dates"
      ON "booking" ("meetingRoomId", "startTime", "endTime")
      WHERE "meetingRoomId" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_booking_center_dates"
      ON "booking" ("centerId", "startTime");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_booking_status_center"
      ON "booking" ("status", "centerId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_seat_floor_active"
      ON "seat" ("floorId", "active");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_meeting_room_center_active"
      ON "meeting_room" ("centerId", "active");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notification_user_read"
      ON "notification" ("userId", "read", "createdAt" DESC)
      WHERE "userId" IS NOT NULL;
    `);
  }

  private async addExclusionConstraints(queryRunner: QueryRunner): Promise<void> {
    // Ensure btree_gist extension for composite btree+range exclusion
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "btree_gist";`);

    // Prevent overlapping bookings for the same meeting room
    await queryRunner.query(`
      ALTER TABLE "booking"
      ADD CONSTRAINT "no_overlapping_room_bookings"
      EXCLUDE USING gist (
        "meetingRoomId" WITH =,
        tsrange("startTime", "endTime", '[)') WITH &&
      )
      WHERE ("meetingRoomId" IS NOT NULL AND "status" NOT IN ('CANCELLED', 'NO_SHOW'));
    `).catch((err) => {
      // Idempotent: skip if constraint already exists
      if (!String(err.message).includes('already exists')) {
        throw err;
      }
    });

    // Prevent overlapping bookings for the same seat
    await queryRunner.query(`
      ALTER TABLE "booking"
      ADD CONSTRAINT "no_overlapping_seat_bookings"
      EXCLUDE USING gist (
        "seatId" WITH =,
        tsrange("startTime", "endTime", '[)') WITH &&
      )
      WHERE ("seatId" IS NOT NULL AND "status" NOT IN ('CANCELLED', 'NO_SHOW'));
    `).catch((err) => {
      if (!String(err.message).includes('already exists')) {
        throw err;
      }
    });
  }
}
