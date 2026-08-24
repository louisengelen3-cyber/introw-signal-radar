/**
 * ATS discovery and fetching.
 *
 * OWNERSHIP IS THE POINT OF THIS FILE. A vacancy is only evidence about a company if it
 * provably belongs to that company, and an ATS board carrying a similar name proves nothing —
 * `boards.greenhouse.io/apollo` could be Apollo.io, Apollo GraphQL, or Apollo Tyres. Earlier
 * phases lost real time to exactly this class of identifier collision, so tenants are
 * discovered by following links FROM the company's own site rather than by guessing tokens
 * from the company name. A board we cannot tie back to the company is quarantined and never
 * read as evidence.
 */

import { decodeEntities, get, stripTags } from '../lib/http.js';
import type { AtsTenant, AtsVendor, Currentness, Vacancy } from './types.js';
import type { SourceHealth } from '../evidence/positioning.js';

/** Where a board link is found, and how to turn it into an API call. */
interface VendorDef {
  vendor: AtsVendor;
  /** Matches a board URL on the company's site and captures the tenant token. */
  link: RegExp;
  /** Public JSON (or XML) endpoint for the board. */
  api: (token: string) => string;
  board: (token: string) => string;
}

const VENDORS: VendorDef[] = [
  { vendor: 'greenhouse',
    link: /(?:boards|job-boards)\.greenhouse\.io\/(?:embed\/job_board\?for=)?([a-z0-9_-]{2,40})/i,
    api: (t) => `https://boards-api.greenhouse.io/v1/boards/${t}/jobs?content=true`,
    board: (t) => `https://boards.greenhouse.io/${t}` },
  { vendor: 'lever',
    link: /jobs\.(?:eu\.)?lever\.co\/([a-z0-9_-]{2,40})/i,
    api: (t) => `https://api.lever.co/v0/postings/${t}?mode=json`,
    board: (t) => `https://jobs.lever.co/${t}` },
  { vendor: 'ashby',
    link: /jobs\.ashbyhq\.com\/([a-z0-9_.-]{2,40})/i,
    api: (t) => `https://api.ashbyhq.com/posting-api/job-board/${t}?includeCompensation=false`,
    board: (t) => `https://jobs.ashbyhq.com/${t}` },
  { vendor: 'smartrecruiters',
    link: /(?:careers|jobs)\.smartrecruiters\.com\/([A-Za-z0-9_-]{2,60})/i,
    api: (t) => `https://api.smartrecruiters.com/v1/companies/${t}/postings?limit=100`,
    board: (t) => `https://careers.smartrecruiters.com/${t}` },
  { vendor: 'recruitee',
    link: /([a-z0-9-]{2,40})\.recruitee\.com/i,
    api: (t) => `https://${t}.recruitee.com/api/offers/`,
    board: (t) => `https://${t}.recruitee.com` },
  { vendor: 'workable',
    link: /apply\.workable\.com\/([a-z0-9-]{2,40})/i,
    api: (t) => `https://apply.workable.com/api/v1/widget/accounts/${t}?details=true`,
    board: (t) => `https://apply.workable.com/${t}` },
  { vendor: 'personio',
    link: /([a-z0-9-]{2,40})\.jobs\.personio\.(?:de|com)/i,
    api: (t) => `https://${t}.jobs.personio.de/xml`,
    board: (t) => `https://${t}.jobs.personio.de` },
  // Teamtailor is deliberately absent. It has no open posting API, and its board URLs are
  // indistinguishable from the vendor's own subdomains — discovery produced the tokens
  // `www`, `app` and `support` for three different companies, which is precisely the
  // wrong-company attribution this file exists to prevent. A broken adapter is worse than a
  // missing one, because it returns a confident empty result.
];

/** Careers surfaces to check for an outbound board link. Bounded and conventional. */
const CAREERS_PATHS = [
  '', '/careers', '/career', '/jobs', '/join-us', '/work-with-us', '/about/careers',
  '/company/careers', '/vacatures', '/jobs-and-careers', '/en/careers', '/careers/jobs',
];

/**
 * Board tokens that belong to the ATS vendor itself rather than to a customer. Following a
 * "powered by Greenhouse" footer link would otherwise attribute the vendor's own vacancies
 * to every company whose careers page carries the badge.
 */
const VENDOR_OWN_TOKEN = /^(greenhouse|lever|ashby|ashbyhq|workable|smartrecruiters|recruitee|personio|teamtailor|demo|test|example|sandbox|www|app|api|support|help|docs|blog|status|careers|jobs|about|partners|login|admin|my|go|get|info|mail|static|cdn|assets|images?|media|shop|store|dev|staging|preview)$/i;

export interface TenantDiscovery {
  tenants: AtsTenant[];
  health: { url: string; health: SourceHealth; status?: number }[];
}

/**
 * Find ATS boards a company links to from its own pages.
 *
 * Only first-party linkage counts. We never search a vendor's index for the company name,
 * because that is precisely how the wrong company's vacancies get attributed.
 */
export async function discoverTenants(bareDomain: string, budget = 6): Promise<TenantDiscovery> {
  const tenants = new Map<string, AtsTenant>();
  const health: TenantDiscovery['health'] = [];
  let spent = 0;

  for (const path of CAREERS_PATHS) {
    if (spent >= budget) break;
    let r = await get(`https://www.${bareDomain}${path}`);
    if (!r.ok || !r.body) r = await get(`https://${bareDomain}${path}`);
    spent++;
    const url = `https://${bareDomain}${path || '/'}`;
    health.push({
      url,
      health: (r.blocked ? 'blocked' : r.status === 404 ? 'not_found' : r.ok && r.body ? 'success' : 'no_relevant_evidence') as SourceHealth,
      status: r.status,
    });
    if (!r.ok || !r.body) continue;

    for (const def of VENDORS) {
      const m = r.body.match(def.link);
      if (!m) continue;
      const token = m[1];
      if (VENDOR_OWN_TOKEN.test(token)) continue;
      const key = `${def.vendor}:${token.toLowerCase()}`;
      if (tenants.has(key)) continue;
      tenants.set(key, {
        vendor: def.vendor, token, boardUrl: def.board(token),
        ownership: 'owned', basis: 'first_party_link', evidenceUrl: url,
      });
    }
    // One confirmed board is enough; companies rarely run two, and continuing costs requests.
    if (tenants.size > 0) break;
  }

  return { tenants: [...tenants.values()], health };
}

/* ── fetching ────────────────────────────────────────────────────────────── */

const MAX_VACANCIES = 40;

/**
 * Normalise a job description to plain text.
 *
 * ATS boards return descriptions ENTITY-ESCAPED — Greenhouse ships `&lt;div&gt;` rather than
 * `<div>`. The shared `stripTags` removes tags first and decodes entities second, so escaped
 * markup survived it and reappeared as literal `</div>` inside the text. Sentence splitting
 * then found no boundaries, producing 600-character blobs in which "we" and "Salesforce"
 * could sit far apart in the same "sentence" and trip a possession rule. Decoding first, then
 * stripping, is the whole fix — and it is repeated because one pass can reveal another layer.
 */
function clean(html: string): string {
  let t = html;
  for (let i = 0; i < 3; i++) {
    const next = decodeEntities(t).replace(/<[^>]+>/g, ' ');
    if (next === t) break;
    t = next;
  }
  return stripTags(t).replace(/\s+/g, ' ').trim().slice(0, 12000);
}

/** Boards that only publish open roles let us say `current` honestly; others cannot. */
function currentnessFrom(publishedAt: string | null, boardServesOpenOnly: boolean): Currentness {
  if (publishedAt) {
    const age = Date.now() - new Date(publishedAt).getTime();
    if (!Number.isFinite(age)) return boardServesOpenOnly ? 'current' : 'currentness_unknown';
    const days = age / 86_400_000;
    if (days <= 120) return 'current';
    if (days <= 365) return 'recent_historical';
    return 'historical';
  }
  return boardServesOpenOnly ? 'current' : 'currentness_unknown';
}

export interface FetchResult {
  vacancies: Vacancy[];
  health: { url: string; health: SourceHealth; status?: number }[];
}

export async function fetchVacancies(tenant: AtsTenant, domain: string): Promise<FetchResult> {
  const def = VENDORS.find((v) => v.vendor === tenant.vendor)!;
  const api = def.api(tenant.token);
  const r = await get(api);
  const health = [{
    url: api,
    health: (r.blocked ? 'blocked' : r.ok && r.body ? 'success' : r.status === 404 ? 'not_found' : 'no_relevant_evidence') as SourceHealth,
    status: r.status,
  }];
  if (!r.ok || !r.body) return { vacancies: [], health };

  const now = new Date().toISOString();
  const base = { companyDomain: domain, source: api, sourceType: 'company_ats' as const, retrievedAt: now,
    ownership: tenant.ownership, ownershipBasis: tenant.basis };

  try {
    const rows = parseBoard(tenant.vendor, r.body);
    const vacancies = rows.slice(0, MAX_VACANCIES).map((row, i): Vacancy => ({
      id: `${tenant.vendor}:${tenant.token}:${row.id ?? i}`,
      jobTitle: row.title,
      location: row.location,
      jobUrl: row.url ?? def.board(tenant.token),
      publishedAt: row.publishedAt,
      currentness: currentnessFrom(row.publishedAt, BOARD_SERVES_OPEN_ONLY.has(tenant.vendor)),
      description: row.description,
      language: row.language,
      ...base,
    }));
    return { vacancies, health };
  } catch {
    return { vacancies: [], health: [{ ...health[0], health: 'parse_error' as SourceHealth }] };
  }
}

/** Vendors whose public API returns only currently-open postings. */
const BOARD_SERVES_OPEN_ONLY = new Set<AtsVendor>(['greenhouse', 'lever', 'ashby', 'smartrecruiters', 'recruitee', 'workable']);

interface RawRow {
  id?: string | number;
  title: string;
  location: string | null;
  url?: string;
  publishedAt: string | null;
  description: string;
  language: string | null;
}

function parseBoard(vendor: AtsVendor, body: string): RawRow[] {
  if (vendor === 'personio') return parsePersonioXml(body);

  const j = JSON.parse(body);
  switch (vendor) {
    case 'greenhouse':
      return (j.jobs ?? []).map((x: any) => ({
        id: x.id, title: x.title, location: x.location?.name ?? null, url: x.absolute_url,
        publishedAt: x.updated_at ?? x.first_published ?? null,
        description: clean(x.content ?? ''), language: null,
      }));
    case 'lever':
      return (Array.isArray(j) ? j : []).map((x: any) => ({
        id: x.id, title: x.text, location: x.categories?.location ?? null, url: x.hostedUrl,
        publishedAt: x.createdAt ? new Date(x.createdAt).toISOString() : null,
        description: clean([x.descriptionPlain ?? x.description ?? '', ...(x.lists ?? []).map((l: any) => `${l.text} ${l.content}`)].join(' ')),
        language: null,
      }));
    case 'ashby':
      return (j.jobs ?? []).map((x: any) => ({
        id: x.id, title: x.title, location: x.location ?? null, url: x.jobUrl,
        publishedAt: x.publishedAt ?? null,
        description: clean(x.descriptionHtml ?? x.descriptionPlain ?? ''), language: null,
      }));
    case 'smartrecruiters':
      // The list endpoint omits descriptions; titles alone are still usable for role facts.
      return (j.content ?? []).map((x: any) => ({
        id: x.id, title: x.name, location: [x.location?.city, x.location?.country].filter(Boolean).join(', ') || null,
        url: x.ref ?? undefined, publishedAt: x.releasedDate ?? null, description: '', language: x.language?.code ?? null,
      }));
    case 'recruitee':
      return (j.offers ?? []).map((x: any) => ({
        id: x.id, title: x.title, location: x.location ?? null, url: x.careers_url,
        publishedAt: x.published_at ?? null, description: clean(x.description ?? ''), language: x.language_code ?? null,
      }));
    case 'workable':
      return (j.jobs ?? []).map((x: any) => ({
        id: x.shortcode, title: x.title, location: x.location?.city ?? null, url: x.url,
        publishedAt: x.published_on ?? null,
        description: clean([x.description, x.requirements, x.benefits].filter(Boolean).join(' ')), language: null,
      }));
    default:
      return [];
  }
}

function parsePersonioXml(xml: string): RawRow[] {
  const out: RawRow[] = [];
  for (const m of xml.matchAll(/<position>([\s\S]*?)<\/position>/gi)) {
    const block = m[1];
    const pick = (tag: string) => block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))?.[1] ?? '';
    const title = clean(pick('name'));
    if (!title) continue;
    out.push({
      id: clean(pick('id')) || undefined, title,
      location: clean(pick('office')) || null,
      url: clean(pick('jobDescriptionUrl')) || undefined,
      publishedAt: clean(pick('createdAt')) || null,
      description: clean(block.match(/<jobDescriptions>([\s\S]*?)<\/jobDescriptions>/i)?.[1] ?? ''),
      language: clean(pick('lang')) || null,
    });
  }
  return out;
}

/* ── canonicalisation ────────────────────────────────────────────────────── */

/**
 * The same vacancy reachable through a careers page, a board and an aggregator is one
 * observation, not three. Counting them separately would let a company look better simply by
 * syndicating more widely — the same publication-volume trap the rest of the system guards
 * against.
 */
export function canonicalise(vacancies: Vacancy[]): { kept: Vacancy[]; collapsed: number } {
  const seen = new Map<string, Vacancy>();
  let collapsed = 0;
  for (const v of vacancies) {
    const key = `${v.jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()}|${(v.location ?? '').toLowerCase().slice(0, 24)}`;
    const prior = seen.get(key);
    if (!prior) { seen.set(key, v); continue; }
    collapsed++;
    // Prefer the representation carrying an actual description.
    if (v.description.length > prior.description.length) seen.set(key, v);
  }
  return { kept: [...seen.values()], collapsed };
}
