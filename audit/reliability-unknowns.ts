/**
 * §15 UNKNOWN AUDIT — the most commercially important split in this report.
 *
 * GOOD UNKNOWN    the information genuinely cannot be established from public sources
 * BAD UNKNOWN     it probably exists publicly and our retrieval failed
 * UNTESTED UNKNOWN research stopped before the question was properly asked
 */
import { readFileSync, writeFileSync } from 'node:fs';
const rows: any[] = JSON.parse(readFileSync('audit/out/introw-radar-reliability-audit.json', 'utf8'));
const existing: any[] = JSON.parse(readFileSync('crm-research/out/existing.json', 'utf8'));
const batch: any[] = JSON.parse(readFileSync('discovery/batch/out-research.json', 'utf8'));
const cov = new Map<string, any>();
for (const r of existing) cov.set(r.domain, r.coverage);
for (const r of batch) cov.set(r.domain, r.crmCoverage);
const N = rows.length;
const pct = (n: number, t = N) => Math.round((n / t) * 1000) / 10;

type Verdict = 'GOOD' | 'BAD' | 'UNTESTED';
const out: any[][] = [];

/** CRM unknown: why? */
const crmUnknown = rows.filter((r) => r.crm_evidence_level === 'unknown');
const crmSplit: Record<Verdict, string[]> = { GOOD: [], BAD: [], UNTESTED: [] };
for (const r of crmUnknown) {
  const c = cov.get(r.domain);
  const vac = c?.vacanciesRead ?? 0;
  const careers = c?.careersPagesFound ?? 0;
  const ats = c?.atsBoardFound === true;
  if (vac >= 3) crmSplit.GOOD.push(r.domain);                 // we read adverts; none named a CRM
  else if (careers > 0 || ats) crmSplit.BAD.push(r.domain);   // a surface existed, we got nothing off it
  else crmSplit.UNTESTED.push(r.domain);                      // never reached a careers surface at all
}

/** Partner motion unknown: why? */
const motionUnknown = rows.filter((r) => r.partner_motion_state === 'unknown');
const motionSplit: Record<Verdict, string[]> = { GOOD: [], BAD: [], UNTESTED: [] };
for (const r of motionUnknown) {
  if (r.website_pages_inspected === 0) motionSplit.UNTESTED.push(r.domain);
  else if (r.website_pages_inspected >= 5) motionSplit.GOOD.push(r.domain);
  else motionSplit.BAD.push(r.domain);
}

/** Deal registration unknown across the whole corpus. */
const drUnknown = rows.filter((r) => r.deal_registration_state !== 'confirmed');
const drSplit: Record<Verdict, string[]> = { GOOD: [], BAD: [], UNTESTED: [] };
for (const r of drUnknown) {
  if (r.partner_motion_state !== 'established') drSplit.UNTESTED.push(r.domain);
  else if (r.partner_portal_state === 'confirmed') drSplit.GOOD.push(r.domain);  // behind a login by design
  else drSplit.BAD.push(r.domain);
}

const report = (field: string, split: Record<Verdict, string[]>, total: number, goodWhy: string, badWhy: string, untestedWhy: string) => {
  console.log(`\n${field} — ${total} unknown of ${N}`);
  console.log(`  GOOD     ${String(split.GOOD.length).padStart(3)} (${pct(split.GOOD.length, total)}% of unknowns)  ${goodWhy}`);
  console.log(`  BAD      ${String(split.BAD.length).padStart(3)} (${pct(split.BAD.length, total)}%)  ${badWhy}`);
  console.log(`  UNTESTED ${String(split.UNTESTED.length).padStart(3)} (${pct(split.UNTESTED.length, total)}%)  ${untestedWhy}`);
  out.push([field, total, split.GOOD.length, split.BAD.length, split.UNTESTED.length, goodWhy, badWhy, untestedWhy]);
};

console.log(`§15 UNKNOWN AUDIT (n=${N})`);
report('CRM', crmSplit, crmUnknown.length,
  'vacancies were read and none named a CRM — the company does not publish it',
  'a careers surface existed but produced no readable vacancy (JS-rendered or listing-only)',
  'no ATS board and no readable careers page — the question was never properly asked');
report('Partner motion', motionSplit, motionUnknown.length,
  'five or more pages read and no partner vocabulary found',
  'between one and four pages read — too little to conclude',
  'zero pages retrieved — nothing was asked');
report('Deal registration', drSplit, drUnknown.length,
  'a partner portal exists, so deal registration is expected to sit behind the login',
  'motion established but no portal and no deal-reg language — plausibly on a page we did not read',
  'no partner motion established, so the question does not yet arise');

const totGood = crmSplit.GOOD.length + motionSplit.GOOD.length + drSplit.GOOD.length;
const totBad = crmSplit.BAD.length + motionSplit.BAD.length + drSplit.BAD.length;
const totUnt = crmSplit.UNTESTED.length + motionSplit.UNTESTED.length + drSplit.UNTESTED.length;
const t = totGood + totBad + totUnt;
console.log(`\nACROSS THE THREE FIELDS THAT MATTER MOST`);
console.log(`  GOOD unknown     ${totGood} (${pct(totGood, t)}%)  — a public-data limit`);
console.log(`  BAD unknown      ${totBad} (${pct(totBad, t)}%)  — our retrieval failed`);
console.log(`  UNTESTED unknown ${totUnt} (${pct(totUnt, t)}%)  — we stopped before asking properly`);
console.log(`\n  ${pct(totBad + totUnt, t)}% of unknowns are OURS to fix, not the web's fault.`);

const esc = (v: any) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
writeFileSync('audit/out/unknown-audit.csv',
  ['field,total_unknown,good_unknown,bad_unknown,untested_unknown,good_reason,bad_reason,untested_reason',
    ...out.map((r) => r.map(esc).join(','))].join('\n') + '\n');
writeFileSync('audit/out/unknown-audit-detail.json', JSON.stringify({ crm: crmSplit, motion: motionSplit, dealRegistration: drSplit }, null, 2));
console.log('\nwrote audit/out/unknown-audit.csv');
