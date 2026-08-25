/**
 * Part 22 — freeze the manual-research comparison sample BEFORE any deeper research.
 *
 * The 25 Aug audit chose its six accounts after the Radar's output was already known, which
 * is exactly the selection freedom the mandate removes. This picks deterministically from the
 * researched population, captures what the Radar currently says about each, and writes it
 * once. Nothing may be tuned against these accounts afterwards.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const audit: any[] = JSON.parse(readFileSync('audit/out/introw-radar-reliability-audit.json', 'utf8'));
const bfeat: any[] = JSON.parse(readFileSync('phase5/out/B-features.json', 'utf8')).filter((r) => !r.error);
const amot: any[] = JSON.parse(readFileSync('phase5/out/A-motion.json', 'utf8')).filter((r) => !r.error);

/** Deterministic pick: alphabetical within each stratum, first n. No judgement. */
const pick = (rows: any[], n: number) => [...rows].sort((a, b) => a.domain.localeCompare(b.domain)).slice(0, n);

const strata: { stratum: string; rows: any[] }[] = [
  { stratum: 'plausible_fit', rows: pick(audit.filter((r) => r.introw_relevance_state === 'plausible_introw_fit'), 2) },
  { stratum: 'under_observed', rows: pick(audit.filter((r) => r.evidence_sufficiency === 'under_observed'), 2) },
  { stratum: 'software_established', rows: pick(audit.filter((r) => r.sector === 'software' && r.partner_motion_state === 'established'), 2) },
  { stratum: 'physical_manufacturing', rows: pick(audit.filter((r) => (r.sector === 'manufacturing' || r.sector === 'industrial' || r.sector === 'iot_hardware')), 2) },
  { stratum: 'usa', rows: pick(audit.filter((r) => /^US/.test(r.region ?? '')), 1) },
  { stratum: 'europe_non_english', rows: pick(audit.filter((r) => ['DACH', 'FR', 'IT', 'Benelux', 'Nordics'].includes(r.region ?? '')), 2) },
  { stratum: 'proxy_positive_smb', rows: pick(bfeat.filter((r) => r.stratum === 'smb'), 2) },
  { stratum: 'inversion_surfaced', rows: pick(amot.filter((r) => r.motion), 2) },
];

const seen = new Set<string>();
const sample: any[] = [];
for (const s of strata) {
  for (const r of s.rows) {
    if (seen.has(r.domain)) continue;
    seen.add(r.domain);
    const a = audit.find((x) => x.domain === r.domain);
    const b = bfeat.find((x) => x.domain === r.domain);
    const m = amot.find((x) => x.domain === r.domain);
    sample.push({
      domain: r.domain, stratum: s.stratum,
      radarOutput: {
        partner_motion: a?.partner_motion_state ?? (b?.motion || m?.motion ? 'established' : 'unknown'),
        programme_types: a?.programme_types_found ?? (b?.programmes ?? m?.programmes ?? []).join('|'),
        ownership: a?.programme_owner_state ?? b?.ownership ?? 'unknown',
        deal_registration: a?.deal_registration_state ?? 'not_attempted',
        partner_portal: a?.partner_portal_state ?? 'not_attempted',
        partner_tiers: a?.partner_tiers_state ?? 'not_attempted',
        partner_directory: a?.partner_directory_state ?? 'not_attempted',
        crm_level: a?.crm_evidence_level ?? b?.crm?.level ?? m?.crm ?? 'unknown',
        crm_vendor: a?.crm_vendor ?? b?.crm?.vendor ?? null,
        informal_signature: b?.informal ?? 'not_attempted',
        programme_scale: 'not_attempted',
        partner_people: 'not_attempted',
        prm: a?.prm_state ?? 'not_attempted',
        evidence_sufficiency: a?.evidence_sufficiency ?? (b?.fit ?? m?.state ?? 'unknown'),
        failure_stage: a?.failure_stage ?? null,
      },
    });
  }
}
writeFileSync('audit/phase6/manual-sample.v1.json', JSON.stringify({
  purpose: 'Part 22 stratified sample, frozen with the Radar output captured BEFORE any deeper manual research.',
  discipline: 'Selection is deterministic (alphabetical within stratum). Nothing may be tuned against these accounts. The Radar output below is the comparison baseline and is not re-run.',
  frozenAt: '2026-08-25',
  n: sample.length,
  sample,
}, null, 2));
console.log(`frozen ${sample.length} accounts across ${strata.length} strata`);
for (const s of sample) console.log(`  ${s.stratum.padEnd(24)} ${s.domain.padEnd(28)} motion=${s.radarOutput.partner_motion} crm=${s.radarOutput.crm_level}`);
