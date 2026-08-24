import { QUERY_FAMILIES, activeFamilies } from '../../src/discovery/families.js';
console.log('status      family                                 prec  bucket');
console.log('─'.repeat(78));
for (const f of QUERY_FAMILIES) {
  console.log(`${f.status.padEnd(11)} ${f.name.padEnd(38)} ${f.lastResult ? String(Math.round(f.lastResult.operatorPrecision * 100) + '%').padStart(4) : '   -'}  ${f.lastResult?.bucket ?? ''}`);
}
console.log(`\nrun in production (validated only): ${activeFamilies().length}`);
console.log(`run in shadow (+ provisional):      ${activeFamilies([], true).length}`);
console.log(`disabled, kept for provenance:      ${QUERY_FAMILIES.filter((f) => f.status === 'disabled').length}`);
