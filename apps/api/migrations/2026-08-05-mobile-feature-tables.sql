-- ============================================================================
-- Migration: Mobile feature parity tables (2026-08-05)
-- Purpose:   Creates tables for wallet transactions, print jobs, offers,
--            support tickets, referrals, and notification preferences.
--
-- Compatibility: PostgreSQL (prod is < v11, so we avoid CREATE TYPE IF NOT
-- EXISTS and use anonymous DO blocks to guard enum creation).
--
-- Run via: psql "$DATABASE_URL" -f apps/api/migrations/2026-08-05-mobile-feature-tables.sql
-- Idempotent: safe to re-run (every CREATE checks existence first).
-- ============================================================================

BEGIN;

-- ── wallet_transactions ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE wallet_tx_type AS ENUM ('CREDIT', 'DEBIT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"      UUID NOT NULL,
  type          wallet_tx_type NOT NULL,
  amount        INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  reference     VARCHAR NULL,
  description   VARCHAR(255) NOT NULL,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user_created ON wallet_transactions ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user ON wallet_transactions ("userId");

-- ── print_jobs ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE print_job_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS print_jobs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID NOT NULL,
  "centerId"  UUID NULL,
  "fileUrl"   VARCHAR NOT NULL,
  "fileName"  VARCHAR NOT NULL,
  pages       INTEGER NOT NULL,
  copies      INTEGER NOT NULL DEFAULT 1,
  color       BOOLEAN NOT NULL DEFAULT FALSE,
  "paperSize" VARCHAR NOT NULL DEFAULT 'A4',
  sides       VARCHAR NOT NULL DEFAULT 'single',
  cost        DOUBLE PRECISION NOT NULL DEFAULT 0,
  status      print_job_status NOT NULL DEFAULT 'PENDING',
  notes       TEXT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_print_jobs_user_created ON print_jobs ("userId", "createdAt");

-- ── offers ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE offer_type AS ENUM ('PERCENTAGE', 'FIXED', 'TOKENS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS offers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(50) NOT NULL UNIQUE,
  title           VARCHAR NOT NULL,
  description     TEXT NULL,
  type            offer_type NOT NULL DEFAULT 'PERCENTAGE',
  value           DOUBLE PRECISION NOT NULL,
  "minOrderAmount" DOUBLE PRECISION NULL,
  "maxDiscount"   DOUBLE PRECISION NULL,
  "validFrom"     TIMESTAMP NOT NULL,
  "validUntil"    TIMESTAMP NOT NULL,
  "isActive"      BOOLEAN NOT NULL DEFAULT TRUE,
  "usageCount"    INTEGER NOT NULL DEFAULT 0,
  "usageLimit"    INTEGER NULL,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_code ON offers (code);

-- ── offer_redemptions ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offer_redemptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "offerId"       UUID NOT NULL,
  "userId"        UUID NOT NULL,
  "bookingId"     UUID NULL,
  "discountAmount" DOUBLE PRECISION NULL,
  "redeemedAt"    TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_offer_redemptions_offer_user ON offer_redemptions ("offerId", "userId");

-- ── support_tickets ─────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE support_category AS ENUM ('BOOKING', 'PAYMENT', 'PRINT', 'OTHER');
  CREATE TYPE support_priority AS ENUM ('LOW', 'MEDIUM', 'HIGH');
  CREATE TYPE support_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS support_tickets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID NOT NULL,
  "centerId"  UUID NULL,
  subject     VARCHAR NOT NULL,
  description TEXT NOT NULL,
  category    support_category NOT NULL DEFAULT 'OTHER',
  priority    support_priority NOT NULL DEFAULT 'MEDIUM',
  status      support_status NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created ON support_tickets ("userId", "createdAt");

-- ── support_messages ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ticketId"  UUID NOT NULL,
  "userId"    UUID NULL,
  "isAdmin"   BOOLEAN NOT NULL DEFAULT FALSE,
  message     TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_created ON support_messages ("ticketId", "createdAt");

-- ── referrals ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE referral_status AS ENUM ('PENDING', 'SUCCESSFUL', 'REWARDED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "referrerId"    UUID NOT NULL,
  "referredEmail" VARCHAR NOT NULL,
  "referredUserId" UUID NULL,
  code            VARCHAR(50) NOT NULL,
  status          referral_status NOT NULL DEFAULT 'PENDING',
  "rewardAmount"  DOUBLE PRECISION NOT NULL DEFAULT 100,
  "rewardedAt"    TIMESTAMP NULL,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals ("referrerId");
CREATE INDEX IF NOT EXISTS idx_referrals_email ON referrals ("referredEmail");

-- ── notification_preferences ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"           UUID NOT NULL UNIQUE,
  "meetingReminders" BOOLEAN NOT NULL DEFAULT TRUE,
  "billingAlerts"    BOOLEAN NOT NULL DEFAULT TRUE,
  "specialOffers"    BOOLEAN NOT NULL DEFAULT TRUE,
  "eventUpdates"     BOOLEAN NOT NULL DEFAULT TRUE,
  "updatedAt"        TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_notif_pref_user ON notification_preferences ("userId");

COMMIT;

-- ============================================================================
-- Seed: a starter offer so OffersScreen is not empty on first deploy.
-- ============================================================================
INSERT INTO offers (code, title, description, type, value, "minOrderAmount", "validFrom", "validUntil", "isActive", "usageLimit")
SELECT 'FIRST50', '50% off first booking', 'Welcome offer for new members', 'PERCENTAGE', 50, 0, now(), now() + INTERVAL '365 days', TRUE, 1
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE code = 'FIRST50');

INSERT INTO offers (code, title, description, type, value, "validFrom", "validUntil", "isActive", "usageLimit")
SELECT 'PRINT100', '100 print credits', 'Free print tokens', 'TOKENS', 100, now(), now() + INTERVAL '90 days', TRUE, 100
WHERE NOT EXISTS (SELECT 1 FROM offers WHERE code = 'PRINT100');
