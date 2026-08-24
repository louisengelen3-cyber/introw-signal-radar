/**
 * Recovery is not a superset of production: it reads a different page set (sitemap-first)
 * than production does (path probe). The only configuration that could ever ship is the
 * UNION — recovery added as an extra source, never as a replacement. This measures that,
 * and quantifies how complementary the two actually are.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SOFT = new Set(['saas_software', 'cybersecurity_it', 'fintech', 'hr_business_software', 'hospitality_tech', 'ecommerce_tech', 'martech_salestech']);
const cls = (c: string) => (SOFT.has(c) ? 'software' : 'physical');
type Row = Record<string, any>;
const base: Row[] = JSON.parse(readFileSync('audit/baseline/cross-industry.BASELINE.json', 'utf8'));
const rec: Row[] = JSON.parse(readFileSync('audit/out/recovery-full.json', 'utf8'));
const bIdx = new Map(base.map((r) => [r.domain, r]));
const bM = (r: Row) => (r.programmes ?? []).length > 0 || (r.surfacesConfirmed ?? []).length > 0;
const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

type C = { n: number; b: number; r: number; u: number; bOnly: number; rOnly: number; both: number; neither: number; bDir: number; rDir: number; uDir: number };
const blank = (): C => ({ n: 0, b: 0, r: 0, u: 0, bOnly: 0, rOnly: 0, both: 0, neither: 0, bDir: 0, rDir: 0, uDir: 0 });
const g = new Map<string, C>([['software', blank()], ['physical', blank()]]);

for (const r of rec) {
  const b = bIdx.get(r.domain); if (!b) continue;
  const c = g.get(cls(r.cohort))!;
  const mb = bM(b), mr = !!r.motion;
  const db = b.directory != null, dr = r.directory != null || r.directoryType != null;
  c.n++;
  if (mb) c.b++; if (mr) c.r++; if (mb || mr) c.u++;
  if (mb && !mr) c.bOnly++; if (!mb && mr) c.rOnly++; if (mb && mr) c.both++; if (!mb && !mr) c.neither++;
  if (db) c.bDir++; if (dr) c.rDir++; if (db || dr) c.uDir++;
}

console.log('MOTION EVIDENCE — production alone vs recovery alone vs union\n');
console.log('sector      n   production  recovery   UNION      prod-only  rec-only  both  neither');
console.log('─'.repeat(88));
for (const k of ['software', 'physical']) {
  const c = g.get(k)!;
  console.log(`${k.padEnd(10)} ${String(c.n).padStart(2)}   ${String(pct(c.b, c.n) + '%').padStart(8)}   ${String(pct(c.r, c.n) + '%').padStart(7)}   ${String(pct(c.u, c.n) + '%').padStart(6)}     ${String(c.bOnly).padStart(6)}    ${String(c.rOnly).padStart(6)}  ${String(c.both).padStart(4)}  ${String(c.neither).padStart(6)}`);
}
const sw = g.get('software')!, ph = g.get('physical')!;
console.log(`\nSOFTWARE−PHYSICAL MOTION GAP`);
console.log(`  production alone: ${pct(sw.b, sw.n) - pct(ph.b, ph.n)} pts`);
console.log(`  recovery alone:   ${pct(sw.r, sw.n) - pct(ph.r, ph.n)} pts`);
console.log(`  UNION:            ${pct(sw.u, sw.n) - pct(ph.u, ph.n)} pts`);
console.log(`\nDIRECTORY DETECTION (production → union)`);
for (const k of ['software', 'physical']) { const c = g.get(k)!; console.log(`  ${k.padEnd(9)} ${c.bDir} → ${c.uDir} of ${c.n}   (${pct(c.bDir, c.n)}% → ${pct(c.uDir, c.n)}%)`); }
console.log(`\nCOMPLEMENTARITY — of companies with motion evidence in the union:`);
for (const k of ['software', 'physical']) {
  const c = g.get(k)!;
  console.log(`  ${k.padEnd(9)} ${c.u} total: ${c.both} found by both, ${c.bOnly} only by production, ${c.rOnly} only by recovery  →  ${pct(c.rOnly, c.u)}% of union depends on recovery`);
}
writeFileSync('audit/out/union.json', JSON.stringify(Object.fromEntries(g), null, 2));
