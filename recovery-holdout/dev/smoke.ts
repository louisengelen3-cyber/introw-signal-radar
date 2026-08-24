import { buildDossier } from '../../src/dossier/build.js';
for (const d of ['stiebel-eltron.de', 'gira.de']) {
  const base = await buildDossier(d, {} as never);
  const rec = await buildDossier(d, { recovery: true } as never);
  console.log(`\n${d}`);
  console.log(`  base : state=${base.machineInterpretation.state} progs=[${base.programmes.map(p=>p.kind).join(',')}]`);
  console.log(`  union: state=${rec.machineInterpretation.state} progs=[${rec.programmes.map(p=>p.kind).join(',')}]`);
  const r = (rec as any).recovery;
  console.log(`  recovery: ${r ? `domains=${r.domainsSearched.length} surf=${r.surfacesFound} read=${r.pagesRead} added=[${r.addedMotions.concat(r.addedSurfaces).join(',')}] stopped=${r.stoppedBecause}` : 'not attempted'}`);
  if (r?.sourceUrls?.length) console.log(`  urls: ${r.sourceUrls.slice(0,3).map((u:any)=>`${u.origin}:${u.url}`).join('\n        ')}`);
}
