/**
 * Workstream E — temporal continuity.
 *
 * The store holds 276 snapshots, all retrieved on one day, none with a prior observation.
 * So the honest answer to "has anything changed" is: unanswerable, and it will stay
 * unanswerable until enough calendar time passes. That is not a bug; it is the cost of a
 * detector that was only started at the Phase 3 baseline.
 *
 * What CAN be tested today is the mechanism. Re-observing the same surfaces a few hours
 * later must produce `no_change` almost everywhere. If it instead produces `raw_change`,
 * the normaliser is leaking per-request noise and every future change report would be
 * false. This measures the detector's FALSE-POSITIVE FLOOR — the thing that decides
 * whether a change signal is worth anything at all.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { get, mainContent, stripTags } from '../src/evidence/collect.js';
import { detectChange, loadSnapshots, previousSnapshot, recordSnapshot, type Snapshot } from '../src/temporal/snapshot.js';

const all = loadSnapshots();
const content = all.filter((s) => s.observationType === 'partner_surface_content' && s.sourceHealth === 'ok');
// One surface per company, capped, so this is a stability probe and not a re-crawl.
const seen = new Set<string>();
const targets: Snapshot[] = [];
for (const s of content) { if (!seen.has(s.companyId)) { seen.add(s.companyId); targets.push(s); } }
const SET = targets.slice(0, 40);
console.error(`re-observing ${SET.length} surfaces (1 per company), baseline retrieved ${SET[0]?.retrievedAt}`);

const results: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (i < SET.length) {
    const t = SET[i++];
    try {
      // force:true is mandatory — the HTTP layer caches, and a cached re-read would
      // report `no_change` without anything having been re-observed at all.
      const page = await get(t.sourceUrl, { force: true });
      const ok = page.ok && !!page.body;
      const text = ok ? stripTags(mainContent(page.body!)) : '';
      const next = recordSnapshot({
        companyId: t.companyId, sourceUrl: t.sourceUrl, observationType: t.observationType,
        rawEvidence: text, evidenceState: ok ? t.evidenceState : 'blocked',
        sourceHealth: ok ? 'ok' : page.blocked ? 'blocked' : 'error',
      });
      const prev = previousSnapshot(all, t.companyId, t.sourceUrl, t.observationType);
      const ch = detectChange(prev && prev.id !== next.id ? prev : t, next);
      results.push({ company: t.companyId, url: t.sourceUrl, kind: ch.kind, delta: ch.semanticDelta ?? null, health: next.sourceHealth });
      console.error(`[${results.length}/${SET.length}] ${String(t.companyId).padEnd(22)} ${ch.kind.padEnd(18)} ${ch.semanticDelta ?? ''}`);
    } catch (e) { console.error(`[err] ${t.companyId}: ${(e as Error).message}`); }
  }
}));
writeFileSync(new URL('./out/temporal-recheck.json', import.meta.url).pathname, JSON.stringify(results, null, 2));
const by: Record<string, number> = {};
for (const r of results) by[r.kind] = (by[r.kind] ?? 0) + 1;
console.error(`\nSTABILITY: ${Object.entries(by).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
const noise = (by['raw_change'] ?? 0) + (by['semantic_change'] ?? 0);
console.error(`false-positive floor: ${noise}/${results.length} surfaces differed within hours (${Math.round((noise / Math.max(1, results.length)) * 100)}%)`);
console.error('DONE');
