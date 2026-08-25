/**
 * Part 3 — the account-level reliability dataset, rebuilt.
 *
 * The previous dataset was written before Phase 5 and covers 77 accounts. Phase 5 researched
 * 45 proxy positives and 30 counterparty-surfaced vendors that had no account record, and
 * added two fields (informal signature, programme scale) the schema had no column for.
 *
 * THREE STATES ARE KEPT STRICTLY DISTINCT and this is the single most important property:
 *   unknown       we asked and could not establish it
 *   not_attempted no detector ran for this account, or none exists
 *   blocked       a relevant source exists and access prevented inspection
 */
import { readFileSync, writeFileSync } from 'node:fs';

const J = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
/**
 * The PRIOR dataset is read from a frozen copy of commit d773b61, not from the live file.
 * This script writes audit/out/introw-radar-reliability-audit.json, so reading that path made
 * the second run consume its own output and silently drop discovery_source — reclassifying 42
 * search-discovered accounts as manual seeds.
 */
const prior: any[] = J('audit/phase6/prior-audit-d773b61.json');
const doss: any[] = J('product/out/dossiers.json');
const batch: any[] = J('discovery/batch/out-research.json');
const existingCrm: any[] = J('crm-research/out/existing.json');
const bfeat: any[] = J('phase5/out/B-features.json');
const bres: any[] = J('phase5/out/B-resolved.json');
const amot: any[] = J('phase5/out/A-motion.json');
const ameas = J('phase5/out/A-measurement.json');
const dcorp: any[] = J('phase5/out/D-corpus.json');
const cval: any[] = J('phase5/out/C-validation.json');
const f1: any[] = J('phase5/out/F1-untested16.json');
const people = J('audit/out/people-linkedin.json');

const dIdx = new Map(doss.map((d) => [d.domain, d]));
const bIdx = new Map(batch.map((b) => [b.domain, b]));
const exIdx = new Map(existingCrm.map((r) => [r.domain, r]));
const pIdx = new Map(prior.map((r) => [r.domain, r]));
const bfIdx = new Map(bfeat.filter((r) => !r.error).map((r) => [r.domain, r]));
const amIdx = new Map(amot.filter((r) => !r.error).map((r) => [r.domain, r]));
const dcIdx = new Map(dcorp.map((r) => [r.domain, r]));
const cvIdx = new Map(cval.map((r) => [r.domain, r]));
const f1Idx = new Map(f1.map((r) => [r.domain, r]));
const peopleIdx = new Map(people.accounts.map((a: any) => [a.domain, a]));
const bresIdx = new Map<string, any>();
for (const r of bres) if (r.resolvedDomain && !bresIdx.has(r.resolvedDomain)) bresIdx.set(r.resolvedDomain, r);
/** Which counterparty named this vendor, for discovery provenance. */
const invIdx = new Map<string, any>();
for (const v of ameas.resellerVendors ?? []) if (v.domain) invIdx.set(v.domain, v);

const SURFACES: [string, string][] = [
  ['referral_state', 'referral_submission'], ['lead_sharing_state', 'lead_submission'],
  ['co_sell_state', 'co_selling'], ['deal_registration_state', 'deal_registration'],
  ['partner_pipeline_state', 'partner_pipeline'], ['partner_onboarding_state', 'onboarding'],
  ['partner_enablement_state', 'enablement'], ['partner_tiers_state', 'programme_tiers'],
  ['partner_portal_state', 'portal'],
];

const domains = new Set<string>([
  ...prior.map((r) => r.domain), ...bfIdx.keys(), ...amIdx.keys(),
]);

const rows = [...domains].sort().map((domain) => {
  const p = pIdx.get(domain), d = dIdx.get(domain), b = bIdx.get(domain);
  const bf = bfIdx.get(domain), am = amIdx.get(domain), ex = exIdx.get(domain);
  const dc = dcIdx.get(domain), cv = cvIdx.get(domain), f = f1Idx.get(domain);
  const pe = peopleIdx.get(domain) as any, br = bresIdx.get(domain), inv = invIdx.get(domain);

  /* discovery mechanism and provenance */
  const mechanism = br ? 'prm_customer_harvest'
    : inv ? 'counterparty_inversion'
    : p?.discovery_source === 'search_pattern' ? 'search_query_family'
    : 'manual_seed';
  const provenance = br ? `named as a customer by ${br.prmVendor} (${br.prmSegment} PRM)`
    : inv ? `named as a vendor by ${(inv.publishedBy ?? []).join(', ')}`
    : p?.discovery_query_family ? `query family ${p.discovery_query_family}`
    : 'supplied by hand in an earlier phase';

  /* surfaces: dossier states are authoritative; batch rows carry states too */
  const surfaceState = (kind: string): string => {
    if (d) return (d.surfaces ?? []).find((x: any) => x.surface === kind)?.state ?? 'not_attempted';
    if (b?.surfaceStates) return b.surfaceStates.find((x: any) => x.surface === kind)?.state ?? 'not_attempted';
    if (am?.surfaceStates) return am.surfaceStates.find((x: any) => x.surface === kind)?.state ?? 'not_attempted';
    if (bf) return (bf.artefacts ?? []).length || (bf.types ?? []).length ? 'not_observed' : 'not_attempted';
    return 'not_attempted';
  };

  const programmes: string[] = d ? (d.programmes ?? []).map((x: any) => x.kind)
    : (b?.programmes ?? bf?.programmes ?? am?.programmes ?? []);
  const motionEstablished = programmes.length > 0 || SURFACES.some(([, k]) => surfaceState(k) === 'confirmed');

  const crmTop = ex?.vendors?.[0] ?? (b?.crm?.vendor ? b.crm : null) ?? (bf?.crm ?? null);
  const crmLevel = ex?.vendors?.[0]?.level ?? b?.crm?.level ?? p?.crm_evidence_level ?? 'unknown';
  const obs: any[] = ex?.observationDetail ?? b?.crm?.observationDetail ?? [];
  const cov = ex?.coverage ?? b?.crmCoverage ?? null;

  /* the three states, kept apart */
  const crmBlocked = f?.finalVerdict?.startsWith('BLOCKED') === true;
  const jobsAttempted = !!cov;
  const scaleClaims = dc?.claims ?? [];

  const informal = bf?.informal ?? cv?.verdict ?? 'not_attempted';

  return {
    company: d?.companyName ?? br?.customerName ?? null,
    domain,
    country: p?.country ?? 'unknown',
    region: p?.region ?? (br ? 'unknown' : 'unknown'),
    sector: p?.sector ?? 'unknown',
    language: p?.discovery_language ?? 'not_attempted',

    discovery_mechanism: mechanism,
    discovery_provenance: provenance,
    entity_resolution_state: br && br.resolutionBasis === 'first_party_name_match' ? 'confirmed_by_first_party_name_match'
      : inv && !inv.domain ? 'name_only_unresolved' : 'confirmed',

    partner_motion_state: motionEstablished ? 'established' : (d || b || bf || am) ? 'unknown' : 'not_attempted',
    programme_ownership: (d ?? b ?? am)?.constructs?.find((c: any) => c.construct === 'operational_ownership')?.state ?? bf?.ownership ?? 'unknown',
    programme_types: programmes.join('|'),
    commercial_partner_motion: (d ?? b ?? am)?.constructs?.find((c: any) => c.construct === 'commercial_materiality')?.state ?? bf?.materiality ?? 'unknown',
    ...Object.fromEntries(SURFACES.map(([f2, k]) => [f2, surfaceState(k)])),
    partner_incentives_state: 'not_attempted',
    partner_attribution_state: 'not_attempted',
    partner_directory_state: d ? (d.partnerDirectory?.isDirectory ? 'confirmed' : 'not_observed')
      : b ? (b.directoryIsDirectory ? 'confirmed' : 'not_observed')
      : am ? (am.directoryIsDirectory ? 'confirmed' : 'not_observed') : 'not_attempted',

    programme_scale_state: dc ? (scaleClaims.length ? 'claimed' : 'not_observed') : 'not_attempted',
    programme_scale_claimed: scaleClaims.length ? scaleClaims[0].claimed : null,
    programme_scale_noun: scaleClaims.length ? scaleClaims[0].noun : null,
    directory_entries_observed: d?.partnerDirectory?.lowerBound ?? null,

    informal_programme_signature: informal,

    crm_state: /^confirmed_/.test(crmLevel) ? 'established' : crmBlocked ? 'blocked' : crmLevel,
    crm_vendor: ex?.vendors?.[0]?.vendor ?? b?.crm?.vendor ?? p?.crm_vendor ?? null,
    crm_evidence_strength: crmLevel,
    current_crm_evidence: crmLevel === 'confirmed_current' ? 'yes' : jobsAttempted ? 'no' : 'not_attempted',
    historical_crm_evidence: obs.some((o) => o.sourceType === 'company_cached_vacancy' || o.sourceType === 'recruiting_mirror') ? 'yes' : jobsAttempted ? 'no' : 'not_attempted',
    crm_conflict: ex?.conflict?.kind ?? b?.crm?.conflict ?? '',
    crm_latest_strong_evidence_date: ex?.vendors?.[0]?.publishedAt ?? b?.crm?.publishedAt ?? null,
    crm_evidence_source: ex?.vendors?.[0]?.sourceType ?? b?.crm?.sourceType ?? null,

    job_research_attempted: jobsAttempted ? 'yes' : 'not_attempted',
    current_jobs_found: cov ? (cov.vacanciesRead ?? 0) - (cov.historicalVacanciesRead ?? 0) : 0,
    historical_jobs_found: cov?.historicalVacanciesRead ?? 0,
    jobs_inspected: ex?.budget?.jobsInspected ?? cov?.vacanciesRead ?? 0,
    non_partner_jobs_inspected: cov?.nonPartnerTitlesRead ?? 0,
    crm_job_mentions: obs.filter((o) => o.sourceType !== 'website_fingerprint').length,
    crm_job_confirmations: obs.filter((o) => (o.basis === 'company_possession' || o.basis === 'operational_duty') && o.sourceType !== 'website_fingerprint').length,

    linkedin_research_attempted: pe ? 'yes' : 'not_attempted',
    linkedin_accessible: pe ? (pe.blocked ? 'blocked' : 'accessible_via_index') : 'not_attempted',
    linkedin_unique_evidence: pe ? (pe.count > 0 ? 'people_only' : 'none') : 'not_attempted',

    partner_people_state: pe ? (pe.count >= 2 ? 'two_or_more' : pe.count === 1 ? 'one_found' : 'roles_only') : 'not_attempted',
    partner_people_observed: pe?.count ?? 0,
    partner_roles: pe ? (pe.namedPeople ?? []).join(' | ') : '',

    prm_state: d?.systems?.prm?.state ?? b?.prmState ?? am?.prmState ?? 'not_attempted',
    prm_vendor: d?.systems?.prm?.vendor ?? b?.prmVendor ?? null,

    temporal_evidence: 'not_attempted',

    sources_inspected: (ex?.budget?.sourcesInspected ?? 0) + (d?.sourceHealth?.length ?? b?.pagesFetched ?? 0),
    queries_executed: cov?.searchQueriesRun ?? 0,
    pages_inspected: d ? (d.sourceHealth ?? []).filter((h: any) => h.health === 'success').length : (b?.pagesOk ?? am?.pagesOk ?? 0),

    evidence_sufficiency: p?.evidence_sufficiency
      ?? (bf ? (bf.fit === 'under_observed' ? 'under_observed' : (bf.claims ?? 0) > 0 ? 'sufficient_for_review' : 'partial')
        : am ? (am.motion ? 'partial' : 'under_observed') : 'unknown'),
    commercial_review_readiness: null as string | null,

    failure_stage: p?.failure_stage ?? null,
    failure_reason: p?.failure_reason ?? null,
    missing_critical_fields: '',
  };
});

/** Readiness and missing fields, computed after every row exists. */
for (const r of rows as any[]) {
  const missing: string[] = [];
  if (r.partner_motion_state !== 'established') missing.push('partner_motion');
  if (!/^confirmed_/.test(r.crm_evidence_strength)) missing.push('crm');
  if (r.deal_registration_state !== 'confirmed') missing.push('deal_registration');
  if (r.partner_people_state === 'not_attempted') missing.push('partner_people');
  if (r.programme_scale_state !== 'claimed') missing.push('programme_scale');
  r.missing_critical_fields = missing.join('|');
  r.commercial_review_readiness =
    r.partner_motion_state === 'established' && (r.programme_ownership === 'direct' || r.programme_ownership === 'owned')
      ? 'SUFFICIENT_FOR_COMMERCIAL_REVIEW'
      : 'INSUFFICIENT_FOR_COMMERCIAL_REVIEW';
}

writeFileSync('audit/out/introw-radar-reliability-audit.json', JSON.stringify(rows, null, 2));
const cols = Object.keys(rows[0]);
const esc = (v: any) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
writeFileSync('audit/out/introw-radar-reliability-audit.csv',
  [cols.join(','), ...rows.map((r: any) => cols.map((c) => esc(r[c])).join(','))].join('\n') + '\n');
console.log(`rows ${rows.length}, fields ${cols.length}`);
const m: Record<string, number> = {};
for (const r of rows as any[]) m[r.discovery_mechanism] = (m[r.discovery_mechanism] ?? 0) + 1;
console.log('by mechanism:', JSON.stringify(m));
console.log('sufficient for review:', rows.filter((r: any) => r.commercial_review_readiness.startsWith('SUFF')).length);
