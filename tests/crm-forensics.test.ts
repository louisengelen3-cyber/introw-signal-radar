/**
 * CRM forensics regression tests (mandate §56).
 *
 * The asymmetry from §49 governs this file: a false CONFIRMED_CURRENT is more damaging than
 * an UNKNOWN, so most of these assert that the system REFUSES to confirm. A test that only
 * checked we find things would pass happily on a system that confirms everything.
 */
import { describe, it, expect } from 'vitest';
import { observeText, observeFingerprint } from '../src/crm/observe.js';
import {
  resolveVendor, applyAudit, detectConflict, assembleForensics, levelForObservation,
  type CrmObservation, type CrmSourceType,
} from '../src/crm/forensics.js';
import { jobFamily } from '../src/crm/jobsources.js';
import { assessFit, crmCompatible, type FitEvidence } from '../src/fit/assess.js';

const NOW = '2026-08-24T00:00:00.000Z';

const obs = (text: string, o: Partial<{ sourceType: CrmSourceType; publishedAt: string | null; jobTitle: string | null }> = {}) =>
  observeText({
    company: 'example.com', text, sourceUrl: 'https://example.com/job',
    sourceType: o.sourceType ?? 'company_ats_vacancy',
    sourcePublishedAt: o.publishedAt === undefined ? '2026-07-01' : o.publishedAt,
    jobTitle: o.jobTitle ?? 'Account Executive', observedAt: NOW,
  });

const levelOf = (os: CrmObservation[], vendor: string) =>
  applyAudit(resolveVendor(vendor, os.filter((x) => x.vendor === vendor), NOW), NOW).level;

describe('§7/§42 CRM evidence is not partner-job-only', () => {
  it('confirms Salesforce from a plain Account Executive vacancy', () => {
    const o = obs('Maintain accurate pipeline and opportunity data in Salesforce throughout the sales cycle.', { jobTitle: 'Enterprise Account Executive' });
    expect(levelOf(o, 'Salesforce')).toBe('confirmed_current');
  });

  it('confirms HubSpot from a RevOps vacancy', () => {
    const o = obs('Own HubSpot administration, including workflows, lifecycle stages and reporting.', { jobTitle: 'Revenue Operations Manager' });
    expect(levelOf(o, 'HubSpot')).toBe('confirmed_current');
  });

  it('confirms from a Customer Success vacancy — no sales title required', () => {
    const o = obs('Log every customer interaction in HubSpot so the account team has one view.', { jobTitle: 'Customer Success Manager' });
    expect(levelOf(o, 'HubSpot')).toBe('confirmed_current');
  });

  it('classifies job families so the invariant is measurable, not asserted', () => {
    expect(jobFamily('Enterprise Account Executive')).toBe('sales');
    expect(jobFamily('Revenue Operations Manager')).toBe('revops');
    expect(jobFamily('Head of Partnerships')).toBe('partnerships');
    expect(jobFamily('Marketing Operations Specialist')).toBe('marketing');
    // The invariant: a CRM conclusion must be reachable from a title that is not partnerships.
    expect(jobFamily('Enterprise Account Executive')).not.toBe('partnerships');
  });
});

describe('§17/§18 possession vs experience vs alternatives', () => {
  it('does not confirm from candidate experience alone', () => {
    const o = obs('Experience with Salesforce is preferred.');
    expect(levelOf(o, 'Salesforce')).toBe('strong_supporting');
  });

  it('confirms neither system from a generic "Salesforce or HubSpot" requirement', () => {
    const o = obs('Experience with Salesforce, HubSpot or a similar CRM is required.');
    expect(levelOf(o, 'Salesforce')).toBe('mention_only');
    expect(levelOf(o, 'HubSpot')).toBe('mention_only');
  });

  it('does not confirm from a tool list', () => {
    const o = obs('Familiarity with tools such as Salesforce, HubSpot, Pipedrive or Zoho.');
    for (const v of ['Salesforce', 'HubSpot', 'Pipedrive', 'Zoho']) expect(levelOf(o, v)).toBe('mention_only');
  });

  it('does not treat a duty list introduced by "including" as a category example', () => {
    // "Own HubSpot administration, including workflows" — the marker introduces duties, not
    // CRM alternatives. Reading it as a category example threw away the strongest signal a
    // RevOps advert carries.
    const o = obs('Own HubSpot administration, including workflows, lifecycle stages and reporting.');
    expect(levelOf(o, 'HubSpot')).toBe('confirmed_current');
  });
});

describe('§19 customer integration is not internal use', () => {
  it('does not confirm a CRM the company merely integrates with', () => {
    const o = obs('Our platform integrates natively with Salesforce so customers keep their data in sync.');
    expect(levelOf(o, 'Salesforce')).toBe('mention_only');
  });

  it('is not fooled by the possessive in "our platform"', () => {
    // "our … Salesforce" satisfies the possession pattern; only the integration guard saves it.
    const o = obs('Our product offers a two-way sync with Salesforce for our customers.');
    expect(levelOf(o, 'Salesforce')).not.toMatch(/^confirmed/);
  });
});

describe('§15/§16 historical evidence stays historical', () => {
  it('does not age a 2023 vacancy into a current claim', () => {
    const o = obs('You will manage all opportunities in Salesforce and report weekly on pipeline.', {
      sourceType: 'company_cached_vacancy', publishedAt: '2023-05-04',
    });
    expect(levelOf(o, 'Salesforce')).toBe('confirmed_historical');
  });

  it('levels a two-year-old strong source as recent, not current', () => {
    const o = obs('Administer our Pipedrive CRM and keep the deal pipeline clean.', {
      sourceType: 'company_cached_vacancy', publishedAt: '2025-01-10',
    });
    expect(levelOf(o, 'Pipedrive')).toBe('confirmed_recent');
  });

  it('refuses to call an undated non-live source current', () => {
    const o = obs('Maintain opportunities in Salesforce.', { sourceType: 'recruiting_mirror', publishedAt: null });
    expect(levelOf(o, 'Salesforce')).not.toMatch(/^confirmed_current/);
  });

  it('keeps a live undated board advert current — it is being served now', () => {
    const o = obs('Own our HubSpot instance and keep deal stages accurate.', { publishedAt: null });
    expect(levelOf(o, 'HubSpot')).toBe('confirmed_current');
  });
});

describe('§45 source trust', () => {
  it('does not let a search snippet establish current use', () => {
    const o = obs('… manage our Salesforce pipeline and forecast …', { sourceType: 'search_snippet' });
    expect(levelOf(o, 'Salesforce')).toBe('strong_supporting');
  });

  it('downgrades a single low-trust mirror below current', () => {
    const o = obs('You will own our HubSpot CRM and its reporting.', { sourceType: 'recruiting_mirror', publishedAt: '2026-06-01' });
    expect(levelOf(o, 'HubSpot')).toBe('confirmed_recent');
  });
});

describe('§20 website fingerprints support, never confirm', () => {
  it('does not confirm Sales Hub from a HubSpot tracking artifact', () => {
    const f = observeFingerprint({ company: 'example.com', vendor: 'HubSpot', quote: 'js.hs-scripts.com/48407761.js', sourceUrl: 'https://example.com/', observedAt: NOW });
    expect(levelOf([f], 'HubSpot')).toBe('strong_supporting');
    expect(f.doesNotProve).toMatch(/which of the vendor|sales runs on it/i);
  });
});

describe('§21/§22 conflicts are information, not ties to break', () => {
  it('reports a website-HubSpot plus jobs-Salesforce environment rather than picking one', () => {
    const all = [
      ...obs('Keeping your pipeline and activities up to date in Salesforce.', { jobTitle: 'BDR' }),
      observeFingerprint({ company: 'example.com', vendor: 'HubSpot', quote: 'js.hs-scripts.com/1.js', sourceUrl: 'https://example.com/', observedAt: NOW }),
    ];
    const vendors = ['Salesforce', 'HubSpot'].map((v) => applyAudit(resolveVendor(v, all.filter((o) => o.vendor === v), NOW), NOW));
    const conflict = detectConflict(vendors);
    expect(conflict).not.toBeNull();
    expect(conflict!.vendors).toEqual(expect.arrayContaining(['Salesforce', 'HubSpot']));
    expect(conflict!.explanation).toMatch(/marketing tooling|system of record/i);
  });

  it('does not claim a migration without a supporting chronology', () => {
    const all = [
      ...obs('Administer our HubSpot CRM.', { publishedAt: '2026-06-01' }),
      ...obs('Administer our Salesforce instance.', { publishedAt: '2026-05-01' }),
    ];
    const vendors = ['HubSpot', 'Salesforce'].map((v) => applyAudit(resolveVendor(v, all.filter((o) => o.vendor === v), NOW), NOW));
    const c = detectConflict(vendors);
    expect(c?.kind).toBe('multiple_systems');   // overlapping dates — not a transition
  });
});

describe('§49 unknown is preserved and absence is never negative', () => {
  it('returns unknown when nothing names a CRM', () => {
    const r = assembleForensics('example.com', [], { atsBoardFound: false, vacanciesRead: 0, historicalVacanciesRead: 0, nonPartnerTitlesRead: 0, searchQueriesRun: 0, linkedinBlocked: false, sourcesConsulted: [] }, { queries: 0, sourcesInspected: 0, jobsInspected: 0 }, NOW);
    expect(r.vendors).toHaveLength(0);
    expect(r.note).toMatch(/not evidence that the company has no CRM/i);
  });

  it('says so explicitly when vacancies were read and nothing was found', () => {
    const r = assembleForensics('example.com', [], { atsBoardFound: true, vacanciesRead: 12, historicalVacanciesRead: 0, nonPartnerTitlesRead: 12, searchQueriesRun: 0, linkedinBlocked: false, sourcesConsulted: ['company_ats_vacancy'] }, { queries: 0, sourcesInspected: 12, jobsInspected: 12 }, NOW);
    expect(r.note).toMatch(/never means "no CRM"/i);
  });

  it('does not guess a vendor from generic CRM language', () => {
    expect(obs('You will keep the CRM up to date and report on pipeline weekly.')).toHaveLength(0);
  });

  it('never matches bare "dynamics"', () => {
    expect(obs('You understand the dynamics of selling a complex platform.')).toHaveLength(0);
  });
});

describe('§5/§53 fit is a state with reasons, never a score', () => {
  const base: FitEvidence = {
    programmeOwnership: 'owned', commercialMotion: 'evidenced',
    operationalSurfaces: ['partner_recruitment', 'deal_registration'],
    materiality: 'evidenced', crm: { vendor: 'Salesforce', level: 'confirmed_current', compatible: true },
    peopleObserved: 0, contradictions: [],
    observability: { pagesRead: 10, vacanciesRead: 5, blocked: false },
    category: 'likely_target_category', knownCompetitor: false, prmInUse: null,
  };

  it('produces no numeric score anywhere', () => {
    const a = assessFit(base);
    expect(JSON.stringify(a)).not.toMatch(/"(score|rank|priority|percentile)"/i);
    expect(a.reasons.length).toBeGreaterThan(0);
  });

  it('does not reject on unknown CRM (§34)', () => {
    const a = assessFit({ ...base, crm: { vendor: null, level: 'unknown', compatible: null } });
    expect(a.state).toBe('plausible_introw_fit');
    expect(a.reasons.join(' ')).toMatch(/not a reason to deprioritise/i);
  });

  it('reports an incompatible CRM as a constraint, not a rejection', () => {
    const a = assessFit({ ...base, crm: { vendor: 'Microsoft Dynamics', level: 'confirmed_current', compatible: false } });
    expect(a.state).toBe('plausible_introw_fit');
    expect(a.reasons.join(' ')).toMatch(/constraint a seller should know/i);
  });

  it('calls sparse evidence under-observed, never likely-not-fit (§35, §38)', () => {
    const a = assessFit({
      ...base, programmeOwnership: 'unknown', commercialMotion: 'unknown', materiality: 'unknown',
      operationalSurfaces: [], observability: { pagesRead: 1, vacanciesRead: 0, blocked: false },
    });
    expect(a.state).toBe('under_observed');
    expect(a.doesNotClaim).toMatch(/not the same as doing little|no partner programme/i);
  });

  it('uses likely_not_fit only with positive negative evidence', () => {
    const a = assessFit({ ...base, programmeOwnership: 'participant' });
    expect(a.state).toBe('likely_not_fit');
    expect(a.reasons[0]).toMatch(/appears in other companies/i);
  });

  it('suppresses a competitor without calling it a bad prospect', () => {
    const a = assessFit({ ...base, knownCompetitor: true });
    expect(a.state).toBe('suppress');
    expect(a.doesNotClaim).toMatch(/very likely does/i);
  });

  it('treats another PRM in use as displacement evidence, not a disqualifier (§32)', () => {
    const a = assessFit({ ...base, prmInUse: 'PartnerStack' });
    expect(a.state).toBe('plausible_introw_fit');
    expect(a.reasons.join(' ')).toMatch(/not a disqualifier/i);
  });

  it('names what would resolve a research_required state (§37)', () => {
    const a = assessFit({ ...base, programmeOwnership: 'both', operationalSurfaces: [], commercialMotion: 'implied', materiality: 'unknown' });
    expect(a.state).toBe('research_required');
    expect(a.wouldResolve.length).toBeGreaterThan(0);
  });

  it('knows which CRMs Introw connects to', () => {
    expect(crmCompatible('HubSpot')).toBe(true);
    expect(crmCompatible('Salesforce')).toBe(true);
    expect(crmCompatible('Microsoft Dynamics')).toBe(false);
    expect(crmCompatible(null)).toBeNull();
  });
});

describe('§26 existing evidence is merged, not replaced', () => {
  it('keeps a fingerprint visible alongside a stronger job finding', () => {
    const all = [
      ...obs('Keeping your pipeline up to date in Salesforce.', { jobTitle: 'BDR' }),
      observeFingerprint({ company: 'example.com', vendor: 'HubSpot', quote: 'js.hs-scripts.com/1.js', sourceUrl: 'https://example.com/', observedAt: NOW }),
    ];
    const r = assembleForensics('example.com', all, { atsBoardFound: true, vacanciesRead: 1, historicalVacanciesRead: 0, nonPartnerTitlesRead: 1, searchQueriesRun: 0, linkedinBlocked: false, sourcesConsulted: ['company_ats_vacancy', 'website_fingerprint'] }, { queries: 0, sourcesInspected: 2, jobsInspected: 1 }, NOW);
    expect(r.vendors.map((v) => v.vendor)).toEqual(expect.arrayContaining(['Salesforce', 'HubSpot']));
  });
});

describe('§55 provenance is retained on every observation', () => {
  it('carries source, quote, dates and both proof statements', () => {
    const [o] = obs('Administer our Salesforce instance.');
    expect(o.sourceUrl).toBeTruthy();
    expect(o.quote).toContain('Salesforce');
    expect(o.observedAt).toBe(NOW);
    expect(o.sourcePublishedAt).toBe('2026-07-01');
    expect(o.proves).toBeTruthy();
    expect(o.doesNotProve).toBeTruthy();
    expect(levelForObservation(o, NOW)).toBe('confirmed_current');
  });
});

describe('§23/§47 false confirmations caught by adversarial audit', () => {
  it('does not read "Salesforce Admin knowledge is a plus" as possession', () => {
    // Real false positive: `Salesforce admin` matched a noun-binding possession rule, and
    // possession is tested before requirement framing, so a candidate SKILL confirmed a CRM.
    const o = obs('Salesforce Admin knowledge is a plus.', { jobTitle: 'Technical Deployment Lead' });
    expect(levelOf(o, 'Salesforce')).toBe('strong_supporting');
  });

  it('still reads a genuine possession noun as possession', () => {
    expect(levelOf(obs('You will administer our Salesforce instance.'), 'Salesforce')).toBe('confirmed_current');
    expect(levelOf(obs('Maintain the HubSpot workspace and its reporting.'), 'HubSpot')).toBe('confirmed_current');
  });

  it('refuses to confirm from a careers index that concatenates many adverts', () => {
    // Real false positive: a /careers/feed page merged several roles, so a Salesforce
    // sentence from one advert was attributed to "All job roles".
    const o = obs('Keeping your pipeline up to date in Salesforce.', { sourceType: 'company_careers_index' });
    expect(levelOf(o, 'Salesforce')).toBe('strong_supporting');
  });
});
