-- Migration: Create the notifications table for production.
--
-- Why this exists: the API runs TypeORM with `synchronize: true` in dev,
-- which auto-creates tables from entities. In production
-- (`NODE_ENV=production`) synchronize is DISABLED, so the new
-- Notification entity (apps/api/src/typeorm/entities/notification.entity.ts)
-- will NOT be created automatically. This script must run once on the
-- production DB before (or right after) deploying the API, otherwise every
-- notification query/mutation fails with "relation notifications does not
-- exist".
--
-- Compatible with PostgreSQL < 11 (no CREATE TYPE IF NOT EXISTS).
-- Idempotent: safe to run multiple times.
--
-- Run on the production DB:
--   psql "postgresql://spacejam:spacejam@localhost:5432/spacejam" -f scripts/migrate-notifications.sql

-- Create enums only if they don't already exist (PG < 11 safe).
DO $$ BEGIN
  CREATE TYPE "notifications_type_enum" AS ENUM ('BOOKING','PAYMENT','DEPOSIT','LEAD','SYSTEM','REQUEST','EVENT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "notifications_priority_enum" AS ENUM ('LOW','MEDIUM','HIGH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create the table only if it doesn't exist.
CREATE TABLE IF NOT EXISTS "notifications" (
  "id"                    uuid NOT NULL DEFAULT gen_random_uuid(),
  "userId"                uuid,
  "centerId"              uuid,
  "title"                 varchar NOT NULL,
  "message"               text NOT NULL,
  "type"                  "notifications_type_enum" NOT NULL DEFAULT 'SYSTEM',
  "priority"              "notifications_priority_enum" NOT NULL DEFAULT 'MEDIUM',
  "read"                  boolean NOT NULL DEFAULT false,
  "actionUrl"             varchar,
  "metadata"              jsonb,
  "createdAt"             TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt"             TIMESTAMP NOT NULL DEFAULT now()
);

-- Primary key (separate so IF NOT EXISTS is safe).
DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "PK_notifications" PRIMARY KEY ("id");
EXCEPTION WHEN duplicate_object THEN NULL; WHEN duplicate_table THEN NULL; END $$;

-- Indexes (IF NOT EXISTS is supported for CREATE INDEX since PG 9.x).
CREATE INDEX IF NOT EXISTS "IDX_notifications_userId_createdAt"
  ON "notifications" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_notifications_centerId_createdAt"
  ON "notifications" ("centerId", "createdAt");

-- Optional foreign keys (ON DELETE SET NULL). Wrapped so a missing
-- referenced table or an existing constraint doesn't hard-fail.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_notifications_user') THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'centers')
     AND NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FK_notifications_center') THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_center" FOREIGN KEY ("centerId") REFERENCES "centers"("id") ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
