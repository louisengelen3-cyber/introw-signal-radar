/** Resolve proxy-positive names to domains by first-party verification, per stratum. */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolveNameToDomain, tooGenericToResolve } from '../src/discovery/resolve-name.js';

const harvest: any[] = JSON.parse(readFileSync('phase5/out/B-harvest.json', 'utf8'));
const all = harvest.flatMap((h) => h.mentions ?? []);
/** Already-resolved ones need nothing; only slug names go through resolution. */
const needResolve = all.filter((m: any) => !m.customerDomain);
console.error(`${all.length} mentions, ${all.length - needResolve.length} already have a domain, ${needResolve.length} need resolution`);

const rows: any[] = all.filter((m: any) => m.customerDomain).map((m: any) => ({ ...m, resolvedDomain: m.customerDomain, resolutionBasis: 'outbound_link', evidence: null }));
let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (i < needResolve.length) {
    const m = needResolve[i++];
    if (tooGenericToResolve(m.customerName)) {
      rows.push({ ...m, resolvedDomain: null, resolutionBasis: 'too_generic', evidence: null });
      continue;
    }
    try {
      const r = await resolveNameToDomain(m.customerName, { maxCandidates: 6 });
      rows.push({ ...m, resolvedDomain: r.domain, resolutionBasis: r.basis, evidence: r.evidence });
      if (rows.length % 20 === 0) console.error(`  ${rows.length}/${all.length}`);
    } catch { rows.push({ ...m, resolvedDomain: null, resolutionBasis: 'error', evidence: null }); }
  }
}));
writeFileSync('phase5/out/B-resolved.json', JSON.stringify(rows, null, 2));
const ok = rows.filter((r) => r.resolvedDomain).length;
console.error(`DONE — ${ok}/${rows.length} resolved to a domain (${Math.round(ok / rows.length * 100)}%)`);
for (const seg of ['smb', 'mid_market', 'enterprise']) {
  const s = rows.filter((r) => r.prmSegment === seg);
  const so = s.filter((r) => r.resolvedDomain).length;
  console.error(`  ${seg.padEnd(12)} ${so}/${s.length} resolved`);
}
