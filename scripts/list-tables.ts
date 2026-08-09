import * as pg from 'pg';
const client = new pg.Client({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  user: process.env.DATABASE_USER || 'spacejam',
  password: process.env.DATABASE_PASSWORD || 'spacejam',
  database: process.env.DATABASE_NAME || 'spacejam',
});
(async () => {
  await client.connect();
  const r = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name;",
  );
  console.log('Tables (' + r.rows.length + '):');
  for (const row of r.rows) console.log('  ' + row.table_name);
  let m: any = { rows: [] };
  try {
    m = await client.query('SELECT name FROM migrations ORDER BY timestamp;');
    console.log('\nRecorded migrations:');
    for (const row of m.rows) console.log('  ' + row.name);
  } catch {
    console.log('\nNo migrations table.');
  }
  await client.end();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
