/** §50: outcomes for the newly discovered batch. Counts only — never a ranking. */
import { readFileSync } from 'node:fs';
const rows: any[] = JSON.parse(readFileSync('discovery/batch/out-research.json', 'utf8'));
const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 100));
const ok = rows.filter((r) => !r.error);

console.log(`NEW COMPANIES RESEARCHED: ${rows.length}  (errors: ${rows.length - ok.length})\n`);

const fits: Record<string, number> = {};
for (const r of ok) fits[r.fit] = (fits[r.fit] ?? 0) + 1;
console.log('INTROW RELEVANCE OUTCOMES (§50)');
for (const k of ['plausible_introw_fit', 'research_required', 'likely_not_fit', 'under_observed', 'suppress']) {
  console.log(`  ${k.padEnd(22)} ${String(fits[k] ?? 0).padStart(3)}  ${pct(fits[k] ?? 0, ok.length)}%`);
}

console.log('\nPLAUSIBLE INTROW FIT — the accounts a seller could open (§07)');
for (const r of ok.filter((x) => x.fit === 'plausible_introw_fit')) {
  console.log(`  ${r.domain.padEnd(26)} [${r.geo}/${r.sector}]  crm=${r.crm.vendor ? `${r.crm.vendor}/${r.crm.level}` : 'unknown'}`);
  console.log(`     ${r.fitReasons[0]}`);
}

console.log('\nCRM COVERAGE ACROSS NEW ACCOUNTS (§50)');
const lv: Record<string, number> = {};
for (const r of ok) lv[r.crm.level] = (lv[r.crm.level] ?? 0) + 1;
for (const [k, v] of Object.entries(lv).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(22)} ${String(v).padStart(3)}  ${pct(v, ok.length)}%`);
const decisive = ok.filter((r) => /^confirmed_/.test(r.crm.level));
const vend: Record<string, number> = {};
for (const r of decisive) vend[r.crm.vendor] = (vend[r.crm.vendor] ?? 0) + 1;
console.log(`  decisive by vendor: ${Object.entries(vend).map(([k, v]) => `${k}=${v}`).join('  ') || 'none'}`);
console.log(`  conflicts: ${ok.filter((r) => r.crm.conflict).length}`);

console.log('\nWHAT UNLOCKED THE CRM CONCLUSIONS (§60 J/K/L)');
const byNonPartner = decisive.filter((r) => r.crm.jobTitle && !/partner|channel|allian|reseller/i.test(r.crm.jobTitle));
const byHistorical = decisive.filter((r) => r.crm.level !== 'confirmed_current');
console.log(`  decisive conclusions:                  ${decisive.length}`);
console.log(`  from a NON-partnership job title:      ${byNonPartner.length}`);
for (const r of byNonPartner) console.log(`     ${r.domain.padEnd(24)} ${r.crm.vendor}/${r.crm.level}  "${r.crm.jobTitle}"`);
console.log(`  historical/recent rather than current: ${byHistorical.length}`);

console.log('\nRESEARCH REACH');
const withVac = ok.filter((r) => (r.crmCoverage?.vacanciesRead ?? 0) > 0);
const withAts = ok.filter((r) => r.crmCoverage?.atsBoardFound);
console.log(`  ATS board attributable:        ${withAts.length}/${ok.length} (${pct(withAts.length, ok.length)}%)`);
console.log(`  any vacancy read:              ${withVac.length}/${ok.length} (${pct(withVac.length, ok.length)}%)`);
console.log(`  reached WITHOUT a board:       ${ok.filter((r) => !r.crmCoverage?.atsBoardFound && (r.crmCoverage?.vacanciesRead ?? 0) > 0).length}`);
console.log(`  total vacancies read:          ${ok.reduce((n, r) => n + (r.crmCoverage?.vacanciesRead ?? 0), 0)}`);

console.log('\nGEOGRAPHY / SECTOR (§03, §04)');
const g: Record<string, number> = {}, s: Record<string, number> = {};
for (const r of ok) { g[r.geo] = (g[r.geo] ?? 0) + 1; s[r.sector] = (s[r.sector] ?? 0) + 1; }
console.log(`  geo:    ${Object.entries(g).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`  sector: ${Object.entries(s).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`  discovery families: ${Object.entries(ok.reduce((a: any, r) => (a[r.discoveredVia] = (a[r.discoveredVia] ?? 0) + 1, a), {})).map(([k, v]) => `${k}=${v}`).join('  ')}`);

console.log('\nRECOVERY CONTRIBUTION ON NEW ACCOUNTS');
console.log(`  accounts where recovery added evidence: ${ok.filter((r) => (r.recoveryAdded ?? []).length > 0).length}`);

console.log(`\nRESEARCH COST (§27)`);
console.log(`  total wall-clock seconds: ${ok.reduce((n, r) => n + (r.seconds ?? 0), 0)}  (${Math.round(ok.reduce((n, r) => n + (r.seconds ?? 0), 0) / Math.max(ok.length, 1))}s per account)`);
