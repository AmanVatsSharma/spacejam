/**
 * Raw-SQL migration applier. Runs the three M1–M3 migrations' SQL directly
 * against Postgres WITHOUT loading the NestJS entity graph (which drags in
 * GraphQL decorators that can't evaluate outside the app context). Each
 * migration's statements are already idempotent (IF NOT EXISTS / DO $$),
 * so this is safe to re-run.
 *
 *   NODE_ENV=production npx tsx scripts/apply-migrations-raw.ts
 *
 * Records each migration in the `migrations` table so TypeORM's
 * `showMigrations` knows they've run.
 */
import * as pg from 'pg';

const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  user: process.env.DATABASE_USER || 'spacejam',
  password: process.env.DATABASE_PASSWORD || 'spacejam',
  database: process.env.DATABASE_NAME || 'spacejam',
};

// Each entry: the migration class name (as TypeORM records it) + the raw SQL
// from its up() method, in order. Mirrors the three migration files exactly.
const migrations: { name: string; sql: string }[] = [
  {
    name: 'AddOtpAndEmployeeUser20260809000000',
    sql: `
      CREATE TABLE IF NOT EXISTS "otp_requests" (
        "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "phone"         varchar(30) NOT NULL,
        "codeHash"      varchar NOT NULL,
        "expiresAt"     timestamp NOT NULL,
        "attempts"      int NOT NULL DEFAULT 0,
        "consumedAt"    timestamp NULL,
        "createdAt"     timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_OTP_REQUESTS_PHONE" ON "otp_requests" ("phone");
      CREATE INDEX IF NOT EXISTS "IDX_OTP_REQUESTS_CREATED_AT" ON "otp_requests" ("createdAt");
      ALTER TABLE "customer_employees" ADD COLUMN IF NOT EXISTS "userId" uuid NULL;
      CREATE INDEX IF NOT EXISTS "IDX_CUSTOMER_EMPLOYEES_USER_ID" ON "customer_employees" ("userId");
      UPDATE "customer_employees" t SET "userId" = NULL
        WHERE "userId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "users" r WHERE r."id" = t."userId");
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_CUSTOMER_EMPLOYEES_USER') THEN
          ALTER TABLE "customer_employees" ADD CONSTRAINT "FK_CUSTOMER_EMPLOYEES_USER"
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL;
        END IF;
      END $$;
    `,
  },
  {
    name: 'AddPlansAndSubscriptions20260809100000',
    sql: `
      DO $$ BEGIN CREATE TYPE "plans_status_enum" AS ENUM ('ACTIVE','INACTIVE','ARCHIVED'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      CREATE TABLE IF NOT EXISTS "plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "centerId" uuid NOT NULL,
        "name" varchar(120) NOT NULL,
        "description" text NULL,
        "seatType" varchar NOT NULL,
        "billingCycle" varchar NOT NULL DEFAULT 'MONTHLY',
        "price" decimal(12,2) NOT NULL,
        "currency" varchar(8) NOT NULL DEFAULT 'INR',
        "minSeats" int NOT NULL DEFAULT 1,
        "status" "plans_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_PLANS_CENTER_ID" ON "plans" ("centerId");
      DO $$ BEGIN CREATE TYPE "subscriptions_status_enum" AS ENUM ('ACTIVE','SUSPENDED','CANCELLED','EXPIRED','PENDING'); EXCEPTION WHEN duplicate_object THEN null; END $$;
      CREATE TABLE IF NOT EXISTS "subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "customerId" uuid NOT NULL,
        "planId" uuid NOT NULL,
        "centerId" uuid NULL,
        "seatCount" int NOT NULL,
        "unitPrice" decimal(12,2) NOT NULL,
        "amount" decimal(14,2) NOT NULL,
        "status" "subscriptions_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "startDate" timestamp NOT NULL,
        "nextBillingDate" timestamp NOT NULL,
        "endDate" timestamp NULL,
        "notes" text NULL,
        "createdAt" timestamp NOT NULL DEFAULT now(),
        "updatedAt" timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS "IDX_SUBSCRIPTIONS_CUSTOMER_ID" ON "subscriptions" ("customerId");
      CREATE INDEX IF NOT EXISTS "IDX_SUBSCRIPTIONS_PLAN_ID" ON "subscriptions" ("planId");
      UPDATE "plans" t SET "centerId" = NULL WHERE "centerId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "centers" r WHERE r."id" = t."centerId");
      UPDATE "subscriptions" t SET "customerId" = NULL WHERE "customerId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "customers" r WHERE r."id" = t."customerId");
      UPDATE "subscriptions" t SET "planId" = NULL WHERE "planId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "plans" r WHERE r."id" = t."planId");
      UPDATE "subscriptions" t SET "centerId" = NULL WHERE "centerId" IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "centers" r WHERE r."id" = t."centerId");
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_PLANS_CENTER') THEN ALTER TABLE "plans" ADD CONSTRAINT "FK_PLANS_CENTER" FOREIGN KEY ("centerId") REFERENCES "centers"("id") ON DELETE SET NULL; END IF; END $$;
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_SUBSCRIPTIONS_CUSTOMER') THEN ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_SUBSCRIPTIONS_CUSTOMER" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE; END IF; END $$;
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_SUBSCRIPTIONS_PLAN') THEN ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_SUBSCRIPTIONS_PLAN" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT; END IF; END $$;
      DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'FK_SUBSCRIPTIONS_CENTER') THEN ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_SUBSCRIPTIONS_CENTER" FOREIGN KEY ("centerId") REFERENCES "centers"("id") ON DELETE SET NULL; END IF; END $$;
    `,
  },
  {
    name: 'AddBookingSubscriptionId20260809200000',
    sql: `
      ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "subscriptionId" uuid NULL;
      CREATE INDEX IF NOT EXISTS "IDX_BOOKINGS_SUBSCRIPTION_ID" ON "bookings" ("subscriptionId");
    `,
  },
];

async function run(): Promise<void> {
  const client = new pg.Client(config);
  await client.connect();
  console.log(`Connected to ${config.host}:${config.port}/${config.database}`);

  // Ensure the migrations tracking table exists (TypeORM's convention).
  await client.query(`
    CREATE TABLE IF NOT EXISTS "migrations" (
      "id" serial PRIMARY KEY,
      "timestamp" bigint NOT NULL,
      "name" varchar NOT NULL
    );
  `);

  for (const m of migrations) {
    const already = await client.query(
      `SELECT 1 FROM "migrations" WHERE "name" = $1`,
      [m.name],
    );
    if (already.rowCount && already.rowCount > 0) {
      console.log(`  • ${m.name}: already applied, skipping.`);
      continue;
    }
    await client.query('BEGIN');
    try {
      await client.query(m.sql);
      // Extract the timestamp from the class name suffix (YYYYMMDDhhmmss).
      const ts = parseInt((m.name.match(/(\d{14})$/) ?? ['0'])[0], 10) || Date.now();
      await client.query(
        `INSERT INTO "migrations" ("timestamp", "name") VALUES ($1, $2)`,
        [ts, m.name],
      );
      await client.query('COMMIT');
      console.log(`  ✓ ${m.name}: applied.`);
    } catch (err: any) {
      await client.query('ROLLBACK');
      throw err;
    }
  }

  // Verify the new tables/columns exist.
  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('otp_requests','plans','subscriptions')
    ORDER BY table_name;
  `);
  console.log('\nNew tables present:', tables.rows.map((r: any) => r.table_name));

  const subIdCol = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'subscriptionId';
  `);
  console.log('bookings.subscriptionId present:', (subIdCol.rowCount ?? 0) > 0);

  const empUserIdCol = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'customer_employees' AND column_name = 'userId';
  `);
  console.log('customer_employees.userId present:', (empUserIdCol.rowCount ?? 0) > 0);

  await client.end();
  console.log('\n✓ All migrations applied and verified.');
}

run().catch((err) => {
  console.error('✗ Migration application failed:', err);
  process.exit(1);
});
