import { get, mainContent, stripTags } from '../src/lib/http.js';
import { scanTrade } from '../src/recovery/trade.js';
const URLS = ['https://www.vaillant.de/kontakt/fachpartner-finden/heizungsbauer-in-der-naehe/',
  'https://www.quatt.io/zakelijk/partner-programma', 'https://www.somfy.de/haendlersuche',
  'https://www.niko.eu/en/need-help/where-to-buy'];
for (const u of URLS) {
  const r = await get(u, { timeout: 25000 });
  if (!r.ok || !r.body) { console.log(`${u} -> fetch ${r.status}`); continue; }
  const text = stripTags(mainContent(r.body));
  const t = scanTrade([{ url: u, text }]);
  console.log(`\n${u.slice(0, 74)}`);
  console.log(`  motions:   ${t.motions.map((m) => `${m.kind}(${m.language})`).join(', ') || 'none'}`);
  console.log(`  surfaces:  ${t.surfaces.map((s) => `${s.kind}(${s.language})`).join(', ') || 'none'}`);
  console.log(`  directory: ${t.directoryType ?? 'none'}`);
  if (t.surfaces[0]) console.log(`  quote:     "${t.surfaces[0].quote.slice(0, 130)}"`);
}
