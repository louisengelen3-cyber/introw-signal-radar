/**
 * Red team for the distribution signal.
 *
 * The worry: "distribution-mediated" may be a proxy for "hardware/security vendor"
 * rather than for an operating model. If so, the model would be rebuilding the narrow
 * SaaS ICP through the back door — exactly what the mandate forbids.
 */
import { readFileSync } from 'node:fs';
import type { Assessment } from '../src/pipeline/assess.js';
import { buildDistributionIndex, findSightings } from '../src/suitability/distribution.js';

const idx = buildDistributionIndex(['phase1/out/discovery.v1.json']);
const dev = JSON.parse(readFileSync('phase2/out/suitability.dev.json', 'utf8')) as (Assessment & { name: string; cohort: string })[];
const hold = JSON.parse(readFileSync('phase2/out/suitability.holdout.json', 'utf8')) as (Assessment & { name: string; cohort: string })[];
const all = [...dev, ...hold];

const SAASISH = /^(cumulocity|cubbit|factorialhr|sedai|xelix|zenity|ringover|teamleader|exact|bynder|vanta|egnyte|rooms|aikido|coder|sharegate|parloa|safebreach|keepersecurity|avepoint|illumio|microsoft|sap)\b/;

console.log('## 1. Is distribution a proxy for "not SaaS"?');
let rows: string[] = [];
for (const bucket of ['saas-ish', 'hardware/security/industrial']) {
  const inBucket = all.filter((r) => (SAASISH.test(r.domain) ? 'saas-ish' : 'hardware/security/industrial') === bucket);
  const carried = inBucket.filter((r) => findSightings(idx, r.name, r.domain).length > 0);
  rows.push(`  ${bucket.padEnd(30)} n=${String(inBucket.length).padEnd(4)} distributor-carried=${carried.length} (${Math.round(100 * carried.length / inBucket.length)}%)`);
}
rows.forEach((r) => console.log(r));

console.log('\n## 2. Within distributor-carried companies, does the model still discriminate?');
const carried = all.filter((r) => findSightings(idx, r.name, r.domain).length > 0);
const byCohort: Record<string, Record<string, number>> = {};
for (const r of carried) {
  const c = r.cohort.slice(6, 7);
  byCohort[c] ??= {};
  const s = r.suitability?.state ?? '-';
  byCohort[c][s] = (byCohort[c][s] ?? 0) + 1;
}
for (const [c, v] of Object.entries(byCohort)) console.log(`  cohort ${c}: ${JSON.stringify(v)}`);

console.log('\n## 3. Known customers that ARE distributor-carried (the confound in action)');
for (const r of all.filter((x) => x.cohort.startsWith('cohortA') && findSightings(idx, x.name, x.domain).length > 0)) {
  console.log(`  ${r.domain.padEnd(20)} ${r.suitability?.state.padEnd(18)} [${r.suitability?.rule}]`);
}

console.log('\n## 4. Red-team false positives — could an attractive-looking account be inappropriate?');
const traps: [string, string][] = [
  ['sap.com', 'SAP-like global multi-tier channel'],
  ['microsoft.com', 'Microsoft-like massive ecosystem'],
  ['bynder.com', 'integration-heavy SaaS with one reseller artifact'],
  ['fluke.com', 'manufacturer sold by distributors but not managing them'],
  ['deloitte.com', 'consultancy participating in vendor channels'],
  ['nokia.com', 'mature enterprise PRM environment'],
];
for (const [d, why] of traps) {
  const r = all.find((x) => x.domain === d);
  console.log(`  ${d.padEnd(18)} ${why.padEnd(50)} -> ${(r?.suitability?.state ?? 'not run').padEnd(18)} [${r?.suitability?.rule ?? ''}]`);
}

console.log('\n## 5. Red-team false negatives — are we discarding legitimate accounts?');
const fns: [string, string][] = [
  ['axon.com', 'Salesforce customer'],
  ['factorialhr.com', 'large but simple programme'],
  ['cubbit.io', 'customer with a competitor-adjacent distribution footprint'],
  ['niko.eu', 'industrial with sparse public evidence'],
  ['quatt.io', 'manufacturer managing installers directly'],
  ['extrahop.com', 'competitor PRM but manageable complexity'],
  ['exact.com', 'multi-country but centrally managed'],
];
for (const [d, why] of fns) {
  const r = all.find((x) => x.domain === d);
  console.log(`  ${d.padEnd(18)} ${why.padEnd(50)} -> ${(r?.suitability?.state ?? 'not run').padEnd(18)} [${r?.suitability?.rule ?? ''}]`);
}

console.log('\n## 6. Operator resolution distribution across all 50');
const dirs: Record<string, number> = {};
for (const r of all) dirs[r.operator?.direction ?? '-'] = (dirs[r.operator?.direction ?? '-'] ?? 0) + 1;
console.log(' ', JSON.stringify(dirs));
const participants = all.filter((r) => r.operator?.direction === 'channel_participant');
console.log('  participants:', participants.map((r) => `${r.domain} (${r.operator!.participatesIn.map((p) => p.owner).join('/')})`).join(', ') || 'none');
