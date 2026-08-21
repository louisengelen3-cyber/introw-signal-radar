/**
 * Introw suitability.
 *
 * The Phase 2 primary question: among companies that genuinely operate a transacting
 * channel, which OPERATING MODELS are appropriate for Introw?
 *
 * Three rules govern this module.
 *
 *  1. **Size is never evidence.** No employee count, no revenue band, no "enterprise".
 *     Factorial has 1,000+ employees and 100+ partner managers and is a customer;
 *     Payflip is tiny and is a customer. Size does not discriminate; structure might.
 *  2. **Every rule describes a general commercial structure**, traceable to a capability
 *     Introw has or a gap the supplied material states it has. No company-specific rules.
 *  3. **UNKNOWN survives.** Missing information produces `unknown`, never `weak`. Those
 *     are different claims and conflating them turns absence into negative evidence.
 */

import type { Confidence } from '../domain/types.js';
import type { ClassifyResult, ScaleAssessment } from '../evidence/classify.js';
import type { OperatorResolution } from '../pipeline/operator.js';
import type { DistributorSighting } from './distribution.js';

export type SuitabilityState =
  | 'strong'
  | 'plausible'
  | 'weak'
  | 'incompatible'
  | 'unknown'
  | 'research_required';

export interface SuitabilitySignal {
  dimension: string;
  polarity: 'positive' | 'negative';
  claim: string;
  quote?: string;
  sourceUrl: string;
  /** Which Introw capability or stated gap this engages. */
  relatesTo: string;
  confidence: Confidence;
}

export interface SuitabilityResult {
  state: SuitabilityState;
  confidence: Confidence;
  rule: string;
  rationale: string;
  positive: SuitabilitySignal[];
  negative: SuitabilitySignal[];
  unknowns: string[];
  blockers: string[];
  researchNeeded: { field: string; reason: string; method: string }[];
  evaluatedAt: string;
}

/* ─────────────────────────────────────────── structural detectors ──────── */

/**
 * Two-tier distribution: the vendor sells TO a distributor, who sells to the reseller.
 * Engages the `multi_tier_governance` gap. Introw's object model assumes the operator
 * has the direct relationship with the transacting partner; in a two-tier model the
 * distributor owns onboarding, credit and often registration.
 *
 * Deliberately requires language describing the CHAIN, not the mere existence of
 * distributors — a manufacturer with distributors may still run its own dealer programme.
 */
const TWO_TIER: [string, RegExp][] = [
  ['explicit_two_tier', /\b(two[- ]tier|2[- ]tier|multi[- ]tier|second[- ]tier|tier[- ]?2 partner)\b/i],
  ['through_distribution', /\b(?:purchase|buy|order|source|procure)[^.]{0,40}\bthrough (?:one of )?(?:our |an? )?(?:authoriz?ed |authorised )?distributors?\b/i],
  ['distributor_to_reseller', /\b(?:our )?distributors?[^.]{0,60}\b(?:sell|supply|serve|support)[^.]{0,30}\b(?:resellers?|partners?|dealers?)\b/i],
  ['value_added_distribution', /\b(value[- ]added distributor|master distributor|distribution partner program(?:me)?|VAD\b)\b/i],
];

/**
 * Enterprise incentive machinery. Engages the `deep_mdf` gap: Introw automates commission
 * and SPIFF, and names rebate accrual, co-op claims and proof-of-performance as outside
 * its design. MDF alone is not enough — Introw ships an MDF add-on.
 */
const INCENTIVE_COMPLEXITY: [string, RegExp][] = [
  ['rebate_program', /\b(rebate (?:program(?:me)?|structure|scheme)|back[- ]end (?:margin|rebate)|volume rebate|growth rebate|accrual)\b/i],
  ['coop_claims', /\b(co-?op (?:funds?|marketing|program(?:me)?)|proof of performance|POP claim|claim submission|fund request approval)\b/i],
  ['tcma', /\b(through[- ]channel marketing|syndicated (?:content|campaigns?)|partner marketing automation|to-?through[- ]partner marketing)\b/i],
];

/**
 * Federated governance: several partner organisations rather than one partner function.
 * Engages the `decentralised_governance` gap.
 */
const DECENTRALISED: [string, RegExp][] = [
  ['regional_programmes', /\b(?:partner program(?:me)?s?|channel program(?:me)?s?)[^.]{0,40}\b(?:by|per|in each) (?:region|country|geograph|market)\b/i],
  ['contact_your_regional', /\b(contact your (?:regional|local|country) (?:partner |channel )?(?:manager|team|office)|regional partner (?:manager|team|portal))\b/i],
  ['business_unit_programmes', /\b(?:each|our) (?:business unit|division|brand)[^.]{0,40}\b(?:partner|channel) program(?:me)?\b/i],
];

/**
 * Partner infrastructure the company built for itself — a university, a certification
 * catalogue, a partner-specific support organisation. Engages the `tcma` gap and, more
 * importantly, indicates a channel organisation with its own engineering and budget.
 */
const ENTERPRISE_INFRA: [string, RegExp][] = [
  ['partner_university', /\b(partner (?:university|academy)|channel academy|partner learning (?:center|centre|portal))\b/i],
  ['certification_estate', /\b(certification (?:paths?|tracks?|catalog(?:ue)?)|accreditation program(?:me)?|specializations? (?:available|required)|competenc(?:y|ies) (?:required|framework))\b/i],
  ['partner_support_org', /\b(partner (?:support|success) (?:team|organi[sz]ation|desk|helpline)|dedicated (?:partner|channel) (?:account manager|success manager))\b/i],
];

/**
 * Positive: the operational objects Introw provides, visible on the company's own
 * surfaces. Their presence means the company already does this work — manually, or on a
 * platform it may be willing to replace.
 */
const OPERATIONAL_ARTIFACTS: [string, RegExp][] = [
  ['deal_registration', /\b(deal registration|register (?:a |your )?deal|opportunity registration|lead registration|deal[- ]?reg\b|deal ?registratie|projektregistrierung|enregistrement d'affaire)\b/i],
  ['partner_onboarding', /\b(partner (?:onboarding|application|sign[- ]?up)|apply to (?:the |our )?partner|join our partner|partner worden|partner werden|devenir partenaire)\b/i],
  ['simple_tiers', /\b((?:gold|silver|bronze|platinum|registered|authoriz?ed|certified|premier) partner|partner (?:tiers?|levels?)|partnerniveau|partnerstufen)\b/i],
  ['commission_simple', /\b(partner commission|referral (?:fee|commission)|revenue share|commission structure|marge revendeur|partnerprovision)\b/i],
  ['partner_portal', /\b(partner portal|partner login|partner hub|espace partenaires?|partnerportaal|partnerportal)\b/i],
  ['enablement', /\b(partner (?:enablement|resources|toolkit|assets)|co-?branded (?:content|materials)|sales enablement for partners)\b/i],
];

function scan(text: string, rules: [string, RegExp][]): { id: string; match: string }[] {
  const out: { id: string; match: string }[] = [];
  for (const [id, re] of rules) {
    const m = re.exec(text);
    if (m) out.push({ id, match: m[0].slice(0, 140) });
  }
  return out;
}

/* ──────────────────────────────────────────────────── the assessment ───── */

export interface SuitabilityInput {
  domain: string;
  pages: { url: string; text: string; retrievedAt: string; httpStatus: number }[];
  urlInventory: string[];
  classification: ClassifyResult | null;
  operator: OperatorResolution | null;
  scale: ScaleAssessment | null;
  platform: { vendor: string; host: string; cname: string[] } | null;
  reachable: boolean;
  /** Distributors publicly listing this company among the brands they carry. */
  distributorSightings?: DistributorSighting[];
}

const CHANNEL_REAL = new Set(['transacting', 'mixed']);

export function assessSuitability(input: SuitabilityInput): SuitabilityResult {
  const now = new Date().toISOString();
  const positive: SuitabilitySignal[] = [];
  const negative: SuitabilitySignal[] = [];
  const unknowns: string[] = [];
  const blockers: string[] = [];
  const research: SuitabilityResult['researchNeeded'] = [];

  const done = (state: SuitabilityState, confidence: Confidence, rule: string, rationale: string): SuitabilityResult =>
    ({ state, confidence, rule, rationale, positive, negative, unknowns, blockers, researchNeeded: research, evaluatedAt: now });

  /* ── preconditions: suitability is only asked of a real channel ────────── */
  if (!input.reachable) {
    blockers.push('site could not be retrieved');
    return done('unknown', 'low', 'blocked', 'The site could not be retrieved, so no operating-model evidence exists. This is a blocked retrieval, not an absence of channel.');
  }
  const commerciality = input.classification?.commerciality ?? 'unknown';
  if (!CHANNEL_REAL.has(commerciality)) {
    return done('unknown', 'low', 'channel_not_established',
      `Channel reality is "${commerciality}". Suitability is only meaningful once a transacting channel is established — asking it earlier would let a suitability verdict stand in for a channel verdict.`);
  }

  /* ── ownership: someone else's programme is not an Introw account ──────── */
  const dir = input.operator?.direction ?? 'unknown';
  if (dir === 'channel_participant') {
    blockers.push('evidence describes participation in another vendor\'s programme');
    return done('incompatible', 'medium', 'participant_not_operator',
      `The channel evidence here belongs to ${input.operator?.participatesIn.map((p) => p.owner).join(', ') || 'another vendor'}. Introw is bought by the organisation that runs a programme, not by one that joins one.`);
  }
  if (dir === 'distributed_vendor') {
    research.push({
      field: 'programme_ownership',
      reason: 'products move through distribution, but no invitation to a programme this company runs was found',
      method: 'check whether the company maintains its own partner agreement, portal or registration process, or whether the distributor owns those relationships',
    });
    unknowns.push('whether the company manages downstream partners directly or the distributor does');
  }
  if (dir === 'unknown') {
    unknowns.push('direction of the channel relationship');
    research.push({ field: 'operator_direction', reason: 'no first-person invitation and no membership language observed', method: 'read the partner page and determine whether the company is inviting partners or describing its own memberships' });
  }

  /* ── structural dimensions ─────────────────────────────────────────────── */
  const text = input.pages.map((p) => p.text).join('\n').slice(0, 120000);
  const pageOf = (needle: string) => input.pages.find((p) => p.text.includes(needle.slice(0, 40)))?.url ?? `https://${input.domain}/`;

  // Counterparty evidence of distribution. Measured as the strongest available structural
  // discriminator: 1 of 16 known customers versus 10 of 14 hypothesised poor-fit
  // programmes. It is invisible on the vendor's own pages and plain on the distributor's.
  for (const sighting of input.distributorSightings ?? []) {
    negative.push({
      dimension: 'channel_depth', polarity: 'negative',
      claim: `${sighting.distributor} publicly lists this company among the brands it distributes, so the channel is at least partly distribution-mediated`,
      quote: sighting.brandAsListed,
      sourceUrl: sighting.sourceUrl,
      relatesTo: 'multi_tier_governance',
      confidence: 'medium',
    });
  }

  for (const hit of scan(text, TWO_TIER)) {
    negative.push({ dimension: 'channel_depth', polarity: 'negative', claim: 'the company sells through a distribution tier rather than direct to the transacting partner', quote: hit.match, sourceUrl: pageOf(hit.match), relatesTo: 'multi_tier_governance', confidence: 'medium' });
  }
  for (const hit of scan(text, INCENTIVE_COMPLEXITY)) {
    negative.push({ dimension: 'incentive_complexity', polarity: 'negative', claim: 'partner economics extend beyond commission into rebate, co-op or through-channel marketing machinery', quote: hit.match, sourceUrl: pageOf(hit.match), relatesTo: 'deep_mdf', confidence: 'medium' });
  }
  for (const hit of scan(text, DECENTRALISED)) {
    negative.push({ dimension: 'governance_centralisation', polarity: 'negative', claim: 'the programme appears to be run separately per region or business unit rather than by one partner function', quote: hit.match, sourceUrl: pageOf(hit.match), relatesTo: 'decentralised_governance', confidence: 'medium' });
  }
  for (const hit of scan(text, ENTERPRISE_INFRA)) {
    negative.push({ dimension: 'enterprise_infrastructure', polarity: 'negative', claim: 'the company has built partner infrastructure of its own beyond what a platform provides', quote: hit.match, sourceUrl: pageOf(hit.match), relatesTo: 'tcma', confidence: 'low' });
  }
  for (const hit of scan(text, OPERATIONAL_ARTIFACTS)) {
    positive.push({ dimension: 'operational_artifacts', polarity: 'positive', claim: 'an operational object Introw provides is already in use here', quote: hit.match, sourceUrl: pageOf(hit.match), relatesTo: hit.id, confidence: 'medium' });
  }
  if (dir === 'channel_operator' || dir === 'both') {
    positive.push({ dimension: 'ownership', polarity: 'positive', claim: 'the company runs the programme itself', sourceUrl: `https://${input.domain}/`, relatesTo: 'crm_native_sync', confidence: input.operator?.confidence ?? 'medium' });
  }

  /* ── interactions, not addition ────────────────────────────────────────── */
  const dims = (arr: SuitabilitySignal[]) => new Set(arr.map((s) => s.dimension));
  const negDims = dims(negative);
  const posDims = dims(positive);
  const artifactCount = new Set(positive.filter((p) => p.dimension === 'operational_artifacts').map((p) => p.relatesTo)).size;

  const distributorCount = new Set((input.distributorSightings ?? []).map((d) => d.distributor)).size;
  const multiTier = negDims.has('channel_depth');
  const complexIncentives = negDims.has('incentive_complexity');
  const decentralised = negDims.has('governance_centralisation');
  const enterpriseInfra = negDims.has('enterprise_infrastructure');
  const structuralNegatives = [multiTier, complexIncentives, decentralised].filter(Boolean).length;

  unknowns.push('partner-team size', 'partner-sourced revenue share', 'partner adoption');
  if (!input.platform) unknowns.push('incumbent partner platform (no fingerprint found — not evidence that none is in use)');

  /* An enterprise operating model is a COMBINATION, not any single trait.
     Multi-tier alone is common in hardware and does not preclude a direct programme;
     it is multi-tier PLUS enterprise incentives PLUS federated governance that
     describes an operating model outside Introw's design. */
  if (structuralNegatives >= 2 && enterpriseInfra) {
    return done('weak', 'medium', 'enterprise_operating_model',
      `Three or more structural markers of an enterprise channel co-occur: ${[...negDims].join(', ')}. Individually each is common; together they describe multi-tier governance with its own incentive machinery and infrastructure, which the supplied material places outside Introw's design. This is a demotion on operating model, not on size.`);
  }
  if (structuralNegatives >= 2) {
    return done('weak', 'low', 'multiple_structural_negatives',
      `${structuralNegatives} structural markers co-occur (${[...negDims].join(', ')}) with ${artifactCount} of Introw's operational objects visible. Plausibly outside the design centre, but the evidence is thinner than the enterprise case — worth a human look before discarding.`);
  }
  // Distribution across SEVERAL distributors describes a channel whose reseller
  // relationships are mediated rather than direct — the shape Introw's customer evidence
  // does not contain. One distributor plus a real direct programme is the Cubbit shape.
  if (distributorCount >= 2 && !(artifactCount >= 4 && dir === 'channel_operator')) {
    return done('weak', 'medium', 'multi_distributor_mediated_channel',
      `${distributorCount} independent distributors publicly carry this company's products, and its own programme surfaces show ${artifactCount} of Introw's operational objects. A channel reached through several distributors places onboarding, credit and often registration with the distributor rather than the vendor. Measured base rate: 1 of 16 known Introw customers is distributor-carried, against 10 of 14 hypothesised poor-fit programmes.`);
  }
  if (multiTier && artifactCount >= 3 && (dir === 'channel_operator' || dir === 'both')) {
    return done('plausible', 'medium', 'distribution_alongside_direct_programme',
      `Distribution is present, but the company also runs its own programme with ${artifactCount} of the operational objects Introw provides. Manufacturers commonly do both, and Cubbit — a known customer carried by a distributor — is exactly this shape. The direct programme is the addressable part.`);
  }
  if (multiTier) {
    research.push({ field: 'direct_programme', reason: 'distribution present and no strong direct-programme evidence found', method: 'check whether resellers contract with the company or only with the distributor' });
    return done('research_required', 'low', 'distribution_tier_unresolved',
      'Distribution is present and it is unresolved whether the company also runs a direct programme. That is the difference between an addressable account and a distributor\'s account.');
  }
  if (artifactCount >= 4 && (dir === 'channel_operator' || dir === 'both') && !structuralNegatives) {
    return done('strong', 'medium', 'direct_programme_with_operational_objects',
      `The company runs its own programme and ${artifactCount} of the operational objects Introw provides are already visible (${[...new Set(positive.filter((p) => p.dimension === 'operational_artifacts').map((p) => p.relatesTo))].join(', ')}), with no structural markers of an enterprise operating model. This is the shape the supplied customer evidence describes.`);
  }
  if (artifactCount >= 2 && (dir === 'channel_operator' || dir === 'both')) {
    return done('plausible', 'medium', 'direct_programme_partial_objects',
      `The company runs its own programme with ${artifactCount} operational objects visible and no structural markers against it. Fewer artifacts than the strongest customer shape, which may reflect a smaller programme or simply less publication.`);
  }
  if (posDims.size === 0 && negDims.size === 0) {
    research.push({ field: 'operating_model', reason: 'a transacting channel is established but no operating-model evidence was found on the pages retrieved', method: 'read the partner programme page and record channel depth, incentive model and governance' });
    return done('unknown', 'low', 'no_operating_model_evidence',
      'Channel reality is established but nothing about the operating model was observable. This is missing information, not a weak fit.');
  }
  return done('plausible', 'low', 'partial_evidence',
    `Some suitability evidence in both directions (${positive.length} positive, ${negative.length} negative) but not enough of either to be decisive.`);
}
