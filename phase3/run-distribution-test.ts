/**
 * Segment-controlled distribution test.
 *
 * Phase 2 reported 1/16 customers vs 10/14 hypothesised poor-fit as distributor-carried.
 * The Phase 3 label audit then found that 13 of those 14 negative labels CITE distribution
 * in their own rationale, so that comparison partly measures my own priors.
 *
 * This re-tests the signal against populations whose labels are independent of it, and
 * within segment, because Phase 2 also measured a large segment imbalance (17% of
 * SaaS-ish companies distributor-carried against 74% of hardware/security/industrial).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import type { Assessment } from '../src/pipeline/assess.js';
import { buildDistributionIndex, findSightings } from '../src/suitability/distribution.js';

type Row = Assessment & { name: string; population: string; meta: string };
const R = JSON.parse(readFileSync(new URL('./out/positive.json', import.meta.url), 'utf8')) as Row[];
const idx = buildDistributionIndex(['phase1/out/discovery.v1.json']);

/** Segment assigned from what the company sells, independently of any fit verdict. */
const SEGMENT: Record<string, string> = {
  'cumulocity.com': 'software', 'ringover.com': 'software', 'factorialhr.com': 'software',
  'cubbit.io': 'software', 'zenity.io': 'security', 'sedai.io': 'software',
  'xelix.com': 'software', 'safebreach.com': 'security', 'payflip.be': 'software',
  'coder.com': 'software', 'sharegate.com': 'software', 'archerirm.com': 'software',
  'aikido.dev': 'security', 'parloa.com': 'software', 'reversinglabs.com': 'security',
  'storyblok.com': 'software', 'quatt.io': 'hardware', 'epiphan.com': 'hardware', 'axon.com': 'hardware',
  'aircall.io': 'software', 'personio.com': 'software', 'silverfin.com': 'software',
  'nedap.com': 'hardware', 'wiz.io': 'security', 'snyk.io': 'security',
  'contentful.com': 'software', 'datadoghq.com': 'software', 'vectra.ai': 'security',
  'basware.com': 'software', 'wasabi.com': 'software', 'yuki.nl': 'software',
  'teamleader.eu': 'software', 'loxone.com': 'hardware', 'enphase.com': 'hardware',
  'deloitte.com': 'services', 'freshfields.com': 'services', 'bain.com': 'services',
  'sequoiacap.com': 'services', 'indexventures.com': 'services',
  'linear.app': 'software', 'sentry.io': 'software', 'posthog.com': 'software',
  'semrush.com': 'software', 'kinsta.com': 'software',
  'softcat.com': 'reseller', 'computacenter.com': 'reseller', 'bechtle.com': 'reseller', 'insight.com': 'reseller',
};

interface Rec { domain: string; population: string; segment: string; carried: boolean; distributors: number; ownership: string; surface: string; promotion: string }

const recs: Rec[] = R.map((r) => {
  const s = findSightings(idx, r.name, r.domain);
  return {
    domain: r.domain, population: r.population, segment: SEGMENT[r.domain] ?? 'unknown',
    carried: s.length > 0, distributors: new Set(s.map((x) => x.distributor)).size,
    ownership: r.positive?.ownership ?? '-', surface: r.positive?.surface ?? '-',
    promotion: r.promotion?.state ?? '-',
  };
});

const L: string[] = [];
const say = (s = '') => { L.push(s); console.log(s); };

say('# Segment-controlled distribution test');
say('Absolute counts only. n is small and a percentage here would overstate what it shows.');
say();
say('## Carriage by population, WITHOUT segment control');
say('| population | n | distributor-carried |');
say('|---|---|---|');
for (const p of ['customer_discovery', 'customer_holdout', 'clean_negative', 'matched_unlabelled']) {
  const rows = recs.filter((r) => r.population === p);
  say(`| ${p} | ${rows.length} | ${rows.filter((r) => r.carried).length} |`);
}
say();
say('## Carriage WITHIN segment');
say('| segment | population | n | carried |');
say('|---|---|---|---|');
for (const seg of ['software', 'security', 'hardware', 'services', 'reseller']) {
  for (const p of ['customer_discovery', 'customer_holdout', 'clean_negative', 'matched_unlabelled']) {
    const rows = recs.filter((r) => r.segment === seg && r.population === p);
    if (!rows.length) continue;
    say(`| ${seg} | ${p} | ${rows.length} | ${rows.filter((r) => r.carried).length} |`);
  }
}
say();

/* The question that matters: within one segment, do customers and non-customers differ? */
say('## The controlled comparison');
const custAll = recs.filter((r) => r.population.startsWith('customer'));
const negAll = recs.filter((r) => r.population === 'clean_negative');
const unlAll = recs.filter((r) => r.population === 'matched_unlabelled');
for (const seg of ['software', 'security', 'hardware']) {
  const c = custAll.filter((r) => r.segment === seg);
  const u = unlAll.filter((r) => r.segment === seg);
  say(`- **${seg}**: customers ${c.filter((r) => r.carried).length}/${c.length} carried · matched unlabelled ${u.filter((r) => r.carried).length}/${u.length} carried`);
}
say(`- **clean negatives** (services + reseller + software): ${negAll.filter((r) => r.carried).length}/${negAll.length} carried`);
say();
say('## Does carriage add anything once ownership is known?');
say('| group | n | direct/mixed ownership | promoted high_fit |');
say('|---|---|---|---|');
for (const [label, rows] of [['carried', recs.filter((r) => r.carried)], ['not carried', recs.filter((r) => !r.carried)]] as const) {
  say(`| ${label} | ${rows.length} | ${rows.filter((r) => ['direct', 'mixed'].includes(r.ownership)).length} | ${rows.filter((r) => r.promotion === 'high_fit').length} |`);
}
say();
writeFileSync(new URL('./out/distribution-test.md', import.meta.url).pathname, L.join('\n'));
