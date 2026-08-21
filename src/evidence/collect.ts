/**
 * Channel-evidence collection for one company.
 *
 * Every mechanism here was validated in Phase 0. The URL inventory is deliberately
 * built from three complementary sources because each found surfaces the others
 * missed — Cumulocity exposes zero partner surfaces to a crawler and decisive
 * evidence to DNS.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { get, mainContent, stripTags } from '../lib/http.js';
import type { PartnerCount, SourceRef } from '../domain/types.js';
import { PRODUCT_PATH, URL_SHAPES } from './taxonomy.js';

const exec = promisify(execFile);

/** Partner-platform and directory vendors, matched against CNAME targets. */
export const PLATFORM_VENDORS: [string, RegExp][] = [
  ['introw', /\bintrow\.(?:io|com)\b/i],
  ['partnerstack', /partnerstack\.com|\.pstk\.io|growsumo/i],
  ['impartner', /impartner\.(?:com|io)/i],
  ['allbound', /allbound\.com/i],
  ['channeltivity', /channeltivity\.com/i],
  ['zinfi', /zinfi\.(?:com|net)/i],
  ['magentrix', /magentrix\.com/i],
  ['kiflo', /kiflo\.com/i],
  ['partnerportal_io', /partnerportal\.io/i],
  ['workspan', /workspan\.com/i],
  ['mindmatrix', /mindmatrix\.net/i],
  ['kademi', /kademi\.co/i],
  ['channext', /channext\.com/i],
  ['unifyr', /unifyr\.com/i],
  ['partnerpage', /partnerpage\.io/i],
  ['partnerfleet', /partnerfleet\.io/i],
  ['crossbeam', /crossbeam\.com|reveal\.co/i],
];

/** Hostnames worth probing for a partner surface. Union'd with DNS/CT discovery. */
const PROBE_SUBDOMAINS = [
  'partners', 'partner', 'portal', 'partnerportal', 'partnerhub', 'deals', 'dealreg',
  'dealer', 'dealers', 'installers', 'channel', 'resellers', 'ecosystem', 'connect',
];

/** Non-production hosts must never be read as a live partner surface. */
const NON_PROD = /(^|[.-])(dev|qa|test|tst|stg|staging|uat|sandbox|preview|acc|acceptance|demo|int|local)([.-]|$)/i;

async function dig(host: string, type: string): Promise<string[]> {
  try {
    const { stdout } = await exec('dig', ['+short', type, host], { timeout: 8000 });
    return stdout.trim().split('\n').filter(Boolean);
  } catch { return []; }
}

export interface DnsSurvey {
  wildcard: boolean;
  wildcardTargets: string[];
  hosts: { host: string; cname: string[]; a: string[]; distinct: boolean; nonProd: boolean }[];
  platform: { vendor: string; host: string; cname: string[] } | null;
}

/**
 * Phase 0 measured that 16% of domains answer every subdomain and that 53% of naive
 * "the subdomain resolves" hits were wildcard noise. The control probe is mandatory.
 */
export async function surveyDns(bareDomain: string, extraHosts: string[] = []): Promise<DnsSurvey> {
  const control = `zzq7x-radar-control.${bareDomain}`;
  const wcTargets = new Set([...(await dig(control, 'CNAME')), ...(await dig(control, 'A'))]);
  const wildcard = wcTargets.size > 0;

  const candidates = [...new Set([
    ...PROBE_SUBDOMAINS.map((s) => `${s}.${bareDomain}`),
    ...extraHosts,
  ])];

  const hosts: DnsSurvey['hosts'] = [];
  let platform: DnsSurvey['platform'] = null;
  for (const host of candidates) {
    const cname = await dig(host, 'CNAME');
    const a = await dig(host, 'A');
    if (!cname.length && !a.length) continue;
    const distinct = [...cname, ...a].some((v) => !wcTargets.has(v));
    const nonProd = NON_PROD.test(host.slice(0, host.length - bareDomain.length));
    hosts.push({ host, cname, a: a.slice(0, 2), distinct, nonProd });
    if (!platform && distinct && !nonProd) {
      for (const [vendor, re] of PLATFORM_VENDORS) {
        if (cname.some((c) => re.test(c))) { platform = { vendor, host, cname }; break; }
      }
    }
  }
  return { wildcard, wildcardTargets: [...wcTargets], hosts, platform };
}

/** Subdomain inventory from passive DNS and certificate transparency, union'd. */
export async function discoverHosts(bareDomain: string): Promise<{ hosts: string[]; sources: string[] }> {
  const hosts = new Set<string>();
  const sources: string[] = [];

  const pdns = await get(`https://api.hackertarget.com/hostsearch/?q=${bareDomain}`, { timeout: 25000 });
  if (pdns.ok && pdns.body && !/error|api count exceeded/i.test(pdns.body.slice(0, 80))) {
    sources.push('passive_dns');
    for (const line of pdns.body.trim().split('\n')) {
      const h = line.split(',')[0]?.trim().toLowerCase();
      if (h && h.endsWith(bareDomain)) hosts.add(h);
    }
  }

  const ct = await get(
    `https://api.certspotter.com/v1/issuances?domain=${bareDomain}&include_subdomains=true&expand=dns_names`,
    { timeout: 30000 },
  );
  if (ct.ok && ct.body?.startsWith('[')) {
    sources.push('cert_transparency');
    try {
      for (const c of JSON.parse(ct.body) as { dns_names?: string[] }[]) {
        for (const n of c.dns_names ?? []) {
          const h = n.replace(/^\*\./, '').toLowerCase();
          if (h.endsWith(bareDomain)) hosts.add(h);
        }
      }
    } catch { /* malformed page; the passive-DNS half still counts */ }
  }
  return { hosts: [...hosts], sources };
}

/** Per-domain URL inventory from Common Crawl. Cheap, historical, and does not touch the target. */
export async function commonCrawlUrls(bareDomain: string, collections: string[]): Promise<{ urls: string[]; byCollection: Record<string, number> }> {
  const urls = new Set<string>();
  const byCollection: Record<string, number> = {};
  for (const c of collections) {
    const r = await get(
      `https://index.commoncrawl.org/${c}-index?url=${encodeURIComponent(bareDomain + '/*')}&output=json&limit=1200&fl=url,timestamp`,
      { timeout: 60000 },
    );
    if (!r.ok || !r.body) { byCollection[c] = 0; continue; }
    const lines = r.body.trim().split('\n').filter(Boolean);
    byCollection[c] = lines.length;
    for (const line of lines) {
      try { urls.add((JSON.parse(line) as { url: string }).url); } catch { /* skip */ }
    }
  }
  return { urls: [...urls], byCollection };
}

const LOCALE_SEG = /^\/[a-z]{2}([-_][a-z]{2})?\/?$/i;
/** Preference order when a site forces a locale choice. Introw sells EU + US + UK. */
const LOCALE_PREF = ['/en', '/en-gb', '/en-us', '/us/en', '/gb/en', '/uk/en', '/de/de', '/nl/nl', '/be/nl', '/fr/fr', '/eng'];

/**
 * Sitemap + homepage link graph, locale-aware.
 * Measured: ifm.com returns 13,000 URLs whose homepage links are nothing but country
 * selectors, so a naive crawl never reaches a partner page.
 */
export async function siteUrls(origin: string, homeBody: string, homeUrl: string): Promise<string[]> {
  const urls = new Set<string>();
  for (const m of homeBody.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
    try {
      const u = new URL(m[1], homeUrl);
      if (u.protocol.startsWith('http')) urls.add(u.origin + u.pathname);
    } catch { /* skip */ }
  }
  // If the homepage is dominated by locale roots, crawl the preferred locale too.
  const localeRoots = [...urls].filter((u) => { try { return LOCALE_SEG.test(new URL(u).pathname); } catch { return false; } });
  if (localeRoots.length >= 4 && urls.size < localeRoots.length * 3) {
    const pick = LOCALE_PREF.map((p) => localeRoots.find((u) => new URL(u).pathname.replace(/\/$/, '').toLowerCase() === p)).find(Boolean)
      ?? localeRoots[0];
    if (pick) {
      const lr = await get(pick);
      if (lr.ok && lr.body) {
        for (const m of lr.body.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
          try { const u = new URL(m[1], lr.finalUrl ?? pick); if (u.protocol.startsWith('http')) urls.add(u.origin + u.pathname); } catch { /* skip */ }
        }
      }
    }
  }

  const robots = await get(`${origin}/robots.txt`);
  const sitemaps = new Set<string>([`${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`]);
  if (robots.ok) for (const m of (robots.body ?? '').matchAll(/sitemap:\s*(\S+)/gi)) sitemaps.add(m[1]);

  for (const sm of [...sitemaps].slice(0, 4)) {
    const r = await get(sm);
    if (!r.ok || !r.body || !/<(?:urlset|sitemapindex)/i.test(r.body)) continue;
    const locs = [...r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    if (/<sitemapindex/i.test(r.body)) {
      // Recurse only into children whose own name suggests content pages.
      const kids = locs.filter((l) => /(page|partner|dealer|installer|main|content|index|en|nl|fr|de)/i.test(l)).slice(0, 4);
      for (const k of (kids.length ? kids : locs.slice(0, 3))) {
        const kr = await get(k);
        if (kr.ok && kr.body) for (const m of kr.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) urls.add(m[1]);
      }
    } else for (const l of locs) urls.add(l);
    if (urls.size > 6000) break;
  }
  return [...urls];
}

/**
 * Rank and DIVERSIFY partner URLs.
 *
 * Two failures drove this. Loxone spent its whole page budget on six children of
 * `/nlnl/installateur/` and never fetched the programme page; Schneider Electric spent
 * its budget on two PDF download endpoints. So: exclude asset/download paths, prefer
 * shallow pages, and cap how many URLs may come from any one path prefix.
 */
const ASSET_PATH = /\/(download|documents?|assets?|files?|media|static|uploads?|wp-content|sites\/default)\/|\.(pdf|zip|docx?|xlsx?|pptx?|jpg|png|svg|mp4)$/i;

export function rankPartnerUrls(urls: string[], budget = 6): string[] {
  const score = (u: string): number => {
    let path: string;
    let host: string;
    try { const x = new URL(u); path = x.pathname; host = x.hostname; } catch { return -99; }
    if (ASSET_PATH.test(path)) return -99;
    if (PRODUCT_PATH.test(path)) return -99;
    let s = 0;
    // A dedicated partner HOST carries the signal in its hostname, not its path.
    // Scoring only the path gave `partnerlisting.corp.example.com/` a score of zero
    // and dropped the best directory a company had.
    const label = host.split('.')[0] ?? '';
    if (/^(partners?|partnerlisting|partnerhub|partnerportal|partnerprogram|resellers?|dealers?|installers?|channel|deals?|dealreg|ecosystem)/i.test(label)) s += 7;
    for (const shape of URL_SHAPES) {
      if (!shape.re.test(path)) continue;
      if (shape.implication === 'transacting') s += shape.id === 'url_partner_generic' ? 2 : 6;
      else if (shape.implication === 'integration') s -= 5;
      else if (shape.implication === 'affiliate') s -= 2;
      else s += 1;
    }
    if (/\/(partners?|resellers?|dealers?|installers?|partenaires?|partnerprogramma|partnerprogramm)\/?$/i.test(path)) s += 5;
    if (/(become-a-partner|partner-worden|partner-werden|devenir-partenaire|partner-program)/i.test(path)) s += 4;
    if (/technology-partner|integration-partner|isv/i.test(path)) s -= 6;
    if (/\/(blog|news|press|careers|jobs|legal|privacy|terms)\//i.test(path)) s -= 10;
    // Shallow beats deep: /partners is the programme, /partners/acme is one profile.
    // Locale prefixes (/en/, /nl-be/) are not real depth.
    const segs = path.split('/').filter(Boolean).filter((x) => !/^[a-z]{2}([-_][a-z]{2})?$/i.test(x));
    s -= Math.max(0, segs.length - 1) * 2;
    return s;
  };

  // Diversify by host as well as by path prefix, so one partner host and the main
  // site both get a look.
  const hostOf = (u: string) => { try { return new URL(u).hostname; } catch { return ''; } };

  const scored = urls.map((u) => [u, score(u)] as const).filter(([, sc]) => sc > 0).sort((a, b) => b[1] - a[1]);
  // Diversify: at most two URLs per top-level path prefix, so one section cannot
  // consume the whole fetch budget.
  const perPrefix = new Map<string, number>();
  const picked: string[] = [];
  for (const [u] of scored) {
    if (picked.length >= budget) break;
    let prefix = '';
    try {
      const segs = new URL(u).pathname.split('/').filter(Boolean).filter((x) => !/^[a-z]{2}([-_][a-z]{2})?$/i.test(x));
      prefix = hostOf(u) + '|' + (segs[0] ?? '/');
    } catch { continue; }
    const n = perPrefix.get(prefix) ?? 0;
    if (n >= 2) continue;
    perPrefix.set(prefix, n + 1);
    picked.push(u);
  }
  return picked;
}

/**
 * Partner count. Returns the count TYPE alongside the number, because Phase 0
 * measured a 22% gap between a public directory and the company's own stated figure.
 */
export function extractPartnerCount(html: string, source: SourceRef): PartnerCount {
  const base: PartnerCount = {
    value: null, countType: 'unknown', enumerationComplete: null, unit: null,
    source: null, observedAt: null, confidence: 'low',
  };

  // 1. Vendor-hosted directory payloads carry an explicit total.
  //    PartnerPage.io (Nuxt) exposes it as `count` in a flat devalue array.
  const jsonBlock = /<script[^>]*type="application\/json"[^>]*>([\s\S]{200,}?)<\/script>/.exec(html);
  if (jsonBlock) {
    try {
      const flat = JSON.parse(jsonBlock[1]) as Record<string, unknown>;
      const arr = Object.values(flat);
      const resolve = (x: unknown) => (typeof x === 'number' ? arr[x] : x);
      for (const v of arr) {
        if (v && typeof v === 'object' && 'count' in (v as object)) {
          const n = resolve((v as Record<string, unknown>).count);
          if (typeof n === 'number' && n > 0 && n < 100000) {
            return { ...base, value: n, countType: 'directory_count', enumerationComplete: true, unit: 'partners', source, observedAt: source.observedAt, confidence: 'medium' };
          }
        }
      }
    } catch { /* not a payload we understand */ }
  }

  // 2. JSON-LD ItemList.
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(m[1].trim());
      for (const o of (Array.isArray(parsed) ? parsed : [parsed]) as Record<string, unknown>[]) {
        if (o?.['@type'] === 'ItemList' && Array.isArray(o.itemListElement)) {
          const n = typeof o.numberOfItems === 'number' ? o.numberOfItems : o.itemListElement.length;
          return { ...base, value: n, countType: 'directory_count', enumerationComplete: typeof o.numberOfItems === 'number', unit: 'partners', source, observedAt: source.observedAt, confidence: 'medium' };
        }
      }
    } catch { /* malformed JSON-LD is normal */ }
  }

  // 3. Stated copy. "500+" is approximate; a bare number is exact-as-published.
  const text = stripTags(html);
  const stated = /\b(\d{1,3}(?:[.,]\d{3})*|\d{2,6})\s*(\+)?\s*(certified |authoriz?ed |authorised |active |accredited )?(partners?|resellers?|dealers?|installers?|distributors?|agencies|MSPs?|installateurs?|wederverkopers?|revendeurs?|h[äa]ndler)\b/i.exec(text);
  if (stated) {
    const n = Number(stated[1].replace(/[.,]/g, ''));
    // A four-digit number near a partner word is very often a year ("2026 partners
    // joined") or a product code. Years are excluded outright.
    const isYearLike = n >= 1900 && n <= 2100 && !/[.,]/.test(stated[1]);
    if (n >= 5 && n <= 200000 && !isYearLike) {
      return {
        ...base,
        value: n,
        countType: stated[2] ? 'approximate' : 'exact_public',
        enumerationComplete: null,
        unit: stated[4].toLowerCase(),
        source,
        observedAt: source.observedAt,
        confidence: 'medium',
      };
    }
  }

  // 4. Enumerated outbound hosts. A lower bound: pagination is usually not exhausted.
  const hosts = new Set<string>();
  let baseHost = '';
  try { baseHost = new URL(source.url).hostname.replace(/^www\./, ''); } catch { /* */ }
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)) {
    try {
      const h = new URL(m[1]).hostname.replace(/^www\./, '');
      if (!h || h === baseHost || h.endsWith('.' + baseHost)) continue;
      if (/(facebook|twitter|x\.com|linkedin|youtube|instagram|google|apple|w3\.org|schema\.org|gravatar|cloudfront|googleapis|cookiebot|onetrust|vimeo|hubspot|hs-sites)/i.test(h)) continue;
      hosts.add(h);
    } catch { /* skip */ }
  }
  if (hosts.size >= 8) {
    return { ...base, value: hosts.size, countType: 'lower_bound', enumerationComplete: false, unit: 'linked organisations', source, observedAt: source.observedAt, confidence: 'low' };
  }
  return base;
}

export { get, mainContent, stripTags };
