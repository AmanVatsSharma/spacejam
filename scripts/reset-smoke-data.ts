import * as pg from 'pg';
const c = new pg.Client({ host:'localhost', port:5432, user:'spacejam', password:'spacejam', database:'spacejam' });
(async () => {
  await c.connect();
  // Clean only the M1-M3 test artifacts so the smoke test runs from scratch.
  await c.query("DELETE FROM bookings WHERE \"subscriptionId\" IS NOT NULL");
  await c.query("DELETE FROM subscriptions");
  await c.query("DELETE FROM invoices WHERE \"customerId\" IN (SELECT id FROM customers WHERE phone = '+919876543210' OR email = 'smoke@test')");
  await c.query("DELETE FROM otp_requests WHERE phone = '+919876543210'");
  await c.query("UPDATE seats SET status = 'AVAILABLE' WHERE status = 'RESERVED'");
  await c.query("UPDATE customer_employees SET \"seatId\" = NULL WHERE \"customerId\" IN (SELECT id FROM customers WHERE email = 'smoke@test')");
  console.log('✓ Reset smoke test data (kept centers/floors/seats/plans/customers).');
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
