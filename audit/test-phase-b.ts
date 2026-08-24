/** Phase A+B on the regression cases the baseline missed. */
import { resolveDomains, selectForResearch } from '../src/recovery/domains.js';
import { findPartnerSurfaces } from '../src/recovery/surfaces.js';
import { discoverHosts } from '../src/evidence/collect.js';

const TARGETS = process.argv.slice(2).length ? process.argv.slice(2)
  : ['vaillant.com', 'fronius.com', 'quatt.io', 'niko.eu', 'sma.de', 'somfy.com'];

for (const d of TARGETS) {
  const { hosts } = await discoverHosts(d).catch(() => ({ hosts: [] as string[] }));
  const res = await resolveDomains(d, { probeBudget: 6, knownHosts: hosts });
  const domains = [d, ...selectForResearch(res, 2).map((r) => r.domain)];
  const found = await findPartnerSurfaces({ domains, limit: 14 });
  console.log(`\n${d}   domains searched: ${domains.join(', ')}`);
  console.log(`   surfaces: ${found.surfaces.length}  (sitemap fetches ${found.sitemapChecked}, soft-404s rejected ${found.softNotFound})`);
  const byOrigin: Record<string, number> = {};
  for (const s of found.surfaces) byOrigin[s.origin] = (byOrigin[s.origin] ?? 0) + 1;
  console.log(`   by origin: ${Object.entries(byOrigin).map(([k, v]) => `${k}=${v}`).join(' ') || 'none'}`);
  for (const s of found.surfaces.slice(0, 6)) console.log(`     [${s.matched}] ${s.url.slice(0, 96)}`);
}
