/**
 * Build dossiers for a list of domains and write them to product/out/dossiers/.
 * Usage: tsx product/build-dossiers.ts <corpus.json|domain> [...]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { buildDossier } from '../src/dossier/build.js';

const OUT = new URL('./out/dossiers/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const args = process.argv.slice(2).filter((a) => a !== '--jobs' && a !== '--recovery');
/** Opt-in enrichment from the company's own job adverts. Off unless asked for. */
const useJobs = process.argv.includes('--jobs');
/**
 * Additive recovery sources. Runs only where base research left evidence partial or
 * under-observed, so well-observed accounts cost nothing extra. Never replaces base research.
 */
const useRecovery = process.argv.includes('--recovery');
let targets: { domain: string; name?: string }[] = [];
for (const a of args) {
  if (a.endsWith('.json')) {
    const j = JSON.parse(readFileSync(a, 'utf8'));
    const list = j.companies ?? [];
    targets.push(...list.map((c: any) => ({ domain: c.domain, name: c.name })));
  } else targets.push({ domain: a });
}

const all: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < targets.length) {
    const t = targets[i++];
    const started = Date.now();
    try {
      const d = await buildDossier(t.domain, { name: t.name, jobs: useJobs, recovery: useRecovery });
      writeFileSync(`${OUT}${t.domain.replace(/[^a-z0-9.]/gi, '_')}.json`, JSON.stringify(d, null, 2));
      all.push(d);
      console.error(
        `[${all.length}/${targets.length}] ${t.domain.padEnd(24)} ${d.machineInterpretation.state.padEnd(20)} ` +
        `cat=${d.category.state.padEnd(24)} claims=${String(d.machineInterpretation.diagnostics.distinctClaimCount).padEnd(3)}/` +
        `${String(d.machineInterpretation.diagnostics.observationCount).padEnd(3)} progs=${d.programmes.length} ` +
        `surf=${d.surfaces?.filter((s) => s.state === 'confirmed').length ?? 0} ` +
        `crm=${d.systems.crm.state.replace('_confirmed', '').padEnd(10)} ` +
        `jobs=${d.jobEvidence ? `${d.jobEvidence.vacanciesUsed}v/${d.jobEvidence.operationalHits.length}f` : '-'} ` +
        `rec=${d.recovery ? (d.recovery.redundant ? 'ran' : `+${d.recovery.addedMotions.length + d.recovery.addedSurfaces.length}`) : '-'} ` +
        `${Math.round((Date.now() - started) / 1000)}s`,
      );
    } catch (e) { console.error(`[err] ${t.domain}: ${(e as Error).message}`); }
  }
}));
// Merge with anything already collected: each run adds or refreshes accounts rather than
// replacing the dataset, so the app always shows every company researched so far.
const INDEX = new URL('./out/dossiers.json', import.meta.url).pathname;
let existing: any[] = [];
try { existing = JSON.parse(readFileSync(INDEX, 'utf8')); } catch { /* first run */ }
const merged = new Map<string, any>(existing.map((d) => [d.domain, d]));
for (const d of all) merged.set(d.domain, d);
writeFileSync(INDEX, JSON.stringify([...merged.values()], null, 2));
console.error(`\nwrote ${all.length} dossiers (${merged.size} total in index)`);
