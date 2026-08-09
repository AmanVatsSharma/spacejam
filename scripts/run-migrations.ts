/**
 * Standalone migration runner. Initializes the TypeORM DataSource and runs
 * all pending migrations in order. Run with tsx so the .ts migration files
 * load at runtime:
 *
 *   NODE_ENV=production npx tsx scripts/run-migrations.ts
 *
 * NODE_ENV=production forces synchronize=false so migrations are the sole
 * source of truth (matches prod, which runs synchronize:false).
 */
import { dataSource } from '../apps/api/src/typeorm/data-source';

async function run(): Promise<void> {
  await dataSource.initialize();
  const hasPending = await dataSource.showMigrations();
  if (!hasPending) {
    console.log('✓ No pending migrations — schema is up to date.');
    await dataSource.destroy();
    return;
  }
  const ran = await dataSource.runMigrations({ transaction: 'each' });
  console.log(`✓ Applied ${ran.length} migration(s):`);
  for (const m of ran) console.log(`    ${m.name}`);
  await dataSource.destroy();
}

run().catch((err) => {
  console.error('✗ Migration run failed:', err);
  process.exit(1);
});
