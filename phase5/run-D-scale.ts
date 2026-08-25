/** D: test prose scale extraction against the three cases the audit found by hand. */
import { writeFileSync } from 'node:fs';
import { get, mainContent, stripTags } from '../src/lib/http.js';
import { findPartnerSurfaces } from '../src/recovery/surfaces.js';
import { extractProgrammeScale } from '../src/dossier/programme-scale.js';

const CASES: { domain: string; expected: string; extra?: string[] }[] = [
  { domain: 'allisontransmission.com', expected: '~1,600 dealer/distributor locations and 6,200 certified technicians',
    extra: ['https://www.allisontransmission.com/aftermarket-and-channel/channel', 'https://www.allisontransmission.com/support/sales-and-service-locator'] },
  { domain: 'expo-e.uk', expected: '600+ organisations in the Channel community',
    extra: ['https://www.expo-e.uk/about-us', 'https://www.expo-e.uk/about-us/our-channel-partners'] },
  { domain: 'myfactory.com', expected: 'named partners in a programme PDF',
    extra: ['https://www.myfactory.com/de/unternehmen/partner-werden'] },
];
const rows: any[] = [];
for (const c of CASES) {
  const found = await findPartnerSurfaces({ domains: [c.domain], limit: 6, probeFallback: true });
  const urls = [...new Set([...found.surfaces.map((s) => s.url), ...(c.extra ?? [])])];
  const pages: { url: string; text: string }[] = [];
  for (const u of urls.slice(0, 8)) {
    const r = await get(u, { timeout: 18000 });
    if (!r.ok || !r.body) continue;
    const t = stripTags(mainContent(r.body));
    if (t.length > 150) pages.push({ url: u, text: t });
  }
  const claims = extractProgrammeScale(pages);
  rows.push({ domain: c.domain, expected: c.expected, pagesRead: pages.length, claims });
  console.log(`\n=== ${c.domain} (${pages.length} pages) ===`);
  console.log(`  expected: ${c.expected}`);
  if (!claims.length) console.log('  FOUND: nothing');
  for (const cl of claims.slice(0, 5)) {
    console.log(`  FOUND: ${cl.claimed.toLocaleString('en-GB')} ${cl.noun}${cl.approximate ? ' (approx)' : ''}`);
    console.log(`         "${cl.quote.slice(0, 150)}"`);
  }
}
writeFileSync('phase5/out/D-scale.json', JSON.stringify(rows, null, 2));
