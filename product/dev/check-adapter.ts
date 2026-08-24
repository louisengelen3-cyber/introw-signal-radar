import { fetchVacancies } from '../../src/jobs/ats.js';
const t = { vendor: 'greenhouse' as const, token: 'aircallioinc', boardUrl: '', ownership: 'owned' as const, basis: 'first_party_link' as const, evidenceUrl: '' };
const r = await fetchVacancies(t, 'aircall.io');
const v = r.vacancies.find((x) => /revenue operations/i.test(x.jobTitle)) ?? r.vacancies[0];
console.log('vacancies:', r.vacancies.length, '| health:', r.health[0]?.health);
console.log('title:', v?.jobTitle);
console.log('raw markup in description:', /<\/?(div|p|li|strong|br)/i.test(v?.description ?? ''));
console.log('sample:', (v?.description ?? '').slice(0, 220));
