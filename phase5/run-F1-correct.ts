/** Recompute the 74.2% headline with the untested CRM cases resolved. */
import { readFileSync, writeFileSync } from 'node:fs';
const f1: any[] = JSON.parse(readFileSync('phase5/out/F1-untested16.json', 'utf8'));
const orig = JSON.parse(readFileSync('audit/out/unknown-audit-detail.json', 'utf8'));

const g = f1.filter((r) => r.finalVerdict.startsWith('GOOD')).length;
const b = f1.filter((r) => r.finalVerdict.startsWith('BAD')).length;
const bl = f1.filter((r) => r.finalVerdict.startsWith('BLOCKED')).length;

/** Original audit totals across the three fields it measured. */
const O = { good: 39, bad: 60, untested: 52 };
const total = O.good + O.bad + O.untested;

const C = { good: O.good + g, bad: O.bad + b, blocked: bl, untested: O.untested - f1.length };
const pct = (n: number, d: number) => Math.round((n / d) * 1000) / 10;

console.log('F1 — CORRECTING THE 74.2% HEADLINE\n');
console.log(`untested CRM cases resolved by hand: ${f1.length}`);
console.log(`  GOOD    ${g}  no public careers surface exists`);
console.log(`  BAD     ${b}  a real surface existed and the pipeline missed it`);
console.log(`  BLOCKED ${bl}  the site refuses retrieval (403) — neither class`);
console.log(`\n              ORIGINAL              CORRECTED`);
console.log(`  good      ${String(O.good).padStart(4)} (${String(pct(O.good, total)).padStart(4)}%)      ${String(C.good).padStart(4)} (${String(pct(C.good, total)).padStart(4)}%)`);
console.log(`  bad       ${String(O.bad).padStart(4)} (${String(pct(O.bad, total)).padStart(4)}%)      ${String(C.bad).padStart(4)} (${String(pct(C.bad, total)).padStart(4)}%)`);
console.log(`  blocked      –                 ${String(C.blocked).padStart(4)} (${String(pct(C.blocked, total)).padStart(4)}%)`);
console.log(`  untested  ${String(O.untested).padStart(4)} (${String(pct(O.untested, total)).padStart(4)}%)      ${String(C.untested).padStart(4)} (${String(pct(C.untested, total)).padStart(4)}%)`);
const oursOrig = O.bad + O.untested;
const oursCorr = C.bad + C.untested;
console.log(`\n  "ours to fix"  ${pct(oursOrig, total)}%  ->  ${pct(oursCorr, total)}%`);

/** Projection: if the 36 still-untested resolve at the ratio just observed. */
const ratioGood = g / (g + b);
const projGood = Math.round(C.untested * ratioGood);
const projBad = C.untested - projGood;
console.log(`\n  PROJECTION (not a measurement) — if the ${C.untested} still-untested cases resolve at the`);
console.log(`  observed ${g}:${b} good:bad ratio, "ours to fix" would land near ${pct(C.bad + projBad, total)}%.`);
console.log(`  That is an extrapolation from n=${g + b} and is offered as a range, not a figure.`);
writeFileSync('phase5/out/F1-correction.json', JSON.stringify({ resolved: { good: g, bad: b, blocked: bl }, original: O, corrected: C, oursOriginalPct: pct(oursOrig, total), oursCorrectedPct: pct(oursCorr, total), projectionPct: pct(C.bad + projBad, total) }, null, 2));
