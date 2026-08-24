/** Highest-precision discovery mechanism: who is paying a PRM vendor to run a programme? */
import { mkdirSync, writeFileSync } from 'node:fs';
import { PRM_SEEDS, discoverByPrmTenancy } from '../src/discovery/adapters.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const all: any[] = [];
for (const [label, domain] of PRM_SEEDS) {
  const c = await discoverByPrmTenancy(domain, label);
  all.push(...c);
  console.error(`${label.padEnd(16)} ${String(c.length).padStart(4)} candidates`);
}
const unique = [...new Map(all.map((c) => [c.domain, c])).values()];
writeFileSync(`${OUT}prm-tenancy.json`, JSON.stringify(unique, null, 2));
console.error(`\ntotal ${all.length} · unique companies ${unique.length}`);
console.error('sample:', unique.slice(0, 12).map((c) => c.domain).join(', '));
