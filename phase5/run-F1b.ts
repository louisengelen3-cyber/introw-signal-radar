/** Second pass: nested careers paths, and separating BLOCKED from genuinely absent. */
import { readFileSync, writeFileSync } from 'node:fs';
import { get, mainContent, stripTags } from '../src/lib/http.js';
import { isSoft404 } from '../src/recovery/surfaces.js';

const prior: any[] = JSON.parse(readFileSync('phase5/out/F1-untested16.json', 'utf8'));
const NESTED = [
  '/unternehmen/karriere', '/ueber-uns/karriere', '/uber-uns/jobs', '/company/jobs',
  '/over-ons/vacatures', '/bedrijf/vacatures', '/about/jobs', '/about-us/jobs',
  '/en/company/careers', '/company/career', '/organisation/karriere', '/wij/vacatures',
  '/nl/over-ons/werken-bij', '/om-oss/lediga-jobb', '/chi-siamo/lavora-con-noi',
  '/qui-sommes-nous/carrieres', '/company/about/careers', '/en/about/careers',
];
const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < prior.length) {
    const p = prior[i++];
    if (!p.verdict.startsWith('GOOD')) { rows.push({ ...p, finalVerdict: p.verdict }); continue; }
    let found: any = null; let blocked = false; let requests = 0;
    for (const path of NESTED) {
      if (found || requests >= 20) break;
      requests++;
      const r = await get(`https://www.${p.domain}${path}`, { timeout: 12000 });
      if (r.status === 403 || r.status === 429) { blocked = true; continue; }
      if (!r.ok || !r.body) continue;
      const text = stripTags(mainContent(r.body));
      const title = r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '';
      if (isSoft404(text, title) || text.length < 150) continue;
      found = { url: `https://www.${p.domain}${path}`, chars: text.length };
    }
    // A root probe that 403s means the site refuses us, not that it has no careers page.
    if (!found && !blocked) {
      const r = await get(`https://www.${p.domain}/`, { timeout: 12000 });
      if (r.status === 403 || r.status === 429) blocked = true;
    }
    const finalVerdict = found ? 'BAD_nested_careers_missed'
      : blocked ? 'BLOCKED_cannot_establish_either_way'
      : 'GOOD_no_public_careers_surface';
    rows.push({ ...p, finalVerdict, nested: found, blocked, nestedProbes: requests });
    console.error(`${p.domain.padEnd(24)} ${finalVerdict}${found ? '  ' + found.url : ''}`);
  }
}));
rows.sort((a, b) => a.domain.localeCompare(b.domain));
writeFileSync('phase5/out/F1-untested16.json', JSON.stringify(rows, null, 2));
const c = (s: string) => rows.filter((r) => r.finalVerdict.startsWith(s)).length;
console.error(`\nGOOD    ${c('GOOD')}/${rows.length}   genuinely no public careers surface`);
console.error(`BAD     ${c('BAD')}/${rows.length}   a real surface existed and we missed it`);
console.error(`BLOCKED ${c('BLOCKED')}/${rows.length}   site refuses retrieval; neither class`);
