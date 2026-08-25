/** Programme scale from prose (Phase 5, workstream D). */
import { describe, it, expect } from 'vitest';
import { extractProgrammeScale } from '../src/dossier/programme-scale.js';
const p = (text: string) => extractProgrammeScale([{ url: 'https://x.test/partners', text }]);

describe('the three cases the audit found by hand', () => {
  it('extracts a hedged thousands-separated count', () => {
    const r = p('Our network of approximately 1,600 Authorized Dealer and Distributor locations provides support.');
    expect(r[0].claimed).toBe(1600);
    expect(r[0].approximate).toBe(true);
  });

  it('extracts a generic organisation count when the sentence carries channel context', () => {
    const r = p('We are trusted by more than 600 organisations who have joined our Channel community.');
    expect(r[0].claimed).toBe(600);
  });

  it('extracts a German count', () => {
    const r = p('Und so kann sich das Partnernetzwerk sehen lassen: Rund 100 Partner aus dem deutschsprachigen Raum.');
    expect(r[0].claimed).toBe(100);
  });
});

describe('guards', () => {
  it('does not read a customer count as partner scale', () => {
    expect(p('More than 600 organisations use our product every day.')).toHaveLength(0);
  });

  it('does not count a denied figure', () => {
    expect(p('We do not have 500 resellers; we work with a handful.')).toHaveLength(0);
  });

  it('keeps two different populations as two claims', () => {
    const r = p('We have 1,600 dealer locations and 6,200 certified technicians worldwide.');
    expect(r.length).toBeGreaterThanOrEqual(2);
    expect(r.map((x) => x.claimed)).toEqual(expect.arrayContaining([1600, 6200]));
  });

  it('states that a published count is a claim, not a measurement', () => {
    const r = p('We work with over 250 resellers.');
    expect(r[0].doesNotProve).toMatch(/claim the company makes about itself/i);
  });

  it('ignores implausible magnitudes', () => {
    expect(p('Founded in 1998, we serve 2 partners.')).toHaveLength(0);
  });
});
