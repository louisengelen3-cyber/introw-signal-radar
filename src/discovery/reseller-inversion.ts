/**
 * Reseller-side inversion (Phase 5, workstream A).
 *
 * Phase 2 inverted the DISTRIBUTOR: "which brands does this distributor carry?" That surfaced
 * two-tier enterprise channels — structurally the anti-ICP, because a brand large enough to be
 * carried by a distributor usually has an enterprise channel org already.
 *
 * This inverts the RESELLER instead: "which vendors does this consultancy, MSP, agency or
 * systems integrator say it sells, implements or is certified in?" That population selects for
 * mid-market software sold through VARs and consultants, which is the ICP.
 *
 * WHY EXTRACTION IS DONE BY OUTBOUND LINK, NOT BY NAME
 *
 * A previous vendor-name extractor returned "Platinum" and "Microsoft Solution" as vendor
 * names, because it read proper-noun-shaped tokens out of logo captions and tier badges.
 * Resolving vendors through outbound links instead makes that failure structurally impossible:
 * a tier word has no domain. It also yields the vendor's DOMAIN, which is what the rest of the
 * pipeline needs anyway — so entity resolution is solved at extraction time rather than
 * guessed at afterwards.
 *
 * The cost is real and is stated: a vendor named in text but not linked is missed. Measured on
 * the three counterparties the decisive test found, that cost was 2 of 3 — OJC Consulting names
 * its whole vendor portfolio as same-site pages (/Page/Xelix) and links to none of them, and
 * Securex publishes one page per vendor (/partners/arval, /partners/odoohr). So a second,
 * equally structural path was added: vendor names taken from the SLUGS of same-site vendor
 * pages. Slugs are names rather than domains, so the tier guard genuinely matters there and is
 * applied — this is the one place where the Phase 4 failure could recur.
 */
import { get, mainContent, stripTags } from '../lib/http.js';
import { isSoft404 } from '../recovery/surfaces.js';

/** Pages on a counterparty's site that list the vendors it works with. */
const VENDOR_LIST_PATHS = [
  '/partners', '/partner', '/technology-partners', '/our-partners', '/vendors',
  '/solutions', '/expertise', '/portfolio', '/technologies', '/alliances',
  '/partenaires', '/nos-partenaires', '/leveranciers', '/onze-partners', '/oplossingen',
  '/partner-werden', '/unsere-partner', '/technologiepartner', '/loesungen',
  '/soluzioni', '/partner-tecnologici', '/samarbetspartners',
];

/** URL vocabulary that marks a page as a vendor listing, used when crawling from the root. */
const VENDOR_LIST_URL = /\/(partners?|vendors?|technolog\w*|solutions?|expertise|portfolio|alliances|partenaires|leveranciers|oplossingen|unsere-partner|soluzioni)(\/|$|\?)/i;

/**
 * Hosts that are never a vendor a counterparty resells. Social, CDN, analytics, fonts,
 * infrastructure, and the review/directory sites that appear in every footer.
 */
const NON_VENDOR_HOST = new RegExp([
  'linkedin|twitter|x\\.com|facebook|instagram|youtube|vimeo|tiktok|pinterest|xing|mastodon',
  'google|gstatic|googleapis|doubleclick|googletagmanager|gtm',
  'cloudflare|cloudfront|akamai|fastly|jsdelivr|unpkg|cdn\\.',
  'fonts\\.|typekit|fontawesome',
  'hotjar|segment|mixpanel|amplitude|matomo|piwik|clarity\\.ms',
  'wordpress|wp\\.com|wix|squarespace|webflow|hubspot\\.net|hs-scripts',
  'trustpilot|glassdoor|indeed|capterra|g2\\.com|softwareadvice|clutch\\.co',
  'apple|microsoft\\.com/[a-z-]+/legal|w3\\.org|schema\\.org|creativecommons',
  'archive\\.org|web\\.archive|wikipedia|wikimedia|europa\\.eu|gov\\.',
  'maps\\.|goo\\.gl|bit\\.ly|calendly|hubs\\.ly',
].join('|'), 'i');

/**
 * Tier and certification vocabulary. Cannot produce a false vendor here because vendors are
 * resolved by domain — but asserted by test so the guard survives any future refactor that
 * reintroduces name-based extraction.
 */
export const TIER_VOCABULARY = [
  'platinum', 'gold', 'silver', 'bronze', 'premier', 'elite', 'diamond', 'titanium',
  'certified', 'authorised', 'authorized', 'accredited', 'preferred', 'select', 'advanced',
  'registered', 'associate', 'expert', 'specialist', 'competency', 'competencies',
  'partner of the year', 'solution partner', 'technology partner', 'reseller', 'var',
  'gouden', 'zilveren', 'zertifiziert', 'certifié', 'partenaire',
];

export function isTierWord(s: string): boolean {
  const t = s.trim().toLowerCase();
  if (!t) return true;
  return TIER_VOCABULARY.some((w) => t === w || t.startsWith(`${w} `) || t.endsWith(` ${w}`));
}

/** Registrable-ish domain from a URL. Two labels, or three for known compound TLDs. */
export function registrable(host: string): string {
  const h = host.replace(/^www\./, '').toLowerCase();
  const parts = h.split('.');
  if (parts.length <= 2) return h;
  const compound = /^(co|com|org|net|gov|ac)\.[a-z]{2}$/.test(parts.slice(-2).join('.'));
  return parts.slice(compound ? -3 : -2).join('.');
}

export interface VendorMention {
  /** The vendor's registrable domain when resolvable by link, else null for slug-derived names. */
  vendorDomain: string | null;
  /** Name as published. For slug mentions this is the only identifier available. */
  vendorName: string;
  /** Anchor text or image alt, verbatim. May be empty when the link wraps a logo with no alt. */
  label: string;
  /** The counterparty that published this. */
  publishedBy: string;
  /** URL on the counterparty's site where the mention appears. */
  sourceUrl: string;
  /** Surrounding prose, so a reviewer can judge whether this is a resell relationship. */
  quote: string;
  /** How the link was found. */
  basis: 'outbound_link' | 'logo_alt_link' | 'vendor_page_slug';
}

export interface InversionResult {
  counterparty: string;
  /** Pages that actually looked like vendor listings. */
  surfacesRead: { url: string; chars: number }[];
  mentions: VendorMention[];
  distinctVendors: string[];
  requests: number;
  note: string;
}

/**
 * Same-site containers whose children are vendors rather than services. `/partners/{slug}` is
 * unambiguous. `/Page/{slug}` is not — OJC uses it for both services and vendors — so a slug
 * from an ambiguous container must be corroborated by relationship prose naming it.
 */
const VENDOR_PAGE_CONTAINER = /\/(partners?|vendors?|leveranciers|partenaires|technolog\w*|solutions?|oplossingen)\/[^/]+\/?$/i;
const AMBIGUOUS_CONTAINER = /\/(page|pages|expertise|competenc\w*)\/[^/]+\/?$/i;

/**
 * Third shape, observed on a real counterparty: the vendor name sits in a TOP-LEVEL slug
 * carrying a partner suffix — smcconsulting.be/ringover-certified-partner. Neither container
 * pattern reaches it, and the vendor name is the part before the suffix.
 */
const TOPLEVEL_PARTNER_SLUG =
  /^\/([a-z0-9][a-z0-9-]{1,40}?)-(?:certified-|authorized-|authorised-|official-|gold-|platinum-)?(?:partner|reseller|specialist|expert|integrator|dealer)s?\/?$/i;

/** Slugs that are services, sectors or navigation — never a vendor. */
const NOT_A_VENDOR_SLUG = new RegExp([
  'consult\\w*', 'implementation', 'change-management', 'project-management',
  'analysis', 'design', 'strategy', 'training', 'support', 'about', 'contact',
  'careers?', 'jobs?', 'news', 'blog', 'events?', 'clients?', 'customers?', 'cases?',
  'services?', 'solutions?', 'expertise', 'approach', 'method\\w*', 'team',
  'supply-chain', 'procurement', 'data-and-it', 'business', 'overview', 'index',
  'preferred-partnerships', 'become-a-partner', 'partner-worden', 'all',
  // Navigation and corporate furniture. Observed on real counterparties: "Our offices",
  // "Hem" (Swedish home), "The OJC Group" — none of which is a vendor.
  'our-offices', 'offices?', 'home', 'hem', 'accueil', 'startseite', 'locations?',
  'the-\\w+-group', '\\w+-group', 'legal', 'privacy', 'cookies?', 'terms',
  'sitemap', 'search', 'login', 'account', 'download\\w*', 'resources?',
  'insights?', 'whitepapers?', 'webinars?', 'press', 'media', 'faq',
].join('|'), 'i');

const deslug = (s: string): string =>
  decodeURIComponent(s).replace(/[-_+]+/g, ' ').replace(/\.(html?|aspx|php)$/i, '').trim();

/** Words near a link that indicate a commercial relationship rather than a citation. */
const RELATIONSHIP_PROSE = /\b(partner|partnership|reseller|resell|distributor|implement|implementation|certified|accredited|authoriz?ed|solution|deliver|deploy|integrat|specialis|expertise|portfolio|work with|we sell)\w*/i;

function extractMentions(html: string, pageUrl: string, counterparty: string): VendorMention[] {
  const out: VendorMention[] = [];
  const seen = new Set<string>();
  const selfReg = registrable(counterparty);
  const text = stripTags(mainContent(html));

  // Anchor tags with their inner HTML, so a wrapped <img alt> is reachable.
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,400}?)<\/a>/gi)) {
    const href = m[1];
    const inner = m[2] ?? '';
    let host: string;
    try {
      const u = new URL(href, pageUrl);
      if (u.protocol !== 'https:' && u.protocol !== 'http:') continue;
      host = u.hostname;
    } catch { continue; }
    const reg = registrable(host);
    if (reg === selfReg) continue;                 // self-links are not vendors
    if (NON_VENDOR_HOST.test(host)) continue;
    // Same-brand hosts are the counterparty itself under another domain — securex.be links
    // mysecurex.eu, which is not a vendor it resells.
    const brand = selfReg.split('.')[0];
    if (brand.length >= 4 && reg.split('.')[0].includes(brand)) continue;
    if (seen.has(reg)) continue;

    const alt = inner.match(/<img\b[^>]*\balt=["']([^"']*)["']/i)?.[1] ?? '';
    const anchorText = stripTags(inner).replace(/\s+/g, ' ').trim();
    const label = (anchorText || alt).slice(0, 80);
    const basis: VendorMention['basis'] = anchorText ? 'outbound_link' : 'logo_alt_link';

    // Quote: the prose around the vendor's name in the page text, when the name appears there.
    const needle = (label || reg.split('.')[0]).slice(0, 40);
    let quote = '';
    const at = needle ? text.toLowerCase().indexOf(needle.toLowerCase()) : -1;
    if (at >= 0) quote = text.slice(Math.max(0, at - 140), at + 180).replace(/\s+/g, ' ').trim();
    else quote = text.slice(0, 220).replace(/\s+/g, ' ').trim();

    seen.add(reg);
    out.push({ vendorDomain: reg, vendorName: label || reg.split('.')[0], label, publishedBy: selfReg, sourceUrl: pageUrl, quote, basis });
  }

  /**
   * Second path: same-site pages whose slug IS the vendor name. Applies the tier guard,
   * because unlike a domain a slug can be "platinum-partner".
   */
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
    let u: URL;
    try { u = new URL(m[1], pageUrl); } catch { continue; }
    if (registrable(u.hostname) !== selfReg) continue;
    const topLevel = u.pathname.match(TOPLEVEL_PARTNER_SLUG);
    const unambiguous = VENDOR_PAGE_CONTAINER.test(u.pathname) || !!topLevel;
    const ambiguous = !topLevel && AMBIGUOUS_CONTAINER.test(u.pathname);
    if (!unambiguous && !ambiguous) continue;
    const slug = topLevel ? topLevel[1] : (u.pathname.replace(/\/$/, '').split('/').pop() ?? '');
    if (!slug || NOT_A_VENDOR_SLUG.test(slug)) continue;
    const name = deslug(slug);
    if (!name || name.length < 2 || name.length > 40) continue;
    if (isTierWord(name)) continue;                     // the Phase 4 guard, where it matters
    const key = `slug:${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    // An ambiguous container needs the page text to actually name it.
    const at = text.toLowerCase().indexOf(name.toLowerCase());
    if (ambiguous && at < 0) continue;
    seen.add(key);
    out.push({
      vendorDomain: null, vendorName: name, label: name, publishedBy: selfReg,
      sourceUrl: u.toString(),
      quote: at >= 0 ? text.slice(Math.max(0, at - 120), at + 160).replace(/\s+/g, ' ').trim() : '',
      basis: 'vendor_page_slug',
    });
  }
  return out;
}

/**
 * Read a counterparty's vendor listings and return the vendors it names.
 *
 * Bounded: this runs across many counterparties, and a consultancy with 400 pages must not
 * cost 400 requests. Vendor listings are shallow by nature — they are index pages.
 */
export async function invertReseller(
  counterpartyDomain: string,
  opts: { maxRequests?: number } = {},
): Promise<InversionResult> {
  const bare = counterpartyDomain.replace(/^www\./, '').toLowerCase();
  const budget = opts.maxRequests ?? 10;
  const surfacesRead: InversionResult['surfacesRead'] = [];
  const mentions: VendorMention[] = [];
  let requests = 0;

  const tryPage = async (url: string) => {
    if (requests >= budget) return null;
    requests++;
    const r = await get(url, { timeout: 18000 });
    if (!r.ok || !r.body) return null;
    const text = stripTags(mainContent(r.body));
    const title = r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '';
    if (isSoft404(text, title)) return null;
    if (text.length < 120) return null;
    return { body: r.body, text };
  };

  /**
   * Resolve the answering host ONCE. Trying www-then-bare on every path halved the number of
   * paths a fixed request budget could cover and dropped a counterparty that had previously
   * worked — the budget went to duplicate hosts instead of new paths.
   */
  const rootWww = await tryPage(`https://www.${bare}/`);
  const rootBare = rootWww ? null : await tryPage(`https://${bare}/`);
  const root = rootWww ?? rootBare;
  const host = rootWww ? `https://www.${bare}` : `https://${bare}`;

  // 1. Direct vendor-listing paths on the host that answered.
  const found: { url: string; body: string; text: string }[] = [];
  for (const p of VENDOR_LIST_PATHS) {
    if (requests >= budget || found.length >= 3) break;
    const url = `${host}${p}`;
    const page = await tryPage(url);
    if (page) found.push({ url, ...page });
  }

  // 2. The root is always read: it carries the navigation, which is where vendor-page links
  //    live on sites that have no /partners path at all.
  if (root) {
    found.push({ url: `${host}/`, ...root });
    if (requests < budget) {
      const cands = new Set<string>();
      for (const m of root.body.matchAll(/href=["']([^"']+)["']/gi)) {
        try {
          const u = new URL(m[1], `${host}/`);
          if (registrable(u.hostname) !== registrable(bare)) continue;
          if (VENDOR_LIST_URL.test(u.pathname)) cands.add(u.toString());
        } catch { /* malformed */ }
      }
      for (const c of [...cands].slice(0, 3)) {
        if (requests >= budget) break;
        const page = await tryPage(c);
        if (page) found.push({ url: c, ...page });
      }
    }
  }

  for (const f of found) {
    surfacesRead.push({ url: f.url, chars: f.text.length });
    // Only treat a page as a vendor listing if it actually talks about relationships.
    if (!RELATIONSHIP_PROSE.test(f.text)) continue;
    for (const men of extractMentions(f.body, f.url, bare)) {
      if (!mentions.some((x) => (x.vendorDomain ?? x.vendorName) === (men.vendorDomain ?? men.vendorName))) mentions.push(men);
    }
  }

  const distinct = [...new Set(mentions.map((m) => m.vendorDomain ?? `name:${m.vendorName.toLowerCase()}`))];
  return {
    counterparty: bare,
    surfacesRead,
    mentions,
    distinctVendors: distinct,
    requests,
    note: surfacesRead.length === 0
      ? 'No vendor-listing surface was readable on this counterparty. Not evidence that it names no vendors.'
      : `${surfacesRead.length} listing page(s) read; ${distinct.length} distinct vendor domain(s) named.`,
  };
}
