import { scanVacancyOperational } from '../../src/jobs/operational.js';
const v = (title: string, description: string) => ({
  id: 't', companyDomain: 'x.com', jobTitle: title, location: null, jobUrl: 'https://x.com/j',
  source: '', sourceType: 'company_ats' as const, publishedAt: null, retrievedAt: '',
  currentness: 'current' as const, description, language: null,
  ownership: 'owned' as const, ownershipBasis: 'first_party_link' as const,
});
const cases: [string, string, string, boolean][] = [
  ['false positive: engineering tooling', 'Staff Analytics Engineer', 'Run your own workflow on AI coding tooling to the point where you can say clearly what to adopt.', false],
  ['true positive: business systems', 'RevOps Manager', 'You will own our revenue systems and keep the GTM stack coherent.', true],
  ['true positive: business systems phrase', 'Ops Lead', 'Reporting into the COO, you own business systems end to end.', true],
];
for (const [name, title, desc, expectOwnership] of cases) {
  const hits = scanVacancyOperational(v(title, desc));
  const got = hits.some((h) => h.fact === 'system_ownership');
  console.log(`${got === expectOwnership ? ' ok ' : 'MISS'} ${name} → system_ownership=${got}`);
}
const long = scanVacancyOperational(v('Channel Business Manager', 'Own and achieve set targets across your region and partner portfolio Develop and manage a healthy portfolio of key partners Enable and activate partners through training joint GTM plans and consistent execution Track KPIs, deal registration, and pipeline health in CRM/PRM Champion a partner-preferred results-oriented motion that fuels predictable growth'));
for (const h of long.filter((h) => h.fact === 'deal_registration' || h.fact === 'prm_usage'))
  console.log(`  ${h.fact}: "${h.quote}"`);
