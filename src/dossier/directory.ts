/**
 * Partner-directory detection.
 *
 * WHAT THIS DETECTS
 *   A page that enumerates partner ORGANISATIONS — "our certified partners", a partner
 *   locator, a find-a-reseller listing.
 *
 * WHY IT EXISTS
 *   foleon.com publishes a 25,000-character directory of certified agency partners and was
 *   reported as under-observed with zero evidence. Every existing detector reads the
 *   company describing its programme; a directory is the opposite — it is the PARTNERS
 *   describing themselves, so none of the programme vocabulary appears. The single most
 *   commercially informative page on the site was invisible.
 *
 *   A directory is unusually good evidence precisely because it is expensive to fake: a
 *   company does not list two dozen named agencies unless those relationships exist.
 *
 * WHAT IT PROVES
 *   That the company publicly lists this many partner organisations.
 *
 * WHAT IT DOES NOT PROVE
 *   The true partner count — a directory is a LOWER BOUND and usually a filtered view.
 *   It also says nothing about whether those partners transact.
 *
 * KNOWN FALSE POSITIVES
 *   Customer logo walls, integration marketplaces, and press-mention lists. Defended
 *   against by requiring partner vocabulary in the URL or heading, not merely on the page.
 *
 * KNOWN FALSE NEGATIVES
 *   Directories rendered client-side, and those that link internally to profile pages
 *   rather than out to partner websites. Both resolve to "no directory observed", which is
 *   never reported as "no partners".
 *
 * DEPENDENCE ON PUBLICATION DENSITY
 *   None. One page yields one finding, and the count comes from distinct organisations
 *   rather than from how much the company writes.
 */

/**
 * Section is decided by a PATH SEGMENT, never a substring.
 *
 * juro.com/contract-templates/reseller-agreement contains "reseller", and substring matching
 * read a free contract-template blog post as a partner directory — then counted its citation
 * links (Wikipedia, GitHub, Columbia Law) as five partner organisations. This is the same
 * class of bug as the earlier /glossary/reseller failure, arriving in a different file.
 */
const DIRECTORY_SEGMENT = /^(partners?|resellers?|dealers?|agencies|partner-directory|partner-network|find-a-partner|find-a-reseller|find-a-dealer|directory|locator|where-to-buy|verkooppunten|h[äa]ndler|partenaires)$/i;
const DIRECTORY_HOST = /^(partners?|resellers?|dealers?|directory|partnerlisting)\./i;

/** Content paths that must never be read as a directory, whatever they contain. */
const CONTENT_SEGMENT = /^(blog|glossary|resources?|learn|guides?|academy|insights|news|templates?|contract-templates|library|help|docs|support|customers?|case-stud(y|ies))$/i;
const DIRECTORY_HEADING = /\b(our (certified )?partners|partner directory|find a (partner|reseller|dealer|agency)|partner locator|certified partners|partner network|meet our partners|browse partners)\b/i;

/**
 * Hosts that are never partner listings.
 *
 * The first version excluded only social chrome, which let review sites, status pages, CDNs
 * and reference links through: Channable's "six partners" were its own status page, a CDN,
 * Capterra, G2 and OMR. Anything that appears in a page's outbound links for reasons
 * unrelated to partnership belongs here.
 */
const CHROME_HOST = new RegExp([
  // social and platform chrome
  'facebook', 'twitter', 'x\\.com', 'linkedin', 'youtube', 'youtu\\.be', 'instagram', 'tiktok',
  'google', 'apple', 'microsoft', 'wa\\.me', 'mailto', 'whatsapp', 'pinterest', 'reddit', 'threads\\.net',
  // infrastructure and assets
  'w3\\.org', 'schema\\.org', 'gravatar', 'cloudfront', 'googleapis', 'gstatic', 'fonts',
  'cdn', 'amazonaws', 'cloudflare', 'akamai', 'graphassets', 'imgix', 'unsplash', 'vimeo',
  // consent, analytics, support and status tooling
  'cookiebot', 'onetrust', 'usercentrics', 'hubspot', 'hs-sites', 'intercom', 'zendesk',
  'statuspage', 'status\\.', 'trust\\.', 'atlassian', 'notion\\.', 'typeform', 'calendly',
  // review sites and directories — outbound links, never partners
  'g2\\.com', 'capterra', 'getapp', 'softwareadvice', 'trustpilot', 'trustradius', 'omr\\.com',
  'producthunt', 'crunchbase', 'glassdoor', 'indeed', 'business\\.com', 'clutch\\.co',
  // reference and developer links
  'wikipedia', 'wikimedia', 'github', 'gitlab', 'stackoverflow', 'npmjs', 'medium\\.com',
  'substack', '\\.edu$', '\\.gov$', 'iso\\.org', 'gdpr', 'eur-lex',
  // app stores
  'play\\.google', 'apps\\.apple', 'chrome\\.google', 'marketplace\\.',
].join('|'), 'i');

/**
 * A host built from the company's own brand token — `channablestatus.com`,
 * `developers.payfit.io`, `pleobrand.site`. These are the company's own properties on a
 * different registrable domain, and counting them as partners inflates every directory.
 */
function isOwnBrand(host: string, ownDomain: string): boolean {
  const brand = ownDomain.replace(/\.[a-z.]+$/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (brand.length < 4) return false;   // too short to match safely
  return host.replace(/[^a-z0-9]/gi, '').toLowerCase().includes(brand);
}

/** Repeated calls-to-action are the other tell: one per directory entry. */
const ENTRY_CTA = [
  /\bvisit website\b/gi, /\bview profile\b/gi, /\bvisit site\b/gi,
  /\bcontact partner\b/gi, /\bview partner\b/gi, /\blearn more about\b/gi,
];

export interface DirectoryFinding {
  isDirectory: boolean;
  /** Distinct partner organisations observed. Always a LOWER BOUND, never a count. */
  lowerBound: number;
  method: 'external_links' | 'repeated_entries' | 'none';
  /** Named organisations, capped — enough to quote, not a scrape of the list. */
  sampleNames: string[];
  certificationLanguage: boolean;
  sourceUrl: string | null;
  evidenceQuote: string | null;
}

export const NO_DIRECTORY: DirectoryFinding = {
  isDirectory: false, lowerBound: 0, method: 'none', sampleNames: [],
  certificationLanguage: false, sourceUrl: null, evidenceQuote: null,
};

export interface DirectoryInput {
  url: string;
  html: string;
  text: string;
}

export function detectDirectory(pages: DirectoryInput[], ownDomain: string): DirectoryFinding {
  let best: DirectoryFinding = NO_DIRECTORY;

  for (const p of pages) {
    let segments: string[] = [];
    let host = '';
    try { const u = new URL(p.url); segments = u.pathname.split('/').filter(Boolean); host = u.hostname; } catch { continue; }

    // A content section is disqualifying outright, however partner-ish the slug looks.
    if (segments.some((sg) => CONTENT_SEGMENT.test(sg))) continue;

    const urlLooksRight = segments.some((sg) => DIRECTORY_SEGMENT.test(sg)) || DIRECTORY_HOST.test(host);
    const headingLooksRight = DIRECTORY_HEADING.test(p.text.slice(0, 1200));
    // Partner vocabulary must appear in the path/host or the page's own heading region.
    // Without this a customer logo wall counts as a partner directory.
    if (!urlLooksRight && !headingLooksRight) continue;

    const external = distinctExternalHosts(p.html, ownDomain);
    let ctaMax = 0;
    for (const re of ENTRY_CTA) ctaMax = Math.max(ctaMax, (p.text.match(re) ?? []).length);

    const useLinks = external.length >= ctaMax;
    const lowerBound = Math.max(external.length, ctaMax);
    // Six, not five: at five the counts were dominated by page furniture. A directory that
    // is genuinely a directory clears this comfortably; borderline cases are better reported
    // as "no directory observed" than as a number a seller might quote.
    if (lowerBound < 6) continue;

    if (lowerBound > best.lowerBound) {
      best = {
        isDirectory: true,
        lowerBound,
        method: useLinks ? 'external_links' : 'repeated_entries',
        sampleNames: external.slice(0, 8),
        certificationLanguage: /\b(certified|accredited|authoriz?ed|approved)\s+(partner|agency|reseller|installer)/i.test(p.text),
        sourceUrl: p.url,
        evidenceQuote: p.text.slice(0, 260).replace(/\s+/g, ' ').trim(),
      };
    }
  }

  return best;
}

function distinctExternalHosts(html: string, ownDomain: string): string[] {
  const own = ownDomain.replace(/^www\./, '');
  const hosts = new Set<string>();
  for (const m of html.matchAll(/<a\b[^>]*href=["'](https?:\/\/[^"']+)["']/gi)) {
    let h: string;
    try { h = new URL(m[1]).hostname.replace(/^www\./, ''); } catch { continue; }
    if (h === own || h.endsWith('.' + own)) continue;
    if (isOwnBrand(h, ownDomain)) continue;
    if (CHROME_HOST.test(h)) continue;
    hosts.add(h);
  }
  return [...hosts];
}
