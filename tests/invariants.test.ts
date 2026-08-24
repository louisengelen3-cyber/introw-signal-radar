/**
 * Product invariants.
 *
 * These encode the rules that previous phases violated and that no amount of care in
 * review reliably catches. They run against the real dossier dataset, so a regression in
 * collection shows up here rather than in front of a seller.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { FORBIDDEN_SUMMARY_PATTERNS } from '../src/dossier/summary.js';
import type { Dossier } from '../src/dossier/types.js';

const PATH = new URL('../product/out/dossiers.json', import.meta.url).pathname;
const DS: Dossier[] = existsSync(PATH) ? JSON.parse(readFileSync(PATH, 'utf8')) : [];

describe('dataset invariants', () => {
  it('has a dataset to check', () => { expect(DS.length).toBeGreaterThan(0); });

  it('never states an absence for CRM, PRM or people', () => {
    // "no CRM" from a missing fingerprint is forbidden outright.
    for (const d of DS) {
      // Strip explicit negation framing first: "this is not evidence that no partner team
      // exists" is the CORRECT wording and must not be flagged as an absence claim.
      const text = [d.commercialSummary, d.systems.crm.note, d.systems.prm.note, d.people.note]
        .join(' ')
        .replace(/\b(is |are )?not evidence that[^.]*\./gi, ' ')
        .replace(/\bnever means?[^.]*\./gi, ' ');
      // "No CRM artifact found" is a statement about our EVIDENCE and is correct. What is
      // forbidden is a statement about the COMPANY: "has no CRM". The distinction is the
      // word that follows, so evidence nouns are excluded explicitly.
      expect(text, d.domain).not.toMatch(/\b(has no|does not have|no)\s+(CRM|partner team|PRM)\b(?!\s+(artifact|fingerprint|evidence|marker|signal|trace|was found|found))/i);
      expect(text, d.domain).not.toMatch(/\bNO_CRM\b/);
    }
  });

  it('emits no forbidden marketing language in any summary', () => {
    for (const d of DS) for (const re of FORBIDDEN_SUMMARY_PATTERNS) {
      expect(d.commercialSummary, `${d.domain} / ${re}`).not.toMatch(re);
    }
  });

  it('carries no numeric score or ranking field anywhere', () => {
    // A sortable number is a leaderboard waiting to happen.
    for (const d of DS) {
      const json = JSON.stringify(d);
      expect(json, d.domain).not.toMatch(/"(score|rank|priority|fitScore|probability|percentile)"\s*:/i);
    }
  });

  it('attributes every observation to a source', () => {
    for (const d of DS) {
      const all = [
        ...d.constructs.flatMap((c) => [...c.evidence, ...c.counterEvidence]),
        ...d.programmes.flatMap((p) => [...p.evidence, ...p.surfaces.flatMap((s) => s.evidence)]),
        ...d.systems.prm.evidence, ...d.systems.crm.evidence,
      ];
      for (const o of all) {
        expect(o.sourceUrl, `${d.domain}: "${o.quote.slice(0, 40)}"`).toBeTruthy();
        expect(o.proves.length, d.domain).toBeGreaterThan(5);
        expect(o.doesNotProve.length, d.domain).toBeGreaterThan(5);
        expect(o.retrievedAt, d.domain).toBeTruthy();
      }
    }
  });

  it('never claims a change on a first observation', () => {
    for (const d of DS) {
      if (d.temporal.state === 'first_observation') expect(d.temporal.changes.length, d.domain).toBe(0);
    }
  });

  it('produces no commercial evidence when nothing at all could be read', () => {
    // A technical failure must never become a finding about the company. But "the apex
    // domain was blocked" is NOT "nothing was read": channable.com's apex returned 429
    // while partners.channable.com retrieved cleanly, and an earlier version of this rule
    // forced the interpretation to say "nothing here is evidence about the company"
    // directly above three sourced claims. A reviewer caught that self-contradiction.
    for (const d of DS) {
      const identityBlocked = d.sourceHealth.length > 0 && d.sourceHealth.every((h) => h.health !== 'success');
      if (!identityBlocked) continue;

      // Identity surfaces failed, so the CATEGORY must be unknown either way.
      expect(d.category.state, d.domain).toBe('unknown');

      const readNothing = d.machineInterpretation.diagnostics.distinctClaimCount === 0 && !d.partnerDirectory.isDirectory;
      if (readNothing) {
        expect(d.machineInterpretation.state, d.domain).toBe('under_observed');
      } else {
        // Partial coverage is allowed, but it must be declared rather than implied.
        expect(d.machineInterpretation.reasons.join(' '), d.domain).toMatch(/could not be retrieved|partial/i);
      }
    }
  });

  it('reports a partner directory only as a lower bound', () => {
    for (const d of DS) {
      if (!d.partnerDirectory.isDirectory) continue;
      expect(d.commercialSummary, d.domain).toMatch(/at least \d+/);
      expect(d.partnerDirectory.observation?.doesNotProve, d.domain).toMatch(/lower bound/i);
    }
  });

  it('keeps the human review field untouched by the machine', () => {
    for (const d of DS) expect(d.humanReview, d.domain).toBeNull();
  });

  it('marks every dossier as a real observation, never a fixture', () => {
    for (const d of DS) expect(d.provenance, d.domain).toBe('real_observation');
  });

  it('always offers something to verify when it cannot decide', () => {
    for (const d of DS) {
      if (d.machineInterpretation.state !== 'research') continue;
      expect(d.researchTasks.length, `${d.domain} says research but names no question`).toBeGreaterThan(0);
    }
  });

  it('reports sparse coverage as a publishing fact, not a fit signal', () => {
    for (const d of DS) {
      if (d.evidenceCoverage !== 'sparse' && d.evidenceCoverage !== 'none') continue;
      expect(d.coverageNote, d.domain).toMatch(/not how good a prospect|limit of what/i);
    }
  });

  it('never infers switching intent from a competitor platform', () => {
    for (const d of DS) {
      if (d.systems.prm.state !== 'competitor_prm_confirmed') continue;
      expect(d.systems.prm.note, d.domain).toMatch(/does NOT indicate dissatisfaction/i);
    }
  });
});
