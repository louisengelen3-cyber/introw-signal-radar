import { get } from '../../src/lib/http.js';
import { sentences } from '../../src/jobs/crm.js';
const r = await get('https://boards-api.greenhouse.io/v1/boards/aircallioinc/jobs?content=true', { force: true });
if (!r.ok || !r.body) { console.log('fetch failed', r.status, r.error); process.exit(0); }
const j = JSON.parse(r.body!);
const job = j.jobs.find((x: any) => /revenue operations/i.test(x.title)) ?? j.jobs[0];
// Reproduce the adapter's cleaning path.
import { decodeEntities, stripTags } from '../../src/lib/http.js';
let t = job.content as string;
for (let i = 0; i < 3; i++) { const n = decodeEntities(t).replace(/<[^>]+>/g, ' '); if (n === t) break; t = n; }
const text = stripTags(t).replace(/\s+/g, ' ').trim();
console.log('title:', job.title);
console.log('has raw markup:', /<\/?(div|p|li|strong)/i.test(text));
const ss = sentences(text);
console.log('sentences:', ss.length, '| longest:', Math.max(...ss.map((s) => s.length)));
for (const s of ss.filter((s) => /salesforce/i.test(s)).slice(0, 3)) console.log('  •', s.slice(0, 170));
