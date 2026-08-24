/**
 * Partner-surface discovery.
 *
 * WHAT IT DOES
 *   Given a company and its resolved domains, find the URLs that plausibly carry channel
 *   evidence — without crawling the site.
 *
 * WHY NOT JUST PROBE PATHS
 *   `/partners` is a SaaS convention. Fronius publishes under
 *   `/solar-energy/installers-partners/service-support/fronius-system-partner`, which no
 *   fixed path list will ever contain. The sitemap does contain it, and sitemaps are cheap,
 *   declared by the company, and equally available to a manufacturer and a SaaS vendor.
 *
 * ORDER OF PREFERENCE, and why:
 *   1. SITEMAP  — the company's own index of its own URLs. One fetch, no guessing, and it is
 *                 the only mechanism that finds deep vendor-specific paths.
 *   2. NAVIGATION — links from the homepage. Reaches what a visitor would reach.
 *   3. PATH PROBE — conventional paths, English and trade, as a fallback when the first two
 *                 yield nothing.
 *
 * WHAT IT DOES NOT PROVE
 *   That any URL found contains a partner programme. It finds candidate surfaces; the
 *   existing evidence layer decides what they mean.
 */

import { get, mainContent, stripTags } from '../lib/http.js';

export type SurfaceOrigin = 'sitemap' | 'navigation' | 'path_probe';

export interface Surface {
  url: string;
  origin: SurfaceOrigin;
  /** Which vocabulary matched, kept so a reviewer can see why this URL was chosen. */
  matched: string;
  domain: string;
}

/**
 * Channel vocabulary as it appears IN URLS, across the languages the benchmark covers.
 *
 * URL vocabulary is deliberately broader than prose vocabulary: a path is a weak, cheap
 * signal used to decide what to fetch, and a wrong fetch costs one request. Prose vocabulary
 * decides what a company IS and stays strict.
 */
const URL_VOCAB: [string, RegExp][] = [
  // English — software and trade alike
  ['partner', /\/(partners?|partner-program(me)?|partnership[s]?|partner-network|become-a-partner|partner-portal|partner-locator|find-a-partner)\b/i],
  ['reseller', /\/(resellers?|reseller-program(me)?|var|value-added-reseller)\b/i],
  ['dealer', /\/(dealers?|dealer-locator|find-a-dealer|become-a-dealer|dealer-network|where-to-buy|buy|stockists?)\b/i],
  ['installer', /\/(installers?|installer-locator|find-an-installer|become-an-installer|certified-installers?|approved-installers?)\b/i],
  ['distributor', /\/(distributors?|distribution|find-a-distributor|authorized-distributors?)\b/i],
  ['integrator', /\/(system-integrators?|integrators?|si-partners?)\b/i],
  ['msp', /\/(msp|mssp|managed-service-providers?)\b/i],
  ['service', /\/(service-partners?|service-network|service-centers?|service-centres?|maintenance-partners?)\b/i],
  ['solution', /\/(solution-partners?|solution-providers?|technology-partners?|oem-partners?)\b/i],
  ['channel', /\/(channel|channel-partners?|channel-program(me)?)\b/i],
  ['certification', /\/(certified|certification|accredited|training-partners?|academy)\b/i],
  // Dutch
  ['nl', /\/(installateurs?|installatiepartners?|verdelers?|wederverkopers?|dealerzoeker|dealer-zoeken|verkooppunten?|vakhandel|servicepartners?|partnerprogramma)\b/i],
  // German
  ['de', /\/(haendler|händler|fachhaendler|fachhändler|haendlersuche|händlersuche|vertriebspartner|installateure?|wiederverkaeufer|servicepartner|systemintegrator|fachpartner|fachbetriebe?|bezugsquellen?)\b/i],
  // French
  ['fr', /\/(revendeurs?|distributeurs?|installateurs?|partenaires?|integrateurs?|points?-de-vente|trouver-un-revendeur|ou-acheter)\b/i],
  // Nordic / Italian / Spanish, minimal
  ['nordic', /\/(forhandler|återförsäljare|aterforsaljare|jälleenmyyjä)\b/i],
  ['it_es', /\/(rivenditori?|distributori?|installatori?|distribuidores?|instaladores?)\b/i],
];

/** Paths that look channel-ish but are product or corporate content. */
const URL_EXCLUDE = /\/(blog|news|press|glossary|resources?|academy\/[a-z-]+\/|careers?|jobs?|legal|privacy|cookie|terms|investor|sustainability|products?\/|shop\/|cart|checkout)\b/i;

/** Build artefacts and binaries. Navigation extraction picked up Next.js chunks as "partner"
 *  surfaces on quatt.io purely because the bundler path contained the word. */
const NON_DOCUMENT = /\.(css|js|mjs|json|webmanifest|xml|txt|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot|mp4|zip|map)(\?|$)/i;
const BUILD_PATH = /\/(_next|_nuxt|static|assets?|dist|build|cdn-cgi|wp-content|wp-includes)\/|\/(oauth|login|signin|sign-in|logout|callback|api)(\/|$)/i;

function matchVocab(url: string): string | null {
  if (NON_DOCUMENT.test(url) || BUILD_PATH.test(url)) return null;
  if (URL_EXCLUDE.test(url)) return null;
  for (const [label, re] of URL_VOCAB) if (re.test(url)) return label;
  return null;
}

/**
 * Collapse near-duplicates.
 *
 * A dealer locator generates one URL per city — Vaillant's sitemap yielded
 * `/fachpartner-finden/heizungsbauer-in-der-naehe/{frankfurt,berlin,hamburg,…}` — and a
 * multilingual site repeats the same page per locale. Both are ONE surface for our purposes,
 * and keeping them all would spend the whole fetch budget on the same page.
 */
function surfaceKey(url: string): string {
  try {
    const u = new URL(url);
    const segs = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean);
    // Drop a leading locale segment (en, de-de, fr-be, nl_NL).
    if (segs.length && /^[a-z]{2}([-_][a-z]{2})?$/i.test(segs[0])) segs.shift();
    // Drop trailing leaves REPEATEDLY while the parent still carries the channel vocabulary.
    // Vaillant nests city under region under locator, so a single pop left
    // `/fachpartner-finden/heizungsbauer-in-der-naehe/frankfurt` distinct from its own parent.
    while (segs.length > 1 && matchVocab('/' + segs.slice(0, -1).join('/'))) segs.pop();
    return `${u.hostname.replace(/^www\./, '').split('.').slice(0, -1).join('.')}|${segs.join('/')}`;
  } catch { return url; }
}

/* ── sitemap ─────────────────────────────────────────────────────────────── */

/** Follow at most this many child sitemaps from an index. Enterprise sites have hundreds. */
const MAX_CHILD_SITEMAPS = 6;
const MAX_SITEMAP_BYTES = 6_000_000;

async function sitemapUrls(domain: string): Promise<{ urls: string[]; checked: string[] }> {
  const checked: string[] = [];
  const found = new Set<string>();

  const roots = [`https://www.${domain}/sitemap.robots.xml`, `https://www.${domain}/sitemap.xml`, `https://www.${domain}/sitemap_index.xml`, `https://${domain}/sitemap.xml`];
  let body: string | null = null;
  let usedRoot = '';
  for (const r of roots) {
    const res = await get(r, { timeout: 25000 });
    checked.push(r);
    if (res.ok && res.body && res.body.includes('<')) { body = res.body; usedRoot = r; break; }
  }
  // robots.txt is the declared location when the conventional paths are absent.
  if (!body) {
    const rob = await get(`https://www.${domain}/robots.txt`, { timeout: 15000 });
    checked.push(`https://www.${domain}/robots.txt`);
    const declared = [...(rob.body ?? '').matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]).slice(0, 2);
    for (const d of declared) {
      const res = await get(d, { timeout: 25000 });
      checked.push(d);
      if (res.ok && res.body) { body = res.body; usedRoot = d; break; }
    }
  }
  if (!body) return { urls: [], checked };

  const collect = (xml: string) => {
    for (const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)) found.add(m[1]);
  };
  collect(body);

  // A sitemap index points at child sitemaps. Follow only those whose own URL suggests
  // channel content, so an enterprise site's 300 product sitemaps are not fetched.
  if (/<sitemapindex/i.test(body)) {
    const children = [...found].filter((u) => /\.xml/i.test(u));
    found.clear();
    const ranked = children.sort((a, b) => (matchVocab(a) ? -1 : 0) - (matchVocab(b) ? -1 : 0));
    let n = 0;
    for (const c of ranked) {
      if (n >= MAX_CHILD_SITEMAPS) break;
      // Always take a couple of generic children; prefer channel-looking ones.
      const res = await get(c, { timeout: 25000 });
      n++;
      checked.push(c);
      if (res.ok && res.body && res.body.length < MAX_SITEMAP_BYTES) collect(res.body);
    }
  }
  void usedRoot;
  return { urls: [...found], checked };
}

/* ── navigation ──────────────────────────────────────────────────────────── */

async function navigationUrls(domain: string): Promise<string[]> {
  let r = await get(`https://www.${domain}/`, { timeout: 20000 });
  if (!r.ok || !r.body) r = await get(`https://${domain}/`, { timeout: 20000 });
  if (!r.ok || !r.body) return [];
  const out = new Set<string>();
  for (const m of r.body.matchAll(/href=["']([^"'\s>]+)["']/gi)) {
    try {
      const u = new URL(m[1], `https://${domain}/`);
      if (u.hostname.replace(/^www\./, '').endsWith(domain)) out.add(u.toString().split('#')[0]);
    } catch { /* skip */ }
  }
  return [...out];
}

/* ── probe ───────────────────────────────────────────────────────────────── */

const PROBE_PATHS = [
  '/partners', '/partner', '/partner-program', '/partnerships', '/become-a-partner',
  '/resellers', '/dealers', '/dealer-locator', '/find-a-dealer', '/where-to-buy',
  '/installers', '/find-an-installer', '/distributors', '/service-partners',
  '/system-integrators', '/solution-partners', '/channel-partners',
  '/haendlersuche', '/vertriebspartner', '/fachpartner', '/installateure',
  '/installateurs', '/verkooppunten', '/partnerprogramma', '/vakhandel',
  '/revendeurs', '/partenaires', '/points-de-vente',
];

/* ── soft-404 ────────────────────────────────────────────────────────────── */

/**
 * A 200 that is really a miss. The industrial probe in the audit was invalidated by this:
 * loxone.com returned HTTP 200 for all 35 trade paths it was given.
 */
const SOFT_404 = /(?:^|[^\p{L}])(?:page not found|404 error|seite nicht gefunden|pagina niet gevonden|page introuvable|niet gevonden|nicht gefunden|the page you (?:requested|were looking for)|does not exist|no longer available|p[áa]gina no encontrada|no se encontr[óo] la p[áa]gina|pagina non trovata|sidan (?:kunde inte hittas|hittades inte)|side ikke fundet)(?![\p{L}])/iu;

export function isSoft404(text: string, title: string): boolean {
  return SOFT_404.test(title) || SOFT_404.test(text.slice(0, 900));
}

export interface SurfaceDiscovery {
  surfaces: Surface[];
  health: { url: string; status: number; ok: boolean; note?: string }[];
  sitemapChecked: number;
  softNotFound: number;
}

export interface FindOptions {
  /** Domains to search, canonical first. */
  domains: string[];
  /** Maximum surfaces returned across all domains. */
  limit?: number;
  /** Fetch probe paths only when sitemap+navigation found nothing on that domain. */
  probeFallback?: boolean;
}

export async function findPartnerSurfaces(opts: FindOptions): Promise<SurfaceDiscovery> {
  const surfaces = new Map<string, Surface>();
  const health: SurfaceDiscovery['health'] = [];
  let sitemapChecked = 0;
  let softNotFound = 0;

  for (const domain of opts.domains) {
    const before = surfaces.size;

    const sm = await sitemapUrls(domain);
    sitemapChecked += sm.checked.length;
    for (const u of sm.urls) {
      const m = matchVocab(u);
      if (!m) continue;
      const key = surfaceKey(u);
      if (!surfaces.has(key)) surfaces.set(key, { url: u, origin: 'sitemap', matched: m, domain });
    }

    if (surfaces.size === before) {
      for (const u of await navigationUrls(domain)) {
        const m = matchVocab(u);
        if (!m) continue;
        const key = surfaceKey(u);
        if (!surfaces.has(key)) surfaces.set(key, { url: u, origin: 'navigation', matched: m, domain });
      }
    }

    if (surfaces.size === before && opts.probeFallback !== false) {
      for (const p of PROBE_PATHS) {
        const url = `https://www.${domain}${p}`;
        const r = await get(url, { timeout: 15000 });
        if (!r.ok || !r.body || r.body.length < 1200) continue;
        const text = stripTags(mainContent(r.body));
        const title = r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '';
        if (isSoft404(text, title)) { softNotFound++; health.push({ url, status: r.status, ok: false, note: 'soft 404' }); continue; }
        if (text.length < 250) continue;
        surfaces.set(surfaceKey(url), { url, origin: 'path_probe', matched: matchVocab(url) ?? 'probe', domain });
      }
    }
  }

  /**
   * A multilingual site publishes the same page per locale under fully translated paths, so
   * path-based dedup cannot see they are the same. Prefer the English or canonical-locale
   * copy and cap the rest: Niko returned the same two pages in seven languages.
   */
  const localeRank = (u: string): number => {
    if (/\/(en|en-[a-z]{2})\//i.test(u)) return 0;
    if (/\/[a-z]{2}-[a-z]{2}\//i.test(u)) return 2;
    return 1;
  };
  const ordered = [...surfaces.values()].sort((a, b) => localeRank(a.url) - localeRank(b.url));
  return { surfaces: ordered.slice(0, opts.limit ?? 24), health, sitemapChecked, softNotFound };
}
