/**
 * Negation and scope handling for prose detectors (Phase 5, workstream E).
 *
 * EXPO.e's partner page reads "we don't use tiered services — you are automatically a Platinum
 * Partner", and the Radar recorded partner tiers as CONFIRMED. That is not a tuning problem:
 * a keyword matcher read a denial that contains the keyword.
 *
 * The audit hand-checked six accounts, so this failure is UNDETECTED rather than absent. It is
 * assumed to exist in every prose-derived field, and this guard is applied across all of them
 * rather than to the one field where it was caught.
 *
 * SCOPE, DELIBERATELY NARROW
 * Negation is only honoured when the negator governs the match — same clause, before it, and
 * not separated by a clause boundary. Treating every "no" anywhere in a paragraph as a denial
 * would suppress far more true positives than it prevents false ones, and the asymmetry runs
 * the other way here: a missed workflow is recoverable by a human, a false confirmed one is a
 * claim the seller repeats.
 */

/** Negators that deny the thing that follows them. */
const NEGATOR = new RegExp([
  "\\b(?:do|does|did)\\s*n[o']?t\\b",
  "\\b(?:is|are|was|were|has|have|had)\\s*n[o']?t\\b",
  "\\bcan\\s*not\\b|\\bcannot\\b|\\bcan't\\b|\\bwon't\\b",
  '\\bno\\b', '\\bnone\\b', '\\bnever\\b', '\\bwithout\\b', '\\bnor\\b',
  '\\brather than\\b', '\\binstead of\\b', '\\bfree from\\b', '\\bfree of\\b',
  "\\bwe\\s+avoid\\b", '\\bunlike\\b', '\\bno need for\\b', '\\bnot require\\b',
  // Dutch / German / French, because the corpus is multilingual
  '\\bgeen\\b', '\\bniet\\b', '\\bzonder\\b',
  '\\bkein[e]?[nmrs]?\\b', '\\bnicht\\b', '\\bohne\\b',
  '\\bpas de\\b', '\\bsans\\b', '\\baucun[e]?\\b',
].join('|'), 'i');

/** Boundaries a negator does not reach across. */
const CLAUSE_BREAK = /[.!?;:]|—|–| - |\bbut\b|\bhowever\b|\bwhereas\b|\balthough\b|\bmaar\b|\baber\b|\bmais\b/i;

/** How far back a negator may govern. Beyond this it is a different statement. */
const SCOPE_CHARS = 90;

/**
 * Is the match at `index` inside a negated scope?
 *
 * Looks back from the match to the nearest clause boundary, capped, and asks whether a
 * negator appears in that window.
 */
export function isNegated(text: string, index: number): boolean {
  if (index <= 0) return false;
  const start = Math.max(0, index - SCOPE_CHARS);
  let window = text.slice(start, index);
  // Cut at the last clause boundary: a negator before it governs a different clause.
  const breaks = [...window.matchAll(new RegExp(CLAUSE_BREAK, 'gi'))];
  if (breaks.length > 0) {
    const last = breaks[breaks.length - 1];
    window = window.slice((last.index ?? 0) + last[0].length);
  }
  return NEGATOR.test(window);
}

/**
 * Run a pattern and return the first NON-negated match, or null when every occurrence is
 * denied. A detector that finds only negated occurrences has found a denial, not evidence.
 */
export function matchUnnegated(text: string, re: RegExp): RegExpMatchArray | null {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const rx = new RegExp(re.source, flags);
  for (const m of text.matchAll(rx)) {
    if (m.index === undefined) continue;
    if (!isNegated(text, m.index)) return m as RegExpMatchArray;
  }
  return null;
}

/** True when the pattern matches somewhere and every occurrence is negated. */
export function isDeniedOutright(text: string, re: RegExp): boolean {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const rx = new RegExp(re.source, flags);
  const all = [...text.matchAll(rx)];
  if (all.length === 0) return false;
  return all.every((m) => m.index !== undefined && isNegated(text, m.index));
}
