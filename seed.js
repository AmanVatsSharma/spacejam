const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function seed() {
  const client = new Client({
    connectionString: 'postgresql://spacejam:spacejam@localhost:5432/spacejam',
  });
  await client.connect();
  const passwordHash = await bcrypt.hash('changeme-1234', 12);
  const email = 'admin@spacejam.test';
  
  const res = await client.query('SELECT id FROM "users" WHERE email = $1', [email]);
  if (res.rows.length === 0) {
    await client.query(`
      INSERT INTO "users" (email, name, "passwordHash", role, "isActive", "emailVerified")
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [email, 'SpaceJam Admin', passwordHash, 'ADMIN', true, true]);
    console.log('created admin');
  } else {
    await client.query(`
      UPDATE "users" SET role = $1, "isActive" = $2, "emailVerified" = $3, name = $4, "passwordHash" = $5
      WHERE email = $6
    `, ['ADMIN', true, true, 'SpaceJam Admin', passwordHash, email]);
    console.log('updated admin');
  }
  await client.end();
}
seed().catch(console.error);
