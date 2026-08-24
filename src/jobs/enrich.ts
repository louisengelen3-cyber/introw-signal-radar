/**
 * Job enrichment orchestrator.
 *
 * BOUNDED BY DESIGN. This runs only for a company that has already been researched — it is
 * an enrichment layer, never a discovery mechanism. It issues at most a handful of requests
 * per company and stops.
 *
 * WHAT IT MAY CHANGE: the CRM panel, and a new job-derived evidence section.
 * WHAT IT MAY NOT CHANGE: the three constructs, evidence coverage, and the machine
 *   interpretation. A company that publishes more vacancies must not become a better
 *   prospect, and hiring must never be read as buying intent.
 */

import { canonicalise, discoverTenants, fetchVacancies } from './ats.js';
import { scanVacancy } from './crm.js';
import { scanVacancyOperational } from './operational.js';
import { CRM_LEVEL_RANK, EMPTY_ENRICHMENT, type CrmEvidenceLevel, type JobCrmHit, type JobEnrichment, type Vacancy } from './types.js';

export interface VendorVerdict {
  vendor: string;
  level: CrmEvidenceLevel;
  /** Distinct vacancies supporting this vendor at supporting-or-better. */
  supportingVacancies: number;
  currentVacancies: number;
  hits: JobCrmHit[];
}

/**
 * Aggregate per-vacancy verdicts into a per-vendor one.
 *
 * `strong` is the only level that cannot come from a single advert: it means several
 * independent current vacancies each describe the company operating the same system. One
 * advert saying "experience preferred" stays supporting however many times it is syndicated,
 * which is why canonicalisation runs first.
 */
export function aggregateVendor(vendor: string, hits: JobCrmHit[]): VendorVerdict {
  const byVacancy = new Map<string, JobCrmHit>();
  for (const h of hits) {
    const prior = byVacancy.get(h.vacancyId);
    if (!prior || CRM_LEVEL_RANK[h.level] > CRM_LEVEL_RANK[prior.level]) byVacancy.set(h.vacancyId, h);
  }
  const distinct = [...byVacancy.values()];
  const confirmed = distinct.filter((h) => h.level === 'crm_confirmed');
  const supportingOrBetter = distinct.filter((h) => h.level !== 'crm_mention_only');
  const current = supportingOrBetter.filter((h) => h.currentness === 'current');

  let level: CrmEvidenceLevel = 'crm_unknown';
  if (confirmed.length >= 1) level = 'crm_confirmed';
  else if (current.length >= 2) level = 'crm_strong_evidence';
  else if (supportingOrBetter.length >= 1) level = 'crm_supporting_evidence';
  else if (distinct.length >= 1) level = 'crm_mention_only';

  return {
    vendor, level,
    supportingVacancies: supportingOrBetter.length,
    currentVacancies: current.length,
    hits: distinct.sort((a, b) => CRM_LEVEL_RANK[b.level] - CRM_LEVEL_RANK[a.level]),
  };
}

export interface CrmJobSummary {
  verdicts: VendorVerdict[];
  /** Set when two or more vendors independently reach strong-or-better. */
  conflict: 'multiple_systems_observed' | null;
}

export function summariseCrm(hits: JobCrmHit[]): CrmJobSummary {
  const byVendor = new Map<string, JobCrmHit[]>();
  for (const h of hits) {
    const list = byVendor.get(h.vendor) ?? [];
    list.push(h);
    byVendor.set(h.vendor, list);
  }
  const verdicts = [...byVendor.entries()]
    .map(([v, hs]) => aggregateVendor(v, hs))
    .sort((a, b) => CRM_LEVEL_RANK[b.level] - CRM_LEVEL_RANK[a.level] || b.supportingVacancies - a.supportingVacancies);

  // A company may legitimately run two systems. We surface the disagreement rather than
  // choosing, and route it to human review.
  const strong = verdicts.filter((v) => v.level === 'crm_confirmed' || v.level === 'crm_strong_evidence');
  return { verdicts, conflict: strong.length >= 2 ? 'multiple_systems_observed' : null };
}

export interface EnrichOptions {
  /** Requests spent looking for a careers surface. Kept small; this is enrichment. */
  discoveryBudget?: number;
}

export async function enrichWithJobs(bareDomain: string, opts: EnrichOptions = {}): Promise<JobEnrichment> {
  const domain = bareDomain.replace(/^www\./, '');
  const out = EMPTY_ENRICHMENT(domain);

  const { tenants, health } = await discoverTenants(domain, opts.discoveryBudget ?? 6);
  out.health.push(...health);
  out.tenants = tenants;

  if (tenants.length === 0) {
    out.note = 'No ATS board could be attributed to this company from its own careers pages. '
      + 'That is a limit of what we could find, not evidence that the company is not hiring — and it says nothing about its CRM.';
    return out;
  }

  const all: Vacancy[] = [];
  for (const t of tenants) {
    if (t.ownership !== 'owned') { out.vacanciesQuarantined++; continue; }
    const res = await fetchVacancies(t, domain);
    out.health.push(...res.health);
    all.push(...res.vacancies);
  }
  out.vacanciesFound = all.length;

  const { kept, collapsed } = canonicalise(all);
  out.duplicatesCollapsed = collapsed;

  // Historical vacancies are read but never used as evidence of a CURRENT system.
  const usable = kept.filter((v) => v.currentness !== 'historical');
  out.vacanciesUsed = usable.length;

  for (const v of usable) {
    out.crmHits.push(...scanVacancy(v).hits);
    out.operationalHits.push(...scanVacancyOperational(v));
  }

  // Companies post the same responsibilities across regional variants of one role. Three
  // adverts carrying an identical bullet are one observation; counting them separately would
  // reward posting volume, which this layer must never do.
  const seenQuote = new Set<string>();
  const perFact = new Map<string, number>();
  const MAX_PER_FACT = 2;
  out.operationalHits = out.operationalHits.filter((h) => {
    const key = `${h.fact}|${h.quote.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 120)}`;
    if (seenQuote.has(key)) return false;
    seenQuote.add(key);
    // A fact is a company-level statement. The eighteenth advert mentioning revenue operations
    // adds nothing a seller can act on, and storing it only rewards posting volume.
    const n = perFact.get(h.fact) ?? 0;
    if (n >= MAX_PER_FACT) return false;
    perFact.set(h.fact, n + 1);
    return true;
  });

  const crm = summariseCrm(out.crmHits);
  const top = crm.verdicts[0];
  out.note = out.vacanciesUsed === 0
    ? `A board was found but no current vacancies were readable, so nothing could be established from hiring.`
    : top && top.level !== 'crm_unknown' && top.level !== 'crm_mention_only'
      ? `${out.vacanciesUsed} current ${out.vacanciesUsed === 1 ? 'vacancy' : 'vacancies'} read; ${top.vendor} evidence at ${top.level.replace('crm_', '').replace(/_/g, ' ')}.`
      : `${out.vacanciesUsed} current ${out.vacanciesUsed === 1 ? 'vacancy' : 'vacancies'} read; no defensible CRM evidence found. This is not evidence that the company has no CRM.`;

  return out;
}
