/**
 * Per-company CRM forensic research (mandate §6, §24, §26).
 *
 * Runs every public source class this project can reach without authentication, in the order
 * that spends the least for the most: ATS boards first (highest trust, cheapest to attribute),
 * then the company's own careers pages (the 78% of companies with no attributable board),
 * then website fingerprints (supporting only).
 *
 * §24's loop discipline: stop when a decisive current conclusion is established from a
 * trusted source, or when the budget is spent. Do not keep crawling a company that has
 * already told us what it runs.
 */
import { discoverTenants, fetchVacancies, canonicalise } from '../jobs/ats.js';
import { findCareersVacancies, jobFamily, type JobFamily } from './jobsources.js';
import { observeText, observeFingerprint } from './observe.js';
import { assembleForensics, isDecisive, type CrmForensicResult, type CrmObservation, type CrmSourceType } from './forensics.js';

export interface ResearchOptions {
  /** Total HTTP requests this account may spend. Reported, never hidden (§25). */
  requestBudget?: number;
  /** Website fingerprints already established by the main pipeline. */
  fingerprints?: { vendor: string; quote: string; sourceUrl: string }[];
  /** Extra observations from operator-run search forensics (§10). */
  searchObservations?: CrmObservation[];
  now?: string;
}

export interface CrmResearchResult extends CrmForensicResult {
  /** §42 invariant evidence: which job families actually produced CRM observations. */
  familiesObserved: Record<string, number>;
  /** Observations that came from a NON-partnership job title. */
  fromNonPartnerRoles: number;
  /** Observations whose source was dated more than the current window ago. */
  fromHistorical: number;
}

const PARTNER_FAMILIES = new Set<JobFamily>(['partnerships']);

export async function researchCrm(bareDomain: string, opts: ResearchOptions = {}): Promise<CrmResearchResult> {
  const now = opts.now ?? new Date().toISOString();
  const domain = bareDomain.replace(/^www\./, '').toLowerCase();
  const budget = opts.requestBudget ?? 45;
  const observations: CrmObservation[] = [];
  const families: Record<string, number> = {};
  const sourcesConsulted = new Set<CrmSourceType>();
  let requests = 0;
  let jobsInspected = 0;
  let vacanciesRead = 0;
  let historicalRead = 0;
  let nonPartnerTitlesRead = 0;
  let atsBoardFound = false;
  let careersPagesFound = 0;
  let careersDocsFound = 0;

  const note = (o: CrmObservation, title: string | null) => {
    observations.push(o);
    sourcesConsulted.add(o.sourceType);
    const fam = jobFamily(title);
    families[fam] = (families[fam] ?? 0) + 1;
  };

  /* ── 1. ATS boards ─────────────────────────────────────────────────────── */
  try {
    const { tenants } = await discoverTenants(domain, Math.min(6, budget));
    requests += 6;
    const owned = tenants.filter((t) => t.ownership === 'owned');
    atsBoardFound = owned.length > 0;
    for (const t of owned) {
      if (requests >= budget) break;
      const res = await fetchVacancies(t, domain);
      requests += 1 + res.vacancies.length;
      const { kept } = canonicalise(res.vacancies);
      for (const v of kept) {
        jobsInspected++;
        if (!v.description) continue;
        vacanciesRead++;
        // §15: historical vacancies are READ, not discarded. Their currentness decides the
        // level they can earn, which is the whole point of the temporal model.
        const isHistorical = v.currentness === 'historical' || v.currentness === 'recent_historical';
        if (isHistorical) historicalRead++;
        const fam = jobFamily(v.jobTitle);
        if (!PARTNER_FAMILIES.has(fam)) nonPartnerTitlesRead++;
        const sourceType: CrmSourceType = isHistorical ? 'company_cached_vacancy' : 'company_ats_vacancy';
        for (const o of observeText({
          company: domain, text: v.description, sourceUrl: v.jobUrl, sourceType,
          sourcePublishedAt: v.publishedAt, jobTitle: v.jobTitle, observedAt: now,
        })) note(o, v.jobTitle);
      }
    }
  } catch { /* a board failing must never fail the account */ }

  /* ── 2. the company's own careers pages (§43) ──────────────────────────── */
  // Runs whether or not a board was found: an ATS is one route to vacancies, not the only one.
  if (requests < budget) {
    try {
      const res = await findCareersVacancies(domain, { maxRequests: Math.max(10, budget - requests), maxPages: 14 });
      requests += res.requests;
      careersPagesFound = res.careersPagesFound;
      careersDocsFound = res.documents.length;
      for (const d of res.documents) {
        jobsInspected++;
        vacanciesRead++;
        const fam = jobFamily(d.title);
        if (!PARTNER_FAMILIES.has(fam)) nonPartnerTitlesRead++;
        /**
         * A careers LISTING is not a vacancy, and its <title> is not a job title. Recording
         * "All job roles | Careers" as a jobTitle made a listing page look like a role and
         * would misreport which job families produced evidence.
         */
        // A listing, a feed, or any page carrying several job links is an index, not an advert.
        const isListing = d.origin === 'careers_listing' || /\/feed\b/i.test(d.url) || d.isIndex === true;
        const title = isListing ? null : d.title;
        for (const o of observeText({
          company: domain, text: d.text, sourceUrl: d.url,
          sourceType: isListing ? 'company_careers_index' : 'company_current_vacancy',
          sourcePublishedAt: d.publishedAt, jobTitle: title, observedAt: now,
        })) note(o, title);
      }
    } catch { /* careers crawl failing must never fail the account */ }
  }

  /* ── 3. website fingerprints — supporting only (§20) ───────────────────── */
  for (const f of opts.fingerprints ?? []) {
    note(observeFingerprint({ company: domain, vendor: f.vendor, quote: f.quote, sourceUrl: f.sourceUrl, observedAt: now }), null);
  }

  /* ── 4. search / indexed evidence supplied by the caller (§10) ─────────── */
  for (const o of opts.searchObservations ?? []) note(o, o.jobTitle);

  for (const o of observations) {
    if (o.sourcePublishedAt && Date.parse(o.sourcePublishedAt) < Date.parse(now) - 270 * 86_400_000) historicalRead = Math.max(historicalRead, 1);
  }

  const result = assembleForensics(domain, observations, {
    atsBoardFound,
    vacanciesRead,
    historicalVacanciesRead: historicalRead,
    nonPartnerTitlesRead,
    searchQueriesRun: (opts.searchObservations ?? []).length > 0 ? 1 : 0,
    linkedinBlocked: false,
    careersPagesFound,
    careersDocsFound,
    sourcesConsulted: [...sourcesConsulted],
  }, { queries: 0, sourcesInspected: requests, jobsInspected }, now);

  const fromNonPartnerRoles = observations.filter((o) => !PARTNER_FAMILIES.has(jobFamily(o.jobTitle)) && o.jobTitle !== null).length;
  const fromHistorical = observations.filter((o) => o.sourceType === 'company_cached_vacancy' || o.sourceType === 'recruiting_mirror').length;

  return { ...result, familiesObserved: families, fromNonPartnerRoles, fromHistorical };
}

/** §24 stop condition, exported so callers can decide whether more search is worth it. */
export function isResolved(r: CrmForensicResult): boolean {
  return r.vendors.some((v) => v.level === 'confirmed_current') || r.conflict !== null;
}

export { isDecisive };
