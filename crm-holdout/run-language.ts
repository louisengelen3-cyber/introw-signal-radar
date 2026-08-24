/** §48 language holdout. Ground truth from the mandate's own semantics; frozen before wiring. */
import { readFileSync, writeFileSync } from 'node:fs';
import { observeText, observeFingerprint } from '../src/crm/observe.js';
import { resolveVendor, applyAudit, type CrmObservation } from '../src/crm/forensics.js';

const h = JSON.parse(readFileSync('crm-holdout/language.v1.json', 'utf8'));
const NOW = h.now;
const rows: any[] = [];

for (const c of h.cases) {
  let obs: CrmObservation[];
  if (c.sourceType === 'website_fingerprint') {
    obs = [observeFingerprint({ company: 'test', vendor: 'HubSpot', quote: c.sentence, sourceUrl: 'https://test/', observedAt: NOW })];
  } else {
    obs = observeText({
      company: 'test', text: c.sentence, sourceUrl: 'https://test/job',
      sourceType: c.sourceType, sourcePublishedAt: c.publishedAt, jobTitle: c.jobTitle, observedAt: NOW,
    });
  }
  const findings = [...new Set(obs.map((o) => o.vendor))]
    .map((v) => applyAudit(resolveVendor(v, obs.filter((o) => o.vendor === v), NOW), NOW));

  const exp = c.expect;
  let actualVendor: string, actualLevel: string, pass: boolean;
  if (exp.vendor === 'NONE') {
    actualVendor = findings.length ? findings.map((f) => f.vendor).join('+') : 'NONE';
    actualLevel = findings.length ? findings[0].level : 'unknown';
    pass = findings.length === 0;
  } else if (exp.vendor === 'ANY') {
    // Every vendor named must land at the expected level — none may be elevated.
    actualVendor = findings.map((f) => f.vendor).join('+') || 'NONE';
    actualLevel = findings.map((f) => f.level).join('+') || 'unknown';
    pass = findings.length > 0 && findings.every((f) => f.level === exp.level);
  } else {
    const f = findings.find((x) => x.vendor === exp.vendor);
    actualVendor = f ? f.vendor : (findings.map((x) => x.vendor).join('+') || 'NONE');
    actualLevel = f ? f.level : 'unknown';
    pass = !!f && f.level === exp.level;
  }
  rows.push({ id: c.id, pass, expected: `${exp.vendor}/${exp.level}`, actual: `${actualVendor}/${actualLevel}`, why: c.why, quote: c.sentence.slice(0, 70) });
}

const passed = rows.filter((r) => r.pass).length;
console.log(`CRM LANGUAGE HOLDOUT — ${passed}/${rows.length} passed (sha256 39cb06c4b051b676)\n`);
console.log('    id                        expected                       actual');
console.log('─'.repeat(104));
for (const r of rows) {
  console.log(`${r.pass ? ' ok ' : 'FAIL'} ${r.id.padEnd(24)} ${r.expected.padEnd(30)} ${r.actual}`);
  if (!r.pass) console.log(`     └─ ${r.why}\n        "${r.quote}"`);
}

/** §49: the error that matters is a false CONFIRMED, not a missed one. */
const CONFIRMED = /^confirmed_/;
const falseConfirm = rows.filter((r) => !r.pass && CONFIRMED.test(r.actual.split('/')[1] ?? '') && !CONFIRMED.test(r.expected.split('/')[1] ?? ''));
const overCurrent = rows.filter((r) => !r.pass && (r.actual.split('/')[1] ?? '').includes('confirmed_current') && !(r.expected.split('/')[1] ?? '').includes('confirmed_current'));
const missed = rows.filter((r) => !r.pass && CONFIRMED.test(r.expected.split('/')[1] ?? '') && !CONFIRMED.test(r.actual.split('/')[1] ?? ''));
console.log(`\nASYMMETRIC ERROR ACCOUNTING (§49)`);
console.log(`  FALSE CONFIRMATIONS (claimed confirmed, should not be): ${falseConfirm.length}  ${falseConfirm.map((r) => r.id).join(', ')}`);
console.log(`  OVER-CURRENT (claimed current, should not be):          ${overCurrent.length}  ${overCurrent.map((r) => r.id).join(', ')}`);
console.log(`  MISSED CONFIRMATIONS (safe direction):                 ${missed.length}  ${missed.map((r) => r.id).join(', ')}`);
writeFileSync('crm-holdout/out-language.json', JSON.stringify({ passed, total: rows.length, rows, falseConfirm: falseConfirm.length, overCurrent: overCurrent.length, missed: missed.length }, null, 2));
