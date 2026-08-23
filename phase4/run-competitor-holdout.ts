/**
 * Out-of-sample validation of the category detector.
 *
 * The detector was written AFTER seeing which hard negatives failed, on the same 19
 * records. That makes its in-sample score meaningless as evidence of generalisation.
 * This set was frozen (sha256 6ef9bb5c45c7d7a8) before the detector was run against it.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { assessCompany } from '../src/pipeline/assess.js';
import { buildDistributionIndex } from '../src/suitability/distribution.js';
import { assessCategory } from '../src/suitability/category.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const set = JSON.parse(readFileSync(new URL('./benchmark/competitor-holdout.v1.json', import.meta.url), 'utf8')) as {
  companies: { name: string; domain: string; class: string; basis: string }[];
};
const distributionIndex = buildDistributionIndex(['phase1/out/discovery.v1.json']);

const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < set.companies.length) {
    const c = set.companies[i++];
    try {
      const a = await assessCompany(c.domain, { distributionIndex, name: c.name });
      const obs = a.positive?.observations ?? [];
      const cat = assessCategory(obs);
      rows.push({ ...c, promotion: a.promotion?.state ?? '-', observations: obs.length, category: cat });
      writeFileSync(`${OUT}competitor-holdout.json`, JSON.stringify(rows, null, 2));
      console.error(
        `[${rows.length}/${set.companies.length}] ${c.class.padEnd(22)} ${c.domain.padEnd(20)} ` +
        `obs=${String(obs.length).padEnd(3)} promo=${String(a.promotion?.state ?? '-').padEnd(15)} ` +
        `cat=${cat.state.padEnd(16)} ${cat.signals.join('+')}`,
      );
    } catch (e) { console.error(`[err] ${c.domain}: ${(e as Error).message}`); }
  }
}));
writeFileSync(`${OUT}competitor-holdout.json`, JSON.stringify(rows, null, 2));

const tech = rows.filter((r) => r.class === 'partner_tech_vendor');
const adj = rows.filter((r) => r.class === 'adjacent_partner_tech');
const ctl = rows.filter((r) => r.class === 'operator_control');
const ex = (r: any) => r.category.state === 'excluded';
console.error(`\nOUT-OF-SAMPLE RESULT`);
console.error(`  partner_tech_vendor   excluded: ${tech.filter(ex).length}/${tech.length}  missed: ${tech.filter((r:any)=>!ex(r)).map((r:any)=>`${r.domain}(${r.category.state},obs=${r.observations})`).join(', ')||'none'}`);
console.error(`  adjacent_partner_tech excluded: ${adj.filter(ex).length}/${adj.length}`);
console.error(`  operator_control      excluded: ${ctl.filter(ex).length}/${ctl.length}  FALSE POSITIVES: ${ctl.filter(ex).map((r:any)=>r.domain).join(', ')||'none'}`);
console.error(`  operator_control      review_required: ${ctl.filter((r:any)=>r.category.state==='review_required').map((r:any)=>`${r.domain}(${r.category.signals.join('+')})`).join(', ')||'none'}`);
console.error('DONE');
