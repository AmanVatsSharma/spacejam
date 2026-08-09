-- Prod schema bootstrap: creates only the M1-M4 + integrations tables/columns
-- that synchronize can't (it aborts on stale deposits enum data). Idempotent.
-- Run: PGPASSWORD=spacejam psql -h localhost -U spacejam -d spacejam -f /home/ubuntu/prod-bootstrap-schema.sql

BEGIN;

-- M1: otp_requests + customer_employees.userId
CREATE TABLE IF NOT EXISTS "otp_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "phone" varchar(30) NOT NULL,
  "codeHash" varchar NOT NULL,
  "expiresAt" timestamp NOT NULL,
  "attempts" int NOT NULL DEFAULT 0,
  "consumedAt" timestamp NULL,
  "createdAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_OTP_REQUESTS_PHONE" ON "otp_requests" ("phone");
CREATE INDEX IF NOT EXISTS "IDX_OTP_REQUESTS_CREATED_AT" ON "otp_requests" ("createdAt");

ALTER TABLE "customer_employees" ADD COLUMN IF NOT EXISTS "userId" uuid;
CREATE INDEX IF NOT EXISTS "IDX_CUSTOMER_EMPLOYEES_USER_ID" ON "customer_employees" ("userId");

-- M2: plans + subscriptions
DO $$ BEGIN CREATE TYPE "plans_seattype_enum" AS ENUM ('HOT_DESK','DEDICATED','CABIN','MEETING_ROOM'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "plans_billingcycle_enum" AS ENUM ('DAILY','WEEKLY','MONTHLY','QUARTERLY'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE "plans_status_enum" AS ENUM ('ACTIVE','INACTIVE','ARCHIVED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE TABLE IF NOT EXISTS "plans" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "centerId" uuid NOT NULL,
  "name" varchar(120) NOT NULL,
  "description" text,
  "seatType" varchar NOT NULL,
  "billingCycle" varchar NOT NULL DEFAULT 'MONTHLY',
  "price" decimal(12,2) NOT NULL,
  "currency" varchar(8) NOT NULL DEFAULT 'INR',
  "minSeats" int NOT NULL DEFAULT 1,
  "status" varchar NOT NULL DEFAULT 'ACTIVE',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_PLANS_CENTER_ID" ON "plans" ("centerId");

DO $$ BEGIN CREATE TYPE "subscriptions_status_enum" AS ENUM ('ACTIVE','SUSPENDED','CANCELLED','EXPIRED','PENDING'); EXCEPTION WHEN duplicate_object THEN null; END $$;
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" uuid NOT NULL,
  "planId" uuid NOT NULL,
  "centerId" uuid,
  "seatCount" int NOT NULL,
  "unitPrice" decimal(12,2) NOT NULL,
  "amount" decimal(14,2) NOT NULL,
  "status" varchar NOT NULL DEFAULT 'ACTIVE',
  "startDate" timestamp NOT NULL,
  "nextBillingDate" timestamp NOT NULL,
  "endDate" timestamp,
  "notes" text,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IDX_SUBSCRIPTIONS_CUSTOMER_ID" ON "subscriptions" ("customerId");
CREATE INDEX IF NOT EXISTS "IDX_SUBSCRIPTIONS_PLAN_ID" ON "subscriptions" ("planId");

-- M3: bookings.subscriptionId
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "subscriptionId" uuid;
CREATE INDEX IF NOT EXISTS "IDX_BOOKINGS_SUBSCRIPTION_ID" ON "bookings" ("subscriptionId");

-- Hardening: audit_logs.centerId
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "centerId" uuid;
CREATE INDEX IF NOT EXISTS "IDX_AUDIT_LOGS_CENTER_ID" ON "audit_logs" ("centerId");

-- Integrations: app_settings
CREATE TABLE IF NOT EXISTS "app_settings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "group" varchar(40) NOT NULL,
  "key" varchar(80) NOT NULL,
  "value" text NOT NULL,
  "secret" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_APP_SETTINGS_KEY" ON "app_settings" ("key");
CREATE INDEX IF NOT EXISTS "IDX_APP_SETTINGS_GROUP" ON "app_settings" ("group");

COMMIT;

-- Verify
SELECT 'otp_requests' AS t, COUNT(*) FROM information_schema.tables WHERE table_name='otp_requests'
UNION ALL SELECT 'plans', COUNT(*) FROM information_schema.tables WHERE table_name='plans'
UNION ALL SELECT 'subscriptions', COUNT(*) FROM information_schema.tables WHERE table_name='subscriptions'
UNION ALL SELECT 'app_settings', COUNT(*) FROM information_schema.tables WHERE table_name='app_settings';
