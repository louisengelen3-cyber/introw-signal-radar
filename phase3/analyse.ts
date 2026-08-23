/**
 * Phase 3 measurement. Absolute counts, not percentages — n is small and a percentage
 * on 5 companies reads like a claim it cannot support.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { Assessment } from '../src/pipeline/assess.js';

type Row = Assessment & { name: string; population: string; meta: string };
const R = JSON.parse(readFileSync(new URL('./out/positive.json', import.meta.url), 'utf8')) as Row[];
const L: string[] = [];
const say = (s = '') => { L.push(s); console.log(s); };

const POPS = ['customer_discovery', 'customer_holdout', 'clean_negative', 'matched_unlabelled'] as const;
const LABEL: Record<string, string> = {
  customer_discovery: 'Known customers (discovery)',
  customer_holdout: 'Known customers (HOLDOUT)',
  clean_negative: 'Clean structural negatives',
  matched_unlabelled: 'Matched unlabelled prospects',
};
const STATES = ['high_fit', 'plausible', 'under_observed', 'not_promoted'] as const;

say('# Phase 3 — positive promotion');
say(`Run ${new Date().toISOString().slice(0, 10)} · n=${R.length}`);
say();
say('| population | n | high_fit | plausible | under_observed | not_promoted |');
say('|---|---|---|---|---|---|');
for (const p of POPS) {
  const rows = R.filter((r) => r.population === p);
  const c = (s: string) => rows.filter((r) => r.promotion?.state === s).length;
  say(`| ${LABEL[p]} | ${rows.length} | ${c('high_fit')} | ${c('plausible')} | ${c('under_observed')} | ${c('not_promoted')} |`);
}
say();

const cust = R.filter((r) => r.population.startsWith('customer'));
const neg = R.filter((r) => r.population === 'clean_negative');
const promoted = (rows: Row[]) => rows.filter((r) => r.promotion?.state === 'high_fit');
say(`**Known customers positively promoted: ${promoted(cust).length} of ${cust.length}.**`);
say(`**Clean negatives falsely promoted: ${promoted(neg).length} of ${neg.length}.**`);
say(`Phase 2 comparison: \`strong\` fired 1 time in 50.`);
say();

say('## Constructs, measured separately');
say('| population | materiality confirmed/strong | ownership direct/mixed | surface rich/moderate |');
say('|---|---|---|---|');
for (const p of POPS) {
  const rows = R.filter((r) => r.population === p);
  const m = rows.filter((r) => ['confirmed', 'strong_proxy'].includes(r.positive?.materiality ?? '')).length;
  const o = rows.filter((r) => ['direct', 'mixed'].includes(r.positive?.ownership ?? '')).length;
  const s = rows.filter((r) => ['rich', 'moderate'].includes(r.positive?.surface ?? '')).length;
  say(`| ${LABEL[p]} | ${m}/${rows.length} | ${o}/${rows.length} | ${s}/${rows.length} |`);
}
say();

say('## Every record');
say('| population | company | materiality | ownership | surface | density | promotion | rule |');
say('|---|---|---|---|---|---|---|---|');
for (const r of R.sort((a, b) => a.population.localeCompare(b.population) || a.domain.localeCompare(b.domain))) {
  say(`| ${r.population} | ${r.domain} | ${r.positive?.materiality ?? '—'} | ${r.positive?.ownership ?? '—'} | ${r.positive?.surface ?? '—'} | ${r.positive?.evidenceDensity ?? '—'} | ${r.promotion?.state ?? '—'} | ${r.promotion?.rule ?? '—'} |`);
}
say();

/* ── customer-miss recovery ─────────────────────────────────────────────── */
say('## Customer-miss recovery (Phase 2 misses vs Phase 3 promotion)');
const PHASE2_MISSES = ['ringover.com', 'zenity.io', 'xelix.com', 'payflip.be'];
say('| company | Phase 2 channel verdict | Phase 3 materiality | ownership | surface | promotion |');
say('|---|---|---|---|---|---|');
for (const d of PHASE2_MISSES) {
  const r = R.find((x) => x.domain === d);
  say(`| ${d} | unknown (channel_not_established) | ${r?.positive?.materiality ?? 'not run'} | ${r?.positive?.ownership ?? '—'} | ${r?.positive?.surface ?? '—'} | ${r?.promotion?.state ?? '—'} |`);
}
say();

/* ── observability separated from fit ───────────────────────────────────── */
say('## Evidence density vs promotion (observability is tracked, never rewarded)');
say('| density | n | high_fit | under_observed |');
say('|---|---|---|---|');
for (const d of ['rich', 'moderate', 'sparse', 'none']) {
  const rows = R.filter((r) => r.positive?.evidenceDensity === d);
  say(`| ${d} | ${rows.length} | ${rows.filter((r) => r.promotion?.state === 'high_fit').length} | ${rows.filter((r) => r.promotion?.state === 'under_observed').length} |`);
}
say();

writeFileSync(new URL('./out/RESULTS.md', import.meta.url).pathname, L.join('\n'));
