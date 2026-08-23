/**
 * Temporal snapshot store.
 *
 * Every timing detector tested in Phase 2 failed for the same reason: there was never a
 * second dated observation to compare against. Common Crawl cannot supply one for
 * login-walled portals, and it records nothing about DNS at all. The only fix is to start
 * observing now, so this runs from the Phase 3 baseline forward regardless of what the
 * rest of the research concludes.
 *
 * Two invariants, both from the mandate and both enforced here:
 *
 *   first_seen_at        ≠  launch_date
 *   new to our system    ≠  new in the world
 *
 * A snapshot records what we saw and when we looked. It never asserts when something
 * happened. Change detection compares two snapshots and says "this surface changed
 * between A and B" — nothing more.
 */

import { createHash } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

export type ObservationType =
  | 'partner_surface_content'   // the main content of a partner programme page
  | 'partner_url_inventory'     // which partner-shaped URLs exist
  | 'dns_partner_host'          // CNAME/A for a partner-named host
  | 'prm_fingerprint'           // which partner platform serves the partner surface
  | 'deal_registration_surface'
  | 'portal_surface'
  | 'channel_classification'    // the verdict itself, so classifier drift is visible
  | 'programme_metadata';

/** Whether the observation reflects the world, or our inability to look at it. */
export type SourceHealth = 'ok' | 'blocked' | 'error' | 'not_found';

export interface Snapshot {
  id: string;
  companyId: string;
  programId?: string;
  sourceUrl: string;
  observationType: ObservationType;
  /** When the observed state was true, as far as we can tell. */
  observedAt: string;
  /** When we looked. Never interchangeable with observedAt. */
  retrievedAt: string;
  /** Stable hash of the normalised evidence, for cheap change detection. */
  contentHash: string;
  /** The comparable form: noise stripped, so a layout change is not a programme change. */
  normalizedEvidence: string;
  evidenceState: 'confirmed' | 'strong_proxy' | 'weak_proxy' | 'unknown' | 'blocked';
  sourceHealth: SourceHealth;
  /** Set when a prior snapshot of the same (companyId, sourceUrl, observationType) exists. */
  previousSnapshotId?: string;
  /** True only when a prior snapshot exists AND its hash differs. Never inferred. */
  changedSincePrevious?: boolean;
}

const STORE = new URL('../../data/snapshots/snapshots.jsonl', import.meta.url).pathname;
const BASELINE = new URL('../../data/snapshots/BASELINE.json', import.meta.url).pathname;

/* ─────────────────────────────────────────────────── normalisation ─────── */

/**
 * Strip the things that change on every fetch without anything changing in the world.
 * Without this, a cache-busting query string or a rotating CSRF token would report as a
 * programme change on every run — which is how a change detector becomes noise.
 */
export function normalizeForComparison(text: string): string {
  return text
    .replace(/\b\d{4}-\d{2}-\d{2}T[\d:.]+Z?\b/g, '<ts>')
    .replace(/\b(?:19|20)\d{2}\b/g, '<year>')
    .replace(/\b[0-9a-f]{16,}\b/gi, '<hash>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>')
    .replace(/\?[^\s"']*\b(?:v|ver|version|cb|cache|t|ts|_)=[^\s"'&]*/gi, '')
    .replace(/\b(?:cookie|consent|privacy|gdpr)[^.]{0,120}\./gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function hashEvidence(normalized: string): string {
  return createHash('sha256').update(normalized).digest('hex').slice(0, 32);
}

/* ─────────────────────────────────────────────────────────── store ─────── */

let cache: Snapshot[] | null = null;

export function loadSnapshots(): Snapshot[] {
  if (cache) return cache;
  if (!existsSync(STORE)) return (cache = []);
  cache = readFileSync(STORE, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((l) => { try { return JSON.parse(l) as Snapshot; } catch { return null; } })
    .filter((x): x is Snapshot => !!x);
  return cache;
}

/** Most recent prior snapshot of the same surface, or undefined on first observation. */
export function previousSnapshot(
  all: Snapshot[],
  companyId: string,
  sourceUrl: string,
  observationType: ObservationType,
): Snapshot | undefined {
  return all
    .filter((s) => s.companyId === companyId && s.sourceUrl === sourceUrl && s.observationType === observationType)
    .sort((a, b) => a.retrievedAt.localeCompare(b.retrievedAt))
    .at(-1);
}

export interface RecordInput {
  companyId: string;
  programId?: string;
  sourceUrl: string;
  observationType: ObservationType;
  rawEvidence: string;
  evidenceState: Snapshot['evidenceState'];
  sourceHealth: SourceHealth;
  /** Defaults to now; pass an earlier date only when the SOURCE itself is dated. */
  observedAt?: string;
}

export function recordSnapshot(input: RecordInput): Snapshot {
  const all = loadSnapshots();
  const now = new Date().toISOString();
  const normalizedEvidence = normalizeForComparison(input.rawEvidence).slice(0, 20000);
  const contentHash = hashEvidence(normalizedEvidence);
  const prev = previousSnapshot(all, input.companyId, input.sourceUrl, input.observationType);

  const snap: Snapshot = {
    id: `${input.companyId}|${input.observationType}|${now}`,
    companyId: input.companyId,
    programId: input.programId,
    sourceUrl: input.sourceUrl,
    observationType: input.observationType,
    observedAt: input.observedAt ?? now,
    retrievedAt: now,
    contentHash,
    normalizedEvidence,
    evidenceState: input.evidenceState,
    sourceHealth: input.sourceHealth,
    previousSnapshotId: prev?.id,
    // Only ever true with a prior snapshot in hand. A first observation is never a change.
    changedSincePrevious: prev ? prev.contentHash !== contentHash : undefined,
  };

  mkdirSync(dirname(STORE), { recursive: true });
  appendFileSync(STORE, JSON.stringify(snap) + '\n');
  all.push(snap);
  return snap;
}

/* ────────────────────────────────────────────────────── baseline ───────── */

export interface Baseline {
  startedAt: string;
  note: string;
  cadence: Record<ObservationType, string>;
}

export function readBaseline(): Baseline | null {
  if (!existsSync(BASELINE)) return null;
  try { return JSON.parse(readFileSync(BASELINE, 'utf8')) as Baseline; } catch { return null; }
}

export function writeBaselineIfAbsent(): Baseline {
  const existing = readBaseline();
  if (existing) return existing;
  const b: Baseline = {
    startedAt: new Date().toISOString(),
    note:
      'Phase 3 temporal baseline. No change claim may reference a date before this timestamp ' +
      'unless an independently dated source supports it. First observation is never a change.',
    cadence: {
      // Cadence is set by how fast the thing actually moves, not by how cheap it is to fetch.
      dns_partner_host: 'weekly — a CNAME change is the cleanest platform-migration signal and is cheap',
      prm_fingerprint: 'weekly — derived from the DNS observation, no extra cost',
      partner_surface_content: 'biweekly — programme pages are edited in campaigns, not daily',
      deal_registration_surface: 'biweekly — appearance/disappearance matters more than wording',
      portal_surface: 'biweekly — same',
      partner_url_inventory: 'monthly — sitemap-scale changes are slow and the fetch is heavy',
      programme_metadata: 'monthly — tiers and programme names change rarely',
      channel_classification: 'monthly — recorded so classifier drift is separable from world change',
    },
  };
  mkdirSync(dirname(BASELINE), { recursive: true });
  appendFileSync(BASELINE, JSON.stringify(b, null, 2));
  return b;
}

/* ────────────────────────────────────────────────── change detection ───── */

export type ChangeKind = 'raw_change' | 'semantic_change' | 'no_change' | 'first_observation' | 'unobservable';

export interface ChangeObservation {
  companyId: string;
  sourceUrl: string;
  observationType: ObservationType;
  kind: ChangeKind;
  fromRetrievedAt: string | null;
  toRetrievedAt: string;
  /** Only populated for semantic changes; the specific thing that differs. */
  semanticDelta?: string;
  /** Stated on every observation so no consumer can promote it to a business event. */
  cannotEstablish: string;
}

/** Structural markers whose appearance or disappearance is a real programme change. */
const SEMANTIC_MARKERS: [string, RegExp][] = [
  ['deal_registration', /\b(deal registration|register a deal|opportunity registration)\b/],
  ['partner_portal', /\b(partner portal|partner login|partner hub)\b/],
  ['partner_tiers', /\b(gold|silver|platinum|premier) partner\b/],
  ['certification', /\b(partner certification|certified partner program)\b/],
  ['commission', /\b(partner commission|revenue share|referral fee)\b/],
  ['distributor', /\b(authoriz?ed distributor|through a distributor)\b/],
  ['mdf', /\b(mdf|market development fund)\b/],
  ['onboarding', /\b(become a partner|partner application|apply to the partner)\b/],
];

export function detectChange(prev: Snapshot | undefined, next: Snapshot): ChangeObservation {
  const base = {
    companyId: next.companyId,
    sourceUrl: next.sourceUrl,
    observationType: next.observationType,
    fromRetrievedAt: prev?.retrievedAt ?? null,
    toRetrievedAt: next.retrievedAt,
    cannotEstablish:
      'when the change happened, why it happened, or that it reflects a business decision. ' +
      'It establishes only that this surface differed between two dated observations.',
  };

  if (next.sourceHealth !== 'ok') return { ...base, kind: 'unobservable' };
  if (!prev) return { ...base, kind: 'first_observation' };
  if (prev.contentHash === next.contentHash) return { ...base, kind: 'no_change' };

  // A hash difference is a RAW change. It becomes semantic only when a structural marker
  // appeared or disappeared — otherwise it is a copy edit or a rotating widget.
  const deltas: string[] = [];
  for (const [name, re] of SEMANTIC_MARKERS) {
    const before = re.test(prev.normalizedEvidence);
    const after = re.test(next.normalizedEvidence);
    if (before !== after) deltas.push(`${name} ${before ? 'disappeared' : 'appeared'}`);
  }
  if (next.observationType === 'dns_partner_host' || next.observationType === 'prm_fingerprint') {
    deltas.push(`host target changed: ${prev.normalizedEvidence.slice(0, 80)} → ${next.normalizedEvidence.slice(0, 80)}`);
  }

  return deltas.length
    ? { ...base, kind: 'semantic_change', semanticDelta: deltas.join('; ') }
    : { ...base, kind: 'raw_change' };
}
