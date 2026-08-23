/**
 * Label-provenance audit.
 *
 * Phase 2's headline discriminator was distributor-carried structure: 1 of 16 customers
 * against 10 of 14 hypothesised poor-fit programmes. Before that number is used again, it
 * has to be asked whether the Cohort C labels were assigned USING the same feature — in
 * which case the measurement is partly circular.
 *
 * The audit reads the frozen rationales I wrote in Phase 2 and classifies what each label
 * was actually based on.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const bench = JSON.parse(readFileSync(new URL('../phase2/benchmark/suitability.v1.json', import.meta.url), 'utf8')) as {
  cohortA_customers: { name: string; domain: string; why: string }[];
  cohortB_plausible: { name: string; domain: string; why: string }[];
  cohortC_hypothesised_poor_fit: { name: string; domain: string; hypothesis: string }[];
};

/** What a rationale actually appeals to. Several may apply to one label. */
const BASIS: [string, RegExp][] = [
  ['distribution_structure', /\b(multi[_ -]?tier|two[_ -]?tier|distributor|distribution|wholesaler)\b/i],
  ['programme_complexity', /\b(programme_multiplicity|programme multiplicity|multiple programmes|rebate|mdf|incentive_complexity|incentive complexity|governance|tcma)\b/i],
  ['enterprise_infrastructure', /\b(enterprise_infrastructure|partner university|certification estate|enterprise PRM|partner academy)\b/i],
  ['company_size_or_reputation', /\b(largest|giant|huge|enterprise-scale|global scale)\b/i],
  ['first_party_introw_evidence', /\b(case study|CNAME-confirmed|customer logo|Introw case)\b/i],
  ['segment_or_market', /\b(security vendor|SaaS|industrial|hardware|solar|electrical|accountant|manufacturer|payments)\b/i],
  ['observed_programme_artifacts', /\b(deal registration|partner portal|tiered|tiers|directory|installer network|reseller channel|partner programme|partner program)\b/i],
  ['participation_not_operation', /\b(participant_not_operator|alliance ecosystem participation|equity-partner)\b/i],
];

interface AuditRow {
  cohort: string;
  name: string;
  domain: string;
  label: string;
  labelOrigin: string;
  labelRationale: string;
  basis: string[];
  labelAssignedBeforeDetectorResults: boolean;
  distributionInfluencedLabel: boolean;
  complexityInfluencedLabel: boolean;
  sizeInfluencedLabel: boolean;
  leakageRisk: 'none' | 'low' | 'high';
  usableAsCleanNegativeForDistribution: boolean;
}

const rows: AuditRow[] = [];

for (const c of bench.cohortA_customers) {
  const basis = BASIS.filter(([, re]) => re.test(c.why)).map(([k]) => k);
  rows.push({
    cohort: 'A_customer', name: c.name, domain: c.domain, label: 'known_positive',
    labelOrigin: "Introw's own published case studies and CNAME-confirmed platform fingerprints",
    labelRationale: c.why, basis,
    labelAssignedBeforeDetectorResults: true,
    distributionInfluencedLabel: false, complexityInfluencedLabel: false, sizeInfluencedLabel: false,
    // A customer label comes from Introw, not from anything we detect. No leakage.
    leakageRisk: 'none', usableAsCleanNegativeForDistribution: false,
  });
}

for (const c of bench.cohortB_plausible) {
  const basis = BASIS.filter(([, re]) => re.test(c.why)).map(([k]) => k);
  rows.push({
    cohort: 'B_plausible', name: c.name, domain: c.domain, label: 'matched_unlabelled_prospect',
    labelOrigin: 'my own structural reasoning, seeded largely from Phase 1 distributor-inversion output',
    labelRationale: c.why, basis,
    labelAssignedBeforeDetectorResults: true,
    // Selection, not the label, is where B's contamination lives: it was drawn from
    // distributor lists, so it inherits the distributor property by construction.
    distributionInfluencedLabel: true, complexityInfluencedLabel: false, sizeInfluencedLabel: false,
    leakageRisk: 'high', usableAsCleanNegativeForDistribution: false,
  });
}

for (const c of bench.cohortC_hypothesised_poor_fit) {
  const basis = BASIS.filter(([, re]) => re.test(c.hypothesis)).map(([k]) => k);
  const dist = basis.includes('distribution_structure');
  const cx = basis.includes('programme_complexity') || basis.includes('enterprise_infrastructure');
  const size = basis.includes('company_size_or_reputation');
  const participation = basis.includes('participation_not_operation');
  rows.push({
    cohort: 'C_hypothesised_poor_fit', name: c.name, domain: c.domain, label: 'hypothesised_negative',
    labelOrigin: 'my own structural hypothesis, written in Phase 2 before any detector ran',
    labelRationale: c.hypothesis, basis,
    labelAssignedBeforeDetectorResults: true,
    distributionInfluencedLabel: dist, complexityInfluencedLabel: cx, sizeInfluencedLabel: size,
    leakageRisk: dist ? 'high' : cx ? 'low' : 'none',
    // A clean negative for the distribution test is one whose negative rationale never
    // mentions distribution. Participation-based negatives qualify; multi-tier ones do not.
    usableAsCleanNegativeForDistribution: !dist,
  });
}

const summary = {
  auditedAt: new Date().toISOString(),
  totals: {
    all: rows.length,
    byCohort: Object.fromEntries(['A_customer', 'B_plausible', 'C_hypothesised_poor_fit'].map((c) => [c, rows.filter((r) => r.cohort === c).length])),
  },
  distributionLeakage: {
    cohortC_labelsCitingDistribution: rows.filter((r) => r.cohort === 'C_hypothesised_poor_fit' && r.distributionInfluencedLabel).length,
    cohortC_total: rows.filter((r) => r.cohort === 'C_hypothesised_poor_fit').length,
    cohortB_selectionSeededFromDistributors: true,
    verdict:
      'The Phase 2 distribution result is partly circular. Most Cohort C negatives were ' +
      'hypothesised BECAUSE I believed the company was distributor-led, and Cohort B was ' +
      'sampled from distributor lists. Measuring distributor-carriage against those labels ' +
      'partly measures my own priors.',
  },
  cleanNegativesForDistributionTest: rows.filter((r) => r.usableAsCleanNegativeForDistribution).map((r) => ({ name: r.name, domain: r.domain, rationale: r.labelRationale })),
  rows,
};

writeFileSync(`${OUT}label-audit.json`, JSON.stringify(summary, null, 2));

console.log('# Label-provenance audit\n');
console.log(`Cohort C labels citing distribution: ${summary.distributionLeakage.cohortC_labelsCitingDistribution}/${summary.distributionLeakage.cohortC_total}`);
console.log(`Cohort B selection seeded from distributor lists: yes\n`);
console.log('Clean negatives for the distribution test (negative rationale independent of distribution):');
for (const c of summary.cleanNegativesForDistributionTest) console.log(`  ${c.name.padEnd(14)} ${c.rationale.slice(0, 96)}`);
console.log('\nLeakage risk by cohort:');
for (const c of ['A_customer', 'B_plausible', 'C_hypothesised_poor_fit']) {
  const rs = rows.filter((r) => r.cohort === c);
  const byRisk: Record<string, number> = {};
  for (const r of rs) byRisk[r.leakageRisk] = (byRisk[r.leakageRisk] ?? 0) + 1;
  console.log(`  ${c.padEnd(26)} ${JSON.stringify(byRisk)}`);
}
