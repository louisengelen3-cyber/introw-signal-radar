import { readFileSync, writeFileSync } from 'node:fs';
import { harvestPrmCustomers, type PrmVendor } from '../src/discovery/prm-customers.js';
const bench = JSON.parse(readFileSync('phase5/benchmark/prm-vendors.v1.json', 'utf8'));
const vendors: PrmVendor[] = bench.vendors;
const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < vendors.length) {
    const v = vendors[i++];
    try {
      const r = await harvestPrmCustomers(v, { maxRequests: 14 });
      rows.push(r);
      console.error(`[${rows.length}/${vendors.length}] ${v.domain.padEnd(22)} ${v.segment.padEnd(12)} surfaces=${r.surfacesRead.length} mentions=${r.mentions.length}`);
    } catch (e) {
      rows.push({ prmVendor: v.domain, prmSegment: v.segment, error: (e as Error).message, mentions: [], surfacesRead: [] });
    }
  }
}));
writeFileSync('phase5/out/B-harvest.json', JSON.stringify(rows, null, 2));
const all = rows.flatMap((r) => r.mentions ?? []);
console.error(`DONE — ${all.length} mentions, ${new Set(all.map((m: any) => m.customerDomain ?? 'n:' + m.customerName.toLowerCase())).size} distinct`);
