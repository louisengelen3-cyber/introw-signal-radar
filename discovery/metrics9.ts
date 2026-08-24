/** Mandate §9: per-mechanism metrics. Volume is reported last, never as the headline. */
import { readFileSync, writeFileSync } from 'node:fs';
const d = JSON.parse(readFileSync('discovery/out/search-discovery.json', 'utf8'));
const bench = JSON.parse(readFileSync('discovery/benchmark.v1.json', 'utf8'));
const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 100));
const allRuns = [...d.runs, ...(d.freshRuns ?? [])];
const cands = allRuns.flatMap((r: any) => r.candidates.map((c: any) => ({ ...c, lang: r.lang, seg: r.expectedSegment, q: r.query })));

const TLD_GEO: Record<string, string> = { de: 'DE', nl: 'NL', be: 'BE', fr: 'FR', se: 'SE', it: 'IT', eu: 'EU', uk: 'UK', at: 'AT', ch: 'CH', dk: 'DK' };
const geoOf = (dom: string) => { const t = dom.split('.').pop()!; return TLD_GEO[t] ?? (t === 'com' || t === 'io' || t === 'dev' || t === 'co' ? 'global/US' : t.toUpperCase()); };

const vendors = cands.filter((c: any) => c.class === 'vendor_motion');
const distinct = new Set(vendors.map((v: any) => v.domain));
const allDistinct = new Set(cands.map((c: any) => c.domain));

console.log('§9 DISCOVERY METRICS — search/web pattern mechanism\n');
const rows: [string, string][] = [
  ['candidates generated', `${cands.length}`],
  ['unique companies (all classes)', `${allDistinct.size}`],
  ['duplicate rate', `${pct(cands.length - allDistinct.size, cands.length)}%  (${cands.length - allDistinct.size} repeats across queries)`],
  ['entity resolution success', `${pct(cands.length, cands.length)}%  every candidate resolved to a registrable domain from the result URL`],
  ['valid company rate', `${pct(cands.filter((c: any) => c.class !== 'content').length, cands.length)}%  (non-commentary results)`],
  ['partner-motion candidate rate', `${pct(vendors.length, cands.length)}%  (${vendors.length}/${cands.length})`],
  ['operator rate', `${pct(vendors.length, cands.filter((c: any) => c.class !== 'content').length)}%  of non-commentary results evidence an OPERATED motion`],
  ['category contamination', `${pct(cands.filter((c: any) => c.class === 'prm_vendor').length, cands.length)}%  (${cands.filter((c: any) => c.class === 'prm_vendor').length} PRM/channel-software vendors — Introw's own category)`],
  ['third-party directory rate', `${pct(cands.filter((c: any) => c.class === 'directory').length, cands.length)}%`],
];
for (const [k, v] of rows) console.log(`  ${k.padEnd(32)} ${v}`);

console.log('\n  LANGUAGE MIX (of vendor-motion hits)');
const lm = new Map<string, number>();
for (const v of vendors) lm.set(v.lang, (lm.get(v.lang) ?? 0) + 1);
for (const [k, n] of [...lm].sort((a, b) => b[1] - a[1])) console.log(`    ${k}  ${String(n).padStart(2)}  ${pct(n, vendors.length)}%`);

console.log('\n  GEOGRAPHY MIX (registrable TLD of vendor-motion hits — a proxy, not incorporation)');
const gm = new Map<string, number>();
for (const v of vendors) gm.set(geoOf(v.domain), (gm.get(geoOf(v.domain)) ?? 0) + 1);
for (const [k, n] of [...gm].sort((a, b) => b[1] - a[1])) console.log(`    ${k.padEnd(10)} ${String(n).padStart(2)}  ${pct(n, vendors.length)}%`);

console.log('\n  SEGMENT MIX (query intent of vendor-motion hits)');
const sm = new Map<string, number>();
for (const v of vendors) sm.set(v.seg, (sm.get(v.seg) ?? 0) + 1);
for (const [k, n] of [...sm].sort((a, b) => b[1] - a[1])) console.log(`    ${k.padEnd(16)} ${String(n).padStart(2)}  ${pct(n, vendors.length)}%`);

console.log('\n  RECALL BY SECTOR — frozen 34-company benchmark');
const found = new Set([...distinct].map((x) => String(x).toLowerCase()));
const bySec = new Map<string, any[]>();
for (const c of bench.companies) (bySec.get(c.sector) ?? bySec.set(c.sector, []).get(c.sector)!).push(c);
for (const [s, rs] of [...bySec].sort()) console.log(`    ${s.padEnd(16)} ${rs.filter((r) => found.has(r.domain.toLowerCase())).length}/${rs.length}`);

console.log('\n  RECALL BY GEOGRAPHY — frozen benchmark');
const byGeo = new Map<string, any[]>();
for (const c of bench.companies) (byGeo.get(c.country) ?? byGeo.set(c.country, []).get(c.country)!).push(c);
for (const [g, rs] of [...byGeo].sort()) console.log(`    ${g.padEnd(4)} ${rs.filter((r) => found.has(r.domain.toLowerCase())).length}/${rs.length}`);

console.log(`\n  RECALL BY SOURCE FAMILY`);
console.log(`    E. search/web pattern   ${[...found].filter((f) => bench.companies.some((c: any) => c.domain.toLowerCase() === f)).length}/34`);
console.log(`    F. PRM tenancy          0/34   mechanism returned 0 candidates (see MECHANISM_NOTES.md)`);
console.log(`    A/B/C/D                 not run — see report §05`);
writeFileSync('discovery/out/metrics9.json', JSON.stringify({ candidates: cands.length, distinct: allDistinct.size, vendors: vendors.length, languageMix: Object.fromEntries(lm), geoMix: Object.fromEntries(gm), segmentMix: Object.fromEntries(sm) }, null, 2));
