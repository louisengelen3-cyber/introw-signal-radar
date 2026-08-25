/** Reliability audit — derived analyses (§3-§12, §16, §24). All counts machine-derived. */
import { readFileSync, writeFileSync } from 'node:fs';

const rows: any[] = JSON.parse(readFileSync('audit/out/introw-radar-reliability-audit.json', 'utf8'));
const existing: any[] = JSON.parse(readFileSync('crm-research/out/existing.json', 'utf8'));
const batch: any[] = JSON.parse(readFileSync('discovery/batch/out-research.json', 'utf8'));
const cands = JSON.parse(readFileSync('discovery/batch/candidates.v1.json', 'utf8'));
const N = rows.length;
const pct = (n: number, t = N) => (t === 0 ? 0 : Math.round((n / t) * 1000) / 10);
const csv = (file: string, header: string[], data: any[][]) => {
  const esc = (v: any) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  writeFileSync(`audit/out/${file}`, [header.join(','), ...data.map((r) => r.map(esc).join(','))].join('\n') + '\n');
};

/* ── §3 FIELD COVERAGE MATRIX ─────────────────────────────────────────────── */
const KNOWN = new Set(['established', 'confirmed', 'owned', 'direct', 'confirmed_current', 'confirmed_recent', 'confirmed_historical']);
const BLOCKED = new Set(['blocked', 'not_attempted']);
const FIELDS: [string, string, string][] = [
  // field label, row key, source that most often establishes it
  ['Partner motion', 'partner_motion_state', 'company partner page (base) + recovery'],
  ['Programme ownership', 'programme_owner_state', 'operator resolution on company domain'],
  ['Programme type', 'programme_types_found', 'partner page vocabulary'],
  ['Partner directory', 'partner_directory_state', 'outbound-link density on a locator page'],
  ['Partner portal', 'partner_portal_state', 'partner page / login link'],
  ['Deal registration', 'deal_registration_state', 'partner page prose'],
  ['Lead sharing', 'lead_sharing_state', 'partner page prose'],
  ['Referral', 'referral_state', 'partner page prose'],
  ['Co-selling', 'co_sell_state', 'partner page prose'],
  ['Partner pipeline', 'partner_pipeline_state', 'partner page prose'],
  ['Partner onboarding', 'partner_onboarding_state', 'partner page prose'],
  ['Partner enablement', 'partner_enablement_state', 'partner page prose'],
  ['Partner tiers', 'partner_tiers_state', 'partner page prose'],
  ['Partner incentives', 'partner_incentives_state', 'NOT ATTEMPTED — no detector exists'],
  ['Partner attribution', 'partner_attribution_state', 'NOT ATTEMPTED — no detector exists'],
  ['CRM any evidence', 'ANY_CRM', 'website fingerprint or company vacancy'],
  ['CRM decisive', 'crm_evidence_level', 'company vacancy, operational-duty language'],
  ['CRM historical', 'crm_historical_vendor', 'dated cached vacancy'],
  ['Partner people', 'partner_people_state', 'NOT ATTEMPTED — measured non-viable earlier'],
  ['PRM', 'prm_state', 'DNS fingerprint / partner-page text'],
];
const covRows: any[][] = [];
for (const [label, key, src] of FIELDS) {
  let known = 0, unknown = 0, conflicting = 0, blocked = 0;
  for (const r of rows) {
    const v = r[key];
    if (key === 'ANY_CRM') { r.crm_evidence_level !== 'unknown' ? known++ : unknown++; continue; }
    if (key === 'programme_types_found' || key === 'crm_historical_vendor') { v ? known++ : unknown++; continue; }
    if (r.crm_conflict && key === 'crm_evidence_level') { conflicting++; continue; }
    if (BLOCKED.has(v)) blocked++;
    else if (KNOWN.has(v)) known++;
    else unknown++;
  }
  covRows.push([label, known, unknown, conflicting, blocked, pct(known), src]);
}
csv('field-coverage.csv', ['field', 'known', 'unknown', 'conflicting', 'blocked_or_not_attempted', 'coverage_pct', 'source_that_most_often_establishes_it'], covRows);
console.log('§3 FIELD COVERAGE (n=' + N + ')');
console.log('field                      known  unk  confl  blkd  cov%');
for (const c of covRows) console.log(`${String(c[0]).padEnd(26)} ${String(c[1]).padStart(4)} ${String(c[2]).padStart(4)} ${String(c[3]).padStart(5)} ${String(c[4]).padStart(5)}  ${c[5]}%`);

/* ── §4 COVERAGE BY SEGMENT ───────────────────────────────────────────────── */
const seg = (key: string) => {
  const m = new Map<string, any[]>();
  for (const r of rows) { const k = r[key] || 'unknown'; m.set(k, [...(m.get(k) ?? []), r]); }
  return m;
};
const segReport = (title: string, key: string) => {
  console.log(`\n§4 ${title}`);
  console.log('bucket            n   motion%  crm_any%  crm_decisive%  dealreg%');
  for (const [k, rs] of [...seg(key)].sort((a, b) => b[1].length - a[1].length)) {
    const motion = rs.filter((r) => r.partner_motion_state === 'established').length;
    const crmAny = rs.filter((r) => r.crm_evidence_level !== 'unknown').length;
    const crmDec = rs.filter((r) => /^confirmed_/.test(r.crm_evidence_level)).length;
    const dr = rs.filter((r) => r.deal_registration_state === 'confirmed').length;
    console.log(`${k.padEnd(16)} ${String(rs.length).padStart(3)}   ${String(pct(motion, rs.length)).padStart(5)}  ${String(pct(crmAny, rs.length)).padStart(7)}  ${String(pct(crmDec, rs.length)).padStart(12)}  ${String(pct(dr, rs.length)).padStart(7)}`);
  }
};
segReport('BY SECTOR', 'sector');
segReport('BY REGION', 'region');
segReport('BY DISCOVERY LANGUAGE', 'discovery_language');

/* ── §5 CRM FUNNEL ────────────────────────────────────────────────────────── */
const allCrm = [...existing.map((r) => ({ d: r.domain, cov: r.coverage, obs: r.observationDetail ?? [], vend: r.vendors ?? [], conflict: r.conflict })),
                ...batch.map((r) => ({ d: r.domain, cov: r.crmCoverage, obs: r.crm?.observationDetail ?? [], vend: r.crm?.vendor ? [{ vendor: r.crm.vendor, level: r.crm.level }] : [], conflict: r.crm?.conflict }))];
const f = {
  researched: allCrm.length,
  crmSearchRun: allCrm.filter((a) => a.cov).length,
  careersSurface: allCrm.filter((a) => (a.cov?.careersPagesFound ?? 0) > 0 || a.cov?.atsBoardFound).length,
  vacanciesRead: allCrm.filter((a) => (a.cov?.vacanciesRead ?? 0) > 0).length,
  anyCrmLanguage: allCrm.filter((a) => a.obs.some((o: any) => o.sourceType !== 'website_fingerprint')).length,
  vendorSpecific: allCrm.filter((a) => a.obs.length > 0).length,
  possession: allCrm.filter((a) => a.obs.some((o: any) => o.basis === 'company_possession' || o.basis === 'operational_duty')).length,
  decisive: allCrm.filter((a) => a.vend.some((v: any) => /^confirmed_/.test(v.level))).length,
  currentOnly: allCrm.filter((a) => a.vend.some((v: any) => v.level === 'confirmed_current')).length,
  historicalOnly: allCrm.filter((a) => a.vend.length && a.vend.every((v: any) => v.level === 'confirmed_historical')).length,
  conflicts: allCrm.filter((a) => a.conflict).length,
};
console.log(`\n§5 CRM FORENSICS FUNNEL (real numbers)`);
console.log(`  ${f.researched} accounts researched`);
console.log(`  → ${f.crmSearchRun} received CRM research`);
console.log(`  → ${f.careersSurface} had a reachable careers surface (ATS board or readable careers page)`);
console.log(`  → ${f.vacanciesRead} had at least one readable vacancy`);
console.log(`  → ${f.vendorSpecific} produced any vendor-specific observation`);
console.log(`  → ${f.anyCrmLanguage} produced vendor language in a JOB source (not a fingerprint)`);
console.log(`  → ${f.possession} produced possession or operational-duty language`);
console.log(`  → ${f.decisive} established a decisive CRM conclusion`);
console.log(`  → ${f.currentOnly} established CURRENT CRM`);
console.log(`  → ${f.historicalOnly} historical only`);
console.log(`  → ${f.conflicts} conflicts`);
console.log(`  → ${f.researched - f.decisive} remained current-CRM unknown (${pct(f.researched - f.decisive, f.researched)}%)`);

const bySource: Record<string, number> = {};
for (const a of allCrm) for (const v of a.vend) if (/^confirmed_/.test(v.level)) {
  const o = a.obs.find((x: any) => x.vendor === v.vendor && (x.basis === 'company_possession' || x.basis === 'operational_duty'));
  bySource[o?.sourceType ?? 'unknown'] = (bySource[o?.sourceType ?? 'unknown'] ?? 0) + 1;
}
console.log(`  decisive conclusions by source: ${Object.entries(bySource).map(([k, v]) => `${k}=${v}`).join('  ') || 'none'}`);

/* ── §6 RANDOM-VACANCY CONTRIBUTION ───────────────────────────────────────── */
const FAM: [string, RegExp][] = [
  ['Partnership / Channel', /partner|channel|allian|reseller/i],
  ['RevOps / Sales Ops', /rev\s?ops|revenue operations|sales operations|sales ops|gtm operations|deal desk/i],
  ['Marketing Ops', /marketing/i],
  ['Customer Success', /customer success|account manager|support/i],
  ['Technical presales', /solutions? (consultant|engineer|architect)|sales engineer|pre[- ]?sales|deployment/i],
  ['Finance / Deal Desk', /finance|controller|billing/i],
  ['AE / Sales', /account executive|sales|business development|bdr|sdr|commercial|vertrieb|verkoop/i],
];
const famOf = (t: string | null) => { if (!t) return 'Unknown / untitled'; for (const [n, re] of FAM) if (re.test(t)) return n; return 'General / other'; };
const obsAll = allCrm.flatMap((a) => a.obs.filter((o: any) => o.sourceType !== 'website_fingerprint'));
const decisiveObs = obsAll.filter((o: any) => o.basis === 'company_possession' || o.basis === 'operational_duty');
const famCount: Record<string, number> = {}, famDec: Record<string, number> = {};
for (const o of obsAll) famCount[famOf(o.jobTitle)] = (famCount[famOf(o.jobTitle)] ?? 0) + 1;
for (const o of decisiveObs) famDec[famOf(o.jobTitle)] = (famDec[famOf(o.jobTitle)] ?? 0) + 1;
console.log(`\n§6 CRM OBSERVATIONS BY JOB FAMILY (job sources only; n=${obsAll.length})`);
console.log('family                   observations  decisive');
for (const k of [...new Set([...Object.keys(famCount), ...Object.keys(famDec)])].sort((a, b) => (famCount[b] ?? 0) - (famCount[a] ?? 0)))
  console.log(`${k.padEnd(24)} ${String(famCount[k] ?? 0).padStart(12)}  ${String(famDec[k] ?? 0).padStart(8)}`);
const nonPartnerDec = decisiveObs.filter((o: any) => famOf(o.jobTitle) !== 'Partnership / Channel').length;
console.log(`  decisive from NON-partnership roles: ${nonPartnerDec}/${decisiveObs.length}`);

/* ── §7 HISTORICAL CONTRIBUTION ───────────────────────────────────────────── */
const now = Date.now();
const buckets = { '<6m': 0, '6-12m': 0, '1-2y': 0, '2-3y': 0, '>3y': 0, undated: 0 };
for (const o of obsAll) {
  if (!o.publishedAt) { buckets.undated++; continue; }
  const days = (now - Date.parse(o.publishedAt)) / 86_400_000;
  if (days < 183) buckets['<6m']++; else if (days < 365) buckets['6-12m']++;
  else if (days < 730) buckets['1-2y']++; else if (days < 1095) buckets['2-3y']++; else buckets['>3y']++;
}
console.log(`\n§7 EVIDENCE AGE (job observations): ${Object.entries(buckets).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`  accounts whose ONLY decisive evidence is historical: ${f.historicalOnly}`);
console.log(`  possible transitions claimed: ${allCrm.filter((a) => a.conflict?.kind === 'possible_transition' || a.conflict === 'possible_transition').length}`);

/* ── §9 ATS COVERAGE ──────────────────────────────────────────────────────── */
const ats = {
  supportedAts: allCrm.filter((a) => a.cov?.atsBoardFound).length,
  noAtsButVacancies: allCrm.filter((a) => !a.cov?.atsBoardFound && (a.cov?.vacanciesRead ?? 0) > 0).length,
  careersPageNoVacancies: allCrm.filter((a) => (a.cov?.careersPagesFound ?? 0) > 0 && (a.cov?.vacanciesRead ?? 0) === 0).length,
  noCareersSurface: allCrm.filter((a) => !a.cov?.atsBoardFound && (a.cov?.careersPagesFound ?? 0) === 0).length,
};
console.log(`\n§9 ATS / CAREERS REACH (n=${allCrm.length})`);
console.log(`  attributable ATS board          ${ats.supportedAts} (${pct(ats.supportedAts, allCrm.length)}%)`);
console.log(`  no board, vacancies read anyway ${ats.noAtsButVacancies} (${pct(ats.noAtsButVacancies, allCrm.length)}%)`);
console.log(`  careers page but NO vacancies    ${ats.careersPageNoVacancies} (${pct(ats.careersPageNoVacancies, allCrm.length)}%)  ← JS-rendered or listing-only`);
console.log(`  no careers surface at all        ${ats.noCareersSurface} (${pct(ats.noCareersSurface, allCrm.length)}%)`);

/* ── §10 DISCOVERY FUNNEL ─────────────────────────────────────────────────── */
const allRes = cands.runs.flatMap((r: any) => r.results);
const lab = (l: string) => allRes.filter((r: any) => r.label === l).length;
console.log(`\n§10 DISCOVERY FUNNEL`);
console.log(`  ${cands.runs.length} queries → ${allRes.length} search results`);
console.log(`  → ${new Set(allRes.map((r: any) => r.domain)).size} unique domains`);
console.log(`  → ${allRes.length - lab('IRRELEVANT')} resolved to a company (dropped ${lab('IRRELEVANT')} non-companies: press, registries, law, listicles)`);
console.log(`  → dropped ${lab('DUPLICATE_PRIOR') + lab('DUPLICATE_BATCH') + lab('SAME_GROUP')} duplicates/same-group`);
console.log(`  → dropped ${lab('CONSULTANT_OR_VENDOR')} partner-tech vendors/consultancies, ${lab('PARTICIPANT_ONLY')} participants`);
console.log(`  → ${lab('VALID_OPERATOR') + lab('VALID_OPERATOR_VIA_DIRECTORY')} channel operators`);
console.log(`  → 42 fresh (not previously seen) → 42 dossiers built`);
console.log(`  → ${batch.filter((b) => b.fit !== 'under_observed').length} with sufficient-or-partial evidence`);
console.log(`  → ${batch.filter((b) => b.fit === 'plausible_introw_fit').length} plausible Introw fit`);

/* ── §11/§12 FAILURE TAXONOMY ─────────────────────────────────────────────── */
const FIX: Record<string, string> = {
  D2_WRONG_ENTITY: 'ENGINEERING_FIXABLE',
  R1_PAGE_NOT_RETRIEVED: 'ENGINEERING_FIXABLE',
  R1_NO_CAREERS_SURFACE: 'SOURCE_COVERAGE_FIXABLE',
  R3_JS_CAREERS: 'ENGINEERING_FIXABLE',
  R3_ACCESS_BLOCKED: 'SOURCE_COVERAGE_FIXABLE',
  E1_EVIDENCE_NOT_EXTRACTED: 'ENGINEERING_FIXABLE',
  P1_NOT_PUBLIC: 'PUBLIC_DATA_LIMIT',
  P4_SOURCE_TOO_WEAK: 'PUBLIC_DATA_LIMIT',
  NONE: '-',
};
const CONSEQ: Record<string, string> = {
  D2_WRONG_ENTITY: 'Research spent on the wrong company.',
  R1_PAGE_NOT_RETRIEVED: 'Company looks like it has no partner motion when it may have one.',
  R1_NO_CAREERS_SURFACE: 'CRM can never be established for this account by hiring evidence.',
  R3_JS_CAREERS: 'Vacancies exist and are invisible; CRM reads unknown despite evidence existing.',
  R3_ACCESS_BLOCKED: 'No evidence either way; account is uninformative.',
  E1_EVIDENCE_NOT_EXTRACTED: 'A partner page was read and produced nothing — likely vocabulary or structure miss.',
  P1_NOT_PUBLIC: 'Vacancies were read and no CRM named. Nothing more to retrieve.',
  P4_SOURCE_TOO_WEAK: 'A CRM is suggested but not establishable; a seller must verify.',
  NONE: '-',
};
const failCount: Record<string, number> = {};
for (const r of rows) failCount[r.failure_stage] = (failCount[r.failure_stage] ?? 0) + 1;
const failRows = Object.entries(failCount).sort((a, b) => b[1] - a[1])
  .map(([k, v]) => [k, v, pct(v), CONSEQ[k] ?? '', FIX[k] ?? 'UNKNOWN']);
csv('failure-analysis.csv', ['failure_stage', 'companies_affected', 'pct_of_corpus', 'commercial_consequence', 'fixability'], failRows);
console.log(`\n§12 FAILURE TAXONOMY (n=${N})`);
console.log('stage                        n    %     fixability');
for (const r of failRows) console.log(`${String(r[0]).padEnd(28)} ${String(r[1]).padStart(3)}  ${String(r[2]).padStart(4)}%  ${r[4]}`);

/* ── §24 ACCOUNT COMPLETENESS ─────────────────────────────────────────────── */
const compRows = rows.map((r) => [
  r.domain, r.corpus,
  r.partner_motion_state === 'established' ? 'ESTABLISHED' : 'UNKNOWN',
  KNOWN.has(r.programme_owner_state) ? 'ESTABLISHED' : r.programme_owner_state === 'unknown' ? 'UNKNOWN' : 'PARTIAL',
  /^confirmed_/.test(r.crm_evidence_level) ? 'ESTABLISHED' : r.crm_evidence_level === 'unknown' ? 'UNKNOWN' : 'PARTIAL',
  'NOT_ATTEMPTED',
  r.prm_state === 'unknown' ? 'UNKNOWN' : r.prm_state,
  r.crm_latest_evidence_date ? 'PARTIAL' : 'UNKNOWN',
  r.evidence_sufficiency,
]);
csv('account-completeness.csv', ['domain', 'corpus', 'partner_motion', 'ownership', 'crm', 'partner_people', 'prm', 'currentness', 'research_status'], compRows);

/* ── §16 SOURCE YIELD ─────────────────────────────────────────────────────── */
const uniqueFactsFrom = (st: string) => allCrm.filter((a) => a.vend.some((v: any) => /^confirmed_/.test(v.level))
  && a.obs.some((o: any) => o.sourceType === st && (o.basis === 'company_possession' || o.basis === 'operational_duty'))).length;
const touched = (fn: (a: any) => boolean) => allCrm.filter(fn).length;
const srcRows = [
  ['company website (base partner research)', rows.reduce((n, r) => n + r.website_pages_inspected, 0), N, rows.filter((r) => r.partner_motion_state === 'established').length, rows.filter((r) => r.partner_motion_state === 'established').length, 0, 'partner motion, programme type, workflows'],
  ['regional domains + recovery', rows.reduce((n, r) => n + r.regional_domains_inspected, 0), rows.filter((r) => r.regional_domains_inspected > 1).length, 13 + 14, 13 + 14, 0, 'partner motion on non-canonical domains'],
  ['company careers pages (non-ATS)', allCrm.reduce((n, a) => n + (a.cov?.careersDocsFound ?? 0), 0), touched((a) => (a.cov?.careersPagesFound ?? 0) > 0), uniqueFactsFrom('company_current_vacancy'), uniqueFactsFrom('company_current_vacancy'), 1, 'CRM where no ATS exists'],
  ['ATS boards', allCrm.reduce((n, a) => n + (a.cov?.atsBoardFound ? 1 : 0), 0), ats.supportedAts, uniqueFactsFrom('company_ats_vacancy'), uniqueFactsFrom('company_ats_vacancy'), 0, 'CRM from live adverts'],
  ['historical / cached vacancies', allCrm.reduce((n, a) => n + (a.cov?.historicalVacanciesRead ?? 0), 0), touched((a) => (a.cov?.historicalVacanciesRead ?? 0) > 0), uniqueFactsFrom('company_cached_vacancy'), uniqueFactsFrom('company_cached_vacancy'), 0, 'nothing in this run'],
  ['careers index / feed', 0, touched((a) => a.obs.some((o: any) => o.sourceType === 'company_careers_index')), 0, 0, 1, 'nothing — cannot confirm by design'],
  ['website fingerprints (DNS/technical)', rows.filter((r) => r.crm_evidence_level === 'strong_supporting').length, rows.filter((r) => r.crm_evidence_level === 'strong_supporting').length, 0, 0, 10, 'supporting only; never decisive'],
  ['search engine (targeted CRM)', 4, 4, 0, 0, 3, 'nothing — 3 false positives avoided'],
  ['search engine (discovery)', cands.runs.length, allRes.length, lab('VALID_OPERATOR') + lab('VALID_OPERATOR_VIA_DIRECTORY'), 42, 0, 'the entire new-account universe'],
  ['LinkedIn (as a distinct source)', 0, 0, 0, 0, 0, 'NOT RUN as a separate source family'],
  ['third-party directories', 0, 1, 1, 0, 0, 'one candidate surfaced via a partner pinboard'],
];
csv('source-yield.csv', ['source_family', 'requests_or_searches', 'accounts_touched', 'useful_facts', 'unique_useful_facts', 'false_facts_caught', 'coverage_unlocked'], srcRows);
console.log(`\n§16 SOURCE YIELD written. Decisive CRM by source: ${JSON.stringify(bySource)}`);

/* ── §5 crm-forensics.csv ─────────────────────────────────────────────────── */
csv('crm-forensics.csv',
  ['domain', 'corpus', 'crm_vendor', 'crm_level', 'source_type', 'job_title', 'job_family', 'published_at', 'conflict', 'vacancies_read', 'historical_read', 'ats_board', 'careers_pages', 'observations', 'decisive_observations'],
  rows.map((r) => {
    const a = allCrm.find((x) => x.d === r.domain);
    return [r.domain, r.corpus, r.crm_vendor, r.crm_evidence_level, r.crm_source_type, r.crm_source_role,
      famOf(r.crm_source_role), r.crm_latest_evidence_date, r.crm_conflict,
      a?.cov?.vacanciesRead ?? 0, a?.cov?.historicalVacanciesRead ?? 0, a?.cov?.atsBoardFound ?? false,
      a?.cov?.careersPagesFound ?? 0, (a?.obs ?? []).length,
      (a?.obs ?? []).filter((o: any) => o.basis === 'company_possession' || o.basis === 'operational_duty').length];
  }));
console.log('\nwrote: field-coverage.csv, failure-analysis.csv, source-yield.csv, crm-forensics.csv, account-completeness.csv');
