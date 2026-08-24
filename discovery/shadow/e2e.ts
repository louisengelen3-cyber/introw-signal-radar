/**
 * End-to-end shadow pipeline on a stratified sample (§30, §31, §57).
 *
 * candidate → entity resolution → cheap evidence gate → dossier
 *
 * The cheap gate's verdicts are compared against the ADVERSARIAL HUMAN LABELS from the
 * shadow run, never against its own output (§30). This is the acceptance-gate evidence for
 * §57 items 2 and 4: does entity resolution prevent wrong-company research, and does the
 * competitor/category guard actually run.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { QUERY_FAMILIES } from '../../src/discovery/families.js';
import { assessCheapEvidence, resolveEntity, mayAutoResearch } from '../../src/discovery/candidate.js';
import { findPartnerSurfaces } from '../../src/recovery/surfaces.js';
import { get, mainContent, stripTags } from '../../src/lib/http.js';
import { buildDossier } from '../../src/dossier/build.js';
import { loadKnownCompetitors } from '../../src/category/known-competitors.js';

const d = JSON.parse(readFileSync('discovery/shadow/results.v1.json', 'utf8'));
const famBy = new Map(QUERY_FAMILIES.map((f) => [f.name, f]));

// Stratified: up to 3 per family, spanning labels so the sample is not all easy positives.
const sample: any[] = [];
for (const run of d.runs) {
  const seen = new Set<string>();
  const picks = run.results.filter((r: any) => r.label !== 'DUPLICATE' && !seen.has(r.domain) && seen.add(r.domain));
  const ops = picks.filter((r: any) => r.label === 'VALID_OPERATOR').slice(0, 2);
  const others = picks.filter((r: any) => r.label !== 'VALID_OPERATOR').slice(0, 1);
  for (const r of [...ops, ...others]) sample.push({ ...r, family: run.family, lang: run.lang });
}
console.error(`stratified sample: ${sample.length} candidates across ${d.runs.length} families`);

const known = loadKnownCompetitors();
const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < sample.length) {
    const c = sample[i++];
    const row: any = { domain: c.domain, family: c.family, lang: c.lang, humanLabel: c.label };
    try {
      // 1. entity resolution
      const e = resolveEntity({ probableDomain: c.domain, sourceURL: `https://${c.domain}/`, firstParty: true });
      row.entityConfidence = e.confidence;
      row.autoResearch = mayAutoResearch(e.confidence);

      // 2. cheap evidence — find a partner surface cheaply, read it, run the gate
      const found = await findPartnerSurfaces({ domains: [c.domain], limit: 3, probeFallback: true });
      let text = '', url = `https://${c.domain}/`;
      for (const s of found.surfaces) {
        const r = await get(s.url, { timeout: 20000 });
        if (r.ok && r.body) { const t = stripTags(mainContent(r.body)); if (t.length > 200) { text = t; url = s.url; break; } }
      }
      if (!text) { const r = await get(`https://${c.domain}/`, { timeout: 20000 }); if (r.ok && r.body) text = stripTags(mainContent(r.body)); }
      const cheap = assessCheapEvidence({ text, url, knownCompetitor: known.isKnownCompetitor(c.domain) });
      row.surfacesFound = found.surfaces.length;
      row.cheapVerdict = cheap.verdict;
      row.dropReason = cheap.dropReason;
      row.cheapRationale = cheap.rationale;

      // 3. dossier, only where the gate did not drop
      if (cheap.verdict !== 'drop') {
        const dos = await buildDossier(c.domain, { recovery: true } as never);
        row.dossierState = dos.machineInterpretation.state;
        row.programmes = dos.programmes.map((p: any) => p.kind);
        row.claims = dos.machineInterpretation.diagnostics.distinctClaimCount;
        row.category = dos.category.state;
        row.recoveryAdded = (dos as any).recovery && !(dos as any).recovery.redundant;
        row.reviewable = dos.programmes.length > 0 || dos.machineInterpretation.diagnostics.distinctClaimCount > 0;
      }
      console.error(`[${rows.length + 1}/${sample.length}] ${c.domain.padEnd(28)} ${String(row.humanLabel).padEnd(16)} gate=${String(row.cheapVerdict).padEnd(17)} ${row.dossierState ?? '-'}`);
    } catch (err) { row.error = (err as Error).message; }
    rows.push(row);
  }
}));
writeFileSync('discovery/shadow/out-e2e.json', JSON.stringify(rows, null, 2));
console.error('DONE e2e');
