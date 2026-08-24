/** Analysis of the cross-industry run. Read-only. */
import { readFileSync } from 'node:fs';

const rows = JSON.parse(readFileSync(new URL('./out/cross-industry.json', import.meta.url).pathname, 'utf8')) as any[];
const SOFT = new Set(['saas_software', 'cybersecurity_it', 'fintech', 'hr_business_software', 'hospitality_tech', 'ecommerce_tech', 'martech_salestech']);
const isSoft = (c: string) => SOFT.has(c);

const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const median = (xs: number[]) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const FORWARD = new Set(['strong_evidence', 'plausible', 'research']);

const cohorts = [...new Set(rows.map((r) => r.cohort))];
const w = (x: any, n: number) => String(x).padEnd(n);

console.log(`CROSS-INDUSTRY RUN — n=${rows.length}\n`);
console.log(w('cohort', 24) + w('n', 4) + w('reach', 7) + w('motion', 8) + w('under-obs', 11) + w('med.claims', 12) + w('CRM', 6) + w('ATS', 6) + w('forwarded', 10));
console.log('-'.repeat(88));

const line = (label: string, rs: any[]) => {
  const reach = rs.filter((r) => r.reachable).length;
  const motion = rs.filter((r) => r.programmes.length > 0 || r.surfacesConfirmed.length > 0).length;
  const under = rs.filter((r) => r.machineState === 'under_observed').length;
  const crm = rs.filter((r) => r.crm !== 'unknown').length;
  const ats = rs.filter((r) => r.atsBoard).length;
  const fwd = rs.filter((r) => FORWARD.has(r.machineState)).length;
  console.log(
    w(label, 24) + w(rs.length, 4) + w(`${pct(reach, rs.length)}%`, 7) + w(`${pct(motion, rs.length)}%`, 8) +
    w(`${pct(under, rs.length)}%`, 11) + w(median(rs.map((r) => r.distinctClaims)), 12) +
    w(`${pct(crm, rs.length)}%`, 6) + w(`${pct(ats, rs.length)}%`, 6) + w(`${pct(fwd, rs.length)}%`, 10),
  );
};

for (const c of cohorts) line(c, rows.filter((r) => r.cohort === c));
console.log('-'.repeat(88));
line('ALL SOFTWARE', rows.filter((r) => isSoft(r.cohort)));
line('ALL PHYSICAL/INDUSTRIAL', rows.filter((r) => !isSoft(r.cohort)));

const soft = rows.filter((r) => isSoft(r.cohort));
const phys = rows.filter((r) => !isSoft(r.cohort));

console.log(`\nHEADLINE GAPS (software − physical, percentage points)`);
const gap = (label: string, f: (r: any) => boolean) =>
  console.log(`  ${label.padEnd(34)} ${String(pct(soft.filter(f).length, soft.length)).padStart(3)}%  vs ${String(pct(phys.filter(f).length, phys.length)).padStart(3)}%   ${pct(soft.filter(f).length, soft.length) - pct(phys.filter(f).length, phys.length) >= 0 ? '+' : ''}${pct(soft.filter(f).length, soft.length) - pct(phys.filter(f).length, phys.length)}`);
gap('site reachable', (r) => r.reachable);
gap('partner motion identified', (r) => r.programmes.length > 0 || r.surfacesConfirmed.length > 0);
gap('under-observed', (r) => r.machineState === 'under_observed');
gap('forwarded to a seller', (r) => FORWARD.has(r.machineState));
gap('CRM established', (r) => r.crm !== 'unknown');
gap('ATS board attributed', (r) => !!r.atsBoard);
gap('partner page returned content', (r) => r.partnerPathsFound > 0);
gap('directory found', (r) => r.directory !== null);
console.log(`  ${'median distinct claims'.padEnd(34)} ${String(median(soft.map((r) => r.distinctClaims))).padStart(3)}   vs ${String(median(phys.map((r) => r.distinctClaims))).padStart(3)}`);
console.log(`  ${'median pages read'.padEnd(34)} ${String(median(soft.map((r) => r.pagesRead))).padStart(3)}   vs ${String(median(phys.map((r) => r.pagesRead))).padStart(3)}`);

console.log(`\nCATEGORY CLASSIFICATION BY GROUP`);
for (const [label, rs] of [['software', soft], ['physical', phys]] as [string, any[]][]) {
  const t: Record<string, number> = {};
  for (const r of rs) t[r.category] = (t[r.category] ?? 0) + 1;
  console.log(`  ${label.padEnd(10)} ${Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ')}`);
}

console.log(`\nPUBLICATION-DENSITY EFFECT (does forwarding track pages read?)`);
for (const [lab, f] of [['pages read >= 8', (r: any) => r.pagesRead >= 8], ['4-7', (r: any) => r.pagesRead >= 4 && r.pagesRead <= 7], ['1-3', (r: any) => r.pagesRead >= 1 && r.pagesRead <= 3], ['0', (r: any) => r.pagesRead === 0]] as [string, (r: any) => boolean][]) {
  const g = rows.filter(f);
  console.log(`  ${lab.padEnd(16)} forwarded ${g.filter((r) => FORWARD.has(r.machineState)).length}/${g.length}  (${pct(g.filter((r) => FORWARD.has(r.machineState)).length, g.length)}%)`);
}

console.log(`\nGEOGRAPHY (n>=4)`);
const byGeo = new Map<string, any[]>();
for (const r of rows) { const l = byGeo.get(r.country) ?? []; l.push(r); byGeo.set(r.country, l); }
for (const [c, rs] of [...byGeo.entries()].filter(([, rs]) => rs.length >= 4).sort((a, b) => b[1].length - a[1].length))
  console.log(`  ${c}  n=${String(rs.length).padEnd(3)} motion ${pct(rs.filter((r) => r.programmes.length || r.surfacesConfirmed.length).length, rs.length)}%  under-observed ${pct(rs.filter((r) => r.machineState === 'under_observed').length, rs.length)}%  med.claims ${median(rs.map((r) => r.distinctClaims))}`);

console.log(`\nNAMED INTROW CUSTOMERS IN THE BENCHMARK`);
for (const r of rows.filter((r) => r.note?.includes('Introw customer')))
  console.log(`  ${r.domain.padEnd(22)} ${r.machineState.padEnd(20)} claims=${String(r.distinctClaims).padEnd(3)} motion=${r.programmes.length + r.surfacesConfirmed.length > 0 ? 'yes' : 'NO'}  category=${r.category}`);
