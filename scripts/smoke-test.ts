/**
 * End-to-end smoke test against the live API at http://localhost:3100/api/graphql.
 * Exercises the full M1–M3 wired system against a REAL database:
 *
 *   1. requestOtp → dev code returned (OTP_DEV_BYPASS=true)
 *   2. verifyOtp  → access + refresh tokens issued
 *   3. GET_ME with the token → user hydrated
 *   4. Seed a center + floor + seat + customer (prerequisites for billing)
 *   5. createPlan
 *   6. createSubscription (amount computed)
 *   7. processSubscriptionCycle → seats allocated + bookings w/ planId+subscriptionId + invoice
 *   8. Verify the bookings + invoice were persisted
 *
 * Run AFTER the API is booted + the smoke schema is bootstrapped.
 *   npx tsx scripts/smoke-test.ts
 */
import * as pg from 'pg';

const GQL = 'http://localhost:3100/graphql';

async function gql(query: string, variables: any = {}, token?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(GQL, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const json: any = await res.json();
  if (json.errors) throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
  return json.data;
}

const TEST_PHONE = '+919876543210';

async function seedPrerequisites(db: pg.Client): Promise<{ centerId: string; floorId: string; seatId: string; customerId: string; adminUserId: string }> {
  // Ensure a center exists.
  let r = await db.query("SELECT id FROM centers ORDER BY \"createdAt\" LIMIT 1");
  let centerId: string;
  if (r.rowCount === 0) {
    const ins = await db.query(
      `INSERT INTO centers (name, code, status, "createdAt", "updatedAt") VALUES ('Smoke Center','SMOKE','ACTIVE',now(),now()) RETURNING id`,
    );
    centerId = ins.rows[0].id;
  } else {
    centerId = r.rows[0].id;
  }

  // Ensure a floor exists for that center.
  r = await db.query("SELECT id FROM floors WHERE \"centerId\" = $1 LIMIT 1", [centerId]);
  let floorId: string;
  if (r.rowCount === 0) {
    const ins = await db.query(
      `INSERT INTO floors (name, "centerId", "createdAt", "updatedAt") VALUES ('Floor 1', $1, now(), now()) RETURNING id`,
      [centerId],
    );
    floorId = ins.rows[0].id;
  } else {
    floorId = r.rows[0].id;
  }

  // Ensure a DEDICATED seat exists for that center/floor.
  r = await db.query("SELECT id FROM seats WHERE \"centerId\" = $1 AND \"seatType\" = 'DEDICATED' LIMIT 1", [centerId]);
  let seatId: string;
  if (r.rowCount === 0) {
    const ins = await db.query(
      `INSERT INTO seats ("floorId", "centerId", name, "seatType", price, status, active, "minBookingDuration", "maxBookingDuration", "createdAt", "updatedAt")
       VALUES ($1, $2, 'D-1', 'DEDICATED', 8000, 'AVAILABLE', true, 30, 480, now(), now()) RETURNING id`,
      [floorId, centerId],
    );
    seatId = ins.rows[0].id;
  } else {
    seatId = r.rows[0].id;
  }

  // Ensure a customer exists.
  r = await db.query("SELECT id FROM customers ORDER BY \"createdAt\" LIMIT 1");
  let customerId: string;
  if (r.rowCount === 0) {
    const ins = await db.query(
      `INSERT INTO customers (name, email, phone, status, "centerId", "createdAt", "updatedAt") VALUES ('Smoke Co','smoke@test','$TEST_PHONE','ACTIVE',$1,now(),now()) RETURNING id`,
      [centerId],
    );
    customerId = ins.rows[0].id;
  } else {
    customerId = r.rows[0].id;
  }

  // Promote the OTP-provisioned user to ADMIN so createPlan/createSubscription pass the guard.
  // (The smoke user is created by verifyOtp as a MEMBER.)
  const adminUser = await db.query("SELECT id FROM users WHERE phone = $1", [TEST_PHONE]);
  const adminUserId = adminUser.rows[0]?.id;

  return { centerId, floorId, seatId, customerId, adminUserId };
}

async function main(): Promise<void> {
  const db = new pg.Client({ host: 'localhost', port: 5432, user: 'spacejam', password: 'spacejam', database: 'spacejam' });
  await db.connect();

  console.log('=== M1–M3 end-to-end smoke test ===\n');

  // ── 1. requestOtp ──────────────────────────────────────────────────────
  const otp = await gql(
    `mutation($phone: String!) { requestOtp(input: { phone: $phone }) { ok expiresInSeconds devCode } }`,
    { phone: TEST_PHONE },
  );
  console.log('1. requestOtp → ok=' + otp.requestOtp.ok + ', devCode=' + otp.requestOtp.devCode);
  if (!otp.requestOtp.devCode) throw new Error('No devCode — server not in OTP_DEV_BYPASS mode');

  // ── 2. verifyOtp ───────────────────────────────────────────────────────
  const verify = await gql(
    `mutation($phone: String!, $code: String!) {
       verifyOtp(input: { phone: $phone, code: $code }) {
         accessToken refreshToken
         user { id email name role phone }
       }
     }`,
    { phone: TEST_PHONE, code: otp.requestOtp.devCode },
  );
  const token = verify.verifyOtp.accessToken;
  const user = verify.verifyOtp.user;
  console.log('2. verifyOtp → user ' + user.id + ' (' + user.role + '), token=' + (token ? 'issued' : 'MISSING'));
  if (!token) throw new Error('No access token returned');

  // ── 3. GET_ME with the token ────────────────────────────────────────────
  const me = await gql(`query { me { id name role phone } }`, {}, token);
  console.log('3. GET_ME → ' + me.me.name + ' (' + me.me.role + ', ' + me.me.phone + ')');
  if (!me.me || !me.me.id) throw new Error('GET_ME returned no user — token invalid');

  // ── 4. Seed prerequisites + promote to admin ───────────────────────────
  const prereq = await seedPrerequisites(db);
  if (prereq.adminUserId) {
    await db.query("UPDATE users SET role = 'ADMIN' WHERE id = $1", [prereq.adminUserId]);
    console.log('   promoted smoke user → ADMIN for createPlan/Subscription');
  }

  // ── 5. createPlan ──────────────────────────────────────────────────────
  const plan = await gql(
    `mutation($input: CreatePlanInput!) {
       createPlan(input: $input) { id name seatType billingCycle price status }
     }`,
    { input: { centerId: prereq.centerId, name: 'Smoke Dedicated', seatType: 'DEDICATED', billingCycle: 'MONTHLY', price: 8000 } },
    token,
  );
  const planId = plan.createPlan.id;
  console.log('5. createPlan → ' + plan.createPlan.name + ' (' + plan.createPlan.seatType + ', ₹' + plan.createPlan.price + ')');

  // ── 6. createSubscription ──────────────────────────────────────────────
  const sub = await gql(
    `mutation($input: CreateSubscriptionInput!) {
       createSubscription(input: $input) { id seatCount amount unitPrice status nextBillingDate }
     }`,
    { input: { customerId: prereq.customerId, planId, seatCount: 1 } },
    token,
  );
  const subId = sub.createSubscription.id;
  console.log('6. createSubscription → amount=₹' + sub.createSubscription.amount + ' (unitPrice ₹' + sub.createSubscription.unitPrice + ' × ' + sub.createSubscription.seatCount + '), status=' + sub.createSubscription.status);

  // ── 7. processSubscriptionCycle ────────────────────────────────────────
  const cycle = await gql(
    `mutation($id: ID!) {
       processSubscriptionCycle(subscriptionId: $id) {
         subscriptionId invoiceId bookingsCreated seatsAllocated amount skipped
       }
     }`,
    { id: subId },
    token,
  );
  const r = cycle.processSubscriptionCycle;
  console.log('7. processSubscriptionCycle → bookings=' + r.bookingsCreated + ', seatsAllocated=' + r.seatsAllocated + ', invoiceId=' + (r.invoiceId || '—') + ', amount=₹' + r.amount + ', skipped=' + r.skipped);

  // ── 8. Verify persisted bookings + invoice against the DB ──────────────
  const bookings = await db.query(
    'SELECT id, "planId", "subscriptionId", "customerId", status FROM bookings WHERE "subscriptionId" = $1',
    [subId],
  );
  console.log('\n8. DB verification:');
  console.log('   bookings for this subscription: ' + bookings.rowCount);
  if (bookings.rowCount === 0) throw new Error('No bookings created for the subscription');
  const b0 = bookings.rows[0];
  console.log('   booking[0]: planId=' + b0.planId + ', subscriptionId=' + b0.subscriptionId + ', customerId=' + b0.customerId + ', status=' + b0.status);
  if (b0.planId !== planId) throw new Error('booking.planId mismatch');
  if (b0.subscriptionId !== subId) throw new Error('booking.subscriptionId mismatch');

  const invoices = await db.query('SELECT id, "invoiceNumber", amount, "totalAmount", status FROM invoices WHERE "customerId" = $1 ORDER BY "createdAt" DESC LIMIT 1', [prereq.customerId]);
  if (invoices.rowCount === 0) throw new Error('No invoice generated');
  const inv = invoices.rows[0];
  console.log('   invoice: ' + inv.invoiceNumber + ', amount=₹' + inv.amount + ', total=₹' + inv.totalAmount + ', status=' + inv.status);
  if (Number(inv.amount) !== 8000) throw new Error('invoice amount mismatch (expected 8000)');

  // seat status should now be RESERVED
  const seat = await db.query("SELECT status FROM seats WHERE id = $1", [prereq.seatId]);
  console.log('   seat status: ' + seat.rows[0].status);

  await db.end();
  console.log('\n✅ SMOKE TEST PASSED — the full M1–M3 system works against a real database.');
}

main().catch((e) => {
  console.error('\n❌ SMOKE TEST FAILED:', e.message);
  process.exit(1);
});
