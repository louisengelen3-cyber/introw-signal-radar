/**
 * The reframe: order by COST TO DECIDE rather than by predicted fit.
 *
 * Autonomous fit ranking failed twice and out-of-sample promoted competitors above genuine
 * operators. Cost-to-decide promises no quality judgement — only that a reviewer can resolve
 * the record quickly. That is measurable and nothing in it has failed before.
 *
 * AVOIDING THE TAUTOLOGY
 * The ordering is built from evidence density, a quoted first-person invitation, established
 * ownership and the absence of a competitor flag. Scoring it against those same features would
 * prove nothing. The independent yardstick is the dossier's OWN open blocking questions
 * (`researchTasks`) — computed by the existing pipeline, never consulted by the ordering. A
 * record with no open blocking question is one a reviewer can close; one with several is not.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const doss: any[] = JSON.parse(readFileSync('product/out/dossiers.json', 'utf8'));

interface Rec { domain: string; density: number; hasInvitation: boolean; ownership: boolean; competitor: boolean; blocking: number }
const recs: Rec[] = doss.map((d) => ({
  domain: d.domain,
  density: d.machineInterpretation.diagnostics.distinctClaimCount,
  hasInvitation: (d.surfaces ?? []).some((s: any) => s.state === 'confirmed' && s.surface === 'partner_recruitment'
    && (s.evidence ?? []).some((e: any) => (e.quote ?? '').length > 40)),
  ownership: d.constructs?.find((c: any) => c.construct === 'operational_ownership')?.state === 'direct',
  competitor: d.category?.knownCompetitorList?.onList === true || d.category?.state === 'direct_introw_competitor',
  blocking: (d.researchTasks ?? []).length,
}));

/** Cost to decide: lower is cheaper. Ordering only — never rendered, never a score. */
const cost = (r: Rec): number => {
  if (r.competitor) return 0;                    // decisive immediately, in the other direction
  let c = 10;
  c -= Math.min(r.density, 6);
  if (r.hasInvitation) c -= 3;
  if (r.ownership) c -= 2;
  return c;
};

const byCost = [...recs].sort((a, b) => cost(a) - cost(b));
/** Deterministic pseudo-random baseline, so the comparison is reproducible. */
const seeded = [...recs].sort((a, b) => (a.domain.length * 31 + a.domain.charCodeAt(0)) - (b.domain.length * 31 + b.domain.charCodeAt(0)));

const meanBlocking = (rows: Rec[]) => rows.reduce((n, r) => n + r.blocking, 0) / rows.length;
const topHalf = (rows: Rec[]) => rows.slice(0, Math.floor(rows.length / 2));
const botHalf = (rows: Rec[]) => rows.slice(Math.floor(rows.length / 2));

console.log(`REFRAME — cost-to-decide ordering, n=${recs.length}\n`);
console.log(`independent yardstick: open blocking questions per dossier (mean ${meanBlocking(recs).toFixed(2)})\n`);
console.log('ordering        top-half blocking   bottom-half blocking   separation');
console.log('─'.repeat(70));
for (const [name, rows] of [['cost-to-decide', byCost], ['baseline (arbitrary)', seeded]] as [string, Rec[]][]) {
  const t = meanBlocking(topHalf(rows)), b = meanBlocking(botHalf(rows));
  console.log(`${name.padEnd(16)}${t.toFixed(2).padStart(13)}${b.toFixed(2).padStart(23)}${(b - t).toFixed(2).padStart(13)}`);
}

/** Spearman-style rank correlation between cost and blocking count. */
const rank = (arr: number[]) => { const s = [...arr].map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]); const r = new Array(arr.length); s.forEach(([, i], k) => { r[i as number] = k + 1; }); return r as number[]; };
const cs = recs.map(cost), bs = recs.map((r) => r.blocking);
const rc = rank(cs), rb = rank(bs);
const n = recs.length;
const dsum = rc.reduce((acc, v, i) => acc + (v - rb[i]) ** 2, 0);
const rho = 1 - (6 * dsum) / (n * (n * n - 1));
console.log(`\nSpearman rho(cost, blocking questions) = ${rho.toFixed(3)}   n=${n}`);
console.log(`  positive rho means cheaper-to-decide records genuinely carry fewer open questions.`);
console.log(`  n=${n} is small; this supports a direction, not an effect size.`);

console.log('\ncheapest ten to decide:');
for (const r of byCost.slice(0, 10)) console.log(`  ${r.domain.padEnd(24)} cost=${cost(r)}  claims=${r.density} invitation=${r.hasInvitation ? 'Y' : 'n'} ownership=${r.ownership ? 'Y' : 'n'} blocking=${r.blocking}${r.competitor ? '  [competitor]' : ''}`);
writeFileSync('phase5/out/reframe.json', JSON.stringify({ rho, n, byCost: byCost.map((r) => ({ ...r, cost: cost(r) })) }, null, 2));
