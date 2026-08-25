/**
 * CRM forensics — a first-class research layer (mandate §6, §12–§24, §45, §47, §49).
 *
 * The previous CRM layer answered "what does this company's website and current job board
 * say?". This one answers "what can be established about this company's CRM from the full
 * public evidence surface, and WHEN was each thing true?".
 *
 * Three semantics the old model could not express and this one must:
 *
 *   1. TIME. A 2023 advert saying "manage opportunities in Salesforce" proves the company
 *      used Salesforce in 2023. It does not prove it uses Salesforce today. Historical
 *      evidence is real evidence about a real moment, and silently ageing it into a current
 *      claim is the single most damaging error available here.
 *   2. CONFLICT. Two systems with strong evidence is a finding, not a tie to be broken.
 *      Migration, departmental split and marketing-vs-sales systems all look like this, and
 *      picking a winner destroys the information.
 *   3. SOURCE TRUST. A company's own current vacancy and a search snippet are not the same
 *      kind of fact. A snippet can direct research; it should rarely establish current use.
 *
 * ASYMMETRY (§49): a false CONFIRMED_CURRENT is worse than an UNKNOWN. Every ambiguous path
 * in this file resolves downward.
 */

/** §12. Never flattened — each carries a different commercial meaning. */
export type CrmEvidenceLevel =
  | 'confirmed_current'
  | 'confirmed_recent'
  | 'confirmed_historical'
  | 'strong_supporting'
  | 'mention_only'
  | 'conflicting'
  | 'unknown';

export const LEVEL_RANK: Record<CrmEvidenceLevel, number> = {
  confirmed_current: 6, confirmed_recent: 5, confirmed_historical: 4,
  strong_supporting: 3, mention_only: 2, conflicting: 1, unknown: 0,
};

/**
 * §45 source trust. Lower number = more trusted. The gap between 4 and 7 is the reason a
 * snippet cannot establish current use on its own.
 */
export type CrmSourceType =
  | 'company_current_vacancy'      // 1
  | 'company_ats_vacancy'          // 2
  | 'company_cached_vacancy'       // 3
  | 'public_linkedin_job'          // 4
  | 'job_board_reproduction'       // 5
  | 'recruiting_mirror'            // 6
  | 'search_snippet'               // 7
  | 'website_fingerprint'          // supporting only, never confirming
  | 'company_careers_index'        // a feed or listing of many adverts — see below
  | 'company_documentation';       // 1-equivalent when the company names its own system

export const SOURCE_TRUST: Record<CrmSourceType, number> = {
  company_current_vacancy: 1, company_documentation: 1, company_ats_vacancy: 2,
  company_cached_vacancy: 3, public_linkedin_job: 4, job_board_reproduction: 5,
  recruiting_mirror: 6, search_snippet: 7, website_fingerprint: 5,
  company_careers_index: 5,
};

/** Whether a source class may ever establish a CONFIRMED level (§45). */
const MAY_CONFIRM: Record<CrmSourceType, boolean> = {
  company_current_vacancy: true, company_documentation: true, company_ats_vacancy: true,
  company_cached_vacancy: true, public_linkedin_job: true, job_board_reproduction: true,
  recruiting_mirror: true,
  // A snippet is a fragment of a page we did not read. It can point research at a source; it
  // cannot be the source. A website fingerprint proves a script is installed, not that the
  // sales organisation runs on that vendor's CRM.
  search_snippet: false, website_fingerprint: false,
  /**
   * A careers feed concatenates many adverts into one document. Sentence boundaries no longer
   * separate roles, so a CRM named in one advert attaches to the whole page and to whichever
   * job title the <title> tag happens to carry. Observed on a real feed where a Salesforce
   * sentence from an unrelated role was reported under "All job roles". It may support; it
   * may never confirm.
   */
  company_careers_index: false,
};

/** How the sentence spoke about the system (§17, §18, §19). */
export type LanguageBasis =
  | 'company_possession'       // "our Salesforce instance" — decisive
  | 'operational_duty'         // "maintain opportunities in Salesforce" — decisive about this company
  | 'candidate_experience'     // "experience with Salesforce preferred" — supporting at most
  | 'alternatives_list'        // "Salesforce, HubSpot or similar" — proves nothing
  | 'customer_integration'     // "our product integrates with Salesforce" — proves nothing internal
  | 'fingerprint';             // a script or endpoint on the company's site

/** §16, §55. Every observation carries what established it and when. */
export interface CrmObservation {
  company: string;
  vendor: string;
  sourceType: CrmSourceType;
  languageBasis: LanguageBasis;
  quote: string;
  sourceUrl: string;
  /** When WE saw it. Always known. */
  observedAt: string;
  /** When the SOURCE says it was published. Null when the source carries no date (§46). */
  sourcePublishedAt: string | null;
  jobTitle: string | null;
  /** Which rule fired, so a reviewer can judge the inference rather than trust it. */
  rule: string;
  proves: string;
  doesNotProve: string;
}

export interface VendorFinding {
  vendor: string;
  level: CrmEvidenceLevel;
  /** The observation that set the level. */
  basis: CrmObservation | null;
  observations: CrmObservation[];
  /** Distinct dates at which this vendor was evidenced, oldest first (§23). */
  timeline: { date: string; level: CrmEvidenceLevel; jobTitle: string | null }[];
  /** Human-readable, no score. */
  rationale: string;
}

export interface CrmForensicResult {
  company: string;
  vendors: VendorFinding[];
  /** Set when two or more vendors carry decisive evidence (§22). */
  conflict: {
    kind: 'multiple_systems' | 'possible_transition';
    vendors: string[];
    explanation: string;
  } | null;
  /** What was actually consulted, so unknown is separable from not-looked-at. */
  coverage: {
    atsBoardFound: boolean;
    vacanciesRead: number;
    historicalVacanciesRead: number;
    nonPartnerTitlesRead: number;
    searchQueriesRun: number;
    linkedinBlocked: boolean;
    /** Careers landing pages that returned readable content — separates 'no page' from 'JS-only'. */
    careersPagesFound?: number;
    careersDocsFound?: number;
    sourcesConsulted: CrmSourceType[];
  };
  /** §25 research budget, reported rather than hidden. */
  budget: { queries: number; sourcesInspected: number; jobsInspected: number };
  note: string;
}

/* ─────────────────────────────────────────────────────── temporal rules ── */

/**
 * Age thresholds. Deliberately generous on "current": job boards routinely serve adverts
 * without dates, and a live advert on a company's own board is current by virtue of being
 * live, not by carrying a timestamp.
 */
export const CURRENT_DAYS = 270;   // ~9 months
export const RECENT_DAYS = 730;    // ~2 years

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(a) - Date.parse(b)) / 86_400_000);
}

/**
 * The confirmed level a decisive observation earns, given its age (§13, §14, §15).
 *
 * An undated observation from a live company board is treated as CURRENT — it is being served
 * right now. An undated observation from anywhere else is NOT: a mirror or a board
 * reproduction may be years stale, and assuming currency there is exactly the false
 * CONFIRMED_CURRENT §49 warns against.
 */
export function confirmedLevelFor(o: CrmObservation, now: string): CrmEvidenceLevel {
  const live = o.sourceType === 'company_current_vacancy'
    || o.sourceType === 'company_ats_vacancy'
    || o.sourceType === 'company_documentation';
  if (!o.sourcePublishedAt) return live ? 'confirmed_current' : 'confirmed_historical';
  const age = daysBetween(now, o.sourcePublishedAt);
  if (age < 0) return live ? 'confirmed_current' : 'confirmed_recent';  // future-dated: do not reward
  if (age <= CURRENT_DAYS) return 'confirmed_current';
  if (age <= RECENT_DAYS) return 'confirmed_recent';
  return 'confirmed_historical';
}

/** The level a single observation can support on its own. */
export function levelForObservation(o: CrmObservation, now: string): CrmEvidenceLevel {
  // Language that proves nothing about this company, whatever the source (§18, §19).
  if (o.languageBasis === 'alternatives_list') return 'mention_only';
  if (o.languageBasis === 'customer_integration') return 'mention_only';
  // A fingerprint proves an artifact is installed (§20).
  if (o.languageBasis === 'fingerprint') return 'strong_supporting';
  // Candidate experience suggests a relationship, never possession (§17).
  if (o.languageBasis === 'candidate_experience') return 'strong_supporting';
  // Decisive language, but only from a source class allowed to confirm (§45).
  if (!MAY_CONFIRM[o.sourceType]) return 'strong_supporting';
  return confirmedLevelFor(o, now);
}

/* ─────────────────────────────────────────────────── vendor resolution ── */

const DECISIVE = new Set<CrmEvidenceLevel>(['confirmed_current', 'confirmed_recent', 'confirmed_historical']);

/**
 * Resolve one vendor from all its observations (§21). Not a count: two weak mentions never
 * become a confirmation, and one decisive observation outranks ten mentions.
 */
export function resolveVendor(vendor: string, observations: CrmObservation[], now: string): VendorFinding {
  if (observations.length === 0) {
    return { vendor, level: 'unknown', basis: null, observations: [], timeline: [], rationale: 'No observation found.' };
  }
  const scored = observations.map((o) => ({ o, level: levelForObservation(o, now) }));
  // Ties break toward the more trusted source, then the more recent one.
  scored.sort((a, b) =>
    LEVEL_RANK[b.level] - LEVEL_RANK[a.level]
    || SOURCE_TRUST[a.o.sourceType] - SOURCE_TRUST[b.o.sourceType]
    || Date.parse(b.o.sourcePublishedAt ?? b.o.observedAt) - Date.parse(a.o.sourcePublishedAt ?? a.o.observedAt));
  const top = scored[0];

  const timeline = scored
    .filter((s) => s.o.sourcePublishedAt && DECISIVE.has(s.level))
    .map((s) => ({ date: s.o.sourcePublishedAt!, level: s.level, jobTitle: s.o.jobTitle }))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));

  const decisiveCount = scored.filter((s) => DECISIVE.has(s.level)).length;
  const rationale = DECISIVE.has(top.level)
    ? `${decisiveCount} decisive observation${decisiveCount === 1 ? '' : 's'}; strongest is ${top.o.languageBasis.replace(/_/g, ' ')} from ${top.o.sourceType.replace(/_/g, ' ')}${top.o.sourcePublishedAt ? ` published ${top.o.sourcePublishedAt.slice(0, 10)}` : ' with no publication date'}.`
    : top.level === 'strong_supporting'
      ? `Supporting evidence only — ${top.o.languageBasis.replace(/_/g, ' ')}. Nothing establishes that the company itself operates on ${vendor}.`
      : `Named, but only in language that proves nothing about this company (${top.o.languageBasis.replace(/_/g, ' ')}).`;

  return { vendor, level: top.level, basis: top.o, observations, timeline, rationale };
}

/**
 * Detect conflict and possible transition across vendors (§22, §23).
 *
 * A transition is claimed ONLY when the chronology supports it: one vendor's decisive
 * evidence is entirely older than another's, and both are dated. Anything else is reported
 * as "multiple systems observed", which is the honest description of two live signals.
 */
export function detectConflict(vendors: VendorFinding[]): CrmForensicResult['conflict'] {
  const decisive = vendors.filter((v) => DECISIVE.has(v.level));

  /**
   * §21's worked example: a HubSpot tracking artifact on the website alongside current
   * vacancies saying "manage all opportunities in Salesforce". Only one vendor is decisive,
   * so the two-decisive test below never fires — yet this is precisely the multi-system
   * environment the mandate asks to be surfaced rather than resolved to a single vendor.
   */
  if (decisive.length === 1) {
    const supporting = vendors.filter(
      (v) => v.level === 'strong_supporting'
        && v.vendor !== decisive[0].vendor
        && v.observations.some((o) => o.languageBasis === 'fingerprint'),
    );
    if (supporting.length > 0) {
      return {
        kind: 'multiple_systems',
        vendors: [decisive[0].vendor, ...supporting.map((v) => v.vendor)],
        explanation: `${decisive[0].vendor} is evidenced operationally, while ${supporting.map((v) => v.vendor).join(' and ')} ${supporting.length === 1 ? 'is' : 'are'} present as a website artifact. The common explanation is a split between marketing tooling and the sales system of record, but a migration or a departmental system would look identical. Reported rather than resolved.`,
      };
    }
  }

  if (decisive.length < 2) return null;

  const dated = decisive.filter((v) => v.timeline.length > 0);
  if (dated.length >= 2) {
    const spans = dated.map((v) => ({
      vendor: v.vendor,
      first: Date.parse(v.timeline[0].date),
      last: Date.parse(v.timeline[v.timeline.length - 1].date),
    })).sort((a, b) => a.last - b.last);
    const older = spans[0], newer = spans[spans.length - 1];
    // Non-overlapping and meaningfully separated: a transition is a defensible reading.
    if (older.last < newer.first && newer.first - older.last > 180 * 86_400_000) {
      return {
        kind: 'possible_transition',
        vendors: [older.vendor, newer.vendor],
        explanation: `${older.vendor} evidence ends ${new Date(older.last).toISOString().slice(0, 10)} and ${newer.vendor} evidence begins ${new Date(newer.first).toISOString().slice(0, 10)}, with no overlap. That chronology is consistent with a move from ${older.vendor} to ${newer.vendor}, but a transition is not directly evidenced and departmental split would look the same.`,
      };
    }
  }
  return {
    kind: 'multiple_systems',
    vendors: decisive.map((v) => v.vendor),
    explanation: `Decisive evidence exists for ${decisive.map((v) => v.vendor).join(' and ')}. This is reported rather than resolved: migration, a marketing-versus-sales split, departmental systems and regional systems all produce this pattern, and nothing here distinguishes them.`,
  };
}

/* ────────────────────────────────────────────────────────── self-audit ── */

/** §47. Run before committing a level; each hit forces a downgrade or a caveat. */
export interface AuditFlag { question: string; concern: string; }

export function auditVendor(v: VendorFinding, now: string): AuditFlag[] {
  const flags: AuditFlag[] = [];
  if (!v.basis) return flags;
  const b = v.basis;
  if (DECISIVE.has(v.level) && b.languageBasis === 'candidate_experience') {
    flags.push({ question: 'Could this be candidate experience rather than company possession?', concern: 'The basis sentence describes what the candidate should know.' });
  }
  if (v.level === 'confirmed_current' && b.sourcePublishedAt && daysBetween(now, b.sourcePublishedAt) > CURRENT_DAYS) {
    flags.push({ question: 'Is this stale?', concern: `Basis was published ${daysBetween(now, b.sourcePublishedAt)} days ago but is levelled current.` });
  }
  if (v.level === 'confirmed_current' && !MAY_CONFIRM[b.sourceType]) {
    flags.push({ question: 'Is the source strong enough?', concern: `${b.sourceType} may not establish current use on its own.` });
  }
  if (DECISIVE.has(v.level) && v.observations.length === 1 && SOURCE_TRUST[b.sourceType] >= 5) {
    flags.push({ question: 'Is one low-trust source enough?', concern: 'A single reproduction or mirror is the only evidence.' });
  }
  return flags;
}

/** Apply audit flags: any flag on a decisive level pulls it down one step (§49). */
export function applyAudit(v: VendorFinding, now: string): VendorFinding {
  const flags = auditVendor(v, now);
  if (flags.length === 0) return v;
  const down: Record<string, CrmEvidenceLevel> = {
    confirmed_current: 'confirmed_recent', confirmed_recent: 'confirmed_historical',
    confirmed_historical: 'strong_supporting', strong_supporting: 'mention_only',
  };
  const next = down[v.level] ?? v.level;
  return {
    ...v, level: next,
    rationale: `${v.rationale} Downgraded from ${v.level} by self-audit: ${flags.map((f) => f.concern).join(' ')}`,
  };
}

/* ───────────────────────────────────────────────────────────── assemble ── */

export function assembleForensics(
  company: string,
  observations: CrmObservation[],
  coverage: CrmForensicResult['coverage'],
  budget: CrmForensicResult['budget'],
  now: string,
): CrmForensicResult {
  const byVendor = new Map<string, CrmObservation[]>();
  for (const o of observations) {
    const k = o.vendor;
    byVendor.set(k, [...(byVendor.get(k) ?? []), o]);
  }
  const vendors = [...byVendor.entries()]
    .map(([v, obs]) => applyAudit(resolveVendor(v, obs, now), now))
    .sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level] || a.vendor.localeCompare(b.vendor));

  const conflict = detectConflict(vendors);
  const topDecisive = vendors.filter((v) => DECISIVE.has(v.level));

  const note = topDecisive.length === 0
    ? coverage.vacanciesRead === 0 && coverage.searchQueriesRun === 0
      ? 'No source could be read, so nothing was established. This is not evidence that the company has no CRM.'
      : `${coverage.vacanciesRead} vacancies and ${coverage.searchQueriesRun} searches produced no decisive CRM evidence. Unknown never means "no CRM".`
    : conflict
      ? `Decisive evidence for ${topDecisive.map((v) => v.vendor).join(' and ')}. Reported as ${conflict.kind.replace(/_/g, ' ')} rather than resolved.`
      : `${topDecisive[0].vendor} at ${topDecisive[0].level.replace(/_/g, ' ')}.`;

  return { company, vendors, conflict, coverage, budget, note };
}

export const isDecisive = (l: CrmEvidenceLevel): boolean => DECISIVE.has(l);
