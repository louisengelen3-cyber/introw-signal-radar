/**
 * The dossier — the product's primary object.
 *
 * Design rules, each traceable to a measured failure rather than a preference:
 *
 *  1. OBSERVATION IS NEVER INTERPRETATION. Every observation keeps its verbatim quote and
 *     its source. Interpretations reference observations; they never replace them, and a
 *     reader can always get back to the words on the page.
 *
 *  2. UNKNOWN IS A RESULT. There is no state anywhere in this file meaning "absent". Not
 *     found is `unknown`, and `unknown` is displayed, not hidden.
 *
 *  3. MACHINE AND HUMAN VERDICTS ARE SEPARATE FIELDS. `machineInterpretation` and
 *     `humanReview` never overwrite each other. A blind reviewer beat the automated model
 *     6-0 on the hardest cases; merging the two would erase the only signal that worked.
 *
 *  4. VOLUME IS DIAGNOSED, NOT REWARDED. `publicationDiagnostics` travels with every
 *     interpretation so the volume confound that broke Phase 3 stays visible.
 *
 *  5. NO SCORE, NO RANK, NO ORDERING. There is deliberately no numeric field that could be
 *     sorted into a leaderboard.
 */

import type { CategoryClassification } from '../category/classify.js';
import type { DirectoryFinding } from './directory.js';
import type { CrmBundle } from '../jobs/bundle.js';
import type { JobEnrichment } from '../jobs/types.js';
import type { SourceHealth } from '../evidence/positioning.js';

export type EvidenceStrength = 'confirmed' | 'strong_proxy' | 'weak_proxy' | 'unknown';

/** A single thing we saw, in the words it was published in. */
export interface Observation {
  id: string;
  /** Verbatim. Never paraphrased, never cleaned beyond whitespace. */
  quote: string;
  sourceUrl: string;
  sourceType: string;
  /** When the source was fetched. Distinct from when the claim became true, which we never know. */
  retrievedAt: string;
  /** Present only when the SOURCE itself carries a date. */
  publishedAt?: string;
  strength: EvidenceStrength;
  /** What this observation licenses. */
  proves: string;
  /** What a reader might wrongly take from it. Mandatory — the reviewer used these. */
  doesNotProve: string;
  /** Set by deduplication: how many times this same claim was seen. */
  duplicateCount?: number;
  alsoSeenAt?: string[];
}

/** The three constructs, measured separately and never summed. */
export type ConstructName = 'commercial_materiality' | 'operational_ownership' | 'operational_surface';

export interface ConstructPanel {
  construct: ConstructName;
  /** Free-form per construct, but never numeric and never comparable across constructs. */
  state: string;
  evidence: Observation[];
  counterEvidence: Observation[];
  /** Named gaps, in plain language. Always populated; there is always something unknown. */
  unknown: string[];
  sourceQuality: {
    distinctClaims: number;
    independentSources: number;
    /** Kept beside the state so a reader can see whether volume is doing the work. */
    observedItems: number;
  };
  whyItMatters: string;
  whyItMayNotMatter: string;
}

/** One company may run several programmes; flattening them loses the commercial shape. */
export type ProgrammeKind =
  | 'reseller' | 'referral' | 'implementation' | 'services' | 'agency'
  | 'technology' | 'integration' | 'distributor' | 'strategic_alliance' | 'affiliate' | 'unclassified';

export interface Programme {
  kind: ProgrammeKind;
  /** As the company names it, when it names it. */
  publishedName: string | null;
  evidence: Observation[];
  /** Workflows visibly exposed for THIS programme. */
  surfaces: SurfaceFinding[];
}

export type SurfaceKind =
  | 'partner_recruitment' | 'application' | 'onboarding' | 'enablement' | 'certification'
  | 'lead_submission' | 'referral_submission' | 'deal_registration' | 'co_selling'
  | 'portal' | 'partner_pipeline' | 'programme_tiers' | 'partner_resources';

/**
 * Three states, and the difference between the last two is the whole point:
 * `not_observed` means we looked at surfaces where it would appear and did not see it;
 * `unknown` means we could not look. Neither means it does not exist.
 */
export interface SurfaceFinding {
  surface: SurfaceKind;
  state: 'confirmed' | 'not_observed' | 'unknown';
  evidence: Observation[];
}

export type CrmState = 'hubspot_confirmed' | 'salesforce_confirmed' | 'other_crm_confirmed' | 'unknown' | 'error';
export type PrmState = 'introw_confirmed' | 'competitor_prm_confirmed' | 'other_prm_confirmed' | 'unknown' | 'error';
export type PeopleState =
  | 'partner_owner_confirmed' | 'two_plus_relevant_people_confirmed' | 'one_relevant_person_confirmed'
  | 'currentness_uncertain' | 'employer_uncertain' | 'unknown';

export interface SystemsPanel {
  crm: {
    state: CrmState;
    evidence: Observation[];
    note: string;
    /**
     * Per-vendor evidence from every source that spoke, with levels preserved. Present when
     * anything was found; the flat `state` above stays for callers that only need one word.
     */
    bundle?: CrmBundle;
  };
  prm: {
    state: PrmState;
    vendor: string | null;
    evidence: Observation[];
    /** Stated on every competitor-PRM finding, because the inference is tempting and wrong. */
    note: string;
  };
}

export interface PeoplePanel {
  state: PeopleState;
  people: { name: string | null; title: string; sourceUrl: string; currentness: 'claimed' | 'unknown' }[];
  note: string;
}

export type TemporalState = 'first_observation' | 'no_verified_change' | 'verified_change' | 'source_changed' | 'source_error';

export interface TemporalPanel {
  state: TemporalState;
  baselineAt: string | null;
  lastCheckedAt: string | null;
  changes: {
    what: string;
    previousState: string;
    newState: string;
    observedBetween: [string, string];
    sourceUrl: string;
    /** Separated deliberately: the fact, then a reading of it that a human may reject. */
    commercialInterpretation: string;
    confidence: 'low' | 'medium' | 'high';
  }[];
  note: string;
}

/** Two sources disagree. Neither is silently preferred; the reviewer decides. */
export interface Contradiction {
  topic: string;
  positionA: { claim: string; evidence: Observation[] };
  positionB: { claim: string; evidence: Observation[] };
  effect: string;
}

/** The smallest question that would move the decision. Not "do more research". */
export interface ResearchTask {
  question: string;
  whyItBlocks: string;
  whereToLook: string;
  /** Which panel it would resolve, so the UI can attach it. */
  resolves: string;
}

/** Retained on every interpretation so the volume confound stays auditable (§17). */
export interface PublicationDiagnostics {
  observationCount: number;
  distinctClaimCount: number;
  independentSourceCount: number;
  publicationDensity: 'rich' | 'moderate' | 'sparse' | 'none';
  constructEvidenceCount: number;
  /** True when the interpretation would change if repetition were counted as evidence. */
  volumeSensitive: boolean;
  /** Observations discarded because they could not be attributed to the partner motion. */
  unattributableDropped: number;
  /** Programme, workflow and directory findings — evidence that is not a probe observation. */
  supportingFindingCount: number;
}

/**
 * Advisory machine states. Deliberately NOT an ordering, and deliberately not named for fit:
 * the previous top state was called `high_fit`, which the hardening report recommended
 * deleting precisely because the name invites a ranking the evidence cannot support. These
 * name what the EVIDENCE looks like, not how good the prospect is.
 */
export type MachineState =
  | 'strong_evidence' | 'plausible' | 'research' | 'under_observed'
  | 'weak_evidence' | 'suppression_candidate';

export interface MachineInterpretation {
  state: MachineState;
  /** Always rendered next to the state. This is advisory output, not a verdict. */
  disclaimer: string;
  reasons: string[];
  diagnostics: PublicationDiagnostics;
}

export type HumanOutcome = 'promote' | 'research' | 'watch' | 'reject' | 'suppress';

export interface HumanReview {
  outcome: HumanOutcome;
  confidence: 'low' | 'medium' | 'high';
  rationale: string | null;
  reviewedAt: string;
  reviewer: string;
  /** Seconds from opening the dossier to deciding. Feeds the efficiency measurement. */
  decisionSeconds?: number;
  /** Sources the reviewer opened outside the dossier, if recorded. */
  externalPagesOpened?: number;
}

export type EvidenceCoverage = 'rich' | 'moderate' | 'sparse' | 'none';

export interface Dossier {
  /**
   * What the additive recovery layer contributed, when it ran. `null` means recovery was
   * disabled or base evidence was already sufficient. Present for provenance and audit
   * (§11) — it records which pages recovery reached, not a separate set of claims.
   */
  recovery?: import('../recovery/union.js').RecoveryContribution | null;
  /**
   * CRM forensics: what could be established about this company's CRM from the full public
   * evidence surface, with explicit temporal semantics. Additive — it never overwrites
   * `systems.crm`, so the two layers can be compared.
   */
  crmForensics?: import('../crm/research.js').CrmResearchResult | null;
  domain: string;
  companyName: string | null;
  /** Verbatim self-description, so the reader sees what the company says it is. */
  selfDescription: { text: string; sourceUrl: string } | null;
  geography: string | null;
  builtAt: string;
  /**
   * The oldest retrieval behind this dossier. Shown as "last checked" instead of `builtAt`,
   * because the HTTP layer caches without expiry and assembly time is not observation time.
   */
  oldestEvidenceAt: string;

  category: CategoryClassification & {
    /** Asserted business data, reported beside the inference and never merged into it. */
    knownCompetitorList: { onList: boolean; lastReviewed: string };
  };

  constructs: ConstructPanel[];
  programmes: Programme[];
  /** Kept top-level so a workflow claim always has its evidence stored beside it. */
  surfaces: SurfaceFinding[];
  /**
   * Evidence drawn from the company's own current job adverts.
   *
   * Deliberately does NOT feed the three constructs, evidence coverage, or the machine
   * interpretation: a company that publishes more vacancies must not become a better
   * prospect, and hiring is never read as buying intent. It enriches the CRM panel and adds
   * its own section.
   */
  jobEvidence?: JobEnrichment;
  /**
   * A published list of partner organisations. Kept as its own field because it is a
   * different KIND of evidence from everything else: the partners describe themselves, so
   * none of the usual programme vocabulary appears, and a company that names two dozen
   * agencies is making a claim that would be expensive to fake. The count is always a lower
   * bound.
   */
  partnerDirectory: DirectoryFinding & { observation: Observation | null };
  systems: SystemsPanel;
  people: PeoplePanel;
  temporal: TemporalPanel;

  contradictions: Contradiction[];
  researchTasks: ResearchTask[];

  /** How much public evidence exists. Explicitly NOT a fit signal (§16). */
  evidenceCoverage: EvidenceCoverage;
  coverageNote: string;

  /** Per-source retrieval outcome. A failure here is never commercial evidence. */
  sourceHealth: { url: string; health: SourceHealth; status?: number }[];

  /** Machine-generated, evidence-bounded. Every factual clause must be attributable. */
  commercialSummary: string;

  machineInterpretation: MachineInterpretation;
  /** Null until a human decides. Never written by the machine. */
  humanReview: HumanReview | null;

  /** Distinguishes real observation from development fixtures (§62). */
  provenance: 'real_observation' | 'fixture' | 'simulation';
}
