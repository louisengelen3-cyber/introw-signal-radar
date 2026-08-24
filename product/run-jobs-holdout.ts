/** Enrichment-only run: can reading vacancies establish CRM evidence at all? */
import { readFileSync, writeFileSync } from 'node:fs';
import { enrichWithJobs, summariseCrm } from '../src/jobs/enrich.js';

const set = JSON.parse(readFileSync(new URL('./jobs-holdout.v1.json', import.meta.url).pathname, 'utf8')) as { domains: string[] };
const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (i < set.domains.length) {
    const d = set.domains[i++];
    try {
      const e = await enrichWithJobs(d);
      const crm = summariseCrm(e.crmHits);
      rows.push({ domain: d, board: e.tenants[0]?.vendor ?? null, vacancies: e.vacanciesUsed,
        verdicts: crm.verdicts.map((v) => ({ vendor: v.vendor, level: v.level, vacancies: v.supportingVacancies })),
        conflict: crm.conflict, ops: e.operationalHits.length, crmHits: e.crmHits });
      writeFileSync(new URL('./out/jobs-holdout.json', import.meta.url).pathname, JSON.stringify(rows, null, 2));
      const top = crm.verdicts.find((v) => v.level !== 'crm_mention_only');
      console.error(`[${rows.length}/${set.domains.length}] ${d.padEnd(18)} board=${(e.tenants[0]?.vendor ?? '-').padEnd(16)} vac=${String(e.vacanciesUsed).padEnd(3)} crm=${top ? `${top.vendor}:${top.level.replace('crm_', '')}` : '-'}`);
    } catch (err) { console.error(`[err] ${d}: ${(err as Error).message}`); }
  }
}));

const withBoard = rows.filter((r) => r.board);
const withCrm = rows.filter((r) => r.verdicts.some((v: any) => v.level !== 'crm_mention_only'));
const confirmed = rows.filter((r) => r.verdicts.some((v: any) => v.level === 'crm_confirmed'));
console.error(`\nBoards attributed        : ${withBoard.length}/${rows.length}`);
console.error(`CRM evidence established : ${withCrm.length}/${rows.length}  (${withCrm.length}/${withBoard.length} of those with a board)`);
console.error(`  of which confirmed     : ${confirmed.length}`);
console.error(`Conflicts                : ${rows.filter((r) => r.conflict).length}`);
console.error('DONE');
