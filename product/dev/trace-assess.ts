import { assessCompany } from '../../src/pipeline/assess.js';
const a = await assessCompany(process.argv[2]);
console.log('reachable', a.reachable, 'inventory', JSON.stringify(a.inventory));
console.log('pagesFetched:'); for (const p of a.pagesFetched) console.log('  ', p.status, p.chars, p.url);
console.log('positive:', a.positive?.materiality, a.positive?.ownership, a.positive?.surface, 'obs', a.positive?.observations.length);
