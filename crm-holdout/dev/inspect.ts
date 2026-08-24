import { discoverTenants, fetchVacancies, canonicalise } from '../../src/jobs/ats.js';
import { findCareersVacancies } from '../../src/crm/jobsources.js';
for (const d of ['quatt.io', 'mews.com']) {
  console.log(`\n=== ${d} ===`);
  const { tenants } = await discoverTenants(d, 6);
  console.log('tenants:', tenants.map((t) => `${t.vendor}/${t.slug}(${t.ownership})`).join(', ') || 'none');
  for (const t of tenants.filter((x) => x.ownership === 'owned')) {
    const res = await fetchVacancies(t, d);
    const { kept } = canonicalise(res.vacancies);
    console.log(`  ${t.vendor}: ${kept.length} vacancies`);
    for (const v of kept.slice(0, 4)) {
      console.log(`    "${v.jobTitle}" descLen=${v.description.length} pub=${v.publishedAt ?? '-'} cur=${v.currentness}`);
      if (v.description.length) console.log(`      ${v.description.slice(0, 160).replace(/\s+/g, ' ')}`);
    }
  }
  const cr = await findCareersVacancies(d, { maxRequests: 14, maxPages: 10 });
  console.log(`  careers: pages=${cr.careersPagesFound} docs=${cr.documents.length} req=${cr.requests}`);
  for (const doc of cr.documents.slice(0, 3)) console.log(`    ${doc.origin} ${doc.url.slice(0, 80)} len=${doc.text.length}`);
}
