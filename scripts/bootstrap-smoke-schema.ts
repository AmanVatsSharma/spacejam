/**
 * Smoke-test schema bootstrap. Creates ONLY the M1–M3 tables + the
 * booking.subscriptionId column that the smoke test exercises, using raw SQL
 * so it doesn't depend on TypeORM synchronize (which aborts on this dev DB's
 * stale deposits enum data). All statements idempotent.
 *
 *   npx tsx scripts/bootstrap-smoke-schema.ts
 */
import * as pg from 'pg';

const client = new pg.Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  user: process.env.DATABASE_USER || 'spacejam',
  password: process.env.DATABASE_PASSWORD || 'spacejam',
  database: process.env.DATABASE_NAME || 'spacejam',
});

async function run(label: string, sql: string): Promise<void> {
  await client.query(sql);
  console.log(`  ✓ ${label}`);
}

async function main(): Promise<void> {
  await client.connect();
  console.log('Bootstrapping smoke-test schema…');

  // ── otp_requests (M1) ─────────────────────────────────────────────────
  await run('otp_requests table', `
    CREATE TABLE IF NOT EXISTS "otp_requests" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "phone" varchar(30) NOT NULL,
      "codeHash" varchar NOT NULL,
      "expiresAt" timestamp NOT NULL,
      "attempts" int NOT NULL DEFAULT 0,
      "consumedAt" timestamp NULL,
      "createdAt" timestamp NOT NULL DEFAULT now()
    );
  `);
  await run('otp_requests phone idx', `CREATE INDEX IF NOT EXISTS "IDX_OTP_REQUESTS_PHONE" ON "otp_requests" ("phone");`);

  // ── customer_employees base table (if missing) + userId (M1) ──────────
  await run('customer_employees table', `
    CREATE TABLE IF NOT EXISTS "customer_employees" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "customerId" uuid NOT NULL,
      "name" varchar(255) NOT NULL,
      "email" varchar(255) NOT NULL,
      "phone" varchar(50),
      "role" varchar(100) NOT NULL DEFAULT 'Member',
      "department" varchar(100),
      "seatId" uuid,
      "seatNumber" varchar(50),
      "status" varchar(50) NOT NULL DEFAULT 'active',
      "userId" uuid,
      "invitedAt" timestamp,
      "joinedAt" timestamp,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );
  `);
  await run('customer_employees.customerId idx', `CREATE INDEX IF NOT EXISTS "IDX_CE_CUSTOMER" ON "customer_employees" ("customerId");`);
  await run('customer_employees.userId col', `ALTER TABLE "customer_employees" ADD COLUMN IF NOT EXISTS "userId" uuid;`);

  // ── plans (M2) ────────────────────────────────────────────────────────
  await client.query(`DO $$ BEGIN CREATE TYPE "plans_seattype_enum" AS ENUM ('HOT_DESK','DEDICATED','CABIN','MEETING_ROOM'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
  await client.query(`DO $$ BEGIN CREATE TYPE "plans_billingcycle_enum" AS ENUM ('DAILY','WEEKLY','MONTHLY','QUARTERLY'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
  await client.query(`DO $$ BEGIN CREATE TYPE "plans_status_enum" AS ENUM ('ACTIVE','INACTIVE','ARCHIVED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
  await run('plans table', `
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
  `);
  await run('plans.centerId idx', `CREATE INDEX IF NOT EXISTS "IDX_PLANS_CENTER" ON "plans" ("centerId");`);

  // ── subscriptions (M2) ────────────────────────────────────────────────
  await client.query(`DO $$ BEGIN CREATE TYPE "subscriptions_status_enum" AS ENUM ('ACTIVE','SUSPENDED','CANCELLED','EXPIRED','PENDING'); EXCEPTION WHEN duplicate_object THEN null; END $$;`);
  await run('subscriptions table', `
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
  `);
  await run('subscriptions.customerId idx', `CREATE INDEX IF NOT EXISTS "IDX_SUB_CUSTOMER" ON "subscriptions" ("customerId");`);
  await run('subscriptions.planId idx', `CREATE INDEX IF NOT EXISTS "IDX_SUB_PLAN" ON "subscriptions" ("planId");`);

  // ── bookings.subscriptionId (M3) ──────────────────────────────────────
  await run('bookings.subscriptionId col', `ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "subscriptionId" uuid;`);
  await run('bookings.subscriptionId idx', `CREATE INDEX IF NOT EXISTS "IDX_BOOKINGS_SUB" ON "bookings" ("subscriptionId");`);

  // ── verify ─────────────────────────────────────────────────────────────
  const t = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('otp_requests','plans','subscriptions','customer_employees') ORDER BY table_name;");
  console.log('\nTables present:', t.rows.map((r: any) => r.table_name));
  const sc = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name='subscriptionId';");
  console.log('bookings.subscriptionId:', sc.rowCount ? 'present' : 'MISSING');

  // ── customers: add onboarding columns the entity expects (this dev DB lacks them) ──
  const customerCols = [
    ['gstNumber', 'varchar(100)'],
    ['companyAddress', 'text'],
    ['companyType', 'varchar(50)'],
    ['employeeCount', 'int'],
    ['industry', 'varchar(100)'],
    ['website', 'varchar(255)'],
    ['planType', 'varchar(100)'],
    ['alternateEmail', 'varchar(255)'],
    ['alternatePhone', 'varchar(50)'],
    ['dob', 'date'],
    ['emergencyContactName', 'varchar(255)'],
    ['emergencyContactPhone', 'varchar(50)'],
    ['communicationChannel', 'varchar(50)'],
  ];
  for (const [col, type] of customerCols) {
    await client.query(`ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "${col}" ${type};`);
  }
  console.log('  ✓ customers onboarding columns ensured');

  await client.end();
  console.log('\n✓ Smoke schema ready.');
}

main().catch((e) => { console.error('✗', e.message); process.exit(1); });
