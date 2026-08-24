/** Write per-company dossier renderings for the assistant arm of the efficiency experiment. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { renderDossier, STANDING_LIMITS } from './render-dossier.js';
import type { Dossier } from '../src/dossier/types.js';

const OUT = new URL('./out/experiment/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const ds = JSON.parse(readFileSync(new URL('./out/dossiers.json', import.meta.url).pathname, 'utf8')) as Dossier[];
const sample = JSON.parse(readFileSync(new URL('./validation-sample.v1.json', import.meta.url).pathname, 'utf8'));
const order: string[] = sample.companies.map((c: any) => c.domain);

const sorted = order.map((dm) => ds.find((d) => d.domain === dm)).filter(Boolean) as Dossier[];
const half = Math.ceil(sorted.length / 2);
const groups = [sorted.slice(0, half), sorted.slice(half)];

groups.forEach((g, i) => {
  writeFileSync(`${OUT}assistant-group${i + 1}.md`, STANDING_LIMITS + g.map(renderDossier).join('\n\n' + '='.repeat(78) + '\n\n'));
  writeFileSync(`${OUT}manual-group${i + 1}.md`,
    `# Companies to research\n\n${g.map((d, n) => `${n + 1}. ${d.companyName ?? d.domain} — ${d.domain}`).join('\n')}\n`);
});
console.error(`groups: ${groups.map((g) => g.length).join(' + ')} = ${sorted.length}`);
console.error(`assistant packets: ${groups.map((_, i) => `assistant-group${i + 1}.md`).join(', ')}`);
