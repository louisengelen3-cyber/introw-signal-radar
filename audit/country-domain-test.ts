/**
 * Is industrial channel content simply on a different domain?
 *
 * The apex probe found almost nothing. This tests whether the same companies publish a full
 * dealer/installer programme on a COUNTRY domain or a professional subdomain — the structure
 * global manufacturers actually use. Read-only.
 */
import { get, mainContent, stripTags } from '../src/lib/http.js';

const CANDIDATES: [string, string[]][] = [
  ['Vaillant', ['https://www.vaillant.co.uk/installers/', 'https://professional.vaillant.co.uk/', 'https://www.vaillant.nl/installateur/']],
  ['Viessmann', ['https://www.viessmann.co.uk/en/partner-portal.html', 'https://www.viessmann.de/de/handwerk.html', 'https://www.viessmann.be/nl/installateur.html']],
  ['Fronius', ['https://www.fronius.com/en-gb/uk/solar-energy/installers-partners/service-support/fronius-system-partner', 'https://www.fronius.com/en/solar-energy/installers-partners']],
  ['NIBE', ['https://www.nibe.eu/en-eu/professional', 'https://www.nibe.co.uk/professional']],
  ['Daikin', ['https://www.daikin.co.uk/en_gb/installers.html', 'https://www.daikin.be/nl_be/installateur.html']],
  ['Somfy', ['https://www.somfypro.co.uk/', 'https://www.somfypro.nl/', 'https://www.somfy.co.uk/professionals']],
  ['Loxone', ['https://www.loxone.com/enen/partner/', 'https://www.loxone.com/dede/partner/']],
  ['SMA', ['https://www.sma.de/en/partner/sma-solar-academy', 'https://www.sma.de/en/partner']],
  ['Phoenix Contact', ['https://www.phoenixcontact.com/en-pc/partner', 'https://www.phoenixcontact.com/en-gb/partner-portal']],
  ['Grundfos', ['https://www.grundfos.com/uk/professional', 'https://product-selection.grundfos.com/']],
];

/** Operational collaboration — what separates a channel from a supply chain. */
const SIGNALS: [string, RegExp][] = [
  ['tiering', /\b(gold|silver|bronze|platinum|premium|elite|advanced|certified|approved)\s+(partner|installer|dealer|fachpartner|betrieb)\b|\bpartner (tier|level)s?\b|\b\d\s+tiers?\b/i],
  ['registration', /\b(register (your|a) (product|installation|deal|project)|deal[- ]registration|projektregistrierung|product registration)\b/i],
  ['portal', /\b(partner|installer|dealer|pro)\s*(portal|login|extranet|hub|account)\b|\bmy[a-z]+pro\b/i],
  ['leads to partners', /\b(access to |receive |pass |route |forward )?(sales |customer |qualified )?leads?\b[^.]{0,60}\b(installer|partner|dealer)\b|\b(installer|partner|dealer)s?\b[^.]{0,50}\breceive\b[^.]{0,30}\bleads?\b/i],
  ['training/certification', /\b(academy|training|certification|schulung|opleiding|accredit)\w*\b[^.]{0,40}\b(partner|installer|dealer)\b|\b(partner|installer|dealer)\b[^.]{0,40}\b(academy|training|certification)\b/i],
  ['become a partner', /\b(become|apply|join|sign up)\b[^.]{0,30}\b(a |an )?(partner|installer|dealer|fachpartner)\b|\bwerden sie\b[^.]{0,20}\bpartner\b/i],
  ['rewards/margin', /\b(reward|bonus|points|cashback|margin|rebate|commission|discount)s?\b[^.]{0,50}\b(partner|installer|dealer)\b|\b(partner|installer|dealer)s?\b[^.]{0,40}\b(reward|bonus|points|rebate)s?\b/i],
];

for (const [name, urls] of CANDIDATES) {
  let best = { url: '', hits: [] as string[], chars: 0, quote: '' };
  for (const u of urls) {
    const r = await get(u, { timeout: 25000 });
    if (!r.ok || !r.body) continue;
    const text = stripTags(mainContent(r.body));
    if (text.length < 300) continue;
    const hits: string[] = [];
    let quote = '';
    for (const [label, re] of SIGNALS) {
      const m = text.match(re);
      if (m && m.index !== undefined) {
        hits.push(label);
        if (!quote) quote = text.slice(Math.max(0, m.index - 60), m.index + m[0].length + 80).replace(/\s+/g, ' ').trim();
      }
    }
    if (hits.length > best.hits.length) best = { url: u, hits, chars: text.length, quote };
  }
  console.log(`${name.padEnd(17)} ${best.hits.length}/7  ${best.hits.join(', ') || 'nothing found'}`);
  if (best.url) console.log(`   ${best.url}`);
  if (best.quote) console.log(`   "${best.quote.slice(0, 155)}"`);
}
