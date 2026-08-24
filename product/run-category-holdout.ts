/**
 * Single-shot holdout evaluation of the category classifier.
 *
 * Frozen corpus, sha256 holdout.v3. No domain here was inspected while the rules were
 * written. Per the mandate this runs once and the result is reported whatever it says.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { collectPositioning } from '../src/evidence/positioning.js';
import { classifyCategory } from '../src/category/classify.js';
import { loadKnownCompetitors, compare } from '../src/category/known-competitors.js';

const set = JSON.parse(readFileSync(new URL('../corpus/holdout.v3.json', import.meta.url).pathname, 'utf8')) as
  { companies: { domain: string; expected: string; basis: string }[] };
const known = loadKnownCompetitors();

const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (i < set.companies.length) {
    const c = set.companies[i++];
    try {
      const pos = await collectPositioning(c.domain);
      const cls = classifyCategory(c.domain, pos, known);
      const cmp = compare(c.domain, known.isKnownCompetitor(c.domain), cls.state === 'partner_tech_vendor');
      const ok = cls.state === c.expected || (c.expected === 'partner_tech_vendor' && cls.state === 'direct_introw_competitor');
      rows.push({ ...c, got: cls.state, ok, items: pos.items.length, signals: cls.signals, listVsClassifier: cmp,
        health: pos.health.map((h) => h.health) });
      writeFileSync(new URL('./out/category-holdout.v3.json', import.meta.url).pathname, JSON.stringify(rows, null, 2));
      console.error(`${ok ? ' ok ' : 'MISS'} ${c.domain.padEnd(22)} expected=${c.expected.padEnd(24)} got=${cls.state.padEnd(24)} items=${pos.items.length} ${cls.signals[0]?.matched?.slice(0, 40) ?? ''}`);
    } catch (e) { console.error(`[err] ${c.domain}: ${(e as Error).message}`); }
  }
}));

const by = (exp: string) => rows.filter((r) => r.expected === exp);
console.error('\n=== HOLDOUT RESULT (frozen holdout.v3, single shot) ===');
for (const exp of ['partner_tech_vendor', 'likely_target_category', 'supply_side_marketplace', 'professional_services']) {
  const g = by(exp);
  console.error(`  ${exp.padEnd(24)} ${g.filter((r) => r.ok).length}/${g.length}   misses: ${g.filter((r) => !r.ok).map((r) => `${r.domain}→${r.got}`).join(', ') || 'none'}`);
}
const tech = by('partner_tech_vendor');
const targets = by('likely_target_category');
console.error(`\n  CRITICAL — partner-tech vendors NOT caught (would reach a seller): ${tech.filter((r) => !r.ok).length}/${tech.length}`);
console.error(`  CRITICAL — real prospects wrongly excluded as vendors: ${targets.filter((r) => r.got === 'partner_tech_vendor' || r.got === 'direct_introw_competitor').length}/${targets.length}`);
console.error('DONE');
