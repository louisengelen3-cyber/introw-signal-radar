/**
 * Phase 2 measurement. Reports the individual companies, not just aggregates —
 * the failures are where the information is.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { Assessment } from '../src/pipeline/assess.js';
import type { Resolution } from '../src/discovery/resolve.js';

const L: string[] = [];
const say = (s = '') => { L.push(s); console.log(s); };
const pct = (n: number, d: number) => (d ? `${n}/${d} (${Math.round((100 * n) / d)}%)` : '0/0');
const CHANNEL_REAL = new Set(['transacting', 'mixed']);

/* ── Track A: industrial before / after ─────────────────────────────────── */
try {
  type Row = {
    name: string; beforeDomain: string; beforeCommerciality: string; beforeRule: string; beforeInventory: number;
    resolution: Resolution; afterDomain: string | null; after: Assessment | null;
  };
  const rows = JSON.parse(readFileSync(new URL('./out/industrial.json', import.meta.url), 'utf8')) as Row[];
  say('# Track A — industrial discovery closure');
  say(`Same ${rows.length} companies frozen in Phase 1. The benchmark is the list of NAMES a Belgian`);
  say('wholesaler published; the domain was always derived, so Phase 2 re-resolves the names.');
  say();

  const st: Record<string, number> = {};
  for (const r of rows) st[r.resolution.state] = (st[r.resolution.state] ?? 0) + 1;
  say('## Identity resolution v2');
  say(`- ${Object.entries(st).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
  const changed = rows.filter((r) => r.afterDomain && r.afterDomain !== r.beforeDomain);
  say(`- domain changed by v2: ${changed.length} — ${changed.map((r) => `${r.name}: ${r.beforeDomain}→${r.afterDomain}`).join('; ') || 'none'}`);
  const refused = rows.filter((r) => ['wrong_entity', 'dead_domain', 'ambiguous', 'unresolved'].includes(r.resolution.state));
  say(`- v2 refuses to resolve (v1 would have guessed): ${refused.length} — ${refused.map((r) => `${r.name}[${r.resolution.state}]`).join(', ') || 'none'}`);
  say();

  say('## Channel classification, before vs after');
  const beforeReal = rows.filter((r) => CHANNEL_REAL.has(r.beforeCommerciality)).length;
  const afterReal = rows.filter((r) => CHANNEL_REAL.has(r.after?.classification?.commerciality ?? '')).length;
  const afterCandidate = rows.filter((r) => CHANNEL_REAL.has(r.after?.classification?.commerciality ?? '') || r.after?.classification?.rule === 'single_strong_uncorroborated').length;
  say(`- transacting/mixed BEFORE: ${pct(beforeReal, rows.length)}`);
  say(`- transacting/mixed AFTER:  ${pct(afterReal, rows.length)}`);
  say(`- surfaced as candidate AFTER (incl. routed to research): ${pct(afterCandidate, rows.length)}`);
  say();
  say('| company | before domain | after domain | identity | before | after | probes | hits |');
  say('|---|---|---|---|---|---|---|---|');
  for (const r of rows.sort((a, b) => a.name.localeCompare(b.name))) {
    say(`| ${r.name} | ${r.beforeDomain} | ${r.afterDomain ?? '—'} | ${r.resolution.state} | ${r.beforeCommerciality} | ${r.after?.classification?.commerciality ?? '—'} | ${r.after?.inventory.probed ?? 0} | ${r.after?.inventory.probeHits ?? 0} |`);
  }
  say();

  say('## Root cause of remaining industrial failure');
  const unresolvedIdentity = rows.filter((r) => !r.afterDomain).length;
  const reachableNoChannel = rows.filter((r) => r.after?.reachable && !CHANNEL_REAL.has(r.after.classification?.commerciality ?? '')).length;
  const blocked = rows.filter((r) => r.after && !r.after.reachable).length;
  const probedNothing = rows.filter((r) => (r.after?.inventory.probed ?? 0) > 0 && (r.after?.inventory.probeHits ?? 0) === 0).length;
  const softNotFound = rows.reduce((n, r) => n + (r.after?.inventory.softNotFound ?? 0), 0);
  say(`- identity unresolved after v2: ${pct(unresolvedIdentity, rows.length)}`);
  say(`- site retrieved but no transacting channel established: ${pct(reachableNoChannel, rows.length)}`);
  say(`- site not retrievable: ${pct(blocked, rows.length)}`);
  say(`- probed for partner paths and found none: ${probedNothing} companies; ${softNotFound} soft-404 responses rejected`);
  say();
} catch (e) { say(`(industrial results unavailable: ${(e as Error).message})`); }

/* ── Track C: suitability, dev and holdout ──────────────────────────────── */
for (const which of ['dev', 'holdout']) {
  try {
    const R = JSON.parse(readFileSync(new URL(`./out/suitability.${which}.json`, import.meta.url), 'utf8')) as (Assessment & { name: string; cohort: string })[];
    say(`# Track C — Introw suitability (${which.toUpperCase()}, n=${R.length})`);
    const cohorts = ['cohortA_customers', 'cohortB_plausible', 'cohortC_hypothesised_poor_fit'];
    const labels: Record<string, string> = {
      cohortA_customers: 'A · known customers', cohortB_plausible: 'B · plausible targets', cohortC_hypothesised_poor_fit: 'C · hypothesised poor fit',
    };
    say();
    say('| cohort | n | strong | plausible | weak | incompatible | research | unknown |');
    say('|---|---|---|---|---|---|---|---|');
    for (const c of cohorts) {
      const rows = R.filter((r) => r.cohort === c);
      const n = (s: string) => rows.filter((r) => r.suitability?.state === s).length;
      say(`| ${labels[c]} | ${rows.length} | ${n('strong')} | ${n('plausible')} | ${n('weak')} | ${n('incompatible')} | ${n('research_required')} | ${n('unknown')} |`);
    }
    say();
    const A = R.filter((r) => r.cohort === 'cohortA_customers');
    const C = R.filter((r) => r.cohort === 'cohortC_hypothesised_poor_fit');
    const demoted = (rows: typeof R) => rows.filter((r) => ['weak', 'incompatible'].includes(r.suitability?.state ?? '')).length;
    say(`- customers demoted to weak/incompatible (should be near zero): ${pct(demoted(A), A.length)}`);
    say(`- hypothesised poor-fit demoted or routed to research: ${pct(C.filter((r) => ['weak', 'incompatible', 'research_required'].includes(r.suitability?.state ?? '')).length, C.length)}`);
    say();
    say('| cohort | company | channel | direction | suitability | rule |');
    say('|---|---|---|---|---|---|');
    for (const r of R.sort((a, b) => a.cohort.localeCompare(b.cohort) || a.domain.localeCompare(b.domain))) {
      say(`| ${r.cohort.slice(6, 7)} | ${r.domain} | ${r.classification?.commerciality ?? '—'} | ${r.operator?.direction ?? '—'} | ${r.suitability?.state ?? '—'} | ${r.suitability?.rule ?? '—'} |`);
    }
    say();
    const fp = R.filter((r) => r.dns.platform);
    say(`- partner-platform fingerprints: ${fp.map((r) => `${r.domain}:${r.dns.platform!.vendor}`).join(', ') || 'none'}`);
    say(`- DNS lookup failures recorded (not read as absence): ${R.reduce((n, r) => n + (r.dns.lookupFailures ?? 0), 0)}`);
    const ct: Record<string, number> = {};
    for (const r of R) ct[r.partnerCount.countType] = (ct[r.partnerCount.countType] ?? 0) + 1;
    say(`- partner count types: ${Object.entries(ct).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
    say();
  } catch (e) { say(`(${which} results unavailable: ${(e as Error).message})`); say(); }
}

writeFileSync(new URL('./out/RESULTS.md', import.meta.url).pathname, L.join('\n'));
