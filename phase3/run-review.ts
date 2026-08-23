/**
 * Minimal commercial review prototype.
 *
 * Not a GTM queue. Its purpose is to test whether a human can efficiently resolve the
 * large plausible / under-observed band, and to measure what that costs — a research
 * engine needing twenty minutes an account may not be commercially worth running.
 *
 * The record is built so a reviewer can decide WITHOUT re-doing the research: every
 * claim carries its quote and its source, and every unknown says how to resolve it.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Assessment } from '../src/pipeline/assess.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

type Row = Assessment & { name: string; population: string; meta: string };
const R = JSON.parse(readFileSync(new URL('./out/positive.json', import.meta.url), 'utf8')) as Row[];

export type ReviewOutcome = 'PROMOTE' | 'KEEP_PLAUSIBLE' | 'RESEARCH' | 'DEMOTE' | 'SUPPRESS';

export interface ReviewRecord {
  domain: string;
  name: string;
  population: string;
  /** Everything the reviewer needs, so the decision does not require re-research. */
  positiveEvidence: { claim: string; quote: string; source: string; proves: string; doesNotProve: string }[];
  negativeEvidence: { claim: string; source: string }[];
  unknowns: string[];
  programmeOwnership: string;
  channelClass: string;
  prm: string | null;
  evidenceDensity: string;
  /** Raised when the account looks like the customers the system historically missed. */
  customerMissRisk: string | null;
  researchTasks: { field: string; reason: string; method: string }[];
  machineSuggestion: ReviewOutcome;
  /** How many distinct sources a reviewer must open to check the machine's claims. */
  sourcesToVerify: number;
}

function suggest(r: Row): ReviewOutcome {
  if (r.classification?.suppression) return 'SUPPRESS';
  if (r.dns.platform?.vendor === 'introw') return 'SUPPRESS';
  switch (r.promotion?.state) {
    case 'high_fit': return 'PROMOTE';
    case 'plausible': return 'KEEP_PLAUSIBLE';
    case 'under_observed': return 'RESEARCH';
    default: return 'DEMOTE';
  }
}

/**
 * The failure mode this flags is the one Phase 3 measured: customers whose partner motion
 * is real and plainly described, but who publish none of the formal channel artefacts the
 * earlier lexicon required. Demoting those silently is how the system lost its own ICP.
 */
function missRisk(r: Row): string | null {
  const p = r.positive;
  if (!p) return null;
  const ownershipOk = p.ownership === 'direct' || p.ownership === 'mixed';
  if (ownershipOk && p.surface === 'unknown') {
    return 'Runs its own partner motion but publishes no formal channel artefacts. This is the profile of the customers the earlier model missed — do not demote on thin surface alone.';
  }
  if (p.evidenceDensity === 'sparse' && ownershipOk) {
    return 'Sparse publication with real ownership evidence. Under-observed rather than poor fit.';
  }
  return null;
}

const records: ReviewRecord[] = R.map((r) => {
  const pos = (r.positive?.observations ?? []).filter((o) => o.construct !== 'surface');
  const sources = new Set([...pos.map((o) => o.sourceUrl), ...(r.suitability?.negative ?? []).map((n) => n.sourceUrl)]);
  return {
    domain: r.domain, name: r.name, population: r.population,
    positiveEvidence: pos.map((o) => ({ claim: o.probe, quote: o.quote, source: o.sourceUrl, proves: o.proves, doesNotProve: o.doesNotProve })),
    negativeEvidence: (r.suitability?.negative ?? []).map((n) => ({ claim: n.claim, source: n.sourceUrl })),
    unknowns: r.suitability?.unknowns ?? [],
    programmeOwnership: r.operator?.direction ?? 'unknown',
    channelClass: r.classification?.commerciality ?? 'unknown',
    prm: r.dns.platform?.vendor ?? null,
    evidenceDensity: r.positive?.evidenceDensity ?? 'none',
    customerMissRisk: missRisk(r),
    researchTasks: r.suitability?.researchNeeded ?? [],
    machineSuggestion: suggest(r),
    sourcesToVerify: sources.size,
  };
});

writeFileSync(`${OUT}review-records.json`, JSON.stringify(records, null, 2));

const byOutcome: Record<string, number> = {};
for (const rec of records) byOutcome[rec.machineSuggestion] = (byOutcome[rec.machineSuggestion] ?? 0) + 1;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const median = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };

console.log('# Commercial review prototype\n');
console.log(`records: ${records.length}`);
console.log(`machine suggestion: ${Object.entries(byOutcome).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
console.log();
console.log('## Reviewer workload per record');
console.log(`- median sources to verify: ${median(records.map((r) => r.sourcesToVerify))}`);
console.log(`- mean sources to verify:   ${mean(records.map((r) => r.sourcesToVerify)).toFixed(1)}`);
console.log(`- records with zero evidence to check (nothing to verify): ${records.filter((r) => r.sourcesToVerify === 0).length}`);
console.log(`- records carrying an explicit research task: ${records.filter((r) => r.researchTasks.length > 0).length}`);
console.log(`- records flagged as customer-miss risk: ${records.filter((r) => r.customerMissRisk).length}`);
console.log();
console.log('## The band a human must resolve');
const band = records.filter((r) => ['KEEP_PLAUSIBLE', 'RESEARCH'].includes(r.machineSuggestion));
console.log(`- ${band.length} of ${records.length} records land in plausible/research`);
console.log(`- of those, ${band.filter((r) => r.positiveEvidence.length > 0).length} already carry named positive evidence to judge from`);
console.log(`- ${band.filter((r) => r.positiveEvidence.length === 0).length} carry none, and require research from scratch`);
