/**
 * Job-posting enrichment — types.
 *
 * This layer exists to add POSITIVE operational evidence to a dossier that already exists.
 * It is not a discovery mechanism, and it never produces a negative: a company with no
 * vacancies, or no CRM mentioned in its vacancies, ends at `unknown` exactly as before.
 *
 * The distinction the whole layer turns on:
 *
 *     "You will own our HubSpot CRM."          → the company uses HubSpot
 *     "Experience with HubSpot preferred."     → the candidate should know HubSpot
 *     "Salesforce, HubSpot or similar CRM"     → neither, it is a category example
 *
 * All three contain the token "HubSpot". Only the first is evidence about the company.
 */

import type { SourceHealth } from '../evidence/positioning.js';

/* ── ownership ────────────────────────────────────────────────────────────
 * A vacancy is only evidence about a company if it provably belongs to that company.
 */

export type OwnershipBasis =
  /** The company's own site links to this ATS board. The strongest available proof. */
  | 'first_party_link'
  /** The board's own metadata carries the company's domain. */
  | 'board_declares_domain'
  /** The vacancy sits on the company's own domain. */
  | 'same_domain'
  /** Nothing tied the board to the company. Never used as evidence. */
  | 'unverified';

export type OwnershipState = 'owned' | 'quarantined';

export interface AtsTenant {
  vendor: AtsVendor;
  /** The board identifier as the vendor uses it. */
  token: string;
  boardUrl: string;
  ownership: OwnershipState;
  basis: OwnershipBasis;
  /** Where the link or declaration was found, so the attribution is auditable. */
  evidenceUrl: string;
}

export type AtsVendor =
  | 'greenhouse' | 'lever' | 'ashby' | 'smartrecruiters'
  | 'recruitee' | 'workable' | 'personio';

/* ── vacancies ───────────────────────────────────────────────────────────── */

/**
 * How confident we are that a vacancy is open TODAY.
 *
 * A board API that only serves open roles gives `current`. A dated posting more than a year
 * old is `historical`. Anything we cannot date is `currentness_unknown` — never silently
 * treated as current, because a 2023 vacancy is not evidence of today's CRM.
 */
export type Currentness = 'current' | 'recent_historical' | 'historical' | 'currentness_unknown';

export interface Vacancy {
  id: string;
  companyDomain: string;
  jobTitle: string;
  location: string | null;
  jobUrl: string;
  source: string;
  sourceType: 'company_ats' | 'company_careers_page';
  /** Only ever set from a date the source itself carries. */
  publishedAt: string | null;
  retrievedAt: string;
  currentness: Currentness;
  /** Normalised description text, kept for audit. Empty when the board serves titles only. */
  description: string;
  /** BCP-47-ish tag when the board declares one; we do not guess. */
  language: string | null;
  ownership: OwnershipState;
  ownershipBasis: OwnershipBasis;
}

/* ── CRM evidence ────────────────────────────────────────────────────────── */

export type CrmEvidenceLevel =
  | 'crm_confirmed'
  | 'crm_strong_evidence'
  | 'crm_supporting_evidence'
  | 'crm_mention_only'
  | 'crm_unknown';

export const CRM_LEVEL_RANK: Record<CrmEvidenceLevel, number> = {
  crm_confirmed: 4, crm_strong_evidence: 3, crm_supporting_evidence: 2, crm_mention_only: 1, crm_unknown: 0,
};

export interface JobCrmHit {
  vendor: string;
  level: Exclude<CrmEvidenceLevel, 'crm_unknown'>;
  /** The sentence that produced the classification, verbatim. */
  quote: string;
  /** Which rule fired, so a reviewer can judge the inference rather than trust it. */
  rule: string;
  vacancyId: string;
  jobTitle: string;
  jobUrl: string;
  currentness: Currentness;
  proves: string;
  doesNotProve: string;
}

/* ── operational evidence ────────────────────────────────────────────────── */

export type OperationalFact =
  | 'partner_workflow' | 'deal_registration' | 'partner_pipeline' | 'lead_routing'
  | 'co_selling' | 'referral_process' | 'channel_operations' | 'partner_onboarding'
  | 'partner_enablement' | 'partner_portal' | 'prm_usage' | 'revops_process'
  | 'manual_workflow' | 'system_ownership' | 'partner_role_hiring'
  | 'partner_team_size_stated';

export interface JobOperationalHit {
  fact: OperationalFact;
  quote: string;
  rule: string;
  vacancyId: string;
  jobTitle: string;
  jobUrl: string;
  currentness: Currentness;
  proves: string;
  doesNotProve: string;
  /** Only ever set when the company states a number about itself. */
  statedValue?: number;
}

/* ── the bundle ──────────────────────────────────────────────────────────── */

export interface JobEnrichment {
  domain: string;
  retrievedAt: string;
  /** Boards found and whether each was accepted or quarantined. */
  tenants: AtsTenant[];
  vacanciesFound: number;
  vacanciesUsed: number;
  vacanciesQuarantined: number;
  /** Distinct vacancies after canonicalisation across boards and careers pages. */
  duplicatesCollapsed: number;
  crmHits: JobCrmHit[];
  operationalHits: JobOperationalHit[];
  /** Every surface consulted, so "found nothing" is separable from "could not look". */
  health: { url: string; health: SourceHealth; status?: number }[];
  /** Plain-language statement of what was and was not established. */
  note: string;
}

export const EMPTY_ENRICHMENT = (domain: string): JobEnrichment => ({
  domain,
  retrievedAt: new Date().toISOString(),
  tenants: [], vacanciesFound: 0, vacanciesUsed: 0, vacanciesQuarantined: 0, duplicatesCollapsed: 0,
  crmHits: [], operationalHits: [], health: [],
  note: 'No public vacancies could be attributed to this company. This is not evidence about its CRM, its partner operations, or its hiring.',
});
