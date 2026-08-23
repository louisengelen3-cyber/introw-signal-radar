/**
 * P0 — known-customer miss teardown.
 *
 * Every confirmed Introw customer, run through the current pipeline, with the rule that
 * stopped each one recorded. The point is not to patch names; it is to find the general
 * failure classes, and in particular to test whether the architecture is biased toward
 * mature, formalised channel programmes and away from the younger, simpler programmes
 * Introw's own case studies describe.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { assessCompany, type Assessment } from '../src/pipeline/assess.js';
import { buildDistributionIndex } from '../src/suitability/distribution.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

/** Every publicly identifiable Introw customer: 14 case studies plus 8 logo-only. */
const CUSTOMERS: { name: string; domain: string; evidence: string }[] = [
  { name: 'Cumulocity', domain: 'cumulocity.com', evidence: 'case study' },
  { name: 'Ringover', domain: 'ringover.com', evidence: 'case study' },
  { name: 'Factorial', domain: 'factorialhr.com', evidence: 'case study' },
  { name: 'Quatt', domain: 'quatt.io', evidence: 'case study' },
  { name: 'Cubbit', domain: 'cubbit.io', evidence: 'case study' },
  { name: 'Zenity', domain: 'zenity.io', evidence: 'case study' },
  { name: 'Sedai', domain: 'sedai.io', evidence: 'case study' },
  { name: 'Epiphan Video', domain: 'epiphan.com', evidence: 'case study' },
  { name: 'Xelix', domain: 'xelix.com', evidence: 'case study' },
  { name: 'WeGive', domain: 'wegive.com', evidence: 'case study' },
  { name: 'SafeBreach', domain: 'safebreach.com', evidence: 'case study' },
  { name: 'Payflip', domain: 'payflip.be', evidence: 'case study' },
  { name: 'Coder', domain: 'coder.com', evidence: 'case study' },
  { name: 'Tensis', domain: 'tensis.io', evidence: 'case study (domain unverified)' },
  { name: 'ShareGate', domain: 'sharegate.com', evidence: 'logo + CNAME' },
  { name: 'Archer', domain: 'archerirm.com', evidence: 'logo (domain is human judgment)' },
  { name: 'Axon', domain: 'axon.com', evidence: 'logo + CNAME' },
  { name: 'Aikido Security', domain: 'aikido.dev', evidence: 'logo' },
  { name: 'Personio', domain: 'personio.com', evidence: 'logo' },
  { name: 'Parloa', domain: 'parloa.com', evidence: 'logo + CNAME' },
  { name: 'ReversingLabs', domain: 'reversinglabs.com', evidence: 'logo + CNAME' },
  { name: 'Storyblok', domain: 'storyblok.com', evidence: 'logo' },
];

/**
 * Maturity artefacts, observed independently of the fit verdict.
 * Used to test the "mature channel language bias" hypothesis: do the customers the system
 * MISSES systematically have fewer formal artefacts than the ones it catches?
 */
const MATURITY_MARKERS: [string, RegExp][] = [
  ['deal_registration', /\b(deal registration|register a deal|opportunity registration)\b/i],
  ['partner_tiers', /\b((?:gold|silver|bronze|platinum|premier|elite) partner|partner tiers?|partner levels?)\b/i],
  ['formal_portal', /\b(partner portal|partner login|partner hub)\b/i],
  ['certification', /\b(partner certification|certified partner program|partner academy|partner university)\b/i],
  ['incentive_programme', /\b(rebate|spiff|incentive program|commission structure)\b/i],
  ['mdf', /\b(mdf|market development fund|co-?op fund)\b/i],
  ['distributor_structure', /\b(authoriz?ed distributor|through a distributor|two-tier)\b/i],
  ['programme_documentation', /\b(programme guide|program guide|partner agreement|partner terms|programme requirements|program requirements)\b/i],
];

export interface TeardownRow {
  name: string;
  domain: string;
  customerEvidence: string;
  reachable: boolean;
  blockReason?: string;
  inventorySite: number;
  inventoryCommonCrawl: number;
  pagesFetched: number;
  pagesOk: number;
  platform: string | null;
  channel: string;
  channelRule: string;
  strongEvidenceClasses: string[];
  direction: string;
  suitability: string;
  suitabilityRule: string;
  /** Which layer stopped it, so failures can be grouped rather than listed. */
  stoppedAt: 'reached_suitability' | 'channel_classification' | 'retrieval' | 'identity';
  maturityMarkers: string[];
  maturityCount: number;
}

const distributionIndex = buildDistributionIndex(['phase1/out/discovery.v1.json']);
const rows: TeardownRow[] = [];

function maturity(a: Assessment): string[] {
  // Re-scan the fetched evidence rather than trusting the verdict: maturity has to be
  // measured independently of fit or the bias test would be circular.
  const text = (a.classification?.evidence ?? []).map((e) => `${e.claim} ${e.quote ?? ''}`).join(' ');
  return MATURITY_MARKERS.filter(([, re]) => re.test(text)).map(([k]) => k);
}

let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < CUSTOMERS.length) {
    const c = CUSTOMERS[i++];
    try {
      const a = await assessCompany(c.domain, { distributionIndex, name: c.name });
      const strong = [...new Set((a.classification?.evidence ?? []).filter((e) => e.strength === 'strong').map((e) => e.evidenceClass))];
      const channel = a.classification?.commerciality ?? 'error';
      const stoppedAt: TeardownRow['stoppedAt'] =
        !a.reachable && a.blockReason === 'domain_unresolved' ? 'identity'
          : !a.reachable ? 'retrieval'
            : !['transacting', 'mixed'].includes(channel) ? 'channel_classification'
              : 'reached_suitability';
      const m = maturity(a);
      rows.push({
        name: c.name, domain: c.domain, customerEvidence: c.evidence,
        reachable: a.reachable, blockReason: a.blockReason,
        inventorySite: a.inventory.site, inventoryCommonCrawl: a.inventory.commonCrawl,
        pagesFetched: a.pagesFetched.length, pagesOk: a.pagesFetched.filter((p) => p.status === 200).length,
        platform: a.dns.platform?.vendor ?? null,
        channel, channelRule: a.classification?.rule ?? '-', strongEvidenceClasses: strong,
        direction: a.operator?.direction ?? '-',
        suitability: a.suitability?.state ?? '-', suitabilityRule: a.suitability?.rule ?? '-',
        stoppedAt, maturityMarkers: m, maturityCount: m.length,
      });
      writeFileSync(`${OUT}customer-teardown.json`, JSON.stringify(rows, null, 2));
      console.error(`[${rows.length}/${CUSTOMERS.length}] ${c.domain.padEnd(22)} stop=${stoppedAt.padEnd(22)} chan=${channel.padEnd(14)} fit=${(a.suitability?.state ?? '-').padEnd(18)} maturity=${m.length}`);
    } catch (e) { console.error(`[err] ${c.domain}: ${(e as Error).message}`); }
  }
}));

writeFileSync(`${OUT}customer-teardown.json`, JSON.stringify(rows, null, 2));

/* ── the bias test ──────────────────────────────────────────────────────── */
const caught = rows.filter((r) => r.stoppedAt === 'reached_suitability');
const missed = rows.filter((r) => r.stoppedAt !== 'reached_suitability');
const mean = (xs: number[]) => (xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

console.error('\n## Mature-channel-language bias test');
console.error(`  caught (reached suitability): n=${caught.length}, mean maturity artefacts = ${mean(caught.map((r) => r.maturityCount)).toFixed(2)}`);
console.error(`  missed:                       n=${missed.length}, mean maturity artefacts = ${mean(missed.map((r) => r.maturityCount)).toFixed(2)}`);
console.error('\n## Stop-layer distribution');
const byStop: Record<string, string[]> = {};
for (const r of rows) (byStop[r.stoppedAt] ??= []).push(r.domain);
for (const [k, v] of Object.entries(byStop)) console.error(`  ${k.padEnd(24)} ${v.length} — ${v.join(', ')}`);
console.error('DONE');
