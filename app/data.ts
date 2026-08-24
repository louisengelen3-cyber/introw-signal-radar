/**
 * Data access.
 *
 * Two tiers: a light index for list screens, and a full dossier fetched only when an account
 * is opened. Nothing in this file invents a value — if a fetch fails the caller gets an error
 * state, never an empty dossier that would read as "we found nothing".
 */

import type { Dossier, HumanOutcome, HumanReview } from '../src/dossier/types.js';

export interface IndexRow {
  domain: string;
  companyName: string | null;
  selfDescription: string | null;
  category: string;
  onCompetitorList: boolean;
  machineState: string;
  materiality: string;
  ownership: string;
  surface: string;
  programmes: string[];
  surfacesConfirmed: number;
  directoryLowerBound: number | null;
  crm: string;
  prm: string;
  prmVendor: string | null;
  people: string;
  coverage: string;
  distinctClaims: number;
  independentSources: number;
  contradictions: number;
  researchTasks: number;
  topUnknown: string | null;
  machineReason: string | null;
  prmIsIntrow: boolean;
  retrievedAt: string;
  sourceHealthOk: number;
  sourceHealthTotal: number;
}

export interface SiteIndex {
  generatedAt: string;
  count: number;
  monitoringSince: string;
  accounts: IndexRow[];
}

const base = import.meta.env.BASE_URL ?? '/';

export async function loadIndex(): Promise<SiteIndex> {
  const r = await fetch(`${base}data/index.json`);
  if (!r.ok) throw new Error(`Could not load the account index (HTTP ${r.status}).`);
  return r.json();
}

const dossierCache = new Map<string, Dossier>();

export async function loadDossier(domain: string): Promise<Dossier> {
  const hit = dossierCache.get(domain);
  if (hit) return hit;
  const r = await fetch(`${base}data/dossiers/${domain}.json`);
  if (!r.ok) throw new Error(`Could not load the dossier for ${domain} (HTTP ${r.status}).`);
  const d = (await r.json()) as Dossier;
  dossierCache.set(domain, d);
  return d;
}

/* ── human review ─────────────────────────────────────────────────────────
 * Stored separately from machine output and never merged into it. A blind reviewer beat the
 * automated model 6-0 on the hardest cases during validation; collapsing the two would erase
 * the only signal that worked.
 */

const KEY = 'introw.review.v2';

export interface ReviewRecord extends HumanReview {
  domain: string;
}

function readAll(): Record<string, ReviewRecord> {
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as Record<string, ReviewRecord>) : {};
  } catch {
    return {}; // private windows and blocked site data must not break the app
  }
}

export const allReviews = readAll;
export const getReview = (d: string): ReviewRecord | null => readAll()[d] ?? null;

export function saveReview(r: ReviewRecord): void {
  try {
    const all = readAll();
    all[r.domain] = r;
    localStorage.setItem(KEY, JSON.stringify(all));
    logEvent('review_completed', { domain: r.domain, outcome: r.outcome, confidence: r.confidence });
  } catch { /* the decision still shows in-session */ }
}

export function clearReview(domain: string): void {
  try {
    const all = readAll();
    delete all[domain];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

/* ── local event log ──────────────────────────────────────────────────────
 * A local ring buffer so a real seller trial can be measured without adding an analytics
 * vendor, a credential or a network call. Nothing leaves the browser.
 */

const EVENTS = 'introw.events.v1';
export type EventName = 'account_opened' | 'evidence_expanded' | 'review_started' | 'review_completed' | 'watch_added' | 'filter_used';

export function logEvent(name: EventName, detail: Record<string, unknown> = {}): void {
  try {
    const raw = localStorage.getItem(EVENTS);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push({ at: new Date().toISOString(), name, ...detail });
    localStorage.setItem(EVENTS, JSON.stringify(list.slice(-500)));
  } catch { /* never break the app for telemetry */ }
}

export function readEvents(): { at: string; name: string }[] {
  try { return JSON.parse(localStorage.getItem(EVENTS) ?? '[]'); } catch { return []; }
}

/* ── workflow states, NOT a ranking ───────────────────────────────────────
 * Where an account sits in the reviewer's process. Deliberately unordered: no top, no score,
 * and no sort that implies priority.
 */

export type WorkflowState =
  | 'ready_for_review' | 'research_needed' | 'under_observed'
  | 'suppression_flagged' | 'reviewed' | 'watching' | 'suppressed';

export function workflowState(machineState: string, review: ReviewRecord | null): WorkflowState {
  if (review) {
    if (review.outcome === 'watch') return 'watching';
    if (review.outcome === 'suppress') return 'suppressed';
    return 'reviewed';
  }
  if (machineState === 'suppression_candidate') return 'suppression_flagged';
  if (machineState === 'under_observed') return 'under_observed';
  if (machineState === 'research') return 'research_needed';
  return 'ready_for_review';
}

export const WORKFLOW_LABEL: Record<WorkflowState, string> = {
  ready_for_review: 'Ready for review',
  research_needed: 'Research needed',
  under_observed: 'Under-observed',
  suppression_flagged: 'Suppression flagged',
  reviewed: 'Reviewed',
  watching: 'Watching',
  suppressed: 'Suppressed',
};

export const OUTCOME_LABEL: Record<HumanOutcome, string> = {
  promote: 'Promote', research: 'Research', watch: 'Watch', reject: 'Reject', suppress: 'Suppress',
};

export const OUTCOME_HELP: Record<HumanOutcome, string> = {
  promote: 'Evidence is sufficient to consider outreach. Not the same as "call now".',
  research: 'Potential exists, but one specific uncertainty must be resolved first.',
  watch: 'Interesting, but no current reason to act. Monitoring continues.',
  reject: 'Current evidence suggests poor commercial fit.',
  suppress: 'A defensible reason not to prospect — competitor, customer, or structural mismatch.',
};

/* ── shared vocabulary ───────────────────────────────────────────────────── */

export const CATEGORY_LABEL: Record<string, string> = {
  // Named for what was actually measured. The classifier's own matched value is
  // "(no disqualifying category signal)", and calling that "Target-like" asserted fit for a
  // consumer marketplace on the strength of a title tag.
  likely_target_category: 'No disqualifying signal',
  partner_tech_vendor: 'Partner-tech vendor',
  direct_introw_competitor: 'Direct Introw competitor',
  supply_side_marketplace: 'Supply-side marketplace',
  professional_services: 'Professional services',
  reseller_or_participant: 'Reseller / participant',
  unknown: 'Category unknown',
};

export const MACHINE_LABEL: Record<string, string> = {
  strong_evidence: 'Strong evidence',
  plausible: 'Plausible',
  research: 'Research needed',
  under_observed: 'Under-observed',
  weak_evidence: 'Weak evidence',
  suppression_candidate: 'Suppression candidate',
};

/** Materiality is presented in the seller's words, not the detector's. */
export const MATERIALITY_LABEL: Record<string, string> = {
  confirmed: 'Supported', strong_proxy: 'Supported', weak_proxy: 'Weak',
  contradicted: 'Contradicted', unknown: 'Unknown',
};

export const OWNERSHIP_LABEL: Record<string, string> = {
  direct: 'Direct', mixed: 'Mixed', distributor_mediated: 'Distributor-mediated',
  participant_only: 'Participant only', unknown: 'Unknown',
};

export const SURFACE_LABEL: Record<string, string> = {
  rich: 'Rich', moderate: 'Moderate', light: 'Light', unknown: 'Unknown',
};

export const CRM_LABEL: Record<string, string> = {
  hubspot_confirmed: 'HubSpot confirmed', salesforce_confirmed: 'Salesforce confirmed',
  other_crm_confirmed: 'Other CRM confirmed', unknown: 'Unknown', error: 'Retrieval error',
};

export const PRM_LABEL: Record<string, string> = {
  introw_confirmed: 'Introw', competitor_prm_confirmed: 'Competitor PRM',
  other_prm_confirmed: 'Other platform', unknown: 'Unknown', error: 'Retrieval error',
};

export const PEOPLE_LABEL: Record<string, string> = {
  partner_owner_confirmed: 'Partner owner verified',
  two_plus_relevant_people_confirmed: '2+ relevant people observed',
  one_relevant_person_confirmed: '1 relevant person observed',
  currentness_uncertain: 'Currentness uncertain',
  employer_uncertain: 'Employer uncertain',
  unknown: 'Under-observed',
};

/** Enum keys that do not read correctly under plain underscore replacement. */
const SPECIAL_LABEL: Record<string, string> = {
  co_selling: 'Co-selling',
  lead_submission: 'Lead submission',
  referral_submission: 'Referral submission',
  deal_registration: 'Deal registration',
  partner_pipeline: 'Partner-sourced pipeline',
  programme_tiers: 'Programme tiers',
  partner_resources: 'Partner resources',
  partner_recruitment: 'Partner recruitment',
  strategic_alliance: 'Strategic alliance',
  not_observed: 'Not observed',
  no_relevant_evidence: 'No relevant evidence',
  not_found: 'Not found',
  parse_error: 'Parse error',
};

export const humanise = (s: string): string =>
  SPECIAL_LABEL[s] ?? s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
