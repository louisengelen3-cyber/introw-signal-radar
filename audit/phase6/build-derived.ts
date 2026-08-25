/** Parts 4, 5, 12, 13, 16, 21 — derived datasets, all machine-computed from the account dataset. */
import { readFileSync, writeFileSync } from 'node:fs';
const rows: any[] = JSON.parse(readFileSync('audit/out/introw-radar-reliability-audit.json', 'utf8'));
const N = rows.length;
const pct = (n: number, d = N) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);
const esc = (v: any) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (f: string, h: string[], d: any[][]) =>
  writeFileSync(`audit/out/${f}`, [h.join(','), ...d.map((r) => r.map(esc).join(','))].join('\n') + '\n');

/* ── PART 4: field coverage, five states kept apart ───────────────────────── */
const KNOWN = new Set(['established', 'confirmed', 'owned', 'direct', 'claimed', 'yes', 'two_or_more', 'one_found',
  'confirmed_current', 'confirmed_recent', 'confirmed_historical', 'informal_programme', 'formalised_programme']);
const NOT_ATT = new Set(['not_attempted']);
const BLOCKED = new Set(['blocked']);

const FIELDS: [string, string, string, string][] = [
  // label, key, primary successful source, primary failure mode
  ['Partner motion', 'partner_motion_state', 'company partner page + recovery', 'R1 partner page not retrieved'],
  ['Programme ownership', 'programme_ownership', 'operator resolution on the company domain', 'C3 operator/participant ambiguity'],
  ['Commercial partner motion', 'commercial_partner_motion', 'partner page prose', 'P1 not published'],
  ['Programme type', 'programme_types', 'partner page vocabulary', 'E2 vocabulary miss'],
  ['Referral', 'referral_state', 'partner page prose', 'E2 named as a partner TYPE, not a workflow'],
  ['Lead sharing', 'lead_sharing_state', '—', 'E2 vocabulary sits inside programme prose we rarely reach'],
  ['Co-selling', 'co_sell_state', 'partner page prose', 'P1 not published'],
  ['Deal registration', 'deal_registration_state', 'partner page prose', 'P1 behind the partner login by design'],
  ['Partner pipeline', 'partner_pipeline_state', '—', 'P1 behind the partner login by design'],
  ['Partner onboarding', 'partner_onboarding_state', 'partner page prose', 'P1 behind the application step'],
  ['Partner enablement', 'partner_enablement_state', 'partner page prose', 'E3 often in a PDF'],
  ['Partner tiers', 'partner_tiers_state', 'partner page prose', 'C1 navigation menus read as tier evidence'],
  ['Partner incentives', 'partner_incentives_state', '—', 'no detector exists'],
  ['Partner attribution', 'partner_attribution_state', '—', 'no detector exists'],
  ['Partner portal', 'partner_portal_state', 'partner login link', 'R1 login page not reached'],
  ['Partner directory', 'partner_directory_state', 'outbound-link density', 'E3 JS locators score zero'],
  ['Programme scale', 'programme_scale_state', 'prose claim on a partner page', 'P1 most companies never publish a count'],
  ['Informal signature', 'informal_programme_signature', 'first-person recruitment + named types', 'R1 partner page not retrieved'],
  ['CRM any evidence (incl. supporting)', 'ANY_CRM', 'website fingerprint (mostly)', 'P1 companies do not name their CRM'],
  ['CRM decisive', 'crm_evidence_strength', 'company vacancy, operational-duty language', 'P1 companies do not name their CRM'],
  ['Current CRM', 'current_crm_evidence', 'company vacancy, operational-duty language', 'P1 companies do not name their CRM'],
  ['Historical CRM', 'historical_crm_evidence', '—', 'R5 no archived-vacancy source is wired in'],
  ['Partner people', 'partner_people_state', 'indexed LinkedIn profiles', 'not attempted on most accounts'],
  ['PRM', 'prm_state', 'DNS fingerprint', 'P1 portals served from the customer domain'],
  ['Temporal change / Why Now', 'temporal_evidence', '—', 'needs a second dated observation'],
];

const covRows = FIELDS.map(([label, key, src, fail]) => {
  let known = 0, unknown = 0, na = 0, blocked = 0, conflicting = 0;
  for (const r of rows) {
    const v = String(r[key] ?? '');
    if (key === 'ANY_CRM') {
      // "any evidence" means any non-unknown CRM level, INCLUDING supporting and mention-only.
      // Reusing the decisive KNOWN set here silently redefined the row and reported 1.3%.
      if (r.crm_conflict) conflicting++;
      else if (r.crm_state === 'blocked') blocked++;
      else if (r.job_research_attempted === 'not_attempted') na++;
      else if (r.crm_evidence_strength && r.crm_evidence_strength !== 'unknown') known++;
      else unknown++;
      continue;
    }
    if (key === 'programme_types') { v ? known++ : unknown++; continue; }
    if (key === 'crm_evidence_strength' && r.crm_conflict) { conflicting++; continue; }
    if (NOT_ATT.has(v)) na++;
    else if (BLOCKED.has(v)) blocked++;
    else if (v === 'conflicting') conflicting++;
    else if (KNOWN.has(v)) known++;
    else unknown++;
  }
  return [label, known, unknown, na, blocked, conflicting, pct(known), N, src, fail];
});
csv('field-coverage.csv',
  ['field', 'known', 'unknown', 'not_attempted', 'blocked', 'conflicting', 'coverage_pct', 'denominator', 'primary_successful_source', 'primary_failure_mode'],
  covRows);

console.log('PART 4 — FIELD COVERAGE (n=' + N + ')');
console.log('field                        known  unk   n/a  blk  cnf   cov%');
for (const c of covRows) console.log(`${String(c[0]).padEnd(28)} ${String(c[1]).padStart(5)} ${String(c[2]).padStart(4)} ${String(c[3]).padStart(5)} ${String(c[4]).padStart(4)} ${String(c[5]).padStart(4)}  ${c[6]}%`);

/* ── PART 5: coverage by segment ──────────────────────────────────────────── */
const segRows: any[][] = [];
const seg = (dim: string, key: string) => {
  const m = new Map<string, any[]>();
  for (const r of rows) { const k = String(r[key] ?? 'unknown'); m.set(k, [...(m.get(k) ?? []), r]); }
  for (const [k, rs] of [...m].sort((a, b) => b[1].length - a[1].length)) {
    segRows.push([dim, k, rs.length,
      pct(rs.filter((r) => r.partner_motion_state === 'established').length, rs.length),
      pct(rs.filter((r) => r.programme_ownership === 'direct' || r.programme_ownership === 'owned').length, rs.length),
      pct(rs.filter((r) => /^confirmed_/.test(r.crm_evidence_strength)).length, rs.length),
      pct(rs.filter((r) => r.deal_registration_state === 'confirmed').length, rs.length),
      pct(rs.filter((r) => r.commercial_review_readiness?.startsWith('SUFF')).length, rs.length),
      rs.length < 6 ? 'CELL TOO SMALL — do not compare' : '']);
  }
};
seg('sector', 'sector'); seg('region', 'region'); seg('language', 'language'); seg('mechanism', 'discovery_mechanism');
csv('segment-coverage.csv', ['dimension', 'bucket', 'n', 'motion_pct', 'ownership_pct', 'crm_decisive_pct', 'deal_reg_pct', 'review_ready_pct', 'warning'], segRows);

/* ── PART 12: failure taxonomy, all named classes ─────────────────────────── */
const FIX: Record<string, string> = {
  D1: 'SOURCE_COVERAGE_FIXABLE', D2: 'ENGINEERING_FIXABLE', D3: 'ENGINEERING_FIXABLE',
  R1: 'ENGINEERING_FIXABLE', R2: 'ENGINEERING_FIXABLE', R3: 'ENGINEERING_FIXABLE',
  R4: 'SOURCE_COVERAGE_FIXABLE', R5: 'LICENSED_DATA_MAY_HELP',
  E1: 'ENGINEERING_FIXABLE', E2: 'ENGINEERING_FIXABLE', E3: 'ENGINEERING_FIXABLE',
  C1: 'ENGINEERING_FIXABLE', C2: 'ENGINEERING_FIXABLE', C3: 'HUMAN_RESEARCH_MAY_HELP',
  C4: 'ENGINEERING_FIXABLE', C5: 'ENGINEERING_FIXABLE',
  P1: 'PUBLIC_DATA_LIMIT', P2: 'PUBLIC_DATA_LIMIT', P3: 'HUMAN_RESEARCH_MAY_HELP', P4: 'PUBLIC_DATA_LIMIT',
};
const classify = (r: any): { cls: string; why: string } => {
  if (r.entity_resolution_state === 'name_only_unresolved') return { cls: 'D3', why: 'surfaced as a name with no resolvable domain' };
  if (r.crm_state === 'blocked') return { cls: 'R3', why: 'careers surface returns 403' };
  if (r.pages_inspected === 0) return { cls: 'R1', why: 'no readable page retrieved at all' };
  if (r.partner_motion_state !== 'established' && r.pages_inspected > 0) {
    return r.pages_inspected >= 5 ? { cls: 'E1', why: 'pages read, no motion evidence extracted' } : { cls: 'R1', why: 'too few pages read to conclude' };
  }
  if (r.partner_tiers_state === 'confirmed') return { cls: 'C1', why: 'tier evidence measured 67% navigation-menu' };
  if (/^confirmed_/.test(r.crm_evidence_strength)) return { cls: 'NONE', why: 'motion and CRM both established' };
  if (r.crm_evidence_strength === 'strong_supporting') return { cls: 'P4', why: 'fingerprint or candidate-experience only' };
  if (r.crm_evidence_strength === 'mention_only') return { cls: 'P4', why: 'named in language that proves nothing' };
  if (r.job_research_attempted === 'not_attempted') return { cls: 'R4', why: 'no job source was reachable for this account' };
  if ((r.current_jobs_found ?? 0) > 0) return { cls: 'P1', why: 'vacancies read and none named a CRM' };
  return { cls: 'R1', why: 'no careers surface reached' };
};
const counts: Record<string, { n: number; ex: string[]; why: string }> = {};
for (const r of rows) {
  const { cls, why } = classify(r);
  (counts[cls] ??= { n: 0, ex: [], why });
  counts[cls].n++;
  if (counts[cls].ex.length < 3) counts[cls].ex.push(r.domain);
}
const CONSEQ: Record<string, string> = {
  D3: 'a surfaced company cannot be researched at all',
  R1: 'a company looks like it has no partner motion when it may have one',
  R3: 'no evidence either way; the account is uninformative',
  R4: 'CRM can never be established from hiring evidence for this account',
  E1: 'a partner page was read and produced nothing — silent, indistinguishable from a page that says nothing',
  C1: 'a dossier asserts a workflow the page does not support',
  P1: 'vacancies were read and no CRM named; nothing left to retrieve',
  P4: 'a CRM is suggested but not establishable; a seller must verify',
  NONE: '—',
};
const failRows = Object.entries(counts).sort((a, b) => b[1].n - a[1].n)
  .map(([k, v]) => [k, v.n, pct(v.n), CONSEQ[k] ?? '', v.ex.join(' '), FIX[k.slice(0, 2)] ?? '-']);
csv('failure-analysis.csv', ['failure_class', 'companies_affected', 'pct_of_corpus', 'commercial_consequence', 'examples', 'fixability'], failRows);
console.log('\nPART 12 — FAILURE TAXONOMY');
for (const f of failRows) console.log(`  ${String(f[0]).padEnd(5)} ${String(f[1]).padStart(4)}  ${String(f[2]).padStart(5)}%  ${f[5]}`);

/* ── PART 13: unknown audit, four classes ─────────────────────────────────── */
const unkRows: any[][] = [];
const unknownAudit = (field: string, key: string, isUnknown: (r: any) => boolean,
  good: (r: any) => boolean, blocked: (r: any) => boolean, untested: (r: any) => boolean) => {
  const u = rows.filter(isUnknown);
  const b = u.filter(blocked), rest = u.filter((r) => !blocked(r));
  const t = rest.filter(untested), rem = rest.filter((r) => !untested(r));
  const g = rem.filter(good), bad = rem.filter((r) => !good(r));
  unkRows.push([field, u.length, g.length, bad.length, t.length, b.length,
    pct(g.length, u.length), pct(bad.length, u.length), pct(t.length, u.length), pct(b.length, u.length)]);
};
unknownAudit('CRM', 'crm', (r) => !/^confirmed_/.test(r.crm_evidence_strength),
  (r) => (r.current_jobs_found ?? 0) >= 3, (r) => r.crm_state === 'blocked', (r) => r.job_research_attempted === 'not_attempted');
unknownAudit('Partner motion', 'motion', (r) => r.partner_motion_state !== 'established',
  (r) => (r.pages_inspected ?? 0) >= 5, () => false, (r) => (r.pages_inspected ?? 0) === 0);
unknownAudit('Deal registration', 'dr', (r) => r.deal_registration_state !== 'confirmed',
  (r) => r.partner_portal_state === 'confirmed', () => false, (r) => r.partner_motion_state !== 'established');
unknownAudit('Partner people', 'people', (r) => r.partner_people_state === 'not_attempted' || r.partner_people_observed === 0,
  () => false, () => false, (r) => r.linkedin_research_attempted === 'not_attempted');
csv('unknown-audit.csv', ['field', 'total_unknown', 'good', 'bad', 'untested', 'blocked', 'good_pct', 'bad_pct', 'untested_pct', 'blocked_pct'], unkRows);
console.log('\nPART 13 — UNKNOWN AUDIT');
console.log('field              unknown  good  bad  untested  blocked');
for (const u of unkRows) console.log(`${String(u[0]).padEnd(18)} ${String(u[1]).padStart(7)} ${String(u[2]).padStart(5)} ${String(u[3]).padStart(4)} ${String(u[4]).padStart(9)} ${String(u[5]).padStart(8)}`);
/**
 * The aggregate excludes partner_people. That field was measured on a deliberately bounded
 * n=8 sample, so its 143 untested rows are a property of THIS audit's scope, not of the
 * Radar. Including them would let a sampling decision drive the headline.
 */
const agg = unkRows.filter((u) => u[0] !== 'Partner people');
const tg = agg.reduce((n, u) => n + u[2], 0), tb = agg.reduce((n, u) => n + u[3], 0);
const tt = agg.reduce((n, u) => n + u[4], 0), tbl = agg.reduce((n, u) => n + u[5], 0);
const tot = tg + tb + tt + tbl;
console.log(`  TOTAL (CRM + motion + deal reg; partner_people excluded — bounded sample)`);
console.log(`    good ${pct(tg, tot)}%  bad ${pct(tb, tot)}%  untested ${pct(tt, tot)}%  blocked ${pct(tbl, tot)}%`);
console.log(`    "ours to fix" (bad + untested) = ${pct(tb + tt, tot)}%   n=${tot}`);

/** Comparable subset: the 77 accounts the 25 Aug audit measured, same three fields. */
const sub = rows.filter((r) => r.discovery_mechanism === 'manual_seed' || r.discovery_mechanism === 'search_query_family');
const subUnk = (isU: (r: any) => boolean, good: (r: any) => boolean, blk: (r: any) => boolean, unt: (r: any) => boolean) => {
  const u = sub.filter(isU); const b = u.filter(blk); const rest = u.filter((r) => !blk(r));
  const t = rest.filter(unt); const rem = rest.filter((r) => !unt(r));
  return { g: rem.filter(good).length, b: rem.filter((r) => !good(r)).length, t: t.length, bl: b.length };
};
const s1 = subUnk((r) => !/^confirmed_/.test(r.crm_evidence_strength), (r) => (r.current_jobs_found ?? 0) >= 3, (r) => r.crm_state === 'blocked', (r) => r.job_research_attempted === 'not_attempted');
const s2 = subUnk((r) => r.partner_motion_state !== 'established', (r) => (r.pages_inspected ?? 0) >= 5, () => false, (r) => (r.pages_inspected ?? 0) === 0);
const s3 = subUnk((r) => r.deal_registration_state !== 'confirmed', (r) => r.partner_portal_state === 'confirmed', () => false, (r) => r.partner_motion_state !== 'established');
const sg = s1.g + s2.g + s3.g, sb = s1.b + s2.b + s3.b, st = s1.t + s2.t + s3.t, sbl = s1.bl + s2.bl + s3.bl;
const stot = sg + sb + st + sbl;
console.log(`\n  COMPARABLE SUBSET (the ${sub.length} accounts the 25 Aug audit covered)`);
console.log(`    good ${pct(sg, stot)}%  bad ${pct(sb, stot)}%  untested ${pct(st, stot)}%  blocked ${pct(sbl, stot)}%`);
console.log(`    "ours to fix" = ${pct(sb + st, stot)}%   (25 Aug reported 74.2%, Phase 5 corrected to 66.2%)`);

/* ── PART 21: account completeness ────────────────────────────────────────── */
const state = (v: string, known: string[]) => known.includes(v) ? 'ESTABLISHED' : v === 'not_attempted' ? 'NOT_ATTEMPTED' : v === 'blocked' ? 'BLOCKED' : 'UNKNOWN';
csv('account-completeness.csv',
  ['domain', 'mechanism', 'partner_motion', 'ownership', 'commercial_workflows', 'crm', 'partner_people', 'prm', 'programme_scale', 'currentness', 'readiness'],
  rows.map((r) => {
    const wf = ['referral_state', 'lead_sharing_state', 'co_sell_state', 'deal_registration_state', 'partner_pipeline_state', 'partner_onboarding_state', 'partner_enablement_state', 'partner_portal_state']
      .filter((k) => r[k] === 'confirmed').length;
    return [r.domain, r.discovery_mechanism,
      state(r.partner_motion_state, ['established']),
      state(r.programme_ownership, ['direct', 'owned']),
      wf >= 2 ? 'ESTABLISHED' : wf === 1 ? 'PARTIAL' : 'UNKNOWN',
      r.crm_conflict ? 'CONFLICTING' : /^confirmed_/.test(r.crm_evidence_strength) ? 'ESTABLISHED' : r.crm_state === 'blocked' ? 'BLOCKED' : r.crm_evidence_strength === 'strong_supporting' ? 'PARTIAL' : 'UNKNOWN',
      r.partner_people_state === 'not_attempted' ? 'NOT_ATTEMPTED' : r.partner_people_observed >= 2 ? 'ESTABLISHED' : r.partner_people_observed === 1 ? 'PARTIAL' : 'UNKNOWN',
      state(r.prm_state, ['confirmed']),
      r.programme_scale_state === 'claimed' ? 'ESTABLISHED' : r.programme_scale_state === 'not_attempted' ? 'NOT_ATTEMPTED' : 'UNKNOWN',
      r.crm_latest_strong_evidence_date ? 'PARTIAL' : 'UNKNOWN',
      r.commercial_review_readiness];
  }));
console.log('\nwrote field-coverage.csv, segment-coverage.csv, failure-analysis.csv, unknown-audit.csv, account-completeness.csv');
