// Test all frontend mutations against live schema to verify args match
const fetch = globalThis.fetch;

async function getSchema() {
  const r = await fetch('http://localhost:3100/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `{ __type(name: "Mutation") { fields { name args { name type { name ofType { name } } } } } }` }),
  });
  const d = await r.json();
  return d.data.__type.fields;
}

// Frontend mutation definitions from hooks/use-operations.ts and use-enterprise.ts
const frontendMutations = [
  { name: 'bookRoom', args: ['attendeesCount', 'centerId', 'description', 'endTime', 'eventDate', 'requestedBy', 'roomId', 'startTime', 'title'] },
  { name: 'cancelBooking', args: ['id'] },
  { name: 'cancelRoomBooking', args: ['bookingId', 'roomId'] },
  { name: 'cancelEvent', args: ['id'] },
  { name: 'cancelRequest', args: ['id'] },
  { name: 'createCenter', args: ['input'] },
  { name: 'createFloor', args: ['input'] },
  { name: 'createMeetingRoom', args: ['input'] },
  { name: 'createEvent', args: ['input'] },
  { name: 'createLead', args: ['input'] },
  { name: 'createCustomer', args: ['input'] },
  { name: 'createRequest', args: ['input'] },
  { name: 'createSeat', args: ['input'] },
  { name: 'createEquipment', args: ['input'] },
  { name: 'updateFloor', args: ['id', 'input'] },
  { name: 'updateMeetingRoom', args: ['id', 'input'] },
  { name: 'updateRoomStatus', args: ['id', 'status'] },
  { name: 'updateEventStatus', args: ['id', 'status'] },
  { name: 'bulkUpdateStatus', args: ['roomIds', 'status'] },
  { name: 'deleteFloor', args: ['id'] },
  { name: 'deleteMeetingRoom', args: ['id'] },
  { name: 'assignRequest', args: ['assignedToId', 'id'] },
  { name: 'approveRequest', args: ['id'] },
  { name: 'rejectRequest', args: ['id', 'resolution'] },
  { name: 'completeRequest', args: ['id', 'resolution'] },
  { name: 'escalateRequest', args: ['id'] },
  { name: 'cancelRecurringBooking', args: ['id'] },
  { name: 'expandRecurring', args: ['id'] },
  { name: 'countRecurringOccurrences', args: ['id'] },
  { name: 'updateBooking', args: ['id', 'input'] },
  { name: 'checkInBooking', args: ['id'] },
  { name: 'checkOutBooking', args: ['id'] },
];

async function main() {
  const schemaMutations = await getSchema();
  const schemaMap = new Map(schemaMutations.map((m) => [m.name, m.args.map((a) => a.name)]));

  let passed = 0, failed = 0;
  const failures = [];

  for (const m of frontendMutations) {
    const schemaArgs = schemaMap.get(m.name);
    if (!schemaArgs) {
      failed++;
      failures.push(`${m.name}: NOT FOUND in schema`);
      continue;
    }
    const missing = m.args.filter(a => !schemaArgs.includes(a));
    const extra = schemaArgs.filter(a => !m.args.includes(a));
    if (missing.length === 0 && extra.length === 0) {
      passed++;
    } else {
      failed++;
      const issues = [];
      if (missing.length) issues.push(`missing args: ${missing.join(', ')}`);
      if (extra.length) issues.push(`extra schema args: ${extra.join(', ')}`);
      failures.push(`${m.name}: ${issues.join(' | ')}`);
    }
  }

  console.log(`\n=== MUTATION VALIDATION ===`);
  console.log(`Passed: ${passed}/${frontendMutations.length}`);
  console.log(`Failed: ${failed}/${frontendMutations.length}`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log('  - ' + f));
  }
}

main().catch(e => console.error(e));
