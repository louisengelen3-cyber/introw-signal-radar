/**
 * Workstream E measurement: does negation handling reduce the prose false-positive rate?
 * Re-runs the accounts that were hand-checked in the 25 Aug audit and compares surface-level
 * findings before (stored dossiers) and after (fresh run with the guard).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { buildDossier } from '../src/dossier/build.js';

/** The six accounts hand-checked in the audit, plus the account where the bug was found. */
const AUDITED = ['expo-e.uk', 'myfactory.com', 'apaleo.com', 'machineering.de', 'allisontransmission.com', 'korewireless.com'];
const before: any[] = JSON.parse(readFileSync('discovery/batch/out-research.json', 'utf8'));

const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (i < AUDITED.length) {
    const d = AUDITED[i++];
    const prior = before.find((b) => b.domain === d);
    try {
      const dos = await buildDossier(d, { recovery: true } as never);
      const after = (dos.surfaces ?? []).filter((s: any) => s.state === 'confirmed').map((s: any) => s.surface);
      const priorSurfaces: string[] = prior?.surfaceStates
        ? prior.surfaceStates.filter((s: any) => s.state === 'confirmed').map((s: any) => s.surface)
        : (prior?.surfaces ?? []);
      rows.push({
        domain: d,
        before: priorSurfaces, after,
        dropped: priorSurfaces.filter((s: string) => !after.includes(s)),
        added: after.filter((s: string) => !priorSurfaces.includes(s)),
        programmesBefore: prior?.programmes ?? [], programmesAfter: dos.programmes.map((p: any) => p.kind),
      });
      const r = rows[rows.length - 1];
      console.error(`${d.padEnd(26)} before=${r.before.length} after=${r.after.length} dropped=[${r.dropped.join(',')}] added=[${r.added.join(',')}]`);
    } catch (e) { rows.push({ domain: d, error: (e as Error).message }); }
  }
}));
writeFileSync('phase5/out/E-measurement.json', JSON.stringify(rows, null, 2));
const totB = rows.reduce((n, r) => n + (r.before?.length ?? 0), 0);
const totA = rows.reduce((n, r) => n + (r.after?.length ?? 0), 0);
const dropped = rows.flatMap((r) => (r.dropped ?? []).map((s: string) => `${r.domain}:${s}`));
console.error(`\nconfirmed surfaces across ${rows.length} hand-audited accounts: ${totB} -> ${totA}`);
console.error(`dropped: ${dropped.join(', ') || 'none'}`);
