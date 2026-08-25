/**
 * Workstream C validation. Three cohorts, all frozen before the detector was written:
 *   positives  — the 4 recovered customers the pipeline lost to under_observed
 *   negatives  — the 14 clean negatives from phase3/benchmark/controls.v1.json
 *   guard      — partner-tech vendors, where partner language is product copy
 * Success is stated in advance: fires on the four, fires on zero clean negatives, promotes
 * zero partner-tech vendors.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { get, mainContent, stripTags } from '../src/lib/http.js';
import { findPartnerSurfaces } from '../src/recovery/surfaces.js';
import { detectInformalProgramme } from '../src/dossier/informal.js';
import { classifyCategory } from '../src/category/classify.js';
import { collectPositioning } from '../src/evidence/positioning.js';
import { loadKnownCompetitors } from '../src/category/known-competitors.js';

const controls = JSON.parse(readFileSync('phase3/benchmark/controls.v1.json', 'utf8'));
const COHORTS: [string, string[]][] = [
  ['positive_recovered_customer', ['ringover.com', 'xelix.com', 'zenity.io', 'payflip.be']],
  ['clean_negative', controls.cleanNegatives.map((c: any) => c.domain)],
  ['partner_tech_guard', ['magentrix.com', 'mindmatrix.net', 'ziftsolutions.com', 'kiflo.com', 'partnerstack.com']],
  /**
   * The informative comparison (methodology): companies matched to the positives on sector,
   * geography and scale, with no label either way. Never inspected while the detector was
   * being written. Rejecting professional-services firms proves little; this cohort is the
   * one that can actually embarrass the detector.
   */
  ['matched_unlabelled', controls.matchedUnlabelled.map((c: any) => c.domain)],
];

const known = loadKnownCompetitors();
const rows: any[] = [];
for (const [cohort, domains] of COHORTS) {
  let i = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (i < domains.length) {
      const d = domains[i++];
      try {
        const found = await findPartnerSurfaces({ domains: [d], limit: 6, probeFallback: true });
        const pages: { url: string; text: string }[] = [];
        for (const s of found.surfaces) {
          const r = await get(s.url, { timeout: 18000 });
          if (!r.ok || !r.body) continue;
          const text = stripTags(mainContent(r.body));
          if (text.length > 150) pages.push({ url: s.url, text });
        }
        const positioning = await collectPositioning(d);
        const cat = classifyCategory(d, positioning, known);
        const f = detectInformalProgramme({ pages, category: cat.state, onKnownCompetitorList: known.isKnownCompetitor(d) });
        rows.push({
          cohort, domain: d, verdict: f.verdict, category: cat.state,
          recruitmentHits: f.recruitmentHits, types: f.partnerTypesNamed, artefacts: f.formalArtefacts,
          pagesRead: pages.length, rationale: f.rationale,
          quote: f.evidence.find((e) => e.kind === 'recruitment')?.quote?.slice(0, 180) ?? null,
        });
        const r = rows[rows.length - 1];
        console.error(`${cohort.padEnd(28)} ${d.padEnd(22)} ${r.verdict.padEnd(24)} pages=${r.pagesRead} types=${r.types.length} artefacts=${r.artefacts.length}`);
      } catch (e) {
        rows.push({ cohort, domain: d, error: (e as Error).message, verdict: 'error' });
        console.error(`[err] ${d}: ${(e as Error).message}`);
      }
    }
  }));
}
writeFileSync('phase5/out/C-validation.json', JSON.stringify(rows, null, 2));
const fires = (c: string) => rows.filter((r) => r.cohort === c && r.verdict === 'informal_programme').length;
const n = (c: string) => rows.filter((r) => r.cohort === c).length;
console.error(`\nfires on positives          : ${fires('positive_recovered_customer')}/${n('positive_recovered_customer')}`);
console.error(`fires on clean negatives    : ${fires('clean_negative')}/${n('clean_negative')}`);
console.error(`fires on partner-tech guard : ${fires('partner_tech_guard')}/${n('partner_tech_guard')}`);
console.error(`fires on matched unlabelled : ${fires('matched_unlabelled')}/${n('matched_unlabelled')}`);
