/**
 * Standalone migration runner. Initializes the TypeORM DataSource and runs
 * all pending migrations in order. Uses the same DataSource config as the app
 * (apps/api/src/typeorm/data-source.ts) so the entity/migration paths match.
 *
 * Run with NODE_ENV=production so synchronize=false (migrations are the sole
 * source of truth — matches prod).
 *
 * Usage: node scripts/run-migrations.js
 */
const { dataSource } = require('../apps/api/src/typeorm/data-source');

async function run() {
  await dataSource.initialize();
  const pending = await dataSource.showMigrations();
  if (!pending) {
    console.log('No pending migrations — schema is up to date.');
    await dataSource.destroy();
    return;
  }
  const ran = await dataSource.runMigrations({ transaction: 'each' });
  console.log(`Applied ${ran.length} migration(s):`);
  for (const m of ran) console.log(`  ✓ ${m.name}`);
  await dataSource.destroy();
}

run().catch((err) => {
  console.error('Migration run failed:', err);
  process.exit(1);
});
