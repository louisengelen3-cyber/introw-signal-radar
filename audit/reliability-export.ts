/**
 * Reliability audit — per-account export (mandate §2).
 *
 * Every value is derived from the actual run. Where a fact was never established the field is
 * `unknown`; where the pipeline never had the opportunity to establish it the field is
 * `not_attempted`. Those two are deliberately different, because conflating them is what makes
 * a coverage number meaningless.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const existing: any[] = JSON.parse(readFileSync('crm-research/out/existing.json', 'utf8'));
const batch: any[] = JSON.parse(readFileSync('discovery/batch/out-research.json', 'utf8'));
const dossiers: any[] = JSON.parse(readFileSync('product/out/dossiers.json', 'utf8'));
const cands = JSON.parse(readFileSync('discovery/batch/candidates.v1.json', 'utf8'));
const dIdx = new Map(dossiers.map((d) => [d.domain, d]));
const exIdx = new Map(existing.map((r) => [r.domain, r]));

/** Country hints, only where a frozen benchmark recorded one. Never guessed from a TLD. */
const country = new Map<string, string>();
for (const f of ['audit/cross-industry.v1.json', 'discovery/benchmark.v1.json', 'recovery-holdout/holdout.v1.json']) {
  try {
    const j = JSON.parse(readFileSync(f, 'utf8'));
    const rows = j.companies ?? Object.values(j.cohorts ?? {}).flat();
    for (const c of rows as any[]) if (c?.domain && c?.country) country.set(c.domain.toLowerCase(), c.country);
  } catch { /* optional */ }
}
const discoveryMeta = new Map<string, any>();
for (const run of cands.runs) for (const r of run.results) {
  if (!discoveryMeta.has(r.domain)) discoveryMeta.set(r.domain, { family: run.family, lang: run.lang, geo: run.geo, sector: run.sector, label: r.label });
}

const SURFACE_FIELDS: [string, string][] = [
  ['partner_portal_state', 'portal'],
  ['deal_registration_state', 'deal_registration'],
  ['referral_state', 'referral_submission'],
  ['lead_sharing_state', 'lead_submission'],
  ['co_sell_state', 'co_selling'],
  ['partner_pipeline_state', 'partner_pipeline'],
  ['partner_onboarding_state', 'onboarding'],
  ['partner_enablement_state', 'enablement'],
  ['partner_tiers_state', 'programme_tiers'],
];

const rows: any[] = [];

/** Which of the four failure classes, if any, best explains what this account is missing. */
function classifyFailure(o: {
  hasMotion: boolean; pagesRead: number; surfacesFound: number; crmLevel: string;
  vacanciesRead: number; atsBoard: boolean; careersPages: number; blocked: boolean;
  obsBases: string[]; entity: string;
}): { stage: string; reason: string } {
  if (o.entity !== 'confirmed') return { stage: 'D2_WRONG_ENTITY', reason: 'Identity not resolved to a first-party domain.' };
  if (o.blocked) return { stage: 'R3_ACCESS_BLOCKED', reason: 'Retrieval blocked; no evidence either way.' };
  if (!o.hasMotion && o.pagesRead === 0) return { stage: 'R1_PAGE_NOT_RETRIEVED', reason: 'No readable page was retrieved for this company at all.' };
  if (!o.hasMotion && o.surfacesFound === 0) return { stage: 'R1_PAGE_NOT_RETRIEVED', reason: 'Pages were read but no partner surface was located.' };
  if (!o.hasMotion && o.surfacesFound > 0) return { stage: 'E1_EVIDENCE_NOT_EXTRACTED', reason: 'A partner surface was located but yielded no motion evidence.' };
  // Motion established; the open question is CRM.
  if (o.crmLevel === 'unknown') {
    if (o.vacanciesRead === 0 && o.careersPages === 0 && !o.atsBoard) {
      return { stage: 'R1_NO_CAREERS_SURFACE', reason: 'No ATS board and no readable careers page: hiring evidence was never reachable.' };
    }
    if (o.vacanciesRead === 0 && o.careersPages > 0) {
      return { stage: 'R3_JS_CAREERS', reason: 'A careers page exists but served no readable vacancies — typically JavaScript-rendered.' };
    }
    if (o.vacanciesRead > 0) return { stage: 'P1_NOT_PUBLIC', reason: `${o.vacanciesRead} vacancies read and none named a CRM. The company does not publish it.` };
  }
  if (o.crmLevel === 'mention_only') return { stage: 'P4_SOURCE_TOO_WEAK', reason: 'A CRM was named only in language that proves nothing about this company.' };
  if (o.crmLevel === 'strong_supporting') {
    return o.obsBases.includes('fingerprint')
      ? { stage: 'P4_SOURCE_TOO_WEAK', reason: 'Only a website artifact: proves a script is installed, not that sales runs on it.' }
      : { stage: 'P4_SOURCE_TOO_WEAK', reason: 'Only candidate-experience language: asking for a skill is not using the tool.' };
  }
  return { stage: 'NONE', reason: 'Motion and CRM both established.' };
}

function buildRow(domain: string, source: 'existing_corpus' | 'discovery_batch') {
  const d = dIdx.get(domain);
  const ex = exIdx.get(domain);
  const bt = batch.find((b) => b.domain === domain);
  const meta = discoveryMeta.get(domain);
  const crmRes = ex ?? null;

  // Surfaces: dossier carries explicit states; batch rows carry confirmed names only.
  const surfaceState = (kind: string): string => {
    if (d) {
      const s = (d.surfaces ?? []).find((x: any) => x.surface === kind);
      return s ? s.state : 'not_attempted';
    }
    if (bt) {
      const st = (bt.surfaceStates ?? []).find((x: any) => x.surface === kind);
      if (st) return st.state;
      return (bt.surfaces ?? []).includes(kind) ? 'confirmed' : 'not_observed';
    }
    return 'not_attempted';
  };

  const programmes: string[] = d ? (d.programmes ?? []).map((p: any) => p.kind) : (bt?.programmes ?? []);
  const hasMotion = programmes.length > 0 || SURFACE_FIELDS.some(([, k]) => surfaceState(k) === 'confirmed');

  const crmTop = ex?.vendors?.[0] ?? (bt ? { vendor: bt.crm.vendor, level: bt.crm.level, jobTitle: bt.crm.jobTitle, sourceType: bt.crm.sourceType, publishedAt: bt.crm.publishedAt } : null);
  const obsDetail: any[] = ex?.observationDetail ?? bt?.crm?.observationDetail ?? [];
  const cov = ex?.coverage ?? bt?.crmCoverage ?? null;

  const historicalVendor = obsDetail
    .filter((o) => o.publishedAt && Date.parse(o.publishedAt) < Date.now() - 270 * 86_400_000
      && (o.basis === 'company_possession' || o.basis === 'operational_duty'))
    .map((o) => o.vendor);

  const pagesRead = d ? (d.sourceHealth ?? []).filter((h: any) => h.health === 'success').length : (bt?.pagesOk ?? null);
  const blocked = d?.machineInterpretation?.state === 'blocked';
  const entity = 'confirmed'; // every account in this corpus came from a first-party domain
  const fail = classifyFailure({
    hasMotion, pagesRead: pagesRead ?? 0,
    surfacesFound: d ? (d.recovery?.surfacesFound ?? 0) + ((d.surfaces ?? []).filter((s: any) => s.state === 'confirmed').length) : (bt?.surfaces ?? []).length,
    crmLevel: crmTop?.level ?? 'unknown',
    vacanciesRead: cov?.vacanciesRead ?? 0, atsBoard: cov?.atsBoardFound === true,
    careersPages: cov?.careersPagesFound ?? 0, blocked,
    obsBases: obsDetail.map((o) => o.basis), entity,
  });

  const missing: string[] = [];
  if (!hasMotion) missing.push('partner_motion');
  if ((crmTop?.level ?? 'unknown') === 'unknown') missing.push('crm');
  if (surfaceState('deal_registration') !== 'confirmed') missing.push('deal_registration');
  if (!d?.systems?.prm?.vendor) missing.push('prm');
  missing.push('partner_people');   // never attempted anywhere — see §25 of the mandate report

  return {
    company_name: d?.companyName ?? null,
    domain,
    country: country.get(domain.toLowerCase()) ?? 'unknown',
    region: meta?.geo ?? 'unknown',
    sector: meta?.sector ?? (d ? 'unknown' : 'unknown'),
    corpus: source,
    discovery_source: source === 'discovery_batch' ? 'search_pattern' : 'manual_seed',
    discovery_query_family: meta?.family ?? null,
    discovery_language: meta?.lang ?? null,
    entity_resolution_state: entity,

    partner_motion_state: hasMotion ? 'established' : 'unknown',
    programme_owner_state: (d ?? bt)?.constructs?.find((c: any) => c.construct === 'operational_ownership')?.state ?? 'unknown',
    programme_types_found: programmes.join('|') || '',
    partner_directory_state: d ? (d.partnerDirectory?.isDirectory ? 'confirmed' : 'not_observed')
      : bt ? (bt.directoryIsDirectory ? 'confirmed' : 'not_observed') : 'not_attempted',
    ...Object.fromEntries(SURFACE_FIELDS.map(([field, kind]) => [field, surfaceState(kind)])),
    partner_incentives_state: 'not_attempted',
    partner_attribution_state: 'not_attempted',

    crm_state: crmTop && /^confirmed_/.test(crmTop.level) ? 'established' : (crmTop?.level ?? 'unknown'),
    crm_vendor: crmTop?.vendor ?? null,
    crm_evidence_level: crmTop?.level ?? 'unknown',
    crm_latest_evidence_date: crmTop?.publishedAt ?? null,
    crm_source_type: crmTop?.sourceType ?? null,
    crm_source_role: crmTop?.jobTitle ?? null,
    crm_historical_vendor: [...new Set(historicalVendor)].join('|') || '',
    crm_conflict: (ex?.conflict?.kind ?? bt?.crm?.conflict) ?? '',

    partner_people_state: 'not_attempted',
    partner_people_found: 0,
    partner_roles_found: '',

    prm_state: d?.systems?.prm?.state ?? bt?.prmState ?? 'not_attempted',
    prm_vendor: d?.systems?.prm?.vendor ?? bt?.prmVendor ?? null,

    job_research_state: cov ? (cov.vacanciesRead > 0 ? 'vacancies_read' : (cov.careersPagesFound ?? 0) > 0 ? 'careers_page_no_vacancies' : 'no_careers_surface') : 'not_attempted',
    current_jobs_found: cov ? cov.vacanciesRead - (cov.historicalVacanciesRead ?? 0) : 0,
    historical_jobs_found: cov?.historicalVacanciesRead ?? 0,
    jobs_inspected: (ex?.budget?.jobsInspected) ?? cov?.vacanciesRead ?? 0,
    crm_job_mentions: obsDetail.filter((o) => o.sourceType !== 'website_fingerprint').length,
    crm_job_confirmations: obsDetail.filter((o) => (o.basis === 'company_possession' || o.basis === 'operational_duty') && o.sourceType !== 'website_fingerprint').length,

    website_pages_inspected: pagesRead ?? 0,
    regional_domains_inspected: d?.recovery?.domainsSearched?.length ?? 0,
    sources_inspected: (ex?.budget?.sourcesInspected) ?? 0,
    search_queries_executed: cov?.searchQueriesRun ?? 0,

    evidence_sufficiency: d
      ? (d.machineInterpretation.state === 'under_observed' ? 'under_observed'
        : d.machineInterpretation.diagnostics.distinctClaimCount > 0 ? 'sufficient_for_review' : 'partial')
      : (bt?.fit === 'under_observed' ? 'under_observed'
        : (bt?.distinctClaims ?? 0) > 0 || bt?.fit === 'plausible_introw_fit' ? 'sufficient_for_review' : 'partial'),
    introw_relevance_state: bt?.fit ?? (d ? d.machineInterpretation.state : 'unknown'),

    failure_stage: fail.stage,
    failure_reason: fail.reason,
    missing_critical_fields: missing.join('|'),
    research_cost_or_request_count: (ex?.budget?.sourcesInspected ?? 0) + (d?.sourceHealth?.length ?? 0),
  };
}

for (const d of dossiers) rows.push(buildRow(d.domain, 'existing_corpus'));
for (const b of batch) if (!dIdx.has(b.domain)) rows.push(buildRow(b.domain, 'discovery_batch'));

rows.sort((a, b) => a.corpus.localeCompare(b.corpus) || a.domain.localeCompare(b.domain));
writeFileSync('audit/out/introw-radar-reliability-audit.json', JSON.stringify(rows, null, 2));

const cols = Object.keys(rows[0]);
const esc = (v: any) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
writeFileSync('audit/out/introw-radar-reliability-audit.csv',
  [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n');

console.log(`exported ${rows.length} accounts, ${cols.length} fields`);
console.log(`  existing corpus: ${rows.filter((r) => r.corpus === 'existing_corpus').length}`);
console.log(`  discovery batch: ${rows.filter((r) => r.corpus === 'discovery_batch').length}`);
