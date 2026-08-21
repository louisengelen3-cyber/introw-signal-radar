/**
 * Commerciality classifier.
 *
 * The decision rule is deliberately explicit and readable rather than weighted:
 * no conversion data exists to fit weights against, so a weighted model would be
 * false precision. Every verdict returns the evidence that produced it and the
 * rule that fired, so a reviewer can disagree with the reasoning, not just the label.
 *
 * Rule design constraints, all from measurement:
 *  - one weak signal alone can never produce TRANSACTING
 *  - integration evidence is counter-evidence, never supporting evidence
 *  - firm-type suppression happens before lexicon, because Deloitte proved that
 *    page lexicon alone cannot separate an alliance ecosystem from equity partners
 *  - UNKNOWN is a valid terminal verdict and is never forced into a class
 */

import type {
  ChannelEvidence,
  Commerciality,
  Confidence,
  PartnerMotion,
} from '../domain/types.js';
import { firmTypeIndicators, LEXICON, PARTICIPANT_PAGE, URL_SHAPES } from './taxonomy.js';

export interface ClassifyInput {
  companyId: string;
  /** Main-content text per page, already stripped of nav/header/footer chrome. */
  pages: { url: string; text: string; retrievedAt: string; httpStatus: number; authority?: string }[];
  /** URLs discovered for this company from any inventory source. */
  urlInventory: string[];
  /** Text used for firm-type suppression — typically homepage + about. */
  identityText: string;
  /** Set when a PRM/portal vendor CNAME was found. Strongest single evidence. */
  prmFingerprint?: { vendor: string; host: string; cname: string[] } | null;
  /** Set when a distributor publicly lists this company as a vendor it sells. */
  distributorCarries?: { distributor: string; url: string; retrievedAt: string }[];
}

export interface ClassifyResult {
  commerciality: Commerciality;
  confidence: Confidence;
  /** The named rule that produced the verdict. */
  rule: string;
  /** Human-readable reasoning, safe to show a reviewer. */
  rationale: string;
  motions: PartnerMotion[];
  evidence: ChannelEvidence[];
  suppression: { rule: string; reason: string } | null;
  counts: { strongTransacting: number; weakTransacting: number; integration: number; affiliate: number; strategic: number };
}

const MAX_QUOTE = 180;

function quoteAround(text: string, index: number, matchLen: number): string {
  const start = Math.max(0, index - 70);
  const end = Math.min(text.length, index + matchLen + 70);
  return (start > 0 ? '…' : '') + text.slice(start, end).replace(/\s+/g, ' ').trim().slice(0, MAX_QUOTE) + (end < text.length ? '…' : '');
}

export function collectEvidence(input: ClassifyInput): ChannelEvidence[] {
  const out: ChannelEvidence[] = [];
  const now = new Date().toISOString();

  // 1. PRM fingerprint. A partner subdomain served by a partner-platform vendor is
  //    the strongest available proof that a managed partner programme exists.
  if (input.prmFingerprint) {
    out.push({
      companyId: input.companyId,
      evidenceClass: 'PRM_FINGERPRINT',
      claim: `${input.prmFingerprint.host} is served by ${input.prmFingerprint.vendor}`,
      quote: input.prmFingerprint.cname.join(', '),
      source: {
        url: `dns:${input.prmFingerprint.host}`,
        authority: 'subject_first_party',
        establishes: 'the company operates a partner surface on a partner-management platform',
        observedAt: now,
        retrievedAt: now,
      },
      strength: 'strong',
      implication: 'transacting',
      contaminationRisk: 'absence of a fingerprint is never evidence that no platform is in use',
      motions: [],
    });
  }

  // 2. A distributor naming this company as a vendor it sells. Counterparty evidence:
  //    weaker authority than first-party, but near-tautological for channel existence.
  for (const d of input.distributorCarries ?? []) {
    out.push({
      companyId: input.companyId,
      evidenceClass: 'DISTRIBUTOR_CARRIES',
      claim: `${d.distributor} lists this company among the vendors it distributes`,
      source: {
        url: d.url,
        authority: 'counterparty',
        establishes: 'a distributor publicly claims to sell this company\'s product',
        observedAt: d.retrievedAt,
        retrievedAt: d.retrievedAt,
      },
      strength: 'strong',
      implication: 'transacting',
      contaminationRisk: 'the downstream channel may be operated by the distributor rather than the vendor',
      motions: ['distributor'],
    });
  }

  // 3. URL-shape evidence from the inventory. Cheap, and survives JS-rendered pages.
  const seenShapes = new Set<string>();
  for (const url of input.urlInventory) {
    let path: string;
    try { path = new URL(url).pathname; } catch { continue; }
    for (const shape of URL_SHAPES) {
      if (!shape.re.test(path)) continue;
      const key = shape.id;
      if (seenShapes.has(key)) break; // one evidence item per shape, not per URL
      seenShapes.add(key);
      out.push({
        companyId: input.companyId,
        evidenceClass: shape.evidenceClass,
        claim: `URL shape ${shape.id} present: ${path}`,
        source: {
          url,
          authority: 'subject_first_party',
          establishes: 'the company publishes a page at this path',
          observedAt: now,
          retrievedAt: now,
        },
        strength: shape.strength,
        implication: shape.implication,
        contaminationRisk: shape.strength === 'strong'
          ? 'the page may be stale; publication is not proof the process is currently active'
          : 'a generic partner path proves publication, not operation',
        motions: [],
      });
      break; // first matching shape wins for this URL
    }
  }

  // 4. Lexicon evidence from page main content. The strongest instance of each rule
  //    wins: if reseller language appears on both a participant page and the company's
  //    own programme page, the programme page is what counts.
  const best = new Map<string, ChannelEvidence>();
  for (const page of input.pages) {
    if (!page.text || page.text.length < 60) continue;
    // A page describing the company as SOMEONE ELSE'S partner carries that other
    // company's channel language. Deloitte classified transacting from pages about
    // SAP's value-added reseller programme, which Deloitte participates in.
    const participant = PARTICIPANT_PAGE.test(page.url) || PARTICIPANT_PAGE.test(page.text.slice(0, 3000));
    for (const rule of LEXICON) {
      for (const { lang, re } of rule.patterns) {
        const m = re.exec(page.text);
        if (!m) continue;
        const candidate: ChannelEvidence = {
          companyId: input.companyId,
          evidenceClass: rule.evidenceClass,
          claim: rule.proves,
          quote: quoteAround(page.text, m.index, m[0].length),
          source: {
            url: page.url,
            authority: 'subject_first_party',
            establishes: rule.proves,
            observedAt: page.retrievedAt,
            retrievedAt: page.retrievedAt,
            httpStatus: page.httpStatus,
          },
          // Participant pages are demoted to weak: the language is real, the owner is not.
          strength: participant && rule.implication === 'transacting' ? 'weak' : rule.strength,
          implication: rule.implication,
          contaminationRisk: participant
            ? 'found on a page describing this company as another vendor\'s partner — the channel may belong to that vendor'
            : rule.contaminationRisk,
          motions: rule.motions,
          lang,
        };
        const prev = best.get(rule.id);
        if (!prev || (prev.strength === 'weak' && candidate.strength === 'strong')) best.set(rule.id, candidate);
        break; // one hit per rule per page is enough; repetition is not extra proof
      }
    }
  }
  out.push(...best.values());
  return out;
}

/** Distinct strong rules, not raw hit counts — repetition of one phrase is not corroboration. */
function distinct(ev: ChannelEvidence[], implication: string, strength: 'strong' | 'weak'): Set<string> {
  return new Set(ev.filter((e) => e.implication === implication && e.strength === strength).map((e) => e.evidenceClass));
}

export function classify(input: ClassifyInput): ClassifyResult {
  const evidence = collectEvidence(input);

  const strongT = distinct(evidence, 'transacting', 'strong');
  const weakT = distinct(evidence, 'transacting', 'weak');
  const integ = distinct(evidence, 'integration', 'strong');
  const aff = distinct(evidence, 'affiliate', 'strong');
  const strat = distinct(evidence, 'strategic', 'weak');
  const counts = {
    strongTransacting: strongT.size,
    weakTransacting: weakT.size,
    integration: integ.size,
    affiliate: aff.size,
    strategic: strat.size,
  };

  const motions = [...new Set(evidence.flatMap((e) => e.motions))];
  const hasFingerprint = evidence.some((e) => e.evidenceClass === 'PRM_FINGERPRINT');
  const hasDistributor = evidence.some((e) => e.evidenceClass === 'DISTRIBUTOR_CARRIES');
  // Deal registration and a partner-platform fingerprint are artifacts that exist only
  // where partners transact. They are treated as decisive on their own.
  const decisive = strongT.has('DEAL_REGISTRATION') || hasFingerprint;

  const verdict = (
    commerciality: Commerciality,
    confidence: Confidence,
    rule: string,
    rationale: string,
    suppression: ClassifyResult['suppression'] = null,
  ): ClassifyResult => ({ commerciality, confidence, rule, rationale, motions, evidence, suppression, counts });

  // ── Firm-type suppression ────────────────────────────────────────────────
  // Two distinct self-description indicators required, and never applied over a
  // decisive artifact: a company with a published deal-registration process is
  // operating a channel whatever else it also is.
  const firmTypes = firmTypeIndicators(input.identityText);
  const suppressing = firmTypes.find((f) => f.hits.length >= 2);
  if (suppressing && !decisive) {
    return verdict('unknown', 'medium', `suppressed:${suppressing.id}`,
      `Company-level suppression: ${suppressing.reason}. Two independent self-description indicators matched (${suppressing.hits.join('; ')}), so partner language on this company cannot be trusted to indicate a channel of its own.`,
      { rule: suppressing.id, reason: suppressing.reason });
  }

  // ── Affiliate framing wins over referral framing when links/cookies appear ─
  if (aff.size >= 1 && strongT.size <= 1 && !decisive) {
    return verdict('affiliate_only', strongT.size === 0 ? 'high' : 'medium', 'affiliate_dominant',
      `Affiliate/performance-marketing evidence present with ${strongT.size} distinct strong transacting signal(s) and no deal-registration or platform fingerprint. Treated as a performance-marketing motion — a different buyer and a different object model.`);
  }

  // ── Decisive artifacts ───────────────────────────────────────────────────
  if (decisive) {
    const label = hasFingerprint
      ? 'a partner surface served by a partner-management platform'
      : 'a public deal-registration process';
    if (integ.size >= 2) {
      return verdict('mixed', 'high', 'decisive_plus_integration',
        `Decisive transacting artifact present (${label}) alongside ${integ.size} integration-ecosystem classes. Both motions run.`);
    }
    return verdict('transacting', 'high', 'decisive_artifact',
      `Decisive transacting artifact present: ${label}. These artifacts exist only where partners register or are managed commercially.`);
  }

  // ── Corroborated transacting evidence ────────────────────────────────────
  if (strongT.size >= 2) {
    const mixed = integ.size >= 2;
    return verdict(mixed ? 'mixed' : 'transacting', strongT.size >= 3 ? 'high' : 'medium',
      mixed ? 'corroborated_plus_integration' : 'corroborated_transacting',
      `${strongT.size} independent strong transacting evidence classes (${[...strongT].join(', ')})${mixed ? `, alongside ${integ.size} integration classes` : ''}. No single phrase carries the verdict.`);
  }

  // ── Counterparty-only evidence ───────────────────────────────────────────
  if (hasDistributor) {
    return verdict('transacting', 'medium', 'counterparty_distribution',
      `A distributor publicly lists this company as a vendor it sells; channel existence follows near-tautologically. The company's own programme surface was not confirmed, so the downstream programme may be operated by the distributor.`);
  }

  // ── Integration-only requires ZERO strong transacting evidence ───────────
  // Earlier this fired at one strong transacting signal, which misclassified real
  // reseller programmes at integration-heavy companies. Integration evidence is
  // counter-evidence, but it cannot outvote a positive transacting artifact.
  if (integ.size >= 2 && strongT.size === 0) {
    return verdict('integration_only', 'high', 'integration_only',
      `${integ.size} integration-ecosystem classes and zero strong transacting evidence. This is the largest false-positive class in the domain and is explicitly suppressed.`);
  }

  // ── One strong signal: interesting, not established ──────────────────────
  if (strongT.size === 1) {
    return verdict('unknown', 'low', 'single_strong_uncorroborated',
      `One strong transacting signal (${[...strongT][0]})${integ.size ? ` against ${integ.size} integration classes` : ''} with no corroboration. A single signal cannot establish a transacting programme — routed to research rather than classified either way.`);
  }

  // ── Strategic-only needs more than one passing mention ───────────────────
  if (strat.size >= 1 && strongT.size === 0 && integ.size === 0 && evidence.length >= 3) {
    return verdict('strategic_only', 'medium', 'strategic_only',
      `Named corporate alliances with no evidence of repeatable channel operations.`);
  }

  return verdict('unknown', 'low', 'insufficient_evidence',
    `No decisive artifact and fewer than two independent strong transacting signals were observed. Insufficient evidence — not a claim that no programme exists.`);
}

/**
 * Programme scale and structural complexity.
 *
 * SAP classifies as `transacting` and that verdict is correct — it operates one of the
 * largest reseller channels in existence. It is nonetheless a poor Introw account,
 * because the thesis places multi-tier distributor governance outside Introw's design.
 *
 * That is a PRIORITISATION problem, not a classification problem. Tuning the
 * commerciality classifier to call SAP "not transacting" would be false, and would be
 * benchmark-memorisation rather than a rule. So the demotion lives here, as a separate
 * dimension, and it is a demotion rather than an exclusion because Factorial — a real
 * customer — sits at the large end of the same axis.
 */
export interface ScaleAssessment {
  programScale: 'large' | 'meaningful' | 'small' | 'unknown';
  multiTierSuspected: boolean;
  rationale: string;
}

const MULTI_TIER = /\b(two[- ]tier|multi[- ]tier|tier[- ]?2 (?:partner|distributor)|through (?:our )?distributors?|authoriz?ed distributor|distribution partner|global systems integrator|value[- ]added distributor)\b/i;

export function assessScale(
  partnerCount: number | null,
  countUsable: boolean,
  urlInventorySize: number,
  pageText: string,
): ScaleAssessment {
  const multiTier = MULTI_TIER.test(pageText);
  // Site scale is a proxy for organisational scale, and a weak one — used only to
  // flag the enterprise end, never to rank accounts against each other.
  const veryLargeSite = urlInventorySize > 6000;

  let programScale: ScaleAssessment['programScale'] = 'unknown';
  let rationale = 'no reliable partner count; scale not established';
  if (countUsable && partnerCount !== null) {
    programScale = partnerCount >= 200 ? 'large' : partnerCount >= 20 ? 'meaningful' : 'small';
    rationale = `${partnerCount} partners from a usable count`;
  } else if (veryLargeSite) {
    programScale = 'large';
    rationale = `partner count unavailable; site inventory of ${urlInventorySize} URLs indicates an organisation at the enterprise end`;
  }

  return {
    programScale,
    multiTierSuspected: multiTier || (veryLargeSite && programScale === 'large'),
    rationale: multiTier
      ? `${rationale}. Multi-tier distribution language present — outside Introw's design centre, so demote rather than exclude.`
      : rationale,
  };
}
