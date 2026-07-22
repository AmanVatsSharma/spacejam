// Comprehensive test: run ALL Apollo operations from the frontend against the live API
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const webSrc = 'C:/Users/ASUS TUF A15/Desktop/DevOPS/Workspace/spacejam/apps/web/src';

function extractGqlBlocks(filePath: string): string[] {
  const content = readFileSync(filePath, 'utf8');
  const blocks: string[] = [];
  let i = 0;
  while (i < content.length) {
    const gqlIdx = content.indexOf('gql`', i);
    if (gqlIdx === -1) break;
    let depth = 0;
    let j = gqlIdx + 4;
    let block = '';
    while (j < content.length) {
      if (content[j] === '`' && content[j-1] !== '\\') {
        blocks.push(block);
        i = j + 1;
        break;
      }
      block += content[j];
      j++;
    }
  }
  return blocks;
}

// Find all TS/TSX files with gql blocks
const files: string[] = [];
function walk(dir: string) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = require('fs').statSync(full);
    if (stat.isDirectory() && !['node_modules', '.next', '__tests__'].includes(entry)) walk(full);
    else if ((entry.endsWith('.ts') || entry.endsWith('.tsx')) && !entry.endsWith('.test.ts') && !entry.endsWith('.test.tsx')) files.push(full);
  }
}
walk(join(webSrc, 'lib/apollo'));
walk(join(webSrc, 'hooks'));

const allBlocks: { file: string; block: string }[] = [];
for (const f of files) {
  const blocks = extractGqlBlocks(f);
  for (const b of blocks) allBlocks.push({ file: f.replace(webSrc + '/', ''), block: b });
}

// Deduplicate
const seen = new Set<string>();
const unique = allBlocks.filter(b => {
  const key = b.block.trim().slice(0, 50);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

console.log(`Found ${unique.length} unique gql operations across ${files.length} files\n`);

async function testOp(item: { file: string; block: string }) {
  const op = item.block.trim();
  if (!op) return;

  // Extract operation name
  const nameMatch = op.match(/(query|mutation)\s+(\w+)/);
  const opType = nameMatch?.[1];
  const opName = nameMatch?.[2] || 'unknown';
  const opKind = opType === 'mutation' ? 'MUTATION' : 'QUERY';

  try {
    const r = await fetch('http://localhost:3100/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: op }),
    });
    const d = await r.json() as any;
    if (d.errors) {
      const msg = d.errors[0]?.message || 'Unknown error';
      console.log(`FAIL  [${opKind}] ${opName}: ${msg.slice(0, 120)}`);
      console.log(`       in: ${item.file}`);
    } else if (d.data === null) {
      console.log(`NULL  [${opKind}] ${opName}: no data returned`);
      console.log(`       in: ${item.file}`);
    } else {
      // Extract top-level key from response
      const topKey = Object.keys(d.data)[0];
      const val = d.data[topKey];
      const count = Array.isArray(val) ? `${val.length} items` : (val ? 'OK' : 'null');
      console.log(`OK    [${opKind}] ${opName}: ${count}`);
    }
  } catch (e) {
    console.log(`ERR   [${opKind}] ${opName}: ${(e as Error).message.slice(0, 80)}`);
    console.log(`       in: ${item.file}`);
  }
}

// Run in batches of 5
const batchSize = 5;
for (let i = 0; i < unique.length; i += batchSize) {
  const batch = unique.slice(i, i + batchSize);
  await Promise.all(batch.map(testOp));
}
