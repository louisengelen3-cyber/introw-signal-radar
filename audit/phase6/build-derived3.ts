/** Parts 14, 15, 18, 19, 20 — FN/FP audits and the ranking tables. */
import { readFileSync, writeFileSync } from 'node:fs';
const J = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const rows: any[] = J('audit/out/introw-radar-reliability-audit.json');
const split = J('phase3/benchmark/customer-split.json');
const cval: any[] = J('phase5/out/C-validation.json');
const cov = readFileSync('audit/out/field-coverage.csv', 'utf8').trim().split('\n').slice(1);
const fail = readFileSync('audit/out/failure-analysis.csv', 'utf8').trim().split('\n').slice(1);
const N = rows.length;
const pct = (n: number, d = N) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);
const esc = (v: any) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (f: string, h: string[], d: any[][]) => writeFileSync(`audit/out/${f}`, [h.join(','), ...d.map((r) => r.map(esc).join(','))].join('\n') + '\n');
const idx = new Map(rows.map((r) => [r.domain, r]));

/* ── PART 14: false negatives, against KNOWN Introw customers ─────────────── */
const customers: string[] = [...split.discovery, ...split.holdout];
const fnRows = customers.map((d) => {
  const r = idx.get(d);
  const c = cval.find((x) => x.domain === d);
  if (!r) return [d, 'KNOWN INTROW CUSTOMER', 'not in the researched corpus', 'D1_NOT_DISCOVERED',
    'the customer was never surfaced by any discovery mechanism', 'seed from the customer list', 'no — discovery does not reach it'];
  const missed: string[] = [];
  if (r.partner_motion_state !== 'established') missed.push('partner motion');
  if (!/^confirmed_/.test(r.crm_evidence_strength)) missed.push('CRM');
  if (r.deal_registration_state !== 'confirmed') missed.push('deal registration');
  if (r.commercial_review_readiness?.startsWith('INSUFF')) missed.push('review readiness');
  return [d, 'KNOWN INTROW CUSTOMER',
    missed.length ? `Radar did not establish: ${missed.join(', ')}` : 'Radar established motion, ownership and CRM',
    r.failure_stage ?? (missed.length ? 'E1/P1' : 'NONE'),
    r.failure_reason ?? (c?.rationale ?? ''),
    missed.includes('CRM') ? 'no public fix — companies do not name their CRM' : 'deeper partner-page traversal',
    missed.length === 0 ? 'already does' : missed.includes('CRM') ? 'not from public data' : 'yes, with deeper traversal'];
});
csv('false-negatives.csv', ['domain', 'expected_fact', 'radar_output', 'failure_stage', 'root_cause', 'possible_fix', 'would_current_architecture_find_it'], fnRows);
const inCorpus = customers.filter((d) => idx.has(d));
const readyCust = inCorpus.filter((d) => idx.get(d).commercial_review_readiness?.startsWith('SUFF'));
console.log('PART 14 — FALSE NEGATIVES vs known Introw customers');
console.log(`  known customers: ${customers.length}`);
console.log(`  present in the researched corpus: ${inCorpus.length}`);
console.log(`  NOT discovered by any mechanism (D1): ${customers.length - inCorpus.length}`);
console.log(`  of those present, review-ready: ${readyCust.length}/${inCorpus.length}`);
const crmCust = inCorpus.filter((d) => /^confirmed_/.test(idx.get(d).crm_evidence_strength));
console.log(`  of those present, CRM established: ${crmCust.length}/${inCorpus.length}`);

/* ── PART 15: false positives ─────────────────────────────────────────────── */
const fpRows: any[][] = [];
const add = (domain: string, category: string, why: string) => fpRows.push([domain, category, why]);
for (const r of rows) {
  if (r.partner_tiers_state === 'confirmed') add(r.domain, 'generic_partner_language', 'tier evidence measured 67% navigation-menu across the audited sample');
  if (r.programme_ownership === 'both' || r.programme_ownership === 'participates') add(r.domain, 'channel_participant_not_operator', 'ownership resolved as participation or both');
  if (r.prm_vendor && r.prm_vendor !== 'Introw') add(r.domain, 'uses_competitor_prm', `runs ${r.prm_vendor} — displacement evidence, not a false positive, recorded for completeness`);
  if (r.informal_programme_signature === 'suppressed_partner_tech') add(r.domain, 'partner_tech_vendor', 'caught by the category guard before promotion');
}
add('3mdeutschland.de', 'integration_or_finder_not_programme', 'robotics integrator FINDER recorded as an established partner motion (manual research, Part 22)');
add('mews.com', 'integration_ecosystem', 'integration marketplace read as partner motion (25 Aug audit)');
csv('false-positives.csv', ['domain', 'category', 'why'], fpRows);
const byCat: Record<string, number> = {};
for (const f of fpRows) byCat[f[1] as string] = (byCat[f[1] as string] ?? 0) + 1;
console.log('\nPART 15 — FALSE POSITIVE CATEGORIES');
for (const [k, v] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(3)}  ${k}`);

/* ── PART 18/19: importance vs observability, and the bottom 10 ───────────── */
const IMPORTANCE: Record<string, string> = {
  'Partner motion': 'CRITICAL', 'Programme ownership': 'CRITICAL', 'Commercial partner motion': 'CRITICAL',
  'Deal registration': 'CRITICAL', 'Partner pipeline': 'CRITICAL', 'Partner attribution': 'CRITICAL',
  'Current CRM': 'CRITICAL', 'CRM decisive': 'CRITICAL', 'Programme type': 'HIGH_VALUE', 'Partner people': 'HIGH_VALUE',
  'Partner tiers': 'HIGH_VALUE', 'Partner portal': 'HIGH_VALUE', 'Partner enablement': 'HIGH_VALUE',
  'Informal signature': 'HIGH_VALUE', 'Lead sharing': 'HIGH_VALUE', 'Referral': 'HIGH_VALUE',
  'Co-selling': 'USEFUL', 'Partner onboarding': 'USEFUL', 'Partner directory': 'USEFUL',
  'Programme scale': 'USEFUL', 'PRM': 'USEFUL', 'CRM any evidence (incl. supporting)': 'USEFUL',
  'Historical CRM': 'OPTIONAL', 'Partner incentives': 'HIGH_VALUE', 'Temporal change / Why Now': 'USEFUL',
};
const FIXABILITY: Record<string, string> = {
  'Partner motion': 'ENGINEERING_FIXABLE', 'Programme ownership': 'HUMAN_RESEARCH_MAY_HELP',
  'Commercial partner motion': 'ENGINEERING_FIXABLE', 'Deal registration': 'PUBLIC_DATA_LIMIT',
  'Partner pipeline': 'PUBLIC_DATA_LIMIT', 'Partner attribution': 'PUBLIC_DATA_LIMIT',
  'Current CRM': 'PUBLIC_DATA_LIMIT', 'CRM decisive': 'PUBLIC_DATA_LIMIT', 'Programme type': 'ENGINEERING_FIXABLE',
  'Partner people': 'SOURCE_COVERAGE_FIXABLE', 'Partner tiers': 'ENGINEERING_FIXABLE',
  'Partner portal': 'ENGINEERING_FIXABLE', 'Partner enablement': 'ENGINEERING_FIXABLE',
  'Informal signature': 'ENGINEERING_FIXABLE', 'Lead sharing': 'ENGINEERING_FIXABLE',
  'Referral': 'ENGINEERING_FIXABLE', 'Co-selling': 'ENGINEERING_FIXABLE',
  'Partner onboarding': 'PUBLIC_DATA_LIMIT', 'Partner directory': 'ENGINEERING_FIXABLE',
  'Programme scale': 'PUBLIC_DATA_LIMIT', 'PRM': 'PUBLIC_DATA_LIMIT',
  'CRM any evidence (incl. supporting)': 'PUBLIC_DATA_LIMIT', 'Historical CRM': 'LICENSED_DATA_MAY_HELP',
  'Partner incentives': 'ENGINEERING_FIXABLE', 'Temporal change / Why Now': 'ENGINEERING_FIXABLE',
};
const parsed = cov.map((l) => {
  const m = l.match(/^(.*?),(\d+),(\d+),(\d+),(\d+),(\d+),([\d.]+),(\d+),(.*?),(.*)$/);
  if (!m) return null;
  return { field: m[1], known: +m[2], na: +m[4], coverage: +m[7], n: +m[8], source: m[9], failure: m[10] };
}).filter(Boolean) as any[];
const impRows = parsed.map((p) => [p.field, IMPORTANCE[p.field] ?? 'USEFUL', p.coverage, p.known, p.n,
  p.na === p.n ? 'NOT MEASURABLE — no detector' : p.coverage >= 40 ? 'high' : p.coverage >= 10 ? 'medium' : 'low',
  p.source, p.failure, FIXABILITY[p.field] ?? 'UNKNOWN']);
csv('importance-vs-coverage.csv', ['field', 'commercial_importance', 'coverage_pct', 'known', 'denominator', 'reliability', 'best_source', 'biggest_failure_mode', 'fixability'], impRows);

const bottom = [...parsed].sort((a, b) => a.coverage - b.coverage).slice(0, 10)
  .map((p) => [p.field, p.coverage, p.known, p.n, IMPORTANCE[p.field] ?? 'USEFUL', p.failure, FIXABILITY[p.field] ?? 'UNKNOWN',
    ['CRITICAL', 'HIGH_VALUE'].includes(IMPORTANCE[p.field] ?? '') ? 'YES — materially harms qualification' : 'no — informative but not qualifying']);
csv('bottom-10-fields.csv', ['field', 'coverage_pct', 'known', 'denominator', 'commercial_importance', 'why_missing', 'fixability', 'harms_qualification'], bottom);
console.log('\nPART 19 — BOTTOM 10 BY COVERAGE');
for (const b of bottom) console.log(`  ${String(b[0]).padEnd(30)} ${String(b[1]).padStart(5)}%  ${String(b[4]).padEnd(11)} ${b[7]}`);

/* ── PART 20: failure ranking ─────────────────────────────────────────────── */
const IMPACT: Record<string, number> = { C2: 10, C4: 10, C1: 9, C3: 8, D3: 8, D2: 8, R1: 6, E1: 6, R4: 5, R3: 4, P4: 4, P1: 2 };
const fparsed = fail.map((l) => { const m = l.match(/^([A-Z0-9]+),(\d+),([\d.]+),/); return m ? { cls: m[1], n: +m[2], pct: +m[3] } : null; }).filter(Boolean) as any[];
csv('failure-ranking.csv', ['rank_type', 'failure_class', 'n', 'pct', 'impact_weight'],
  [...[...fparsed].sort((a, b) => b.n - a.n).map((f, i) => ['by_frequency', f.cls, f.n, f.pct, IMPACT[f.cls] ?? 0]),
   ...[...fparsed].sort((a, b) => (IMPACT[b.cls] ?? 0) - (IMPACT[a.cls] ?? 0)).map((f) => ['by_commercial_impact', f.cls, f.n, f.pct, IMPACT[f.cls] ?? 0])]);
console.log('\nwrote false-negatives.csv, false-positives.csv, importance-vs-coverage.csv, bottom-10-fields.csv, failure-ranking.csv');
