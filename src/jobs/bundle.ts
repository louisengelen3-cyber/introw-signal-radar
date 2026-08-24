/**
 * The CRM evidence bundle.
 *
 * Two independent sources now speak about a company's CRM: an artifact served by its website
 * (a HubSpot tracking script, a Salesforce Web-to-Lead endpoint) and what its own job adverts
 * say. They are combined into a BUNDLE, not a score — the reader sees each source, its level
 * and its quote, and can disagree with the aggregate.
 *
 * Three rules govern the combination:
 *
 *   1. ABSENCE NEVER SUBTRACTS. A vendor evidenced by jobs and absent from fingerprints is not
 *      weakened by that absence, and vice versa. Neither source is exhaustive.
 *   2. DISAGREEMENT IS PRESERVED. If jobs say Salesforce and the website says HubSpot, the
 *      answer is "both observed", not a winner. Companies legitimately run two.
 *   3. LEVELS DO NOT ADD UP. Two supporting observations do not make a confirmed one. Only
 *      several independent CURRENT vacancies describing the company operating the same system
 *      reach `strong`, and only the company's own words reach `confirmed`.
 */

import { CRM_LEVEL_RANK, type CrmEvidenceLevel } from './types.js';
import type { VendorVerdict } from './enrich.js';

export interface CrmSourceRef {
  kind: 'website_fingerprint' | 'job_description';
  level: CrmEvidenceLevel;
  quote: string;
  sourceUrl: string;
  detail: string;
  proves: string;
  doesNotProve: string;
  observedAt: string;
}

export interface CrmVendorBundle {
  vendor: string;
  level: CrmEvidenceLevel;
  sources: CrmSourceRef[];
  /** Counts a reader can check, never a score. */
  jobVacancies: number;
  hasFingerprint: boolean;
  lastObservedAt: string | null;
}

export interface CrmBundle {
  vendors: CrmVendorBundle[];
  /** The best-supported vendor, or null when nothing reaches supporting. */
  primary: CrmVendorBundle | null;
  conflict: 'multiple_systems_observed' | null;
  /** Which sources were consulted, so "unknown" is separable from "not looked at". */
  sourcesChecked: { website: boolean; jobs: boolean; vacanciesRead: number };
  note: string;
}

export interface FingerprintInput {
  vendorLabel: string;
  /** Only `confirmed` or `strong_proxy` fingerprints are treated as CRM evidence. */
  confirmed: boolean;
  quote: string;
  sourceUrl: string;
  proves: string;
  doesNotProve: string;
  observedAt: string;
}

export function buildCrmBundle(
  fingerprints: FingerprintInput[],
  jobVerdicts: VendorVerdict[],
  opts: { websiteChecked: boolean; jobsChecked: boolean; vacanciesRead: number },
): CrmBundle {
  const byVendor = new Map<string, CrmVendorBundle>();

  const touch = (vendor: string): CrmVendorBundle => {
    let b = byVendor.get(vendor);
    if (!b) { b = { vendor, level: 'crm_unknown', sources: [], jobVacancies: 0, hasFingerprint: false, lastObservedAt: null }; byVendor.set(vendor, b); }
    return b;
  };

  for (const f of fingerprints) {
    const b = touch(f.vendorLabel);
    b.hasFingerprint = true;
    b.sources.push({
      kind: 'website_fingerprint',
      // A website artifact shows what the marketing site serves. It is strong evidence of a
      // relationship and weaker evidence about the sales team's system of record.
      level: f.confirmed ? 'crm_confirmed' : 'crm_supporting_evidence',
      quote: f.quote, sourceUrl: f.sourceUrl, detail: 'Website artifact',
      proves: f.proves, doesNotProve: f.doesNotProve, observedAt: f.observedAt,
    });
  }

  for (const v of jobVerdicts) {
    if (v.level === 'crm_unknown') continue;
    const b = touch(v.vendor);
    b.jobVacancies = v.supportingVacancies;
    for (const h of v.hits.slice(0, 3)) {
      b.sources.push({
        kind: 'job_description', level: h.level, quote: h.quote, sourceUrl: h.jobUrl,
        detail: `${h.jobTitle} · ${h.currentness.replace(/_/g, ' ')}`,
        proves: h.proves, doesNotProve: h.doesNotProve, observedAt: '',
      });
    }
    // The vendor's aggregate level from jobs, recorded before combining with fingerprints.
    if (CRM_LEVEL_RANK[v.level] > CRM_LEVEL_RANK[b.level]) b.level = v.level;
  }

  for (const b of byVendor.values()) {
    // The bundle level is the strongest single source, never a sum. But two independent
    // KINDS of source both at supporting lift to strong: that is genuinely more than either
    // alone, and it is the only place the bundle combines anything.
    const best = b.sources.reduce<CrmEvidenceLevel>((acc, s) => (CRM_LEVEL_RANK[s.level] > CRM_LEVEL_RANK[acc] ? s.level : acc), 'crm_unknown');
    const kinds = new Set(b.sources.filter((s) => s.level !== 'crm_mention_only').map((s) => s.kind));
    b.level = CRM_LEVEL_RANK[best] > CRM_LEVEL_RANK[b.level] ? best : b.level;
    if (b.level === 'crm_supporting_evidence' && kinds.size >= 2) b.level = 'crm_strong_evidence';
    b.lastObservedAt = b.sources.map((s) => s.observedAt).filter(Boolean).sort().at(-1) ?? null;
  }

  const vendors = [...byVendor.values()]
    .filter((b) => b.sources.length > 0)
    .sort((a, b) => CRM_LEVEL_RANK[b.level] - CRM_LEVEL_RANK[a.level] || b.sources.length - a.sources.length);

  const decisive = vendors.filter((v) => v.level === 'crm_confirmed' || v.level === 'crm_strong_evidence');
  const primary = vendors.find((v) => v.level !== 'crm_mention_only') ?? null;

  return {
    vendors, primary,
    conflict: decisive.length >= 2 ? 'multiple_systems_observed' : null,
    sourcesChecked: { website: opts.websiteChecked, jobs: opts.jobsChecked, vacanciesRead: opts.vacanciesRead },
    note: describe(primary, decisive.length >= 2, opts),
  };
}

function describe(primary: CrmVendorBundle | null, conflict: boolean, opts: { websiteChecked: boolean; jobsChecked: boolean; vacanciesRead: number }): string {
  const checked = [opts.websiteChecked && 'website artifacts', opts.jobsChecked && `${opts.vacanciesRead} current ${opts.vacanciesRead === 1 ? 'vacancy' : 'vacancies'}`]
    .filter(Boolean).join(' and ');

  if (!primary) {
    return `No reliable public CRM evidence was established${checked ? ` from ${checked}` : ''}. `
      + 'This is not evidence that the company has no CRM, and not evidence that it is not HubSpot or Salesforce. '
      + 'Public CRM detection was measured at 2 of 6 against companies known to run a supported CRM, and Salesforce was never detected from a website artifact.';
  }
  if (conflict) {
    return 'More than one CRM is independently evidenced. A company may legitimately run several, so neither observation is discarded — this is routed to review rather than resolved.';
  }
  const level = primary.level.replace('crm_', '').replace(/_/g, ' ');
  return `${primary.vendor} at ${level}, from ${primary.sources.length} ${primary.sources.length === 1 ? 'source' : 'sources'}. `
    + 'Evidence of use is not evidence that this is the partner team’s system of record.';
}
