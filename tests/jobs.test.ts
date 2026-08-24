/**
 * Job-enrichment tests.
 *
 * The layer's whole value depends on one distinction — what a company SAYS ABOUT ITSELF versus
 * what it ASKS A CANDIDATE FOR — so most of what follows is that distinction under pressure.
 */
import { describe, expect, it } from 'vitest';
import { classifySentence, scanVacancy, sentences } from '../src/jobs/crm.js';
import { scanVacancyOperational } from '../src/jobs/operational.js';
import { aggregateVendor, summariseCrm } from '../src/jobs/enrich.js';
import { buildCrmBundle } from '../src/jobs/bundle.js';
import { canonicalise } from '../src/jobs/ats.js';
import type { Currentness, JobCrmHit, Vacancy } from '../src/jobs/types.js';

const HUBSPOT = { id: 'hubspot', label: 'HubSpot', re: /\bhub\s?spot\b/i };
const SALESFORCE = { id: 'salesforce', label: 'Salesforce', re: /\bsalesforce\b|\bsfdc\b/i };

const vac = (over: Partial<Vacancy> = {}): Vacancy => ({
  id: 'v1', companyDomain: 'x.com', jobTitle: 'RevOps Manager', location: null,
  jobUrl: 'https://x.com/jobs/1', source: 'https://api', sourceType: 'company_ats',
  publishedAt: null, retrievedAt: '2026-08-24T00:00:00Z', currentness: 'current',
  description: '', language: null, ownership: 'owned', ownershipBasis: 'first_party_link',
  ...over,
});

describe('CRM: company usage vs candidate requirement', () => {
  it('treats explicit ownership of a named instance as confirmed', () => {
    for (const s of ['You will own our HubSpot CRM.', 'Administer our HubSpot instance.', 'Our sales team uses HubSpot to manage pipeline.']) {
      expect(classifySentence(s, HUBSPOT)?.level, s).toBe('crm_confirmed');
    }
  });

  it('treats an operational duty in a named system as confirmed', () => {
    // These are the mandate's own examples: the duty describes work at THIS company.
    for (const s of ['Log all customer interactions in HubSpot.', 'Maintain Salesforce opportunity stages and pipeline hygiene.']) {
      const v = classifySentence(s, /hubspot/i.test(s) ? HUBSPOT : SALESFORCE);
      expect(v?.level, s).toBe('crm_confirmed');
    }
  });

  it('treats a skill request as supporting only, never confirmed', () => {
    for (const s of ['Experience with HubSpot is a plus.', 'Experience with HubSpot preferred.', 'HubSpot certification is desirable.']) {
      expect(classifySentence(s, HUBSPOT)?.level, s).toBe('crm_supporting_evidence');
    }
  });

  it('never confirms a specific CRM from a list of alternatives', () => {
    // The dangerous case: one sentence naming two competing systems proves neither.
    const s = 'Experience with CRM systems such as Salesforce or HubSpot.';
    expect(classifySentence(s, SALESFORCE)?.level).toBe('crm_mention_only');
    expect(classifySentence(s, HUBSPOT)?.level).toBe('crm_mention_only');
  });

  it('does not confirm a CRM a product merely integrates with', () => {
    expect(classifySentence('We integrate with HubSpot and Salesforce for our customers.', HUBSPOT)?.level).toBe('crm_mention_only');
  });

  it('never matches a CRM name that is also an ordinary English word', () => {
    // "market dynamics" and "the dynamics of selling" produced a CONFIRMED Microsoft Dynamics
    // verdict for a product-analytics company. Vendor tokens must be unambiguous.
    const DYNAMICS = { id: 'dynamics', label: 'Microsoft Dynamics', re: /\b(microsoft|ms)\s+dynamics\b|\bdynamics\s*(365|crm)\b/i };
    expect(classifySentence('Develop a deep understanding of our customers and market dynamics.', DYNAMICS)).toBeNull();
    expect(classifySentence('Understand the dynamics of selling a complex platform.', DYNAMICS)).toBeNull();
    expect(classifySentence('You will administer our Microsoft Dynamics instance.', DYNAMICS)?.level).toBe('crm_confirmed');
    expect(classifySentence('Maintain records in Dynamics 365.', DYNAMICS)?.level).toBe('crm_confirmed');
  });

  it('reads possession in Dutch and German', () => {
    expect(classifySentence('Je houdt alles bij in ons HubSpot CRM.', HUBSPOT)?.level).toBe('crm_confirmed');
    expect(classifySentence('Du pflegst unsere Salesforce-Daten.', SALESFORCE)?.level).toBe('crm_confirmed');
  });

  it('keeps only the strongest verdict per vendor per vacancy', () => {
    // One advert is one observation. A confirmation and a mention in the same advert must not
    // become two pieces of evidence.
    const hits = scanVacancy(vac({
      description: 'Experience with HubSpot is a plus. You will own our HubSpot CRM. HubSpot is mentioned again here.',
    })).hits;
    expect(hits.filter((h) => h.vendor === 'HubSpot')).toHaveLength(1);
    expect(hits[0].level).toBe('crm_confirmed');
  });

  it('yields nothing from a vacancy with no description', () => {
    expect(scanVacancy(vac({ description: '' })).hits).toHaveLength(0);
  });

  it('splits bullet lists into sentences', () => {
    expect(sentences('• Own our HubSpot CRM. • Experience with Looker is a plus.').length).toBeGreaterThanOrEqual(2);
  });
});

const hit = (over: Partial<JobCrmHit> = {}): JobCrmHit => ({
  vendor: 'HubSpot', level: 'crm_supporting_evidence', quote: 'q', rule: 'candidate_requirement',
  vacancyId: 'v1', jobTitle: 'AE', jobUrl: 'https://x.com/1', currentness: 'current',
  proves: 'p', doesNotProve: 'd', ...over,
});

describe('CRM aggregation', () => {
  it('reaches strong only from several independent current vacancies', () => {
    const one = aggregateVendor('HubSpot', [hit({ vacancyId: 'a' })]);
    expect(one.level).toBe('crm_supporting_evidence');
    const two = aggregateVendor('HubSpot', [hit({ vacancyId: 'a' }), hit({ vacancyId: 'b' })]);
    expect(two.level).toBe('crm_strong_evidence');
  });

  it('does not reach strong from one vacancy repeated', () => {
    const same = aggregateVendor('HubSpot', [hit({ vacancyId: 'a' }), hit({ vacancyId: 'a' })]);
    expect(same.level).toBe('crm_supporting_evidence');
  });

  it('does not count non-current vacancies toward strong', () => {
    const stale: Currentness = 'recent_historical';
    const v = aggregateVendor('HubSpot', [hit({ vacancyId: 'a', currentness: stale }), hit({ vacancyId: 'b', currentness: stale })]);
    expect(v.level).toBe('crm_supporting_evidence');
  });

  it('never lets mentions alone exceed mention_only', () => {
    const v = aggregateVendor('HubSpot', [hit({ vacancyId: 'a', level: 'crm_mention_only' }), hit({ vacancyId: 'b', level: 'crm_mention_only' })]);
    expect(v.level).toBe('crm_mention_only');
  });

  it('preserves a conflict rather than choosing a winner', () => {
    const s = summariseCrm([
      hit({ vendor: 'HubSpot', level: 'crm_confirmed', vacancyId: 'a' }),
      hit({ vendor: 'Salesforce', level: 'crm_confirmed', vacancyId: 'b' }),
    ]);
    expect(s.conflict).toBe('multiple_systems_observed');
    expect(s.verdicts).toHaveLength(2);
  });
});

describe('CRM bundle', () => {
  const fp = { vendorLabel: 'HubSpot', confirmed: true, quote: 'js.hs-scripts.com/1.js', sourceUrl: 'https://x.com/', proves: 'p', doesNotProve: 'd', observedAt: '2026-08-24T00:00:00Z' };

  it('combines website and job evidence without adding them up', () => {
    const b = buildCrmBundle([fp], [aggregateVendor('HubSpot', [hit({ vacancyId: 'a' })])], { websiteChecked: true, jobsChecked: true, vacanciesRead: 5 });
    expect(b.primary?.vendor).toBe('HubSpot');
    expect(b.primary?.sources.length).toBe(2);
    expect(b.primary?.level).toBe('crm_confirmed');
  });

  it('lifts two independent supporting sources to strong, not to confirmed', () => {
    const weakFp = { ...fp, confirmed: false };
    const b = buildCrmBundle([weakFp], [aggregateVendor('HubSpot', [hit({ vacancyId: 'a' })])], { websiteChecked: true, jobsChecked: true, vacanciesRead: 1 });
    expect(b.primary?.level).toBe('crm_strong_evidence');
  });

  it('states unknown, never absence, when nothing was found', () => {
    const b = buildCrmBundle([], [], { websiteChecked: true, jobsChecked: true, vacanciesRead: 12 });
    expect(b.primary).toBeNull();
    expect(b.note).toMatch(/not evidence that the company has no CRM/i);
    expect(b.note).not.toMatch(/\bno HubSpot\b|\bdoes not use\b/i);
  });

  it('reports a conflict between website and jobs instead of resolving it', () => {
    const b = buildCrmBundle([fp], [aggregateVendor('Salesforce', [hit({ vendor: 'Salesforce', level: 'crm_confirmed', vacancyId: 'a' })])], { websiteChecked: true, jobsChecked: true, vacanciesRead: 3 });
    expect(b.conflict).toBe('multiple_systems_observed');
    expect(b.note).toMatch(/may legitimately run several/i);
  });
});

describe('operational evidence', () => {
  it('extracts partner workflow facts with their quote', () => {
    const hits = scanVacancyOperational(vac({
      jobTitle: 'Channel Operations Manager',
      description: 'You will manage partner-submitted opportunities in Salesforce, maintain deal-registration workflows and work with regional partner managers on partner-sourced pipeline.',
    }));
    const facts = hits.map((h) => h.fact);
    expect(facts).toContain('deal_registration');
    expect(facts).toContain('partner_pipeline');
    for (const h of hits) { expect(h.quote.length).toBeGreaterThan(5); expect(h.doesNotProve.length).toBeGreaterThan(5); }
  });

  it('records a hiring signal from a partner role title and nothing more', () => {
    const hits = scanVacancyOperational(vac({ jobTitle: 'Partner Manager', description: 'We are hiring a Partner Manager.' }));
    const hiring = hits.find((h) => h.fact === 'partner_role_hiring');
    expect(hiring).toBeDefined();
    expect(hiring!.doesNotProve).toMatch(/that a partner team already exists/i);
    // Hiring for a role must never become a team size.
    expect(hits.find((h) => h.fact === 'partner_team_size_stated')).toBeUndefined();
  });

  it('records a team size only when the company states one', () => {
    const stated = scanVacancyOperational(vac({ jobTitle: 'Partner Manager', description: 'You will join our team of four Partner Managers.' }));
    const size = stated.find((h) => h.fact === 'partner_team_size_stated');
    expect(size?.statedValue).toBe(4);
  });

  it('does not read engineering tooling as business system ownership', () => {
    const hits = scanVacancyOperational(vac({ jobTitle: 'Staff Engineer', description: 'Run your own workflow on AI coding tooling and decide what the function adopts.' }));
    expect(hits.find((h) => h.fact === 'system_ownership')).toBeUndefined();
  });

  it('never infers intent, load or volume', () => {
    const hits = scanVacancyOperational(vac({
      jobTitle: 'Partner Manager',
      description: 'Manage deal registration and partner pipeline reporting across the region.',
    }));
    for (const h of hits) {
      expect(h.proves).not.toMatch(/intent|ready to buy|evaluating|looking for/i);
      expect(JSON.stringify(h)).not.toMatch(/operational_load|purchase|buying/i);
    }
  });
});

describe('vacancy handling', () => {
  it('collapses the same vacancy seen through two surfaces', () => {
    const r = canonicalise([
      vac({ id: 'a', jobTitle: 'Account Executive', location: 'Berlin', description: '' }),
      vac({ id: 'b', jobTitle: 'Account  Executive', location: 'Berlin', description: 'longer text here' }),
    ]);
    expect(r.kept).toHaveLength(1);
    expect(r.collapsed).toBe(1);
    // The representation carrying an actual description wins.
    expect(r.kept[0].description).toBe('longer text here');
  });

  it('keeps genuinely different roles apart', () => {
    const r = canonicalise([vac({ id: 'a', jobTitle: 'Account Executive' }), vac({ id: 'b', jobTitle: 'Partner Manager' })]);
    expect(r.kept).toHaveLength(2);
  });
});
