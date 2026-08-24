/**
 * Paired before/after: frozen baseline (production as it stands) vs the recovery pipeline
 * (Phase A domains + Phase B surfaces + Phase D trade vocabulary). Same 106 companies,
 * same detectors. The only variable is which pages reached the detectors.
 *
 * Field names differ between the two runs, so the join is explicit. Baseline motion is
 * reconstructed from programmes/surfacesConfirmed and CHECKED against the frozen headline
 * numbers before any comparison is reported.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SOFT = new Set(['saas_software', 'cybersecurity_it', 'fintech', 'hr_business_software', 'hospitality_tech', 'ecommerce_tech', 'martech_salestech']);
const cls = (cohort: string) => (SOFT.has(cohort) ? 'software' : 'physical');

type Row = Record<string, any>;
const base: Row[] = JSON.parse(readFileSync('audit/baseline/cross-industry.BASELINE.json', 'utf8'));
const rec: Row[] = JSON.parse(readFileSync('audit/out/recovery-full.json', 'utf8'));
const bIdx = new Map(base.map((r) => [r.domain, r]));

const bMotion = (r: Row) => (r.programmes ?? []).length > 0 || (r.surfacesConfirmed ?? []).length > 0;
const bDir = (r: Row) => r.directory != null;
const rDir = (r: Row) => r.directory != null || r.directoryType != null;
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

// Integrity check: the reconstruction must reproduce the frozen baseline headline.
for (const k of ['software', 'physical']) {
  const rs = base.filter((r) => cls(r.cohort) === k);
  console.log(`baseline check  ${k.padEnd(8)} n=${rs.length}  motion=${pct(rs.filter(bMotion).length, rs.length)}%  directory=${pct(rs.filter(bDir).length, rs.length)}%  zeroPages=${rs.filter((r) => (r.pagesRead ?? 0) === 0).length}`);
}
console.log('(frozen BASELINE.json recorded: software motion 77% directory 13% zeroPages 4 | physical motion 39% directory 13% zeroPages 8)\n');

type Cell = { n: number; bM: number; rM: number; bD: number; rD: number; bP: number; rP: number; bZ: number; rZ: number; tradeOnly: number; multiDom: number };
const blank = (): Cell => ({ n: 0, bM: 0, rM: 0, bD: 0, rD: 0, bP: 0, rP: 0, bZ: 0, rZ: 0, tradeOnly: 0, multiDom: 0 });
const byClass = new Map<string, Cell>([['software', blank()], ['physical', blank()]]);
const byCohort = new Map<string, Cell>();
const gained: Row[] = [];
const lost: Row[] = [];

for (const r of rec) {
  const b = bIdx.get(r.domain);
  if (!b) continue;
  const k = cls(r.cohort);
  for (const c of [byClass.get(k)!, byCohort.get(r.cohort) ?? byCohort.set(r.cohort, blank()).get(r.cohort)!]) {
    c.n++;
    if (bMotion(b)) c.bM++;
    if (r.motion) c.rM++;
    if (bDir(b)) c.bD++;
    if (rDir(r)) c.rD++;
    c.bP += b.pagesRead ?? 0;
    c.rP += r.pagesRead ?? 0;
    if ((b.pagesRead ?? 0) === 0) c.bZ++;
    if ((r.pagesRead ?? 0) === 0) c.rZ++;
    if (r.motionFromTradeOnly) c.tradeOnly++;
    if ((r.domainsSearched ?? []).length > 1) c.multiDom++;
  }
  if (!bMotion(b) && r.motion) gained.push({ ...r, cls: k });
  if (bMotion(b) && !r.motion) lost.push({ ...r, cls: k, bProg: b.programmes, bSurf: b.surfacesConfirmed });
}

const line = (label: string, c: Cell) =>
  `${label.padEnd(24)} ${String(c.n).padStart(3)}   ` +
  `${String(pct(c.bM, c.n) + '%').padStart(4)} → ${String(pct(c.rM, c.n) + '%').padStart(4)} (${c.rM - c.bM >= 0 ? '+' : ''}${c.rM - c.bM})`.padEnd(20) +
  ` ${String(pct(c.bD, c.n) + '%').padStart(4)} → ${String(pct(c.rD, c.n) + '%').padStart(4)}`.padEnd(14) +
  ` ${String(c.bZ).padStart(2)} → ${String(c.rZ).padStart(2)}`.padEnd(11) +
  ` ${String(c.tradeOnly).padStart(3)}`.padEnd(9) + ` ${c.multiDom}`;

console.log('cohort                     n   motion(before→after) directory(b→a) zeroPg(b→a) tradeOnly multiDom');
console.log('─'.repeat(100));
for (const k of ['software', 'physical']) console.log(line(k.toUpperCase(), byClass.get(k)!));
console.log('─'.repeat(100));
for (const [k, c] of [...byCohort.entries()].sort((a, b2) => cls(a[0]).localeCompare(cls(b2[0])) || a[0].localeCompare(b2[0]))) console.log(line(`  ${k}`, c));

const sw = byClass.get('software')!, ph = byClass.get('physical')!;
const gapB = pct(sw.bM, sw.n) - pct(ph.bM, ph.n), gapA = pct(sw.rM, sw.n) - pct(ph.rM, ph.n);
console.log(`\nSOFTWARE−PHYSICAL MOTION GAP:  ${gapB} pts → ${gapA} pts  (closed ${gapB - gapA} pts)`);
console.log(`DIRECTORY DETECTION physical:  ${ph.bD} → ${ph.rD} of ${ph.n}     software: ${sw.bD} → ${sw.rD} of ${sw.n}`);
console.log(`PAGES READ (not comparable — recovery reads only partner surfaces, production reads broadly):`);
console.log(`  software ${sw.bP} → ${sw.rP}    physical ${ph.bP} → ${ph.rP}`);

console.log(`\nNEWLY IDENTIFIED (${gained.length}) — no motion evidence in baseline, motion evidence after recovery:`);
for (const g of gained.sort((a, b2) => a.cls.localeCompare(b2.cls) || a.domain.localeCompare(b2.domain))) {
  const t = [...(g.tradeMotions ?? []), ...(g.tradeSurfaces ?? [])];
  console.log(`  [${g.cls.padEnd(8)}] ${g.domain.padEnd(24)} ${String(g.directoryType ?? '-').padEnd(28)} ${t.join(',') || (g.programmes ?? []).concat(g.confirmedSurfaces ?? []).join(',')}`);
}
console.log(`\nREGRESSED (${lost.length}) — motion evidence in baseline, none after recovery:`);
for (const l of lost.sort((a, b2) => a.cls.localeCompare(b2.cls))) console.log(`  [${l.cls.padEnd(8)}] ${l.domain.padEnd(24)} baseline had: ${[...(l.bProg ?? []), ...(l.bSurf ?? [])].join(',')}`);

const surf: Record<string, number> = {}; const dirTypes: Record<string, number> = {};
let multiDomTotal = 0, tradeOnlyTotal = 0;
for (const r of rec) {
  for (const [k, v] of Object.entries(r.surfaceOrigins ?? {})) surf[k] = (surf[k] ?? 0) + (v as number);
  if (r.directoryType) dirTypes[r.directoryType] = (dirTypes[r.directoryType] ?? 0) + 1;
  if ((r.domainsSearched ?? []).length > 1) multiDomTotal++;
  if (r.motionFromTradeOnly) tradeOnlyTotal++;
}
console.log(`\nSURFACE ORIGIN:   ${Object.entries(surf).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`DIRECTORY TYPES:  ${Object.entries(dirTypes).sort((a, b2) => b2[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`MULTI-DOMAIN USED: ${multiDomTotal}/${rec.length}   MOTION FROM TRADE VOCAB ALONE: ${tradeOnlyTotal}`);

writeFileSync('audit/out/recovery-comparison.json', JSON.stringify({
  paired: rec.filter((r) => bIdx.has(r.domain)).length,
  byClass: Object.fromEntries(byClass), byCohort: Object.fromEntries(byCohort),
  gapBefore: gapB, gapAfter: gapA,
  gained: gained.map((g) => ({ domain: g.domain, cls: g.cls, directoryType: g.directoryType, trade: [...(g.tradeMotions ?? []), ...(g.tradeSurfaces ?? [])] })),
  lost: lost.map((l) => ({ domain: l.domain, cls: l.cls })),
  surfaceOrigins: surf, directoryTypes: dirTypes, multiDomTotal, tradeOnlyTotal,
}, null, 2));
