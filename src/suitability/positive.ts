/**
 * Positive fit constructs.
 *
 * Phase 2 could demote but barely promote: `strong` fired once in fifty. The cause is now
 * measured. The Phase 2 lexicon encodes MATURE, FORMALISED channel vocabulary — deal
 * registration, tiers, MDF, distributor structure — and Introw's own customers frequently
 * do not use it.
 *
 * Measured on the 22 known customers:
 *
 *   caught by the Phase 2 classifier   n=15   mean 1.53 maturity artefacts
 *   missed by it                       n=7    mean 0.14 maturity artefacts
 *
 * All four channel-classification misses publish their partner motion in plain business
 * English, and a human reading the same page would recognise it immediately:
 *
 *   Ringover  "co-marketing and co-selling… grow their own consulting business'
 *              recurring revenue streams"
 *   Xelix     "help outsourcing firms win new deals… introducing our solution into
 *              their delivery projects"
 *   Zenity    "Value-Added Resellers (VARs)… expand Zenity's reach"
 *   Payflip   "Do you have a new lead for Payflip? Fill in the form below"
 *
 * Probe frequency across 19 customers with retrievable partner pages, which is what these
 * constructs are built on rather than on the original thesis feature list:
 *
 *   recruits partners in the first person   13/19
 *   names the partner types it manages      12/19
 *   partner sells or resells                10/19
 *   partner grows their own revenue          8/19
 *   FORMAL DEAL REGISTRATION                 6/19   ← Phase 2's decisive artifact
 *
 * The three constructs below are measured SEPARATELY and deliberately not combined into a
 * score. Whether they form a single coherent concept is a question to answer after
 * measuring them, not a premise.
 */

export type MaterialityState = 'confirmed' | 'strong_proxy' | 'weak_proxy' | 'unknown' | 'contradicted';
export type OwnershipState = 'direct' | 'mixed' | 'distributor_mediated' | 'participant_only' | 'unknown';
export type SurfaceState = 'rich' | 'moderate' | 'light' | 'unknown';

export interface PositiveObservation {
  construct: 'materiality' | 'ownership' | 'surface';
  probe: string;
  /** What a match proves. Deliberately narrow. */
  proves: string;
  /** What it does NOT prove. Carried into the record so the UI cannot over-claim. */
  doesNotProve: string;
  quote: string;
  sourceUrl: string;
}

interface Probe {
  id: string;
  proves: string;
  doesNotProve: string;
  re: RegExp;
  /** Strong probes can establish a construct on their own; weak ones need corroboration. */
  weight: 'strong' | 'weak';
}

/* ───────────────────────────────────── A · commercial materiality ──────── */

/**
 * Are partners visibly involved in acquiring customers or generating revenue?
 * Written to catch ordinary business English, because that is what the missed customers
 * use. "Grow their own recurring revenue streams" is the same commercial claim as
 * "partner-sourced revenue" — only one of them is channel jargon.
 */
const MATERIALITY: Probe[] = [
  {
    id: 'partner_resells',
    proves: 'the company describes partners selling or reselling its product',
    doesNotProve: 'the volume of resale, or that resale revenue is material',
    weight: 'strong',
    re: /\b(resell(?:er|ers|ing)?|value[- ]added reseller|\bVARs?\b|sell (?:our|the|this) (?:solution|product|platform|software)|co-?sell(?:ing)?|joint(?:ly)? (?:sell|go[- ]to[- ]market)|wederverkoper|revendeur|wiederverk[äa]ufer)\b/i,
  },
  {
    id: 'partner_grows_own_revenue',
    proves: 'the company pitches partner participation as revenue for the partner',
    doesNotProve: 'that any partner earns it, or that the company tracks it',
    weight: 'strong',
    // Companies describe this with an adjective in the way — "grow their own CONSULTING
    // BUSINESS' recurring revenue streams" — and almost always in the plural.
    re: /\b(grow (?:their|your) (?:own )?[\w'’ ]{0,24}?(?:business|revenue)|(?:new|additional|extra|recurring) revenue streams?|increase (?:their|your) revenue|earn (?:recurring )?(?:revenue|commission)|profitable partnership|extra inkomsten|revenus (?:r[ée]currents|suppl[ée]mentaires))\b/i,
  },
  {
    id: 'partner_sources_deals',
    proves: 'the company describes partners bringing it leads, deals or customers',
    doesNotProve: 'the number of deals, or that a process exists to handle them',
    weight: 'strong',
    re: /\b(win new (?:deals|business|clients)|source (?:new )?(?:deals|opportunities)|bring (?:us )?(?:leads|deals|customers)|generate (?:leads|pipeline|opportunities)|new lead for|refer (?:a |your )?(?:client|customer|lead)|introduce (?:us|our) .{0,25}to (?:their|your) (?:clients|customers)|doorverwijzen|apporteur d'affaires)\b/i,
  },
  {
    id: 'partner_extends_reach',
    proves: 'the company describes partners reaching customers it would not reach directly',
    doesNotProve: 'that the reach is exclusive, managed, or measured',
    weight: 'weak',
    re: /\b(expand (?:our|your|their) reach|extend (?:our|your) reach|reach new (?:customers|markets|clients)|access (?:to )?new (?:customers|markets)|new geographies|serve (?:their|your) (?:own )?customers)\b/i,
  },
  {
    id: 'partner_implements',
    proves: 'the company describes partners delivering or implementing its product for customers',
    doesNotProve: 'whether the partner or the company holds the commercial relationship',
    weight: 'weak',
    re: /\b(implementation partner|delivery partner|deploy (?:our|the) (?:solution|platform)|into (?:their|your) (?:delivery|projects|engagements)|service delivery partner|integratiepartner)\b/i,
  },
];

/* ───────────────────────────────────── B · operational ownership ───────── */

/**
 * Does the company itself operate the partner motion? First-person recruitment is the
 * highest-frequency positive observation in the whole customer set (13/19) and it is
 * exactly what distinguishes an operator from a participant.
 */
const OWNERSHIP: Probe[] = [
  {
    id: 'first_person_recruitment',
    proves: 'the company invites organisations to join a programme it runs',
    doesNotProve: 'that anyone joins, or that the programme is staffed',
    weight: 'strong',
    re: /\b(become (?:a|our) partner|join (?:our|the) (?:partner|programme?|network)|partner with us|apply to (?:our|the) partner|we (?:are )?(?:seek|look)(?:ing)? (?:for )?partners|word (?:onze )?partner|partner worden|devenir (?:notre |un )?partenaire|partner werden)\b/i,
  },
  {
    id: 'names_partner_types',
    proves: 'the company distinguishes and manages more than one kind of partner',
    doesNotProve: 'how many partners exist in each type',
    weight: 'strong',
    re: /\b((?:technology|referral|reseller|implementation|solution|service|channel|agency|payroll|accounting|accountancy|benefit|hr|distribution|consulting|staffing|msp|var|integration)\s+partners)\b/i,
  },
  {
    id: 'operates_intake',
    proves: 'the company runs its own intake for partner applications, leads or deals',
    doesNotProve: 'the volume through it, or that it is automated rather than an inbox',
    weight: 'strong',
    re: /\b(partner (?:enquiry|inquiry|application|sign[- ]?up|registration) (?:form)?|submit (?:a |your )?(?:lead|deal|referral)|register (?:a |your )?(?:lead|deal|opportunity)|fill in the form below|get in touch within \d+ hours|partner form)\b/i,
  },
  {
    id: 'provides_partner_support',
    proves: 'the company supplies partners with resources, enablement or a named contact',
    doesNotProve: 'that partners use them',
    weight: 'weak',
    re: /\b(partner (?:resources|benefits|enablement|support|training|materials|toolkit|assets)|we (?:provide|offer|give) (?:our )?partners|dedicated (?:partner|channel) (?:manager|team|support)|partner (?:team|success|operations))\b/i,
  },
];

/* ───────────────────────────────────── C · operational surface ─────────── */

/**
 * Is there enough visible partner machinery that PRM software could plausibly help?
 * This is the dimension closest to Phase 2's lexicon, kept because it is real — but it is
 * now ONE of three rather than the whole model, since only 6 of 19 customers publish the
 * formal artefact Phase 2 treated as decisive.
 */
const SURFACE: Probe[] = [
  { id: 'deal_registration', weight: 'strong', proves: 'partners participate in the sales process through a defined intake', doesNotProve: 'that the company is unhappy with how it handles them today', re: /\b(deal registration|register a deal|opportunity registration|deal[- ]?reg\b|lead registration|deal ?registratie)\b/i },
  { id: 'partner_portal', weight: 'strong', proves: 'a partner-specific operational surface exists', doesNotProve: 'adoption, or that partners log into it', re: /\b(partner portal|partner login|partner hub|espace partenaires?|partnerportaal|partnerportal)\b/i },
  { id: 'partner_tiers', weight: 'weak', proves: 'the company differentiates partners by commitment or performance', doesNotProve: 'how many partners sit in each tier', re: /\b((?:gold|silver|bronze|platinum|premier|elite|registered|certified) partner|partner (?:tiers?|levels?))\b/i },
  { id: 'certification_training', weight: 'weak', proves: 'the company trains or certifies people outside its own staff', doesNotProve: 'that those people transact — customer academies look identical', re: /\b(partner (?:certification|academy|university|training)|certified partner program|partner onboarding|accreditation)\b/i },
  { id: 'commission_mechanics', weight: 'weak', proves: 'the company pays partners for commercial outcomes', doesNotProve: 'the size of the payments or how they are calculated', re: /\b(commission|margin|revenue share|referral fee|payout|spiff|rebate|partnerprovision|marge revendeur)\b/i },
  { id: 'partner_directory', weight: 'weak', proves: 'the company publishes named partner organisations', doesNotProve: 'that the listed partners are active', re: /\b(find a (?:partner|reseller|installer|dealer)|partner director|our partners include|meet our partners|partner locator|vind een (?:partner|installateur))\b/i },
  { id: 'multiple_programme_tracks', weight: 'weak', proves: 'the company runs more than one distinct partner track', doesNotProve: 'that they share an owner or a system', re: /\b(partner programs\b|partner programmes\b|explore (?:our )?partnership options|find your fit|choose (?:your|the right) (?:program|partnership))\b/i },
];

/* ─────────────────────────────────────────────────── measurement ───────── */

export interface PositiveAssessment {
  materiality: MaterialityState;
  ownership: OwnershipState;
  surface: SurfaceState;
  observations: PositiveObservation[];
  /**
   * How much partner evidence the company publishes at all — tracked SEPARATELY from fit,
   * so a sparse account is recognised as under-observed rather than as a poor fit.
   */
  evidenceDensity: 'rich' | 'moderate' | 'sparse' | 'none';
  rationale: string;
}

interface PageText { url: string; text: string }

function run(pages: PageText[], probes: Probe[], construct: PositiveObservation['construct']): { strong: Set<string>; weak: Set<string>; obs: PositiveObservation[] } {
  const strong = new Set<string>();
  const weak = new Set<string>();
  const obs: PositiveObservation[] = [];
  for (const p of probes) {
    for (const page of pages) {
      const m = p.re.exec(page.text);
      if (!m) continue;
      (p.weight === 'strong' ? strong : weak).add(p.id);
      const s = Math.max(0, m.index - 60);
      obs.push({
        construct, probe: p.id, proves: p.proves, doesNotProve: p.doesNotProve,
        quote: page.text.slice(s, m.index + m[0].length + 70).replace(/\s+/g, ' ').trim(),
        sourceUrl: page.url,
      });
      break;
    }
  }
  return { strong, weak, obs };
}

export interface PositiveInput {
  pages: PageText[];
  /** From the Phase 2 operator resolver — ownership must respect it, not re-derive it. */
  direction: OwnershipState | 'channel_operator' | 'channel_participant' | 'distributed_vendor' | 'both' | 'unknown';
  /** Counterparty distribution evidence, if any. */
  distributorCount: number;
  reachable: boolean;
}

export function assessPositive(input: PositiveInput): PositiveAssessment {
  const { pages } = input;
  const m = run(pages, MATERIALITY, 'materiality');
  const o = run(pages, OWNERSHIP, 'ownership');
  const s = run(pages, SURFACE, 'surface');
  const observations = [...m.obs, ...o.obs, ...s.obs];

  const totalChars = pages.reduce((n, p) => n + p.text.length, 0);
  const evidenceDensity: PositiveAssessment['evidenceDensity'] =
    !input.reachable || !pages.length ? 'none'
      : observations.length >= 8 && totalChars > 4000 ? 'rich'
        : observations.length >= 4 ? 'moderate'
          : 'sparse';

  /* Materiality: two independent strong probes, or one strong plus corroboration. */
  const materiality: MaterialityState =
    m.strong.size >= 2 ? 'confirmed'
      : m.strong.size === 1 && m.weak.size >= 1 ? 'strong_proxy'
        : m.strong.size === 1 ? 'weak_proxy'
          : m.weak.size >= 1 ? 'weak_proxy'
            : 'unknown';

  /* Ownership: the operator resolver decides direction; probes decide confidence in it. */
  let ownership: OwnershipState;
  if (input.direction === 'channel_participant') ownership = 'participant_only';
  else if (o.strong.size >= 2) ownership = input.distributorCount >= 2 ? 'mixed' : 'direct';
  else if (o.strong.size === 1) ownership = input.distributorCount >= 2 ? 'distributor_mediated' : 'direct';
  else if (input.distributorCount >= 1) ownership = 'distributor_mediated';
  else ownership = 'unknown';

  /* Surface: counted by distinct probes, not by repetition. */
  const surfaceCount = s.strong.size * 2 + s.weak.size;
  const surface: SurfaceState =
    surfaceCount >= 6 ? 'rich' : surfaceCount >= 3 ? 'moderate' : surfaceCount >= 1 ? 'light' : 'unknown';

  const parts: string[] = [];
  if (m.strong.size) parts.push(`materiality from ${[...m.strong].join(', ')}`);
  if (o.strong.size) parts.push(`ownership from ${[...o.strong].join(', ')}`);
  if (surfaceCount) parts.push(`surface from ${[...s.strong, ...s.weak].join(', ')}`);

  return {
    materiality, ownership, surface, observations, evidenceDensity,
    rationale: parts.length
      ? parts.join('; ')
      : 'no positive partner-operating evidence observed on the pages retrieved',
  };
}

/* ─────────────────────────────────────────────── positive promotion ───── */

export type PromotionState = 'high_fit' | 'plausible' | 'under_observed' | 'not_promoted';

export interface Promotion {
  state: PromotionState;
  rule: string;
  rationale: string;
  /** Named supporting observations. Promotion may never rest on absence of negatives. */
  support: PositiveObservation[];
}

/**
 * Promotion requires POSITIVE evidence on all three constructs. "No negatives found" is
 * explicitly not a promotion — that would be an absence-based claim, and absence is the
 * one thing this system is not allowed to score.
 */
export function promote(p: PositiveAssessment, contradictions: string[]): Promotion {
  const support = p.observations.filter((o) => ['materiality', 'ownership'].includes(o.construct));

  if (contradictions.length) {
    return { state: 'not_promoted', rule: 'contradicted', support: [], rationale: `Positive evidence is contradicted: ${contradictions.join('; ')}.` };
  }
  if (p.ownership === 'participant_only') {
    return { state: 'not_promoted', rule: 'participant_only', support: [], rationale: 'The partner evidence belongs to another vendor\'s programme.' };
  }
  if (p.evidenceDensity === 'none') {
    return { state: 'under_observed', rule: 'no_retrievable_evidence', support: [], rationale: 'No partner surface could be retrieved. This is missing observation, not a poor fit.' };
  }

  const materialityOk = p.materiality === 'confirmed' || p.materiality === 'strong_proxy';
  const ownershipOk = p.ownership === 'direct' || p.ownership === 'mixed';
  const surfaceOk = p.surface === 'rich' || p.surface === 'moderate';

  if (materialityOk && ownershipOk && surfaceOk) {
    return {
      state: 'high_fit', rule: 'materiality_ownership_surface', support,
      rationale: `Partners are described as generating revenue or customers (${p.materiality}), the company operates the motion itself (${p.ownership}), and there is enough partner machinery for PRM software to act on (${p.surface} surface).`,
    };
  }
  if (materialityOk && ownershipOk) {
    return {
      state: 'plausible', rule: 'materiality_and_ownership_thin_surface', support,
      rationale: `Partners generate revenue and the company runs the motion, but the visible operational surface is ${p.surface}. Either a young programme, or one that publishes little.`,
    };
  }
  if (p.evidenceDensity === 'sparse') {
    return {
      state: 'under_observed', rule: 'sparse_publication', support,
      rationale: 'Too little published partner evidence to judge. A sparse account may be a strong fit that publishes little — route to research rather than demoting it.',
    };
  }
  return {
    state: 'not_promoted', rule: 'insufficient_positive_evidence', support,
    rationale: `Positive evidence is incomplete: materiality ${p.materiality}, ownership ${p.ownership}, surface ${p.surface}.`,
  };
}
