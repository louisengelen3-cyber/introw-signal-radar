/**
 * Introw relevance (mandate §5, §30, §33–§38).
 *
 * This is NOT a score and must never become one. It is a small set of named states, each of
 * which has to justify itself in words a seller can argue with. The states are workflow
 * positions — "is this worth a person's time to look at" — not predictions and not rankings.
 *
 * The two failure modes it exists to prevent:
 *
 *   1. Sparse evidence read as a negative. A company that publishes little is UNDER_OBSERVED,
 *      never LIKELY_NOT_FIT. §35 requires positive negative evidence before we say a company
 *      is a poor fit, and "we found nothing" is not evidence of anything.
 *   2. Ecosystem size read as Introw need. A large integration directory is not a partner
 *      programme, and a company that participates in someone else's network does not own one.
 */

export type FitState =
  | 'plausible_introw_fit'
  | 'research_required'
  | 'likely_not_fit'
  | 'suppress'
  | 'under_observed';

/** The §30 dimensions. Each is a state, never a number, and they are never summed. */
export interface FitEvidence {
  /** A: does the company own the partner relationship, or merely appear in someone else's? */
  programmeOwnership: 'owned' | 'participant' | 'both' | 'unknown';
  /** B: do partners visibly influence revenue or opportunities? */
  commercialMotion: 'evidenced' | 'implied' | 'unknown';
  /** C: which partner workflows are publicly visible? Names, not a count. */
  operationalSurfaces: string[];
  /** D: does the partner motion look material to how the company goes to market? */
  materiality: 'evidenced' | 'implied' | 'unknown';
  /** E: CRM environment, from the forensic layer. Unknown must never reject (§34). */
  crm: { vendor: string | null; level: string; compatible: boolean | null };
  /** F: partner/channel roles positively observed. Absence stays unknown (§31). */
  peopleObserved: number;
  /** G: contradictions, each already established as positive evidence. */
  contradictions: string[];
  /** H: how much was actually readable. */
  observability: { pagesRead: number; vacanciesRead: number; blocked: boolean };
  /** Category verdict from the existing classifier. */
  category: string;
  /** Whether the company is on the maintained competitor list. */
  knownCompetitor: boolean;
  /** PRM platform observed in use by this company (not sold by it). */
  prmInUse: string | null;
}

export interface FitAssessment {
  state: FitState;
  /** Human-readable reasons. Always populated; a state with no reasons is a bug. */
  reasons: string[];
  /** For research_required: exactly what would resolve it (§37). */
  wouldResolve: string[];
  /** Stated so a reader can see what the state does NOT claim. */
  doesNotClaim: string;
}

/** Workflows that indicate a programme is operated rather than advertised. */
const OPERATIONAL = new Set([
  'partner_recruitment', 'application', 'onboarding', 'deal_registration', 'portal',
  'partner_pipeline', 'programme_tiers', 'certification', 'enablement', 'lead_submission',
  'referral_submission', 'co_selling', 'lead_routing', 'partner_portal', 'tiering',
]);

const COMPATIBLE_CRM = new Set(['hubspot', 'salesforce']);

export function assessFit(e: FitEvidence): FitAssessment {
  const reasons: string[] = [];
  const wouldResolve: string[] = [];
  // Base detection and recovery can name the same workflow; three sources for one workflow
  // is one fact, and listing it twice in a reason reads as more evidence than exists.
  const operational = [...new Set(e.operationalSurfaces)].filter((s) => OPERATIONAL.has(s));

  /* ── SUPPRESS: category, not evidence quality (§36) ─────────────────────── */
  if (e.knownCompetitor) {
    return {
      state: 'suppress',
      reasons: ['On the maintained competitor list. This is asserted commercial reference data, not a model inference.'],
      wouldResolve: [],
      doesNotClaim: 'that the company has no partner motion — it very likely does; it is simply not a prospect.',
    };
  }
  if (e.category === 'direct_introw_competitor' || e.category === 'partner_tech_vendor') {
    return {
      state: 'suppress',
      reasons: [`Classified as ${e.category.replace(/_/g, ' ')}. A vendor that sells partner management is a category mismatch, however strong its own partner motion looks.`],
      wouldResolve: [],
      doesNotClaim: 'that the classification is certain — the classifier caught 8 of 14 known vendors across two holdouts, so a human should confirm.',
    };
  }

  /* ── UNDER_OBSERVED: nothing was readable (§38) ─────────────────────────── */
  if (e.observability.blocked) {
    return {
      state: 'under_observed',
      reasons: ['Retrieval was blocked, so no evidence exists either way. This is a technical limit, not a finding about the company.'],
      wouldResolve: ['Retrieve the site through another route, or research it manually.'],
      doesNotClaim: 'anything about whether this company runs a partner programme.',
    };
  }
  const nothingFound = e.programmeOwnership === 'unknown'
    && e.commercialMotion === 'unknown' && operational.length === 0;
  if (nothingFound && e.observability.pagesRead < 3) {
    return {
      state: 'under_observed',
      reasons: [`Only ${e.observability.pagesRead} page(s) could be read. Too little was retrieved to say anything about the partner motion.`],
      wouldResolve: ['Find the partner surface — it may be on a regional domain or behind a locator.'],
      doesNotClaim: 'that the company has no partner programme. Publishing little is not the same as doing little.',
    };
  }

  /* ── LIKELY_NOT_FIT: requires POSITIVE negative evidence (§35) ──────────── */
  if (e.programmeOwnership === 'participant') {
    return {
      state: 'likely_not_fit',
      reasons: [
        'Evidence shows the company appears in other companies\' partner networks rather than operating one of its own.',
        ...e.contradictions,
      ],
      wouldResolve: [],
      doesNotClaim: 'that the company could never run a programme — only that no evidence of one was found while evidence of participation was.',
    };
  }
  if (e.contradictions.length > 0 && operational.length === 0) {
    return {
      state: 'likely_not_fit',
      reasons: e.contradictions,
      wouldResolve: [],
      doesNotClaim: 'that this is a commercial verdict. A human still decides.',
    };
  }

  /* ── PLAUSIBLE: owned motion + operational workflows, no decisive contra ── */
  const owned = e.programmeOwnership === 'owned';
  const hasCommercial = e.commercialMotion === 'evidenced' || e.materiality === 'evidenced';
  if (owned && operational.length >= 2 && e.contradictions.length === 0) {
    reasons.push(`Company-owned partner programme with ${operational.length} publicly visible workflow(s): ${operational.join(', ')}.`);
    if (hasCommercial) reasons.push('Partners are evidenced as influencing commercial opportunities, not only integrations.');
    if (e.crm.vendor && e.crm.compatible) {
      reasons.push(`${e.crm.vendor} evidenced at ${e.crm.level.replace(/_/g, ' ')} — a CRM Introw connects to.`);
    } else if (e.crm.vendor && e.crm.compatible === false) {
      reasons.push(`${e.crm.vendor} evidenced at ${e.crm.level.replace(/_/g, ' ')}. Introw does not connect to it, which is a constraint a seller should know before investing time.`);
    } else {
      reasons.push('CRM is unknown. That is the expected state for most companies and is not a reason to deprioritise (§34).');
    }
    if (e.peopleObserved >= 2) reasons.push(`${e.peopleObserved} partner/channel roles positively observed.`);
    if (e.prmInUse) reasons.push(`Already running ${e.prmInUse}. That is displacement and maturity evidence, not a disqualifier.`);
    return {
      state: 'plausible_introw_fit',
      reasons,
      wouldResolve: [],
      doesNotClaim: 'that this company will buy, or that it needs Introw. It means the evidence justifies a person looking.',
    };
  }

  /* ── RESEARCH_REQUIRED: relevant but ambiguous (§37) ────────────────────── */
  if (owned || operational.length > 0 || e.commercialMotion !== 'unknown') {
    reasons.push(owned
      ? 'A company-owned partner motion is evidenced, but too little of its operation is visible to judge relevance.'
      : 'Partner vocabulary is present, but ownership of the programme is not established.');
    if (e.programmeOwnership === 'both' || e.programmeOwnership === 'unknown') {
      wouldResolve.push('Whether the company recruits its own partners, or has joined someone else\'s programme — look for an intake form on its own domain, not a partner badge.');
    }
    if (operational.length < 2) {
      wouldResolve.push('Which partner workflows exist — deal registration and pipeline usually sit behind a partner login, so public absence is expected rather than informative.');
    }
    if (!e.crm.vendor) {
      wouldResolve.push('Which CRM the commercial team runs on — ask on the first call; public detection resolved this for a minority of accounts.');
    }
    if (e.materiality === 'unknown') {
      wouldResolve.push('Whether partners actually influence revenue, or the programme is a directory listing.');
    }
    return {
      state: 'research_required',
      reasons,
      wouldResolve,
      doesNotClaim: 'that the company is a weak prospect. It means a specific question is open, and the question is named above.',
    };
  }

  /* ── default: nothing established despite reading enough ────────────────── */
  return {
    state: 'under_observed',
    reasons: [`${e.observability.pagesRead} pages and ${e.observability.vacanciesRead} vacancies were read without establishing a partner motion.`],
    wouldResolve: ['A partner surface on a regional domain, a dealer locator, or a partner page not linked from the main navigation.'],
    doesNotClaim: 'that the company has no partner programme.',
  };
}

export function crmCompatible(vendor: string | null): boolean | null {
  if (!vendor) return null;
  return COMPATIBLE_CRM.has(vendor.toLowerCase().replace(/\s+/g, ''));
}
