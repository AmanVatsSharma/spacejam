const fs = require('fs');
const { dataSource } = require('./apps/api/src/typeorm/data-source');

async function run() {
  await dataSource.initialize();
  const sql = fs.readFileSync('/home/ubuntu/apply-migration.sql', 'utf8');
  await dataSource.query(sql);
  console.log('Migration applied manually via SQL');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
