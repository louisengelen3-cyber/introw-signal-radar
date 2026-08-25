/**
 * Informal-programme detector (Phase 5, workstream C).
 *
 * The two conditions are POSITIVE and both required. The absence of formal artefacts only
 * selects the class; it never carries the claim. The partner-tech guard is asserted separately
 * because that population satisfies both positive conditions by construction.
 */
import { describe, it, expect } from 'vitest';
import { detectInformalProgramme } from '../src/dossier/informal.js';

const page = (text: string) => ({ pages: [{ url: 'https://example.test/partners', text }], category: 'likely_target_category' });

describe('the signature requires two positive conditions', () => {
  it('fires when recruitment and partner types are present and no formal artefact is', () => {
    const r = detectInformalProgramme(page(
      'We seek partners who share this commitment. Become a Partner. '
      + 'Our Value-Added Resellers (VARs) expand our reach and our System Integrators deliver large-scale projects.',
    ));
    expect(r.verdict).toBe('informal_programme');
    expect(r.partnerTypesNamed.length).toBeGreaterThanOrEqual(2);
    expect(r.formalArtefacts).toHaveLength(0);
  });

  it('does NOT fire on absence of formal artefacts alone', () => {
    const r = detectInformalProgramme(page('We build accounts payable software for enterprise finance teams.'));
    expect(r.verdict).toBe('not_informal');
    expect(r.rationale).toMatch(/never a promotion/i);
  });

  it('does not fire on recruitment without named partner types', () => {
    const r = detectInformalProgramme(page('Become a partner. Partnerships matter to us and we value collaboration.'));
    expect(r.verdict).toBe('not_informal');
    expect(r.rationale).toMatch(/does not name what kind of partner/i);
  });

  it('does not fire on partner types without a recruitment invitation', () => {
    const r = detectInformalProgramme(page('Our resellers and system integrators serve customers across Europe.'));
    expect(r.verdict).toBe('not_informal');
  });
});

describe('formal artefacts move a company to a different class, not a worse one', () => {
  it('classifies a programme with deal registration as formalised', () => {
    const r = detectInformalProgramme(page(
      'Become a partner. Our resellers and consultancies deliver our platform. '
      + 'Partners submit deal registration through the partner portal.',
    ));
    expect(r.verdict).toBe('formalised_programme');
    expect(r.formalArtefacts.length).toBeGreaterThan(0);
  });

  it('recognises formal machinery that avoids the word "tier"', () => {
    // A real false positive: "program levels within Resell and Services tracks" is a fully
    // formalised programme that the tier patterns alone did not see.
    const r = detectInformalProgramme(page(
      'Become a partner. Our resellers and consultancies deliver our platform. '
      + 'There are program levels within our Resell and Services tracks. Who is eligible to join?',
    ));
    expect(r.verdict).toBe('formalised_programme');
  });
});

describe('the partner-tech guard is unconditional', () => {
  it('suppresses a partner-tech vendor however strong the positive evidence', () => {
    const strong = 'Become a partner. We work with resellers, agencies, consultancies and system integrators.';
    const r = detectInformalProgramme({ pages: [{ url: 'https://prm.test/partners', text: strong }], category: 'partner_tech_vendor' });
    expect(r.verdict).toBe('suppressed_partner_tech');
  });

  it('suppresses a company on the maintained competitor list', () => {
    const r = detectInformalProgramme({
      pages: [{ url: 'https://x.test/partners', text: 'Become a partner. Our VARs and consultancies deliver value.' }],
      category: 'likely_target_category', onKnownCompetitorList: true,
    });
    expect(r.verdict).toBe('suppressed_partner_tech');
  });
});

describe('locale coverage', () => {
  it('reads a Dutch recruitment invitation', () => {
    // The real sentence that produced a false negative on a known customer.
    const r = detectInformalProgramme(page(
      'Payflip gelooft in de power van partnerships. In het ecosysteem van Payflip is er daarom '
      + 'plaats voor payroll, hr, accounting én benefit-partners. Payroll partners HR partners',
    ));
    expect(r.verdict).toBe('informal_programme');
  });
});

describe('negation', () => {
  it('does not count a denied formal artefact as present', () => {
    const r = detectInformalProgramme(page(
      'Become a partner. We work with resellers and consultancies. '
      + 'We do not use partner tiers — every partner gets the same terms.',
    ));
    expect(r.formalArtefacts).toHaveLength(0);
    expect(r.verdict).toBe('informal_programme');
  });
});

describe('every verdict states what it does not prove', () => {
  it('carries proves and doesNotProve on the promoting verdict', () => {
    const r = detectInformalProgramme(page('Become a partner. Our resellers and agencies deliver our product.'));
    expect(r.proves).toBeTruthy();
    expect(r.doesNotProve).toMatch(/not.*large, active|unpublished|behind a login/i);
  });
});
