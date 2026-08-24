/**
 * Multi-domain resolution.
 *
 * WHY THIS EXISTS
 *   The cross-industry audit measured that physical-goods companies identify a partner motion
 *   40% of the time against 77% for software, and the largest single cause was not vocabulary.
 *   It was that the evidence is not on the domain we research. `vaillant.com` fails at the
 *   network layer while `vaillant.co.uk` returns 536 KB and `professional.vaillant.co.uk`
 *   returns 200 — and the installer programme lives on the latter two.
 *
 *   Multinational manufacturers publish their channel PER COUNTRY. A pipeline that researches
 *   one apex domain is structurally blind to them. This is a source-fidelity fix and it is
 *   sector-neutral: the same change reaches Personio and Contentful, which are software and
 *   also returned zero pages.
 *
 * THE OWNERSHIP CONTRACT
 *   A related domain is only usable if the company itself declares it. Ranked by authority:
 *
 *     1. hreflang alternates      — the company's own machine-readable statement of its
 *                                   locale sites. Strongest available evidence.
 *     2. same-brand outbound link — the homepage links to it and the registrable name shares
 *                                   the brand token.
 *     3. probed ccTLD             — we guessed. Only accepted when the site answers AND its
 *                                   own content carries the brand token, and it is always
 *                                   marked as the weakest basis.
 *
 *   Guessing `brand.de` and finding *a* website proves nothing: `bata.com` and `bata.de` were
 *   different companies in Phase 2, and `bover.de` resolved to `bover.pl`. Every accepted
 *   domain records how it was established so a wrong merge is auditable rather than silent.
 */

import { get, mainContent, stripTags } from '../lib/http.js';

export type DomainBasis = 'hreflang' | 'same_brand_link' | 'probed_cctld' | 'canonical';

export interface RelatedDomain {
  domain: string;
  basis: DomainBasis;
  /** ISO-ish region hint when the source declares one. Never inferred from the TLD alone. */
  region: string | null;
  language: string | null;
  /** Where the relationship was declared, so a wrong merge can be traced. */
  evidenceUrl: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface DomainResolution {
  canonical: string;
  related: RelatedDomain[];
  health: { url: string; ok: boolean; status: number; note?: string }[];
}

/**
 * The brand token: the registrable label with corporate suffixes stripped. `vaillant.co.uk`
 * and `vaillant.com` share `vaillant`; `bata.com` and `bata.de` also would, which is exactly
 * why a shared token alone is never sufficient.
 */
export function brandToken(domain: string): string {
  const label = domain.replace(/^www\./, '').split('.')[0] ?? '';
  return label.replace(/[^a-z0-9]/gi, '').toLowerCase()
    .replace(/(group|global|international|holding|company|corp|inc|gmbh|bv|nv|sa|ag)$/, '');
}

/** ccTLDs worth probing, chosen to match the markets the benchmark actually covers. */
const CCTLDS = ['de', 'co.uk', 'nl', 'fr', 'be', 'at', 'ch', 'se', 'dk', 'no', 'fi', 'it', 'es', 'pl', 'com'];

/** Subdomain labels that carry channel evidence. Not a general subdomain crawl. */
const CHANNEL_SUBDOMAIN = /^(partners?|partner-portal|partnerportal|dealers?|installers?|professional|pro|trade|channel|resellers?|distributors?|service|support|extranet|my|portal|business|b2b)$/i;

/**
 * Alternates the company declares itself, via hreflang. This is the single highest-authority
 * signal available and it costs one fetch we are making anyway.
 */
function hreflangAlternates(html: string, brand: string, canonicalHost: string): RelatedDomain[] {
  const out: RelatedDomain[] = [];
  const seen = new Set<string>();
  for (const m of html.matchAll(/<link[^>]+hreflang=["']([a-zA-Z-]{2,10})["'][^>]*href=["'](https?:\/\/[^"']+)["']/gi)) {
    push(m[1], m[2]);
  }
  for (const m of html.matchAll(/<link[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*hreflang=["']([a-zA-Z-]{2,10})["']/gi)) {
    push(m[2], m[1]);
  }
  function push(tag: string, href: string) {
    let host: string;
    try { host = new URL(href).hostname.replace(/^www\./, '').toLowerCase(); } catch { return; }
    if (seen.has(host)) return;
    seen.add(host);
    if (host === canonicalHost) return;   // hreflang routinely lists the page's own host
    // hreflang legitimately points at path-based locales on the same host; those need no
    // domain resolution, only URL discovery.
    if (brandToken(host) !== brand) return;
    const [lang, region] = tag.toLowerCase().split('-');
    out.push({
      domain: host, basis: 'hreflang',
      region: region?.toUpperCase() ?? null, language: lang ?? null,
      evidenceUrl: href, confidence: 'high',
    });
  }
  return out;
}

/** Outbound links to a domain sharing the brand token. Weaker than hreflang, still declared. */
function sameBrandLinks(html: string, brand: string, canonical: string, pageUrl: string): RelatedDomain[] {
  const out = new Map<string, RelatedDomain>();
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"'\s]+)["']/gi)) {
    let host: string;
    try { host = new URL(m[1]).hostname.replace(/^www\./, '').toLowerCase(); } catch { continue; }
    if (host === canonical || out.has(host)) continue;
    if (brandToken(host) !== brand) continue;
    if (host.endsWith(`.${canonical}`)) continue;   // subdomains are handled separately
    out.set(host, { domain: host, basis: 'same_brand_link', region: null, language: null, evidenceUrl: pageUrl, confidence: 'medium' });
  }
  return [...out.values()];
}

/** Does this site's own content carry the brand? Guards against same-name collisions. */
async function confirmsBrand(domain: string, brand: string): Promise<{ ok: boolean; status: number }> {
  let r = await get(`https://www.${domain}/`, { timeout: 20000 });
  if (!r.ok || !r.body) r = await get(`https://${domain}/`, { timeout: 20000 });
  if (!r.ok || !r.body) return { ok: false, status: r.status };
  const text = stripTags(mainContent(r.body)).slice(0, 4000).toLowerCase();
  const title = (r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '').toLowerCase();
  return { ok: (title + ' ' + text).replace(/[^a-z0-9]/g, '').includes(brand), status: r.status };
}

export interface ResolveOptions {
  /** Country domains to probe when the company declares none. Bounded; 0 disables probing. */
  probeBudget?: number;
  /** Subdomains already known from DNS/certificate transparency. */
  knownHosts?: string[];
}

export async function resolveDomains(bareDomain: string, opts: ResolveOptions = {}): Promise<DomainResolution> {
  const canonical = bareDomain.replace(/^www\./, '').toLowerCase();
  const brand = brandToken(canonical);
  const related = new Map<string, RelatedDomain>();
  const health: DomainResolution['health'] = [];

  let home = await get(`https://www.${canonical}/`, { timeout: 20000 });
  if (!home.ok || !home.body) home = await get(`https://${canonical}/`, { timeout: 20000 });
  health.push({ url: `https://${canonical}/`, ok: home.ok, status: home.status });

  if (home.ok && home.body) {
    for (const d of hreflangAlternates(home.body, brand, canonical)) related.set(d.domain, d);
    for (const d of sameBrandLinks(home.body, brand, canonical, `https://${canonical}/`)) {
      if (!related.has(d.domain)) related.set(d.domain, d);
    }
  }

  /**
   * Probing runs only when the company declared nothing AND its apex is unreachable — the
   * Vaillant shape. Probing a healthy site would add collision risk for no gain.
   */
  const budget = opts.probeBudget ?? 0;
  /**
   * `blocked` means we were refused, not that the domain is wrong. Probing ccTLDs in that
   * case invents alternates for a site that is perfectly real — it produced `contentful.be`
   * for a company whose apex merely returned 429. Probe only on genuine non-resolution.
   */
  const genuinelyUnreachable = !home.ok && !home.blocked && (home.status === 0 || home.status === 404);
  if (budget > 0 && related.size === 0 && genuinelyUnreachable && brand.length >= 4) {
    let spent = 0;
    for (const tld of CCTLDS) {
      if (spent >= budget) break;
      const cand = `${brand}.${tld}`;
      if (cand === canonical || related.has(cand)) continue;
      spent++;
      const check = await confirmsBrand(cand, brand);
      health.push({ url: `https://${cand}/`, ok: check.ok, status: check.status, note: check.ok ? 'brand confirmed in content' : 'no brand match' });
      if (check.ok) {
        related.set(cand, {
          domain: cand, basis: 'probed_cctld',
          region: tld === 'co.uk' ? 'GB' : tld === 'com' ? null : tld.toUpperCase(),
          language: null, evidenceUrl: `https://${cand}/`, confidence: 'low',
        });
      }
    }
  }

  // Channel-bearing subdomains from certificate transparency / passive DNS. Ownership is not
  // in question here: they are already under the canonical domain.
  for (const h of opts.knownHosts ?? []) {
    const host = h.replace(/^www\./, '').toLowerCase();
    if (!host.endsWith(canonical) || host === canonical) continue;
    const label = host.slice(0, host.length - canonical.length - 1).split('.')[0];
    if (!CHANNEL_SUBDOMAIN.test(label)) continue;
    if (related.has(host)) continue;
    related.set(host, {
      domain: host, basis: 'canonical', region: null, language: null,
      evidenceUrl: `dns:${host}`, confidence: 'high',
    });
  }

  return { canonical, related: [...related.values()], health };
}

/**
 * Which related domains are worth researching, and in what order.
 *
 * Not all of them: a company with 40 hreflang alternates would otherwise cost 40× a single
 * research pass for evidence that is mostly the same programme translated. Channel subdomains
 * come first because they are the highest-yield surface, then a bounded spread of locales.
 */
export function selectForResearch(res: DomainResolution, limit = 3): RelatedDomain[] {
  /**
   * Markets whose sites are most likely to carry a full channel programme in a language the
   * pipeline reads. Ranking by `language === 'en'` alone picked Somfy's Egyptian and Chinese
   * English locales out of 45 alternates — technically English, commercially useless.
   */
  const MAJOR = ['GB', 'US', 'DE', 'NL', 'BE', 'FR', 'AT', 'CH', 'SE', 'IE'];
  const rank = (d: RelatedDomain): number => {
    if (d.basis === 'canonical') return 0;                    // partners./pro./dealer. subdomains
    const majorIdx = d.region ? MAJOR.indexOf(d.region) : -1;
    if (majorIdx >= 0) return 1 + majorIdx * 0.01;            // major markets, in preference order
    if (d.basis === 'hreflang' && d.language === 'en') return 3;
    if (d.basis === 'hreflang') return 4;
    if (d.basis === 'same_brand_link') return 5;
    return 6;
  };
  return [...res.related].sort((a, b) => rank(a) - rank(b)).slice(0, limit);
}
