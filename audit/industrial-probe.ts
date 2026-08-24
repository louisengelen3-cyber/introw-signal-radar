/**
 * Manufacturing / industrial deep dive.
 *
 * Previous phases concluded industrial public data was thin. This challenges that by looking
 * where trade channels actually publish — dealer and installer locators, "where to buy",
 * "become a dealer" — rather than at /partners, which is a SaaS convention.
 *
 * Read-only. Nothing in src/ is modified.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { get, mainContent, stripTags } from '../src/lib/http.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const set = JSON.parse(readFileSync(new URL('./cross-industry.v1.json', import.meta.url).pathname, 'utf8'));

/** Paths the CURRENT pipeline probes. */
const RADAR_PATHS = ['/partners', '/partner', '/partner-program', '/partner-programme', '/partnerships',
  '/resellers', '/agencies', '/become-a-partner', '/partner-network',
  '/en/partners', '/nl/partners', '/fr/partenaires', '/de/partner'];

/** Paths a trade channel actually uses. NOT added to production — probed here only. */
const TRADE_PATHS = [
  '/where-to-buy', '/dealers', '/dealer-locator', '/find-a-dealer', '/become-a-dealer',
  '/installers', '/installer-locator', '/find-an-installer', '/become-an-installer',
  '/distributors', '/distributor-locator', '/find-a-distributor', '/sales-partners',
  '/service-partners', '/service-network', '/system-integrators', '/integrators',
  '/verkooppunten', '/dealer-zoeken', '/installateur', '/installateurs', '/vakhandel',
  '/haendlersuche', '/handelspartner', '/fachpartner', '/fachbetriebe', '/vertriebspartner',
  '/ou-acheter', '/revendeurs', '/installateurs-agrees', '/points-de-vente',
  '/en/where-to-buy', '/en/dealers', '/en/distributors', '/en/partners/find',
];

/** Operational collaboration — the thing that separates a channel from a supply chain. */
const OPERATIONAL = [
  /\bdeal[- ]registration\b|\bregister (a |your )?(deal|project|opportunity)\b|\bprojektregistrierung\b/i,
  /\bpartner portal\b|\bdealer portal\b|\bextranet\b|\binstaller portal\b|\bpartner login\b|\bdealer login\b/i,
  /\b(become|apply to be|sign up as) (a |an )?(dealer|installer|distributor|partner|reseller)\b|\bwerde\s+(fach)?partner\b|\bword (dealer|installateur|partner)\b/i,
  /\b(certified|authoriz?ed|accredited|approved|gecertificeerd|zertifiziert|agr[ée]{1,2})\s+(dealer|installer|partner|distributor|integrator|installateur|betrieb)/i,
  /\b(partner|dealer|installer)\s+(training|academy|certification|enablement|schulung|opleiding|formation)\b/i,
  /\b(gold|silver|bronze|platinum|premium|elite|zertifiziert)\s+(partner|dealer|installer|fachpartner)\b|\bpartner (tier|level)s?\b/i,
  /\b(lead|project)s?\s+(routing|assignment|handover|doorsturen|weiterleitung)\b|\bwe pass (leads|projects)\b/i,
  /\b(margin|commission|rebate|bonus|marge|provision)\b[^.]{0,50}\b(partner|dealer|installer|reseller)\b/i,
];

const targets: { domain: string; cohort: string }[] = [];
for (const [cohort, list] of Object.entries(set.cohorts) as [string, any[]][]) {
  if (!/manufacturing|industrial|iot|hardware|solar|other_b2b/.test(cohort)) continue;
  for (const c of list) targets.push({ cohort, domain: c.domain });
}

const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (i < targets.length) {
    const t = targets[i++];
    const radarHits: string[] = [];
    const tradeHits: string[] = [];
    const opSignals = new Set<number>();
    const quotes: string[] = [];

    const probe = async (paths: string[], into: string[]) => {
      for (const p of paths) {
        let r = await get(`https://www.${t.domain}${p}`);
        if (!r.ok || !r.body) r = await get(`https://${t.domain}${p}`);
        if (!r.ok || !r.body || r.body.length < 1500) continue;
        const text = stripTags(mainContent(r.body));
        if (text.length < 200) continue;
        into.push(p);
        OPERATIONAL.forEach((re, idx) => {
          const m = text.match(re);
          if (m && m.index !== undefined) {
            opSignals.add(idx);
            if (quotes.length < 4) quotes.push(text.slice(Math.max(0, m.index - 70), m.index + m[0].length + 90).replace(/\s+/g, ' ').trim());
          }
        });
      }
    };
    try {
      await probe(RADAR_PATHS, radarHits);
      await probe(TRADE_PATHS, tradeHits);
      rows.push({ ...t, radarHits, tradeHits, operationalSignals: opSignals.size, quotes });
      writeFileSync(`${OUT}industrial-probe.json`, JSON.stringify(rows, null, 2));
      console.error(`[${rows.length}/${targets.length}] ${t.domain.padEnd(24)} radar=${String(radarHits.length).padEnd(2)} trade=${String(tradeHits.length).padEnd(2)} operational=${opSignals.size}/8`);
    } catch (e) { console.error(`[err] ${t.domain}: ${(e as Error).message}`); }
  }
}));
console.error('DONE');
