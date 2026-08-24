import { describe, expect, it } from 'vitest';
import { dedupe } from '../src/dossier/dedup.js';
import { detectDirectory } from '../src/dossier/directory.js';
import { scanSurfaces } from '../src/dossier/surfaces.js';
import { buildCommercialSummary, FORBIDDEN_SUMMARY_PATTERNS } from '../src/dossier/summary.js';

describe('dedupe', () => {
  it('collapses the same claim repeated across pages', () => {
    // Ten pages with one footer sentence is one observation, not ten. Promotion tracked
    // observation count more strongly than anything commercial, so this is load-bearing.
    const items = Array.from({ length: 10 }, (_, i) => ({
      quote: 'Become a partner and grow your business with our reseller programme today',
      sourceUrl: `https://x.com/page${i}`,
    }));
    const r = dedupe(items);
    expect(r.observationCount).toBe(10);
    expect(r.distinctClaimCount).toBe(1);
    expect(r.canonical[0].duplicateCount).toBe(10);
  });

  it('keeps genuinely different claims apart', () => {
    const r = dedupe([
      { quote: 'Register a deal through the partner portal to protect your opportunity', sourceUrl: 'https://x.com/a' },
      { quote: 'Our certified installers handle deployment for enterprise customers', sourceUrl: 'https://x.com/b' },
    ]);
    expect(r.distinctClaimCount).toBe(2);
  });

  it('counts independent hosts, not pages', () => {
    const r = dedupe([
      { quote: 'Partners resell our platform to mid-market customers everywhere', sourceUrl: 'https://x.com/a' },
      { quote: 'Certified agencies deliver implementation across the region now', sourceUrl: 'https://x.com/b' },
    ]);
    expect(r.independentSourceCount).toBe(1);
  });
});

describe('detectDirectory', () => {
  const entry = (h: string) => `<div><a href="https://${h}/">Visit website</a></div>`;
  const html = `<h1>Our certified partners</h1>${['a.com','b.nl','c.co.uk','d.io','e.de','f.fr'].map(entry).join('')}`;
  const text = 'Our certified partners. Creative organizations that excel. Visit website Visit website Visit website Visit website Visit website Visit website';

  it('finds a directory and reports a lower bound', () => {
    // foleon.com published 82 certified agency partners and every prose detector was blind
    // to it, because a directory is the PARTNERS describing themselves.
    const d = detectDirectory([{ url: 'https://x.com/partners', html, text }], 'x.com');
    expect(d.isDirectory).toBe(true);
    expect(d.lowerBound).toBeGreaterThanOrEqual(6);
    expect(d.certificationLanguage).toBe(true);
  });

  it('never reports the lower bound as a count', () => {
    const d = detectDirectory([{ url: 'https://x.com/partners', html, text }], 'x.com');
    expect(d.method).not.toBe('none');
    // The wording contract lives in build.ts; here we assert the field name itself.
    expect(Object.keys(d)).toContain('lowerBound');
    expect(Object.keys(d)).not.toContain('partnerCount');
  });

  it('ignores a customer logo wall with no partner vocabulary', () => {
    const d = detectDirectory([{ url: 'https://x.com/customers', html: html.replace('Our certified partners', 'Trusted by'), text: 'Trusted by leading brands' }], 'x.com');
    expect(d.isDirectory).toBe(false);
  });

  it('excludes the company\'s own domain and social chrome', () => {
    const own = `<h1>Our partners</h1><a href="https://x.com/a">Visit website</a><a href="https://www.linkedin.com/x">li</a><a href="https://facebook.com/x">fb</a>`;
    const d = detectDirectory([{ url: 'https://x.com/partners', html: own, text: 'Our partners' }], 'x.com');
    expect(d.isDirectory).toBe(false);
  });
});

describe('scanSurfaces', () => {
  it('distinguishes not_observed from unknown', () => {
    // The difference is the entire point: one means we looked, the other means we could not.
    const looked = scanSurfaces([{ url: 'https://x.com/p', text: 'Become a partner today and join our network' }]);
    expect(looked.couldNotLook).toBe(false);
    expect(looked.notObserved).toContain('deal_registration');

    const blind = scanSurfaces([]);
    expect(blind.couldNotLook).toBe(true);
    expect(blind.notObserved).toEqual([]);
  });

  it('attaches a source to every hit', () => {
    const s = scanSurfaces([{ url: 'https://x.com/p', text: 'Register a deal through our partner portal' }]);
    for (const h of s.hits) { expect(h.sourceUrl).toBe('https://x.com/p'); expect(h.doesNotProve).toBeTruthy(); }
  });
});

describe('commercial summary', () => {
  const base = {
    companyName: 'Acme', selfDescription: 'Acme is an invoicing platform for small teams',
    programmes: [], surfaces: [], constructs: [],
    systems: { crm: { state: 'unknown' as const, evidence: [], note: '' }, prm: { state: 'unknown' as const, vendor: null, evidence: [], note: '' } },
    people: { state: 'unknown' as const, people: [], note: '' },
    coverage: 'sparse' as const, categoryState: 'likely_target_category',
  };

  it('emits no forbidden marketing language', () => {
    const s = buildCommercialSummary(base);
    for (const re of FORBIDDEN_SUMMARY_PATTERNS) expect(s).not.toMatch(re);
  });

  it('reports unknowns as unknown, never as absence', () => {
    const s = buildCommercialSummary(base);
    expect(s).toMatch(/does not establish/i);
    expect(s).not.toMatch(/\bno CRM\b|has no partner team|does not use/i);
  });

  it('states sparse coverage as a publishing fact, not a judgement', () => {
    expect(buildCommercialSummary(base)).toMatch(/not a judgement about it/i);
  });

  it('phrases a directory as a lower bound', () => {
    const s = buildCommercialSummary({ ...base, partnerDirectoryLowerBound: 82, directoryCertified: true });
    expect(s).toMatch(/at least 82/);
    expect(s).not.toMatch(/\b82 partners\b/);
  });
});
