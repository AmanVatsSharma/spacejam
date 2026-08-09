// Verify processSubscriptionCycle is idempotent against the live DB.
// Reuses an admin token: clears the OTP rate-limit counter for the test phone,
// logs in fresh, then re-runs the cycle for the existing subscription.
import * as pg from 'pg';
const GQL = 'http://localhost:3100/graphql';
async function gql(q: string, v: any, t?: string) {
  const h: any = { 'Content-Type': 'application/json' };
  if (t) h.Authorization = `Bearer ${t}`;
  const r = await fetch(GQL, { method: 'POST', headers: h, body: JSON.stringify({ query: q, variables: v }) });
  const j: any = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}
const db = new pg.Client({ host: 'localhost', port: 5432, user: 'spacejam', password: 'spacejam', database: 'spacejam' });
(async () => {
  await db.connect();
  // Clear OTP rate-limit history for the test phone so we can log in again.
  await db.query("DELETE FROM otp_requests WHERE phone = '+919876543210'");
  const otp = await gql(`mutation($p: String!){ requestOtp(input:{phone:$p}){devCode} }`, { p: '+919876543210' });
  const v = await gql(`mutation($p: String!, $c: String!){ verifyOtp(input:{phone:$p, code:$c}){ accessToken } }`, { p: '+919876543210', c: otp.requestOtp.devCode });
  await db.query("UPDATE users SET role = 'ADMIN' WHERE phone = '+919876543210'");
  const token = v.verifyOtp.accessToken;
  const sub = await db.query("SELECT id FROM subscriptions ORDER BY \"createdAt\" DESC LIMIT 1");
  const subId = sub.rows[0].id;
  const rerun = await gql(`mutation($id: ID!){ processSubscriptionCycle(subscriptionId:$id){ bookingsCreated skipped invoiceId } }`, { id: subId }, token);
  console.log('Re-run result:', JSON.stringify(rerun.processSubscriptionCycle));
  if (!rerun.processSubscriptionCycle.skipped) throw new Error('Idempotency failed — re-run did not skip');
  const cnt = await db.query("SELECT count(*)::int AS n FROM bookings WHERE \"subscriptionId\" = $1", [subId]);
  console.log('Bookings for subscription after re-run:', cnt.rows[0].n);
  if (cnt.rows[0].n !== 1) throw new Error('Idempotency failed — duplicate bookings created');
  await db.end();
  console.log('✅ IDEMPOTENCY VERIFIED — re-running the cycle is a no-op (no duplicate bookings).');
})().catch(e => { console.error('❌', e.message); process.exit(1); });
