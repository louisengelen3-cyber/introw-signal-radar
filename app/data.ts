/**
 * Data access for the product shell.
 *
 * Dossiers are real observations built by `product/build-dossiers.ts` and committed as JSON.
 * There is no fixture path in this file: the mandate forbids demo fiction reaching a
 * production surface, so if the dataset is missing the app says so rather than inventing
 * companies. Every dossier carries `provenance`, and the UI renders anything that is not
 * `real_observation` with an explicit badge.
 */

import type { Dossier, HumanOutcome, HumanReview } from '../src/dossier/types.js';
import raw from '../product/out/dossiers.json';

export const DOSSIERS: Dossier[] = (raw as unknown as Dossier[]) ?? [];

/* ── review state ─────────────────────────────────────────────────────────
 * Human decisions are stored separately from machine output and never merged into it
 * (§10). They persist per browser; this build has no backend by design.
 */

const KEY = 'introw.review.v1';

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

export function getReview(domain: string): ReviewRecord | null {
  return readAll()[domain] ?? null;
}

export function allReviews(): Record<string, ReviewRecord> {
  return readAll();
}

export function saveReview(r: ReviewRecord): void {
  try {
    const all = readAll();
    all[r.domain] = r;
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* nothing we can do; the decision is still shown in-session */ }
}

export function clearReview(domain: string): void {
  try {
    const all = readAll();
    delete all[domain];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch { /* ignore */ }
}

/* ── workflow states, NOT a ranking ───────────────────────────────────────
 * These describe where a company sits in the reviewer's process. They are deliberately
 * unordered: there is no "top", no score, and no sort that implies priority (§9).
 */

export type WorkflowState = 'ready_for_review' | 'research_needed' | 'under_observed' | 'reviewed' | 'watching' | 'suppressed';

export function workflowState(d: Dossier, review: ReviewRecord | null): WorkflowState {
  if (review) {
    if (review.outcome === 'watch') return 'watching';
    if (review.outcome === 'suppress') return 'suppressed';
    return 'reviewed';
  }
  if (d.machineInterpretation.state === 'under_observed') return 'under_observed';
  if (d.machineInterpretation.state === 'research') return 'research_needed';
  return 'ready_for_review';
}

export const WORKFLOW_LABEL: Record<WorkflowState, string> = {
  ready_for_review: 'Ready for review',
  research_needed: 'Research needed',
  under_observed: 'Under-observed',
  reviewed: 'Reviewed',
  watching: 'Watching',
  suppressed: 'Suppressed',
};

export const OUTCOME_LABEL: Record<HumanOutcome, string> = {
  promote: 'Promote', research: 'Research', watch: 'Watch', reject: 'Reject', suppress: 'Suppress',
};

export const OUTCOME_HELP: Record<HumanOutcome, string> = {
  promote: 'Evidence is sufficient for a seller to consider outreach. Not the same as "call now".',
  research: 'Potential exists, but one specific uncertainty must be resolved first.',
  watch: 'Interesting, but no current reason to act. Snapshots continue.',
  reject: 'Current evidence suggests poor commercial fit.',
  suppress: 'A defensible reason not to prospect — confirmed customer, competitor, or structural mismatch.',
};
