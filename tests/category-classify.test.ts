import { describe, expect, it } from 'vitest';
import { classifyCategory } from '../src/category/classify.js';
import type { PositioningEvidence } from '../src/evidence/positioning.js';

const ev = (items: [string, string][]): PositioningEvidence => ({
  items: items.map(([sourceType, text]) => ({ sourceType: sourceType as any, url: 'https://x.com/', text, retrievedAt: '2026-08-24T00:00:00Z' })),
  health: [{ url: 'https://x.com/', health: 'success' }],
  observed: true,
});

describe('classifyCategory', () => {
  it('flags a vendor whose self-description IS partner management', () => {
    const c = classifyCategory('x.com', ev([['meta_description', 'Impartner is a partner relationship management platform for growing channels.']]));
    expect(c.state).toBe('partner_tech_vendor');
    expect(c.signals[0].quote).toMatch(/partner relationship management/i);
  });

  it('does NOT flag an operator that merely runs a partner programme', () => {
    // The failure that broke Phase 3: this company's partner pages read exactly like a
    // vendor's, but its self-description is a phone system.
    const c = classifyCategory('x.com', ev([
      ['title_tag', 'Aircall — the cloud phone system for modern teams'],
      ['homepage_hero', 'Set up business phone numbers in minutes. Our partners resell Aircall and register deals.'],
    ]));
    expect(c.state).toBe('likely_target_category');
  });

  it('ignores partner vocabulary outside identity positions', () => {
    // Body copy is excluded by design — this is what makes the classifier insensitive to
    // publication volume. A company with 10,000 partner pages yields one self-description.
    const c = classifyCategory('x.com', {
      ...ev([['title_tag', 'Acme — invoicing software']]),
      items: [
        { sourceType: 'title_tag', url: 'https://x.com/', text: 'Acme — invoicing software', retrievedAt: '2026-08-24T00:00:00Z' },
        { sourceType: 'comparison_page', url: 'https://x.com/c', text: 'partner relationship management platform', retrievedAt: '2026-08-24T00:00:00Z' },
      ],
    });
    expect(c.state).toBe('likely_target_category');
  });

  it('returns unknown, never a category, when no identity surface was read', () => {
    const c = classifyCategory('x.com', { items: [], health: [{ url: 'https://x.com/', health: 'blocked' }], observed: false });
    expect(c.state).toBe('unknown');
    expect(c.underObserved).toBe(true);
    expect(c.whyItMayNotMatter).toMatch(/only about our retrieval/i);
  });

  it('reports a known-competitor list hit separately from the inference', () => {
    const list = { isKnownCompetitor: (d: string) => d === 'x.com' };
    const c = classifyCategory('x.com', ev([['title_tag', 'Acme — invoicing software']]), list);
    expect(c.state).toBe('direct_introw_competitor');
    // The list must never be dressed up as an inference.
    expect(c.whyItMatters).toMatch(/asserted business data|maintained/i);
    expect(c.whyItMayNotMatter).toMatch(/found no supporting evidence|disagree/i);
  });

  it('recognises a consumer marketplace, including in Dutch', () => {
    const c = classifyCategory('x.com', ev([['meta_description', 'Krijg binnen enkele minuten een rit, bestel eten en boodschappen.']]));
    expect(c.state).toBe('supply_side_marketplace');
  });

  it('carries attribution on every signal', () => {
    const c = classifyCategory('x.com', ev([['og_description', 'Software to manage your partner ecosystem at scale.']]));
    for (const s of c.signals) {
      expect(s.url).toBeTruthy();
      expect(s.sourceType).toBeTruthy();
      expect(s.matched).toBeTruthy();
    }
  });

  it('always states what it does not prove', () => {
    const c = classifyCategory('x.com', ev([['title_tag', 'Acme — invoicing software']]));
    expect(c.whyItMayNotMatter.length).toBeGreaterThan(20);
    expect(c.unknown.length).toBeGreaterThan(10);
  });
});
