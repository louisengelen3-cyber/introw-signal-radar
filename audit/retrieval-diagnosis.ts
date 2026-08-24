/** Distinguish "content absent" from "we could not read it". Read-only. */
import { get, mainContent, stripTags } from '../src/lib/http.js';

const URLS = [
  'https://www.vaillant.co.uk/installers/',
  'https://professional.vaillant.co.uk/',
  'https://www.viessmann.co.uk/en/partner-portal.html',
  'https://www.fronius.com/en-gb/uk/solar-energy/installers-partners/service-support/fronius-system-partner',
  'https://www.nibe.eu/en-eu/professional',
  'https://www.somfypro.co.uk/',
  'https://www.loxone.com/enen/partner/',
  'https://www.sma.de/en/partner',
  'https://www.phoenixcontact.com/en-pc/partner',
];
for (const u of URLS) {
  const r = await get(u, { force: true, timeout: 25000 });
  const raw = r.body?.length ?? 0;
  const text = r.body ? stripTags(mainContent(r.body)) : '';
  const verdict = !r.ok ? (r.blocked ? 'BLOCKED' : r.status === 404 ? 'NOT FOUND' : r.status === 0 ? 'FETCH FAILED' : `HTTP ${r.status}`)
    : text.length < 300 && raw > 20000 ? 'JS-RENDERED (large HTML, no text)'
    : text.length < 300 ? 'THIN'
    : 'READABLE';
  console.log(`${String(r.status).padStart(3)}  raw=${String(raw).padStart(7)}  text=${String(text.length).padStart(6)}  ${verdict.padEnd(32)} ${u.slice(0, 62)}`);
}
