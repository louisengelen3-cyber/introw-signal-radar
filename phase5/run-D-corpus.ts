/** D coverage: how many accounts in the audited corpus publish a programme-size claim? */
import { readFileSync, writeFileSync } from 'node:fs';
import { get, mainContent, stripTags } from '../src/lib/http.js';
import { findPartnerSurfaces } from '../src/recovery/surfaces.js';
import { extractProgrammeScale } from '../src/dossier/programme-scale.js';

const audit: any[] = JSON.parse(readFileSync('audit/out/introw-radar-reliability-audit.json', 'utf8'));
const targets = audit.filter((a) => a.partner_motion_state === 'established').map((a) => a.domain);
console.error(`${targets.length} accounts with an established partner motion`);
const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < targets.length) {
    const d = targets[i++];
    try {
      const found = await findPartnerSurfaces({ domains: [d], limit: 5, probeFallback: true });
      const pages: { url: string; text: string }[] = [];
      for (const s of found.surfaces) {
        const r = await get(s.url, { timeout: 15000 });
        if (!r.ok || !r.body) continue;
        const t = stripTags(mainContent(r.body));
        if (t.length > 150) pages.push({ url: s.url, text: t });
      }
      const claims = extractProgrammeScale(pages);
      rows.push({ domain: d, pagesRead: pages.length, claims: claims.slice(0, 3) });
      if (claims.length) console.error(`${d.padEnd(26)} ${claims[0].claimed.toLocaleString('en-GB')} ${claims[0].noun}`);
    } catch { rows.push({ domain: d, error: true, claims: [] }); }
  }
}));
writeFileSync('phase5/out/D-corpus.json', JSON.stringify(rows, null, 2));
const withClaim = rows.filter((r) => (r.claims ?? []).length > 0).length;
console.error(`\nDONE — ${withClaim}/${rows.length} accounts publish a programme-size claim (${Math.round(withClaim / rows.length * 100)}%)`);
