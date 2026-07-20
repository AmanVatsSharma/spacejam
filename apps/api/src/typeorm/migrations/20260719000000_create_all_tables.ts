import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration: 20260719000000_create_all_tables
 * Purpose:  Creates all 23 entity tables for production (synchronize:false).
 *           Uses DO blocks for enums because prod PostgreSQL < v11.
 */

export class CreateAllTables20260719000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Enums ─────────────────────────────────────────────────────────────────

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "user_role_enum" AS ENUM ('SUPER_ADMIN','ADMIN','MANAGER','USER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "booking_status_enum" AS ENUM ('PENDING','CONFIRMED','CANCELLED','COMPLETED','NO_SHOW');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "booking_type_enum" AS ENUM ('HOT_DESK','DEDICATED','MEETING_ROOM','EVENT');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_status_enum" AS ENUM ('PENDING','COMPLETED','FAILED','REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "payment_method_enum" AS ENUM ('CARD','BANK_TRANSFER','CASH','ONLINE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "center_status_enum" AS ENUM ('ACTIVE','INACTIVE','MAINTENANCE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "seat_status_enum" AS ENUM ('AVAILABLE','OCCUPIED','RESERVED','MAINTENANCE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "seat_type_enum" AS ENUM ('HOT_DESK','DEDICATED','MEETING_ROOM','OPEN_DESK','HEXAGON');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "room_status_enum" AS ENUM ('AVAILABLE','BOOKED','OCCUPIED','MAINTENANCE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "lead_status_enum" AS ENUM ('NEW','CONTACTED','QUALIFIED','CONVERTED','LOST');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "customer_plan_enum" AS ENUM ('BASIC','STANDARD','PREMIUM','ENTERPRISE');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "billing_cycle_enum" AS ENUM ('MONTHLY','QUARTERLY','ANNUALLY');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "invoice_status_enum" AS ENUM ('DRAFT','SENT','PAID','OVERDUE','CANCELLED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "deposit_status_enum" AS ENUM ('PENDING','COMPLETED','FAILED','REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "contract_status_enum" AS ENUM ('DRAFT','ACTIVE','EXPIRED','TERMINATED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "discount_type_enum" AS ENUM ('PERCENTAGE','FIXED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "notification_type_enum" AS ENUM ('BOOKING','PAYMENT','SYSTEM','REMINDER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "request_type_enum" AS ENUM ('BOOKING','SUPPORT','MAINTENANCE','OTHER');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "request_status_enum" AS ENUM ('PENDING','APPROVED','REJECTED','IN_PROGRESS','COMPLETED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "event_type_enum" AS ENUM ('WORKSHOP','NETWORKING','SEMINAR','SOCIAL');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    // ── Tables ─────────────────────────────────────────────────────────────────

    // user
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL UNIQUE,
        "password" varchar(255) NOT NULL,
        "firstName" varchar(100),
        "lastName" varchar(100),
        "role" "user_role_enum" NOT NULL DEFAULT 'USER',
        "phone" varchar(20),
        "centerId" uuid,
        "centerIds" jsonb DEFAULT '[]',
        "emailVerified" boolean DEFAULT false,
        "twoFactorEnabled" boolean DEFAULT false,
        "twoFactorSecret" varchar(255),
        "avatar" varchar(500),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      );
      CREATE INDEX "IDX_user_email" ON "user" ("email");
      CREATE INDEX "IDX_user_centerId" ON "user" ("centerId");
      CREATE INDEX "IDX_user_role" ON "user" ("role");
    `);

    // location
    await queryRunner.query(`
      CREATE TABLE "location" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "address" text,
        "city" varchar(100),
        "state" varchar(100),
        "country" varchar(100) DEFAULT 'India',
        "zipCode" varchar(20),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
    `);

    // center
    await queryRunner.query(`
      CREATE TABLE "center" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "status" "center_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "settings" jsonb DEFAULT '{}',
        "locationId" uuid NOT NULL UNIQUE,
        "deletedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_center_locationId" ON "center" ("locationId");
    `);

    // floor
    await queryRunner.query(`
      CREATE TABLE "floor" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "centerId" uuid NOT NULL,
        "deletedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_floor_centerId" ON "floor" ("centerId");
    `);

    // seat
    await queryRunner.query(`
      CREATE TABLE "seat" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100),
        "floorId" uuid NOT NULL,
        "seatType" "seat_type_enum" NOT NULL DEFAULT 'HOT_DESK',
        "status" "seat_status_enum" NOT NULL DEFAULT 'AVAILABLE',
        "x" numeric(10,2),
        "y" numeric(10,2),
        "capacity" int NOT NULL DEFAULT 1,
        "centerId" uuid,
        "deletedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_seat_floorId" ON "seat" ("floorId");
      CREATE INDEX "IDX_seat_centerId" ON "seat" ("centerId");
      CREATE INDEX "IDX_seat_status" ON "seat" ("status");
    `);

    // meeting_room
    await queryRunner.query(`
      CREATE TABLE "meeting_room" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(255) NOT NULL,
        "centerId" uuid,
        "floorId" uuid,
        "capacity" int NOT NULL DEFAULT 4,
        "amenities" jsonb DEFAULT '[]',
        "equipment" jsonb DEFAULT '[]',
        "status" "room_status_enum" NOT NULL DEFAULT 'AVAILABLE',
        "location" text,
        "x" numeric(10,2),
        "y" numeric(10,2),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        "deletedAt" timestamptz
      );
      CREATE INDEX "IDX_meeting_room_centerId" ON "meeting_room" ("centerId");
      CREATE INDEX "IDX_meeting_room_floorId" ON "meeting_room" ("floorId");
    `);

    // booking
    await queryRunner.query(`
      CREATE TABLE "booking" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "seatId" uuid,
        "meetingRoomId" uuid,
        "centerId" uuid,
        "startTime" timestamptz NOT NULL,
        "endTime" timestamptz NOT NULL,
        "status" "booking_status_enum" NOT NULL DEFAULT 'PENDING',
        "type" "booking_type_enum" NOT NULL DEFAULT 'HOT_DESK',
        "totalAmount" numeric(10,2) DEFAULT 0,
        "depositId" uuid,
        "notes" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_booking_userId" ON "booking" ("userId");
      CREATE INDEX "IDX_booking_seatId" ON "booking" ("seatId");
      CREATE INDEX "IDX_booking_meetingRoomId" ON "booking" ("meetingRoomId");
      CREATE INDEX "IDX_booking_centerId" ON "booking" ("centerId");
      CREATE INDEX "IDX_booking_status" ON "booking" ("status");
    `);

    // payment
    await queryRunner.query(`
      CREATE TABLE "payment" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "bookingId" uuid NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "method" "payment_method_enum" NOT NULL DEFAULT 'CARD',
        "status" "payment_status_enum" NOT NULL DEFAULT 'PENDING',
        "transactionId" varchar(255),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_payment_bookingId" ON "payment" ("bookingId");
    `);

    // lead
    await queryRunner.query(`
      CREATE TABLE "lead" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "firstName" varchar(100),
        "lastName" varchar(100),
        "email" varchar(255),
        "phone" varchar(20),
        "source" varchar(100),
        "status" "lead_status_enum" NOT NULL DEFAULT 'NEW',
        "centerId" uuid,
        "assignedTo" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_lead_status" ON "lead" ("status");
      CREATE INDEX "IDX_lead_centerId" ON "lead" ("centerId");
    `);

    // customer
    await queryRunner.query(`
      CREATE TABLE "customer" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid,
        "leadId" uuid,
        "company" varchar(255),
        "plan" "customer_plan_enum" NOT NULL DEFAULT 'BASIC',
        "billingCycle" "billing_cycle_enum" NOT NULL DEFAULT 'MONTHLY',
        "totalSpent" numeric(10,2) DEFAULT 0,
        "centerIds" jsonb DEFAULT '[]',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_customer_leadId" ON "customer" ("leadId");
    `);

    // invoice
    await queryRunner.query(`
      CREATE TABLE "invoice" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "customerId" uuid NOT NULL,
        "bookingId" uuid,
        "amount" numeric(10,2) NOT NULL,
        "status" "invoice_status_enum" NOT NULL DEFAULT 'DRAFT',
        "dueDate" date,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_invoice_customerId" ON "invoice" ("customerId");
      CREATE INDEX "IDX_invoice_status" ON "invoice" ("status");
    `);

    // deposit
    await queryRunner.query(`
      CREATE TABLE "deposit" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "customerId" uuid NOT NULL,
        "amount" numeric(10,2) NOT NULL,
        "status" "deposit_status_enum" NOT NULL DEFAULT 'PENDING',
        "method" "payment_method_enum" DEFAULT 'CARD',
        "transactionId" varchar(255),
        "notes" text,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_deposit_customerId" ON "deposit" ("customerId");
    `);

    // contract
    await queryRunner.query(`
      CREATE TABLE "contract" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "customerId" uuid NOT NULL,
        "planId" varchar(100),
        "startDate" date NOT NULL,
        "endDate" date,
        "amount" numeric(10,2) NOT NULL,
        "status" "contract_status_enum" NOT NULL DEFAULT 'DRAFT',
        "terms" jsonb DEFAULT '{}',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_contract_customerId" ON "contract" ("customerId");
    `);

    // event
    await queryRunner.query(`
      CREATE TABLE "event" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar(255) NOT NULL,
        "description" text,
        "centerId" uuid,
        "startDate" timestamptz NOT NULL,
        "endDate" timestamptz NOT NULL,
        "type" "event_type_enum" NOT NULL DEFAULT 'WORKSHOP',
        "maxAttendees" int DEFAULT 50,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_event_centerId" ON "event" ("centerId");
    `);

    // request
    await queryRunner.query(`
      CREATE TABLE "request" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" "request_type_enum" NOT NULL DEFAULT 'OTHER',
        "centerId" uuid,
        "status" "request_status_enum" NOT NULL DEFAULT 'PENDING',
        "title" varchar(255),
        "description" text,
        "requestedDate" date,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_request_userId" ON "request" ("userId");
      CREATE INDEX "IDX_request_status" ON "request" ("status");
    `);

    // discount
    await queryRunner.query(`
      CREATE TABLE "discount" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" varchar(50) NOT NULL UNIQUE,
        "type" "discount_type_enum" NOT NULL DEFAULT 'PERCENTAGE',
        "value" numeric(10,2) NOT NULL,
        "maxUses" int,
        "usedCount" int NOT NULL DEFAULT 0,
        "centerId" uuid,
        "validFrom" timestamptz NOT NULL DEFAULT now(),
        "validUntil" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_discount_code" ON "discount" ("code");
    `);

    // notification
    await queryRunner.query(`
      CREATE TABLE "notification" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "type" "notification_type_enum" NOT NULL DEFAULT 'SYSTEM',
        "message" text NOT NULL,
        "read" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_notification_userId" ON "notification" ("userId");
      CREATE INDEX "IDX_notification_read" ON "notification" ("read");
    `);

    // invitation
    await queryRunner.query(`
      CREATE TABLE "invitation" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'USER',
        "centerId" uuid,
        "token" varchar(255) NOT NULL UNIQUE,
        "accepted" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_invitation_token" ON "invitation" ("token");
      CREATE INDEX "IDX_invitation_email" ON "invitation" ("email");
    `);

    // user_session
    await queryRunner.query(`
      CREATE TABLE "user_session" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "token" varchar(500) NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_user_session_userId" ON "user_session" ("userId");
    `);

    // magic_link_token
    await queryRunner.query(`
      CREATE TABLE "magic_link_token" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "token" varchar(255) NOT NULL UNIQUE,
        "expiresAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_magic_link_token_token" ON "magic_link_token" ("token");
    `);

    // recovery_code
    await queryRunner.query(`
      CREATE TABLE "recovery_code" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "code" varchar(10) NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "used" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_recovery_code_userId" ON "recovery_code" ("userId");
    `);

    // revenue_analytics
    await queryRunner.query(`
      CREATE TABLE "revenue_analytics" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "centerId" uuid,
        "revenue" numeric(12,2) DEFAULT 0,
        "bookings" int DEFAULT 0,
        "newCustomers" int DEFAULT 0,
        "month" int NOT NULL,
        "year" int NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_revenue_analytics_centerId" ON "revenue_analytics" ("centerId");
      CREATE INDEX "IDX_revenue_analytics_month_year" ON "revenue_analytics" ("year","month");
    `);

    // audit_log
    await queryRunner.query(`
      CREATE TABLE "audit_log" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid,
        "action" varchar(100) NOT NULL,
        "entity" varchar(100) NOT NULL,
        "entityId" uuid,
        "changes" jsonb,
        "ipAddress" varchar(45),
        "userAgent" text,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX "IDX_audit_log_userId" ON "audit_log" ("userId");
      CREATE INDEX "IDX_audit_log_entity" ON "audit_log" ("entity","entityId");
      CREATE INDEX "IDX_audit_log_createdAt" ON "audit_log" ("createdAt");
    `);

    // ── Foreign Keys ──────────────────────────────────────────────────────────

    await queryRunner.query(`
      ALTER TABLE "center" ADD CONSTRAINT "fk_center_location"
        FOREIGN KEY ("locationId") REFERENCES "location"("id") ON DELETE RESTRICT;
    `);

    await queryRunner.query(`
      ALTER TABLE "user" ADD CONSTRAINT "fk_user_center"
        FOREIGN KEY ("centerId") REFERENCES "center"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "floor" ADD CONSTRAINT "fk_floor_center"
        FOREIGN KEY ("centerId") REFERENCES "center"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "seat" ADD CONSTRAINT "fk_seat_floor"
        FOREIGN KEY ("floorId") REFERENCES "floor"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "meeting_room" ADD CONSTRAINT "fk_meeting_room_center"
        FOREIGN KEY ("centerId") REFERENCES "center"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "meeting_room" ADD CONSTRAINT "fk_meeting_room_floor"
        FOREIGN KEY ("floorId") REFERENCES "floor"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "booking" ADD CONSTRAINT "fk_booking_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "booking" ADD CONSTRAINT "fk_booking_seat"
        FOREIGN KEY ("seatId") REFERENCES "seat"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "booking" ADD CONSTRAINT "fk_booking_meeting_room"
        FOREIGN KEY ("meetingRoomId") REFERENCES "meeting_room"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "booking" ADD CONSTRAINT "fk_booking_center"
        FOREIGN KEY ("centerId") REFERENCES "center"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "payment" ADD CONSTRAINT "fk_payment_booking"
        FOREIGN KEY ("bookingId") REFERENCES "booking"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "lead" ADD CONSTRAINT "fk_lead_center"
        FOREIGN KEY ("centerId") REFERENCES "center"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "lead" ADD CONSTRAINT "fk_lead_assigned"
        FOREIGN KEY ("assignedTo") REFERENCES "user"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "customer" ADD CONSTRAINT "fk_customer_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "customer" ADD CONSTRAINT "fk_customer_lead"
        FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "invoice" ADD CONSTRAINT "fk_invoice_customer"
        FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "deposit" ADD CONSTRAINT "fk_deposit_customer"
        FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "contract" ADD CONSTRAINT "fk_contract_customer"
        FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "discount" ADD CONSTRAINT "fk_discount_center"
        FOREIGN KEY ("centerId") REFERENCES "center"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "notification" ADD CONSTRAINT "fk_notification_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "invitation" ADD CONSTRAINT "fk_invitation_center"
        FOREIGN KEY ("centerId") REFERENCES "center"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "user_session" ADD CONSTRAINT "fk_user_session_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "magic_link_token" ADD CONSTRAINT "fk_magic_link_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "recovery_code" ADD CONSTRAINT "fk_recovery_code_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "revenue_analytics" ADD CONSTRAINT "fk_revenue_analytics_center"
        FOREIGN KEY ("centerId") REFERENCES "center"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "event" ADD CONSTRAINT "fk_event_center"
        FOREIGN KEY ("centerId") REFERENCES "center"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "request" ADD CONSTRAINT "fk_request_user"
        FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
    `);

    await queryRunner.query(`
      ALTER TABLE "request" ADD CONSTRAINT "fk_request_center"
        FOREIGN KEY ("centerId") REFERENCES "center"("id") ON DELETE SET NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop FK constraints first
    const tables = [
      "request","event","revenue_analytics","recovery_code","magic_link_token",
      "user_session","invitation","notification","discount","contract","deposit",
      "invoice","customer","lead","payment","booking","meeting_room","seat","floor",
      "center","location","user",
    ];
    for (const t of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${t}" CASCADE;`);
    }

    // Drop enums
    const enums = [
      "request_status_enum","request_type_enum","event_type_enum",
      "notification_type_enum","discount_type_enum","contract_status_enum",
      "deposit_status_enum","invoice_status_enum","billing_cycle_enum",
      "customer_plan_enum","lead_status_enum","room_status_enum","seat_type_enum",
      "seat_status_enum","center_status_enum","payment_method_enum",
      "payment_status_enum","booking_type_enum","booking_status_enum","user_role_enum",
    ];
    for (const e of enums) {
      await queryRunner.query(`DROP TYPE IF EXISTS "${e}";`);
    }
  }
}
