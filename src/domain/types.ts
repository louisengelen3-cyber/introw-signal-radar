/**
 * Introw Radar — domain model.
 *
 * Two rules govern every type in this file, both earned by Phase 0 measurement:
 *
 *  1. A value is never stored bare. It is stored with what established it, when,
 *     and how strongly. `Fact<T>` is the only way a claim enters the model.
 *  2. `unknown` is a value, not a gap. It is the expected state for most fields
 *     on most accounts, and it is distinct from `blocked` (we could not look)
 *     and from `contradicted` (we found positive evidence of the opposite).
 */

/* ────────────────────────────────────────────────────────── evidence core ── */

/**
 * What kind of thing established a claim.
 * `confirmed` requires a first-party artifact on the subject's own property.
 * A job-description mention is never `confirmed` — see docs/REVISED_ASSUMPTIONS.md R1.
 */
export type EvidenceState =
  | 'confirmed'
  | 'strong_proxy'
  | 'weak_proxy'
  | 'contradicted'
  | 'unknown'
  | 'blocked';

/** Ordered. Higher wins when two observations disagree. */
export const EVIDENCE_RANK: Record<EvidenceState, number> = {
  contradicted: 5,
  confirmed: 4,
  strong_proxy: 3,
  weak_proxy: 2,
  blocked: 1,
  unknown: 0,
};

export type Confidence = 'high' | 'medium' | 'low';

/**
 * How much authority the source class carries. A discovery-only source may surface
 * a candidate but may never carry a claim that drives qualification.
 */
export type SourceAuthority =
  | 'subject_first_party' // the company's own site, DNS, or certificates
  | 'counterparty' // a distributor/partner naming the company
  | 'vendor_hosted' // a PRM/directory vendor serving the company's surface
  | 'reputable_third_party'
  | 'aggregator'
  | 'discovery_only';

export interface SourceRef {
  url: string;
  authority: SourceAuthority;
  /** What this specific retrieval proves — not what we wish it proved. */
  establishes: string;
  /** When the underlying fact was observed to be true. */
  observedAt: string;
  /** When we fetched it. Never interchangeable with observedAt. */
  retrievedAt: string;
  httpStatus?: number;
  /** Set when the fetch was refused rather than empty. */
  blocked?: boolean;
}

/** The only way a claim enters the model. */
export interface Fact<T> {
  value: T | null;
  state: EvidenceState;
  confidence: Confidence;
  /** How the value was derived, in words a reviewer can audit. */
  method: string;
  sources: SourceRef[];
  observedAt: string | null;
  /** Present when this fact replaced an earlier one. Raw is never destroyed. */
  supersedes?: { value: unknown; observedAt: string | null; reason: string };
}

export function unknownFact<T>(method: string, reason = 'no evidence found'): Fact<T> {
  return { value: null, state: 'unknown', confidence: 'low', method: `${method} — ${reason}`, sources: [], observedAt: null };
}

export function blockedFact<T>(method: string, source: SourceRef): Fact<T> {
  return { value: null, state: 'blocked', confidence: 'low', method: `${method} — retrieval refused`, sources: [source], observedAt: null };
}

/* ─────────────────────────────────────────────────── channel taxonomy ───── */

/**
 * Commerciality classes. `unknown` is never forced into another class.
 * These are the classes the Phase 1 mandate defines; the classifier may only
 * emit one of these.
 */
export type Commerciality =
  | 'transacting'
  | 'mixed'
  | 'integration_only'
  | 'affiliate_only'
  | 'strategic_only'
  | 'unknown';

/** The motion a programme runs. A company may run several at once. */
export type PartnerMotion =
  | 'reseller'
  | 'referral'
  | 'distributor'
  | 'dealer'
  | 'installer'
  | 'msp'
  | 'agency'
  | 'system_integrator'
  | 'solution_partner'
  | 'accountant'
  | 'technology'
  | 'affiliate'
  | 'strategic_alliance';

/** Structured evidence types. Each carries its own commerciality implication. */
export type ChannelEvidenceClass =
  | 'PROGRAM_PAGE'
  | 'PARTNER_DIRECTORY'
  | 'DEAL_REGISTRATION'
  | 'PARTNER_PORTAL'
  | 'RESELLER_LANGUAGE'
  | 'REFERRAL_LANGUAGE'
  | 'DEALER_LANGUAGE'
  | 'INSTALLER_LANGUAGE'
  | 'DISTRIBUTOR_LANGUAGE'
  | 'PARTNER_TIERS'
  | 'CERTIFICATION'
  | 'COMMISSION'
  | 'ONBOARDING'
  | 'ENABLEMENT'
  | 'PRM_FINGERPRINT'
  | 'DISTRIBUTOR_CARRIES' // a distributor lists this company as a vendor it sells
  | 'TECH_INTEGRATION'
  | 'APP_MARKETPLACE'
  | 'AFFILIATE'
  | 'STRATEGIC_ALLIANCE'
  | 'CUSTOMER_LOGOS'
  | 'OTHER';

/** Which way a piece of evidence pushes the commerciality verdict. */
export type CommercialityImplication = 'transacting' | 'integration' | 'affiliate' | 'strategic' | 'neutral';

export interface ChannelEvidence {
  companyId: string;
  evidenceClass: ChannelEvidenceClass;
  /** The specific thing observed, quoted or named. Never a paraphrase of a score. */
  claim: string;
  /** Verbatim supporting text where the evidence is textual. */
  quote?: string;
  source: SourceRef;
  strength: 'strong' | 'weak';
  implication: CommercialityImplication;
  /** Named risk this evidence class is known to carry, e.g. equity-partner collision. */
  contaminationRisk: string | null;
  motions: PartnerMotion[];
  /** Language the evidence was found in — English-only detection would hide the EU market. */
  lang?: string;
}

/* ─────────────────────────────────────────────────────── partner count ──── */

/**
 * These are not interchangeable and must never render identically.
 * Phase 0 measured a 22% undercount on Cumulocity's public directory versus its
 * own stated figure, which is why `directory_count` is labelled a lower bound.
 */
export type PartnerCountType =
  | 'exact_public' // the company states a precise number
  | 'directory_count' // enumerated from a directory we could fully page
  | 'lower_bound' // enumerated, but we know the enumeration was partial
  | 'approximate' // "500+ partners" style copy
  | 'unknown';

export interface PartnerCount {
  value: number | null;
  countType: PartnerCountType;
  /** Did we reach the end of the directory, or stop early? */
  enumerationComplete: boolean | null;
  /** What the count counts — partners, dealers, installers, agencies. */
  unit: string | null;
  source: SourceRef | null;
  observedAt: string | null;
  confidence: Confidence;
}

/* ─────────────────────────────────────────────────────────── entities ───── */

export interface CompanyIdentity {
  id: string;
  canonicalName: string;
  domain: string | null;
  country: string | null;
  industry: string | null;
  /** Parent or operating entity when the programme belongs to a different legal entity. */
  parentOf?: string;
  childOf?: string;
  aliases: string[];
  /** Explicit, because name→domain resolution is a measured error source. */
  identityConfidence: Confidence;
  identityMethod: string;
  identityState: 'resolved' | 'ambiguous' | 'unresolved';
}

export interface PartnerProgram {
  companyId: string;
  commerciality: Fact<Commerciality>;
  motions: Fact<PartnerMotion[]>;
  partnerCount: PartnerCount;
  portal: Fact<'present' | 'absent_unverifiable'>;
  dealRegistration: Fact<'present' | 'absent_unverifiable'>;
  tiers: Fact<boolean>;
  certification: Fact<boolean>;
  commission: Fact<boolean>;
  geography: Fact<string[]>;
  /** Where the programme sits on the build-out curve, when observable. */
  maturity: Fact<'launching' | 'operating' | 'scaling' | 'unknown'>;
  evidence: ChannelEvidence[];
  lastVerifiedAt: string;
}

export type CrmVendor = 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'dynamics' | 'attio' | 'other';
export type PrmVendor = string;

export interface Environment {
  companyId: string;
  crm: Fact<CrmVendor>;
  /** Compatible with Introw, given the detected CRM. `unknown` never means incompatible. */
  crmCompatibility: 'compatible_confirmed' | 'compatible_proxy' | 'unknown' | 'incompatible_confirmed';
  prm: Fact<PrmVendor>;
  technical: ChannelEvidence[];
}

/* ─────────────────────────────────────────────────────────── people ─────── */

export type Persona =
  | 't1_partner_leadership'
  | 't1_partner_revops'
  | 't2_partner_marketing'
  | 't2_cro_vp_sales'
  | 't2_coo_founder'
  | 't3_partner_ic'
  | 't3_growth_bd'
  | 'anti_hr_business_partner'
  | 'anti_equity_partner'
  | 'anti_corp_dev'
  | 'anti_marketplace_integrations'
  | 'anti_affiliate'
  | 'unclassified';

export type RoleCurrency = 'current_verified' | 'current_claimed' | 'historical' | 'unknown';

export interface Person {
  id: string;
  companyId: string;
  name: string | null;
  rawTitle: string;
  normalizedTitle: string;
  persona: Persona;
  /** What they are accountable for, where stated. A title is not a remit. */
  remit: string | null;
  roleCurrency: RoleCurrency;
  roleStartedAt: string | null;
  roleEndedAt: string | null;
  source: SourceRef;
  confidence: Confidence;
  verifiedAt: string | null;
  /** Which provider or public source produced this, for later attribution and cost control. */
  provider: string;
}

export type TeamSizeState =
  | 'verified'
  | 'partially_observed'
  | 'manually_verified'
  | 'provider_derived'
  | 'unknown';

export interface PartnerOrganisation {
  companyId: string;
  people: Person[];
  teamSize: number | null;
  teamSizeState: TeamSizeState;
  confidence: Confidence;
  observedAt: string | null;
}

/**
 * Demoted from primary ICP variable to derived context (R3).
 * Only computed when BOTH sides are independently reliable; otherwise `unavailable`
 * with the reason stated, and the account is never penalised for it.
 */
export interface OperationalLoad {
  numerator: number | null;
  numeratorType: PartnerCountType;
  denominator: number | null;
  denominatorState: TeamSizeState;
  ratio: number | null;
  availability: 'available' | 'unavailable';
  unavailableReason: string | null;
  confidence: Confidence;
  calculatedAt: string | null;
}

/* ─────────────────────────────────────────────────────────── signals ────── */

export type SignalCategory =
  | 'structural_growth'
  | 'structural_discontinuity'
  | 'partner_program'
  | 'leadership'
  | 'crm'
  | 'prm'
  | 'channel_event'
  | 'context';

export interface Signal {
  id: string;
  companyId: string;
  type: string;
  category: SignalCategory;
  headline: string;
  /** When the thing happened. Null when only our observation date is known. */
  effectiveAt: string | null;
  /** When we saw the state that implies it. */
  observedAt: string;
  firstSeenAt: string;
  lastSeenAt: string;
  previousValue?: string | number | null;
  currentValue?: string | number | null;
  confidence: Confidence;
  evidence: SourceRef[];
  /** Stated explicitly so the UI cannot over-claim. */
  commercialInterpretation: string;
  forbiddenInterpretation: string;
}

/* ────────────────────────────────────────────── research & relationship ─── */

export interface ResearchTask {
  id: string;
  companyId: string;
  missingField: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  status: 'open' | 'in_review' | 'resolved' | 'blocked';
  /** How a human would resolve it, so the task is actionable rather than a complaint. */
  suggestedMethod: string;
  createdAt: string;
  resolvedAt?: string;
}

/**
 * Never derive `no_relationship` from absence of evidence — R6.
 * The absence of an Introw fingerprint means `no_evidence_observed`, nothing more.
 */
export type RelationshipState =
  | 'existing_introw_evidence'
  | 'possible_existing_relationship'
  | 'no_evidence_observed'
  | 'unknown';

/* ────────────────────────────────────────────────────── qualification ───── */

/** Explicit dimensions. Deliberately not a 0-100 score — no validated weights exist. */
export interface Qualification {
  channelReality: 'confirmed' | 'strong' | 'weak' | 'unknown' | 'contradicted';
  commerciality: Commerciality;
  /** Phase 2: whose programme is this? Never inferred from commerciality. */
  channelDirection: ChannelDirection;
  /** Phase 2: is this operating model appropriate for Introw? A separate question again. */
  suitability: SuitabilityState;
  programScale: 'large' | 'meaningful' | 'small' | 'unknown';
  environment: Environment['crmCompatibility'];
  organisation: 'verified' | 'partial' | 'unknown';
  timing: 'strong' | 'moderate' | 'none_observed' | 'unknown';
  evidenceConfidence: Confidence;
  researchState: 'resolved' | 'research_needed' | 'blocked';
  relationship: RelationshipState;
  /** Populated when a suppression rule fired. Suppression always states its reason. */
  suppressed: { reason: string; rule: string } | null;
}

/* ──────────────────────────────────── Phase 2: ownership and suitability ── */

/**
 * Which side of a channel relationship the company is on.
 * Separate from `Commerciality`: a company can have a real transacting channel and still
 * be the wrong party — the Deloitte case, where the reseller language belonged to SAP.
 */
export type ChannelDirection =
  | 'channel_operator'
  | 'channel_participant'
  | 'distributed_vendor'
  | 'both'
  | 'unknown';

export type ChannelRelationshipType =
  | 'OPERATES' | 'DISTRIBUTES' | 'RESELLS' | 'REFERS' | 'INSTALLS'
  | 'INTEGRATES' | 'AFFILIATE_OF' | 'STRATEGIC_ALLIANCE' | 'PARTICIPATES_IN';

/**
 * A relationship between two companies, so distributor-inversion evidence stays
 * evidence rather than becoming an unsupported company-level conclusion.
 */
export interface ChannelRelationshipRecord {
  sourceCompany: string;
  targetCompany: string | null;
  relationshipType: ChannelRelationshipType;
  direction: 'outbound' | 'inbound';
  /** The programme this relationship belongs to, where it can be identified. */
  programId?: string;
  evidence: SourceRef;
  quote?: string;
  confidence: Confidence;
  observedAt: string;
}

/**
 * Programme-level ownership. One company may own several programmes and participate in
 * others; attaching all evidence to the company loses that distinction, which is the
 * difference between "has partners" and "runs a programme Introw could serve".
 */
export interface ProgramOwnership {
  programId: string;
  /** The company that runs it. Null when ownership is genuinely unresolved. */
  operatorCompany: string | null;
  name: string | null;
  motions: PartnerMotion[];
  /** Surfaces evidencing this programme. */
  surfaces: string[];
  confidence: Confidence;
  method: string;
}

export type SuitabilityState = 'strong' | 'plausible' | 'weak' | 'incompatible' | 'unknown' | 'research_required';

export interface IntrowSuitability {
  state: SuitabilityState;
  confidence: Confidence;
  /** The named rule, so a reviewer can disagree with the reasoning rather than the label. */
  rule: string;
  rationale: string;
  positiveEvidence: { dimension: string; claim: string; sourceUrl: string; relatesTo: string }[];
  negativeEvidence: { dimension: string; claim: string; sourceUrl: string; relatesTo: string }[];
  unknowns: string[];
  blockers: string[];
  researchNeeded: { field: string; reason: string; method: string }[];
  evaluatedAt: string;
}

/** Suppression is always explicit and always states its reason. */
export interface SuppressionState {
  suppressed: boolean;
  rule: string | null;
  reason: string | null;
  /** Cold outbound is the thing suppressed; the account itself stays visible. */
  scope: 'cold_outbound' | 'all' | null;
}

export interface Account {
  identity: CompanyIdentity;
  program: PartnerProgram;
  environment: Environment;
  organisation: PartnerOrganisation;
  operationalLoad: OperationalLoad;
  signals: Signal[];
  research: ResearchTask[];
  qualification: Qualification;
  suitability: IntrowSuitability | null;
  relationships: ChannelRelationshipRecord[];
  programmes: ProgramOwnership[];
  suppression: SuppressionState;
  /** How this company entered the universe. Discovery source never scores. */
  discoveredVia: { mechanism: string; source: SourceRef }[];
}
