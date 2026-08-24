/** Phase A — does multi-domain resolution reach the surfaces the baseline missed? */
import { resolveDomains, selectForResearch } from '../src/recovery/domains.js';
import { discoverHosts } from '../src/evidence/collect.js';

const TARGETS = ['vaillant.com', 'fronius.com', 'quatt.io', 'personio.com', 'balluff.com', 'turck.com', 'somfy.com', 'niko.eu', 'contentful.com', 'barco.com'];

for (const d of TARGETS) {
  const { hosts } = await discoverHosts(d).catch(() => ({ hosts: [] as string[] }));
  const res = await resolveDomains(d, { probeBudget: 6, knownHosts: hosts });
  const chosen = selectForResearch(res, 3);
  console.log(`\n${d}  (${res.related.length} related found, ${hosts.length} DNS hosts)`);
  if (!res.related.length) console.log('   none');
  for (const r of chosen) console.log(`   -> ${r.domain.padEnd(34)} ${r.basis.padEnd(16)} ${r.confidence.padEnd(7)} ${[r.language, r.region].filter(Boolean).join('-') || ''}`);
  const rest = res.related.length - chosen.length;
  if (rest > 0) console.log(`   (+${rest} more not selected)`);
}
