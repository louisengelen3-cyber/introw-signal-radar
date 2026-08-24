/** §51: existing-account CRM re-enrichment — before vs after, with attribution. */
import { readFileSync } from 'node:fs';
const rows: any[] = JSON.parse(readFileSync('crm-research/out/existing.json', 'utf8'));
const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 100));
const DECISIVE = new Set(['confirmed_current', 'confirmed_recent', 'confirmed_historical']);
const top = (r: any) => r.vendors?.[0] ?? null;

console.log(`EXISTING ACCOUNTS RE-ENRICHED: ${rows.length}\n`);

// Coverage first — how far did research actually reach?
const withVac = rows.filter((r) => (r.coverage?.vacanciesRead ?? 0) > 0);
const withAts = rows.filter((r) => r.coverage?.atsBoardFound);
console.log('RESEARCH REACH');
console.log(`  accounts with an attributable ATS board:      ${withAts.length}/${rows.length} (${pct(withAts.length, rows.length)}%)`);
console.log(`  accounts where ANY vacancy was read:          ${withVac.length}/${rows.length} (${pct(withVac.length, rows.length)}%)`);
console.log(`  vacancies read in total:                      ${rows.reduce((n, r) => n + (r.coverage?.vacanciesRead ?? 0), 0)}`);
console.log(`  reached WITHOUT an ATS board (§43 gain):      ${rows.filter((r) => !r.coverage?.atsBoardFound && (r.coverage?.vacanciesRead ?? 0) > 0).length}`);

// State transitions.
const norm = (s: string) => (s ?? 'unknown').replace(/_confirmed$/, '');
let unknownToConfirmed: any[] = [], supportingToConfirmed: any[] = [], downgraded: any[] = [],
    conflicts: any[] = [], historicalOnly: any[] = [], unchangedUnknown = 0, stillKnown: any[] = [];

for (const r of rows) {
  if (r.error) continue;
  const t = top(r);
  const prev = norm(r.previousCrmState);
  const hadPrev = prev !== 'unknown';
  const nowDecisive = t && DECISIVE.has(t.level);
  if (r.conflict) conflicts.push(r);
  if (!hadPrev && nowDecisive) unknownToConfirmed.push(r);
  else if (hadPrev && nowDecisive && t.vendor.toLowerCase() !== prev.toLowerCase()) downgraded.push(r);
  else if (hadPrev && !nowDecisive) downgraded.push(r);
  else if (hadPrev && nowDecisive) stillKnown.push(r);
  else if (!hadPrev && !nowDecisive) unchangedUnknown++;
  if (t && t.level === 'confirmed_historical') historicalOnly.push(r);
  if (!hadPrev && t && t.level === 'strong_supporting') supportingToConfirmed.push(r);
}

console.log(`\nSTATE CHANGES`);
console.log(`  UNKNOWN → CONFIRMED:        ${unknownToConfirmed.length}`);
for (const r of unknownToConfirmed) console.log(`     ${r.domain.padEnd(22)} ${top(r).vendor}/${top(r).level}  ← "${(top(r).jobTitle ?? top(r).sourceType)}"`);
console.log(`  CHANGED or DOWNGRADED:      ${downgraded.length}`);
for (const r of downgraded) console.log(`     ${r.domain.padEnd(22)} was ${r.previousCrmState} → ${top(r) ? `${top(r).vendor}/${top(r).level}` : 'unknown'}`);
console.log(`  CONFIRMED, unchanged vendor:${stillKnown.length}`);
console.log(`  still UNKNOWN:              ${unchangedUnknown}`);
console.log(`  HISTORICAL-ONLY:            ${historicalOnly.length} ${historicalOnly.map((r) => r.domain).join(', ')}`);
console.log(`  CONFLICTS FOUND:            ${conflicts.length}`);
for (const r of conflicts) console.log(`     ${r.domain.padEnd(22)} ${r.conflict.kind}: ${r.conflict.vendors.join(' + ')}`);

// §60 J/K/L attribution.
console.log(`\nWHAT UNLOCKED THE CONCLUSIONS`);
const decisiveRows = rows.filter((r) => top(r) && DECISIVE.has(top(r).level));
const byNonPartner = decisiveRows.filter((r) => {
  const t = top(r); if (!t?.jobTitle) return false;
  return !/partner|channel|alliance/i.test(t.jobTitle);
});
const byHistorical = decisiveRows.filter((r) => top(r).level !== 'confirmed_current');
console.log(`  decisive CRM conclusions:                    ${decisiveRows.length}`);
console.log(`  unlocked by a NON-partnership job title:      ${byNonPartner.length}  ${byNonPartner.map((r) => `${r.domain}(${top(r).jobTitle})`).slice(0, 8).join(', ')}`);
console.log(`  historical / recent rather than current:      ${byHistorical.length}`);

// Vendor spread.
const vend: Record<string, number> = {};
for (const r of decisiveRows) vend[top(r).vendor] = (vend[top(r).vendor] ?? 0) + 1;
console.log(`\nCRM COVERAGE AFTER (decisive only): ${Object.entries(vend).map(([k, v]) => `${k}=${v}`).join('  ') || 'none'}`);
const levels: Record<string, number> = {};
for (const r of rows) { const t = top(r); levels[t?.level ?? 'unknown'] = (levels[t?.level ?? 'unknown'] ?? 0) + 1; }
console.log(`LEVEL DISTRIBUTION: ${Object.entries(levels).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ')}`);

// Job families that produced evidence — the §42 invariant, measured.
const fam: Record<string, number> = {};
for (const r of rows) for (const [k, v] of Object.entries(r.familiesObserved ?? {})) fam[k] = (fam[k] ?? 0) + (v as number);
console.log(`\n§42 JOB FAMILIES PRODUCING CRM OBSERVATIONS: ${Object.entries(fam).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ') || 'none'}`);
console.log(`REQUESTS SPENT: ${rows.reduce((n, r) => n + (r.budget?.sourcesInspected ?? 0), 0)} across ${rows.length} accounts`);
