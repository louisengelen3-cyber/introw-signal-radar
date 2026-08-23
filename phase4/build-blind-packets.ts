/**
 * Blind review packets.
 *
 * Phase 3's review was performed by me, on records whose answers I already knew. That
 * result showed captured evidence CAN carry a decision; it could not show that an
 * independent reviewer reaches useful decisions without prior knowledge.
 *
 * These packets mask everything that could leak the answer: company identity, cohort,
 * ground truth, machine recommendation, and test-set membership. What remains is what a
 * seller would legitimately have — the observed evidence, quoted and attributed.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Assessment } from '../src/pipeline/assess.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

type Row = Assessment & { name: string; population?: string; negativeBasis?: string; meta?: string };

const positive = JSON.parse(readFileSync(new URL('../phase3/out/positive.json', import.meta.url), 'utf8')) as Row[];
const hard = JSON.parse(readFileSync(new URL('./out/hard-negatives.json', import.meta.url), 'utf8')) as Row[];

/** Deliberately mixed, and balanced enough that no category dominates. */
const SAMPLE: { row: Row; truth: string }[] = [
  ...positive.filter((r) => r.population === 'customer_discovery').slice(0, 4).map((r) => ({ row: r, truth: 'known_customer' })),
  ...positive.filter((r) => r.population === 'customer_holdout').slice(0, 2).map((r) => ({ row: r, truth: 'known_customer' })),
  ...hard.slice(0, 6).map((r) => ({ row: r, truth: `hard_negative:${r.negativeBasis}` })),
  ...positive.filter((r) => r.population === 'clean_negative').slice(0, 3).map((r) => ({ row: r, truth: 'easy_negative' })),
  ...positive.filter((r) => r.population === 'matched_unlabelled').slice(0, 4).map((r) => ({ row: r, truth: 'unlabelled' })),
];

/** Deterministic shuffle so the order carries no information about category. */
function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  let seed = 20260823;
  for (let i = a.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ordered = shuffle(SAMPLE);

interface Packet {
  recordId: string;
  /** Sector only. Company identity is withheld so recognition cannot substitute for evidence. */
  sector: string;
  country: string | null;
  observedEvidence: { observation: string; quote: string; source: string; proves: string; doesNotProve: string }[];
  /** Surfaces we looked at, so the reviewer can judge how much was actually inspected. */
  surfacesInspected: string[];
  partnerPlatformDetected: string | null;
  crmEvidence: string;
  partnerCount: string;
  publicationDensity: string;
  notObserved: string[];
  retrievalProblems: string[];
}

const packets: Packet[] = [];
const key: { recordId: string; domain: string; truth: string; machineRecommendation: string }[] = [];

/** Strip anything that names the company, so a recognisable brand cannot leak the answer. */
function redact(text: string, domain: string, name: string): string {
  const label = domain.replace(/^www\./, '').split('.')[0];
  const parts = [label, ...name.split(/[\s.]+/).filter((w) => w.length > 3)];
  let out = text;
  for (const p of parts) {
    if (p.length < 3) continue;
    out = out.replace(new RegExp(p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '[COMPANY]');
  }
  return out.replace(/https?:\/\/[^\s"']+/g, (u) => {
    try { return `[${new URL(u).pathname || '/'}]`; } catch { return '[url]'; }
  });
}

ordered.forEach((s, i) => {
  const r = s.row;
  const id = `RECORD_${String(i + 1).padStart(2, '0')}`;
  const obs = (r.positive?.observations ?? []).map((o) => ({
    observation: o.probe.replace(/_/g, ' '),
    quote: redact(o.quote, r.domain, r.name),
    source: redact(o.sourceUrl, r.domain, r.name),
    proves: o.proves,
    doesNotProve: o.doesNotProve,
  }));
  const notObserved: string[] = [];
  if (r.positive?.materiality === 'unknown') notObserved.push('no evidence that partners generate revenue or customers');
  if (r.positive?.ownership === 'unknown') notObserved.push('no evidence about who operates the partner motion');
  if (r.positive?.surface === 'unknown') notObserved.push('no partner operational machinery observed');
  if (!r.dns.platform) notObserved.push('no partner-platform fingerprint (this is not evidence that none is in use)');
  if (!r.crm?.vendors?.length) notObserved.push('no CRM artifact found (this is not evidence about which CRM is used)');
  notObserved.push('partner-team size', 'partner-sourced revenue share', 'partner adoption');

  packets.push({
    recordId: id,
    sector: r.classification?.commerciality === 'unknown' ? 'not established' : (r.scale?.rationale?.slice(0, 60) ?? 'unspecified'),
    country: null,
    observedEvidence: obs,
    surfacesInspected: r.pagesFetched.filter((p) => p.status === 200).map((p) => redact(p.url, r.domain, r.name)),
    partnerPlatformDetected: r.dns.platform ? r.dns.platform.vendor : null,
    crmEvidence: r.crm?.vendors?.length ? `${r.crm.vendors[0].vendor} artifact present on the company's own pages` : 'unknown — no artifact found',
    partnerCount: r.partnerCount.value !== null ? `${r.partnerCount.value} (${r.partnerCount.countType})` : 'unknown',
    publicationDensity: r.positive?.evidenceDensity ?? 'none',
    notObserved,
    retrievalProblems: r.reachable ? [] : [`site could not be retrieved (${r.blockReason})`],
  });
  key.push({ recordId: id, domain: r.domain, truth: s.truth, machineRecommendation: r.promotion?.state ?? '-' });
});

writeFileSync(`${OUT}blind-packets.json`, JSON.stringify(packets, null, 2));
writeFileSync(`${OUT}blind-key.json`, JSON.stringify(key, null, 2));
console.log(`packets: ${packets.length}`);
const byTruth: Record<string, number> = {};
for (const k of key) byTruth[k.truth.split(':')[0]] = (byTruth[k.truth.split(':')[0]] ?? 0) + 1;
console.log('composition (KEY ONLY — not in packets):', JSON.stringify(byTruth));
console.log('packet fields:', Object.keys(packets[0]).join(', '));
