/**
 * Run the CURRENT pipeline, unchanged, against the frozen cross-industry benchmark.
 *
 * Nothing here tunes, patches or improves any detector. Output goes to audit/out only —
 * production data in product/out is never touched.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { buildDossier } from '../src/dossier/build.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const set = JSON.parse(readFileSync(new URL('./cross-industry.v1.json', import.meta.url).pathname, 'utf8'));

const targets: { domain: string; cohort: string; country: string; note?: string }[] = [];
for (const [cohort, list] of Object.entries(set.cohorts) as [string, any[]][]) {
  for (const c of list) targets.push({ cohort, ...c });
}

const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (i < targets.length) {
    const t = targets[i++];
    const started = Date.now();
    try {
      // `jobs: true` so ATS reach can be measured by sector, as the mandate asks. Job
      // evidence never feeds discovery or the machine interpretation.
      const d = await buildDossier(t.domain, { jobs: true });
      const surfaces = (d.surfaces ?? []).filter((s) => s.state === 'confirmed');
      rows.push({
        cohort: t.cohort, country: t.country, note: t.note, domain: t.domain,
        reachable: d.sourceHealth.some((h) => h.health === 'success'),
        machineState: d.machineInterpretation.state,
        category: d.category.state,
        coverage: d.evidenceCoverage,
        distinctClaims: d.machineInterpretation.diagnostics.distinctClaimCount,
        observations: d.machineInterpretation.diagnostics.observationCount,
        independentSources: d.machineInterpretation.diagnostics.independentSourceCount,
        programmes: [...new Set(d.programmes.map((p) => p.kind))],
        surfacesConfirmed: surfaces.map((s) => s.surface),
        materiality: d.constructs.find((c) => c.construct === 'commercial_materiality')?.state,
        ownership: d.constructs.find((c) => c.construct === 'operational_ownership')?.state,
        surfaceState: d.constructs.find((c) => c.construct === 'operational_surface')?.state,
        directory: d.partnerDirectory.isDirectory ? d.partnerDirectory.lowerBound : null,
        crm: d.systems.crm.state,
        crmLevel: d.systems.crm.bundle?.vendors[0]?.level ?? null,
        prm: d.systems.prm.state,
        people: d.people.state,
        atsBoard: d.jobEvidence?.tenants[0]?.vendor ?? null,
        vacancies: d.jobEvidence?.vacanciesUsed ?? 0,
        jobFacts: d.jobEvidence?.operationalHits.length ?? 0,
        partnerPathsChecked: d.sourceHealth.filter((h) => /partner|reseller|agenc|partenaires|channel/i.test(h.url)).length,
        partnerPathsFound: d.sourceHealth.filter((h) => /partner|reseller|agenc|partenaires|channel/i.test(h.url) && h.health === 'success').length,
        pagesRead: d.sourceHealth.filter((h) => h.health === 'success').length,
        selfDescription: d.selfDescription?.text.slice(0, 120) ?? null,
        seconds: Math.round((Date.now() - started) / 1000),
      });
      writeFileSync(`${OUT}cross-industry.json`, JSON.stringify(rows, null, 2));
      const r = rows.at(-1)!;
      console.error(`[${rows.length}/${targets.length}] ${t.cohort.slice(0, 16).padEnd(17)} ${t.domain.padEnd(24)} ${r.machineState.padEnd(20)} claims=${String(r.distinctClaims).padEnd(3)} progs=${r.programmes.length} crm=${r.crm.replace('_confirmed','').padEnd(10)} jobs=${r.vacancies}`);
    } catch (e) { console.error(`[err] ${t.domain}: ${(e as Error).message}`); }
  }
}));
console.error('DONE');
