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

  // ── Seed demo notifications ────────────────────────────────
  const adminRow = await client.query('SELECT id FROM "users" WHERE email = $1', [email]);
  const adminId = adminRow.rows[0]?.id ?? null;

  const notifExists = await client.query('SELECT COUNT(*)::int AS n FROM "notifications"');
  if (notifExists.rows[0].n === 0) {
    const samples = [
      ['New booking confirmed', 'Booking #BK-2048 was confirmed for Cabin 1B today at 10:00 AM.', 'BOOKING', 'MEDIUM', false, '/dashboard/operations'],
      ['Pending deposit release', 'Priya Mehta requested release of the ₹50,000 security deposit.', 'DEPOSIT', 'HIGH', false, '/dashboard/crm/deposits'],
      ['Invoice overdue', 'Invoice INV-2026-0193 is 3 days overdue. Send a reminder?', 'PAYMENT', 'HIGH', false, '/dashboard/revenue/invoices'],
      ['New lead assigned', 'A new lead "Tech Innovations Ltd" was assigned to you.', 'LEAD', 'MEDIUM', true, '/dashboard/crm/leads'],
      ['Maintenance request', 'Printer on 2nd floor is out of toner (request #REQ-117).', 'REQUEST', 'LOW', false, '/dashboard/operations/request'],
      ['Event scheduled', 'Workshop "Founder AMA" is scheduled for tomorrow at 4:00 PM.', 'EVENT', 'LOW', true, '/dashboard/operations/events'],
    ];
    for (const [title, message, type, priority, read, actionUrl] of samples) {
      await client.query(`
        INSERT INTO "notifications" ("userId", title, message, type, priority, read, "actionUrl")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [adminId, title, message, type, priority, read, actionUrl]);
    }
    console.log('seeded notifications');
  }

  await client.end();
}
seed().catch(console.error);
