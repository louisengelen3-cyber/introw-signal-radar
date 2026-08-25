/**
 * §27: full research on every newly discovered valid operator.
 *
 * No cheap gate. The previous gate could not filter safely, so the mandate's instruction is
 * to spend bounded FULL research on a manageable batch instead of rejecting cheaply and
 * wrongly. Each company gets: partner research (with recovery) → CRM forensics → fit state.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildDossier } from '../../src/dossier/build.js';
import { researchCrm } from '../../src/crm/research.js';
import { assessFit, crmCompatible, type FitEvidence } from '../../src/fit/assess.js';
import { isDecisive } from '../../src/crm/forensics.js';

const targets: any[] = JSON.parse(readFileSync('discovery/batch/to-research.json', 'utf8'));
const NOW = new Date().toISOString();
const rows: any[] = [];
let i = 0;

await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < targets.length) {
    const t = targets[i++];
    const started = Date.now();
    try {
      const d = await buildDossier(t.domain, { recovery: true } as never);
      const fps = (d.systems?.crm?.bundle?.vendors ?? []).flatMap((v: any) =>
        (v.sources ?? []).filter((s: any) => s.kind === 'website_fingerprint')
          .map((s: any) => ({ vendor: v.vendor, quote: s.quote ?? '', sourceUrl: s.sourceUrl ?? `https://${t.domain}/` })));
      const crm = await researchCrm(t.domain, { requestBudget: 40, fingerprints: fps, now: NOW });
      const topCrm = crm.vendors.find((v) => isDecisive(v.level)) ?? crm.vendors[0] ?? null;

      const confirmedSurfaces = (d.surfaces ?? []).filter((s: any) => s.state === 'confirmed').map((s: any) => s.surface);
      const recovered = (d as any).recovery;
      const surfaces = [...confirmedSurfaces, ...(recovered?.addedSurfaces ?? [])];
      const programmes = d.programmes.map((p: any) => p.kind);
      const op = d.operator ?? (d as any).operatorResolution;

      const ev: FitEvidence = {
        programmeOwnership: op?.direction === 'operates' ? 'owned'
          : op?.direction === 'participates' ? 'participant'
          : op?.direction === 'both' ? 'both'
          : programmes.length > 0 ? 'owned' : 'unknown',
        commercialMotion: d.constructs?.find((c: any) => c.construct === 'commercial_materiality')?.state === 'confirmed' ? 'evidenced'
          : programmes.length > 0 ? 'implied' : 'unknown',
        operationalSurfaces: surfaces,
        materiality: d.constructs?.find((c: any) => c.construct === 'commercial_materiality')?.state === 'confirmed' ? 'evidenced' : 'unknown',
        crm: { vendor: topCrm?.vendor ?? null, level: topCrm?.level ?? 'unknown', compatible: crmCompatible(topCrm?.vendor ?? null) },
        peopleObserved: 0,
        contradictions: (d.machineInterpretation?.reasons ?? []).filter((r: string) => /participant|integration[- ]only|affiliate[- ]only|directory/i.test(r)),
        observability: { pagesRead: d.sourceHealth?.filter((h: any) => h.health === 'success').length ?? 0, vacanciesRead: crm.coverage.vacanciesRead, blocked: d.machineInterpretation?.state === 'blocked' },
        category: d.category?.state ?? 'unknown',
        knownCompetitor: d.category?.knownCompetitorList?.onList === true,
        prmInUse: d.systems?.prm?.vendor ?? null,
      };
      const fit = assessFit(ev);

      rows.push({
        domain: t.domain, discoveredVia: t.family, lang: t.lang, geo: t.geo, sector: t.sector,
        discoveryNote: t.note,
        machineState: d.machineInterpretation.state,
        // Persisted for the reliability audit so batch accounts are not structurally
        // less measurable than existing ones.
        prmState: d.systems?.prm?.state ?? 'unknown',
        prmVendor: d.systems?.prm?.vendor ?? null,
        directoryIsDirectory: d.partnerDirectory?.isDirectory === true,
        constructs: (d.constructs ?? []).map((c: any) => ({ construct: c.construct, state: c.state })),
        surfaceStates: (d.surfaces ?? []).map((s: any) => ({ surface: s.surface, state: s.state })),
        pagesOk: (d.sourceHealth ?? []).filter((h: any) => h.health === 'success').length,
        pagesFetched: (d.sourceHealth ?? []).length,
        distinctClaims: d.machineInterpretation.diagnostics.distinctClaimCount,
        category: ev.category,
        programmes, surfaces,
        recoveryAdded: recovered && !recovered.redundant ? (recovered.addedMotions ?? []).concat(recovered.addedSurfaces ?? []) : [],
        crm: {
          vendor: topCrm?.vendor ?? null, level: topCrm?.level ?? 'unknown',
          jobTitle: topCrm?.basis?.jobTitle ?? null, sourceType: topCrm?.basis?.sourceType ?? null,
          publishedAt: topCrm?.basis?.sourcePublishedAt ?? null,
          quote: topCrm?.basis?.quote?.slice(0, 220) ?? null, sourceUrl: topCrm?.basis?.sourceUrl ?? null,
          allVendors: crm.vendors.map((v) => `${v.vendor}/${v.level}`),
          conflict: crm.conflict?.kind ?? null,
          observationDetail: crm.vendors.flatMap((v) => v.observations.map((o) => ({
            vendor: o.vendor, basis: o.languageBasis, sourceType: o.sourceType,
            jobTitle: o.jobTitle, publishedAt: o.sourcePublishedAt, rule: o.rule,
          }))),
        },
        crmCoverage: crm.coverage, familiesObserved: crm.familiesObserved,
        fit: fit.state, fitReasons: fit.reasons, wouldResolve: fit.wouldResolve,
        seconds: Math.round((Date.now() - started) / 1000),
      });
      console.error(`[${rows.length}/${targets.length}] ${t.domain.padEnd(26)} ${fit.state.padEnd(22)} crm=${topCrm ? `${topCrm.vendor}/${topCrm.level}` : '-'} vac=${crm.coverage.vacanciesRead} ${rows[rows.length - 1].seconds}s`);
    } catch (e) {
      rows.push({ domain: t.domain, error: (e as Error).message, geo: t.geo, sector: t.sector, discoveredVia: t.family });
      console.error(`[err] ${t.domain}: ${(e as Error).message}`);
    }
  }
}));
rows.sort((a, b) => a.domain.localeCompare(b.domain));
writeFileSync('discovery/batch/out-research.json', JSON.stringify(rows, null, 2));
console.error(`DONE — ${rows.length}`);
