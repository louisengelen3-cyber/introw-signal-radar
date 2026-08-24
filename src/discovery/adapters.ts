/**
 * Candidate-discovery adapters.
 *
 * Each adapter turns a PUBLIC SEED into candidate companies without being handed a domain
 * list. Every candidate records the path it came from so it is reproducible and auditable.
 *
 * THE CONTRACT EVERY ADAPTER OBSERVES
 *   A candidate is a CANDIDATE. Discovery never asserts fit, never asserts that the company
 *   operates the programme, and never bypasses the evidence pipeline. Discovery answers
 *   "who is worth investigating"; the dossier answers "what do we actually know".
 */

import { get, stripTags } from '../lib/http.js';

export type DiscoveryMechanism =
  | 'prm_tenancy'          // a partner portal served by a known PRM vendor
  | 'distributor_inversion' // a distributor's vendor catalogue
  | 'partner_directory_harvest'
  | 'search_pattern';

export interface Candidate {
  /** Name as the discovering source published it. Not yet an entity. */
  name: string;
  /** Resolved later; null until entity resolution runs. */
  domain: string | null;
  mechanism: DiscoveryMechanism;
  seed: string;
  discoverySource: string;
  /** Why this source thinks the company is channel-relevant. */
  discoveryEvidence: string;
  discoveredAt: string;
  geography: string | null;
  sourceLanguage: string | null;
  entityConfidence: 'high' | 'medium' | 'low';
}

/* ══════════════════════════════════════════════════════ 1 · PRM TENANCY ══
 *
 * CAN DISCOVER: companies whose partner portal is served by a commercial PRM platform.
 * DOES NOT PROVE: programme size, quality, or that the company is a good prospect. It does
 *   prove — about as directly as public data ever does — that the company OPERATES a partner
 *   programme, because it is paying a vendor to run one.
 * SEGMENT BIAS: strong toward companies that buy SaaS tooling. Expect software skew.
 * GEOGRAPHY BIAS: follows the PRM vendors' own customer bases, i.e. US/EU.
 * IDENTITY RISK: low. The certificate names the customer's own domain.
 * PRECISION: very high — this is the highest-precision mechanism available.
 * RECALL: low. Most channel operators run no PRM at all.
 * STABILITY: high. Certificate transparency is an append-only public log.
 * COST: one API call per vendor. SCALABILITY: high.
 */

/** PRM platforms whose tenants resolve through a vendor-owned CNAME domain. */
const PRM_TENANT_DOMAINS: [string, string][] = [
  ['Introw', 'cname.introw.io'],
  ['Impartner', 'impartner.com'],
  ['Allbound', 'allbound.com'],
  ['PartnerStack', 'partnerstack.com'],
  ['Kiflo', 'kiflo.com'],
  ['Channeltivity', 'channeltivity.com'],
  ['Magentrix', 'magentrix.com'],
  ['ZINFI', 'zinfi.net'],
];

export async function discoverByPrmTenancy(vendorDomain: string, vendorLabel: string): Promise<Candidate[]> {
  const now = new Date().toISOString();
  const out = new Map<string, Candidate>();
  const url = `https://api.certspotter.com/v1/issuances?domain=${vendorDomain}&include_subdomains=true&expand=dns_names`;
  const r = await get(url, { timeout: 30000 });
  if (!r.ok || !r.body?.startsWith('[')) return [];
  try {
    for (const c of JSON.parse(r.body) as { dns_names?: string[] }[]) {
      for (const n of c.dns_names ?? []) {
        const host = n.replace(/^\*\./, '').toLowerCase();
        // A tenant host looks like `partners.customer.com`, not `something.vendor.com`.
        if (host.endsWith(vendorDomain)) continue;
        const parts = host.split('.');
        if (parts.length < 3) continue;
        const label = parts[0];
        if (!/^(partners?|partnerportal|partner-portal|channel|resellers?|deals?)$/i.test(label)) continue;
        const domain = parts.slice(1).join('.');
        if (out.has(domain)) continue;
        out.set(domain, {
          name: domain, domain, mechanism: 'prm_tenancy',
          seed: vendorDomain, discoverySource: url,
          discoveryEvidence: `${host} appears in certificate transparency alongside ${vendorLabel}, so the company's partner portal is served by a commercial PRM platform`,
          discoveredAt: now, geography: null, sourceLanguage: null, entityConfidence: 'high',
        });
      }
    }
  } catch { /* malformed page */ }
  return [...out.values()];
}

export const PRM_SEEDS = PRM_TENANT_DOMAINS;

/* ══════════════════════════════════════════ 2 · PARTNER DIRECTORY HARVEST ══
 *
 * CAN DISCOVER: the organisations listed IN a company's partner directory — i.e. its
 *   partners. Those partners are frequently themselves channel operators (an SI that resells
 *   three vendors often runs its own programme), but that is a hypothesis, not a finding.
 * DOES NOT PROVE: that a harvested company operates any programme of its own. It proves only
 *   that it PARTICIPATES in someone else's.
 * SEGMENT BIAS: inherits the seed's sector entirely.
 * IDENTITY RISK: medium — directory entries are display names, not entities.
 * PRECISION for "operates a programme": LOW by construction. This is the participant trap
 *   the operator resolver exists to catch, and candidates from here must be treated as
 *   suspects rather than leads.
 * RECALL: high volume, low density.
 */

const CHROME_HOST = /(facebook|twitter|x\.com|linkedin|youtube|instagram|google|apple|w3\.org|schema\.org|gravatar|cloudfront|googleapis|cookiebot|onetrust|vimeo|hubspot|hs-sites|gstatic|cdn|fonts|youtu\.be|wa\.me|mailto)/i;

export async function harvestPartnerDirectory(directoryUrl: string, ownerDomain: string): Promise<Candidate[]> {
  const now = new Date().toISOString();
  const r = await get(directoryUrl, { timeout: 25000 });
  if (!r.ok || !r.body) return [];
  const own = ownerDomain.replace(/^www\./, '');
  const out = new Map<string, Candidate>();
  for (const m of r.body.matchAll(/<a\b[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]{0,120}?)<\/a>/gi)) {
    let host: string;
    try { host = new URL(m[1]).hostname.replace(/^www\./, '').toLowerCase(); } catch { continue; }
    if (host === own || host.endsWith(`.${own}`) || CHROME_HOST.test(host)) continue;
    if (out.has(host)) continue;
    const label = stripTags(m[2]).replace(/\s+/g, ' ').trim();
    out.set(host, {
      name: label || host, domain: host, mechanism: 'partner_directory_harvest',
      seed: ownerDomain, discoverySource: directoryUrl,
      discoveryEvidence: `listed in the partner directory published by ${own}; this establishes participation in that programme, NOT that the company operates one`,
      discoveredAt: now, geography: null, sourceLanguage: null, entityConfidence: 'medium',
    });
  }
  return [...out.values()];
}

/* ═══════════════════════════════════════════ 3 · DISTRIBUTOR INVERSION ══
 *
 * CAN DISCOVER: manufacturers and vendors sold through a commercial distributor.
 * DOES NOT PROVE: that the vendor manages an Introw-relevant programme directly. A
 *   distributor relationship is a supply chain; the vendor may run a direct programme too,
 *   or may not. Phase 2 measured 1 of 21 such candidates as transacting.
 * SEGMENT BIAS: entirely the distributor's catalogue — the only mechanism tested that reaches
 *   local-language industrial vendors.
 * GEOGRAPHY BIAS: the distributor's market.
 * PRECISION for "operates a programme": LOW. Seed source only.
 * RECALL for industrial: the highest of any mechanism tested.
 */

export interface DistributorSeed {
  id: string; indexUrl: string; slugPattern: RegExp; segment: string; country: string; lang: string;
}

export async function harvestDistributorCatalogue(seed: DistributorSeed): Promise<Candidate[]> {
  const now = new Date().toISOString();
  const r = await get(seed.indexUrl, { timeout: 40000 });
  if (!r.ok || !r.body) return [];
  const out = new Map<string, Candidate>();
  for (const m of r.body.matchAll(/href=["']([^"'\s]+)["']/gi)) {
    const slug = m[1].match(seed.slugPattern)?.[1];
    if (!slug) continue;
    const name = decodeURIComponent(slug).replace(/[-_+]+/g, ' ').trim();
    if (name.length < 2 || out.has(name.toLowerCase())) continue;
    out.set(name.toLowerCase(), {
      name, domain: null, mechanism: 'distributor_inversion',
      seed: seed.id, discoverySource: seed.indexUrl,
      discoveryEvidence: `carried in the vendor catalogue of ${seed.id}; the company sells through a commercial distributor, which does NOT establish that it operates a partner programme itself`,
      discoveredAt: now, geography: seed.country, sourceLanguage: seed.lang, entityConfidence: 'low',
    });
  }
  return [...out.values()];
}

/* ═══════════════════════════════════════════════ 4 · SEARCH PATTERN ══
 *
 * CAN DISCOVER: companies publishing channel language, in any sector or language.
 * DOES NOT PROVE: anything beyond the page existing.
 * SEGMENT BIAS: depends entirely on the query language. English channel queries return
 *   software; trade queries in German or Dutch return manufacturers. That is the lever.
 * IDENTITY RISK: medium. PRECISION: medium. RECALL: broad but shallow.
 * STABILITY: low — ranking changes under us.
 */

/** Generic and multilingual. No company name ever appears in a query. */
export const SEARCH_PATTERNS: { query: string; lang: string; expectedSegment: string }[] = [
  { query: '"become a partner" "deal registration" partner program', lang: 'en', expectedSegment: 'software' },
  { query: '"MSP partner program" "managed service provider" apply', lang: 'en', expectedSegment: 'it_security' },
  { query: '"become an authorized dealer" application form', lang: 'en', expectedSegment: 'manufacturing' },
  { query: '"certified installer" program apply manufacturer', lang: 'en', expectedSegment: 'manufacturing' },
  { query: '"system integrator partner program" industrial automation', lang: 'en', expectedSegment: 'industrial' },
  { query: '"Fachpartner werden" Hersteller Partnerprogramm', lang: 'de', expectedSegment: 'manufacturing' },
  { query: '"Vertriebspartner werden" Händlerprogramm', lang: 'de', expectedSegment: 'manufacturing' },
  { query: '"installateur worden" partnerprogramma fabrikant', lang: 'nl', expectedSegment: 'manufacturing' },
  { query: '"devenir revendeur" programme partenaire fabricant', lang: 'fr', expectedSegment: 'manufacturing' },
  { query: '"dealer worden" verdeler partnerprogramma', lang: 'nl', expectedSegment: 'manufacturing' },
];
