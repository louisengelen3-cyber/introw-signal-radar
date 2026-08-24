/** Run job enrichment across the frozen sample and record the raw result for audit. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { enrichWithJobs } from '../src/jobs/enrich.js';
import { summariseCrm } from '../src/jobs/enrich.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const set = JSON.parse(readFileSync(new URL('./jobs-sample.v1.json', import.meta.url).pathname, 'utf8')) as { domains: string[] };

const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < set.domains.length) {
    const d = set.domains[i++];
    try {
      const e = await enrichWithJobs(d);
      const crm = summariseCrm(e.crmHits);
      rows.push({ ...e, crmSummary: crm });
      writeFileSync(`${OUT}jobs-sample.json`, JSON.stringify(rows, null, 2));
      const top = crm.verdicts[0];
      console.error(
        `[${rows.length}/${set.domains.length}] ${d.padEnd(20)} ` +
        `board=${(e.tenants[0]?.vendor ?? '-').padEnd(16)} vac=${String(e.vacanciesUsed).padEnd(3)} ` +
        `crm=${(top ? `${top.vendor}:${top.level.replace('crm_', '')}` : '-').padEnd(28)} ops=${e.operationalHits.length}`,
      );
    } catch (err) { console.error(`[err] ${d}: ${(err as Error).message}`); }
  }
}));
console.error('DONE');
