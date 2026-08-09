import * as pg from 'pg';
const c = new pg.Client({ host:'localhost', port:5432, user:'spacejam', password:'spacejam', database:'spacejam' });
(async () => {
  await c.connect();
  const r = await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('otp_requests','plans','subscriptions','customer_employees','customer_documents','onboardings') ORDER BY table_name;");
  console.log('My tables:', r.rows.map(x=>x.table_name));
  const col = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='bookings' AND column_name='subscriptionId';");
  console.log('bookings.subscriptionId:', col.rowCount ? 'present' : 'MISSING');
  const ec = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='customer_employees' AND column_name='userId';");
  console.log('customer_employees.userId:', ec.rowCount ? 'present' : 'MISSING');
  // Check the stale deposit data
  const dep = await c.query("SELECT status, count(*) FROM deposits GROUP BY status;");
  console.log('deposit statuses:', dep.rows);
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
