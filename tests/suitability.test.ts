/**
 * Regression guards for the Phase 2 layers.
 * Every case is a rule the Phase 2 mandate requires, or a failure measured during it.
 */
import { describe, expect, it } from 'vitest';
import { assessSuitability } from '../src/suitability/assess.js';
import { resolveOperator } from '../src/pipeline/operator.js';
import { assessPrm } from '../src/evidence/prm.js';
import { identityTokens, labelCandidates, normalise } from '../src/discovery/resolve.js';
import type { ClassifyResult } from '../src/evidence/classify.js';

const now = '2026-08-22T00:00:00Z';
const page = (url: string, text: string) => ({ url, text, retrievedAt: now, httpStatus: 200 });
const transacting = { commerciality: 'transacting', confidence: 'high', rule: 'x', rationale: '', motions: [], evidence: [], suppression: null, counts: { strongTransacting: 2, weakTransacting: 0, integration: 0, affiliate: 0, strategic: 0 } } as unknown as ClassifyResult;

const baseInput = {
  domain: 'x.example', urlInventory: [] as string[], classification: transacting,
  operator: null, scale: null, platform: null, reachable: true,
};

describe('suitability preconditions', () => {
  it('is never asked of a company whose channel is not established', () => {
    const r = assessSuitability({ ...baseInput, pages: [], classification: { ...transacting, commerciality: 'integration_only' } as ClassifyResult });
    expect(r.state).toBe('unknown');
    expect(r.rule).toBe('channel_not_established');
  });

  it('reports a blocked retrieval as blocked, not as a weak fit', () => {
    const r = assessSuitability({ ...baseInput, pages: [], reachable: false });
    expect(r.state).toBe('unknown');
    expect(r.blockers.length).toBeGreaterThan(0);
  });

  it('never returns weak merely because information is missing', () => {
    const r = assessSuitability({ ...baseInput, pages: [] });
    expect(r.state).not.toBe('weak');
    expect(['unknown', 'research_required']).toContain(r.state);
  });
});

describe('suitability never uses size', () => {
  it('does not demote a large programme that is centrally run', () => {
    // The Factorial shape: many partners, many managers, one programme, no distribution.
    const r = assessSuitability({
      ...baseInput,
      operator: resolveOperator({ domain: 'x.example', identityText: '', urlInventory: [], platform: null, pages: [page('https://x.example/partners', 'Join our partner program. Our partners across 40 countries.')] }),
      pages: [page('https://x.example/partners', 'Join our partner program. Deal registration is available. Gold partner and silver partner tiers. Partner onboarding takes a week. Partner portal access included. Partner enablement resources.')],
    });
    expect(['strong', 'plausible']).toContain(r.state);
  });
});

describe('distribution evidence', () => {
  const sighting = (d: string) => ({ distributor: d, brandAsListed: 'X', sourceUrl: `https://${d}.example/vendors` });

  it('demotes a channel reached through several distributors', () => {
    const r = assessSuitability({
      ...baseInput,
      distributorSightings: [sighting('alpha'), sighting('beta')],
      pages: [page('https://x.example/partners', 'Our partners are listed here. Partner portal access is available to members.')],
    });
    expect(r.state).toBe('weak');
    expect(r.rule).toBe('multi_distributor_mediated_channel');
  });

  it('keeps a distributed vendor that also runs a substantial direct programme addressable', () => {
    // The Cubbit shape: a real customer that a distributor also carries.
    const r = assessSuitability({
      ...baseInput,
      distributorSightings: [sighting('alpha'), sighting('beta')],
      operator: resolveOperator({ domain: 'x.example', identityText: '', urlInventory: [], platform: null, pages: [page('https://x.example/partners', 'Become a partner and join our partner program today.')] }),
      pages: [page('https://x.example/partners', 'Become a partner. Deal registration available. Gold partner tiers. Partner onboarding process. Partner portal login. Partner enablement resources and co-branded content.')],
    });
    expect(r.state).not.toBe('weak');
  });

  it('routes a single-distributor company to research rather than rejecting it', () => {
    const r = assessSuitability({
      ...baseInput,
      distributorSightings: [sighting('alpha')],
      pages: [page('https://x.example/partners', 'Our partners are listed here for reference purposes only on this page.')],
    });
    expect(['research_required', 'plausible']).toContain(r.state);
  });
});

describe('operator vs participant', () => {
  it('reads first-person invitation as the operator', () => {
    const r = resolveOperator({
      domain: 'x.example', identityText: '', urlInventory: [], platform: null,
      pages: [page('https://x.example/partners', 'Become a partner and join our partner program. Apply to our partner scheme today.')],
    });
    expect(r.direction).toBe('channel_operator');
  });

  it('reads membership language as a participant, and names the owner', () => {
    const r = resolveOperator({
      domain: 'x.example', identityText: '', urlInventory: [], platform: null,
      pages: [page('https://x.example/alliances/sap', 'We are a certified SAP partner and deliver implementations globally.')],
    });
    expect(r.direction).toBe('channel_participant');
    expect(r.participatesIn[0]?.owner).toContain('SAP');
  });

  it('reads distribution without an invitation as an unresolved operator', () => {
    const r = resolveOperator({
      domain: 'x.example', identityText: '', urlInventory: [], platform: null,
      pages: [page('https://x.example/buy', 'Our products are available through authorised distributors across Europe and beyond.')],
    });
    expect(r.direction).toBe('distributed_vendor');
  });

  it('refuses an account whose channel evidence belongs to another vendor', () => {
    const operator = resolveOperator({
      domain: 'x.example', identityText: '', urlInventory: [], platform: null,
      pages: [page('https://x.example/alliances/sap', 'We are a certified SAP partner delivering global implementations.')],
    });
    const r = assessSuitability({ ...baseInput, operator, pages: [] });
    expect(r.state).toBe('incompatible');
    expect(r.rule).toBe('participant_not_operator');
  });
});

describe('PRM detection is one-directional', () => {
  it('confirms a decisive vendor CNAME', () => {
    const r = assessPrm([{ host: 'partners.x.example', cname: ['abc.cname.introw.io.'], distinct: true, nonProd: false }], 0);
    expect(r.state).toBe('confirmed');
    expect(r.detections[0].vendor).toBe('introw');
  });

  it('never reports absence as "no PRM", and says so', () => {
    const r = assessPrm([], 0);
    expect(r.state).toBe('unknown');
    expect(r.note).toMatch(/unknown rather than absent/i);
  });

  it('does not treat a general-purpose portal platform as a PRM', () => {
    const r = assessPrm([{ host: 'community.x.example', cname: ['x.my.site.com.'], distinct: true, nonProd: false }], 0);
    expect(r.detections[0].state).toBe('ambiguous');
    expect(r.state).not.toBe('confirmed');
  });

  it('reports lookup failures rather than treating them as absence', () => {
    const r = assessPrm([], 7);
    expect(r.note).toMatch(/7 lookups failed/);
  });
});

describe('entity resolution name handling', () => {
  it('handles ampersands, hyphens and first-token brands', () => {
    expect(labelCandidates('PEPPERL & FUCHS')).toContain('pepperl-fuchs');
    expect(labelCandidates('LEINE & LINDE')).toContain('leinelinde');
    expect(labelCandidates('LAPP CABLE')).toContain('lapp');
  });

  it('strips legal suffixes without destroying the identifying tokens', () => {
    expect(normalise('Acme Systems GmbH')).toBe('acme systems');
    expect(identityTokens('Acme Systems GmbH')).toContain('acme');
  });
});
