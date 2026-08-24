/**
 * QUESTION A measurement: can the system find channel-operating companies WITHOUT being
 * handed domains? Three numbers matter and they are reported separately, never blended:
 *   PRECISION  — of what a query returns, how much is a vendor operating a motion
 *   REACH      — which sectors/languages yield vendors at all
 *   RECALL     — against the frozen 34-company benchmark, how many surface unnamed
 */
import { readFileSync, writeFileSync } from 'node:fs';
const d = JSON.parse(readFileSync('discovery/out/search-discovery.json', 'utf8'));
const bench = JSON.parse(readFileSync('discovery/benchmark.v1.json', 'utf8'));
const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 100));

console.log('PER-QUERY PRECISION (vendor_motion / all candidates)\n');
console.log('lang seg              vendor prm content dir  total  precision  query');
console.log('─'.repeat(122));
const byLang = new Map<string, { v: number; t: number; q: number }>();
for (const r of d.runs) {
  const c = { vendor_motion: 0, prm_vendor: 0, content: 0, directory: 0 } as Record<string, number>;
  for (const x of r.candidates) c[x.class]++;
  const t = r.candidates.length;
  const g = byLang.get(r.lang) ?? { v: 0, t: 0, q: 0 };
  g.v += c.vendor_motion; g.t += t; g.q++; byLang.set(r.lang, g);
  console.log(`${r.lang.padEnd(4)} ${String(r.expectedSegment).padEnd(16)} ${String(c.vendor_motion).padStart(5)} ${String(c.prm_vendor).padStart(4)} ${String(c.content).padStart(6)} ${String(c.directory).padStart(4)} ${String(t).padStart(5)}  ${String(pct(c.vendor_motion, t) + '%').padStart(8)}   ${r.query.slice(0, 52)}`);
}
console.log('\nPRECISION BY LANGUAGE');
for (const [l, g] of [...byLang].sort((a, b) => b[1].v / b[1].t - a[1].v / a[1].t))
  console.log(`  ${l}  ${String(g.q).padStart(2)} queries  ${String(g.v).padStart(2)}/${String(g.t).padStart(2)} vendors  ${pct(g.v, g.t)}%`);

const all = d.runs.flatMap((r: any) => r.candidates.map((c: any) => ({ ...c, lang: r.lang, seg: r.expectedSegment })));
const vendors = all.filter((c: any) => c.class === 'vendor_motion');
const uniq = new Set(vendors.map((v: any) => v.domain));
console.log(`\nTOTALS: ${d.runs.length} queries, ${all.length} candidates, ${vendors.length} vendor-motion hits, ${uniq.size} distinct companies`);
console.log(`  overall precision ${pct(vendors.length, all.length)}%`);
console.log(`  PRM-vendor contamination (own category returned as candidate): ${all.filter((c: any) => c.class === 'prm_vendor').length}`);
console.log(`  commentary/noise: ${all.filter((c: any) => c.class === 'content').length}`);

// RECALL — a benchmark company counts as recalled only if a query that never named it returned it.
const found = new Set([...uniq].map((x) => String(x).toLowerCase()));
const rows = bench.companies.map((c: any) => ({ ...c, hit: found.has(c.domain.toLowerCase()) }));
console.log(`\nRECALL vs frozen 34-company benchmark`);
const bySec = new Map<string, any[]>();
for (const r of rows) (bySec.get(r.sector) ?? bySec.set(r.sector, []).get(r.sector)!).push(r);
for (const [s, rs] of [...bySec].sort()) {
  const h = rs.filter((r) => r.hit);
  console.log(`  ${s.padEnd(16)} ${h.length}/${rs.length}  ${h.map((r) => r.domain).join(' ') || '—'}`);
}
const hits = rows.filter((r: any) => r.hit);
console.log(`  TOTAL ${hits.length}/${rows.length} = ${pct(hits.length, rows.length)}%`);
console.log(`\n  NOTE: ${d.runs.length} queries cannot address 34 companies across 10 sectors. Recall here measures`);
console.log(`  whether the MECHANISM can resurface known operators unnamed, not a ceiling on coverage.`);

// HOLDOUT: languages never used in construction.
if (d.freshRuns) {
  console.log(`\nHOLDOUT GENERALISATION (languages absent from src/recovery/trade.ts)`);
  let hv = 0, ht = 0;
  for (const r of d.freshRuns) {
    const v = r.candidates.filter((c: any) => c.class === 'vendor_motion').length;
    hv += v; ht += r.candidates.length;
    console.log(`  ${r.lang}  ${v}/${r.candidates.length} = ${pct(v, r.candidates.length)}%   ${r.query}`);
  }
  console.log(`  COMBINED ${hv}/${ht} = ${pct(hv, ht)}%   vs ${pct(vendors.length, all.length)}% on the construction slice`);
}

// New companies — discovered, not on any list held before.
const benchDomains = new Set(bench.companies.map((c: any) => c.domain.toLowerCase()));
const novel = [...uniq].filter((x) => !benchDomains.has(String(x).toLowerCase()));
console.log(`\nNOVEL COMPANIES (vendor motion, not in the benchmark, never named in a query): ${novel.length}`);
console.log('  ' + novel.sort().join('\n  '));
writeFileSync('discovery/out/measurement.json', JSON.stringify({
  queries: d.runs.length, candidates: all.length, vendors: vendors.length, distinct: uniq.size,
  precision: pct(vendors.length, all.length),
  byLang: Object.fromEntries([...byLang].map(([k, v]) => [k, { queries: v.q, vendors: v.v, candidates: v.t, precision: pct(v.v, v.t) }])),
  recall: { hits: hits.length, total: rows.length, pct: pct(hits.length, rows.length), bySector: Object.fromEntries([...bySec].map(([s, rs]) => [s, `${rs.filter((r: any) => r.hit).length}/${rs.length}`])) },
  novel,
}, null, 2));
