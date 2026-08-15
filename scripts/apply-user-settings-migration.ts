/**
 * One-off applier for 20260814100000-AddUserSettingsAndRoleEnums.
 * Mirrors scripts/apply-migrations-raw.ts: runs the migration's idempotent
 * SQL directly and records the row in the `migrations` table.
 *
 *   npx tsx scripts/apply-user-settings-migration.ts
 */
import * as pg from 'pg';

const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  user: process.env.DATABASE_USER || 'spacejam',
  password: process.env.DATABASE_PASSWORD || 'spacejam',
  database: process.env.DATABASE_NAME || 'spacejam',
};

const MIGRATION_NAME = 'AddUserSettingsAndRoleEnums20260814100000';

async function run() {
  const client = new pg.Client(config);
  await client.connect();

  await client.query(`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "settings" jsonb NULL;
  `);

  for (const enumName of ['users_role_enum', 'user_role_enum']) {
    for (const value of ['SUPER_ADMIN', 'CENTER_OWNER', 'EMPLOYEE', 'COMPANY_ADMIN']) {
      await client.query(`
        DO $$ BEGIN
          ALTER TYPE "${enumName}" ADD VALUE '${value}';
        EXCEPTION WHEN duplicate_object THEN null;
                  WHEN undefined_object THEN null; END $$;
      `);
    }
  }

  await client.query(
    `INSERT INTO "migrations" (timestamp, name) VALUES ($1, $2) ON CONFLICT DO NOTHING;`,
    [20260814100000, MIGRATION_NAME],
  );

  const cols = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='settings';`,
  );
  console.log('users.settings present:', cols.rows.length === 1);
  const enums = await client.query(
    `SELECT e.enumlabel FROM pg_type t JOIN pg_enum e ON t.oid=e.enumtypid WHERE t.typname='users_role_enum' ORDER BY e.enumsortorder;`,
  );
  console.log('users_role_enum:', enums.rows.map((r) => r.enumlabel).join(', '));
  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
