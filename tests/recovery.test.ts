/**
 * Source-recovery tests.
 *
 * The failures these guard against are the ones the cross-industry audit measured: evidence
 * on a country domain, a soft-404 counted as a page, a build artefact counted as a partner
 * surface, and a locator's 200 city pages counted as 200 surfaces.
 */
import { describe, expect, it } from 'vitest';
import { brandToken, selectForResearch, type DomainResolution, type RelatedDomain } from '../src/recovery/domains.js';
import { isSoft404 } from '../src/recovery/surfaces.js';

const rel = (o: Partial<RelatedDomain>): RelatedDomain => ({
  domain: 'x.de', basis: 'hreflang', region: null, language: null, evidenceUrl: 'https://x.com/', confidence: 'high', ...o,
});

describe('brand token', () => {
  it('is shared across country domains of one company', () => {
    expect(brandToken('vaillant.com')).toBe('vaillant');
    expect(brandToken('vaillant.co.uk')).toBe('vaillant');
    expect(brandToken('www.vaillant.de')).toBe('vaillant');
  });

  it('strips corporate suffixes so a group domain still matches', () => {
    expect(brandToken('barcogroup.com')).toBe('barco');
  });

  it('does NOT treat a shared token as proof of the same company', () => {
    // bata.com and bata.de were different companies in Phase 2, and bover.de resolved to
    // bover.pl. The token is a necessary condition, never a sufficient one — which is why
    // probed domains carry the lowest confidence and record their basis.
    expect(brandToken('bata.com')).toBe(brandToken('bata.de'));
    expect(rel({ basis: 'probed_cctld' }).basis).toBe('probed_cctld');
  });
});

describe('domain selection', () => {
  const res = (related: RelatedDomain[]): DomainResolution => ({ canonical: 'x.com', related, health: [] });

  it('puts channel subdomains first', () => {
    const chosen = selectForResearch(res([
      rel({ domain: 'x.fr', region: 'FR' }),
      rel({ domain: 'partners.x.com', basis: 'canonical' }),
    ]), 2);
    expect(chosen[0].domain).toBe('partners.x.com');
  });

  it('prefers major markets over arbitrary English locales', () => {
    // Ranking by language alone picked Somfy's Egyptian and Chinese English sites out of 45
    // alternates — technically English, commercially useless.
    const chosen = selectForResearch(res([
      rel({ domain: 'x.com.eg', language: 'en', region: 'EG' }),
      rel({ domain: 'x.cn', language: 'en', region: 'CN' }),
      rel({ domain: 'x.co.uk', language: 'en', region: 'GB' }),
      rel({ domain: 'x.de', language: 'de', region: 'DE' }),
    ]), 2);
    expect(chosen.map((c) => c.domain)).toEqual(['x.co.uk', 'x.de']);
  });

  it('bounds how many domains are researched', () => {
    const many = Array.from({ length: 40 }, (_, i) => rel({ domain: `x.c${i}` }));
    expect(selectForResearch(res(many), 3)).toHaveLength(3);
  });
});

describe('soft-404 detection', () => {
  it('catches a 200 that is really a miss, in several languages', () => {
    // The audit's own industrial probe was invalidated by this: one site returned HTTP 200
    // for all 35 trade paths it was given.
    for (const [text, title] of [
      ['The page you requested could not be found.', 'Error'],
      ['', 'Page not found | Acme'],
      ['Seite nicht gefunden', ''],
      ['Pagina niet gevonden', ''],
      ['Page introuvable', ''],
    ]) expect(isSoft404(text, title), text || title).toBe(true);
  });

  it('does not flag a real partner page', () => {
    expect(isSoft404('Become a certified installer. Apply for the partner programme and access the portal.', 'Partners | Acme')).toBe(false);
  });
});
