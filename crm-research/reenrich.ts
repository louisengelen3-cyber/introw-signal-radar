/**
 * §26: re-enrich every existing production dossier with the CRM forensic layer.
 *
 * Existing evidence is RETAINED — the previous CRM state and its sources are carried into the
 * output so the report can show what changed and why, rather than silently overwriting.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { researchCrm } from '../src/crm/research.js';

const dossiers: any[] = JSON.parse(readFileSync('product/out/dossiers.json', 'utf8'));
const NOW = new Date().toISOString();
const rows: any[] = [];
let i = 0;

await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < dossiers.length) {
    const d = dossiers[i++];
    const started = Date.now();
    try {
      // Carry the existing fingerprint evidence in as supporting observations (§20, §26).
      /**
       * Carry every existing website fingerprint forward (§26: do not delete old evidence).
       * They enter as SUPPORTING, never confirming (§20) — the previous model levelled a
       * HubSpot tracking script as `crm_confirmed` while its own doesNotProve line said the
       * script proves nothing about the CRM of record. Retaining the evidence at the level it
       * actually supports is a correction, not a loss.
       */
      const fps: { vendor: string; quote: string; sourceUrl: string }[] = [];
      const crm = d.systems?.crm;
      for (const v of crm?.bundle?.vendors ?? []) {
        for (const src of v.sources ?? []) {
          if (src.kind === 'website_fingerprint') {
            fps.push({ vendor: v.vendor, quote: src.quote ?? '', sourceUrl: src.sourceUrl ?? `https://${d.domain}/` });
          }
        }
      }
      const r = await researchCrm(d.domain, { requestBudget: 45, fingerprints: fps, now: NOW });
      rows.push({
        domain: d.domain,
        previousCrmState: crm?.state ?? 'unknown',
        previousVendor: crm?.bundle?.primary?.vendor ?? null,
        previousFingerprints: fps.length,
        vendors: r.vendors.map((v) => ({
          vendor: v.vendor, level: v.level, rationale: v.rationale,
          jobTitle: v.basis?.jobTitle ?? null, sourceType: v.basis?.sourceType ?? null,
          publishedAt: v.basis?.sourcePublishedAt ?? null,
          quote: v.basis?.quote?.slice(0, 240) ?? null, sourceUrl: v.basis?.sourceUrl ?? null,
          timeline: v.timeline,
        })),
        conflict: r.conflict,
        // Measurement instrumentation for the reliability audit: every observation's basis,
        // source class and role, so the CRM funnel is derived rather than estimated.
        observationDetail: r.vendors.flatMap((v) => v.observations.map((o) => ({
          vendor: o.vendor, basis: o.languageBasis, sourceType: o.sourceType,
          jobTitle: o.jobTitle, publishedAt: o.sourcePublishedAt, rule: o.rule,
        }))),
        coverage: r.coverage,
        budget: r.budget,
        familiesObserved: r.familiesObserved,
        fromNonPartnerRoles: r.fromNonPartnerRoles,
        fromHistorical: r.fromHistorical,
        note: r.note,
        seconds: Math.round((Date.now() - started) / 1000),
      });
      const top = r.vendors[0];
      console.error(`[${rows.length}/${dossiers.length}] ${d.domain.padEnd(22)} was=${String(crm?.state ?? 'unknown').padEnd(20)} now=${top ? `${top.vendor}/${top.level}` : 'unknown'} vac=${r.coverage.vacanciesRead} ats=${r.coverage.atsBoardFound ? 'Y' : 'n'} ${rows[rows.length - 1].seconds}s`);
    } catch (e) {
      rows.push({ domain: d.domain, error: (e as Error).message });
      console.error(`[err] ${d.domain}: ${(e as Error).message}`);
    }
  }
}));
rows.sort((a, b) => a.domain.localeCompare(b.domain));
writeFileSync('crm-research/out/existing.json', JSON.stringify(rows, null, 2));
console.error(`DONE — ${rows.length} accounts`);
