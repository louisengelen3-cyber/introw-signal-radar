/**
 * Programme scale from prose (Phase 5, workstream D — after the original hypothesis failed).
 *
 * D assumed partner and dealer locators are JavaScript front-ends over a JSON endpoint, and
 * that finding the endpoint yields exact counts. Tested against the three cases the audit
 * found by hand, that is false: Allison's locator exposes no endpoint in its HTML or in either
 * of its two first-party scripts, EXPO.e has no locator at all, and myfactory names partners
 * on a page and in a PDF.
 *
 * What those three DO have is the number written in prose — "approximately 1,600 dealer and
 * distributor locations", "600+ organisations in their Channel community". The count the ICP
 * thesis rests on is published; it is simply not in a locator. So this extracts it from text.
 *
 * WHAT A COUNT IS AND IS NOT
 * A published count is a claim the company makes about itself, which is exactly the kind of
 * evidence this system already trades in. It is not verified, it is frequently rounded, and it
 * is often marketing. It is stored as a CLAIMED figure with its sentence attached, never as a
 * measured one.
 */
import { matchUnnegated } from '../lib/negation.js';

/** Things that can be counted and mean "partner network size". */
const COUNTED_NOUN = [
  'partners?', 'resellers?', 'dealers?', 'distributors?', 'installers?', 'integrators?',
  'agencies', 'consultanc(?:y|ies)', 'msps?', 'vars?', 'affiliates?',
  'partner (?:companies|organisations|organizations|firms|locations)',
  'dealer (?:locations|sites|outlets)', 'service (?:partners?|centres?|centers?)',
  'certified (?:partners?|technicians?|installers?|engineers?)', 'technicians?',
  'partnerbedrijven', 'partners', 'händler', 'fachpartner', 'vertriebspartner',
  'revendeurs?', 'partenaires', 'rivenditori', 'återförsäljare',
].join('|');

/** Number forms: 1,600 · 1.600 · 600+ · over 600 · more than 600 · approximately 1,600 */
const NUM = String.raw`(?:over|more than|above|approximately|approx\.?|around|nearly|ruim|meer dan|über|mehr als|plus de|oltre)?\s*([0-9][0-9.,]{1,7})\s*\+?`;

const PATTERNS: RegExp[] = [
  new RegExp(String.raw`\b${NUM}\s+(?:global\s+|worldwide\s+|active\s+|certified\s+|authorised\s+|authorized\s+|trusted\s+)?(${COUNTED_NOUN})\b`, 'i'),
  new RegExp(String.raw`\b(${COUNTED_NOUN})\s*(?::|–|-|—)?\s*${NUM}\b`, 'i'),
  new RegExp(String.raw`\bnetwork of\s+${NUM}\s+(${COUNTED_NOUN})\b`, 'i'),
  new RegExp(String.raw`\btrusted by\s+${NUM}\s+(${COUNTED_NOUN})\b`, 'i'),
];

/**
 * Generic organisation nouns — "600 organisations", "80 companies". These only count as
 * programme scale when the SENTENCE also carries channel vocabulary, because "600 customers"
 * and "600 organisations trust us" are claims about the customer base, not the partner network.
 * EXPO.e's real figure reads "trusted by more than 600 organisations who have joined our
 * Channel community", which the noun list alone could never reach.
 */
const GENERIC_ORG = String.raw`organisations?|organizations?|companies|firms|businesses|bedrijven|unternehmen|entreprises`;
const GENERIC_PATTERNS: RegExp[] = [
  new RegExp(String.raw`\b${NUM}\s+(${GENERIC_ORG})\b`, 'i'),
];
const CHANNEL_CONTEXT = /\b(channel|partner|reseller|dealer|distributor|community|ecosystem|network)\w*/i;

export interface ScaleClaim {
  /** The figure as published, normalised to a number. */
  claimed: number;
  /** What was counted, verbatim from the page. */
  noun: string;
  /** Whether the company hedged the figure. */
  approximate: boolean;
  quote: string;
  sourceUrl: string;
  proves: string;
  doesNotProve: string;
}

const parseNum = (s: string): number | null => {
  // 1,600 / 1.600 / 1600 — a single separator followed by exactly three digits is a thousands
  // separator in every locale this corpus covers.
  const cleaned = s.replace(/[.,](?=\d{3}\b)/g, '');
  const n = Number(cleaned.replace(/[.,]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const APPROX = /\b(over|more than|above|approximately|approx|around|nearly|ruim|meer dan|über|mehr als|plus de|oltre)\b|\+/i;

/**
 * Extract claimed programme size from a page. Returns every distinct claim rather than one
 * number: a company that says "1,600 dealer locations and 6,200 certified technicians" has
 * made two different claims about two different populations, and collapsing them loses that.
 */
export function extractProgrammeScale(pages: { url: string; text: string }[]): ScaleClaim[] {
  const out: ScaleClaim[] = [];
  const seen = new Set<string>();
  for (const p of pages) {
    if (!p.text) continue;
    for (const re of [...PATTERNS, ...GENERIC_PATTERNS]) {
      const generic = GENERIC_PATTERNS.includes(re);
      const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
      for (const m of p.text.matchAll(rx)) {
        if (m.index === undefined) continue;
        // A denied count is not a count.
        if (!matchUnnegated(p.text.slice(Math.max(0, m.index - 100), m.index + m[0].length), new RegExp(escapeRe(m[0]), 'i'))) continue;
        const groups = m.slice(1).filter(Boolean);
        const numRaw = groups.find((g) => /^[0-9]/.test(g));
        const noun = groups.find((g) => !/^[0-9]/.test(g));
        if (!numRaw || !noun) continue;
        const claimed = parseNum(numRaw);
        if (claimed === null || claimed < 3 || claimed > 5_000_000) continue;
        const key = `${claimed}|${noun.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const quote = p.text.slice(Math.max(0, m.index - 110), m.index + m[0].length + 130).replace(/\s+/g, ' ').trim();
        // A generic organisation noun needs channel vocabulary in the same window, or it is a
        // claim about customers rather than partners.
        if (generic && !CHANNEL_CONTEXT.test(quote)) continue;
        out.push({
          claimed, noun: noun.trim(), approximate: APPROX.test(m[0]),
          quote, sourceUrl: p.url,
          proves: `the company publicly claims ${claimed.toLocaleString('en-GB')} ${noun.trim()}`,
          doesNotProve: 'that the figure is current, verified, or that the partners are active — it is a claim the company makes about itself',
        });
      }
    }
  }
  return out.sort((a, b) => b.claimed - a.claimed);
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
