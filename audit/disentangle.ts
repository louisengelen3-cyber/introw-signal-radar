/**
 * Is it SECTOR, or is it PUBLICATION CONVENTION?
 *
 * The red team's methodologist argued the cohorts are confounded: German industrials publish
 * across country subdomains in German behind logins, and English-language single-domain
 * marketing stacks are what the Radar reads well. Sector and publication convention move
 * together in the benchmark, so the headline gap cannot separate them. This cuts the same
 * data the other way.
 */
import { readFileSync } from 'node:fs';
const rows = JSON.parse(readFileSync(new URL('./out/cross-industry.json', import.meta.url).pathname, 'utf8')) as any[];
const SOFT = new Set(['saas_software', 'cybersecurity_it', 'fintech', 'hr_business_software', 'hospitality_tech', 'ecommerce_tech', 'martech_salestech']);
const isSoft = (r: any) => SOFT.has(r.cohort);
const ENGLISH_FIRST = new Set(['US', 'UK', 'IE', 'AU', 'IL', 'SE', 'NO', 'DK', 'NL']); // markets that publish in English by default
const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const med = (xs: number[]) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const motion = (r: any) => r.programmes.length > 0 || r.surfacesConfirmed.length > 0;

const cell = (rs: any[]) => rs.length
  ? `n=${String(rs.length).padStart(2)}  motion ${String(pct(rs.filter(motion).length, rs.length)).padStart(3)}%  under-obs ${String(pct(rs.filter((r) => r.machineState === 'under_observed').length, rs.length)).padStart(3)}%  med.claims ${med(rs.map((r) => r.distinctClaims))}`
  : 'n=0';

console.log('2×2 — SECTOR vs PUBLICATION LANGUAGE\n');
for (const [slab, sf] of [['SOFTWARE', isSoft], ['PHYSICAL', (r: any) => !isSoft(r)]] as [string, (r: any) => boolean][]) {
  for (const [llab, lf] of [['English-first market', (r: any) => ENGLISH_FIRST.has(r.country)], ['Non-English market', (r: any) => !ENGLISH_FIRST.has(r.country)]] as [string, (r: any) => boolean][]) {
    console.log(`  ${slab.padEnd(9)} × ${llab.padEnd(21)} ${cell(rows.filter((r) => sf(r) && lf(r)))}`);
  }
}

console.log('\nIF SECTOR DRIVES IT: physical should underperform software within EACH language column.');
console.log('IF LANGUAGE DRIVES IT: non-English should underperform English within EACH sector row.\n');

console.log('GERMANY ONLY — sector held against a single publication convention');
const de = rows.filter((r) => r.country === 'DE');
console.log(`  German software  ${cell(de.filter(isSoft))}`);
console.log(`  German physical  ${cell(de.filter((r) => !isSoft(r)))}`);

console.log('\nHARDWARE CONTROL GROUP — physical products, software-style publishing');
console.log(`  hardware_electronics  ${cell(rows.filter((r) => r.cohort === 'hardware_electronics'))}`);
console.log(`  iot_connected_devices ${cell(rows.filter((r) => r.cohort === 'iot_connected_devices'))}`);
console.log(`  industrial_automation ${cell(rows.filter((r) => r.cohort === 'industrial_automation'))}`);
console.log(`  manufacturing_equip.  ${cell(rows.filter((r) => r.cohort === 'manufacturing_equipment'))}`);

console.log('\nREACH vs YIELD — when the Radar DID find partner pages, did claims follow?');
const found = rows.filter((r) => r.partnerPathsFound >= 2);
for (const [lab, f] of [['software', isSoft], ['physical', (r: any) => !isSoft(r)]] as [string, (r: any) => boolean][]) {
  const g = found.filter(f);
  console.log(`  ${lab.padEnd(9)} with >=2 partner pages read: n=${g.length}  claims>0 in ${g.filter((r) => r.distinctClaims > 0).length} (${pct(g.filter((r) => r.distinctClaims > 0).length, g.length)}%)  med.claims ${med(g.map((r) => r.distinctClaims))}`);
}
console.log('\n  Cases where reach was good but yield collapsed (>=4 partner pages, 0 claims):');
for (const r of rows.filter((r) => r.partnerPathsFound >= 4 && r.distinctClaims === 0))
  console.log(`    ${r.domain.padEnd(24)} ${r.cohort.padEnd(24)} pages=${r.pagesRead} partnerPathsFound=${r.partnerPathsFound}`);

console.log('\nSITES THE RADAR COULD NOT READ AT ALL (0 pages)');
for (const r of rows.filter((r) => r.pagesRead === 0)) console.log(`    ${r.domain.padEnd(24)} ${r.cohort}`);
