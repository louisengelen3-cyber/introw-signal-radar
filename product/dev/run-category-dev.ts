/**
 * DEV evaluation. Every company here has been seen before, so this measures only whether a
 * rule does what it is meant to do — never whether it generalises. That is the holdout's job.
 */
import { readFileSync } from 'node:fs';
import { collectPositioning } from '../../src/evidence/positioning.js';
import { classifyCategory } from '../../src/category/classify.js';
import { loadKnownCompetitors } from '../../src/category/known-competitors.js';

const c = JSON.parse(readFileSync(new URL('../../corpus/regression.v1.json', import.meta.url).pathname, 'utf8')).categories;
const known = loadKnownCompetitors();
const EXPECT: [string, string[]][] = [
  ['professional_services', [...c.professional_services, 'accenture.com', 'kpmg.com', 'infosys.com']],
  ['likely_target_category', c.operator_control],
  ['partner_tech_vendor', [...c.direct_competitor, ...c.partner_tech_vendor]],
  ['supply_side_marketplace', c.supply_side_marketplace],
];
for (const [expected, domains] of EXPECT) {
  let ok = 0; const miss: string[] = [];
  await Promise.all(domains.map(async (d: string) => {
    const pos = await collectPositioning(d, 3);
    const cls = classifyCategory(d, pos, known);
    const pass = cls.state === expected || (expected === 'partner_tech_vendor' && cls.state === 'direct_introw_competitor');
    if (pass) ok++; else miss.push(`${d}→${cls.state}${pos.items.length === 0 ? '(no evidence)' : ''}`);
  }));
  console.log(`${expected.padEnd(24)} ${ok}/${domains.length}  misses: ${miss.join(', ') || 'none'}`);
}
