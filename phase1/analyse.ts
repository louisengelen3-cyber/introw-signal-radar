/**
 * Phase 1 measurement. Reports aggregate numbers AND the individual mistakes,
 * because aggregate metrics hide the failures that matter.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { ClassifiedCompany } from './run-classify.js';

const which = process.argv[2] ?? 'benchmark';
const R = JSON.parse(readFileSync(new URL(`./out/classify.${which}.json`, import.meta.url), 'utf8')) as ClassifiedCompany[];

const L: string[] = [];
const say = (s = '') => { L.push(s); console.log(s); };
const pct = (n: number, d: number) => (d ? `${n}/${d} (${Math.round((100 * n) / d)}%)` : '0/0');

const TRANSACTING = new Set(['transacting', 'mixed']);
const bySet = (s: string) => R.filter((r) => r.set === s);

say(`# Phase 1 classification results — ${which}`);
say(`Run: ${new Date().toISOString().slice(0, 10)} · records ${R.length}`);
say();

/* ── coverage ───────────────────────────────────────────────────────────── */
say('## Coverage');
const blocked = R.filter((r) => !r.reachable);
say(`- site reachable: ${pct(R.filter((r) => r.reachable).length, R.length)}`);
say(`- blocked/unreachable: ${blocked.length} — ${blocked.map((b) => `${b.domain}(${b.blockReason})`).join(', ') || 'none'}`);
const ccRecovered = blocked.filter((b) => b.inventory.commonCrawl > 0);
say(`- of those, URL inventory still recovered via Common Crawl: ${ccRecovered.length} — ${ccRecovered.map((b) => `${b.domain}:${b.inventory.commonCrawl}`).join(', ') || 'none'}`);
const invSrc: Record<string, number> = {};
for (const r of R) for (const s of r.inventory.sources) invSrc[s] = (invSrc[s] ?? 0) + 1;
say(`- inventory sources contributing: ${Object.entries(invSrc).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
say();

/* ── verdict distribution ───────────────────────────────────────────────── */
say('## Verdict distribution');
for (const set of [...new Set(R.map((r) => r.set))]) {
  const rows = bySet(set);
  const d: Record<string, number> = {};
  for (const r of rows) d[r.classification?.commerciality ?? 'error'] = (d[r.classification?.commerciality ?? 'error'] ?? 0) + 1;
  say(`- ${set} (n=${rows.length}): ${Object.entries(d).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
}
say();

/* ── candidate surfacing: the metric the product actually needs ─────────── */
// `single_strong_uncorroborated` is not a rejection — it routes to research and the
// account is still surfaced. Auto-classification and surfacing are measured separately.
const isCandidate = (r: ClassifiedCompany) =>
  TRANSACTING.has(r.classification?.commerciality ?? '') || r.classification?.rule === 'single_strong_uncorroborated';
say('## Candidate surfacing (classified transacting/mixed OR routed to research)');
for (const set of [...new Set(R.map((r) => r.set))]) {
  const rows = bySet(set);
  say(`- ${set}: ${pct(rows.filter(isCandidate).length, rows.length)}`);
}
const enterprise = R.filter((r) => r.scale?.multiTierSuspected);
say(`- flagged multi-tier / enterprise scale (demoted, not excluded): ${enterprise.map((r) => r.domain).join(', ') || 'none'}`);
say();

/* ── recall on known-relevant companies ─────────────────────────────────── */
const A = bySet('cohortA');
if (A.length) {
  say('## Recall — Cohort A (all are real transacting-channel companies)');
  const hit = A.filter((r) => TRANSACTING.has(r.classification?.commerciality ?? ''));
  say(`- classified transacting or mixed: ${pct(hit.length, A.length)}`);
  say(`- surfaced as a candidate (incl. routed to research): ${pct(A.filter(isCandidate).length, A.length)}`);
  const reachableA = A.filter((r) => r.reachable);
  say(`- surfaced, excluding unreachable sites: ${pct(reachableA.filter(isCandidate).length, reachableA.length)}`);
  say('- misses:');
  for (const r of A.filter((x) => !TRANSACTING.has(x.classification?.commerciality ?? ''))) {
    say(`  · ${r.domain.padEnd(22)} => ${r.classification?.commerciality} [${r.classification?.rule}] inv=${r.inventory.site + r.inventory.commonCrawl} pages=${r.partnerPagesFetched.filter((p) => p.status === 200).length} ${r.reachable ? '' : '(UNREACHABLE)'}`);
  }
  say();
}

/* ── precision on traps ─────────────────────────────────────────────────── */
const C = bySet('cohortC');
if (C.length) {
  say('## Precision — Cohort C traps');
  const flagged = C.filter((r) => TRANSACTING.has(r.classification?.commerciality ?? ''));
  say(`- traps NOT flagged as transacting/mixed: ${pct(C.length - flagged.length, C.length)}`);
  say('- traps flagged (false positives):');
  for (const r of flagged) say(`  · ${r.domain.padEnd(22)} label=${(r.label ?? '').padEnd(34)} => ${r.classification?.commerciality} [${r.classification?.rule}]`);
  say('- suppression fired on:');
  for (const r of C.filter((x) => x.classification?.suppression)) say(`  · ${r.domain.padEnd(22)} rule=${r.classification!.suppression!.rule}`);
  say();
  // Trap-class breakdown
  const byTrap: Record<string, { n: number; flagged: number }> = {};
  for (const r of C) {
    const t = r.label ?? 'unknown';
    byTrap[t] ??= { n: 0, flagged: 0 };
    byTrap[t].n++;
    if (TRANSACTING.has(r.classification?.commerciality ?? '')) byTrap[t].flagged++;
  }
  say('- by trap class:');
  for (const [t, v] of Object.entries(byTrap)) say(`  · ${t.padEnd(36)} flagged ${v.flagged}/${v.n}`);
  say();
}

/* ── false suppression anywhere ─────────────────────────────────────────── */
say('## Suppression audit (all sets)');
const supp = R.filter((r) => r.classification?.suppression);
say(`- suppression fired on ${supp.length} of ${R.length}`);
for (const r of supp) say(`  · ${r.set.slice(-1)} ${r.domain.padEnd(22)} rule=${r.classification!.suppression!.rule.padEnd(22)} label=${r.label ?? ''}`);
say();

/* ── evidence quality ───────────────────────────────────────────────────── */
say('## Evidence quality');
const withEv = R.filter((r) => (r.classification?.evidence.length ?? 0) > 0);
say(`- companies with any channel evidence: ${pct(withEv.length, R.length)}`);
const firstParty = R.filter((r) => r.classification?.evidence.some((e) => e.source.authority === 'subject_first_party' && e.strength === 'strong'));
say(`- with STRONG first-party evidence: ${pct(firstParty.length, R.length)}`);
const decisive = R.filter((r) => r.classification?.rule.startsWith('decisive'));
say(`- decided by a decisive artifact (deal-reg or platform fingerprint): ${pct(decisive.length, R.length)}`);
const singleWeak = R.filter((r) => r.classification?.rule === 'single_weak_transacting');
say(`- routed to research for want of corroboration: ${pct(singleWeak.length, R.length)}`);
const evClass: Record<string, number> = {};
for (const r of R) for (const e of new Set(r.classification?.evidence.filter((x) => x.strength === 'strong').map((x) => x.evidenceClass) ?? [])) evClass[e] = (evClass[e] ?? 0) + 1;
say('- strong evidence classes by frequency:');
for (const [k, v] of Object.entries(evClass).sort((a, b) => b[1] - a[1])) say(`  · ${k.padEnd(24)} ${v}`);
say();

/* ── platform fingerprints ──────────────────────────────────────────────── */
say('## Platform fingerprints (DNS)');
const fp = R.filter((r) => r.dns.platform);
for (const r of fp) say(`  · ${r.set.slice(-1)} ${r.domain.padEnd(24)} ${r.dns.platform!.vendor.padEnd(22)} ${r.dns.platform!.host}`);
say(`- total ${fp.length}/${R.length}`);
say();

/* ── partner count ──────────────────────────────────────────────────────── */
say('## Partner count feasibility');
const ct: Record<string, number> = {};
for (const r of R) ct[r.partnerCount.countType] = (ct[r.partnerCount.countType] ?? 0) + 1;
say(`- by count type: ${Object.entries(ct).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
const usable = R.filter((r) => ['exact_public', 'directory_count'].includes(r.partnerCount.countType));
say(`- usable (exact or enumerated): ${pct(usable.length, R.length)}`);
for (const r of usable) say(`  · ${r.domain.padEnd(24)} ${r.partnerCount.value} ${r.partnerCount.unit} [${r.partnerCount.countType}]`);
say();

/* ── language coverage ──────────────────────────────────────────────────── */
say('## Language of matched evidence');
const langs: Record<string, number> = {};
for (const r of R) for (const e of r.classification?.evidence ?? []) if (e.lang) langs[e.lang] = (langs[e.lang] ?? 0) + 1;
say(`- ${Object.entries(langs).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' · ') || 'none'}`);
say();

writeFileSync(new URL(`./out/RESULTS.${which}.md`, import.meta.url).pathname, L.join('\n'));
