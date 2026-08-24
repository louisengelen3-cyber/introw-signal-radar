/**
 * The commercial summary.
 *
 * THE RULE THIS FILE ENFORCES: every factual clause must be traceable to an observation
 * that was actually collected. The summary is assembled from clauses that are only emitted
 * when their supporting evidence exists — it is never free text about a company.
 *
 * That is a deliberately boring design. The alternative, generating prose and hoping it is
 * accurate, is how "rapidly growing partner ecosystem" and "high operational load" get into
 * a product with nothing behind them. Precise beats exciting: a seller who is misled once
 * stops trusting every summary afterwards.
 *
 * Clauses that are forbidden outright, because nothing observable supports them:
 *   growth language, ecosystem size, operational load, buying intent, budget, urgency,
 *   satisfaction with an incumbent, or any comparison to other companies.
 */

import type { ConstructPanel, Programme, SurfaceFinding, SystemsPanel, PeoplePanel, EvidenceCoverage } from './types.js';

export interface SummaryInput {
  companyName: string | null;
  selfDescription: string | null;
  programmes: Programme[];
  surfaces: SurfaceFinding[];
  constructs: ConstructPanel[];
  systems: SystemsPanel;
  people: PeoplePanel;
  coverage: EvidenceCoverage;
  categoryState: string;
  /** How many conventional partner paths were probed, so "not found" is interpretable. */
  partnerPathsChecked?: number;
  /** Lower bound only; the summary must never state it as a count. */
  partnerDirectoryLowerBound?: number | null;
  directoryCertified?: boolean;
}

const SUBJECT = (name: string | null) => name ?? 'This company';

export function buildCommercialSummary(i: SummaryInput): string {
  const parts: string[] = [];

  // 1. What the company says it is — quoted ground, not our characterisation.
  if (i.selfDescription) {
    parts.push(`${SUBJECT(i.companyName)} describes itself as ${trimDesc(i.selfDescription)}.`);
  } else {
    parts.push(`${SUBJECT(i.companyName)} publishes no retrievable self-description.`);
  }

  // 2. Category, but only when it changes what a seller should do.
  if (i.categoryState === 'partner_tech_vendor' || i.categoryState === 'direct_introw_competitor') {
    parts.push('Its own product positioning is partner management, so its partner content describes what it sells rather than how it goes to market.');
  } else if (i.categoryState === 'supply_side_marketplace') {
    parts.push('Its "partners" appear to be supply rather than a route to market.');
  }

  // 3. Programmes, named only when the company names them.
  const kinds = [...new Set(i.programmes.map((p) => p.kind))];
  if (kinds.length) {
    const named = i.programmes.find((p) => p.publishedName)?.publishedName;
    const list = kinds.slice(0, 3).map((k) => k.replace(/_/g, ' ')).join(', ');
    // "a agency motion" appeared in four of thirty-five summaries. On a product whose pitch
    // is care, that is expensive in the first paragraph.
    const article = /^[aeiou]/i.test(list) ? 'an' : 'a';
    parts.push(named
      ? `Public pages describe ${article} ${list} motion under the name "${named}".`
      : `Public pages describe ${article} ${list} motion.`);
  } else {
    parts.push(i.partnerPathsChecked
      ? `No partner programme type could be identified; ${i.partnerPathsChecked} conventional partner paths were checked and none returned a partner page.`
      : 'No partner programme type could be identified from the pages retrieved.');
  }

  // 3b. A directory is quotable and specific, so it earns a sentence — phrased as the
  // lower bound it is, never as a partner count.
  if (i.partnerDirectoryLowerBound) {
    parts.push(`It publishes a directory listing at least ${i.partnerDirectoryLowerBound} partner organisations${i.directoryCertified ? ', described as certified' : ''}.`);
  }

  // 4. Confirmed workflows only. `not_observed` is never reported as absence.
  const confirmed = i.surfaces.filter((s) => s.state === 'confirmed').map((s) => s.surface.replace(/_/g, ' '));
  if (confirmed.length) parts.push(`Visible partner workflows include ${confirmed.slice(0, 4).join(', ')}.`);

  // 5. Ownership, stated as evidence rather than conclusion.
  const own = i.constructs.find((c) => c.construct === 'operational_ownership');
  if (own && own.state !== 'unknown') {
    parts.push(own.state === 'direct'
      ? 'The company appears to operate the programme itself.'
      : `Programme operation appears ${own.state.replace(/_/g, ' ')}.`);
  }

  // 6. Systems and people, always as unknowns when unknown — never as absence.
  const gaps: string[] = [];
  if (i.systems.crm.state === 'unknown') gaps.push('CRM');
  if (i.systems.prm.state === 'unknown') gaps.push('partner platform');
  if (i.people.state === 'unknown') gaps.push('partner-team size');
  if (gaps.length) parts.push(`Public evidence does not establish ${joinList(gaps)}.`);

  if (i.coverage === 'sparse' || i.coverage === 'none') {
    parts.push('Public evidence is sparse, so manual research is likely to be required — this is a limit of what the company publishes, not a judgement about it.');
  }

  return parts.join(' ');
}

function trimDesc(d: string): string {
  const clean = d.replace(/\s+/g, ' ').trim().replace(/[.,;:]+$/, '');
  const short = clean.length > 160 ? clean.slice(0, 157).replace(/\s+\S*$/, '') + '…' : clean;
  return `"${short}"`;
}

function joinList(x: string[]): string {
  return x.length === 1 ? x[0] : `${x.slice(0, -1).join(', ')} or ${x.at(-1)}`;
}

/** Phrases the product must never emit. Enforced by test, not by good intentions. */
export const FORBIDDEN_SUMMARY_PATTERNS: RegExp[] = [
  /\brapidly growing\b/i, /\bfast[- ]growing (partner )?ecosystem\b/i,
  /\bhigh operational load\b/i, /\blikely (looking for|to buy|in market)\b/i,
  /\bready to buy\b/i, /\bstrong fit\b/i, /\bperfect fit\b/i, /\bideal (customer|prospect)\b/i,
  /\bintent\b/i, /\bpurchase probability\b/i, /\bscore\b/i,
  /\bdissatisfied\b/i, /\boutgrown\b/i, /\bstruggling with\b/i,
];
