/**
 * B guard: logo walls carry aspirational, historical and misattributed logos. A proxy positive
 * is not a known positive. This fetches the source artefact and checks it actually presents
 * the company as a customer, on a stratified sample.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { get, mainContent, stripTags } from '../src/lib/http.js';
import { isSoft404 } from '../src/recovery/surfaces.js';

const resolved: any[] = JSON.parse(readFileSync('phase5/out/B-resolved.json', 'utf8')).filter((r) => r.resolvedDomain);
const pick = (s: string, n: number) => resolved.filter((r) => r.prmSegment === s).sort((a, b) => a.customerName.localeCompare(b.customerName)).slice(0, n);
const sample = [...pick('smb', 6), ...pick('mid_market', 6), ...pick('enterprise', 4)];

const CUSTOMER_LANG = /\b(customer|client|case study|success story|uses|chose|switched to|implemented|trusted by|helped|works with|partner(ed)? with)\b/i;
const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < sample.length) {
    const m = sample[i++];
    try {
      const r = await get(m.sourceUrl, { timeout: 18000 });
      if (!r.ok || !r.body) { rows.push({ ...m, verified: false, reason: 'artefact not retrievable' }); continue; }
      const text = stripTags(mainContent(r.body));
      const title = r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '';
      if (isSoft404(text, title)) { rows.push({ ...m, verified: false, reason: 'artefact is a 404' }); continue; }
      const namesCompany = text.toLowerCase().includes(m.customerName.toLowerCase().slice(0, 14));
      const customerFraming = CUSTOMER_LANG.test(text);
      const verified = namesCompany && customerFraming;
      rows.push({
        ...m, verified,
        reason: verified ? 'artefact names the company in customer framing'
          : !namesCompany ? 'artefact does not name the company'
          : 'named, but no customer framing on the page',
        evidence: namesCompany ? text.slice(Math.max(0, text.toLowerCase().indexOf(m.customerName.toLowerCase().slice(0, 14))) - 80, 200).replace(/\s+/g, ' ').slice(0, 200) : null,
      });
      console.error(`${String(m.customerName).padEnd(26)} ${m.prmSegment.padEnd(11)} ${rows[rows.length - 1].verified ? 'VERIFIED' : 'unverified — ' + rows[rows.length - 1].reason}`);
    } catch (e) { rows.push({ ...m, verified: false, reason: (e as Error).message }); }
  }
}));
writeFileSync('phase5/out/B-verification.json', JSON.stringify(rows, null, 2));
const v = rows.filter((r) => r.verified).length;
console.error(`\nverification rate: ${v}/${rows.length} = ${Math.round(v / rows.length * 100)}%`);
for (const s of ['smb', 'mid_market', 'enterprise']) {
  const g = rows.filter((r) => r.prmSegment === s);
  console.error(`  ${s.padEnd(12)} ${g.filter((r) => r.verified).length}/${g.length}`);
}
