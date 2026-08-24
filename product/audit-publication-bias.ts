/**
 * Standing publication-bias audit.
 *
 * The Phase 3 model promoted companies because they published more partner content:
 * observation count >= 9 predicted promotion 90% of the time, and nine of the ten companies
 * clearing that bar were partner-tech vendors. The failure was invisible until it was
 * measured directly, so it is now measured on every dataset rather than assumed fixed.
 *
 * This is a DIAGNOSTIC, not a gate. It cannot tell whether the dependence is legitimate —
 * a company with more partner machinery genuinely does publish more about it. What it can
 * do is make the dependence visible so it is never shipped silently.
 *
 * Run: npx tsx product/audit-publication-bias.ts
 */
import { readFileSync } from 'node:fs';
import type { Dossier } from '../src/dossier/types.js';

const ds = JSON.parse(readFileSync(new URL('./out/dossiers.json', import.meta.url).pathname, 'utf8')) as Dossier[];

/** Interpretations that would put an account in front of a seller as worth attention. */
const FORWARD = new Set(['strong_evidence', 'plausible', 'research']);

const rows = ds.map((d) => ({
  domain: d.domain,
  state: d.machineInterpretation.state,
  forwarded: FORWARD.has(d.machineInterpretation.state),
  observations: d.machineInterpretation.diagnostics.observationCount,
  distinct: d.machineInterpretation.diagnostics.distinctClaimCount,
  sources: d.machineInterpretation.diagnostics.independentSourceCount,
  volumeSensitive: d.machineInterpretation.diagnostics.volumeSensitive,
}));

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Point-biserial correlation between a binary outcome and a continuous measure. */
function pointBiserial(binary: boolean[], value: number[]): number {
  const n = binary.length;
  if (n < 3) return NaN;
  const g1 = value.filter((_, i) => binary[i]);
  const g0 = value.filter((_, i) => !binary[i]);
  if (!g1.length || !g0.length) return NaN;
  const m = mean(value);
  const sd = Math.sqrt(mean(value.map((v) => (v - m) ** 2)));
  if (sd === 0) return 0;
  return ((mean(g1) - mean(g0)) / sd) * Math.sqrt((g1.length * g0.length) / (n * n));
}

const fwd = rows.map((r) => r.forwarded);
const rObs = pointBiserial(fwd, rows.map((r) => r.observations));
const rDistinct = pointBiserial(fwd, rows.map((r) => r.distinct));
const rSources = pointBiserial(fwd, rows.map((r) => r.sources));

console.log(`PUBLICATION-BIAS AUDIT — n=${rows.length}\n`);
console.log('Forwarded = machine state would put the account in front of a seller.\n');
console.log(`  mean raw observations   forwarded ${mean(rows.filter((r) => r.forwarded).map((r) => r.observations)).toFixed(2)}  vs  not ${mean(rows.filter((r) => !r.forwarded).map((r) => r.observations)).toFixed(2)}`);
console.log(`  mean distinct claims    forwarded ${mean(rows.filter((r) => r.forwarded).map((r) => r.distinct)).toFixed(2)}  vs  not ${mean(rows.filter((r) => !r.forwarded).map((r) => r.distinct)).toFixed(2)}`);
console.log(`  mean independent srcs   forwarded ${mean(rows.filter((r) => r.forwarded).map((r) => r.sources)).toFixed(2)}  vs  not ${mean(rows.filter((r) => !r.forwarded).map((r) => r.sources)).toFixed(2)}`);
console.log(`\n  correlation with forwarding:`);
console.log(`    raw observation count : ${rObs.toFixed(3)}`);
console.log(`    distinct claim count  : ${rDistinct.toFixed(3)}`);
console.log(`    independent sources   : ${rSources.toFixed(3)}`);

console.log('\n  by raw observation count:');
for (const [lab, f] of [['>= 9', (r: any) => r.observations >= 9], ['6-8', (r: any) => r.observations >= 6 && r.observations <= 8],
  ['3-5', (r: any) => r.observations >= 3 && r.observations <= 5], ['0-2', (r: any) => r.observations <= 2]] as const) {
  const g = rows.filter(f);
  const p = g.filter((r) => r.forwarded).length;
  console.log(`    ${String(lab).padEnd(6)} forwarded ${p}/${g.length}${g.length ? `  ${Math.round((p / g.length) * 100)}%` : ''}`);
}

const flagged = rows.filter((r) => r.volumeSensitive);
console.log(`\n  accounts flagged volume-sensitive in their own dossier: ${flagged.length}/${rows.length}${flagged.length ? ` (${flagged.map((r) => r.domain).join(', ')})` : ''}`);

/**
 * Correlation alone cannot answer the question, and reporting it alone would be misleading.
 *
 * Some volume dependence is TRIVIAL and unavoidable: an account with zero retrieved evidence
 * cannot be put in front of a seller, so "has evidence" will always predict "forwarded".
 * Excluding the zero-evidence accounts isolates the dependence that is actually a choice.
 *
 * The dependence that MATTERS is directional: in Phase 3, volume selected for partner-tech
 * vendors, because a PRM vendor publishes more partner copy than anyone. So the decisive
 * test is not how strongly volume predicts forwarding, but WHICH COMPANIES the high-volume
 * band contains.
 */
const nonEmpty = rows.filter((r) => r.observations > 0);
const rObsNonEmpty = pointBiserial(nonEmpty.map((r) => r.forwarded), nonEmpty.map((r) => r.observations));
console.log(`\n  excluding zero-evidence accounts (n=${nonEmpty.length}): r=${Number.isNaN(rObsNonEmpty) ? 'n/a' : rObsNonEmpty.toFixed(3)}`);
console.log('    (a zero-evidence account cannot be reviewed, so its contribution is trivial)');

// Directional test: does the top volume band select for companies we must NOT forward?
const KNOWN_WRONG = new Set(JSON.parse(readFileSync(new URL('../data/business/known-competitors.json', import.meta.url).pathname, 'utf8')).domains as string[]);
const topBand = rows.filter((r) => r.observations >= 6);
const wrongInTop = topBand.filter((r) => KNOWN_WRONG.has(r.domain));
const wrongForwarded = wrongInTop.filter((r) => r.forwarded);
console.log(`\n  DIRECTIONAL TEST — the Phase 3 failure was that volume selected for competitors:`);
console.log(`    companies in the top volume band (>=6 observations) : ${topBand.length}`);
console.log(`    of those, known partner-tech vendors                : ${wrongInTop.length}${wrongInTop.length ? ` (${wrongInTop.map((r) => r.domain).join(', ')})` : ''}`);
console.log(`    of those vendors, FORWARDED to a seller             : ${wrongForwarded.length}${wrongForwarded.length ? ` (${wrongForwarded.map((r) => r.domain).join(', ')})` : ''}`);
console.log(`    (Phase 3 comparison: 9 of the 10 companies clearing >=9 observations were partner-tech vendors, and 8 of 9 were promoted)`);

const WARN = 0.5;
const rawDominates = rObs > rDistinct + 0.05 || rObs > rSources + 0.05;
console.log('\nVERDICT');
if (Number.isNaN(rObs)) {
  console.log('  Not computable — every account has the same outcome.');
} else if (wrongForwarded.length > 0) {
  console.log(`  ⚠ THE PHASE 3 FAILURE HAS RETURNED: ${wrongForwarded.length} known partner-tech vendor(s) in the`);
  console.log('  top volume band were forwarded to a seller. Do not ship without addressing it.');
} else if (rObs >= WARN && rawDominates) {
  console.log(`  ⚠ RAW VOLUME OUTRANKS THE DEDUPLICATED MEASURES (r=${rObs.toFixed(2)}). Repetition is doing work`);
  console.log('  that distinct, independently-sourced evidence should be doing. Investigate before shipping.');
} else if (rObs >= WARN) {
  console.log(`  Forwarding correlates with evidence volume (r=${rObs.toFixed(2)}), and the deduplicated and`);
  console.log('  source-diverse measures correlate at least as strongly. No known partner-tech vendor');
  console.log('  reaches a seller from the top volume band, so volume is not selecting for the wrong');
  console.log('  companies — which is the specific harm Phase 3 suffered. Reported, not suppressed.');
} else {
  console.log(`  No strong volume dependence detected (r=${rObs.toFixed(2)}).`);
}
console.log('\nThis diagnostic cannot prove the remaining dependence is legitimate. It makes it visible.');
