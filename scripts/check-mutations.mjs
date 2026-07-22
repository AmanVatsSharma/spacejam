fetch('http://localhost:3100/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: `{ __type(name: "Mutation") { fields { name type { name } args { name type { name } } } } }`
  })
})
  .then(r => r.json())
  .then(d => {
    console.log('=== MUTATIONS ===');
    d.data.__type.fields.forEach(f => {
      const args = f.args.map(a => a.name + ':' + a.type.name).join(', ');
      console.log(f.name + '(' + args + ') -> ' + f.type.name);
    });

    // Check recurring bookings fields
    const rb = d.data.__type.fields.find(f => f.name === 'recurringBookings');
    if (rb) {
      console.log('\n=== recurringBookings args ===');
      rb.args.forEach(a => console.log('  ' + a.name + ': ' + a.type.name));
    }

    const createRB = d.data.__type.fields.find(f => f.name === 'createRecurringBooking');
    if (createRB) {
      console.log('\n=== createRecurringBooking args ===');
      createRB.args.forEach(a => console.log('  ' + a.name + ': ' + a.type.name));
    }
  })
  .catch(e => console.error(e));
