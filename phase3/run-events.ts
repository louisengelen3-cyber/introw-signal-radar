/**
 * Bounded partnership-event source feasibility.
 *
 * Phase 0 sampled these once and found the population enterprise-skewed. Phase 3 asks a
 * sharper question: which ROLE does the source actually support — discovery seed, person
 * enrichment, priority accelerator, or context only?
 *
 * Event participation is not partner-ledness and not buying intent. It is at most evidence
 * that a partner function exists, has budget, and travels.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { get, mainContent } from '../src/lib/http.js';
// @ts-expect-error — the Phase 0 persona classifier is plain JS and is reused unchanged
import { classifyPersona, TIER } from '../phase0/lib/people.mjs';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const SOURCES: [string, string][] = [
  ['catalyst_nyc', 'https://www.joincatalyst.com/catalyst-summit-nyc-2026'],
  ['catalyst_agenda', 'https://www.joincatalyst.com/agenda-catalyst-26'],
  ['partnertechx_speakers', 'https://channelfocuscommunity.net/partnertechx-2026/partnertechx-2026-speakers-and-experts/'],
  ['channelfocus', 'https://channelfocuscommunity.net/'],
  ['partnershipleaders', 'https://partnershipleaders.com/'],
];

/** Company names that appear alongside a person, extracted conservatively. */
const COMPANY_AFTER_TITLE = /\b(?:at|@|,)\s+([A-Z][A-Za-z0-9&.\-]{2,24}(?:\s+[A-Z][A-Za-z0-9&.\-]{2,24})?)\b/g;

/**
 * The naive extractor above returns title fragments as often as companies — "Chief
 * Partner", "Strategic Alliances", "Power Circles", "April". Anything built from partner
 * vocabulary, a month, or a generic business noun is not a company name, and counting it
 * as one produced a discovery-seed verdict the evidence did not support.
 */
const NOT_A_COMPANY = /\b(partner|partners|partnership|partnerships|alliance|alliances|channel|ecosystem|programs?|programme|strategy|operations|marketing|sales|business|commerce|distribution|incentives|attribution|membership|solutions|circles|not|global|americas|europe|emea|apac|enterprise|technology|data|product|capital markets|through-channel|january|february|march|april|may|june|july|august|september|october|november|december)\b/i;

interface SourceResult {
  id: string;
  status: number;
  chars: number;
  peopleWithTitles: number;
  tier1People: number;
  companiesNamed: string[];
  enterpriseShare: number;
  dated: boolean;
  leadTimeNote: string;
}

const ENTERPRISE = /\b(Microsoft|AWS|Amazon|Google|Oracle|SAP|IBM|Salesforce|Cisco|Dell|HPE|Accenture|Deloitte|EY|PwC|KPMG|BCG|McKinsey|NTT|Infosys|Capgemini|ServiceNow|Snowflake|Databricks|VMware|Broadcom|Adobe|Workday|Mastercard|Visa|TransUnion|OpenAI|Anthropic|Cloudflare|Datadog|CrowdStrike|Zscaler|Okta|Atlassian|HubSpot|Zoom)\b/gi;

const results: SourceResult[] = [];
for (const [id, url] of SOURCES) {
  const r = await get(url, { timeout: 30000 });
  if (!r.ok || !r.body) { results.push({ id, status: r.status, chars: 0, peopleWithTitles: 0, tier1People: 0, companiesNamed: [], enterpriseShare: 0, dated: false, leadTimeNote: 'unreachable' }); continue; }
  const text = mainContent(r.body);

  // Titles are what the source actually publishes; names and companies are inconsistent.
  const titles = [...text.matchAll(/\b((?:Global |Senior |Sr\.? |Regional |EMEA )?(?:SVP|VP|Vice President|Head|Director|Chief|Manager|Lead)[^.,|]{0,44}?\b(?:Partner|Partners|Partnership|Partnerships|Alliance|Alliances|Channel|Ecosystem)[A-Za-z ,&]{0,26})\b/g)].map((m) => m[1].trim());
  const tier1 = titles.filter((t) => TIER[classifyPersona(t).persona] === 1).length;
  const companies = [...new Set([...text.matchAll(COMPANY_AFTER_TITLE)].map((m) => m[1]))]
    .filter((c) => !NOT_A_COMPANY.test(c));
  const entHits = [...text.matchAll(new RegExp(ENTERPRISE.source, 'gi'))].length;

  results.push({
    id, status: r.status, chars: text.length,
    peopleWithTitles: titles.length, tier1People: tier1,
    companiesNamed: companies.slice(0, 40),
    enterpriseShare: titles.length ? Number((entHits / Math.max(titles.length, 1)).toFixed(2)) : 0,
    dated: /\b(20\d{2}|January|February|March|April|May|June|July|August|September|October|November|December)\b/.test(text),
    leadTimeNote: /\b(register|tickets|agenda|speakers)\b/i.test(text) ? 'published ahead of the event — a leading indicator' : 'unclear',
  });
  console.error(`${id.padEnd(24)} status=${r.status} titles=${titles.length} tier1=${tier1} companies=${companies.length} entRatio=${results.at(-1)!.enterpriseShare}`);
}

const totalTitles = results.reduce((n, r) => n + r.peopleWithTitles, 0);
const totalTier1 = results.reduce((n, r) => n + r.tier1People, 0);
const allCompanies = [...new Set(results.flatMap((r) => r.companiesNamed))];
const ENTERPRISE_ONE = new RegExp(ENTERPRISE.source, 'i');
const entNamed = allCompanies.filter((c) => ENTERPRISE_ONE.test(c)).length;

const verdict = {
  measuredAt: new Date().toISOString(),
  sources: results,
  totals: { titles: totalTitles, tier1: totalTier1, distinctCompanies: allCompanies.length, enterpriseNamed: entNamed },
  roles: {
    // A discovery-seed claim needs real company names at volume. After removing title
    // fragments the extractor yields too few to support one, so this stays unresolved
    // rather than being reported on a broken count.
    discovery_seed: allCompanies.length >= 30
      ? `SUPPORTED — ${allCompanies.length} distinct companies extracted, ${entNamed} large-cap`
      : `UNRESOLVED — only ${allCompanies.length} company names survived filtering; event pages publish titles far more reliably than employers, so company discovery is not demonstrated by this method`,
    person_enrichment: totalTier1 >= 15
      ? 'SUPPORTED — Tier-1 partner titles appear at volume with company attribution'
      : 'WEAK — too few clean Tier-1 extractions',
    priority_accelerator: 'UNRESOLVED — would require matching attendees to an existing account list, and attendee lists are private; only speakers and sponsors are published',
    context_only: 'ALWAYS SUPPORTED — attendance evidences that a partner function exists and travels',
  },
  cannotEstablish: 'partner-ledness, buying intent, programme size, or that the company is in market',
};
writeFileSync(`${OUT}events.json`, JSON.stringify(verdict, null, 2));
console.error(`\ntotals: titles=${totalTitles} tier1=${totalTier1} distinctCompanies=${allCompanies.length} enterpriseNamed=${entNamed}`);
console.error(JSON.stringify(verdict.roles, null, 2));
console.error('DONE');
