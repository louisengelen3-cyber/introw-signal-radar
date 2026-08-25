/**
 * Negation guard (Phase 5, workstream E). The first test is the real-world instance that
 * produced a false confirmed tier claim; the rest assert the class.
 */
import { describe, it, expect } from 'vitest';
import { isNegated, matchUnnegated, isDeniedOutright } from '../src/lib/negation.js';

describe('the instance that was caught by hand', () => {
  it('does not confirm tiers from a page that denies having them', () => {
    const t = "We don't use tiered services — you are automatically a Platinum Partner.";
    // "tiered services" is denied; "Platinum Partner" sits after a dash, a clause break, so it
    // is NOT treated as negated. The detector should therefore still see SOMETHING here — the
    // point is that the denial itself must not be the evidence.
    expect(isDeniedOutright(t, /\btiered?\s+services?\b/i)).toBe(true);
    expect(matchUnnegated(t, /\btiered?\s+services?\b/i)).toBeNull();
  });
});

describe('negation scope', () => {
  it('detects a directly negated claim', () => {
    const t = 'We do not offer deal registration to partners.';
    expect(matchUnnegated(t, /\bdeal\s+registration\b/i)).toBeNull();
  });

  it('does not treat an earlier sentence as governing a later one', () => {
    const t = 'We have no minimum commitment. We offer deal registration to all partners.';
    expect(matchUnnegated(t, /\bdeal\s+registration\b/i)).not.toBeNull();
  });

  it('stops at a clause boundary', () => {
    const t = 'There is no application form, but deal registration is available in the portal.';
    expect(matchUnnegated(t, /\bdeal\s+registration\b/i)).not.toBeNull();
  });

  it('honours "without" and "instead of"', () => {
    expect(matchUnnegated('Partners sell without deal registration.', /\bdeal\s+registration\b/i)).toBeNull();
    expect(matchUnnegated('We use a flat model instead of partner tiers.', /\bpartner\s+tiers?\b/i)).toBeNull();
  });

  it('works in Dutch, German and French', () => {
    expect(matchUnnegated('Er is geen partnerportaal beschikbaar.', /\bpartnerportaal\b/i)).toBeNull();
    expect(matchUnnegated('Es gibt kein Partnerportal.', /\bpartnerportal\b/i)).toBeNull();
    expect(matchUnnegated('Il n\'y a pas de programme partenaire.', /\bprogramme partenaire\b/i)).toBeNull();
  });

  it('does not negate a plain positive statement', () => {
    const t = 'Our partner tiers are Gold, Silver and Bronze.';
    expect(matchUnnegated(t, /\bpartner\s+tiers?\b/i)).not.toBeNull();
    expect(isNegated(t, t.indexOf('partner tiers'))).toBe(false);
  });

  it('does not reach across a long distance', () => {
    const t = `We have no legacy systems. ${'Our programme is designed for growth. '.repeat(3)}Partner tiers are published below.`;
    expect(matchUnnegated(t, /\bpartner\s+tiers?\b/i)).not.toBeNull();
  });

  it('reports outright denial only when EVERY occurrence is negated', () => {
    expect(isDeniedOutright('No partner tiers here. Partner tiers are listed below.', /\bpartner\s+tiers?\b/i)).toBe(false);
    expect(isDeniedOutright('No partner tiers. We do not use partner tiers.', /\bpartner\s+tiers?\b/i)).toBe(true);
  });

  it('returns false when the pattern never matches', () => {
    expect(isDeniedOutright('We sell software.', /\bpartner\s+tiers?\b/i)).toBe(false);
  });
});
