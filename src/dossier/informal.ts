/**
 * The informal-programme detector (Phase 5, workstream C).
 *
 * THE HYPOTHESIS THIS ENCODES
 *
 * Four known Introw customers — Ringover, Xelix, Zenity, Payflip — publish first-person
 * partner recruitment and name the kinds of partner they want, while publishing none of the
 * formal machinery the pipeline looks for: no deal registration, no tier table, no partner
 * portal login, no application form, no certification programme. The pipeline routed all four
 * to `under_observed`, i.e. treated the absence of formal artefacts as an observation gap.
 *
 * Per the ICP thesis that combination is not missing data. It is the signature of a company
 * that has partners and manages them by hand — which is the company that needs Introw. A
 * company with a partner portal and deal registration has already bought or built the thing.
 *
 * WHAT THIS DETECTOR MUST NOT DO
 *
 * It must not promote on the absence of formal artefacts alone. Absence is never a promotion
 * anywhere else in this system and is not one here: the two POSITIVE conditions carry the
 * claim and the absence only selects which class it falls into.
 *
 * It must not fire on partner-technology vendors. Magentrix, Mindmatrix and Zift publish
 * first-person partner recruitment AND name partner types, because partner language is
 * simultaneously their product copy and their go-to-market copy. Phase 4 promoted competitors
 * at 50% against genuine operators at 33% by ignoring exactly this. The category classifier is
 * consulted rather than re-implemented, because it is the component that was validated for it.
 */

import { matchUnnegated } from '../lib/negation.js';

export type InformalVerdict =
  | 'informal_programme'          // the signature: recruitment + types, no formal machinery
  | 'formalised_programme'        // recruitment + types + formal artefacts present
  | 'not_informal'                // one or both positive conditions absent
  | 'suppressed_partner_tech';    // the category guard fired

/**
 * A. First-person recruitment. The company inviting organisations to partner with IT,
 * in its own voice. Not a directory listing, not a badge, not a case study.
 */
const RECRUITMENT = [
  /\b(become|becoming)\s+(a|an|our)\s+(partner|reseller|reseller partner|referral partner)\b/i,
  /\b(join)\s+(our|the)\s+[\w\s-]{0,20}?partner\s*(programme?|network|ecosystem)?\b/i,
  /\b(partner|partnering)\s+with\s+us\b/i,
  /\bwe\s+(seek|are seeking|are looking for|welcome|invite|want)\s+[\w\s-]{0,30}?partners?\b/i,
  /\bwe\s+(work|partner|collaborate)\s+with\s+[\w\s-]{0,40}?(partners?|firms?|consultanc\w+|agenc\w+|resellers?)\b/i,
  // "There is THEREFORE room in Payflip's ecosystem for ... partners". An adjacency-only
  // pattern missed this on an adverb. The invitation is the same sentence either way.
  /\b(there\s+is|there's|we\s+have)\s+\w{0,12}\s*(room|space|a place)\s+(in|within)\s+[\w\s'’-]{0,40}(ecosystem|network|programme?|community)\b/i,
  /\b(believes?|belief)\s+in\s+the\s+power\s+of\s+partnerships?\b/i,
  /\bopen\s+(to|for)\s+(new\s+)?partners?\b/i,
  /\b(word|wordt)\s+partner\b|\bpartner\s+werden\b|\bdevenez?\s+partenaire\b|\bdiventa\s+partner\b/i,
  /**
   * Local-language recruitment. The surface finder returns whichever locale it reaches first,
   * and for Payflip that was the Dutch page — so an English-only detector produced a false
   * negative on a known customer. The ICP thesis is explicit that the EU mid-market publishes
   * locally, which makes English-only matching a structural failure rather than a gap.
   */
  /\b(is\s+er|er\s+is)\s+\w{0,10}\s*(plaats|ruimte)\s+voor\b/i,
  /\bgeloof(t)?\s+in\s+de\s+(power|kracht)\s+van\s+partnership/i,
  /\b(wij|we)\s+(zoeken|verwelkomen|werken\s+samen\s+met)\b[\w\s-]{0,30}?partners?\b/i,
  /\bwir\s+(suchen|freuen\s+uns\s+auf)\b[\w\s-]{0,30}?partner/i,
  /\b(platz|raum)\s+f(ü|ue)r\b[\w\s-]{0,20}?partner/i,
  /\bnous\s+(recherchons|cherchons|accueillons)\b[\w\s-]{0,30}?partenaires?\b/i,
  /\b(il\s+y\s+a\s+)?(de\s+la\s+)?place\s+pour\b[\w\s-]{0,20}?partenaires?\b/i,
];

/**
 * B. Partner types named. The company saying WHAT KIND of organisation it wants — the thing
 * that separates a real recruitment page from a generic "partnerships matter to us" statement.
 */
const PARTNER_TYPE = [
  /\b(value[- ]added )?resellers?\b|\bVARs?\b/i,
  /\bsystem\s+integrators?\b|\bSIs?\b(?=[\s,.)])/i,
  /\bconsultanc(y|ies)\b|\bconsulting firms?\b|\bconsultants?\b/i,
  /\bagenc(y|ies)\b/i,
  /\b(business process outsourcing|BPO|outsourcing firms?)\b/i,
  /\btechnology partners?\b/i,
  /\breferral partners?\b/i,
  /\bimplementation partners?\b/i,
  /\bmanaged service providers?\b|\bMSSPs?\b|\bMSPs?\b/i,
  /\b(payroll|hr|accountanc\w+|accounting|benefit|insurance|leasing)\s+partners?\b/i,
  /\bdistributors?\b/i,
  /\bsolution\s+providers?\b/i,
  /\b(freelancers?|advisors?|brokers?)\b/i,
];

/**
 * C. Formal artefacts. Their PRESENCE moves a company out of the informal class — it does not
 * make it a worse prospect, it makes it a different one.
 */
const FORMAL_ARTEFACT = [
  { re: /\bdeal\s+registration\b|\bregister\s+a\s+deal\b|\bdeal[- ]reg\b/i, name: 'deal registration' },
  { re: /\b(gold|silver|platinum|bronze)\s+(tier|level|partner)\b|\bpartner\s+tiers?\b|\btiered?\s+programme?\b/i, name: 'tier structure' },
  { re: /\bpartner\s+(portal|login|dashboard)\b|\blog\s?in\s+to\s+(the|your)\s+partner\b/i, name: 'partner portal' },
  { re: /\bpartner\s+application\s+(form|process)\b|\bapply\s+(now\s+)?to\s+(the|our)\s+partner\s+programme?\b/i, name: 'application process' },
  { re: /\bcertification\s+programme?\b|\bcertified\s+partner\s+programme?\b|\bpartner\s+certification\b/i, name: 'certification programme' },
  { re: /\b(MDF|market\s+development\s+funds?)\b/i, name: 'market development funds' },
  /**
   * Formal machinery that does not use the word "tier". Added after a false positive on a
   * matched-unlabelled company whose FAQ read "program levels within Resell and Services
   * tracks" and "who is eligible to join" — a fully formalised programme the artefact
   * patterns did not recognise, so the detector called it informal. Under-detecting formal
   * machinery is the dangerous direction: it promotes companies that have already built or
   * bought the thing Introw sells.
   */
  { re: /\bprogramme?\s+levels?\b|\bpartner\s+levels?\b/i, name: 'programme levels' },
  /* eslint-disable-next-line */
  { re: /\b(resell|services|referral|solution)\s+tracks?\b|\bpartner\s+tracks?\b/i, name: 'partner tracks' },
  { re: /\bwho\s+is\s+eligible\b|\beligibility\s+(criteria|requirements?)\b|\bpartner\s+requirements?\b/i, name: 'published eligibility criteria' },
  { re: /\bpartner\s+(alliance|agreement|contract)\b/i, name: 'formal partner agreement' },
  { re: /\bpartner\s+(onboarding|enablement)\s+(programme?|process|plan)\b/i, name: 'structured onboarding' },
];

export interface InformalEvidence {
  kind: 'recruitment' | 'partner_type' | 'formal_artefact';
  quote: string;
  sourceUrl: string;
  /** Which artefact, for formal_artefact hits. */
  detail?: string;
}

export interface InformalFinding {
  verdict: InformalVerdict;
  /** Every hit, quoted, so a reviewer judges the inference rather than trusting it. */
  evidence: InformalEvidence[];
  recruitmentHits: number;
  partnerTypesNamed: string[];
  formalArtefacts: string[];
  proves: string;
  doesNotProve: string;
  rationale: string;
}

const excerpt = (text: string, m: RegExpMatchArray): string => {
  const at = m.index ?? 0;
  return text.slice(Math.max(0, at - 110), at + (m[0]?.length ?? 0) + 150).replace(/\s+/g, ' ').trim();
};

/** Which partner type a match represents, normalised for reporting. */
function typeName(src: string): string {
  const s = src.toLowerCase();
  if (/var|value[- ]added|reseller/.test(s)) return 'reseller/VAR';
  if (/system\s+integrator|\bsis?\b/.test(s)) return 'systems integrator';
  if (/consult/.test(s)) return 'consultancy';
  if (/agenc/.test(s)) return 'agency';
  if (/bpo|outsourc/.test(s)) return 'outsourcing/BPO';
  if (/technology/.test(s)) return 'technology partner';
  if (/referral/.test(s)) return 'referral partner';
  if (/implementation/.test(s)) return 'implementation partner';
  if (/msp|mssp|managed service/.test(s)) return 'MSP/MSSP';
  if (/payroll|hr|accountan|accounting|benefit|insurance|leasing/.test(s)) return 'vertical service partner';
  if (/distributor/.test(s)) return 'distributor';
  if (/solution provider/.test(s)) return 'solution provider';
  return 'other named type';
}

export interface InformalInput {
  pages: { url: string; text: string }[];
  /** From the existing category classifier. The guard, not a re-implementation. */
  category: string;
  onKnownCompetitorList?: boolean;
}

export function detectInformalProgramme(input: InformalInput): InformalFinding {
  const evidence: InformalEvidence[] = [];
  const types = new Set<string>();
  const artefacts = new Set<string>();
  let recruitmentHits = 0;

  for (const p of input.pages) {
    if (!p.text) continue;
    for (const re of RECRUITMENT) {
      const m = matchUnnegated(p.text, re);
      if (m) { recruitmentHits++; evidence.push({ kind: 'recruitment', quote: excerpt(p.text, m), sourceUrl: p.url }); break; }
    }
    for (const re of PARTNER_TYPE) {
      const m = matchUnnegated(p.text, re);
      if (!m) continue;
      const n = typeName(m[0]);
      if (types.has(n)) continue;
      types.add(n);
      evidence.push({ kind: 'partner_type', quote: excerpt(p.text, m), sourceUrl: p.url });
    }
    for (const f of FORMAL_ARTEFACT) {
      // A denied artefact is not an artefact. "We don't use tiered services" must not move a
      // company out of the informal class — that is the exact inversion of the EXPO.e bug.
      const m = matchUnnegated(p.text, f.re);
      if (!m || artefacts.has(f.name)) continue;
      artefacts.add(f.name);
      evidence.push({ kind: 'formal_artefact', quote: excerpt(p.text, m), sourceUrl: p.url, detail: f.name });
    }
  }

  const base = {
    evidence, recruitmentHits,
    partnerTypesNamed: [...types], formalArtefacts: [...artefacts],
  };

  // The category guard runs FIRST and unconditionally. A partner-tech vendor satisfies both
  // positive conditions by construction, so no amount of positive evidence may override it.
  if (input.onKnownCompetitorList || input.category === 'direct_introw_competitor' || input.category === 'partner_tech_vendor') {
    return {
      ...base, verdict: 'suppressed_partner_tech',
      proves: 'nothing about this company as a prospect',
      doesNotProve: 'that the partner language is absent — it is present, and that is exactly why the guard exists',
      rationale: 'Partner-technology vendors publish first-person partner recruitment and name partner types as product copy. The category classifier suppressed this before the signature was evaluated.',
    };
  }

  const hasRecruitment = recruitmentHits > 0;
  const hasTypes = types.size > 0;

  if (!hasRecruitment || !hasTypes) {
    return {
      ...base, verdict: 'not_informal',
      proves: 'nothing',
      doesNotProve: 'that no programme exists — this detector requires two positive conditions and one was absent',
      rationale: hasRecruitment
        ? 'A first-person recruitment invitation was found, but the company does not name what kind of partner it wants. One positive condition is not the signature.'
        : 'No first-person recruitment invitation was found. Absence of formal artefacts alone is never a promotion.',
    };
  }

  if (artefacts.size > 0) {
    return {
      ...base, verdict: 'formalised_programme',
      proves: 'the company recruits partners, names the types it wants, and publishes formal programme machinery',
      doesNotProve: 'that the machinery is used, or that the programme is active',
      rationale: `Recruitment and ${types.size} partner type(s) found, alongside ${[...artefacts].join(', ')}. The formal artefacts place this outside the informal signature — a different class, not a worse one.`,
    };
  }

  return {
    ...base, verdict: 'informal_programme',
    proves: 'the company is actively recruiting partners in its own voice and has decided which kinds of partner it wants, while publishing no deal registration, tier structure, portal, application process or certification',
    doesNotProve: 'that the programme is large, active, or commercially material — nor that formal machinery is genuinely absent rather than merely unpublished or behind a login',
    rationale: `First-person recruitment found ${recruitmentHits} time(s) and ${types.size} partner type(s) named (${[...types].join(', ')}), with no formal artefact on any retrieved page. Under the ICP thesis this is the signature of a programme managed by hand.`,
  };
}
