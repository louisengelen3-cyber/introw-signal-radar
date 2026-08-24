import fs from 'node:fs';
import { SURFACE_DEFS } from '../../src/dossier/surfaces.js';
const ds = JSON.parse(fs.readFileSync('product/out/dossiers.json', 'utf8'));
const byKind = new Map(SURFACE_DEFS.map((d) => [d.surface, d.patterns]));
let bad = 0;
for (const d of ds) for (const s of (d.surfaces ?? [])) {
  if (s.state !== 'confirmed') continue;
  const pats = byKind.get(s.surface) ?? [];
  for (const o of s.evidence) {
    if (!pats.some((re: RegExp) => re.test(o.quote))) {
      bad++;
      if (bad <= 6) console.log(`${d.domain} / ${s.surface}\n   "${o.quote.slice(0, 110)}"`);
    }
  }
}
console.log(`\nconfirmed-surface quotes that do NOT match their own pattern: ${bad}`);
