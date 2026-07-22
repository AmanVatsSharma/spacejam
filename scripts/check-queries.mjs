// Test all page GraphQL queries against live API
const queries = [
  { name: 'GET_MY_CENTERS', query: `query { myCenters { id name } }` },
  { name: 'GET_FLOORS', query: `query { floors(centerId: "") { id name centerId } }` },
  { name: 'GET_SEATS', query: `query { seats { id name } }` },
  { name: 'meetingRooms', query: `query { meetingRooms { id name status capacity centerId } }` },
  { name: 'events', query: `query { events { id title } }` },
  { name: 'bookings', query: `query { bookings { id title } }` },
  { name: 'recurringBookings', query: `query { recurringBookings { id title } }` },
  { name: 'leads', query: `query { leads { id name } }` },
  { name: 'customers', query: `query { customers { id name } }` },
  { name: 'contracts', query: `query { contracts { id } }` },
  { name: 'deposits', query: `query { deposits { id } }` },
  { name: 'invoices', query: `query { invoices { id } }` },
  { name: 'requests', query: `query { requests { id } }` },
];

async function testQuery(name, query) {
  try {
    const r = await fetch('http://localhost:3100/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    const d = await r.json();
    if (d.errors) {
      console.log(`FAIL ${name}:`, d.errors[0].message.slice(0, 100));
    } else if (d.data === null) {
      console.log(`NULL ${name}: no data returned`);
    } else {
      const keys = Object.keys(d.data);
      const vals = d.data[keys[0]];
      const count = Array.isArray(vals) ? vals.length : (vals ? 1 : 0);
      console.log(`OK   ${name}: ${count} items`);
    }
  } catch (e) {
    console.log(`ERR  ${name}: ${e.message.slice(0, 80)}`);
  }
}

(async () => {
  for (const q of queries) {
    await testQuery(q.name, q.query);
  }
})();
