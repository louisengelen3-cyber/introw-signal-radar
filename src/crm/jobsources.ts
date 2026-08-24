/**
 * Non-ATS job discovery (mandate §43, §44).
 *
 * The previous job layer terminated when no ATS board could be attributed, which capped
 * reach at 22% of companies and turned "we could not find a board" into "CRM unknown". That
 * conflation is exactly what this file removes: a company's vacancies are frequently served
 * from its own careers pages under a CMS, with no ATS anywhere.
 *
 * What this does NOT do: it never searches a vendor's index for a company name, because that
 * is how the wrong company's vacancies get attributed. Every page here is reached by
 * following the company's own links from its own domain.
 */
import { get, mainContent, stripTags } from '../lib/http.js';
import { isSoft404 } from '../recovery/surfaces.js';

/** Careers landing paths across the languages the corpus spans. */
const CAREERS_PATHS = [
  '/careers', '/career', '/jobs', '/join-us', '/work-with-us', '/company/careers',
  '/about/careers', '/en/careers', '/vacancies', '/vacatures', '/werken-bij',
  '/karriere', '/stellenangebote', '/jobs-und-karriere', '/emplois', '/carrieres',
  '/nous-rejoindre', '/lediga-jobb', '/karriar', '/lavora-con-noi', '/empleo',
];

/** A link that looks like a single vacancy rather than a listing page. */
const JOB_LINK = /\/(job|jobs|vacancy|vacancies|vacature|stelle|stellenangebot|position|opening|emploi|offre|karriere|career)[s]?[\/=-]/i;

/** Paths that are never a vacancy, however job-like the URL looks. */
const NOT_A_JOB = /\.(png|jpe?g|gif|svg|webp|pdf|css|js|ico|woff2?)(\?|$)|\/(privacy|cookie|terms|imprint|impressum)/i;

export interface JobDocument {
  url: string;
  title: string | null;
  text: string;
  /** True when the page links to several vacancies — an index, not a single advert. */
  isIndex?: boolean;
  /** Only ever from a date the page itself carries (§46). */
  publishedAt: string | null;
  origin: 'careers_page' | 'careers_listing';
}

export interface JobSourceResult {
  documents: JobDocument[];
  careersPagesFound: number;
  requests: number;
  /** Kept so "nothing found" is separable from "never looked". */
  checked: string[];
}

/** Absolute, same-registrable-domain links only. A careers page linking to a partner's
 *  job board must not pull that company's vacancies into this company's dossier. */
function sameSiteLinks(html: string, base: string, bare: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/href=["']([^"']+)["']/gi)) {
    let href = m[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    try {
      const u = new URL(href, base);
      const host = u.hostname.replace(/^www\./, '').toLowerCase();
      if (host !== bare && !host.endsWith(`.${bare}`)) continue;
      if (NOT_A_JOB.test(u.pathname)) continue;
      u.hash = '';
      out.add(u.toString());
    } catch { /* malformed href */ }
  }
  return [...out];
}

/** A publication date the page states about itself. Never inferred. */
function statedDate(html: string): string | null {
  const meta = html.match(/<meta[^>]+(?:property|name)=["'](?:article:published_time|datePublished|og:updated_time)["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (meta && !Number.isNaN(Date.parse(meta))) return new Date(meta).toISOString();
  const ld = html.match(/"datePosted"\s*:\s*"([^"]+)"/i)?.[1];
  if (ld && !Number.isNaN(Date.parse(ld))) return new Date(ld).toISOString();
  const time = html.match(/<time[^>]+datetime=["']([^"']+)["']/i)?.[1];
  if (time && !Number.isNaN(Date.parse(time))) return new Date(time).toISOString();
  return null;
}

/**
 * Read vacancies from a company's own careers surface.
 *
 * Bounded deliberately: this runs on every account, and a company with 400 open roles must
 * not cost 400 requests. Reading a sample is legitimate here because CRM evidence is a
 * company-level fact — one advert saying "our Salesforce instance" establishes it, and the
 * three hundredth advert saying it again adds nothing.
 */
export async function findCareersVacancies(
  bareDomain: string,
  opts: { maxPages?: number; maxRequests?: number } = {},
): Promise<JobSourceResult> {
  const bare = bareDomain.replace(/^www\./, '').toLowerCase();
  const maxPages = opts.maxPages ?? 12;
  const maxRequests = opts.maxRequests ?? 22;
  const documents: JobDocument[] = [];
  const checked: string[] = [];
  let requests = 0;
  let careersPagesFound = 0;

  /**
   * Careers subdomains. Companies routinely serve their board from careers./jobs./work.
   * while the /careers path on the main site is a thin marketing shell — measured on real
   * companies whose entire vacancy set lived on a subdomain the path probe never reached.
   */
  const SUBDOMAINS = ['careers', 'jobs', 'work', 'karriere', 'vacatures'];

  const candidates = new Set<string>();
  /**
   * Probing 21 careers paths at one request each would spend the entire budget before a
   * single vacancy is read. Stop as soon as a landing page yields job links: the goal is to
   * reach vacancies, not to enumerate every spelling of "careers" a company might use.
   */
  const MAX_LANDING_PROBES = 8;
  let probes = 0;
  for (const p of CAREERS_PATHS) {
    if (requests >= maxRequests || probes >= MAX_LANDING_PROBES) break;
    probes++;
    const url = `https://www.${bare}${p}`;
    requests++;
    checked.push(url);
    const r = await get(url, { timeout: 15000 });
    if (!r.ok || !r.body) continue;
    const text = stripTags(mainContent(r.body));
    if (isSoft404(text, r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '')) continue;
    careersPagesFound++;
    // The listing page itself often carries CRM language in an "about the team" block.
    if (text.length > 300) {
      documents.push({ url, title: null, text, publishedAt: statedDate(r.body), origin: 'careers_listing' });
    }
    for (const l of sameSiteLinks(r.body, url, bare)) if (JOB_LINK.test(l)) candidates.add(l);
    // One good careers page is enough to enumerate from; keep the budget for the vacancies.
    if (candidates.size > 0) break;
  }

  // If the on-site paths yielded nothing to read, try the careers subdomains before giving up.
  if (candidates.size === 0) {
    for (const sub of SUBDOMAINS) {
      if (requests >= maxRequests) break;
      const url = `https://${sub}.${bare}/`;
      requests++;
      checked.push(url);
      const r = await get(url, { timeout: 15000 });
      if (!r.ok || !r.body) continue;
      const text = stripTags(mainContent(r.body));
      if (isSoft404(text, r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '')) continue;
      careersPagesFound++;
      if (text.length > 300) documents.push({ url, title: null, text, publishedAt: statedDate(r.body), origin: 'careers_listing' });
      for (const l of sameSiteLinks(r.body, url, bare)) if (JOB_LINK.test(l)) candidates.add(l);
      if (candidates.size > 0) break;
    }
  }

  for (const url of [...candidates].slice(0, maxPages)) {
    if (requests >= maxRequests) break;
    requests++;
    const r = await get(url, { timeout: 15000 });
    if (!r.ok || !r.body) continue;
    const title = r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1]?.replace(/\s+/g, ' ').trim() ?? null;
    const text = stripTags(mainContent(r.body));
    if (isSoft404(text, title ?? '')) continue;
    if (text.length < 200) continue;
    const jobLinks = sameSiteLinks(r.body, url, bare).filter((l) => JOB_LINK.test(l)).length;
    documents.push({ url, title, text, publishedAt: statedDate(r.body), origin: 'careers_page', isIndex: jobLinks >= 3 });
  }

  return { documents, careersPagesFound, requests, checked };
}

/**
 * Job-family classification, for the §42 invariant: CRM evidence must be reachable from
 * ordinary commercial roles, not only from partnership titles.
 */
export type JobFamily =
  | 'partnerships' | 'sales' | 'revops' | 'marketing' | 'customer_success'
  | 'finance_ops' | 'technical_presales' | 'other';

const FAMILY_PATTERNS: [JobFamily, RegExp][] = [
  // Suffix-tolerant: \bpartnership\b does not match "Partnerships", which silently filed
  // every "Head of Partnerships" under `other` and would have understated the one family
  // the §42 invariant is measured against.
  ['partnerships', /\bpartner\w*\b|\bchannel\w*\b|\ballian\w*\b|\breseller\w*\b/i],
  ['revops', /\b(rev\s?ops|revenue operations|sales operations|sales ops|gtm operations|deal desk|commercial operations)\b/i],
  ['marketing', /\b(marketing|demand gen|growth|campaign|content)\b/i],
  ['customer_success', /\b(customer success|account manager|customer experience|support manager|onboarding manager)\b/i],
  ['technical_presales', /\b(solutions? (consultant|engineer|architect)|sales engineer|pre[- ]?sales)\b/i],
  ['finance_ops', /\b(finance|controller|billing|order to cash)\b/i],
  ['sales', /\b(account executive|sales|business development|bdr|sdr|commercial manager|vertrieb|verkoop|commercial)\b/i],
];

export function jobFamily(title: string | null): JobFamily {
  if (!title) return 'other';
  for (const [family, re] of FAMILY_PATTERNS) if (re.test(title)) return family;
  return 'other';
}
