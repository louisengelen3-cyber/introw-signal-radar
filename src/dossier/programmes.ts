/**
 * Programme detection.
 *
 * A company may run several partner programmes at once — a reseller channel, a referral
 * scheme and a technology-integration directory are three different commercial motions with
 * three different implications for Introw. Flattening them into one "has partners" answer
 * loses precisely the distinction a seller needs, so they are kept apart.
 *
 * WHAT IT PROVES  that the company uses this programme vocabulary about itself.
 * WHAT IT DOES NOT PROVE  that the programme is active, staffed, or material.
 * KNOWN FALSE POSITIVE  a page listing programme types generically (a glossary). The
 *   category classifier is the defence.
 */

import { snapToSentences } from '../lib/http.js';
import type { ProgrammeKind } from './types.js';
import { matchUnnegated } from '../lib/negation.js';

export const PROGRAMME_PATTERNS: { kind: ProgrammeKind; label: string; re: RegExp }[] = [
  // `VAR` is NOT in this pattern. Under /i, `\bVAR\b` matches the bare word "var", which is
  // an extremely common Swedish and Dutch word ("was" / "where") — and half this corpus is
  // Nordic or Dutch, with the pipeline reading /nl/partners and /de/partner. It had not
  // fired only because an earlier real "reseller" happened to match first. The acronym is
  // already covered by "value-added reseller".
  { kind: 'reseller', label: 'Reseller', re: /\b(resellers?|reselling|value[- ]added reseller|wederverkopers?|revendeurs?|fachhändler)\b/i },
  { kind: 'referral', label: 'Referral', re: /\b(referral partner|refer(ral)? program(me)?|introducer|tipgever)\b/i },
  { kind: 'implementation', label: 'Implementation', re: /\b(implementation partner|delivery partner|onboarding partner|deployment partner)\b/i },
  { kind: 'services', label: 'Services', re: /\b(service partner|solution(s)? partner|consulting partner)\b/i },
  { kind: 'agency', label: 'Agency', re: /\b(agency partner|agency program(me)?|partner agencies)\b/i },
  { kind: 'technology', label: 'Technology', re: /\b(technology partner|tech partner|ISV partner)\b/i },
  { kind: 'integration', label: 'Integration', re: /\b(integration partner|app partner|marketplace listing|build an integration)\b/i },
  { kind: 'distributor', label: 'Distributor', re: /\b(distributor|distribution partner|wholesaler|groothandel|distributeur)\b/i },
  { kind: 'strategic_alliance', label: 'Strategic alliance', re: /\b(strategic alliance|global alliance|alliance partner)\b/i },
  { kind: 'affiliate', label: 'Affiliate', re: /\b(affiliate program(me)?|affiliate partner|commission on (each|every) sale)\b/i },
];

export interface ProgrammeHit {
  kind: ProgrammeKind;
  label: string;
  quote: string;
  sourceUrl: string;
  /** The company's own name for it, when one appears next to the match. */
  publishedName: string | null;
}

/** "Velocity Partner Program", "Partner Collective" — a capitalised programme name. */
const NAMED = /\b([A-Z][A-Za-z]{2,18}(?:\s+[A-Z][A-Za-z]{2,18}){0,2}\s+(?:Partner\s+)?Program(?:me)?|Partner\s+(?:Collective|Network|Club|Circle|Alliance))\b/;

export function detectProgrammes(pages: { url: string; text: string }[]): ProgrammeHit[] {
  const out: ProgrammeHit[] = [];
  for (const p of pages) {
    for (const def of PROGRAMME_PATTERNS) {
      const m = matchUnnegated(p.text, def.re);
      if (!m || m.index === undefined) continue;
      const start = Math.max(0, m.index - 140);
      const window = snapToSentences(p.text.slice(start, m.index + m[0].length + 140));
      const named = matchUnnegated(p.text, NAMED);
      out.push({ kind: def.kind, label: def.label, quote: window, sourceUrl: p.url, publishedName: named?.[1] ?? null });
    }
  }
  return out;
}
