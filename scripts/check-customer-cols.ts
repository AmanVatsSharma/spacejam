import * as pg from 'pg';
const c = new pg.Client({ host:'localhost', port:5432, user:'spacejam', password:'spacejam', database:'spacejam' });
(async () => {
  await c.connect();
  const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_name='customers' ORDER BY column_name;");
  console.log('customers columns:', r.rows.map(x=>x.column_name).join(', '));
  await c.end();
})().catch(e=>{console.error(e.message);process.exit(1);});
