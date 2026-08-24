import { get } from '../../src/lib/http.js';
import { stripTags } from '../../src/evidence/collect.js';
for (const d of process.argv.slice(2)) {
  let r = await get(`https://www.${d}/`);
  if (!r.ok || !r.body) r = await get(`https://${d}/`);
  const text = r.body ? stripTags(r.body).slice(0, 400) : '';
  console.log(`\n### ${d}  ok=${r.ok} status=${r.status} blocked=${!!r.blocked} bodyLen=${r.body?.length ?? 0}`);
  console.log('  text: ' + (text.replace(/\s+/g, ' ').slice(0, 240) || '(none)'));
}
