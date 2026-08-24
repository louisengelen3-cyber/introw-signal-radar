/** §31/§57: does the cheap gate agree with adversarial human labels, and are dossiers useful? */
import { readFileSync } from 'node:fs';
const rows: any[] = JSON.parse(readFileSync('discovery/shadow/out-e2e.json', 'utf8'));
const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 100));
const ops = rows.filter((r) => r.humanLabel === 'VALID_OPERATOR');
const nonOps = rows.filter((r) => r.humanLabel !== 'VALID_OPERATOR');

console.log(`CHEAP EVIDENCE GATE vs HUMAN LABELS (n=${rows.length})\n`);
console.log('                      dropped  research_required  operator_evidence');
for (const [label, set] of [['VALID_OPERATOR', ops], ['not an operator', nonOps]] as [string, any[]][]) {
  const d = set.filter((r) => r.cheapVerdict === 'drop').length;
  const rr = set.filter((r) => r.cheapVerdict === 'research_required').length;
  const oe = set.filter((r) => r.cheapVerdict === 'operator_evidence').length;
  console.log(`${label.padEnd(20)} ${String(d).padStart(6)}  ${String(rr).padStart(16)}  ${String(oe).padStart(17)}   (n=${set.length})`);
}
const falseDrops = ops.filter((r) => r.cheapVerdict === 'drop');
const correctDrops = nonOps.filter((r) => r.cheapVerdict === 'drop');
const leaks = nonOps.filter((r) => r.cheapVerdict !== 'drop');
console.log(`\nFALSE DROPS (valid operators the gate refused to research): ${falseDrops.length}/${ops.length} = ${pct(falseDrops.length, ops.length)}%`);
for (const f of falseDrops) console.log(`  ${f.domain.padEnd(26)} ${f.dropReason}  — ${String(f.cheapRationale).slice(0, 110)}`);
console.log(`\nCORRECT DROPS: ${correctDrops.length}/${nonOps.length} non-operators stopped before research`);
for (const c of correctDrops) console.log(`  ${c.domain.padEnd(26)} ${c.humanLabel} → ${c.dropReason}`);
console.log(`\nLEAKS (non-operators that reached research): ${leaks.length}`);
for (const l of leaks) console.log(`  ${l.domain.padEnd(26)} ${l.humanLabel} → ${l.cheapVerdict}, dossier=${l.dossierState ?? '-'} reviewable=${l.reviewable ?? '-'}`);

const built = rows.filter((r) => r.dossierState);
const reviewable = built.filter((r) => r.reviewable);
console.log(`\n§31 DOSSIER QUALITY (${built.length} built)`);
console.log(`  reviewable (a programme or a distinct claim): ${reviewable.length}/${built.length} = ${pct(reviewable.length, built.length)}%`);
console.log(`  of valid operators with a dossier: ${built.filter((r) => r.humanLabel === 'VALID_OPERATOR' && r.reviewable).length}/${built.filter((r) => r.humanLabel === 'VALID_OPERATOR').length}`);
console.log(`  recovery contributed on: ${built.filter((r) => r.recoveryAdded).length}`);
const states: Record<string, number> = {};
for (const b of built) states[b.dossierState] = (states[b.dossierState] ?? 0) + 1;
console.log(`  dossier states: ${Object.entries(states).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`\n§57.2 wrong-company research: ${rows.filter((r) => r.autoResearch === false).length} candidates blocked from auto-research`);
console.log(`§57.4 category guard ran on every candidate: ${rows.every((r) => r.cheapVerdict !== undefined)}`);

console.log(`\n§51 SELLER UTILITY — of ${rows.length} sampled candidates:`);
console.log(`  ${ops.length} are genuine operators a seller could plausibly open`);
console.log(`  ${reviewable.filter((r) => r.humanLabel === 'VALID_OPERATOR').length} produced a dossier with something to review`);
console.log(`  ${leaks.length} noise items survived the gate and cost a research pass`);
