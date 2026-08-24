/**
 * Recovery holdout runner (mandate §32). Two arms over the SAME frozen 32 companies:
 *
 *   base   — production buildDossier exactly as it ships today
 *   union  — production PLUS the additive recovery source layer
 *
 * Arms are written to separate files so neither can overwrite the other, and the union arm
 * never replaces base evidence (§14 invariant): it can only add.
 *
 * Usage: tsx recovery-holdout/run.ts base|union
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildDossier } from '../src/dossier/build.js';

const arm = (process.argv[2] ?? 'base') as 'base' | 'union';
if (!['base', 'union'].includes(arm)) throw new Error('arm must be base|union');
const bench = JSON.parse(readFileSync('recovery-holdout/holdout.v1.json', 'utf8'));
const targets: any[] = bench.companies;
mkdirSync('recovery-holdout/out', { recursive: true });

const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < targets.length) {
    const t = targets[i++];
    const started = Date.now();
    try {
      const d = await buildDossier(t.domain, { recovery: arm === 'union' } as never);
      const confirmed = (d.surfaces ?? []).filter((s: any) => s.state === 'confirmed');
      rows.push({
        domain: t.domain, cohort: t.cohort, sectorClass: t.sectorClass, country: t.country,
        state: d.machineInterpretation.state,
        programmes: d.programmes.map((p: any) => p.kind ?? p.type ?? p),
        surfaces: confirmed.map((s: any) => s.kind ?? s.type),
        directory: d.directory?.isDirectory ? (d.directory.lowerBound ?? true) : null,
        directoryType: d.directory?.directoryType ?? null,
        materiality: d.constructs?.commercialMateriality?.state ?? null,
        ownership: d.constructs?.operationalOwnership?.state ?? null,
        surfaceState: d.constructs?.operationalSurface?.state ?? null,
        distinctClaims: d.machineInterpretation.diagnostics.distinctClaimCount,
        observations: d.machineInterpretation.diagnostics.observationCount,
        pagesRead: d.provenance?.pagesRead ?? d.machineInterpretation.diagnostics.pagesRead ?? null,
        recovery: (d as any).recovery ?? null,
        seconds: Math.round((Date.now() - started) / 1000),
      });
      const r = rows[rows.length - 1];
      console.error(`[${rows.length}/${targets.length}] ${arm} ${t.domain.padEnd(26)} ${String(r.state).padEnd(18)} progs=${r.programmes.length} surf=${r.surfaces.length} dir=${r.directoryType ?? '-'} claims=${r.distinctClaims} ${r.seconds}s`);
    } catch (e) {
      rows.push({ domain: t.domain, cohort: t.cohort, sectorClass: t.sectorClass, country: t.country, error: (e as Error).message });
      console.error(`[err] ${t.domain}: ${(e as Error).message}`);
    }
  }
}));
rows.sort((a, b) => a.domain.localeCompare(b.domain));
writeFileSync(`recovery-holdout/out/${arm}.json`, JSON.stringify(rows, null, 2));
console.error(`DONE ${arm} — ${rows.length} rows`);
