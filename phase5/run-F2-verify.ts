/** F2 step 1: verify which candidates actually have a retrievable partner page. */
import { readFileSync, writeFileSync } from 'node:fs';
import { findPartnerSurfaces } from '../src/recovery/surfaces.js';
import { get, mainContent, stripTags } from '../src/lib/http.js';
import { isSoft404 } from '../src/recovery/surfaces.js';

const bench = JSON.parse(readFileSync('phase5/benchmark/F2-belgian-saas.v1.json', 'utf8'));
const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (i < bench.candidates.length) {
    const d = bench.candidates[i++];
    try {
      const root = await get(`https://www.${d}/`, { timeout: 12000 });
      const alive = root.ok || (await get(`https://${d}/`, { timeout: 12000 })).ok;
      if (!alive) { rows.push({ domain: d, alive: false, hasPartnerPage: false, reason: 'domain did not resolve' }); continue; }
      const found = await findPartnerSurfaces({ domains: [d], limit: 4, probeFallback: true });
      let best: { url: string; chars: number } | null = null;
      for (const s of found.surfaces) {
        const r = await get(s.url, { timeout: 15000 });
        if (!r.ok || !r.body) continue;
        const t = stripTags(mainContent(r.body));
        const title = r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '';
        if (isSoft404(t, title) || t.length < 200) continue;
        best = { url: s.url, chars: t.length }; break;
      }
      rows.push({ domain: d, alive: true, hasPartnerPage: !!best, partnerUrl: best?.url ?? null, reason: best ? 'verified' : 'no retrievable partner page' });
      console.error(`${d.padEnd(24)} ${best ? 'IN  ' + best.url : 'OUT (no partner page)'}`);
    } catch (e) { rows.push({ domain: d, alive: false, hasPartnerPage: false, reason: (e as Error).message }); }
  }
}));
rows.sort((a, b) => a.domain.localeCompare(b.domain));
writeFileSync('phase5/out/F2-reference.json', JSON.stringify(rows, null, 2));
const inList = rows.filter((r) => r.hasPartnerPage);
console.error(`\nreference list: ${inList.length}/${rows.length} verified members`);
