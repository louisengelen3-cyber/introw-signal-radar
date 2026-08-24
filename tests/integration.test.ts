/**
 * Failure-first QA for the discovery/recovery integration (mandate §54, §57).
 *
 * Each test targets a specific way this system is known to be wrong. Several assert that a
 * signal is deliberately NOT produced: the integration's main risk is manufacturing
 * confidence, so most of these fail loudly if the system starts claiming more than it saw.
 */
import { describe, it, expect } from 'vitest';
import { QUERY_FAMILIES, activeFamilies, familyConfidence } from '../src/discovery/families.js';
import {
  assessCheapEvidence, resolveEntity, mayAutoResearch, entityKey, upsertCandidate,
  type Candidate,
} from '../src/discovery/candidate.js';
import { sufficiency, shouldAttemptRecovery, originOf, ORIGIN_PRECEDENCE } from '../src/recovery/union.js';
import { resolveFlags, DEFAULT_FLAGS } from '../src/config/flags.js';

const fam = (name: string) => QUERY_FAMILIES.find((f) => f.name === name)!;

describe('§37 competitor contamination', () => {
  it('drops a PRM vendor even though its page is full of genuine partner vocabulary', () => {
    // A PRM vendor really does run a partner programme. What disqualifies it is category,
    // not evidence — so the gate must reject it on category before scoring its signals.
    const r = assessCheapEvidence({
      text: 'Become a partner. Our partner portal offers deal registration and gold partner tiers. '
        + 'The leading partner relationship management software for channel teams.',
      url: 'https://example-prm.com/partners',
    });
    expect(r.verdict).toBe('drop');
    expect(r.dropReason).toBe('known_competitor');
  });

  it('keeps the query family that generated competitors visible rather than hidden', () => {
    // §37: high competitor rate is diagnostic information about query intent. Deleting the
    // family would destroy the evidence that channel-generic English is contaminated.
    const f = fam('ENGLISH_GENERIC_PARTNER_PROGRAM');
    expect(f.status).toBe('disabled');
    expect(f.lastResult!.competitors).toBeGreaterThan(0);
  });

  it('never runs a disabled family in production', () => {
    const names = activeFamilies().map((f) => f.name);
    expect(names).not.toContain('ENGLISH_GENERIC_PARTNER_PROGRAM');
    expect(names).not.toContain('GERMAN_GENERIC_VERTRIEBSPARTNER');
  });
});

describe('§54 consultants and commentary', () => {
  it('drops a consultancy that writes about channels without operating one', () => {
    const r = assessCheapEvidence({
      text: 'Unsere Beratung hilft Herstellern beim Aufbau von Vertriebspartner-Netzwerken. '
        + 'Wir bieten Schulungen für Ihren Vertrieb.',
      url: 'https://example-beratung.de/vertriebspartner',
    });
    expect(r.verdict).toBe('drop');
    expect(r.dropReason).toBe('consultant_or_agency');
  });

  it('drops an article about partner programmes', () => {
    const r = assessCheapEvidence({
      text: 'In this article we explain how to become an authorized dealer. What is a dealer program? '
        + 'Here is a step by step guide.',
      url: 'https://example-blog.com/how-to',
    });
    expect(r.verdict).toBe('drop');
    expect(r.dropReason).toBe('not_a_company');
  });

  it('does not drop a manufacturer that merely offers partner training', () => {
    // Manufacturers legitimately run training. The consultancy guard must not eat them.
    const r = assessCheapEvidence({
      text: 'Werden Sie Fachpartner. Unser Partnerprogramm bietet Schulungen, einen Partnerportal-Zugang '
        + 'und zertifizierte Installateur-Stufen. Jetzt Partner werden und bewerben.',
      url: 'https://example-hersteller.de/fachpartner-werden',
    });
    expect(r.verdict).toBe('operator_evidence');
  });
});

describe('§13 drop reasons are automation decisions, never commercial negatives', () => {
  it('distinguishes "we did not research this" from "no partner motion"', () => {
    const dropped = assessCheapEvidence({ text: 'Glossary: what is a dealer program? Definition.', url: 'https://x.test/g' });
    const unknown = assessCheapEvidence({ text: 'We build industrial sensors for factory automation.', url: 'https://y.test/' });
    expect(dropped.verdict).toBe('drop');
    // No operator signal is NOT a drop and NOT a negative — it defers to research.
    expect(unknown.verdict).toBe('research_required');
    expect(unknown.dropReason).toBeNull();
    expect(unknown.rationale).toMatch(/not evidence of absence/i);
  });
});

describe('§9 entity resolution prevents crawling the wrong company', () => {
  it('quarantines a third-party mention with no brand corroboration', () => {
    const e = resolveEntity({ probableDomain: 'example.com', sourceURL: 'https://directory.test/list', firstParty: false });
    expect(e.confidence).toBe('ambiguous');
    expect(mayAutoResearch(e.confidence)).toBe(false);
  });

  it('allows auto-research only on resolved identities', () => {
    expect(mayAutoResearch(resolveEntity({ probableDomain: 'example.com', sourceURL: 'https://example.com/partners', firstParty: true }).confidence)).toBe(true);
    expect(mayAutoResearch('unresolved')).toBe(false);
    expect(mayAutoResearch('ambiguous')).toBe(false);
  });

  it('refuses a URL that yields no registrable domain', () => {
    expect(resolveEntity({ probableDomain: 'not a domain', sourceURL: 'x', firstParty: true }).confidence).toBe('unresolved');
  });
});

describe('§10 a company found many ways is one candidate', () => {
  it('collapses multilingual duplicates onto one entity, preserving every path', () => {
    const index = new Map<string, Candidate>();
    const hit = (family: string, url: string) => upsertCandidate(index, {
      company: 'Example', domain: url.includes('www.') ? 'www.example.com' : 'example.com',
      family: fam(family), sourceURL: url, discoveredAt: '2026-08-24T00:00:00Z',
    });
    const a = hit('GERMAN_OPERATOR_FACHPARTNER', 'https://example.com/fachpartner');
    const b = hit('FRENCH_REVENDEUR_PROGRAM', 'https://www.example.com/revendeur');
    expect(a.isNew).toBe(true);
    expect(b.isNew).toBe(false);            // not a second prospect
    expect(index.size).toBe(1);
    expect(index.get('example.com')!.paths).toHaveLength(2);  // both paths kept
  });

  it('treats www and bare host as the same entity', () => {
    expect(entityKey('https://www.Example.com/partners')).toBe(entityKey('example.com'));
  });
});

describe('§14 recovery is additive and cannot replace base research', () => {
  it('does not run when base evidence is already sufficient', () => {
    const rich = { programmes: ['reseller'], confirmedSurfaces: ['portal', 'deal_registration'], directoryType: null, pagesRead: 12 };
    expect(sufficiency(rich)).toBe('sufficient_for_review');
    expect(shouldAttemptRecovery(rich)).toBe(false);
  });

  it('runs where base research left something to find', () => {
    const thin = { programmes: [], confirmedSurfaces: [], directoryType: null, pagesRead: 0 };
    expect(sufficiency(thin)).toBe('under_observed');
    expect(shouldAttemptRecovery(thin)).toBe(true);
  });

  it('keeps blocked distinct from under-observed', () => {
    // "We could not look" must never read as "there is nothing there".
    expect(sufficiency({ programmes: [], confirmedSurfaces: [], directoryType: null, pagesRead: 0 }, true)).toBe('blocked');
  });

  it('sufficiency describes evidence completeness, not commercial fit', () => {
    // A sparse dossier and a rich one may both be good prospects; the state must not imply otherwise.
    const states = ['sufficient_for_review', 'partial', 'under_observed', 'blocked'];
    for (const s of states) expect(s).not.toMatch(/good|bad|high|low|priority|fit|score/i);
  });
});

describe('§15 source precedence', () => {
  it('ranks a company programme subdomain above a third-party source', () => {
    expect(ORIGIN_PRECEDENCE.programme_subdomain).toBeLessThan(ORIGIN_PRECEDENCE.counterparty_source);
    expect(ORIGIN_PRECEDENCE.canonical_domain).toBeLessThan(ORIGIN_PRECEDENCE.directory_aggregator);
  });

  it('classifies a channel subdomain as programme infrastructure across registrable domains', () => {
    // partner.example.com is programme infrastructure whether the canonical is .com or .de.
    expect(originOf('https://partner.example.com/en/', 'example.de')).toBe('programme_subdomain');
    expect(originOf('https://partners.example.com/', 'example.com')).toBe('programme_subdomain');
  });

  it('does not confuse a same-brand regional domain with the canonical one', () => {
    expect(originOf('https://example.de/fachpartner', 'example.com')).toBe('regional_domain');
    expect(originOf('https://example.com/partners', 'example.com')).toBe('canonical_domain');
  });

  it('treats an unrelated host as a counterparty source, never as first-party', () => {
    expect(originOf('https://some-distributor.test/brands/example', 'example.com')).toBe('counterparty_source');
  });
});

describe('§27 flags default conservative so rollback never needs a revert', () => {
  it('ships with discovery and recovery off', () => {
    expect(DEFAULT_FLAGS.DISCOVERY_ENABLED).toBe(false);
    expect(DEFAULT_FLAGS.DISCOVERY_VISIBLE).toBe(false);
    expect(DEFAULT_FLAGS.RECOVERY_ENABLED).toBe(false);
  });

  it('separates generating candidates from showing them, so shadow mode is expressible', () => {
    const f = resolveFlags({ DISCOVERY_ENABLED: 'true' });
    expect(f.DISCOVERY_ENABLED).toBe(true);
    expect(f.DISCOVERY_VISIBLE).toBe(false);   // shadow mode
  });

  it('can disable a single family without disabling discovery', () => {
    const f = resolveFlags({ DISCOVERY_ENABLED: 'true', DISABLED_QUERY_FAMILIES: 'ENGLISH_MSP_PROGRAM' });
    expect(activeFamilies(f.DISABLED_QUERY_FAMILIES).map((x) => x.name)).not.toContain('ENGLISH_MSP_PROGRAM');
  });
});

describe('§3 discovery may never express qualification', () => {
  it('candidate confidence reflects how a company was found, not whether it is a fit', () => {
    expect(familyConfidence(fam('GERMAN_OPERATOR_FACHPARTNER'))).toBe('high');
    expect(familyConfidence(fam('ENGLISH_AUTHORIZED_RESELLER_HARDWARE'))).toBe('low');
  });

  it('no candidate state encodes priority or rank', () => {
    const index = new Map<string, Candidate>();
    const { candidate } = upsertCandidate(index, {
      company: 'Example', domain: 'example.com', family: fam('GERMAN_OPERATOR_FACHPARTNER'),
      sourceURL: 'https://example.com/fachpartner', discoveredAt: '2026-08-24T00:00:00Z',
    });
    // Scan the structural fields; candidateReason is prose that deliberately says "not ... a fit".
    const { candidateReason, ...structural } = candidate;
    expect(JSON.stringify(structural)).not.toMatch(/\b(score|rank|priority|fit|gtm|hot|tier[123])\b/i);
    expect(candidate.candidateReason).toMatch(/not whether it is a fit/i);
  });

  it('every family name is generic, never a benchmark company', () => {
    const companies = ['vaillant', 'quatt', 'somfy', 'fronius', 'sophos', 'acronis', 'niko', 'sma', 'gira', 'stiebel'];
    for (const f of QUERY_FAMILIES) {
      for (const c of companies) expect(f.name.toLowerCase()).not.toContain(c);
    }
  });
});

describe('§48 no fake coverage claim', () => {
  it('records that Dutch discovery is currently unsupported rather than hiding it', () => {
    const dutch = QUERY_FAMILIES.filter((f) => f.language === 'nl');
    expect(dutch.length).toBeGreaterThan(0);
    expect(dutch.every((f) => f.status === 'disabled')).toBe(true);
    expect(dutch.some((f) => /unsupported/i.test(f.note))).toBe(true);
  });
});
