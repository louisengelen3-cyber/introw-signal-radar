/**
 * PHASE E scoping measurement. Before building JS rendering or PDF extraction, measure how
 * much evidence is actually lost to them. Building a headless browser is only justified if
 * the loss is material; the mandate asks for BOUNDED recovery, so the measurement comes first.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const SOFT = new Set(['saas_software', 'cybersecurity_it', 'fintech', 'hr_business_software', 'hospitality_tech', 'ecommerce_tech', 'martech_salestech']);
const cls = (c: string) => (SOFT.has(c) ? 'software' : 'physical');
const rec: any[] = JSON.parse(readFileSync('audit/out/recovery-full.json', 'utf8'));
const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 100));

const g: Record<string, any> = {};
for (const k of ['software', 'physical']) g[k] = { n: 0, noSurface: 0, surfaceButNoRead: 0, readNoMotion: 0, motion: 0, pdfSurfaces: 0 };
const stranded: any[] = [];
for (const r of rec) {
  const k = cls(r.cohort), c = g[k];
  c.n++;
  const surf = r.surfacesFound ?? 0, read = r.pagesRead ?? 0;
  if (surf === 0) c.noSurface++;
  else if (read === 0) { c.surfaceButNoRead++; stranded.push({ ...r, why: 'surfaces found, none readable' }); }
  else if (!r.motion) { c.readNoMotion++; stranded.push({ ...r, why: 'pages read, no motion detected' }); }
  if (r.motion) c.motion++;
  c.pdfSurfaces += (r.sampleUrls ?? []).filter((u: string) => /\.pdf(\?|$)/i.test(u)).length;
}
console.log('WHERE COMPANIES ARE LOST — after Phase A+B+D recovery\n');
console.log('sector      n   no surface   surface but   pages read     motion   pdf');
console.log('                 found        unreadable    no motion              surfaces');
console.log('─'.repeat(78));
for (const k of ['software', 'physical']) {
  const c = g[k];
  console.log(`${k.padEnd(10)} ${String(c.n).padStart(2)}   ${String(c.noSurface).padStart(3)} (${String(pct(c.noSurface, c.n)).padStart(2)}%)   ${String(c.surfaceButNoRead).padStart(3)} (${String(pct(c.surfaceButNoRead, c.n)).padStart(2)}%)    ${String(c.readNoMotion).padStart(3)} (${String(pct(c.readNoMotion, c.n)).padStart(2)}%)   ${String(c.motion).padStart(3)} (${String(pct(c.motion, c.n)).padStart(2)}%)  ${String(c.pdfSurfaces).padStart(4)}`);
}
console.log(`\nPHASE E ADDRESSABLE CEILING`);
const tot = g.software.surfaceButNoRead + g.physical.surfaceButNoRead;
console.log(`  Companies where a surface WAS located but no page could be read: ${tot}/106 (${pct(tot, 106)}%)`);
console.log(`  These are the only companies JS rendering could possibly help. Everything else`);
console.log(`  either had no surface to render, or had readable pages that simply said nothing.`);
console.log(`  PDF surfaces recovered across all 106: ${g.software.pdfSurfaces + g.physical.pdfSurfaces}`);
console.log(`\nSTRANDED COMPANIES (${stranded.length}) — recovery reached them but produced no motion evidence:`);
for (const s of stranded.sort((a, b) => cls(a.cohort).localeCompare(cls(b.cohort)) || a.domain.localeCompare(b.domain)))
  console.log(`  [${cls(s.cohort).padEnd(8)}] ${s.domain.padEnd(24)} surf=${String(s.surfacesFound).padStart(2)} read=${String(s.pagesRead).padStart(2)} soft404=${String(s.softNotFound ?? 0).padStart(2)}  ${s.why}`);
writeFileSync('audit/out/phase-e.json', JSON.stringify({ byClass: g, stranded: stranded.map((s) => ({ domain: s.domain, cls: cls(s.cohort), surfacesFound: s.surfacesFound, pagesRead: s.pagesRead, why: s.why })) }, null, 2));
