import { get, mainContent, stripTags } from '../src/lib/http.js';
import { assessPrm } from '../src/evidence/prm.js';
import { surveyDns } from '../src/evidence/collect.js';

console.log('=== 1. Why is Quatt suppressed? ===');
const dns = await surveyDns('quatt.io', ['partners.quatt.io', 'partner.quatt.io', 'installateur.quatt.io']);
const prm = assessPrm(dns.hosts.filter((h) => h.distinct && !h.nonProd), dns.lookupFailures);
console.log('  PRM detections:', prm.detections.map((d) => `${d.vendor} via ${d.host} -> ${d.cname.join(',')}`).join(' | ') || 'none');

console.log('\n=== 2. Can the Radar reach vaillant.com? ===');
for (const u of ['https://www.vaillant.com/', 'https://vaillant.com/', 'https://www.vaillant.co.uk/']) {
  const r = await get(u, { force: true, timeout: 25000 });
  console.log(`  ${u} -> ok=${r.ok} status=${r.status} blocked=${!!r.blocked} err=${r.error ?? '-'} bytes=${r.body?.length ?? 0}`);
}

console.log('\n=== 3. What is on Quatt partner surfaces? ===');
for (const p of ['/installateur', '/nl/installateur', '/partners', '/zakelijk', '/installateurs']) {
  const r = await get(`https://www.quatt.io${p}`);
  if (!r.ok || !r.body) { console.log(`  ${p} -> ${r.status}`); continue; }
  const t = stripTags(mainContent(r.body));
  console.log(`  ${p} -> ${r.status}, ${t.length} chars: ${t.slice(0, 150).replace(/\s+/g, ' ')}`);
}
