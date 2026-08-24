/**
 * Incremental value of job enrichment: the same 35 accounts, before and after.
 *
 * The question is narrow and stated in the mandate: does reading a company's own job adverts
 * add defensible evidence that website research did not have? Not "does it find HubSpot
 * somewhere".
 */
import { readFileSync } from 'node:fs';
import type { Dossier } from '../src/dossier/types.js';

const before = JSON.parse(readFileSync(new URL('./out/dossiers-before-jobs.json', import.meta.url).pathname, 'utf8')) as Dossier[];
const after = JSON.parse(readFileSync(new URL('./out/dossiers.json', import.meta.url).pathname, 'utf8')) as Dossier[];
const B = new Map(before.map((d) => [d.domain, d]));

const level = (d: Dossier): string => {
  const b = d.systems.crm.bundle;
  if (!b || !b.primary) return d.systems.crm.state === 'unknown' ? 'unknown' : d.systems.crm.state;
  return b.primary.level.replace('crm_', '');
};

const tally = (ds: Dossier[]) => {
  const t: Record<string, number> = {};
  for (const d of ds) {
    const s = d.systems.crm.state === 'unknown' ? 'unknown' : d.systems.crm.state.replace('_confirmed', '');
    t[s] = (t[s] ?? 0) + 1;
  }
  return t;
};

console.log(`INCREMENTAL VALUE OF JOB ENRICHMENT — n=${after.length}\n`);
console.log('CRM state, before → after');
const tb = tally(before), ta = tally(after);
for (const k of new Set([...Object.keys(tb), ...Object.keys(ta)])) {
  console.log(`  ${k.padEnd(14)} ${String(tb[k] ?? 0).padStart(2)} → ${String(ta[k] ?? 0).padStart(2)}`);
}

const changed = after.filter((d) => (B.get(d.domain)?.systems.crm.state ?? 'unknown') !== d.systems.crm.state);
console.log(`\nAccounts whose CRM state changed: ${changed.length}`);
for (const d of changed) {
  console.log(`  ${d.domain.padEnd(20)} ${B.get(d.domain)!.systems.crm.state} → ${d.systems.crm.state}  (${level(d)})`);
}

const withBoard = after.filter((d) => (d.jobEvidence?.tenants.length ?? 0) > 0);
const vacs = after.reduce((n, d) => n + (d.jobEvidence?.vacanciesUsed ?? 0), 0);
console.log(`\nBoards attributed: ${withBoard.length}/${after.length} · current vacancies read: ${vacs}`);
console.log(`Duplicates collapsed: ${after.reduce((n, d) => n + (d.jobEvidence?.duplicatesCollapsed ?? 0), 0)}`);

const ops = after.flatMap((d) => (d.jobEvidence?.operationalHits ?? []).map((h) => ({ domain: d.domain, ...h })));
const byFact: Record<string, number> = {};
for (const o of ops) byFact[o.fact] = (byFact[o.fact] ?? 0) + 1;
console.log(`\nNew operational facts from vacancies: ${ops.length} across ${new Set(ops.map((o) => o.domain)).size} accounts`);
for (const [f, n] of Object.entries(byFact).sort((a, b) => b[1] - a[1])) console.log(`  ${f.padEnd(28)} ${n}`);

const conflicts = after.filter((d) => d.systems.crm.bundle?.conflict);
console.log(`\nConflicting CRM evidence (routed to review, not resolved): ${conflicts.length}`);
for (const d of conflicts) console.log(`  ${d.domain}: ${d.systems.crm.bundle!.vendors.map((v) => `${v.vendor}=${v.level.replace('crm_', '')}`).join(' vs ')}`);

// The guardrail: job volume must not track the machine interpretation.
const FORWARD = new Set(['strong_evidence', 'plausible', 'research']);
const withJobs = after.filter((d) => (d.jobEvidence?.vacanciesUsed ?? 0) > 0);
const fwdWithJobs = withJobs.filter((d) => FORWARD.has(d.machineInterpretation.state)).length;
const withoutJobs = after.filter((d) => (d.jobEvidence?.vacanciesUsed ?? 0) === 0);
const fwdWithout = withoutJobs.filter((d) => FORWARD.has(d.machineInterpretation.state)).length;
console.log(`\nPUBLICATION-BIAS GUARDRAIL`);
console.log(`  accounts WITH vacancies forwarded    : ${fwdWithJobs}/${withJobs.length}`);
console.log(`  accounts WITHOUT vacancies forwarded : ${fwdWithout}/${withoutJobs.length}`);
// Only accounts that actually received job evidence can testify to a leak; everything else
// differs because the web moved between crawls, which is not what this guardrail is about.
const enriched = after.filter((d) => (d.jobEvidence?.vacanciesUsed ?? 0) > 0);
const same = enriched.every((d) => d.machineInterpretation.state === B.get(d.domain)?.machineInterpretation.state);
const coverageSame = enriched.every((d) => d.evidenceCoverage === B.get(d.domain)?.evidenceCoverage);
console.log(`  machine interpretation unchanged on enriched accounts: ${same ? 'yes' : 'NO — investigate'}`);
console.log(`  evidence coverage unchanged on enriched accounts     : ${coverageSame ? 'yes' : 'NO — investigate'}`);
const drift = after.filter((d) => (d.jobEvidence?.vacanciesUsed ?? 0) === 0 && d.evidenceCoverage !== B.get(d.domain)?.evidenceCoverage);
if (drift.length) console.log(`  (${drift.length} unenriched account(s) changed between crawls — ordinary web drift: ${drift.map((d) => d.domain).join(', ')})`);
