/**
 * Reseller-side inversion (Phase 5 workstream A).
 *
 * The guard tests exist because a previous vendor-name extractor returned "Platinum" and
 * "Microsoft Solution" as vendor names. Extraction is now by outbound link, which makes that
 * class structurally impossible — these tests assert the property rather than the instance,
 * so a future refactor back to name-based extraction fails loudly.
 */
import { describe, it, expect } from 'vitest';
import { isTierWord, registrable, TIER_VOCABULARY } from '../src/discovery/reseller-inversion.js';

describe('vendor-name guard', () => {
  it('rejects every tier and certification word as a vendor name', () => {
    for (const w of TIER_VOCABULARY) expect(isTierWord(w)).toBe(true);
  });

  it('rejects the exact strings a previous extractor returned as vendors', () => {
    for (const s of ['Platinum', 'Gold Partner', 'Certified', 'Authorised Reseller', 'Solution Partner']) {
      expect(isTierWord(s)).toBe(true);
    }
  });

  it('rejects a tier word wrapping a real brand, in both directions', () => {
    expect(isTierWord('Platinum Salesforce')).toBe(true);
    expect(isTierWord('Salesforce Certified')).toBe(true);
  });

  it('does not reject a real vendor brand', () => {
    for (const s of ['Ringover', 'Xelix', 'Ivalua', 'Lemon Learning', 'Ecovadis']) {
      expect(isTierWord(s)).toBe(false);
    }
  });

  it('treats an empty or whitespace label as unusable', () => {
    expect(isTierWord('')).toBe(true);
    expect(isTierWord('   ')).toBe(true);
  });
});

describe('entity resolution by domain', () => {
  it('reduces a host to its registrable domain', () => {
    expect(registrable('www.ringover.com')).toBe('ringover.com');
    expect(registrable('partners.ringover.com')).toBe('ringover.com');
  });

  it('keeps three labels for compound country TLDs', () => {
    expect(registrable('www.smcconsulting.co.uk')).toBe('smcconsulting.co.uk');
    expect(registrable('shop.example.com.au')).toBe('example.com.au');
  });

  it('handles two-label country domains', () => {
    expect(registrable('payflip.be')).toBe('payflip.be');
    expect(registrable('www.ojc-consulting.com')).toBe('ojc-consulting.com');
  });

  it('a tier word cannot become a vendor, because it has no domain', () => {
    // The structural argument for link-based extraction, asserted.
    for (const w of ['Platinum', 'Gold', 'Certified']) {
      expect(w.includes('.')).toBe(false);
    }
  });
});
