import { buildDossier } from '../../src/dossier/build.js';
for (const rec of [false, true]) {
  const d = await buildDossier('kiflo.com', { recovery: rec } as never);
  console.log(`recovery=${String(rec).padEnd(5)} state=${d.machineInterpretation.state.padEnd(14)} progs=[${d.programmes.map((p:any)=>p.kind).join(',')}] claims=${d.machineInterpretation.diagnostics.distinctClaimCount} pagesOk=${d.sourceHealth.filter((h:any)=>h.health==='success').length}/${d.sourceHealth.length}`);
}
