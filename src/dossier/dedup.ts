/**
 * Evidence deduplication and source independence.
 *
 * WHAT THIS DETECTS
 *   Repeated instances of the same claim, and evidence that only appears independent.
 *
 * WHY IT EXISTS
 *   Ten pages carrying the same footer sentence is one observation, not ten. The hardening
 *   sprint established that promotion tracked observation COUNT more strongly than anything
 *   commercial (obs >= 9 -> 90% promoted), so any count that reaches an interpretation must
 *   first be reduced to distinct claims from distinct sources. Without this the product would
 *   reward companies for repeating themselves, which is the publication-bias failure in its
 *   purest form.
 *
 * WHAT IT PROVES
 *   That two observations are, or are not, textually the same claim.
 *
 * WHAT IT DOES NOT PROVE
 *   That two DIFFERENT sentences are independent evidence. A company can paraphrase itself
 *   across pages, and no textual method catches that. Independence here means "not the same
 *   words from the same host", which is a floor, not a guarantee.
 *
 * KNOWN FALSE POSITIVES
 *   Two genuinely distinct programmes described in near-identical boilerplate collapse into
 *   one. Acceptable: undercounting evidence is the safe direction.
 */

export interface Dedupable {
  quote: string;
  sourceUrl?: string;
}

/** Comparison form: lowercase, punctuation-free, whitespace-collapsed. */
function canonical(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function shingles(s: string, n = 5): Set<string> {
  const w = s.split(' ').filter(Boolean);
  const out = new Set<string>();
  if (w.length < n) { out.add(w.join(' ')); return out; }
  for (let i = 0; i <= w.length - n; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
}

export function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

export interface DedupResult<T> {
  /** One representative per distinct claim, with the duplicates it absorbed. */
  canonical: (T & { duplicateCount: number; alsoSeenAt: string[] })[];
  /** Total items in, distinct claims out. The gap IS the repetition. */
  observationCount: number;
  distinctClaimCount: number;
  /** Distinct registrable hosts contributing at least one canonical claim. */
  independentSourceCount: number;
}

const SIMILARITY_THRESHOLD = 0.6;

export function dedupe<T extends Dedupable>(items: T[]): DedupResult<T> {
  const canon: (T & { duplicateCount: number; alsoSeenAt: string[]; _sh: Set<string> })[] = [];

  for (const it of items) {
    const c = canonical(it.quote);
    if (c.length < 8) continue;
    const sh = shingles(c);
    const match = canon.find((x) => jaccard(x._sh, sh) >= SIMILARITY_THRESHOLD);
    if (match) {
      match.duplicateCount++;
      if (it.sourceUrl && !match.alsoSeenAt.includes(it.sourceUrl) && it.sourceUrl !== (match as T).sourceUrl) {
        match.alsoSeenAt.push(it.sourceUrl);
      }
      continue;
    }
    canon.push({ ...it, duplicateCount: 1, alsoSeenAt: [], _sh: sh });
  }

  const hosts = new Set<string>();
  for (const c of canon) {
    if (!c.sourceUrl) continue;
    try { hosts.add(new URL(c.sourceUrl).hostname.replace(/^www\./, '')); } catch { /* unparseable */ }
  }

  return {
    canonical: canon.map(({ _sh, ...rest }) => rest) as DedupResult<T>['canonical'],
    observationCount: items.length,
    distinctClaimCount: canon.length,
    independentSourceCount: hosts.size,
  };
}
