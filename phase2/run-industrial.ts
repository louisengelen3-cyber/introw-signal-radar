/**
 * Track A — industrial discovery closure.
 *
 * Same frozen companies as Phase 1. The benchmark is the list of NAMES a Belgian
 * electrical wholesaler published; the domain was always a derived artifact, so Phase 2
 * re-resolves those names with entity resolution v2 and reports the change. The company
 * set is not edited.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolveEntity, type Resolution } from '../src/discovery/resolve.js';
import { assessCompany, type Assessment } from '../src/pipeline/assess.js';
import { buildDistributionIndex } from '../src/suitability/distribution.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const unseen = JSON.parse(readFileSync(new URL('../phase1/benchmark/unseen.v1.json', import.meta.url), 'utf8')) as {
  companies: { name: string; domain: string; segmentHint: string; mechanism: string }[];
};
const before = JSON.parse(readFileSync(new URL('../phase1/out/classify.all.json', import.meta.url), 'utf8')) as {
  domain: string; set: string; reachable: boolean; classification: { commerciality: string; rule: string } | null;
  inventory: { site: number; commonCrawl: number };
}[];

const industrial = unseen.companies.filter((c) => c.segmentHint === 'electrical_industrial');
console.error(`industrial cohort: ${industrial.length} companies (frozen in Phase 1, not edited)`);

const distributionIndex = buildDistributionIndex(['phase1/out/discovery.v1.json']);

interface Row {
  name: string;
  beforeDomain: string;
  beforeReachable: boolean;
  beforeCommerciality: string;
  beforeRule: string;
  beforeInventory: number;
  resolution: Resolution;
  afterDomain: string | null;
  after: Assessment | null;
}

const rows: Row[] = [];
let i = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (i < industrial.length) {
    const c = industrial[i++];
    const b = before.find((x) => x.domain === c.domain && x.set === 'unseen');
    const resolution = await resolveEntity(c.name, { context: 'electrical_industrial' });
    let after: Assessment | null = null;
    const afterDomain = resolution.domain;
    if (afterDomain) {
      try { after = await assessCompany(afterDomain, { distributionIndex, name: c.name }); } catch { /* recorded as null */ }
    }
    rows.push({
      name: c.name,
      beforeDomain: c.domain,
      beforeReachable: b?.reachable ?? false,
      beforeCommerciality: b?.classification?.commerciality ?? 'n/a',
      beforeRule: b?.classification?.rule ?? 'n/a',
      beforeInventory: (b?.inventory.site ?? 0) + (b?.inventory.commonCrawl ?? 0),
      resolution, afterDomain, after,
    });
    writeFileSync(`${OUT}industrial.json`, JSON.stringify(rows, null, 2));
    console.error(
      `[${rows.length}/${industrial.length}] ${c.name.padEnd(20)} ` +
      `${c.domain.padEnd(20)} -> ${(afterDomain ?? '-').padEnd(20)} [${resolution.state.padEnd(12)}] ` +
      `before=${(b?.classification?.commerciality ?? '-').padEnd(13)} after=${(after?.classification?.commerciality ?? '-').padEnd(13)} ` +
      `probes=${after?.inventory.probed ?? 0} hits=${after?.inventory.probeHits ?? 0}`,
    );
  }
}));
writeFileSync(`${OUT}industrial.json`, JSON.stringify(rows, null, 2));
console.error('DONE wrote industrial.json');
