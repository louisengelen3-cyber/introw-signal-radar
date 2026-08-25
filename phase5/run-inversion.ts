/** Workstream A: run reseller-side inversion across the frozen counterparty seed. */
import { readFileSync, writeFileSync } from 'node:fs';
import { invertReseller } from '../src/discovery/reseller-inversion.js';

const bench = JSON.parse(readFileSync('phase5/benchmark/counterparties.v1.json', 'utf8'));
const arm = process.argv[2] ?? 'reseller_side';
const domains: string[] = arm === 'confirmatory'
  ? bench.confirmatoryOnly.domains
  : bench.arms[arm].domains;

const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < domains.length) {
    const d = domains[i++];
    const started = Date.now();
    try {
      const r = await invertReseller(d, { maxRequests: 16 });
      rows.push({ ...r, arm, seconds: Math.round((Date.now() - started) / 1000) });
      console.error(`[${rows.length}/${domains.length}] ${d.padEnd(26)} surfaces=${r.surfacesRead.length} vendors=${r.distinctVendors.length} req=${r.requests} ${rows[rows.length - 1].seconds}s`);
    } catch (e) {
      rows.push({ counterparty: d, arm, error: (e as Error).message, mentions: [], distinctVendors: [], surfacesRead: [] });
      console.error(`[err] ${d}: ${(e as Error).message}`);
    }
  }
}));
rows.sort((a, b) => a.counterparty.localeCompare(b.counterparty));
writeFileSync(`phase5/out/inversion-${arm}.json`, JSON.stringify(rows, null, 2));
const all = rows.flatMap((r) => r.distinctVendors ?? []);
console.error(`DONE ${arm} — ${rows.length} counterparties, ${all.length} vendor mentions, ${new Set(all).size} distinct vendors`);
