import { get, mainContent, stripTags } from '../src/lib/http.js';
import { detectProgrammes } from '../src/dossier/programmes.js';
import { scanSurfaces } from '../src/dossier/surfaces.js';
const url = 'https://www.vaillant.de/kontakt/fachpartner-finden/heizungsbauer-in-der-naehe/';
const r = await get(url, { timeout: 25000 });
if (!r.ok || !r.body) { console.log('fetch failed', r.status); process.exit(0); }
const text = stripTags(mainContent(r.body));
console.log('chars:', text.length);
console.log('sample:', text.slice(0, 320).replace(/\s+/g, ' '));
console.log('\nprogrammes detected:', detectProgrammes([{ url, text }]).map((h) => h.kind));
console.log('surfaces detected :', scanSurfaces([{ url, text }]).hits.map((h) => h.surface));
const TRADE = [['Fachpartner', /fachpartner/i], ['Fachbetrieb', /fachbetrieb/i], ['Installateur', /installateur/i],
  ['Heizungsbauer', /heizungsbauer/i], ['Partner werden', /partner werden/i], ['Vertriebspartner', /vertriebspartner/i],
  ['Servicepartner', /servicepartner/i], ['Schulung', /schulung|weiterbildung/i], ['Portal', /portal|login/i]] as [string, RegExp][];
console.log('\nGerman trade terms present in the page text:');
for (const [l, re] of TRADE) if (re.test(text)) console.log('  -', l);
