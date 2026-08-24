/**
 * The candidate model (mandate §3, §9–§13).
 *
 * A candidate is a company that discovery has earned the right to RESEARCH. It is not a
 * prospect, not a lead, and carries no fit judgement of any kind. The separation the product
 * depends on:
 *
 *   the discovery engine earns the right to surface a company
 *   the research engine earns the right to make claims
 *   the human earns the right to make the commercial decision
 *
 * Everything in this file belongs to the first line only.
 */
import type { QueryFamily } from './families.js';
import { familyConfidence } from './families.js';

/** How a candidate entered the system. Provenance, never qualification (§3). */
export interface DiscoveryPath {
  discoverySource: 'search_pattern' | 'partner_directory' | 'distributor_catalogue' | 'manual_seed';
  queryFamily: string;
  sourceURL: string;
  sourceLanguage: string;
  discoveredAt: string;
  /** What the family was looking for. A hypothesis to test, not a finding. */
  motionHypothesis: string;
}

/**
 * Identity certainty (§9). Deep research may run automatically only on `confirmed` or
 * high-confidence `probable`. Crawling the wrong company is worse than crawling nothing.
 */
export type EntityConfidence = 'confirmed' | 'probable' | 'ambiguous' | 'unresolved';

/** Where a candidate sits in the workflow (§39). Deliberately contains no priority. */
export type CandidateState =
  | 'new'
  | 'resolved'
  | 'researching'
  | 'dossier_ready'
  | 'rejected_pre_research'
  | 'quarantined';

/**
 * Why a candidate was dropped before research (§13).
 *
 * These are AUTOMATION EFFICIENCY decisions. None of them is a commercial negative, and none
 * may ever be rendered as one. "We did not research this" is not "this is a bad prospect",
 * and neither is the same as "partner motion unknown".
 */
export type DropReason =
  | 'not_a_company'          // glossary, template, forum, article
  | 'known_competitor'       // partner-tech / PRM category
  | 'consultant_or_agency'   // sells services about channels, does not operate one
  | 'directory_participant'  // listed in someone else's network, no operator evidence
  | 'duplicate'              // already known under another discovery path
  | 'wrong_entity';          // identity could not be resolved to the intended company

export interface CheapEvidence {
  /** Explainable rules only — no numeric score anywhere in this gate (§12). */
  signals: string[];
  /** The URL each signal came from, index-aligned with `signals`. */
  sources: string[];
  verdict: 'operator_evidence' | 'research_required' | 'drop';
  dropReason: DropReason | null;
  /** Plain-language reason a human can check. */
  rationale: string;
}

export interface Candidate {
  /** Entity key. Lowercased registrable domain — the deduplication unit (§10). */
  key: string;
  discoveredCompany: string;
  probableDomain: string;
  /** Every path that found this company. Multiple paths are ONE candidate, not three (§10). */
  paths: DiscoveryPath[];
  entityConfidence: EntityConfidence;
  candidateReason: string;
  state: CandidateState;
  cheapEvidence: CheapEvidence | null;
  dropReason: DropReason | null;
  /** Set once a dossier exists. Discovery never writes claims itself. */
  dossierBuiltAt: string | null;
}

/* ─────────────────────────────────────────────────────── cheap evidence ── */

/**
 * Signals that a page belongs to a company operating its own channel. Deliberately
 * conservative: each is something an operator publishes about its own programme, not
 * something a commentator writes about programmes in general.
 */
/**
 * Signals split by who can publish them.
 *
 * STRONG signals are things only the operator of a programme puts on its own site: an intake
 * step, partner-only infrastructure, a named tier structure. A journalist writing about
 * dealer programmes does not publish an application form.
 *
 * WEAK signals are vocabulary that commentators use just as freely — "dealer program",
 * "find a dealer". On their own they cannot separate an operator from an article about
 * operators, which is exactly the 34%-commentary failure mode measured in discovery.
 */
const STRONG_OPERATOR_SIGNALS: { re: RegExp; signal: string }[] = [
  { re: /\b(become|apply to be|apply as|apply now to be)\s+(a|an|our)\s+(partner|dealer|reseller|installer|distributor)\b/i, signal: 'publishes a partner application step' },
  { re: /(partner|händler|dealer|installateur|revendeur|återförsäljare|rivenditore)[\s-]?(werden|worden|aanmelden)\b/iu, signal: 'publishes a partner intake in local trade language' },
  { re: /\b(deal registration|partner portal|partnerportal|partner login|partner sign in)\b/i, signal: 'operates partner infrastructure' },
  { re: /\b(gold|silver|platinum|bronze|certified|authoriz?ed)\s+(partner|dealer|reseller|installer)\s+(tier|level|status|programme?)\b/i, signal: 'publishes a tier or certification structure' },
  { re: /\b(partner|dealer|reseller|installer)\s+application\s+(form|process)\b/i, signal: 'publishes an application process' },
];

const WEAK_OPERATOR_SIGNALS: { re: RegExp; signal: string }[] = [
  { re: /\b(find|locate)\s+(a|an|your)\s+\w{0,14}\s?(dealer|installer|distributor|partner|reseller)\b|\bwhere to buy\b/i, signal: 'operates a locator for its own network' },
  { re: /\b(partner|dealer|reseller)\s+(program(me)?|network)\b/i, signal: 'names a programme' },
  { re: /\b(gold|silver|platinum|bronze|certified|authoriz?ed)\s+(partner|dealer|reseller|installer)s?\b/i, signal: 'uses tier or certification vocabulary' },
];

/**
 * Pages that discuss channels without operating one. These are the dominant discovery false
 * positive: 34% of raw results in the source-recovery mandate.
 */
const COMMENTARY_SIGNALS: RegExp[] = [
  /\b(in (this|diesem) (article|artikel|blog)|what is a|was ist ein|glossary|glossar|definition|dictionary)\b/i,
  /\b(how to become|so werden sie|comment devenir|tips for|guide to|step by step)\b/i,
  /\b(top \d+|best \d+|listicle|we compared|vergleich)\b/i,
  /\b(form template|application form template)\b/i,
];

/** Companies that sell channel software rather than operate a channel (§37). */
const CHANNEL_SOFTWARE_SIGNALS: RegExp[] = [
  /\b(prm|partner relationship management)\b/i,
  /\b(partner|channel)\s+(management|automation|engagement|enablement)\s+(software|platform|solution)\b/i,
  /\bdeal registration (software|platform|tool)\b/i,
  /\bpartner portal (software|platform)\b/i,
];

/**
 * Firms whose business is advising on channels rather than running one.
 *
 * Split by precision. STRONG patterns are first-person offers of channel services — a
 * consultancy selling to manufacturers. WEAK patterns are bare mentions of consulting or
 * training, which manufacturers' own partner pages contain constantly (SAP and OpenText both
 * do), so those defer to research instead of dropping.
 */
const CONSULTANCY_STRONG: RegExp[] = [
  /\b(unsere|wir bieten|wir liefern)\s+\w{0,12}\s?(beratung|schulungen|trainings)\b/iu,
  /\bwir\s+(beraten|unterstützen|helfen)\s+\w{0,14}\s?(hersteller|unternehmen|vertrieb)/iu,
  /\bour\s+(consulting|consultancy|advisory)\s+(services|practice|team)\b/i,
  /\bwe help\s+\w{0,14}\s?(manufacturers|vendors|brands|companies)\s+\w{0,14}\s?(build|grow|scale|design)\b/i,
  /\b(nous accompagnons|notre cabinet de conseil)\b/iu,
];
const CONSULTANCY_WEAK: RegExp[] = [
  /\b(consultancy|consulting|beratung|agency|agentur|training|schulungen|coach)\b/i,
];

export interface CheapEvidenceInput {
  text: string;
  url: string;
  /** True when the category classifier has independently flagged a known competitor (§38). */
  knownCompetitor?: boolean;
  /** True when this entity key has already been seen (§10). */
  duplicate?: boolean;
}

/**
 * The cheap gate (§12). Runs before expensive research so obviously irrelevant candidates do
 * not consume a full crawl. Rules are explainable and every verdict carries its rationale.
 *
 * Note the ordering: duplicate and competitor checks run BEFORE operator signals, because a
 * PRM vendor's own site is full of genuine operator vocabulary — it really does run a partner
 * programme. What disqualifies it is category, not evidence.
 */
export function assessCheapEvidence(input: CheapEvidenceInput): CheapEvidence {
  const { text, url } = input;
  const drop = (dropReason: DropReason, rationale: string): CheapEvidence =>
    ({ signals: [], sources: [], verdict: 'drop', dropReason, rationale });

  if (input.duplicate) return drop('duplicate', 'Already known under another discovery path; paths merged onto the existing candidate.');
  if (input.knownCompetitor) return drop('known_competitor', 'Classified as a partner-technology vendor by the category classifier, which runs on reference data rather than on this page.');
  if (CHANNEL_SOFTWARE_SIGNALS.some((re) => re.test(text))) {
    return drop('known_competitor', 'The page sells partner or channel management software. Such vendors describe partner programmes extensively and would otherwise score as strong operators.');
  }

  const signals: string[] = [];
  const sources: string[] = [];
  const strong: string[] = [];
  for (const s of STRONG_OPERATOR_SIGNALS) {
    if (s.re.test(text)) { strong.push(s.signal); signals.push(s.signal); sources.push(url); }
  }
  for (const s of WEAK_OPERATOR_SIGNALS) {
    if (s.re.test(text)) { signals.push(s.signal); sources.push(url); }
  }
  const commentary = COMMENTARY_SIGNALS.filter((re) => re.test(text)).length;
  /**
   * Consultancy detection DEFERS, it does not drop.
   *
   * Measured on the shadow sample, a bare consultancy-keyword rule dropped SAP and OpenText —
   * both genuine operators whose partner pages mention consulting and training partners.
   * Dropping a real operator is the worst error this gate can make: the company is never
   * researched, and nothing downstream can recover it. A leak only costs one research pass.
   *
   * So a company is dropped as a consultancy only when it BOTH reads as a service provider
   * AND frames the page as commentary. Otherwise it is deferred to research, which can tell
   * an operator from an adviser using far more evidence than this gate has.
   */
  if (strong.length === 0 && CONSULTANCY_STRONG.some((re) => re.test(text))) {
    return drop('consultant_or_agency', 'Sells channel consulting or training to other companies in the first person, rather than operating a partner network of its own.');
  }
  const consultancyish = strong.length === 0 && CONSULTANCY_WEAK.some((re) => re.test(text));
  if (consultancyish && commentary > 0) {
    return drop('consultant_or_agency', 'Reads as a consultancy or agency writing about channel services rather than operating a partner network of its own.');
  }
  if (consultancyish) {
    return { signals, sources, verdict: 'research_required', dropReason: null,
      rationale: 'Mentions consulting or training but publishes no operator-only signal. Deferred to research rather than dropped, because manufacturers legitimately run partner training.' };
  }

  /**
   * Commentary framing with no STRONG signal is an article about channels, however much
   * partner vocabulary it quotes. Weak signals cannot rescue it: a how-to guide naturally
   * contains the phrase "dealer program", and treating that as operator evidence is how
   * templates, glossaries and trade press were scoring as prospects.
   */
  if (commentary > 0 && strong.length === 0) {
    return drop('not_a_company', `Reads as commentary about partner programmes rather than a company describing its own: ${commentary} commentary marker(s) and no operator-only signal such as an application step or partner portal.`);
  }
  if (signals.length === 0) {
    return { signals: [], sources: [], verdict: 'research_required', dropReason: null,
      rationale: 'No cheap operator signal found. This is not evidence of absence — the page reached may simply not be the programme page.' };
  }
  // Only weak signals and no commentary: plausible but not established. Research decides.
  if (strong.length === 0) {
    return { signals, sources, verdict: 'research_required', dropReason: null,
      rationale: `Found ${signals.length} weak signal(s) (${signals.join('; ')}) but nothing only an operator would publish. Deferred to research rather than claimed.` };
  }
  return { signals, sources, verdict: 'operator_evidence', dropReason: null,
    rationale: `Found ${strong.length} operator-only signal(s) on the company's own page: ${strong.join('; ')}.` };
}

/* ────────────────────────────────────────────────── entity resolution ── */

/**
 * Resolve candidate identity (§9). Discovery hands over a URL; this decides whether we know
 * which company that URL belongs to well enough to spend a crawl on it.
 */
export function resolveEntity(opts: {
  probableDomain: string;
  sourceURL: string;
  /** Whether the source URL is on the candidate domain itself, rather than a third party. */
  firstParty: boolean;
  /** A brand token match between the page's declared name and the domain, when available. */
  brandMatches?: boolean;
}): { confidence: EntityConfidence; reason: string } {
  const host = opts.probableDomain.toLowerCase();
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host)) {
    return { confidence: 'unresolved', reason: 'No registrable domain could be derived from the discovery URL.' };
  }
  // A third-party page naming a company is a weaker identity claim than the company's own page.
  if (!opts.firstParty) {
    return opts.brandMatches
      ? { confidence: 'probable', reason: 'Identified from a third-party page whose declared brand matches the domain. Not first-party, so not confirmed.' }
      : { confidence: 'ambiguous', reason: 'Identified from a third-party page with no corroborating brand match. Quarantined rather than researched.' };
  }
  if (opts.brandMatches === false) {
    return { confidence: 'ambiguous', reason: 'First-party page, but the declared brand does not match the domain. May be a hosted microsite or an unrelated brand.' };
  }
  return { confidence: 'confirmed', reason: 'The discovery URL is on the candidate domain itself.' };
}

/** Deep research runs automatically only on resolved identities (§9). */
export function mayAutoResearch(c: EntityConfidence): boolean {
  return c === 'confirmed' || c === 'probable';
}

/* ─────────────────────────────────────────────────────── construction ── */

/** Registrable-domain entity key. The deduplication unit (§10). */
export function entityKey(domain: string): string {
  return domain.toLowerCase().replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
}

/**
 * Fold a discovery hit into a candidate set. A company found by three families is ONE
 * candidate with three paths — never three prospects (§10). All paths are preserved because
 * which families find a company is itself a measurement (§36).
 */
export function upsertCandidate(
  index: Map<string, Candidate>,
  hit: { company: string; domain: string; family: QueryFamily; sourceURL: string; discoveredAt: string },
): { candidate: Candidate; isNew: boolean } {
  const key = entityKey(hit.domain);
  const path: DiscoveryPath = {
    discoverySource: 'search_pattern',
    queryFamily: hit.family.name,
    sourceURL: hit.sourceURL,
    sourceLanguage: hit.family.language,
    discoveredAt: hit.discoveredAt,
    motionHypothesis: hit.family.targetMotion.join('/'),
  };
  const existing = index.get(key);
  if (existing) {
    if (!existing.paths.some((p) => p.queryFamily === path.queryFamily)) existing.paths.push(path);
    return { candidate: existing, isNew: false };
  }
  const candidate: Candidate = {
    key,
    discoveredCompany: hit.company,
    probableDomain: key,
    paths: [path],
    entityConfidence: 'unresolved',
    candidateReason: describeReason(path, hit.family),
    state: 'new',
    cheapEvidence: null,
    dropReason: null,
    dossierBuiltAt: null,
  };
  index.set(key, candidate);
  return { candidate, isNew: true };
}

/**
 * Why this company entered research, in a sentence a seller can read (§3). Describes
 * provenance only — it must never read as a recommendation.
 */
export function describeReason(_path: DiscoveryPath, family: QueryFamily): string {
  const how = family.semanticClass === 'operator_self_description'
    ? 'a query that returns companies describing their own partner programme'
    : family.semanticClass === 'counterparty_inversion'
      ? 'a third-party source listing the company'
      : 'a general partner-programme query';
  return `Surfaced through ${how} (${family.name}, ${family.language}). Candidate confidence ${familyConfidence(family)} — this reflects how the company was found, not whether it is a fit.`;
}
