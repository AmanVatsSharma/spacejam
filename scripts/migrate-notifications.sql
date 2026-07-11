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
-- Run on the production DB:
--   psql "postgresql://spacejam:spacejam@localhost:5432/spacejam" -f scripts/migrate-notifications.sql
--
-- Idempotent: safe to run multiple times (CREATE TABLE IF NOT EXISTS).

CREATE TYPE IF NOT EXISTS "notifications_type_enum" AS ENUM ('BOOKING','PAYMENT','DEPOSIT','LEAD','SYSTEM','REQUEST','EVENT');
CREATE TYPE IF NOT EXISTS "notifications_priority_enum" AS ENUM ('LOW','MEDIUM','HIGH');

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
  "updatedAt"             TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "IDX_notifications_userId_createdAt"
  ON "notifications" ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "IDX_notifications_centerId_createdAt"
  ON "notifications" ("centerId", "createdAt");

-- Optional foreign keys (soft — matches entity's ON DELETE SET NULL).
-- Wrap in DO block so a missing users/centers table doesn't hard-fail.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'centers') THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "FK_notifications_center" FOREIGN KEY ("centerId") REFERENCES "centers"("id") ON DELETE SET NULL;
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
