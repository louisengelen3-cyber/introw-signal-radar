/**
 * Fixture accounts for the UX contract.
 *
 * These are NOT sample data dressed up as real accounts. Every fixture exists to
 * pressure-test one state the domain model must be able to render honestly, and the
 * set is deliberately weighted toward incomplete evidence because Phase 0 measured
 * that the modal account is partly empty. Numbers that appear here are invented
 * fixture values and are labelled as such — no fixture reuses a measured figure in
 * a way that could be mistaken for a real finding.
 */
import type { Account, ChannelDirection, Commerciality, Confidence, Fact, IntrowSuitability, PartnerCount, SourceRef, SuitabilityState } from '../src/domain/types.js';

const src = (url: string, establishes: string, authority: SourceRef['authority'] = 'subject_first_party'): SourceRef => ({
  url, authority, establishes, observedAt: '2026-08-18T00:00:00.000Z', retrievedAt: '2026-08-18T00:00:00.000Z', httpStatus: 200,
});

function fact<T>(value: T | null, state: Fact<T>['state'], confidence: Confidence, method: string, sources: SourceRef[] = [], observedAt: string | null = '2026-08-18T00:00:00.000Z'): Fact<T> {
  return { value, state, confidence, method, sources, observedAt };
}
const unknown = <T,>(method: string): Fact<T> => ({ value: null, state: 'unknown', confidence: 'low', method, sources: [], observedAt: null });

const noCount: PartnerCount = { value: null, countType: 'unknown', enumerationComplete: null, unit: null, source: null, observedAt: null, confidence: 'low' };

interface Seed {
  key: string;
  archetype: string;
  /** What this fixture is here to prove the UI can do. */
  proves: string;
  name: string;
  domain: string;
  country: string;
  industry: string;
  commerciality: Commerciality;
  channelReality: Account['qualification']['channelReality'];
  count?: Partial<PartnerCount>;
  crm?: { vendor: 'hubspot' | 'salesforce'; state: 'confirmed' | 'strong_proxy' };
  prm?: string;
  teamSize?: number;
  teamState?: Account['organisation']['teamSizeState'];
  people?: { name: string | null; title: string; persona: Account['organisation']['people'][number]['persona']; currency: Account['organisation']['people'][number]['roleCurrency'] }[];
  timing?: { headline: string; prev: string | number; cur: string | number; category: Account['signals'][number]['category']; effectiveAt: string | null };
  research?: { field: string; reason: string; method: string; priority: 'high' | 'medium' | 'low' }[];
  suppressed?: { reason: string; rule: string };
  relationship?: Account['qualification']['relationship'];
  motions?: Account['program']['motions']['value'];
  scale?: Account['qualification']['programScale'];
  conflict?: string;
  /** Phase 2: whose programme is this? */
  direction?: ChannelDirection;
  /** Phase 2: is this operating model appropriate for Introw? */
  fit?: SuitabilityState;
  fitRule?: string;
  fitWhy?: string;
  fitPositive?: string[];
  fitNegative?: string[];
  /** Distributors publicly carrying this company's products. */
  carriedBy?: string[];
  discoveredVia?: string;
}

const SEEDS: Seed[] = [
  {
    key: 'meridian', archetype: 'O · distributed vendor, operator unresolved',
    proves: 'a distributor-inversion candidate is shown as a candidate, not as a qualified operator',
    name: 'Meridian Sensors', domain: 'meridian.example', country: 'Germany', industry: 'Industrial sensors',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'unknown',
    motions: ['distributor'],
    direction: 'distributed_vendor', fit: 'research_required', fitRule: 'distribution_tier_unresolved',
    fitWhy: 'Two distributors publicly carry this company\'s products, and no invitation to a programme it runs was found. Whether it manages resellers directly, or the distributor does, is the difference between an addressable account and a distributor\'s account.',
    fitNegative: ['carried by 2 independent distributors'],
    carriedBy: ['Exclusive Networks', 'Infinigate'],
    discoveredVia: 'distributor inversion (Infinigate vendor list)',
    teamState: 'unknown',
    research: [{ field: 'programme_ownership', reason: 'products move through distribution; no first-person invitation found', method: 'check whether resellers contract with the company or only with the distributor', priority: 'high' }],
  },
  {
    key: 'calderon', archetype: 'P · participant, not operator',
    proves: 'partner language belonging to another vendor is attributed and the account is refused',
    name: 'Calderon Consulting', domain: 'calderon.example', country: 'United Kingdom', industry: 'Technology consulting',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'unknown',
    motions: ['reseller'],
    direction: 'channel_participant', fit: 'incompatible', fitRule: 'participant_not_operator',
    fitWhy: 'The reseller language here describes this company\'s membership of another vendor\'s programme. Introw is bought by the organisation that runs a programme, not by one that joins one.',
    fitNegative: ['reseller evidence found under /alliances/ and attributed to another vendor'],
    teamState: 'unknown',
    suppressed: { reason: 'channel evidence belongs to another vendor\'s programme', rule: 'participant_not_operator' },
  },
  {
    key: 'halstrom', archetype: 'Q · enterprise operating model',
    proves: 'a real, large transacting channel is demoted on OPERATING MODEL, never on size',
    name: 'Halstrom Networks', domain: 'halstrom.example', country: 'United States', industry: 'Networking',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'large',
    motions: ['distributor', 'reseller', 'system_integrator'],
    direction: 'channel_operator', fit: 'weak', fitRule: 'multi_distributor_mediated_channel',
    fitWhy: 'Three independent distributors carry this company, alongside rebate and co-op fund language and a partner academy. Reached through several distributors, onboarding and registration sit with the distributor rather than the vendor. This is a demotion on structure — a company one tenth the size with the same structure would read the same.',
    fitNegative: ['carried by 3 distributors', 'rebate and co-op fund programme', 'partner academy and certification catalogue'],
    fitPositive: ['deal registration present', 'named partner tiers'],
    carriedBy: ['Exclusive Networks', 'Infinigate', 'TD Synnex'],
    crm: { vendor: 'salesforce', state: 'confirmed' },
    prm: 'Impartner',
    teamState: 'unknown',
  },
  {
    key: 'northwind', archetype: 'A · fully resolved',
    direction: 'channel_operator', fit: 'strong', fitRule: 'direct_programme_with_operational_objects', fitWhy: 'The company runs its own programme and four of the operational objects Introw provides are already visible, with no structural markers of an enterprise operating model.', fitPositive: ['deal registration','partner onboarding','named tiers','partner portal'],
    proves: 'the complete card renders without crowding when every dimension happens to be known',
    name: 'Northwind Systems', domain: 'northwind.example', country: 'Germany', industry: 'SaaS',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'meaningful',
    motions: ['reseller', 'referral'],
    count: { value: 186, countType: 'directory_count', enumerationComplete: true, unit: 'partners', confidence: 'medium' },
    crm: { vendor: 'hubspot', state: 'confirmed' },
    prm: 'home-built',
    teamSize: 2, teamState: 'manually_verified',
    people: [
      { name: 'S. Jansen', title: 'VP Partnerships', persona: 't1_partner_leadership', currency: 'current_verified' },
      { name: 'T. Bakker', title: 'Partner Operations Manager', persona: 't1_partner_revops', currency: 'current_verified' },
    ],
    timing: { headline: 'Partner directory grew 31%', prev: 142, cur: 186, category: 'structural_growth', effectiveAt: '2026-06-01' },
  },
  {
    key: 'kesteven', archetype: 'B · strong programme, CRM unknown',
    direction: 'channel_operator', fit: 'plausible', fitRule: 'direct_programme_partial_objects', fitWhy: 'The company runs its own programme with two operational objects visible and no structural markers against it.', fitPositive: ['partner onboarding','partner portal'],
    proves: 'an unknown CRM reads as an open question, not as a broken or disqualified card',
    name: 'Kesteven Instruments', domain: 'kesteven.example', country: 'United Kingdom', industry: 'Industrial instrumentation',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'meaningful',
    motions: ['distributor', 'reseller'],
    count: { value: 94, countType: 'lower_bound', enumerationComplete: false, unit: 'linked organisations', confidence: 'low' },
    teamState: 'unknown',
    research: [{ field: 'crm', reason: 'no first-party CRM artifact on any inspected page', method: 'check the partner-portal login page and any gated form for a vendor endpoint', priority: 'high' }],
  },
  {
    key: 'verlaine', archetype: 'C · strong programme, team unknown',
    direction: 'channel_operator', fit: 'plausible', fitRule: 'direct_programme_partial_objects', fitWhy: 'A directly-managed installer network with onboarding and certification visible.', fitPositive: ['partner onboarding','certification'],
    proves: 'the organisation block never shows an empty headcount box; it shows what is known and what is being researched',
    name: 'Verlaine Énergie', domain: 'verlaine.example', country: 'France', industry: 'Heating & renewables',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'large',
    motions: ['installer', 'dealer'],
    count: { value: 340, countType: 'approximate', enumerationComplete: null, unit: 'installateurs', confidence: 'medium' },
    crm: { vendor: 'hubspot', state: 'confirmed' },
    teamState: 'unknown',
    research: [{ field: 'partner_owner', reason: 'no partner-titled person found on any company-owned page', method: 'check the installer portal for a named contact, then verify the person independently', priority: 'high' }],
  },
  {
    key: 'brightloom', archetype: 'D · strong programme, count unknown',
    direction: 'channel_operator', fit: 'plausible', fitRule: 'direct_programme_partial_objects', fitWhy: 'Runs its own programme on a competitor platform; the operating model looks centrally managed.', fitPositive: ['partner portal','deal registration'],
    proves: 'the card leads with the evidence that makes the account interesting when no number is available',
    name: 'Brightloom Cloud', domain: 'brightloom.example', country: 'Netherlands', industry: 'SaaS',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'unknown',
    motions: ['reseller', 'msp'],
    crm: { vendor: 'hubspot', state: 'confirmed' },
    prm: 'PartnerStack',
    teamState: 'unknown',
    research: [{ field: 'partner_count', reason: 'partner directory sits behind a portal login', method: 'ask in discovery; do not estimate from the login page', priority: 'medium' }],
  },
  {
    key: 'ardenne', archetype: 'E · Salesforce environment',
    direction: 'both', fit: 'plausible', fitRule: 'distribution_alongside_direct_programme', fitWhy: 'Distribution is present, but the company also runs its own programme. Manufacturers commonly do both; the direct programme is the addressable part.', fitPositive: ['deal registration','named tiers','partner onboarding'], fitNegative: ['carried by 1 distributor'], carriedBy: ['Infinigate'],
    proves: 'Salesforce renders as a first-class compatible environment, not as an exception or a warning',
    name: 'Ardenne Networks', domain: 'ardenne.example', country: 'Belgium', industry: 'Networking hardware',
    commerciality: 'mixed', channelReality: 'confirmed', scale: 'meaningful',
    motions: ['distributor', 'reseller', 'technology'],
    count: { value: 120, countType: 'exact_public', enumerationComplete: null, unit: 'partners', confidence: 'medium' },
    crm: { vendor: 'salesforce', state: 'confirmed' },
    teamState: 'unknown',
  },
  {
    key: 'quilldev', archetype: 'F · integration-only',
    direction: 'unknown', fit: 'unknown', fitRule: 'channel_not_established', fitWhy: 'Suitability is only meaningful once a transacting channel is established.',
    proves: 'suppression is visible and reasoned, not a silent absence from the list',
    name: 'Quill Dev Tools', domain: 'quilldev.example', country: 'United States', industry: 'Developer tools',
    commerciality: 'integration_only', channelReality: 'contradicted', scale: 'unknown',
    motions: ['technology'],
    teamState: 'unknown',
    suppressed: { reason: '4 integration-ecosystem evidence classes and zero strong transacting evidence', rule: 'integration_only' },
  },
  {
    key: 'lumenreach', archetype: 'G · affiliate-only',
    direction: 'unknown', fit: 'unknown', fitRule: 'channel_not_established', fitWhy: 'An affiliate motion is a different buyer and a different object model.',
    proves: 'an affiliate motion is distinguished from a channel rather than counted as one',
    name: 'Lumenreach', domain: 'lumenreach.example', country: 'United States', industry: 'Martech',
    commerciality: 'affiliate_only', channelReality: 'weak', scale: 'unknown',
    motions: ['affiliate'],
    teamState: 'unknown',
    suppressed: { reason: 'affiliate/performance-marketing framing with no deal-registration or platform evidence', rule: 'affiliate_dominant' },
  },
  {
    key: 'valcourt', archetype: 'H · existing Introw fingerprint',
    direction: 'channel_operator', fit: 'strong', fitRule: 'direct_programme_with_operational_objects', fitWhy: 'Runs its own programme with the full set of operational objects — but this is an existing Introw customer and is suppressed from cold outbound.', fitPositive: ['deal registration','partner onboarding','named tiers','partner portal'],
    proves: 'an existing customer is suppressed from cold outbound with the evidence shown, not hidden',
    name: 'Valcourt IoT', domain: 'valcourt.example', country: 'Germany', industry: 'IoT platform',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'meaningful',
    motions: ['reseller', 'solution_partner'],
    count: { value: 78, countType: 'directory_count', enumerationComplete: true, unit: 'partners', confidence: 'medium' },
    prm: 'Introw',
    relationship: 'existing_introw_evidence',
    teamState: 'unknown',
    suppressed: { reason: 'partners.valcourt.example is served by Introw — this is an existing customer', rule: 'existing_relationship' },
  },
  {
    key: 'granvia', archetype: 'I · Factorial-like',
    direction: 'channel_operator', fit: 'plausible', fitRule: 'direct_programme_partial_objects', fitWhy: 'A very large programme run centrally by one partner function. Scale is not a demotion — the operating model is what matters.', fitPositive: ['partner onboarding','named tiers'],
    proves: 'a very large programme with a large team stays commercially relevant — operational load must not demote it',
    name: 'Granvia HR', domain: 'granvia.example', country: 'Spain', industry: 'HR tech',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'large',
    motions: ['reseller', 'referral', 'accountant'],
    count: { value: 500, countType: 'approximate', enumerationComplete: null, unit: 'partners', confidence: 'medium' },
    crm: { vendor: 'hubspot', state: 'confirmed' },
    teamSize: 100, teamState: 'provider_derived',
    people: [{ name: 'C. Arnau', title: 'Partner Revenue Operations', persona: 't1_partner_revops', currency: 'current_claimed' }],
  },
  {
    key: 'hallward', archetype: 'J · strong static fit, no timing',
    direction: 'channel_operator', fit: 'plausible', fitRule: 'direct_programme_partial_objects', fitWhy: 'A directly-managed installer network with a countable directory and no structural markers against it.', fitPositive: ['partner onboarding','certification'],
    proves: 'an account with no dated change is routed to Watchlist rather than given invented urgency',
    name: 'Hallward Controls', domain: 'hallward.example', country: 'Austria', industry: 'Building automation',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'meaningful',
    motions: ['installer', 'dealer'],
    count: { value: 210, countType: 'directory_count', enumerationComplete: true, unit: 'Fachpartner', confidence: 'medium' },
    teamState: 'unknown',
  },
  {
    key: 'orrin', archetype: 'K · structural trigger, incomplete fit',
    direction: 'unknown', fit: 'unknown', fitRule: 'channel_not_established', fitWhy: 'A strong structural trigger, but the channel itself is not yet established. Timing without fit is a research candidate, not a qualified account.',
    proves: 'a strong trigger can surface an account whose fit evidence is still thin, without over-claiming fit',
    name: 'Orrin Industrial', domain: 'orrin.example', country: 'Netherlands', industry: 'Industrial equipment',
    commerciality: 'unknown', channelReality: 'weak', scale: 'unknown',
    teamState: 'unknown',
    timing: { headline: 'Management buyout completed', prev: 'part of parent group', cur: 'independent entity', category: 'structural_discontinuity', effectiveAt: '2026-08-08' },
    research: [{ field: 'commerciality', reason: 'one strong transacting signal with no corroboration', method: 'read the dealer page and check whether the network moved with the new entity', priority: 'high' }],
  },
  {
    key: 'pentworth', archetype: 'L · stale person',
    direction: 'channel_operator', fit: 'plausible', fitRule: 'direct_programme_partial_objects', fitWhy: 'Runs its own programme; the blocker is the person, not the operating model.', fitPositive: ['deal registration','named tiers'],
    proves: 'a person whose role is no longer verified blocks GTM Ready and says why',
    name: 'Pentworth Data', domain: 'pentworth.example', country: 'United Kingdom', industry: 'Data platform',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'meaningful',
    motions: ['reseller'],
    count: { value: 64, countType: 'directory_count', enumerationComplete: true, unit: 'partners', confidence: 'medium' },
    crm: { vendor: 'salesforce', state: 'confirmed' },
    teamState: 'partially_observed', teamSize: 1,
    people: [{ name: 'R. Okonkwo', title: 'Head of Partnerships', persona: 't1_partner_leadership', currency: 'unknown' }],
    research: [{ field: 'person_role_currency', reason: 'role last verified 14 months ago; currency unknown', method: 're-verify employment before any outreach', priority: 'high' }],
  },
  {
    key: 'salford', archetype: 'M · conflicting evidence',
    direction: 'channel_operator', fit: 'plausible', fitRule: 'partial_evidence', fitWhy: 'Some evidence in both directions but not enough of either to be decisive.', fitPositive: ['partner onboarding'],
    proves: 'contradictory observations are shown as a conflict, never silently resolved to the nicer value',
    name: 'Salford Micro', domain: 'salford.example', country: 'United Kingdom', industry: 'Hardware',
    commerciality: 'mixed', channelReality: 'strong', scale: 'unknown',
    motions: ['reseller', 'technology'],
    count: { value: 40, countType: 'lower_bound', enumerationComplete: false, unit: 'linked organisations', confidence: 'low' },
    teamState: 'unknown',
    conflict: 'The partner page states "over 200 resellers"; the enumerable directory lists 40. Shown as a conflict; neither figure is adopted.',
    research: [{ field: 'partner_count', reason: 'stated count and enumerable count disagree by 5x', method: 'ask in discovery which population the 200 refers to', priority: 'medium' }],
  },
  {
    key: 'tamsin', archetype: 'N · unknown-heavy',
    direction: 'unknown', fit: 'unknown', fitRule: 'blocked', fitWhy: 'The site could not be retrieved, so no operating-model evidence exists. This is a blocked retrieval, not an absence of channel.',
    proves: 'the sparsest honest account still reads as a coherent card rather than a broken one',
    name: 'Tamsin Verpakking', domain: 'tamsin.example', country: 'Belgium', industry: 'Packaging machinery',
    commerciality: 'unknown', channelReality: 'unknown', scale: 'unknown',
    teamState: 'unknown',
    research: [
      { field: 'commerciality', reason: 'site is bot-protected; no page could be inspected', method: 'open the site manually and check for a dealer or distributor page', priority: 'medium' },
      { field: 'crm', reason: 'not inspected — site unreachable', method: 'defer until the site can be read', priority: 'low' },
    ],
  },
];

export interface Fixture extends Account {
  archetype: string;
  proves: string;
  conflictNote?: string;
}

export const FIXTURES: Fixture[] = SEEDS.map((s) => {
  const now = '2026-08-18T00:00:00.000Z';
  const partnerPage = `https://${s.domain}/partners`;
  const count: PartnerCount = s.count
    ? { ...noCount, ...s.count, source: src(partnerPage, 'the company publishes this list of partner organisations'), observedAt: now }
    : noCount;

  return {
    archetype: s.archetype,
    proves: s.proves,
    conflictNote: s.conflict,
    identity: {
      id: s.domain, canonicalName: s.name, domain: s.domain, country: s.country, industry: s.industry,
      aliases: [], identityConfidence: 'high', identityMethod: 'fixture', identityState: 'resolved',
    },
    program: {
      companyId: s.domain,
      commerciality: fact(s.commerciality, s.commerciality === 'unknown' ? 'unknown' : 'confirmed', s.commerciality === 'unknown' ? 'low' : 'high', 'classifier verdict', s.commerciality === 'unknown' ? [] : [src(partnerPage, 'programme page evidence')]),
      motions: s.motions ? fact(s.motions, 'confirmed', 'medium', 'self-declared programme vocabulary', [src(partnerPage, 'the company names these partner types')]) : unknown('no programme page could be classified'),
      partnerCount: count,
      portal: s.prm ? fact('present', 'confirmed', 'high', 'partner subdomain resolves to a distinct host', [src(`https://partners.${s.domain}/`, 'a partner portal is served at this host')]) : unknown('no partner portal host observed — not evidence that none exists'),
      dealRegistration: s.commerciality === 'transacting' ? fact('present', 'confirmed', 'high', 'deal-registration page found', [src(`${partnerPage}/register`, 'the company publishes a deal-registration process')]) : unknown('no deal-registration surface observed'),
      tiers: unknown('not inspected'),
      certification: unknown('not inspected'),
      commission: unknown('not inspected'),
      geography: unknown('not inspected'),
      maturity: unknown('not inspected'),
      evidence: [],
      lastVerifiedAt: now,
    },
    environment: {
      companyId: s.domain,
      crm: s.crm ? fact(s.crm.vendor, s.crm.state, s.crm.state === 'confirmed' ? 'high' : 'medium', 'first-party artifact on the company\'s own pages', [src(`https://${s.domain}/contact`, `a ${s.crm.vendor} artifact is served by the company`)]) : unknown('no CRM artifact on any inspected page — not evidence that no CRM is in use'),
      crmCompatibility: s.crm ? 'compatible_confirmed' : 'unknown',
      prm: s.prm ? fact(s.prm, 'confirmed', 'high', 'partner subdomain CNAME', [src(`dns:partners.${s.domain}`, 'the partner surface is served by this platform')]) : unknown('no platform fingerprint found — not evidence that no platform is in use'),
      technical: [],
    },
    organisation: {
      companyId: s.domain,
      people: (s.people ?? []).map((p, i) => ({
        id: `${s.domain}#${i}`, companyId: s.domain, name: p.name, rawTitle: p.title, normalizedTitle: p.title.toLowerCase(),
        persona: p.persona, remit: null, roleCurrency: p.currency, roleStartedAt: null, roleEndedAt: null,
        source: src(`https://${s.domain}/team`, 'the company or a verified source names this person in this role'),
        confidence: p.currency === 'current_verified' ? 'high' : 'medium',
        verifiedAt: p.currency === 'current_verified' ? now : null, provider: 'manual',
      })),
      teamSize: s.teamSize ?? null,
      teamSizeState: s.teamState ?? 'unknown',
      confidence: s.teamState === 'manually_verified' ? 'high' : 'low',
      observedAt: s.teamSize ? now : null,
    },
    operationalLoad: (() => {
      const numeratorOk = count.value !== null && (count.countType === 'directory_count' || count.countType === 'exact_public');
      const denomOk = s.teamSize != null && (s.teamState === 'manually_verified' || s.teamState === 'verified');
      return {
        numerator: count.value, numeratorType: count.countType,
        denominator: s.teamSize ?? null, denominatorState: s.teamState ?? 'unknown',
        ratio: numeratorOk && denomOk ? Math.round((count.value as number) / (s.teamSize as number)) : null,
        availability: numeratorOk && denomOk ? 'available' : 'unavailable',
        unavailableReason: numeratorOk && denomOk ? null
          : !numeratorOk && !denomOk ? 'neither partner count nor team size is reliable enough'
            : !numeratorOk ? `partner count is ${count.countType.replace('_', ' ')}, not a census` : `team size state is ${s.teamState ?? 'unknown'}`,
        confidence: numeratorOk && denomOk ? 'medium' : 'low',
        calculatedAt: numeratorOk && denomOk ? now : null,
      };
    })(),
    signals: s.timing ? [{
      id: `${s.domain}#sig`, companyId: s.domain, type: s.timing.category, category: s.timing.category,
      headline: s.timing.headline, effectiveAt: s.timing.effectiveAt, observedAt: now,
      firstSeenAt: '2026-02-14T00:00:00.000Z', lastSeenAt: now,
      previousValue: s.timing.prev, currentValue: s.timing.cur, confidence: 'medium',
      evidence: [src(partnerPage, 'two dated observations of the same surface differ')],
      commercialInterpretation: s.timing.category === 'structural_growth'
        ? 'The published network expanded between two dated observations.'
        : 'An ownership event was published by a named source.',
      forbiddenInterpretation: s.timing.category === 'structural_growth'
        ? 'Do not claim the programme launched, or that the team is struggling.'
        : 'Do not assume the partner network moved with the new entity.',
    }] : [],
    research: (s.research ?? []).map((r, i) => ({
      id: `${s.domain}#r${i}`, companyId: s.domain, missingField: r.field, reason: r.reason,
      priority: r.priority, status: 'open' as const, suggestedMethod: r.method, createdAt: now,
    })),
    suitability: s.fit ? {
      state: s.fit,
      confidence: 'medium',
      rule: s.fitRule ?? 'partial_evidence',
      rationale: s.fitWhy ?? '',
      positiveEvidence: (s.fitPositive ?? []).map((c) => ({ dimension: 'operational_artifacts', claim: c, sourceUrl: partnerPage, relatesTo: 'deal_registration' })),
      negativeEvidence: (s.fitNegative ?? []).map((c) => ({ dimension: 'channel_depth', claim: c, sourceUrl: partnerPage, relatesTo: 'multi_tier_governance' })),
      unknowns: ['partner-team size', 'partner-sourced revenue share'],
      blockers: [],
      researchNeeded: (s.research ?? []).map((r) => ({ field: r.field, reason: r.reason, method: r.method })),
      evaluatedAt: now,
    } as IntrowSuitability : null,
    relationships: (s.carriedBy ?? []).map((d) => ({
      sourceCompany: s.domain, targetCompany: d, relationshipType: 'DISTRIBUTES' as const, direction: 'inbound' as const,
      evidence: src(`https://${d.toLowerCase().replace(/\s+/g, '')}.example/vendors`, `${d} lists this company among the brands it distributes`, 'counterparty'),
      confidence: 'medium' as const, observedAt: now,
    })),
    programmes: s.motions ? [{ programId: `${s.domain}#main`, operatorCompany: s.direction === 'channel_participant' ? null : s.domain, name: null, motions: s.motions, surfaces: [partnerPage], confidence: 'medium' as const, method: 'self-declared programme vocabulary on the company\'s own surface' }] : [],
    suppression: s.suppressed
      ? { suppressed: true, rule: s.suppressed.rule, reason: s.suppressed.reason, scope: 'cold_outbound' as const }
      : { suppressed: false, rule: null, reason: null, scope: null },
    qualification: {
      channelReality: s.channelReality,
      commerciality: s.commerciality,
      channelDirection: s.direction ?? 'unknown',
      suitability: s.fit ?? 'unknown',
      programScale: s.scale ?? 'unknown',
      environment: s.crm ? 'compatible_confirmed' : 'unknown',
      organisation: s.people?.length ? (s.people.every((p) => p.currency === 'current_verified') ? 'verified' : 'partial') : 'unknown',
      timing: s.timing ? 'strong' : 'none_observed',
      evidenceConfidence: s.channelReality === 'confirmed' ? 'high' : s.channelReality === 'strong' ? 'medium' : 'low',
      researchState: s.research?.length ? 'research_needed' : 'resolved',
      relationship: s.relationship ?? 'no_evidence_observed',
      suppressed: s.suppressed ?? null,
    },
    discoveredVia: [{ mechanism: s.discoveredVia ?? 'fixture', source: src(`https://${s.domain}/`, 'fixture seed') }],
  };
});
