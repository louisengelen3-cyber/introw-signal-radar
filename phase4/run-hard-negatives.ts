/**
 * Hard-negative baseline.
 *
 * The Phase 3 constructs run UNCHANGED (git tag `phase3-frozen`). Nothing is tuned before
 * this measurement, so the result is a genuine baseline rather than a demonstration.
 *
 * The question this set exists to answer:
 *   are the constructs measuring INTROW SUITABILITY, or merely the existence of a
 *   serious partner programme?
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { assessCompany, type Assessment } from '../src/pipeline/assess.js';
import { buildDistributionIndex } from '../src/suitability/distribution.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const set = JSON.parse(readFileSync(new URL('./benchmark/hard-negatives.v1.json', import.meta.url), 'utf8')) as {
  companies: { name: string; domain: string; program: string; negativeBasis: string; negativeRationale: string }[];
};
const distributionIndex = buildDistributionIndex(['phase1/out/discovery.v1.json']);

const rows: (Assessment & { name: string; negativeBasis: string; negativeRationale: string; program: string })[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < set.companies.length) {
    const c = set.companies[i++];
    try {
      const a = await assessCompany(c.domain, { distributionIndex, name: c.name });
      rows.push({ ...a, name: c.name, negativeBasis: c.negativeBasis, negativeRationale: c.negativeRationale, program: c.program });
      writeFileSync(`${OUT}hard-negatives.json`, JSON.stringify(rows, null, 2));
      console.error(
        `[${rows.length}/${set.companies.length}] ${c.negativeBasis.slice(0, 14).padEnd(15)} ${c.domain.padEnd(28)} ` +
        `mat=${(a.positive?.materiality ?? '-').padEnd(13)} own=${(a.positive?.ownership ?? '-').padEnd(20)} ` +
        `surf=${(a.positive?.surface ?? '-').padEnd(9)} dens=${(a.positive?.evidenceDensity ?? '-').padEnd(9)} => ${(a.promotion?.state ?? '-').padEnd(15)}`,
      );
    } catch (e) { console.error(`[err] ${c.domain}: ${(e as Error).message}`); }
  }
}));
writeFileSync(`${OUT}hard-negatives.json`, JSON.stringify(rows, null, 2));

const promoted = rows.filter((r) => r.promotion?.state === 'high_fit');
console.error(`\nFALSELY PROMOTED: ${promoted.length} of ${rows.length}`);
for (const p of promoted) console.error(`  ${p.domain} [${p.negativeBasis}] — ${p.promotion?.rationale.slice(0, 120)}`);
const byState: Record<string, number> = {};
for (const r of rows) byState[r.promotion?.state ?? '-'] = (byState[r.promotion?.state ?? '-'] ?? 0) + 1;
console.error(`states: ${Object.entries(byState).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
console.error('DONE');
