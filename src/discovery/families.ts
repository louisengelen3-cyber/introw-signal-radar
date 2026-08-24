/**
 * Query families (mandate §4–§6).
 *
 * Discovery is not one generic search box. Each family is a named, versioned asset carrying
 * its own intent, expected signal, known false-positive classes and last measured result.
 *
 * The organising finding from the source-recovery mandate is that yield is governed by
 * QUERY INTENT, not by language or sector. "Fachpartner werden" measured 88% operator
 * precision; "Vertriebspartner werden" — same language, same sector, same commercial
 * intent — measured 0%, because the second phrase is what consultants and trade press write
 * ABOUT manufacturers while the first is what a manufacturer writes about ITSELF.
 *
 * `semanticClass` encodes that distinction so it cannot be lost when families are added.
 */

/** Who is speaking on a page this family returns. */
export type QuerySemanticClass =
  /** The company is describing its own programme. Highest observed operator precision. */
  | 'operator_self_description'
  /** Could return consultants, directories, commentary, competitors or vendors. */
  | 'ecosystem_generic'
  /** A third party lists the company — a distributor catalogue, a directory entry. */
  | 'counterparty_inversion';

/** Motion the family is trying to surface. Never a sector ranking (§6). */
export type TargetMotion =
  | 'installer' | 'dealer' | 'reseller' | 'distributor' | 'service_partner'
  | 'system_integrator' | 'solution_partner' | 'msp' | 'oem_partner' | 'referral';

export interface QueryFamilyResult {
  /** Measured, never estimated. Null until the family has been benchmarked. */
  queries: number;
  candidates: number;
  operators: number;
  competitors: number;
  commentary: number;
  /** operators / candidates. The number that decides whether a family survives (§36). */
  operatorPrecision: number;
  measuredAt: string;
  /** Which evaluation bucket produced this (§53). */
  bucket: 'development' | 'discovery_holdout' | 'shadow';
}

export interface QueryFamily {
  name: string;
  intent: string;
  targetMotion: TargetMotion[];
  language: string;
  semanticClass: QuerySemanticClass;
  expectedOperatorSignal: string;
  knownFalsePositiveClasses: string[];
  templates: string[];
  /**
   * `validated` families may run in production. `provisional` may run in shadow only.
   * `disabled` never runs — kept for provenance so a demoted family is not silently
   * re-added later (§36).
   */
  status: 'validated' | 'provisional' | 'disabled';
  lastResult: QueryFamilyResult | null;
  /** Why the family carries its current status, in plain words. */
  note: string;
}

const r = (
  queries: number, candidates: number, operators: number, competitors: number, commentary: number,
  bucket: QueryFamilyResult['bucket'],
): QueryFamilyResult => ({
  queries, candidates, operators, competitors, commentary,
  operatorPrecision: candidates === 0 ? 0 : Math.round((operators / candidates) * 100) / 100,
  measuredAt: '2026-08-24', bucket,
});

/**
 * The family library. Names are generic and describe the MOTION and LANGUAGE, never a
 * benchmark company (§4) — nothing here may encode a company the families were tested on.
 */
export const QUERY_FAMILIES: QueryFamily[] = [
  {
    name: 'GERMAN_OPERATOR_FACHPARTNER',
    intent: 'German manufacturers recruiting certified trade partners on their own site',
    targetMotion: ['installer', 'service_partner'],
    language: 'de',
    semanticClass: 'operator_self_description',
    expectedOperatorSignal: 'an application step, a partner portal, training or territory lead routing',
    knownFalsePositiveClasses: ['consumer lead-generation directories', 'trade press'],
    templates: ['"Fachpartner werden" Hersteller Partnerprogramm Installateur', '"Servicepartner werden" Hersteller Partnerprogramm Schulung'],
    status: 'validated',
    lastResult: r(1, 8, 7, 0, 0, 'shadow'),
    note: 'Highest measured precision of any family. The phrase is written by operators about themselves.',
  },
  {
    name: 'FRENCH_REVENDEUR_PROGRAM',
    intent: 'French vendors recruiting resellers',
    targetMotion: ['reseller', 'distributor'],
    language: 'fr',
    semanticClass: 'operator_self_description',
    expectedOperatorSignal: 'a "devenir revendeur" application page or programme tiers',
    knownFalsePositiveClasses: ['how-to blogs about becoming a reseller'],
    templates: ['"devenir revendeur" programme partenaire fabricant', '"devenir partenaire installateur" programme fabricant'],
    status: 'validated',
    lastResult: r(1, 9, 9, 0, 0, 'shadow'),
    note: 'Consistently returns operator-owned pages; commentary share is low in French.',
  },
  {
    name: 'ENGLISH_MSP_PROGRAM',
    intent: 'Security and IT vendors recruiting MSPs and MSSPs',
    targetMotion: ['msp', 'reseller'],
    language: 'en',
    semanticClass: 'operator_self_description',
    expectedOperatorSignal: 'MSP programme page with deal registration or tiering',
    knownFalsePositiveClasses: ['channel trade press'],
    templates: ['"MSP partner program" "deal registration" apply become a partner', '"MSSP partner program" apply managed security provider'],
    status: 'validated',
    lastResult: r(1, 6, 6, 0, 0, 'shadow'),
    note: 'The one English family with operator-specific vocabulary; MSP language is not used by commentators.',
  },
  {
    name: 'ENGLISH_SYSTEM_INTEGRATOR_PROGRAM',
    intent: 'Industrial automation vendors recruiting system integrators',
    targetMotion: ['system_integrator', 'solution_partner'],
    language: 'en',
    semanticClass: 'operator_self_description',
    expectedOperatorSignal: 'an SI programme with tiers, enablement or a partner portal',
    knownFalsePositiveClasses: ["integrators' own marketing blogs describing their tier"],
    templates: ['"system integrator partner program" industrial automation', '"integrator partner program" building automation apply'],
    status: 'provisional',
    lastResult: r(1, 6, 4, 0, 1, 'shadow'),
    note: 'DEMOTED to provisional. 71% on development, 67% on shadow — just under the promotion bar. Sector-technical English still beats channel-generic English, but it draws job boards and integrators\' own marketing.',
  },
  {
    name: 'DUTCH_DEALER_OPERATOR',
    intent: 'Dutch and Flemish vendors appointing dealers or distributors',
    targetMotion: ['dealer', 'distributor'],
    language: 'nl',
    semanticClass: 'operator_self_description',
    expectedOperatorSignal: 'a "dealer worden" application with selection criteria',
    knownFalsePositiveClasses: ['definition pages', 'consumer forums', 'agency articles'],
    templates: ['"dealer worden" verdeler partnerprogramma fabrikant'],
    status: 'disabled',
    lastResult: r(1, 8, 2, 0, 5, 'shadow'),
    note: 'DISABLED. 50% on development, then 25% on a fresh shadow query — Dutch dealer phrasing draws legal blogs, forums and consumer motoring content. Both Dutch families are now disabled, so Dutch discovery is currently unsupported. Stated plainly rather than papered over (§48).',
  },
  {
    name: 'ENGLISH_AUTHORIZED_RESELLER_HARDWARE',
    intent: 'Hardware and AV manufacturers appointing authorised resellers',
    targetMotion: ['reseller', 'dealer'],
    language: 'en',
    semanticClass: 'ecosystem_generic',
    expectedOperatorSignal: 'an authorised reseller or dealer programme owned by the manufacturer',
    knownFalsePositiveClasses: ['listicles', 'legal dictionaries', 'distributors running a supplier programme'],
    templates: ['"authorized reseller" program AV integrator display manufacturer apply', '"authorized dealer program" apply manufacturer equipment'],
    status: 'provisional',
    lastResult: r(1, 7, 4, 0, 3, 'shadow'),
    note: 'HELD provisional. 43% then 57%; trade press dominates this phrasing in English. Usable in shadow, not yet in production.',
  },
  {
    name: 'DUTCH_INSTALLER_OPERATOR',
    intent: 'Dutch manufacturers recruiting certified installers',
    targetMotion: ['installer'],
    language: 'nl',
    semanticClass: 'ecosystem_generic',
    expectedOperatorSignal: 'an installer programme or recognition scheme',
    knownFalsePositiveClasses: ['energy retailers', 'consumer associations', 'advice blogs'],
    templates: ['"installateur worden" partnerprogramma fabrikant erkend'],
    status: 'disabled',
    lastResult: r(1, 7, 2, 0, 5, 'development'),
    note: 'DISABLED at 29%. Dutch consumer-energy content dominates this phrasing. Kept for provenance so it is not silently re-added (§36).',
  },
  {
    name: 'ENGLISH_CERTIFIED_INSTALLER_NETWORK',
    intent: 'Manufacturers running certified installer programmes, in English',
    targetMotion: ['installer'],
    language: 'en',
    semanticClass: 'ecosystem_generic',
    expectedOperatorSignal: 'a manufacturer-owned certification programme',
    knownFalsePositiveClasses: ['trade press', 'locator-software vendors', 'state licensing authorities'],
    templates: ['"certified installer" program apply manufacturer'],
    status: 'disabled',
    lastResult: r(1, 7, 2, 0, 5, 'development'),
    note: 'DISABLED at 29%. English trade vocabulary is saturated by content marketing.',
  },
  {
    name: 'ENGLISH_AUTHORIZED_DEALER_APPLICATION',
    intent: 'Manufacturers accepting dealer applications, in English',
    targetMotion: ['dealer'],
    language: 'en',
    semanticClass: 'ecosystem_generic',
    expectedOperatorSignal: 'a dealer application form on a manufacturer site',
    knownFalsePositiveClasses: ['form templates', 'glossaries', 'how-to articles', 'securities regulators using another sense of "dealer"'],
    templates: ['"become an authorized dealer" application form manufacturer'],
    status: 'disabled',
    lastResult: r(1, 9, 2, 0, 7, 'development'),
    note: 'DISABLED at 22%. Lowest-yield English family measured.',
  },
  {
    name: 'ENGLISH_GENERIC_PARTNER_PROGRAM',
    intent: 'Software vendors running partner programmes, in generic channel English',
    targetMotion: ['reseller', 'solution_partner', 'referral'],
    language: 'en',
    semanticClass: 'ecosystem_generic',
    expectedOperatorSignal: 'a partner programme page with deal registration',
    knownFalsePositiveClasses: ['PRM and channel-software vendors — this category dominates the phrase'],
    templates: ['"become a partner" "deal registration" partner program software'],
    status: 'disabled',
    lastResult: r(1, 8, 2, 6, 0, 'development'),
    note: 'DISABLED at 25% with 75% competitor contamination. This phrasing returns the PRM category itself — Introw\'s competitors, not its prospects. The single clearest argument against channel-generic English discovery.',
  },
  {
    name: 'GERMAN_GENERIC_VERTRIEBSPARTNER',
    intent: 'German vendors recruiting sales partners, in generic sales German',
    targetMotion: ['reseller', 'distributor'],
    language: 'de',
    semanticClass: 'ecosystem_generic',
    expectedOperatorSignal: 'a dealer programme page',
    knownFalsePositiveClasses: ['sales trade press', 'consultants', 'trainers', 'business magazines'],
    templates: ['"Vertriebspartner werden" Händlerprogramm Hersteller'],
    status: 'disabled',
    lastResult: r(1, 6, 0, 0, 6, 'development'),
    note: 'DISABLED at 0%. Same language and sector as the best family; the difference is entirely who authors pages using the phrase. This is the control case proving intent beats language.',
  },
  {
    name: 'SWEDISH_RESELLER_OPERATOR',
    intent: 'Swedish vendors recruiting resellers',
    targetMotion: ['reseller'],
    language: 'sv',
    semanticClass: 'operator_self_description',
    expectedOperatorSignal: 'a "bli återförsäljare" page with commission or programme terms',
    knownFalsePositiveClasses: ['how-to blogs', 'channel-software vendors'],
    templates: ['"bli återförsäljare" partnerprogram tillverkare', '"bli partner" återförsäljarprogram tillverkare'],
    status: 'validated',
    lastResult: r(1, 10, 9, 0, 1, 'shadow'),
    note: 'PROMOTED. 75% on the discovery holdout, then 90% on a fresh shadow query. Two independent runs in a language with no pattern anywhere in this codebase.',
  },
  {
    name: 'ITALIAN_RESELLER_OPERATOR',
    intent: 'Italian vendors appointing authorised resellers',
    targetMotion: ['reseller', 'dealer'],
    language: 'it',
    semanticClass: 'operator_self_description',
    expectedOperatorSignal: 'a "diventare rivenditore autorizzato" application',
    knownFalsePositiveClasses: ['third-party reseller search sites', 'blogs'],
    templates: ['"diventare rivenditore autorizzato" programma partner produttore', '"programma rivenditori" diventa partner produttore'],
    status: 'validated',
    lastResult: r(1, 8, 6, 0, 2, 'shadow'),
    note: 'PROMOTED. 75% on the discovery holdout and 75% again on a fresh shadow query.',
  },
];

/** Families eligible to run, honouring status and the runtime disable list (§27, §36). */
export function activeFamilies(disabled: string[] = [], allowProvisional = false): QueryFamily[] {
  const off = new Set(disabled);
  return QUERY_FAMILIES.filter((f) => !off.has(f.name)
    && (f.status === 'validated' || (allowProvisional && f.status === 'provisional')));
}

/**
 * Candidate confidence contribution from the family that surfaced a company.
 *
 * This is a PROVENANCE weight, not commercial fit (§5). An operator-self-description family
 * means the page was more likely authored by the company about itself — nothing more. It
 * never becomes a score, a rank or a priority.
 */
export function familyConfidence(f: QueryFamily): 'high' | 'medium' | 'low' {
  if (f.semanticClass === 'operator_self_description') {
    return (f.lastResult?.operatorPrecision ?? 0) >= 0.7 ? 'high' : 'medium';
  }
  if (f.semanticClass === 'counterparty_inversion') return 'medium';
  return 'low';
}
