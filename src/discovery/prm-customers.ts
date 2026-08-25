/**
 * Proxy-positive harvest from PRM vendor customer pages (Phase 5, workstream B).
 *
 * The validation base is 19 known Introw customers. Every construct has been tuned and judged
 * against it, which is why in-sample 3/6 collapsed to out-of-sample 1/6. A company that
 * publicly appears as a customer of ANY partner-management vendor has demonstrably bought into
 * the category, and that population is an order of magnitude larger.
 *
 * IT IS A PROXY, NOT A POSITIVE, AND IS LABELLED AS ONE THROUGHOUT.
 * A logo wall carries aspirational logos, historical customers, pilots that never converted,
 * and occasionally companies that were merely evaluated. The verification rate is measured by
 * hand and reported rather than assumed.
 *
 * STRATIFICATION IS NOT OPTIONAL.
 * Kiflo and PartnerPortal.io serve SMB; Impartner and ZINFI serve enterprise. A Kiflo customer
 * is a far closer ICP proxy than a ZINFI customer. Pooling them would reproduce exactly the
 * segment confound that sank the Phase 2 distribution discriminator, so every record carries
 * its source vendor and that vendor's segment tier, and results are reported per stratum.
 */
import { get, mainContent, stripTags } from '../lib/http.js';
import { isSoft404 } from '../recovery/surfaces.js';
import { registrable } from './reseller-inversion.js';

export type PrmSegment = 'smb' | 'mid_market' | 'enterprise';

export interface PrmVendor {
  domain: string;
  name: string;
  /** Assigned from the vendor's own positioning and pricing, before any harvest ran. */
  segment: PrmSegment;
}

/** Pages where a vendor names its customers. */
const CUSTOMER_PATHS = [
  '/customers', '/case-studies', '/case-study', '/customer-stories', '/success-stories',
  '/clients', '/our-customers', '/testimonials', '/resources/case-studies', '/stories',
];

const CUSTOMER_URL = /\/(customers?|case-stud\w*|customer-stor\w*|success-stor\w*|clients?|testimonials?|stories)(\/|$|\?)/i;

/** Never a customer: the vendor's own infrastructure, social, review sites, its investors. */
const NON_CUSTOMER_HOST = new RegExp([
  'linkedin|twitter|x\\.com|facebook|instagram|youtube|vimeo|tiktok|xing',
  'google|gstatic|googleapis|googletagmanager|doubleclick',
  'cloudflare|cloudfront|akamai|fastly|jsdelivr|unpkg|cdn\\.|imgix|cloudinary',
  'fonts\\.|typekit|fontawesome|gravatar',
  'hotjar|segment|mixpanel|amplitude|matomo|clarity\\.ms|intercom|drift',
  'wordpress|wp\\.com|wix|squarespace|webflow|hubspot|hs-sites|marketo|pardot',
  'g2\\.com|capterra|trustpilot|trustradius|softwareadvice|getapp|glassdoor',
  'crunchbase|pitchbook|techcrunch|prnewswire|businesswire',
  'apple|microsoft\\.com/[a-z-]+/legal|w3\\.org|schema\\.org|creativecommons|archive\\.org',
  'youtu\\.be|calendly|hubs\\.ly|bit\\.ly|goo\\.gl|vimeo',
].join('|'), 'i');

/** Slugs on a case-study path that are navigation rather than a customer. */
const NOT_A_CUSTOMER_SLUG = /^(all|index|page|category|categories|tag|tags|search|filter|archive|list|overview|more|next|previous|\d+)$/i;

export interface CustomerMention {
  customerDomain: string | null;
  customerName: string;
  prmVendor: string;
  prmSegment: PrmSegment;
  artefactType: 'logo_link' | 'case_study_slug' | 'testimonial_link';
  sourceUrl: string;
  quote: string;
}

export interface HarvestResult {
  prmVendor: string;
  prmSegment: PrmSegment;
  surfacesRead: string[];
  mentions: CustomerMention[];
  requests: number;
  note: string;
}

const deslug = (s: string) =>
  decodeURIComponent(s).replace(/[-_+]+/g, ' ').replace(/\.(html?|aspx|php)$/i, '').trim();

export async function harvestPrmCustomers(
  v: PrmVendor,
  opts: { maxRequests?: number } = {},
): Promise<HarvestResult> {
  const bare = v.domain.replace(/^www\./, '').toLowerCase();
  const budget = opts.maxRequests ?? 14;
  const surfacesRead: string[] = [];
  const mentions: CustomerMention[] = [];
  const seen = new Set<string>();
  let requests = 0;

  const tryPage = async (url: string) => {
    if (requests >= budget) return null;
    requests++;
    const r = await get(url, { timeout: 18000 });
    if (!r.ok || !r.body) return null;
    const text = stripTags(mainContent(r.body));
    const title = r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '';
    if (isSoft404(text, title) || text.length < 120) return null;
    return { body: r.body, text };
  };

  const rootWww = await tryPage(`https://www.${bare}/`);
  const root = rootWww ?? await tryPage(`https://${bare}/`);
  const host = rootWww ? `https://www.${bare}` : `https://${bare}`;

  const pages: { url: string; body: string; text: string }[] = [];
  for (const p of CUSTOMER_PATHS) {
    if (requests >= budget || pages.length >= 3) break;
    const page = await tryPage(`${host}${p}`);
    if (page) pages.push({ url: `${host}${p}`, ...page });
  }
  if (pages.length === 0 && root && requests < budget) {
    const cands = new Set<string>();
    for (const m of root.body.matchAll(/href=["']([^"']+)["']/gi)) {
      try {
        const u = new URL(m[1], `${host}/`);
        if (registrable(u.hostname) !== registrable(bare)) continue;
        if (CUSTOMER_URL.test(u.pathname)) cands.add(u.toString());
      } catch { /* malformed */ }
    }
    for (const c of [...cands].slice(0, 3)) {
      if (requests >= budget) break;
      const page = await tryPage(c);
      if (page) pages.push({ url: c, ...page });
    }
  }

  for (const p of pages) {
    surfacesRead.push(p.url);
    // 1. Outbound links to a customer's own site — resolves the entity for free.
    for (const m of p.body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi)) {
      let host2: string;
      try {
        const u = new URL(m[1], p.url);
        if (!/^https?:$/.test(u.protocol)) continue;
        host2 = u.hostname;
      } catch { continue; }
      const reg = registrable(host2);
      // Same-brand hosts are the vendor itself under another TLD — zinfi.com links zinfi.net
      // and zinfi.ai, neither of which is a customer.
      const vbrand = registrable(bare).split('.')[0];
      if (reg === registrable(bare) || NON_CUSTOMER_HOST.test(host2) || seen.has(reg)) continue;
      if (vbrand.length >= 4 && reg.split('.')[0].includes(vbrand)) continue;
      const inner = m[2] ?? '';
      const alt = inner.match(/<img\b[^>]*\balt=["']([^"']*)["']/i)?.[1] ?? '';
      const label = (stripTags(inner).replace(/\s+/g, ' ').trim() || alt).slice(0, 80);
      const at = label ? p.text.toLowerCase().indexOf(label.toLowerCase()) : -1;
      seen.add(reg);
      mentions.push({
        customerDomain: reg, customerName: label || reg.split('.')[0],
        prmVendor: bare, prmSegment: v.segment,
        artefactType: alt && !stripTags(inner).trim() ? 'logo_link' : 'testimonial_link',
        sourceUrl: p.url,
        quote: at >= 0 ? p.text.slice(Math.max(0, at - 120), at + 180).replace(/\s+/g, ' ').trim() : p.text.slice(0, 200).replace(/\s+/g, ' ').trim(),
      });
    }
    // 2. Case-study slugs on the vendor's own site — the customer name is the slug.
    for (const m of p.body.matchAll(/href=["']([^"']+)["']/gi)) {
      let u: URL;
      try { u = new URL(m[1], p.url); } catch { continue; }
      if (registrable(u.hostname) !== registrable(bare)) continue;
      if (!CUSTOMER_URL.test(u.pathname)) continue;
      const slug = u.pathname.replace(/\/$/, '').split('/').pop() ?? '';
      if (!slug || NOT_A_CUSTOMER_SLUG.test(slug)) continue;
      if (CUSTOMER_PATHS.some((c) => c.endsWith(`/${slug}`))) continue;   // the index itself
      /**
       * Some vendors prefix every case-study slug with the product being sold —
       * "partner-portal-erinware", "channel-marketing-automation-illumine-energy". The
       * customer is the remainder, and leaving the prefix in produces unusable names.
       */
      const PRODUCT_PREFIX = /^(partner[- ]portal|partner[- ]relationship[- ]management(?:[- ]software)?|channel[- ]marketing[- ]automation|through[- ]channel[- ]marketing[- ]automation|partner[- ]management(?:[- ]software)?|prm(?:[- ]software)?|case[- ]study|customer[- ]story|system[- ]integrator)[- ]+/i;
      const name = deslug(slug.replace(PRODUCT_PREFIX, ''));
      if (name.length < 2 || name.length > 60) continue;
      const key = `name:${name.toLowerCase()}`;
      if (seen.has(key)) continue;
      const at = p.text.toLowerCase().indexOf(name.toLowerCase());
      seen.add(key);
      mentions.push({
        customerDomain: null, customerName: name,
        prmVendor: bare, prmSegment: v.segment,
        artefactType: 'case_study_slug', sourceUrl: u.toString(),
        quote: at >= 0 ? p.text.slice(Math.max(0, at - 120), at + 180).replace(/\s+/g, ' ').trim() : '',
      });
    }
  }

  return {
    prmVendor: bare, prmSegment: v.segment, surfacesRead, mentions, requests,
    note: surfacesRead.length === 0
      ? 'No customer surface was readable. Not evidence that the vendor names no customers.'
      : `${surfacesRead.length} customer surface(s); ${mentions.length} mention(s).`,
  };
}
