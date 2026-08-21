/**
 * Phase 1A — discovery half.
 *
 * Question: without being handed a domain list, can we produce a candidate universe
 * of companies with channel motion? Measures per mechanism: yield, resolvability,
 * segment diversity, language/geography spread, and overlap with the frozen benchmark.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import {
  DISTRIBUTOR_SEEDS, harvestDistributor, harvestPartnerDirectory, harvestPlatformTenants,
  resolveDomain, type Candidate,
} from '../src/discovery/mechanisms.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const args = new Set(process.argv.slice(2));
const RESOLVE_LIMIT = Number(process.env.RESOLVE_LIMIT ?? 60);

interface MechanismResult {
  mechanism: string;
  ok: boolean;
  candidateCount: number;
  candidates: Candidate[];
  notes: string[];
}

const results: MechanismResult[] = [];

/* ── M1 · distributor inversion ─────────────────────────────────────────── */
if (!args.size || args.has('m1')) {
  for (const seed of DISTRIBUTOR_SEEDS) {
    const { candidates, retrieval, ok } = await harvestDistributor(seed);
    results.push({
      mechanism: `distributor_inversion:${seed.id}`,
      ok,
      candidateCount: candidates.length,
      candidates,
      notes: [`segment=${seed.segment}`, `country=${seed.country}`, `lang=${seed.lang}`, `http=${retrieval.httpStatus}`],
    });
    console.error(`M1 ${seed.id.padEnd(22)} ok=${ok} candidates=${candidates.length}`);
  }
}

/* ── M2 · partner-directory harvest ─────────────────────────────────────── */
// Seeded from directories Phase 0 located. Owner domain is passed so the vendor's
// own hosts are excluded from its partner list.
const DIRECTORY_SEEDS: [string, string][] = [
  ['https://partnerlisting.corp.cumulocity.com/', 'cumulocity.com'],
  ['https://www.egnyte.com/partners', 'egnyte.com'],
  ['https://www.sharegate.com/partners', 'sharegate.com'],
];
if (!args.size || args.has('m2')) {
  for (const [url, owner] of DIRECTORY_SEEDS) {
    const { candidates, ok } = await harvestPartnerDirectory(url, owner);
    results.push({
      mechanism: `partner_directory_harvest:${owner}`,
      ok, candidateCount: candidates.length, candidates,
      notes: [`owner=${owner}`],
    });
    console.error(`M2 ${owner.padEnd(22)} ok=${ok} candidates=${candidates.length}`);
  }
}

/* ── M3 · platform tenancy ──────────────────────────────────────────────── */
if (!args.size || args.has('m3')) {
  for (const vendor of ['introw.io', 'magentrix.com', 'partnerstack.com', 'allbound.com', 'impartner.com', 'kiflo.com']) {
    const candidates = await harvestPlatformTenants(vendor);
    results.push({
      mechanism: `platform_tenancy:${vendor}`,
      ok: true, candidateCount: candidates.length, candidates, notes: [],
    });
    console.error(`M3 ${vendor.padEnd(22)} candidates=${candidates.length}`);
  }
}

/* ── entity resolution, sampled ─────────────────────────────────────────── */
// Resolution is the measured error source, so it is sampled and reported rather
// than run silently across everything.
const unresolved = results.flatMap((r) => r.candidates.filter((c) => !c.domain));
const sample = unresolved
  .filter((_, i) => i % Math.max(1, Math.floor(unresolved.length / RESOLVE_LIMIT)) === 0)
  .slice(0, RESOLVE_LIMIT);

const resolutions: { name: string; mechanism: string; hint: string; state: string; domain: string | null; method: string }[] = [];
if (!args.size || args.has('resolve')) {
  let i = 0;
  const CONC = 5;
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (i < sample.length) {
      const c = sample[i++];
      const res = await resolveDomain(c.name, c.source.url);
      resolutions.push({ name: c.name, mechanism: c.mechanism, hint: c.source.url, state: res.state, domain: res.domain, method: res.method });
      if (resolutions.length % 10 === 0) console.error(`  resolved ${resolutions.length}/${sample.length}`);
    }
  }));
}

/* ── benchmark overlap ──────────────────────────────────────────────────── */
const cohorts = JSON.parse(readFileSync(new URL('../phase0/benchmark/cohorts.v1.json', import.meta.url), 'utf8')) as Record<string, { name: string; domain: string }[]>;
const benchDomains = new Set<string>();
const benchNames = new Map<string, string>();
for (const k of ['cohortA', 'cohortB', 'cohortC']) {
  for (const c of cohorts[k]) { benchDomains.add(c.domain); benchNames.set(c.name.toLowerCase(), c.domain); }
}
const allCandidates = results.flatMap((r) => r.candidates);
const hitsByDomain = allCandidates.filter((c) => c.domain && benchDomains.has(c.domain.replace(/^www\./, '')));
const hitsByName = allCandidates.filter((c) => benchNames.has(c.name.toLowerCase().trim()));
const resolvedHits = resolutions.filter((r) => r.domain && benchDomains.has(r.domain));

console.error(`\nbenchmark overlap: byDomain=${hitsByDomain.length} byName=${hitsByName.length} viaResolution=${resolvedHits.length}`);
console.error(`  ${[...new Set([...hitsByDomain.map((h) => h.domain), ...hitsByName.map((h) => benchNames.get(h.name.toLowerCase().trim())), ...resolvedHits.map((r) => r.domain)])].join(', ')}`);

writeFileSync(`${OUT}discovery.v1.json`, JSON.stringify({
  runAt: new Date().toISOString(),
  results: results.map((r) => ({ ...r, candidates: r.candidates.slice(0, 1200) })),
  resolutions,
  benchmarkOverlap: {
    byDomain: hitsByDomain.map((h) => ({ name: h.name, domain: h.domain, mechanism: h.mechanism })),
    byName: hitsByName.map((h) => ({ name: h.name, domain: benchNames.get(h.name.toLowerCase().trim()), mechanism: h.mechanism })),
    viaResolution: resolvedHits,
  },
}, null, 2));
console.error(`wrote ${OUT}discovery.v1.json`);
