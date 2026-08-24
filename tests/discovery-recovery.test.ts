/**
 * Tests for the discovery and source-recovery capabilities (mandate §59).
 *
 * These are written to FAIL when the system starts claiming more than it observed. Several
 * assert that a signal is deliberately NOT produced — absence of evidence must stay absence,
 * and participation in someone else's network must never read as operating one.
 */
import { describe, it, expect } from 'vitest';
import { brandToken, selectForResearch } from '../src/recovery/domains.js';
import { isSoft404 } from '../src/recovery/surfaces.js';
import { scanTrade, directoryTypeFor } from '../src/recovery/trade.js';

/** scanTrade reads page objects; these tests care only about the text. */
const scan = (text: string) => scanTrade([{ url: 'https://example.test/partner', text }]);
import { decodeEntities } from '../src/lib/http.js';

describe('identity — a shared token is not a shared company', () => {
  it('strips corporate suffixes and country domains to a brand token', () => {
    expect(brandToken('vaillant.de')).toBe('vaillant');
    expect(brandToken('www.sma.com.tr')).toBe('sma');
  });

  it('does not treat unrelated companies sharing a brand token as the same company', () => {
    // bata.com and bata.de are different businesses. Recovery must not merge them on the token.
    const picked = selectForResearch({
      canonical: 'bata.com',
      related: [{
        domain: 'bata.de', basis: 'probed_cctld', region: null, language: null,
        evidenceUrl: 'https://bata.de/', confidence: 'low',
      }],
      health: [],
    }, 3);
    // A probed ccTLD is a guess from a shared token. It may be researched, but it must never
    // be asserted as the same company with high confidence.
    for (const p of picked.filter((d) => d.basis === 'probed_cctld')) {
      expect(p.confidence).toBe('low');
    }
  });
});

describe('source errors — a 200 is not a page', () => {
  it('detects soft-404s across languages', () => {
    for (const body of [
      'Page not found. The page you requested does not exist.',
      'Seite nicht gefunden',
      'Pagina niet gevonden',
      'Page introuvable',
      'Página no encontrada',
    ]) expect(isSoft404(body, '')).toBe(true);
  });

  it('does not flag a real partner page as a soft-404', () => {
    const real = 'Werden Sie Fachpartner. Unser Partnerprogramm bietet Schulungen, Marketing und Leads für zertifizierte Installateure in Ihrer Region.';
    expect(isSoft404(real, 'Fachpartner werden')).toBe(false);
  });
});

describe('vocabulary — trade terms are not SaaS terms', () => {
  it('reads a German installer network without any SaaS vocabulary present', () => {
    const r = scan('Finden Sie zertifizierte Fachpartner und Heizungsbauer in Ihrer Nähe. Unsere Installateure sind geschult.');
    expect(r.motions.map((m) => m.kind)).toContain('installer');
  });

  it('matches compounds, not just standalone words', () => {
    // German compounds the noun; a \b-anchored English matcher would miss every one of these.
    for (const w of ['Fachpartnersuche', 'Vertriebspartnerprogramm', 'Händlersuche']) {
      const r = scan(`Unsere ${w} hilft Ihnen weiter.`);
      expect(r.motions.length + r.surfaces.length).toBeGreaterThan(0);
    }
  });

  it('reads Dutch referral-with-commission that uses no partner vocabulary at all', () => {
    // Quatt publishes its motion in plain commercial Dutch. Requiring the word "partner"
    // would lose the clearest lead-sharing evidence in the entire physical cohort.
    const r = scan('Introduceer klanten, verdien €400 per installatie. Meld je direct aan.');
    const kinds = r.surfaces.map((s) => s.kind);
    expect(kinds).toContain('lead_routing');
    expect(kinds).toContain('partner_recruitment');
  });

  it('does not fire on commentary about partner programmes', () => {
    // Trade press writes these words constantly. Discovery precision depends on not
    // mistaking an article about channels for a company operating one.
    const article = 'In diesem Artikel erklären wir, warum der indirekte Vertrieb für Hersteller wichtig ist.';
    expect(scan(article).motions).toHaveLength(0);
  });

  it('reports one signal per motion regardless of how many languages share the word', () => {
    // "Installateur" is identical in German, Dutch and French. Three matches is one fact.
    const r = scan('Installateur worden? Onze installateurs zijn gecertificeerd.');
    expect(r.motions.filter((m) => m.kind === 'installer')).toHaveLength(1);
  });
});

describe('directory semantics — a locator is not a programme', () => {
  it('types a consumer-facing locator as a locator, not a recruitment programme', () => {
    expect(directoryTypeFor(['installer'], 'Finden Sie Installateure')).toBe('installer_locator');
    expect(directoryTypeFor(['dealer'], 'Händlersuche')).toBe('dealer_locator');
  });

  it('keeps distributor directories distinct from partner programmes', () => {
    expect(directoryTypeFor(['distributor'], 'authorised distributors')).toBe('distributor_directory');
  });
});

describe('source fidelity — accented markup must not survive into evidence', () => {
  it('decodes named accented entities so German and French quotes are readable', () => {
    expect(decodeEntities('H&auml;ndlersuche f&uuml;r gr&ouml;&szlig;ere R&eacute;seaux'))
      .toBe('Händlersuche für größere Réseaux');
  });
});

describe('discovery — queries must not encode the answer', () => {
  it('contains no company name in any published search pattern', async () => {
    const { SEARCH_PATTERNS } = await import('../src/discovery/adapters.js');
    // If a query named a company, "discovery" would be a restatement of a list already held.
    const named = ['vaillant', 'quatt', 'somfy', 'fronius', 'sophos', 'acronis', 'niko', 'sma'];
    for (const p of SEARCH_PATTERNS) {
      for (const n of named) expect(p.query.toLowerCase()).not.toContain(n);
    }
  });
});
