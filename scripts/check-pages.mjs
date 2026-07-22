// Smoke test all dashboard pages for GraphQL errors
const pages = [
  '/dashboard/home',
  '/dashboard/inventory',
  '/dashboard/inventory/floor-map',
  '/dashboard/crm',
  '/dashboard/crm/leads',
  '/dashboard/crm/customers',
  '/dashboard/operations',
  '/dashboard/operations/meeting-room',
  '/dashboard/operations/events',
  '/dashboard/operations/recurring-bookings',
  '/dashboard/operations/request',
  '/dashboard/revenue',
  '/dashboard/revenue/contracts',
  '/dashboard/revenue/deposits',
  '/dashboard/revenue/invoices',
];

const results = [];

for (const path of pages) {
  try {
    const r = await fetch('http://localhost:3000' + path, { redirect: 'follow' });
    results.push({ path, status: r.status, ok: r.ok });
  } catch (e) {
    results.push({ path, status: 'ERR', error: String(e).slice(0, 200) });
  }
}

console.table(results);
