/**
 * Regression guards for the classifier.
 *
 * Every case here is a failure that actually occurred during Phase 1 measurement.
 * A classifier that has only been checked in one direction has not been tested, so
 * each rule is asserted both ways.
 */
import { describe, expect, it } from 'vitest';
import { classify } from '../src/evidence/classify.js';
import { rankPartnerUrls } from '../src/evidence/collect.js';
import { firmTypeIndicators } from '../src/evidence/taxonomy.js';

const now = '2026-08-21T00:00:00Z';
const page = (url: string, text: string) => ({ url, text, retrievedAt: now, httpStatus: 200 });
const base = { companyId: 'test', urlInventory: [] as string[], identityText: '' };

describe('firm-type suppression', () => {
  it('does not fire on ordinary marketing or careers copy', () => {
    // A security vendor was suppressed as a law firm, and two SaaS companies as
    // investment firms, because single phrases matched body text.
    for (const text of [
      'SafeBreach is the leader in breach and attack simulation. We invest in continuous validation. LLP',
      'PostHog is the single platform to analyze, test and deploy. We invest in open source.',
      'Managed WordPress hosting. Find work with our agency partners. Post a job on our board.',
    ]) {
      expect(firmTypeIndicators(text).find((f) => f.hits.length >= 2)).toBeUndefined();
    }
  });

  it('fires on genuine professional-services and investment self-description', () => {
    expect(firmTypeIndicators('Freshfields is an international law practice. Our lawyers advise across practice areas. Partners and counsel.')
      .find((f) => f.hits.length >= 2)?.id).toBe('law_firm');
    expect(firmTypeIndicators('We are an early-stage investor. Our portfolio companies include many. Limited partners.')
      .find((f) => f.hits.length >= 2)?.id).toBe('investment_firm');
  });

  it('never suppresses over a decisive transacting artifact', () => {
    const r = classify({
      ...base,
      identityText: 'International law practice. Our lawyers advise across practice areas. Partners and counsel.',
      // Page text must clear the collector's minimum length; short strings are skipped.
      pages: [page('https://x.com/partners', 'Partner programme. Register a deal through our partner portal and we will attribute it to you within five working days.')],
    });
    expect(r.suppression).toBeNull();
    expect(r.commerciality).toBe('transacting');
  });
});

describe('integration evidence is counter-evidence, not a veto', () => {
  it('does not call a real reseller programme integration_only', () => {
    const r = classify({
      ...base,
      pages: [
        page('https://x.com/partner-program', 'Become a partner. Our distributors and distribution partners resell the platform.'),
        page('https://x.com/integrations', 'Browse integrations. 100+ integrations. Technology partner. App marketplace. API partner.'),
      ],
    });
    expect(['transacting', 'mixed']).toContain(r.commerciality);
  });

  it('still suppresses a genuine integration-only ecosystem', () => {
    const r = classify({
      ...base,
      pages: [page('https://y.com/integrations', 'Browse integrations. Technology partner. App marketplace. Build an integration. Developer program. API partner.')],
    });
    expect(r.commerciality).toBe('integration_only');
  });
});

describe('corroboration', () => {
  it('refuses to classify on one uncorroborated signal, and routes it to research', () => {
    const r = classify({ ...base, pages: [page('https://z.com/partners', 'Work with us. Become a reseller of our platform and sell it to your own customers across the region.')] });
    expect(r.commerciality).toBe('unknown');
    expect(r.rule).toBe('single_strong_uncorroborated');
  });

  it('accepts two independent strong signals', () => {
    const r = classify({
      ...base,
      pages: [page('https://z.com/partners', 'Become a reseller of our platform. Gold partner and silver partner tiers are available to accredited firms.')],
    });
    expect(r.commerciality).toBe('transacting');
  });
});

describe('participant pages', () => {
  it('does not treat another vendor\'s reseller programme as this company\'s channel', () => {
    const r = classify({
      ...base,
      pages: [page('https://z.com/global/en/alliances/sap/value-added-reseller-program.html',
        'Our SAP global value-added reseller program. Authorized reseller. Dealer network.')],
    });
    expect(['transacting', 'mixed']).not.toContain(r.commerciality);
  });
});

describe('URL ranking', () => {
  it('excludes asset paths and diversifies away from one section', () => {
    const picked = rankPartnerUrls([
      'https://l.com/nlnl/installateur/', 'https://l.com/nlnl/installateur/a', 'https://l.com/nlnl/installateur/b',
      'https://l.com/nlnl/installateur/c', 'https://l.com/nlnl/partner-worden',
      'https://se.com/ae/en/download/document/RESELLER_AGREEMENT/',
    ]);
    expect(picked.some((u) => u.includes('/download/'))).toBe(false);
    expect(picked.filter((u) => u.includes('/installateur/')).length).toBeLessThanOrEqual(2);
    expect(picked[0]).toContain('partner-worden');
  });

  it('ranks a dedicated partner host, whose signal is in the hostname not the path', () => {
    const picked = rankPartnerUrls(['https://www.example.com/', 'https://partnerlisting.corp.example.com/']);
    expect(picked).toContain('https://partnerlisting.corp.example.com/');
  });

  it('treats a channel-shaped word inside a product path as a product', () => {
    // Industrial catalogues sell "pneumatic distributors"; that is not distribution.
    const picked = rankPartnerUrls(['https://x.com/prodotti/automotive/distributori-pneumatici/']);
    expect(picked).toHaveLength(0);
  });
});

describe('affiliate motion', () => {
  it('is distinguished from a transacting channel', () => {
    const r = classify({
      ...base,
      pages: [page('https://a.com/affiliate', 'Join our affiliate program. Affiliate link, cookie duration 60 days, payout per sale.')],
    });
    expect(r.commerciality).toBe('affiliate_only');
  });
});
