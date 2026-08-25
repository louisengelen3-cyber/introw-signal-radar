/**
 * B's real question: across proxy positives versus matched companies that have a partner page
 * and no PRM evidence, which public features actually separate PRM buyers from non-buyers?
 * Runs the three existing constructs plus first-person recruitment. Stratified, never pooled.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildDossier } from '../src/dossier/build.js';
import { detectInformalProgramme } from '../src/dossier/informal.js';
import { findPartnerSurfaces } from '../src/recovery/surfaces.js';
import { get, mainContent, stripTags } from '../src/lib/http.js';
import { loadKnownCompetitors } from '../src/category/known-competitors.js';

const resolved: any[] = JSON.parse(readFileSync('phase5/out/B-resolved.json', 'utf8'));
const known = loadKnownCompetitors();

/** Stratified, deterministic, bounded: all SMB, then mid-market, then enterprise. */
const byStratum = (s: string, n: number) => {
  const seen = new Set<string>();
  return resolved.filter((r) => r.prmSegment === s && r.resolvedDomain)
    .filter((r) => !seen.has(r.resolvedDomain) && seen.add(r.resolvedDomain))
    .sort((a, b) => a.resolvedDomain.localeCompare(b.resolvedDomain)).slice(0, n);
};
const targets = [...byStratum('smb', 19), ...byStratum('mid_market', 18), ...byStratum('enterprise', 8)];
console.error(`${targets.length} proxy positives (stratified)`);

const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < targets.length) {
    const t = targets[i++];
    const d = t.resolvedDomain;
    try {
      const dos = await buildDossier(d, { recovery: true } as never);
      const found = await findPartnerSurfaces({ domains: [d], limit: 6, probeFallback: true });
      const pages: { url: string; text: string }[] = [];
      for (const s of found.surfaces) {
        const r = await get(s.url, { timeout: 15000 });
        if (!r.ok || !r.body) continue;
        const tx = stripTags(mainContent(r.body));
        if (tx.length > 150) pages.push({ url: s.url, text: tx });
      }
      const inf = detectInformalProgramme({ pages, category: dos.category?.state ?? 'unknown', onKnownCompetitorList: known.isKnownCompetitor(d) });
      const c = (n: string) => dos.constructs?.find((x: any) => x.construct === n)?.state ?? 'unknown';
      rows.push({
        domain: d, name: t.customerName, prmVendor: t.prmVendor, stratum: t.prmSegment,
        cohort: 'proxy_positive',
        materiality: c('commercial_materiality'), ownership: c('operational_ownership'), surface: c('operational_surface'),
        programmes: dos.programmes.map((p: any) => p.kind),
        motion: dos.programmes.length > 0,
        informal: inf.verdict, recruitmentHits: inf.recruitmentHits,
        types: inf.partnerTypesNamed, artefacts: inf.formalArtefacts,
        category: dos.category?.state, state: dos.machineInterpretation.state,
        claims: dos.machineInterpretation.diagnostics.distinctClaimCount,
      });
      console.error(`[${rows.length}/${targets.length}] ${d.padEnd(26)} ${t.prmSegment.padEnd(11)} ${rows[rows.length - 1].informal.padEnd(22)} motion=${rows[rows.length - 1].motion ? 'Y' : 'n'}`);
    } catch (e) { rows.push({ domain: d, stratum: t.prmSegment, cohort: 'proxy_positive', error: (e as Error).message }); }
  }
}));
writeFileSync('phase5/out/B-features.json', JSON.stringify(rows, null, 2));
console.error(`DONE — ${rows.length}`);
