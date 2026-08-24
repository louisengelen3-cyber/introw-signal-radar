/**
 * The mandate invites this conclusion: "Physical-sector partner networks are publicly
 * discoverable through directories, but their operational model remains too private for
 * automatic dossier construction." This tests it directly.
 *
 * A LOCATOR addresses a consumer ("find an installer near you") and proves only that a
 * network exists. A PROGRAMME surface addresses a business ("become a partner", tiers,
 * portal, deal registration) and proves the company operates and manages that network.
 * Conflating them would let network existence masquerade as operational ownership.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const SOFT = new Set(['saas_software', 'cybersecurity_it', 'fintech', 'hr_business_software', 'hospitality_tech', 'ecommerce_tech', 'martech_salestech']);
const cls = (c: string) => (SOFT.has(c) ? 'software' : 'physical');
const rec: any[] = JSON.parse(readFileSync('audit/out/recovery-full.json', 'utf8'));
const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 100));

const LOCATOR_DIR = new Set(['installer_locator', 'dealer_locator', 'service_network', 'distributor_directory']);
// Surfaces that address a BUSINESS, i.e. evidence the company manages the network.
const PROGRAMME = new Set(['partner_recruitment', 'application', 'deal_registration', 'portal', 'partner_portal',
  'programme_tiers', 'tiering', 'certification', 'training', 'lead_routing']);

const g: Record<string, any> = {};
for (const k of ['software', 'physical']) g[k] = { n: 0, motion: 0, locatorOnly: 0, programme: 0, both: 0, neither: 0 };
const locatorOnly: any[] = [];

for (const r of rec) {
  const k = cls(r.cohort), c = g[k];
  c.n++;
  if (!r.motion) { c.neither++; continue; }
  c.motion++;
  const surfaces = [...(r.confirmedSurfaces ?? []), ...(r.tradeSurfaces ?? [])];
  const hasProgramme = surfaces.some((s: string) => PROGRAMME.has(s)) || (r.programmes ?? []).length > 0;
  const hasLocator = r.directoryType != null && LOCATOR_DIR.has(r.directoryType);
  if (hasProgramme && hasLocator) c.both++;
  else if (hasProgramme) c.programme++;
  else if (hasLocator) { c.locatorOnly++; locatorOnly.push(r); }
  else c.locatorOnly++, locatorOnly.push(r);
}

console.log('DOES THE EVIDENCE SHOW A NETWORK, OR A COMPANY OPERATING ONE?\n');
console.log('sector      n   motion   programme evidence   locator/weak only   no motion');
console.log('─'.repeat(80));
for (const k of ['software', 'physical']) {
  const c = g[k];
  const prog = c.programme + c.both;
  console.log(`${k.padEnd(10)} ${String(c.n).padStart(2)}   ${String(c.motion).padStart(3)}     ${String(prog).padStart(3)} (${String(pct(prog, c.n)).padStart(2)}% of all)      ${String(c.locatorOnly).padStart(3)} (${String(pct(c.locatorOnly, c.n)).padStart(2)}%)          ${String(c.neither).padStart(3)}`);
}
console.log(`\nOF COMPANIES WITH ANY MOTION EVIDENCE, HOW MUCH IS OPERATIONAL?`);
for (const k of ['software', 'physical']) {
  const c = g[k]; const prog = c.programme + c.both;
  console.log(`  ${k.padEnd(9)} ${prog}/${c.motion} = ${pct(prog, c.motion)}% carry business-facing programme evidence`);
}
console.log(`\nLOCATOR-ONLY / WEAK COMPANIES (${locatorOnly.length}) — a network is visible, its operation is not:`);
for (const r of locatorOnly.sort((a, b) => cls(a.cohort).localeCompare(cls(b.cohort)) || a.domain.localeCompare(b.domain)))
  console.log(`  [${cls(r.cohort).padEnd(8)}] ${r.domain.padEnd(24)} ${String(r.directoryType ?? '-').padEnd(24)} surfaces=${[...(r.confirmedSurfaces ?? []), ...(r.tradeSurfaces ?? [])].join(',') || '—'}`);
writeFileSync('audit/out/locator-vs-programme.json', JSON.stringify({ byClass: g, locatorOnly: locatorOnly.map((r) => ({ domain: r.domain, cls: cls(r.cohort), directoryType: r.directoryType })) }, null, 2));
