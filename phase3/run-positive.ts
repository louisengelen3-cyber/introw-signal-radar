/**
 * Positive promotion test.
 *
 * Three populations, kept separate and never mixed:
 *   customers   — known positives; promotion here is the thing being measured
 *   negatives   — clean structural negatives; promotion here is a false promotion
 *   unlabelled  — matched prospects; promotion is neither right nor wrong, it is a candidate
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { assessCompany, type Assessment } from '../src/pipeline/assess.js';
import { buildDistributionIndex } from '../src/suitability/distribution.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const controls = JSON.parse(readFileSync(new URL('./benchmark/controls.v1.json', import.meta.url), 'utf8')) as {
  cleanNegatives: { name: string; domain: string; negativeBasis: string }[];
  matchedUnlabelled: { name: string; domain: string; matchedTo: string }[];
};
const split = JSON.parse(readFileSync(new URL('./benchmark/customer-split.json', import.meta.url), 'utf8')) as {
  discovery: string[]; holdout: string[];
};

const work: { domain: string; name: string; population: string; meta: string }[] = [
  ...split.discovery.map((d) => ({ domain: d, name: d, population: 'customer_discovery', meta: '' })),
  ...split.holdout.map((d) => ({ domain: d, name: d, population: 'customer_holdout', meta: '' })),
  ...controls.cleanNegatives.map((c) => ({ domain: c.domain, name: c.name, population: 'clean_negative', meta: c.negativeBasis })),
  ...controls.matchedUnlabelled.map((c) => ({ domain: c.domain, name: c.name, population: 'matched_unlabelled', meta: `matched to ${c.matchedTo}` })),
];

const distributionIndex = buildDistributionIndex(['phase1/out/discovery.v1.json']);
const rows: (Assessment & { name: string; population: string; meta: string })[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < work.length) {
    const t = work[i++];
    try {
      const a = await assessCompany(t.domain, { distributionIndex, name: t.name });
      rows.push({ ...a, name: t.name, population: t.population, meta: t.meta });
      writeFileSync(`${OUT}positive.json`, JSON.stringify(rows, null, 2));
      console.error(
        `[${rows.length}/${work.length}] ${t.population.slice(0, 12).padEnd(13)} ${t.domain.padEnd(22)} ` +
        `mat=${(a.positive?.materiality ?? '-').padEnd(13)} own=${(a.positive?.ownership ?? '-').padEnd(21)} ` +
        `surf=${(a.positive?.surface ?? '-').padEnd(9)} => ${(a.promotion?.state ?? '-').padEnd(15)} [${a.promotion?.rule ?? ''}]`,
      );
    } catch (e) { console.error(`[err] ${t.domain}: ${(e as Error).message}`); }
  }
}));
writeFileSync(`${OUT}positive.json`, JSON.stringify(rows, null, 2));
console.error('DONE');
