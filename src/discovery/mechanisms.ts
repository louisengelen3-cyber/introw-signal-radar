/**
 * Discovery mechanisms.
 *
 * Discovery and classification are separate problems. This file answers only the
 * first: *can we find candidate companies with channel motion at all*, without
 * being handed a domain list. Recall matters here; precision is the classifier's job.
 *
 * Deliberately excluded: YC, venture-backed lists, ATS boards, funding feeds. Those
 * define a universe by financing rather than by channel motion, and Phase 0 showed
 * four of Introw's six segments are invisible to them.
 */

import { get, mainContent, stripTags } from '../lib/http.js';
import type { Confidence, SourceRef } from '../domain/types.js';

export interface Candidate {
  /** As published by the discovering source. Not yet an entity. */
  name: string;
  /** Resolved later; null until entity resolution runs. */
  domain: string | null;
  mechanism: string;
  source: SourceRef;
  /** Why this source thinks the company is channel-relevant. */
  channelHint: string;
  /** Segment the discovering source implies, used to measure coverage diversity. */
  segmentHint: string;
}

/* ─────────────────────────────────────────── M1 · distributor inversion ── */

/**
 * A distributor's vendor list is a near-tautological channel-motion list: if a
 * distributor sells your product, you operate a transacting channel. It is also
 * the only mechanism tested that reaches the local-language industrial segment —
 * a Belgian electrical wholesaler yields hundreds of manufacturer brands.
 */
export interface DistributorSeed {
  id: string;
  /** Index page listing the vendors/brands carried. */
  indexUrl: string;
  /** Extracts a vendor slug or name from an on-site link path. */
  slugPattern: RegExp;
  segment: string;
  country: string;
  lang: string;
}

export const DISTRIBUTOR_SEEDS: DistributorSeed[] = [
  { id: 'exclusive_networks', indexUrl: 'https://www.exclusive-networks.com/ecosystem/vendors', slugPattern: /\/ecosystem\/vendors\/([a-z0-9-]{2,60})\/?$/i, segment: 'cybersecurity', country: 'FR', lang: 'en' },
  { id: 'infinigate', indexUrl: 'https://www.infinigate.com/vendors/', slugPattern: /\/vendors\/([a-z0-9-]{2,80})\/?$/i, segment: 'it_security', country: 'CH', lang: 'en' },
  { id: 'cebeo', indexUrl: 'https://www.cebeo.be/catalog/nl-be/brand', slugPattern: /\/brand\/([A-Za-z0-9_%+.\- ]{2,60})$/, segment: 'electrical_industrial', country: 'BE', lang: 'nl' },
];

export async function harvestDistributor(seed: DistributorSeed): Promise<{ candidates: Candidate[]; retrieval: SourceRef; ok: boolean }> {
  const r = await get(seed.indexUrl, { timeout: 40000 });
  const source: SourceRef = {
    url: seed.indexUrl,
    authority: 'counterparty',
    establishes: 'a distributor publicly lists these companies as vendors it sells',
    observedAt: r.retrievedAt,
    retrievedAt: r.retrievedAt,
    httpStatus: r.status,
    blocked: r.blocked,
  };
  if (!r.ok || !r.body) return { candidates: [], retrieval: source, ok: false };

  const host = new URL(r.finalUrl ?? seed.indexUrl).hostname;
  const found = new Map<string, string>(); // slug -> display name
  for (const m of r.body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,200}?)<\/a>/gi)) {
    let u: URL;
    try { u = new URL(m[1], r.finalUrl ?? seed.indexUrl); } catch { continue; }
    if (u.hostname !== host) continue;
    const g = seed.slugPattern.exec(u.pathname);
    if (!g) continue;
    const slug = decodeURIComponent(g[1]).trim();
    if (!slug || slug.length < 2) continue;
    const anchor = stripTags(m[2]).trim();
    const display = anchor && anchor.length > 1 && anchor.length < 70 ? anchor : slug.replace(/-/g, ' ');
    if (!found.has(slug.toLowerCase())) found.set(slug.toLowerCase(), display);
  }

  const candidates: Candidate[] = [...found.entries()].map(([slug, name]) => ({
    name,
    domain: null,
    mechanism: `distributor_inversion:${seed.id}`,
    source: { ...source, url: new URL(seed.slugPattern.source.includes('brand') ? `${seed.indexUrl}/${encodeURIComponent(slug)}` : `${seed.indexUrl.replace(/\/$/, '')}/${slug}`, seed.indexUrl).toString() },
    channelHint: `carried by ${seed.id}, a ${seed.segment} distributor`,
    segmentHint: seed.segment,
  }));
  return { candidates, retrieval: source, ok: true };
}

/* ──────────────────────────────────────── M2 · partner-directory harvest ─ */

/**
 * A vendor's partner directory lists partner organisations. Most are channel
 * *participants* rather than operators, so precision for our purposes is expected
 * to be low — but resellers, MSPs, SIs and distributors frequently run programmes
 * of their own, and this mechanism reaches companies no vendor list contains.
 */
export async function harvestPartnerDirectory(directoryUrl: string, ownerDomain: string): Promise<{ candidates: Candidate[]; ok: boolean }> {
  const r = await get(directoryUrl, { timeout: 40000 });
  if (!r.ok || !r.body) return { candidates: [], ok: false };
  const source: SourceRef = {
    url: directoryUrl,
    authority: 'counterparty',
    establishes: 'a vendor lists these organisations in its partner directory',
    observedAt: r.retrievedAt,
    retrievedAt: r.retrievedAt,
    httpStatus: r.status,
  };
  const hosts = new Map<string, string>();
  for (const m of r.body.matchAll(/<a\b[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]{0,160}?)<\/a>/gi)) {
    let u: URL;
    try { u = new URL(m[1]); } catch { continue; }
    const h = u.hostname.replace(/^www\./, '');
    if (!h || h === ownerDomain || h.endsWith('.' + ownerDomain)) continue;
    if (/(facebook|twitter|x\.com|linkedin|youtube|instagram|google|apple|w3\.org|schema|gravatar|cloudfront|googleapis|cookiebot|onetrust|vimeo|github|hubspot)/i.test(h)) continue;
    const anchor = stripTags(m[2]).trim();
    if (!hosts.has(h)) hosts.set(h, anchor && anchor.length < 70 ? anchor : h);
  }
  return {
    ok: true,
    candidates: [...hosts.entries()].map(([domain, name]) => ({
      name, domain, mechanism: 'partner_directory_harvest', source,
      channelHint: `listed as a partner of ${ownerDomain}`,
      segmentHint: 'channel_participant',
    })),
  };
}

/* ───────────────────────────────────────── M3 · platform tenancy (weak) ── */

/**
 * Partner-platform vendors host some customers on their own subdomains. Measured in
 * Phase 1 as sparse — most tenants use a custom domain CNAMEd to the vendor, whose
 * certificate is issued under the *customer's* domain and therefore does not appear
 * here. Retained because its precision is near-perfect when it does fire.
 */
const INFRA_LABEL = /^(www|api|app|cdn|static|assets|mail|smtp|mx|ns\d?|dev|staging|stg|test|qa|uat|demo|docs|help|support|status|blog|admin|dashboard|auth|login|sso|files|img|images|media|link|go|track|email|mktg|marketing|events|jobs|careers|autodiscover|_domainkey|_dmarc|em\d+|sni|cname|edge|preview|sandbox|internal|vpn|git|ci|trust|updates|releases|community|directory|compare|video|get|try|sales|resources|developers?|content|webhooks?|skills|reporting|links)$/i;

export async function harvestPlatformTenants(vendorDomain: string, pages = 4): Promise<Candidate[]> {
  const labels = new Set<string>();
  let after = '';
  let lastRetrieval = new Date().toISOString();
  for (let i = 0; i < pages; i++) {
    const url = `https://api.certspotter.com/v1/issuances?domain=${vendorDomain}&include_subdomains=true&expand=dns_names${after ? '&after=' + after : ''}`;
    const r = await get(url, { timeout: 30000 });
    if (!r.ok || !r.body?.startsWith('[')) break;
    lastRetrieval = r.retrievedAt;
    let batch: { id: string; dns_names?: string[] }[];
    try { batch = JSON.parse(r.body); } catch { break; }
    if (!batch.length) break;
    for (const c of batch) {
      for (const n of c.dns_names ?? []) {
        const h = n.replace(/^\*\./, '').toLowerCase();
        if (!h.endsWith('.' + vendorDomain)) continue;
        const label = h.slice(0, h.length - vendorDomain.length - 1);
        if (label.includes('.') || label.length < 3 || INFRA_LABEL.test(label)) continue;
        labels.add(label);
      }
    }
    after = batch[batch.length - 1].id;
  }
  const source: SourceRef = {
    url: `https://api.certspotter.com/v1/issuances?domain=${vendorDomain}`,
    authority: 'vendor_hosted',
    establishes: 'a partner-platform vendor issued a certificate for this tenant subdomain',
    observedAt: lastRetrieval,
    retrievedAt: lastRetrieval,
  };
  return [...labels].map((label) => ({
    name: label.replace(/-/g, ' '),
    domain: null,
    mechanism: `platform_tenancy:${vendorDomain}`,
    source,
    channelHint: `hosts a partner surface on ${vendorDomain}`,
    segmentHint: 'prm_tenant',
  }));
}

/* ────────────────────────────────────────────── entity resolution ──────── */

export interface Resolution {
  domain: string | null;
  confidence: Confidence;
  method: string;
  state: 'resolved' | 'ambiguous' | 'unresolved';
  checked: string[];
}

const TLDS = ['com', 'io', 'eu', 'nl', 'be', 'de', 'fr', 'at', 'ch', 'it', 'es', 'se', 'dk', 'net', 'co', 'ai', 'tech'];

const LEGAL_SUFFIX = /\b(gmbh|bv|nv|sa|sas|sarl|ltd|limited|inc|llc|plc|ag|kg|se|oy|ab|aps|spa|srl|group|holding|international|europe|benelux|worldwide)\b/gi;

function normalise(name: string): string {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(LEGAL_SUFFIX, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(name: string): string {
  return normalise(name).replace(/\s+/g, '');
}

/**
 * Candidate hostname labels for a company name, most specific first.
 * Industrial brands are frequently hyphenated ("Pepperl+Fuchs" -> pepperl-fuchs) or
 * shortened to their first token ("LAPP CABLE" -> lapp); guessing only the collapsed
 * form silently loses that whole segment.
 */
function labelCandidates(name: string): string[] {
  const words = normalise(name).split(/\s+/).filter((w) => w.length > 1 && w !== 'and');
  const out = new Set<string>();
  if (words.length) {
    out.add(words.join(''));
    if (words.length > 1) {
      out.add(words.join('-'));
      out.add(words[0]);
      out.add(words.slice(0, 2).join(''));
      out.add(words.slice(0, 2).join('-'));
    }
  }
  return [...out].filter((l) => l.length >= 3 && l.length <= 40);
}

/**
 * Name → domain, verified rather than guessed. Phase 0 measured a 1-in-22 error
 * rate on hand-mapping, so a guessed domain that is not corroborated by the site
 * itself is returned as `unresolved`, never as a low-confidence answer.
 */
export async function resolveDomain(name: string, hintUrl?: string): Promise<Resolution> {
  const checked: string[] = [];

  // 1. If the discovering page links straight out to the vendor, prefer that.
  if (hintUrl) {
    const r = await get(hintUrl, { timeout: 25000 });
    if (r.ok && r.body) {
      const host = new URL(r.finalUrl ?? hintUrl).hostname;
      const ext = new Map<string, number>();
      for (const m of r.body.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)) {
        try {
          const h = new URL(m[1]).hostname.replace(/^www\./, '');
          if (!h || h === host || host.endsWith(h) || h.endsWith(host.replace(/^www\./, ''))) continue;
          if (/(facebook|twitter|x\.com|linkedin|youtube|instagram|google|apple|w3\.org|schema|cookie|vimeo|cdn|cloudinary|bunny|hubs\.ly|powerbi|wpengine)/i.test(h)) continue;
          ext.set(h, (ext.get(h) ?? 0) + 1);
        } catch { /* skip */ }
      }
      const slug = slugify(name);
      const match = [...ext.keys()].find((h) => slugify(h.split('.')[0]).includes(slug) || slug.includes(slugify(h.split('.')[0])));
      if (match) {
        checked.push(hintUrl);
        return { domain: match, confidence: 'high', method: 'outbound link on discovering page matches company name', state: 'resolved', checked };
      }
    }
  }

  // 2. Guess a domain, then require the site to corroborate the name.
  //    A live site that does not mention the company is a DIFFERENT company, so the
  //    resolver refuses rather than returning a low-confidence answer. Phase 1 spot
  //    checks confirmed these refusals catch parked domains and unrelated entities.
  const labels = labelCandidates(name);
  const tokens = normalise(name).split(/\s+/).filter((w) => w.length > 2);
  let sawLiveMismatch = '';
  // Bounded: an unresolvable name must not cost more than a resolvable one.
  const MAX_PROBES = 16;
  outer: for (const label of labels) {
    for (const tld of TLDS) {
      if (checked.length >= MAX_PROBES) break outer;
      const domain = `${label}.${tld}`;
      if (checked.includes(domain)) continue;
      checked.push(domain);
      let hit = await get(`https://www.${domain}/`, { timeout: 10000 });
      if (!hit.ok || !hit.body) hit = await get(`https://${domain}/`, { timeout: 10000 });
      if (!hit.ok || !hit.body || hit.body.length < 500) continue;
      const title = /<title[^>]*>([\s\S]{0,200}?)<\/title>/i.exec(hit.body)?.[1] ?? '';
      const head = mainContent(hit.body).slice(0, 2000);
      const hay = normalise(`${title} ${head}`).replace(/\s+/g, '');
      // Corroboration: every significant token of the name appears on the page.
      const corroborated = tokens.length > 0 && tokens.every((t) => hay.includes(t));
      if (corroborated) {
        return { domain, confidence: 'medium', method: `guessed ${domain}; page corroborates every name token`, state: 'resolved', checked };
      }
      if (!sawLiveMismatch) sawLiveMismatch = domain;
    }
  }
  if (sawLiveMismatch) {
    return { domain: null, confidence: 'low', method: `${sawLiveMismatch} and ${checked.length - 1} other candidates resolve but none corroborate the name — likely different entities`, state: 'ambiguous', checked };
  }
  return { domain: null, confidence: 'low', method: 'no corroborated domain found', state: 'unresolved', checked };
}
