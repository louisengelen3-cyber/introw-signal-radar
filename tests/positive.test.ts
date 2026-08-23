/**
 * Regression guards for the Phase 3 positive constructs.
 * Each case encodes a measured Phase 3 finding, and the plain-English cases are taken
 * from the customers the Phase 2 lexicon actually missed.
 */
import { describe, expect, it } from 'vitest';
import { assessPositive, promote } from '../src/suitability/positive.js';
import { detectChange, normalizeForComparison, type Snapshot } from '../src/temporal/snapshot.js';

const page = (url: string, text: string) => ({ url, text });
const base = { direction: 'channel_operator' as const, distributorCount: 0, reachable: true };

describe('positive constructs read ordinary business English', () => {
  it('recognises materiality without channel jargon (the Ringover shape)', () => {
    const p = assessPositive({ ...base, pages: [page('https://x/p',
      "Our Marketplace Partner Program helps technology consultants collaborate with us via co-marketing and co-selling, to grow their own consulting business' recurring revenue streams. Become a partner today.")] });
    expect(['confirmed', 'strong_proxy']).toContain(p.materiality);
    expect(p.ownership).toBe('direct');
  });

  it('recognises a lead-submission form as ownership (the Payflip shape)', () => {
    const p = assessPositive({ ...base, pages: [page('https://x/p',
      'Payflip believes in the power of partnerships. Payroll partners, HR partners, accountancy partners. Do you have a new lead for Payflip? Fill in the form below and we will get in touch with them.')] });
    expect(p.ownership).toBe('direct');
    expect(p.observations.some((o) => o.probe === 'names_partner_types')).toBe(true);
  });

  it('recognises "win new deals" as materiality (the Xelix shape)', () => {
    const p = assessPositive({ ...base, pages: [page('https://x/p',
      'We help outsourcing firms win new deals and retain existing clients by introducing our solution into their delivery projects. Become a partner.')] });
    expect(p.materiality).not.toBe('unknown');
  });
});

describe('promotion requires positive evidence', () => {
  it('never promotes on absence of negatives', () => {
    // Nothing observed at all: not a fit claim in either direction.
    const p = assessPositive({ ...base, pages: [page('https://x/', 'We build software for finance teams.')] });
    const r = promote(p, []);
    expect(r.state).not.toBe('high_fit');
    expect(r.support.length).toBe(0);
  });

  it('promotes only when all three constructs are supported', () => {
    const p = assessPositive({ ...base, pages: [page('https://x/p',
      'Become a partner and join our partner program. Our reseller partners and referral partners grow their own recurring revenue by reselling our platform. Deal registration and the partner portal are available, with gold partner and silver partner tiers, commission on every deal, and partner enablement resources.')] });
    const r = promote(p, []);
    expect(r.state).toBe('high_fit');
    expect(r.support.length).toBeGreaterThan(0);
  });

  it('routes a sparse account to under-observed rather than demoting it', () => {
    const p = assessPositive({ ...base, pages: [page('https://x/p', 'Partners. We work with a number of partners across Europe to serve customers.')] });
    const r = promote(p, []);
    expect(r.state).toBe('under_observed');
  });

  it('refuses a participant regardless of positive language', () => {
    const p = assessPositive({ ...base, direction: 'channel_participant',
      pages: [page('https://x/p', 'We are a certified Microsoft partner. Become a partner of ours too. Reseller partners grow their revenue.')] });
    expect(p.ownership).toBe('participant_only');
    expect(promote(p, []).state).toBe('not_promoted');
  });

  it('never promotes over a contradiction', () => {
    const p = assessPositive({ ...base, pages: [page('https://x/p',
      'Become a partner. Reseller partners grow their own recurring revenue. Deal registration, partner portal, gold partner tiers, commission, partner enablement.')] });
    expect(promote(p, ['channel classified affiliate_only']).state).toBe('not_promoted');
  });
});

describe('evidence density is tracked separately from fit', () => {
  it('does not treat publication volume as fit', () => {
    const rich = assessPositive({ ...base, pages: [page('https://x/p',
      'Integration partners and technology partners. Certification and partner training available. Partner portal. Our partners include many organisations. ' + 'x'.repeat(5000))] });
    // Plenty of publication, but no materiality: must not reach high_fit.
    expect(promote(rich, []).state).not.toBe('high_fit');
  });
});

describe('temporal snapshots never invent history', () => {
  const snap = (hash: string, evidence: string): Snapshot => ({
    id: 'i', companyId: 'c', sourceUrl: 'u', observationType: 'partner_surface_content',
    observedAt: '2026-08-23T00:00:00Z', retrievedAt: '2026-08-23T00:00:00Z',
    contentHash: hash, normalizedEvidence: evidence, evidenceState: 'confirmed', sourceHealth: 'ok',
  });

  it('treats a first observation as a first observation, never a change', () => {
    expect(detectChange(undefined, snap('a', 'become a partner')).kind).toBe('first_observation');
  });

  it('separates a raw edit from a structural change', () => {
    const before = snap('a', 'become a partner. our resellers.');
    const afterCopyEdit = snap('b', 'become a partner today. our resellers.');
    expect(detectChange(before, afterCopyEdit).kind).toBe('raw_change');
    const afterStructural = snap('c', 'become a partner. our resellers. deal registration is now open.');
    expect(detectChange(before, afterStructural).kind).toBe('semantic_change');
  });

  it('reports an unretrievable surface as unobservable, not as change', () => {
    const blocked = { ...snap('x', ''), sourceHealth: 'blocked' as const };
    expect(detectChange(snap('a', 'partners'), blocked).kind).toBe('unobservable');
  });

  it('strips volatile noise so a timestamp is not a programme change', () => {
    const a = normalizeForComparison('Partner program updated 2026-08-23T10:00:00Z build a1b2c3d4e5f6a7b8');
    const b = normalizeForComparison('Partner program updated 2026-08-24T11:00:00Z build 99887766aabbccdd');
    expect(a).toBe(b);
  });
});
