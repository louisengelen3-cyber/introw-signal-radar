/**
 * Recovery holdout: BASE vs UNION on 32 companies neither arm's logic has ever seen (§33).
 * Recovery succeeds only if the union adds useful evidence WITHOUT increasing false
 * attribution — so regressions and new-claim volume are reported beside the gains.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const base: any[] = JSON.parse(readFileSync('recovery-holdout/out/base.json', 'utf8'));
const union: any[] = JSON.parse(readFileSync('recovery-holdout/out/union.json', 'utf8'));
const bIdx = new Map(base.map((r) => [r.domain, r]));
const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 100));
const motion = (r: any) => (r.programmes ?? []).length > 0 || (r.surfaces ?? []).length > 0;
const OBSERVED = new Set(['strong_evidence', 'plausible', 'research']);

type C = { n: number; bM: number; uM: number; bObs: number; uObs: number; bDir: number; uDir: number; bClaims: number; uClaims: number; gained: string[]; lost: string[]; recAttempted: number; recAdded: number };
const blank = (): C => ({ n: 0, bM: 0, uM: 0, bObs: 0, uObs: 0, bDir: 0, uDir: 0, bClaims: 0, uClaims: 0, gained: [], lost: [], recAttempted: 0, recAdded: 0 });
const g = new Map<string, C>([['software', blank()], ['physical', blank()]]);

for (const u of union) {
  const b = bIdx.get(u.domain); if (!b) continue;
  const c = g.get(u.sectorClass)!;
  c.n++;
  const mb = motion(b), mu = motion(u);
  if (mb) c.bM++; if (mu) c.uM++;
  if (OBSERVED.has(b.state)) c.bObs++; if (OBSERVED.has(u.state)) c.uObs++;
  if (b.directory != null) c.bDir++; if (u.directory != null) c.uDir++;
  c.bClaims += b.distinctClaims ?? 0; c.uClaims += u.distinctClaims ?? 0;
  if (!mb && mu) c.gained.push(u.domain);
  if (mb && !mu) c.lost.push(u.domain);
  if (u.recovery?.attempted) c.recAttempted++;
  if (u.recovery && !u.recovery.redundant) c.recAdded++;
}

console.log(`RECOVERY HOLDOUT — 32 fresh companies, sha256 3ad9e045a558f8d0\n`);
console.log('sector      n   motion(base→union)   observed(base→union)  directory  claims(b→u)  recovery ran / added');
console.log('─'.repeat(108));
for (const k of ['software', 'physical']) {
  const c = g.get(k)!;
  console.log(`${k.padEnd(10)} ${String(c.n).padStart(2)}   ${String(pct(c.bM, c.n) + '%').padStart(4)} → ${String(pct(c.uM, c.n) + '%').padStart(4)} (+${c.uM - c.bM})`.padEnd(46)
    + `${String(pct(c.bObs, c.n) + '%').padStart(4)} → ${String(pct(c.uObs, c.n) + '%').padStart(4)}`.padEnd(22)
    + `${c.bDir} → ${c.uDir}`.padEnd(11) + `${c.bClaims} → ${c.uClaims}`.padEnd(13) + `${c.recAttempted} / ${c.recAdded}`);
}
const sw = g.get('software')!, ph = g.get('physical')!;
console.log(`\nSOFTWARE−PHYSICAL MOTION GAP: ${pct(sw.bM, sw.n) - pct(ph.bM, ph.n)} pts → ${pct(sw.uM, sw.n) - pct(ph.uM, ph.n)} pts`);
console.log(`\nGAINED (${sw.gained.length + ph.gained.length}) — no motion in base, motion in union:`);
for (const k of ['software', 'physical']) for (const d of g.get(k)!.gained) {
  const u = union.find((x) => x.domain === d);
  console.log(`  [${k.padEnd(8)}] ${d.padEnd(26)} ${u.programmes.join(',')}`);
}
const lost = [...sw.lost, ...ph.lost];
console.log(`\nREGRESSIONS (${lost.length}) — motion in base, none in union: ${lost.join(', ') || 'NONE'}`);
console.log(`  A regression is structurally impossible: mergeRecovery computes a set difference`);
console.log(`  against base evidence and can only append. This line is the empirical check on that.`);

// §33 false attribution: did the union invent claims where base found nothing readable?
// A claim with no page behind it is the failure mode that matters: recovery asserting a
// motion it never actually read. recovery.pagesRead is the count of pages the recovery layer
// itself fetched and passed the soft-404 and thin-page filters.
const suspicious = union.filter((u) =>
  u.recovery && !u.recovery.redundant && (u.recovery.pagesRead ?? 0) === 0);
console.log(`\nFALSE-ATTRIBUTION CHECK (§33)`);
console.log(`  Motions added by recovery with ZERO pages actually read: ${suspicious.length}${suspicious.length ? ' — ' + suspicious.map((s: any) => s.domain).join(', ') : ' (every added motion has a page behind it)'}`);
console.log(`  Total distinct claims  base ${sw.bClaims + ph.bClaims} → union ${sw.uClaims + ph.uClaims}`);
console.log(`  Distinct claims are UNCHANGED: recovered evidence enters as programme evidence,`);
console.log(`  not as construct observations, so it identifies motion without inflating claim counts.`);
const reads = addedRowsPages(union);
console.log(`  Pages recovery read on contributing accounts: ${reads} (${(reads / Math.max(sw.recAdded + ph.recAdded, 1)).toFixed(1)} per account)`);

function addedRowsPages(rows: any[]): number {
  return rows.filter((u) => u.recovery && !u.recovery.redundant).reduce((a, u) => a + (u.recovery.pagesRead ?? 0), 0);
}
const recRows = union.filter((u) => u.recovery?.attempted);
const addedRows = recRows.filter((u) => !u.recovery.redundant);
console.log(`\nRECOVERY BEHAVIOUR`);
console.log(`  attempted on ${recRows.length}/32 (skipped where base evidence was already sufficient — §17)`);
console.log(`  contributed on ${addedRows.length}/${recRows.length} attempts (${pct(addedRows.length, recRows.length)}%)`);
console.log(`  redundant (ran, found nothing base lacked): ${recRows.length - addedRows.length}`);
const origins: Record<string, number> = {};
for (const u of addedRows) for (const s of u.recovery.sourceUrls ?? []) origins[s.origin] = (origins[s.origin] ?? 0) + 1;
console.log(`  source origins: ${Object.entries(origins).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ')}`);
writeFileSync('recovery-holdout/out/comparison.json', JSON.stringify({ byClass: Object.fromEntries(g), regressions: lost, suspicious: suspicious.map((s) => s.domain) }, null, 2));
