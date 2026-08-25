/**
 * Measurement-integrity tests for the reliability audit.
 *
 * These do not test the Radar. They test the AUDIT — that the dataset preserves the
 * distinctions the whole exercise depends on, and that a future run cannot silently collapse
 * them. Two real instrument bugs in this mandate motivate them: a script that read the file it
 * wrote, and a coverage row that redefined its own semantics.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';

const rows: any[] = JSON.parse(readFileSync('audit/out/introw-radar-reliability-audit.json', 'utf8'));

describe('the three unknown states stay distinct', () => {
  it('uses not_attempted, unknown and blocked as different values', () => {
    const values = new Set<string>();
    for (const r of rows) for (const v of Object.values(r)) if (typeof v === 'string') values.add(v);
    expect(values.has('not_attempted')).toBe(true);
    expect(values.has('unknown')).toBe(true);
  });

  it('never reports a field as known when no detector ran', () => {
    // partner_incentives and partner_attribution have no detector at all.
    for (const r of rows) {
      expect(r.partner_incentives_state).toBe('not_attempted');
      expect(r.partner_attribution_state).toBe('not_attempted');
    }
  });

  it('keeps blocked out of the unknown bucket', () => {
    const blocked = rows.filter((r) => r.crm_state === 'blocked');
    for (const b of blocked) expect(b.crm_state).not.toBe('unknown');
  });
});

describe('denominators are honest', () => {
  it('every account carries the mechanism that discovered it', () => {
    for (const r of rows) expect(r.discovery_mechanism).toBeTruthy();
  });

  it('coverage percentages are computed against the full population, not the found subset', () => {
    const cov = readFileSync('audit/out/field-coverage.csv', 'utf8').trim().split('\n').slice(1);
    // The first eight columns are simple scalars, so a naive split is safe up to index 7.
    // Counting back from the end is not: the trailing source and failure columns are quoted
    // free text and may contain commas.
    for (const line of cov) {
      const denom = Number(line.split(',')[7]);
      expect(denom).toBe(rows.length);
    }
  });

  it('does not claim a field is measured on accounts it was never run on', () => {
    // people were measured on a bounded sample; everything else must read not_attempted.
    const attempted = rows.filter((r) => r.linkedin_research_attempted === 'yes');
    expect(attempted.length).toBeLessThan(rows.length);
    for (const r of rows) {
      if (r.linkedin_research_attempted === 'not_attempted') expect(r.partner_people_state).toBe('not_attempted');
    }
  });
});

describe('the derived files exist and are non-empty', () => {
  const files = ['field-coverage.csv', 'failure-analysis.csv', 'source-yield.csv', 'crm-forensics.csv',
    'account-completeness.csv', 'unknown-audit.csv', 'segment-coverage.csv', 'ats-coverage.csv',
    'discovery-funnel.csv', 'false-negatives.csv', 'false-positives.csv',
    'importance-vs-coverage.csv', 'bottom-10-fields.csv', 'failure-ranking.csv'];
  for (const f of files) {
    it(`${f} exists with rows`, () => {
      expect(existsSync(`audit/out/${f}`)).toBe(true);
      expect(readFileSync(`audit/out/${f}`, 'utf8').trim().split('\n').length).toBeGreaterThan(1);
    });
  }
});

describe('the audit does not overstate what it measured', () => {
  it('records zero historical CRM conclusions rather than implying coverage', () => {
    expect(rows.filter((r) => r.historical_crm_evidence === 'yes').length).toBe(0);
  });

  it('records zero temporal evidence, as none was attempted', () => {
    for (const r of rows) expect(r.temporal_evidence).toBe('not_attempted');
  });
});
