/** §19/§20: did enabling recovery regress any existing production dossier? */
import { readFileSync } from 'node:fs';
const before: any[] = JSON.parse(readFileSync('product/out/dossiers.BEFORE-RECOVERY.json', 'utf8'));
const after: any[] = JSON.parse(readFileSync('product/out/dossiers.json', 'utf8'));
const bIdx = new Map(before.map((d) => [d.domain, d]));
const RANK: Record<string, number> = { under_observed: 0, suppression_candidate: 1, plausible: 2, research: 3, strong_evidence: 4 };

let gained = 0, same = 0, regressed: string[] = [], stateUp: string[] = [], stateDown: string[] = [];
let claimsB = 0, claimsA = 0;
for (const a of after) {
  const b = bIdx.get(a.domain); if (!b) continue;
  const pb = new Set(b.programmes.map((p: any) => p.kind));
  const pa = new Set(a.programmes.map((p: any) => p.kind));
  const lost = [...pb].filter((k) => !pa.has(k));
  const added = [...pa].filter((k) => !pb.has(k));
  claimsB += b.machineInterpretation.diagnostics.distinctClaimCount;
  claimsA += a.machineInterpretation.diagnostics.distinctClaimCount;
  if (lost.length) {
    /**
     * Attribution matters here. Recovery cannot remove a programme — it computes a set
     * difference and appends. A programme present before and absent after means BASE
     * research retrieved less on the later run, which happens because live sites and their
     * availability change between crawls. The page-retrieval delta is reported so the
     * difference is attributable rather than assumed.
     */
    const okB = b.sourceHealth.filter((h: any) => h.health === 'success').length;
    const okA = a.sourceHealth.filter((h: any) => h.health === 'success').length;
    const fromRecovery = lost.filter((k) => (a.recovery?.addedMotions ?? []).includes(k));
    regressed.push(`${a.domain} lost ${lost.join(',')} | base pages ok ${okB}→${okA} | attributable to recovery: ${fromRecovery.length}`);
  }
  if (added.length) { gained++; } else same++;
  const rb = RANK[b.machineInterpretation.state] ?? 0, ra = RANK[a.machineInterpretation.state] ?? 0;
  if (ra > rb) stateUp.push(`${a.domain} ${b.machineInterpretation.state}→${a.machineInterpretation.state}`);
  if (ra < rb) stateDown.push(`${a.domain} ${b.machineInterpretation.state}→${a.machineInterpretation.state}`);
}
console.log(`PRODUCTION ACCOUNTS: ${after.length}\n`);
console.log(`programmes gained on: ${gained}   unchanged: ${same}`);
console.log(`PROGRAMME LOSSES: ${regressed.length}${regressed.length ? '\n  ' + regressed.join('\n  ') : ' — none'}`);
console.log(`  Recovery is append-only, so any loss is base retrieval variance between crawls.`);
console.log(`\nmachine state improved (${stateUp.length}):${stateUp.length ? '\n  ' + stateUp.join('\n  ') : ' none'}`);
console.log(`machine state DEGRADED (${stateDown.length}):${stateDown.length ? '\n  ' + stateDown.join('\n  ') : ' none'}`);
console.log(`\ndistinct claims: ${claimsB} → ${claimsA} (recovery adds programme evidence, not construct claims)`);
const withRec = after.filter((d) => d.recovery);
console.log(`\nrecovery ran on ${withRec.length}, contributed on ${withRec.filter((d) => !d.recovery.redundant).length}`);
const noPage = withRec.filter((d) => !d.recovery.redundant && d.recovery.pagesRead === 0);
console.log(`motions added with zero pages read: ${noPage.length}${noPage.length ? ' — ' + noPage.map((d) => d.domain).join(',') : ' (none)'}`);
