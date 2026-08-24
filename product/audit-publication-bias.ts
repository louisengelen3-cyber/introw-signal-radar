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
const FORWARD = new Set(['high_fit_evidence', 'plausible', 'research']);

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

// The Phase 3 signature: raw volume predicting the outcome MORE strongly than the
// deduplicated, source-diverse measures. That is the specific thing to catch.
const WARN = 0.5;
const rawDominates = rObs > rDistinct + 0.05 || rObs > rSources + 0.05;
console.log('\nVERDICT');
if (Number.isNaN(rObs)) {
  console.log('  Not computable — every account has the same outcome.');
} else if (rObs >= WARN && rawDominates) {
  console.log(`  ⚠ RAW VOLUME IS DRIVING THE OUTPUT (r=${rObs.toFixed(2)}, above the deduplicated measures).`);
  console.log('  This is the Phase 3 failure signature. Do not ship without addressing it.');
} else if (rObs >= WARN) {
  console.log(`  Recommendation correlates with evidence volume (r=${rObs.toFixed(2)}), but deduplicated`);
  console.log('  and source-diverse measures correlate at least as strongly, which is the expected');
  console.log('  shape when a company with more partner machinery genuinely publishes more about it.');
  console.log('  Reported, not suppressed: a reader should judge this rather than trust it.');
} else {
  console.log(`  No strong volume dependence detected (r=${rObs.toFixed(2)}).`);
}
console.log('\nThis diagnostic cannot prove the dependence is legitimate. It only makes it visible.');
