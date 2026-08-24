import { researchCrm } from '../../src/crm/research.js';
for (const d of ['teamleader.eu', 'mews.com', 'quatt.io']) {
  const r = await researchCrm(d, { requestBudget: 26 });
  console.log(`\n${d}`);
  console.log(`  coverage: ats=${r.coverage.atsBoardFound} vacancies=${r.coverage.vacanciesRead} historical=${r.coverage.historicalVacanciesRead} nonPartnerTitles=${r.coverage.nonPartnerTitlesRead} requests=${r.budget.sourcesInspected}`);
  console.log(`  families: ${JSON.stringify(r.familiesObserved)}`);
  for (const v of r.vendors.slice(0, 4)) {
    console.log(`  ${v.vendor.padEnd(20)} ${v.level.padEnd(20)} ${v.basis?.jobTitle ?? v.basis?.sourceType ?? ''}`);
    if (v.basis) console.log(`      "${v.basis.quote.slice(0, 100)}"`);
  }
  if (r.conflict) console.log(`  CONFLICT ${r.conflict.kind}: ${r.conflict.vendors.join(', ')}`);
  console.log(`  note: ${r.note}`);
}
