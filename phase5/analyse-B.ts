/**
 * B: which public features separate PRM buyers (proxy) from matched non-buyers?
 * Stratified, never pooled. The control is the matched-unlabelled cohort — companies with a
 * partner page and no PRM evidence — because rejecting professional-services firms proves
 * nothing.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const feats: any[] = JSON.parse(readFileSync('phase5/out/B-features.json', 'utf8')).filter((r) => !r.error);
const cval: any[] = JSON.parse(readFileSync('phase5/out/C-validation.json', 'utf8'));
const control = cval.filter((r) => r.cohort === 'matched_unlabelled');
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);

console.log(`PROXY POSITIVES: ${feats.length}   CONTROL (matched unlabelled): ${control.length}\n`);

const strata = ['smb', 'mid_market', 'enterprise'];
console.log('FEATURE RATES BY STRATUM (never pooled)\n');
console.log('feature                     ' + strata.map((s) => s.padEnd(13)).join('') + 'CONTROL');
console.log('─'.repeat(80));

const rate = (rows: any[], f: (r: any) => boolean) => `${pct(rows.filter(f).length, rows.length)}%`.padEnd(13);
const byS = (s: string) => feats.filter((r) => r.stratum === s);

const FEATURES: [string, (r: any) => boolean][] = [
  ['partner motion', (r) => r.motion === true || (r.programmes ?? []).length > 0],
  ['ownership established', (r) => r.ownership === 'direct' || r.ownership === 'owned'],
  ['materiality confirmed', (r) => r.materiality === 'confirmed'],
  ['surface rich/moderate', (r) => r.surface === 'rich' || r.surface === 'moderate'],
  ['first-person recruitment', (r) => (r.recruitmentHits ?? 0) > 0],
  ['partner types named', (r) => (r.types ?? []).length > 0],
  ['formal artefact present', (r) => (r.artefacts ?? []).length > 0],
  ['INFORMAL signature', (r) => r.informal === 'informal_programme'],
  ['formalised programme', (r) => r.informal === 'formalised_programme'],
];
for (const [label, f] of FEATURES) {
  console.log(label.padEnd(28) + strata.map((s) => rate(byS(s), f)).join('') + rate(control, f));
}
console.log(`\n(control column uses the same detector; construct fields are absent for the control,`);
console.log(` so the first four rows are reported for the proxy strata only and read 0% for control.)`);

// The separator question, asked only of features measured on BOTH sides.
console.log('\nSEPARATION on features measured on both sides');
for (const [label, f] of FEATURES.slice(4)) {
  const smb = pct(byS('smb').filter(f).length, byS('smb').length);
  const ent = pct(byS('enterprise').filter(f).length, byS('enterprise').length);
  const ctl = pct(control.filter(f).length, control.length);
  console.log(`  ${label.padEnd(26)} SMB ${String(smb).padStart(5)}%   ENT ${String(ent).padStart(5)}%   control ${String(ctl).padStart(5)}%   Δ(SMB−control) ${String(Math.round((smb - ctl) * 10) / 10).padStart(6)}pp`);
}

writeFileSync('phase5/out/B-analysis.json', JSON.stringify({
  n: { proxy: feats.length, control: control.length, bySt: Object.fromEntries(strata.map((s) => [s, byS(s).length])) },
  rates: Object.fromEntries(FEATURES.map(([l, f]) => [l, {
    ...Object.fromEntries(strata.map((s) => [s, pct(byS(s).filter(f).length, byS(s).length)])),
    control: pct(control.filter(f).length, control.length),
  }])),
}, null, 2));
