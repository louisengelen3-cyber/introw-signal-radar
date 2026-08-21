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
import type { Account, Commerciality, Confidence, Fact, PartnerCount, SourceRef } from '../src/domain/types.js';

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
}

const SEEDS: Seed[] = [
  {
    key: 'northwind', archetype: 'A · fully resolved',
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
    proves: 'suppression is visible and reasoned, not a silent absence from the list',
    name: 'Quill Dev Tools', domain: 'quilldev.example', country: 'United States', industry: 'Developer tools',
    commerciality: 'integration_only', channelReality: 'contradicted', scale: 'unknown',
    motions: ['technology'],
    teamState: 'unknown',
    suppressed: { reason: '4 integration-ecosystem evidence classes and zero strong transacting evidence', rule: 'integration_only' },
  },
  {
    key: 'lumenreach', archetype: 'G · affiliate-only',
    proves: 'an affiliate motion is distinguished from a channel rather than counted as one',
    name: 'Lumenreach', domain: 'lumenreach.example', country: 'United States', industry: 'Martech',
    commerciality: 'affiliate_only', channelReality: 'weak', scale: 'unknown',
    motions: ['affiliate'],
    teamState: 'unknown',
    suppressed: { reason: 'affiliate/performance-marketing framing with no deal-registration or platform evidence', rule: 'affiliate_dominant' },
  },
  {
    key: 'valcourt', archetype: 'H · existing Introw fingerprint',
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
    proves: 'an account with no dated change is routed to Watchlist rather than given invented urgency',
    name: 'Hallward Controls', domain: 'hallward.example', country: 'Austria', industry: 'Building automation',
    commerciality: 'transacting', channelReality: 'confirmed', scale: 'meaningful',
    motions: ['installer', 'dealer'],
    count: { value: 210, countType: 'directory_count', enumerationComplete: true, unit: 'Fachpartner', confidence: 'medium' },
    teamState: 'unknown',
  },
  {
    key: 'orrin', archetype: 'K · structural trigger, incomplete fit',
    proves: 'a strong trigger can surface an account whose fit evidence is still thin, without over-claiming fit',
    name: 'Orrin Industrial', domain: 'orrin.example', country: 'Netherlands', industry: 'Industrial equipment',
    commerciality: 'unknown', channelReality: 'weak', scale: 'unknown',
    teamState: 'unknown',
    timing: { headline: 'Management buyout completed', prev: 'part of parent group', cur: 'independent entity', category: 'structural_discontinuity', effectiveAt: '2026-08-08' },
    research: [{ field: 'commerciality', reason: 'one strong transacting signal with no corroboration', method: 'read the dealer page and check whether the network moved with the new entity', priority: 'high' }],
  },
  {
    key: 'pentworth', archetype: 'L · stale person',
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
    qualification: {
      channelReality: s.channelReality,
      commerciality: s.commerciality,
      programScale: s.scale ?? 'unknown',
      environment: s.crm ? 'compatible_confirmed' : 'unknown',
      organisation: s.people?.length ? (s.people.every((p) => p.currency === 'current_verified') ? 'verified' : 'partial') : 'unknown',
      timing: s.timing ? 'strong' : 'none_observed',
      evidenceConfidence: s.channelReality === 'confirmed' ? 'high' : s.channelReality === 'strong' ? 'medium' : 'low',
      researchState: s.research?.length ? 'research_needed' : 'resolved',
      relationship: s.relationship ?? 'no_evidence_observed',
      suppressed: s.suppressed ?? null,
    },
    discoveredVia: [{ mechanism: 'fixture', source: src(`https://${s.domain}/`, 'fixture seed') }],
  };
});
