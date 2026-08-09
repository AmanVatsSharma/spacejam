import * as pg from 'pg';
const c = new pg.Client({ host:'localhost', port:5432, user:'spacejam', password:'spacejam', database:'spacejam' });
(async () => {
  await c.connect();
  const r = await c.query("SELECT id, \"startDate\", \"endDate\", \"createdAt\" FROM bookings WHERE \"subscriptionId\" IS NOT NULL ORDER BY \"createdAt\"");
  console.log('Subscription bookings (' + r.rows.length + ' total):');
  for (const b of r.rows) console.log('  ' + b.createdAt + ' | window ' + b.startDate + ' → ' + b.endDate);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
