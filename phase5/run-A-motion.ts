/** Workstream A yield: do surfaced vendors establish a partner motion under EXISTING detectors? */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildDossier } from '../src/dossier/build.js';

const m = JSON.parse(readFileSync('phase5/out/A-measurement.json', 'utf8'));
const seen = new Set<string>(JSON.parse(readFileSync('/tmp/seen.json', 'utf8')));
const GIANT = /^(microsoft|oracle|sap|ibm|salesforce|aws|amazon|google|cisco|dell|hpe?|vmware|adobe|servicenow|workday|nvidia|intel|redhat|broadcom|citrix|juniper|netapp|fortinet|paloalto|checkpoint|crowdstrike|zscaler|splunk|snowflake|databricks|apple|lenovo|xerox|canon|ricoh|mimecast|proofpoint|sophos|tenable|rapid7|varonis|netskope|atlassian|okta|elastic|mongodb|veeam|nutanix|uipath|pega|informatica|qlik|celonis)\./i;

/** Domain-resolved, not a giant, not previously seen. Deterministic order, capped. */
const cands: string[] = m.resellerVendors
  .filter((v: any) => v.domain && !GIANT.test(v.domain) && !seen.has(v.domain.toLowerCase()))
  .map((v: any) => v.domain)
  .sort()
  .slice(0, 30);

console.error(`testing ${cands.length} surfaced vendors against existing detectors`);
const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < cands.length) {
    const d = cands[i++];
    try {
      const dos = await buildDossier(d, { recovery: true } as never);
      const progs = dos.programmes.map((p: any) => p.kind);
      const surf = (dos.surfaces ?? []).filter((s: any) => s.state === 'confirmed').map((s: any) => s.surface);
      rows.push({
        domain: d, state: dos.machineInterpretation.state, category: dos.category?.state,
        programmes: progs, surfaces: surf,
        motion: progs.length > 0 || surf.length > 0,
        claims: dos.machineInterpretation.diagnostics.distinctClaimCount,
        // Measurement instrument: constructs were not persisted on the first run, which made
        // every inversion-surfaced account read as "ownership unknown" and produced a false
        // zero for commercial-review readiness in the audit.
        constructs: (dos.constructs ?? []).map((c: any) => ({ construct: c.construct, state: c.state })),
        surfaceStates: (dos.surfaces ?? []).map((s: any) => ({ surface: s.surface, state: s.state })),
        prmState: dos.systems?.prm?.state ?? 'unknown',
        directoryIsDirectory: dos.partnerDirectory?.isDirectory === true,
        pagesOk: (dos.sourceHealth ?? []).filter((h: any) => h.health === 'success').length,
      });
      const r = rows[rows.length - 1];
      console.error(`[${rows.length}/${cands.length}] ${d.padEnd(26)} motion=${r.motion ? 'YES' : 'no '} ${r.state}`);
    } catch (e) { rows.push({ domain: d, error: (e as Error).message, motion: false }); }
  }
}));
rows.sort((a, b) => a.domain.localeCompare(b.domain));
writeFileSync('phase5/out/A-motion.json', JSON.stringify(rows, null, 2));
const ok = rows.filter((r) => r.motion).length;
console.error(`DONE — ${ok}/${rows.length} establish a partner motion (${Math.round(ok / rows.length * 100)}%)`);
