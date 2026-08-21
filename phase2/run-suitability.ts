/**
 * Track C runner: assess the frozen suitability benchmark.
 * Dev and holdout are run separately and reported separately; holdout labels are not
 * inspected while rules are being tuned.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { assessCompany, type Assessment } from '../src/pipeline/assess.js';
import { buildDistributionIndex } from '../src/suitability/distribution.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const split = JSON.parse(readFileSync(new URL('./benchmark/suitability.split.json', import.meta.url), 'utf8')) as {
  dev: { name: string; domain: string; cohort: string }[];
  holdout: { name: string; domain: string; cohort: string }[];
};

const distributionIndex = buildDistributionIndex(['phase1/out/discovery.v1.json']);
console.error(`distribution index: ${distributionIndex.brandCount} brands from ${distributionIndex.distributors.join(', ')}`);

const which = process.argv[2] === 'holdout' ? 'holdout' : 'dev';
const work = split[which];
const results: (Assessment & { name: string; cohort: string })[] = [];
const OUTFILE = `${OUT}suitability.${which}.json`;

let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (i < work.length) {
    const t = work[i++];
    try {
      const a = await assessCompany(t.domain, { distributionIndex, name: t.name });
      results.push({ ...a, name: t.name, cohort: t.cohort });
      writeFileSync(OUTFILE, JSON.stringify(results, null, 2));
      console.error(
        `[${results.length}/${work.length}] ${t.cohort.slice(6, 8)} ${t.domain.padEnd(22)} ` +
        `chan=${(a.classification?.commerciality ?? '-').padEnd(15)} ` +
        `dir=${(a.operator?.direction ?? '-').padEnd(20)} ` +
        `fit=${(a.suitability?.state ?? '-').padEnd(18)} [${a.suitability?.rule ?? ''}]`,
      );
    } catch (e) { console.error(`[err] ${t.domain}: ${(e as Error).message}`); }
  }
}));
writeFileSync(OUTFILE, JSON.stringify(results, null, 2));
console.error(`DONE wrote ${OUTFILE}`);
