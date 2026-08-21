/**
 * Build the unseen discovery-validation set.
 * Selection is a deterministic stride across each mechanism's candidate list — no
 * hand-picking, no look-ahead at classification results. Frozen with a hash.
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolveDomain } from '../../src/discovery/mechanisms.js';

const disc = JSON.parse(readFileSync('phase1/out/discovery.v1.json', 'utf8')) as {
  results: { mechanism: string; candidates: { name: string; domain: string | null; source: { url: string }; segmentHint: string }[] }[];
};
const cohorts = JSON.parse(readFileSync('phase0/benchmark/cohorts.v1.json', 'utf8')) as Record<string, { name: string; domain: string }[]>;
const benchDomains = new Set<string>();
const benchNames = new Set<string>();
for (const k of ['cohortA', 'cohortB', 'cohortC', 'cohortD']) {
  for (const c of cohorts[k]) { benchDomains.add(c.domain); benchNames.add(c.name.toLowerCase()); }
}

const QUOTA: Record<string, number> = {
  'distributor_inversion:exclusive_networks': 16,
  'distributor_inversion:infinigate': 16,
  'distributor_inversion:cebeo': 24,
  'platform_tenancy:introw.io': 6,
};

const picked: { name: string; hint: string; mechanism: string; segmentHint: string }[] = [];
for (const m of disc.results) {
  const quota = QUOTA[m.mechanism];
  if (!quota) continue;
  const pool = m.candidates.filter((c) => !benchNames.has(c.name.toLowerCase().trim()));
  const stride = Math.max(1, Math.floor(pool.length / quota));
  for (let i = 0; i < pool.length && picked.filter((p) => p.mechanism === m.mechanism).length < quota; i += stride) {
    picked.push({ name: pool[i].name, hint: pool[i].source.url, mechanism: m.mechanism, segmentHint: pool[i].segmentHint });
  }
}
console.error(`picked ${picked.length} candidates for resolution`);

const companies: { name: string; domain: string; mechanism: string; segmentHint: string; resolution: string }[] = [];
const failures: { name: string; mechanism: string; state: string; method: string }[] = [];
let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (i < picked.length) {
    const p = picked[i++];
    const r = await resolveDomain(p.name, p.hint);
    if (r.state === 'resolved' && r.domain && !benchDomains.has(r.domain)) {
      companies.push({ name: p.name, domain: r.domain, mechanism: p.mechanism, segmentHint: p.segmentHint, resolution: r.method });
    } else {
      failures.push({ name: p.name, mechanism: p.mechanism, state: r.state, method: r.method });
    }
    if ((companies.length + failures.length) % 10 === 0) console.error(`  ${companies.length + failures.length}/${picked.length}`);
  }
}));

companies.sort((a, b) => a.domain.localeCompare(b.domain));
const doc = {
  version: 'unseen.v1',
  frozenAt: new Date().toISOString().slice(0, 10),
  purpose: 'Companies produced by the discovery mechanisms, never seen by any classifier. Measures whether classification generalises beyond the hand-built benchmark.',
  selection: 'Deterministic stride across each mechanism candidate list, quota per mechanism, benchmark members excluded, then entity resolution. No hand-picking and no look-ahead at classification output.',
  groundTruth: 'NONE. These carry no labels. Discovery provenance is a hint, not a label: being carried by a distributor implies channel motion but does not prove the vendor operates the programme itself.',
  resolutionYield: `${companies.length} resolved of ${picked.length} attempted`,
  companies,
  resolutionFailures: failures,
};
writeFileSync('phase1/benchmark/unseen.v1.json', JSON.stringify(doc, null, 2));
console.error(`resolved ${companies.length}/${picked.length}`);
console.error('sha256', createHash('sha256').update(JSON.stringify(doc)).digest('hex').slice(0, 16));
