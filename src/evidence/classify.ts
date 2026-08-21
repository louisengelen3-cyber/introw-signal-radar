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
import { FIRM_TYPE_SUPPRESSION, LEXICON, URL_SHAPES } from './taxonomy.js';

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
        // URL shape alone is weak: a path is not a programme.
        strength: 'weak',
        implication: shape.implication,
        contaminationRisk: 'a URL path proves publication, not operation',
        motions: [],
      });
      break; // first matching shape wins for this URL
    }
  }

  // 4. Lexicon evidence from page main content.
  for (const page of input.pages) {
    if (!page.text || page.text.length < 60) continue;
    for (const rule of LEXICON) {
      for (const { lang, re } of rule.patterns) {
        const m = re.exec(page.text);
        if (!m) continue;
        out.push({
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
          strength: rule.strength,
          implication: rule.implication,
          contaminationRisk: rule.contaminationRisk,
          motions: rule.motions,
          lang,
        });
        break; // one hit per rule per page is enough; repetition is not extra proof
      }
    }
  }
  return out;
}

/** Distinct strong rules, not raw hit counts — repetition of one phrase is not corroboration. */
function distinct(ev: ChannelEvidence[], implication: string, strength: 'strong' | 'weak'): Set<string> {
  return new Set(ev.filter((e) => e.implication === implication && e.strength === strength).map((e) => e.evidenceClass));
}

export function classify(input: ClassifyInput): ClassifyResult {
  const evidence = collectEvidence(input);

  // ── Firm-type suppression runs first, at company level ───────────────────
  for (const s of FIRM_TYPE_SUPPRESSION) {
    if (s.re.test(input.identityText)) {
      return {
        commerciality: 'unknown',
        confidence: 'medium',
        rule: `suppressed:${s.id}`,
        rationale: `Company-level suppression fired: ${s.reason}. Partner-language evidence on this company cannot be trusted to indicate a channel.`,
        motions: [],
        evidence,
        suppression: { rule: s.id, reason: s.reason },
        counts: { strongTransacting: 0, weakTransacting: 0, integration: 0, affiliate: 0, strategic: 0 },
      };
    }
  }

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
  // Deal registration and a partner portal are the two artifacts that only exist
  // where partners transact. They are treated as decisive on their own.
  const decisive = strongT.has('DEAL_REGISTRATION') || hasFingerprint;

  const verdict = (
    commerciality: Commerciality,
    confidence: Confidence,
    rule: string,
    rationale: string,
  ): ClassifyResult => ({ commerciality, confidence, rule, rationale, motions, evidence, suppression: null, counts });

  // ── Affiliate framing wins over referral framing when links/cookies appear ──
  if (aff.size >= 1 && strongT.size <= 1 && !decisive) {
    return verdict(
      'affiliate_only',
      strongT.size === 0 ? 'high' : 'medium',
      'affiliate_dominant',
      `Affiliate/performance-marketing evidence present with ${strongT.size} distinct strong transacting signal(s) and no deal-registration or platform fingerprint. Treated as a performance-marketing motion, which is a different buyer and a different object model.`,
    );
  }

  // ── Decisive artifacts ─────────────────────────────────────────────────────
  if (decisive && integ.size > 0) {
    return verdict('mixed', 'high', 'decisive_plus_integration',
      `A decisive transacting artifact is present (${[...strongT].join(', ')}${hasFingerprint ? ', PRM_FINGERPRINT' : ''}) alongside ${integ.size} integration-ecosystem signal(s). Both motions run.`);
  }
  if (decisive) {
    return verdict('transacting', 'high', 'decisive_artifact',
      `A decisive transacting artifact is present: ${hasFingerprint ? 'a partner surface served by a partner-management platform' : 'a public deal-registration process'}. These artifacts exist only where partners register or are managed commercially.`);
  }

  // ── Corroborated transacting evidence ─────────────────────────────────────
  if (strongT.size >= 2) {
    const mixed = integ.size >= 2;
    return verdict(mixed ? 'mixed' : 'transacting', strongT.size >= 3 ? 'high' : 'medium',
      mixed ? 'corroborated_plus_integration' : 'corroborated_transacting',
      `${strongT.size} independent strong transacting evidence classes found (${[...strongT].join(', ')})${mixed ? `, alongside ${integ.size} integration classes` : ''}. No single phrase carries the verdict.`);
  }

  // ── Counterparty-only evidence ────────────────────────────────────────────
  if (hasDistributor && strongT.size <= 1) {
    return verdict('transacting', 'medium', 'counterparty_distribution',
      `A distributor publicly lists this company as a vendor it sells. Channel existence follows near-tautologically, but the company's own programme surface was not confirmed, so the programme may be operated downstream.`);
  }

  // ── One strong signal is not enough on its own ────────────────────────────
  if (strongT.size === 1) {
    if (integ.size >= 2) {
      return verdict('integration_only', 'medium', 'integration_dominant',
        `Only one strong transacting signal (${[...strongT][0]}) against ${integ.size} integration classes. Insufficient to claim a transacting channel; the observable ecosystem is technical.`);
    }
    return verdict('unknown', 'low', 'single_weak_transacting',
      `One strong transacting signal (${[...strongT][0]}) with no corroboration. A single signal cannot establish a transacting programme — routed to research rather than classified.`);
  }

  // ── No transacting evidence at all ────────────────────────────────────────
  if (integ.size >= 2 && strongT.size === 0) {
    return verdict('integration_only', 'high', 'integration_only',
      `${integ.size} integration-ecosystem classes and zero strong transacting evidence. This is the largest false-positive class in the domain and is explicitly suppressed.`);
  }
  if (strat.size >= 1 && strongT.size === 0 && integ.size === 0) {
    return verdict('strategic_only', 'medium', 'strategic_only',
      `Named corporate alliances with no evidence of repeatable channel operations.`);
  }

  return verdict('unknown', 'low', 'insufficient_evidence',
    `No decisive artifact and fewer than two independent strong transacting signals were observed. Insufficient evidence — not a claim that no programme exists.`);
}
