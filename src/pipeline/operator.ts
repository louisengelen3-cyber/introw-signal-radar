/**
 * Operator vs participant resolution.
 *
 * Phase 1 wrote: *"if a distributor sells your product, you operate a transacting
 * channel."* That is a hypothesis, and this module exists to stop treating it as an
 * invariant. A distributor's vendor list proves a commercial relationship exists. It does
 * not prove the manufacturer runs the programme, manages partners directly, or owns the
 * workflow Introw automates.
 *
 * The question every strong commercial artifact must answer is: **whose programme is this?**
 */

import type { Confidence, SourceRef } from '../domain/types.js';

export type RelationshipDirection =
  | 'channel_operator'     // the company runs the programme others join
  | 'channel_participant'  // the company joins someone else's programme
  | 'distributed_vendor'   // the company's products move through distribution; operator status unresolved
  | 'both'
  | 'unknown';

export type RelationshipType =
  | 'OPERATES' | 'DISTRIBUTES' | 'RESELLS' | 'REFERS' | 'INSTALLS'
  | 'INTEGRATES' | 'AFFILIATE_OF' | 'STRATEGIC_ALLIANCE' | 'PARTICIPATES_IN';

export interface ChannelRelationship {
  sourceCompany: string;
  /** Named where the evidence names it; null when only the direction is known. */
  targetCompany: string | null;
  relationshipType: RelationshipType;
  direction: 'outbound' | 'inbound';
  evidence: SourceRef;
  quote?: string;
  confidence: Confidence;
  observedAt: string;
}

export interface OperatorResolution {
  direction: RelationshipDirection;
  confidence: Confidence;
  rule: string;
  rationale: string;
  relationships: ChannelRelationship[];
  /** Programmes this company appears to own, keyed by the surface that evidences them. */
  ownedProgrammeSurfaces: string[];
  /** Programmes it appears to participate in, with the owner named where possible. */
  participatesIn: { owner: string; url: string }[];
}

/* ─────────────────────────────────────── operator vs participant language ── */

/**
 * First-person invitational language. Only the operator of a programme says
 * "become OUR partner" — a participant says "we are a Gold partner of X".
 */
const OPERATOR_LANGUAGE: [RelationshipType, RegExp][] = [
  ['OPERATES', /\b(become (?:a |an )?(?:our )?(?:partner|reseller|dealer|distributor|installer)|join (?:our|the) (?:partner|reseller|dealer|channel) (?:program(?:me)?|network)|apply to (?:our|the) partner|partner with us|our partner program(?:me)?|our reseller program(?:me)?|our (?:partners|resellers|dealers|installers)\b|partner requirements|partner application)\b/i],
  ['OPERATES', /\b(word (?:onze )?partner|word (?:een )?(?:wederverkoper|verdeler|dealer)|onze (?:partners|verdelers|dealers|installateurs)\b|partner worden)\b/i],
  ['OPERATES', /\b(devenir (?:notre |un )?(?:partenaire|revendeur|distributeur|installateur)|nos (?:partenaires|revendeurs|distributeurs|installateurs)\b|programme (?:de )?partenaires?)\b/i],
  ['OPERATES', /\b(partner werden|h[äa]ndler werden|unsere (?:partner|h[äa]ndler|fachpartner|installateure)\b|partnerprogramm|vertriebspartner werden)\b/i],
];

/**
 * Third-person membership language. The company is describing a programme it joined.
 * This is the Deloitte case: real reseller language, belonging to SAP.
 */
const PARTICIPANT_LANGUAGE: RegExp[] = [
  /\bwe are (?:a|an) (?:certified |gold |silver |platinum |premier |elite |global |authoriz?ed |authorised )?[A-Z][\w.& -]{1,30} partner\b/,
  /\bas (?:a|an) (?:certified |gold |premier |authoriz?ed )?[A-Z][\w.& -]{1,30} partner\b/,
  /\b(?:our|the) partnership with [A-Z][\w.& -]{1,30}\b/,
  /\bmember of the [A-Z][\w.& -]{1,30} (?:partner (?:program(?:me)?|network)|ecosystem)\b/i,
  /\b(?:we|our team) (?:hold|have) [A-Z][\w.& -]{1,30} certifications?\b/,
];

/** Named-owner extraction for participation, so the programme can be attributed. */
const PARTICIPANT_OWNER = /\b(?:we are (?:a|an) (?:certified |gold |silver |platinum |premier |elite |global |authoriz?ed |authorised )?|member of the |partnership with |as (?:a|an) (?:certified |gold |premier |authoriz?ed )?)([A-Z][\w.&-]{1,24}(?: [A-Z][\w.&-]{1,24})?)\s*(?:partner|ecosystem|program)/;

/** A URL under another vendor's name is a participation page, not a programme page. */
const PARTICIPANT_URL = /\/(?:alliances|allianzen|technology-partners|partnerships)\/[a-z0-9][a-z0-9-]{1,}/i;

/** Distribution language that describes the company's own products moving downstream. */
const DISTRIBUTED_VENDOR = /\b(available (?:from|through) (?:our |authoriz?ed |authorised )?(?:distributors?|resellers?|partners?)|buy (?:from|through) (?:a |an )?(?:authoriz?ed |authorised )?(?:distributor|reseller|partner)|(?:sold|distributed) (?:by|through) (?:our )?(?:distributors?|partners?)|find (?:a|an) (?:authoriz?ed |authorised )?(?:distributor|reseller|dealer)|where to buy|waar te koop|bezugsquellen|o[uù] acheter)\b/i;

export interface OperatorInput {
  domain: string;
  pages: { url: string; text: string; retrievedAt: string; httpStatus: number }[];
  urlInventory: string[];
  identityText: string;
  platform: { vendor: string; host: string; cname: string[] } | null;
}

export function resolveOperator(input: OperatorInput): OperatorResolution {
  const rels: ChannelRelationship[] = [];
  const owned = new Set<string>();
  const participates: { owner: string; url: string }[] = [];
  const now = new Date().toISOString();

  const src = (url: string, establishes: string, retrievedAt: string): SourceRef => ({
    url, authority: 'subject_first_party', establishes, observedAt: retrievedAt, retrievedAt,
  });

  // A partner surface on a partner-management platform is operated by whoever owns the
  // hostname. This is the strongest operator evidence available.
  if (input.platform) {
    owned.add(`dns:${input.platform.host}`);
    rels.push({
      sourceCompany: input.domain, targetCompany: null, relationshipType: 'OPERATES', direction: 'outbound',
      evidence: { url: `dns:${input.platform.host}`, authority: 'subject_first_party', establishes: 'the company operates a partner surface on its own hostname', observedAt: now, retrievedAt: now },
      quote: input.platform.cname.join(', '), confidence: 'high', observedAt: now,
    });
  }

  for (const page of input.pages) {
    const isParticipantUrl = PARTICIPANT_URL.test(page.url);

    for (const [type, re] of OPERATOR_LANGUAGE) {
      const m = re.exec(page.text);
      if (!m) continue;
      // First-person invitation on a page dedicated to another vendor is ambiguous;
      // treat it as weaker rather than as operator proof.
      owned.add(page.url);
      rels.push({
        sourceCompany: input.domain, targetCompany: null, relationshipType: type, direction: 'outbound',
        evidence: src(page.url, 'the company invites organisations to join a programme it runs', page.retrievedAt),
        quote: m[0].slice(0, 120), confidence: isParticipantUrl ? 'low' : 'high', observedAt: page.retrievedAt,
      });
      break;
    }

    for (const re of PARTICIPANT_LANGUAGE) {
      const m = re.exec(page.text);
      if (!m) continue;
      const owner = PARTICIPANT_OWNER.exec(page.text)?.[1]?.trim() ?? 'unnamed vendor';
      participates.push({ owner, url: page.url });
      rels.push({
        sourceCompany: input.domain, targetCompany: owner, relationshipType: 'PARTICIPATES_IN', direction: 'inbound',
        evidence: src(page.url, `the company describes itself as a partner of ${owner}`, page.retrievedAt),
        quote: m[0].slice(0, 120), confidence: 'medium', observedAt: page.retrievedAt,
      });
      break;
    }

    const dv = DISTRIBUTED_VENDOR.exec(page.text);
    if (dv) {
      rels.push({
        sourceCompany: input.domain, targetCompany: null, relationshipType: 'DISTRIBUTES', direction: 'outbound',
        evidence: src(page.url, 'the company directs buyers to distributors or resellers for purchase', page.retrievedAt),
        quote: dv[0].slice(0, 120), confidence: 'medium', observedAt: page.retrievedAt,
      });
    }
  }

  // A dedicated partner host is operator evidence even without page language.
  for (const u of input.urlInventory) {
    try {
      const label = new URL(u).hostname.split('.')[0];
      if (/^(partners?|partnerportal|partnerhub|partnerprogram|resellers?|dealers?|installers?|channel)/i.test(label)) owned.add(u);
    } catch { /* skip */ }
  }

  const strongOperator = rels.filter((r) => r.relationshipType === 'OPERATES' && r.confidence === 'high').length;
  const participantCount = participates.length;
  const distributedOnly = rels.some((r) => r.relationshipType === 'DISTRIBUTES');

  const out = (direction: RelationshipDirection, confidence: Confidence, rule: string, rationale: string): OperatorResolution =>
    ({ direction, confidence, rule, rationale, relationships: rels, ownedProgrammeSurfaces: [...owned], participatesIn: participates });

  if (strongOperator > 0 && participantCount > 0) {
    return out('both', 'medium', 'operator_and_participant',
      `The company invites organisations into a programme of its own AND describes itself as a partner of ${participates.map((p) => p.owner).join(', ')}. Both roles are real; only the first is what Introw serves.`);
  }
  if (strongOperator > 0) {
    return out('channel_operator', strongOperator > 1 ? 'high' : 'medium', 'first_person_invitation',
      `The company uses first-person invitational language on ${strongOperator} of its own surfaces — it runs the programme rather than joining one.`);
  }
  if (participantCount > 0 && !distributedOnly) {
    return out('channel_participant', 'medium', 'membership_language_only',
      `Partner language on this company describes membership of ${participates.map((p) => p.owner).join(', ')}'s programme. No evidence that it operates a programme of its own.`);
  }
  if (distributedOnly) {
    return out('distributed_vendor', 'medium', 'distribution_without_programme',
      `The company routes buyers to distributors or resellers, but publishes no invitation to join a programme it runs. Whether it manages those partners directly is unresolved — the downstream relationships may be owned by the distributor.`);
  }
  return out('unknown', 'low', 'no_direction_evidence',
    'No first-person invitation and no membership language observed. Direction of the channel relationship is unresolved.');
}
