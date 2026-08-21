import { resolveDomain } from '../../src/discovery/mechanisms.js';
for (const n of ['PEPPERL & FUCHS','LAPP CABLE','DIVUS','AXO LIGHT','Netskope','BRAD & HARRISON','CINI & NILS','Anomali','Coroplast']) {
  const r = await resolveDomain(n);
  console.log(n.padEnd(20), r.state.padEnd(11), (r.domain ?? '-').padEnd(24), r.method.slice(0, 64));
}
