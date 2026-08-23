/**
 * Workstream C — CRM sanity check.
 *
 * Positive control with no label leak: Introw only integrates with HubSpot and Salesforce,
 * so every known Introw customer provably runs one of the two. Recall against that group is
 * therefore a hard floor on the detector, measured without any hidden ground truth.
 *
 * The control group is the operator set from the competitor holdout, where the true CRM is
 * unknown to us — so it measures how OFTEN the detector fires, never whether it is right.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { get } from '../src/lib/http.js';
import { assessCrm } from '../src/evidence/crm.js';

const KNOWN_CUSTOMERS = ['parloa.com', 'cubbit.io', 'aikido.dev', 'axon.com', 'coder.com', 'archerirm.com'];
const OTHERS = ['gitlab.com', 'pipedrive.com', 'freshworks.com', 'talkdesk.com', 'zendesk.com', 'datadoghq.com',
  'kiflo.com', 'allbound.com', 'impartner.com', 'partnerstack.com', 'ziftsolutions.com', 'magentrix.com'];

// Marketing tags live on high-traffic conversion pages, so look where a form would be.
const PATHS = ['', '/contact', '/demo', '/pricing', '/partners', '/request-demo', '/contact-us'];

async function crmFor(domain: string) {
  const bodies: string[] = [];
  for (const p of PATHS) {
    for (const scheme of [`https://www.${domain}`, `https://${domain}`]) {
      try {
        const r = await get(scheme + p);
        if (r.ok && r.body) { bodies.push(r.body); break; }
      } catch { /* one path failing is not a result */ }
    }
  }
  return { pages: bodies.length, ...assessCrm(bodies) };
}

const rows: any[] = [];
for (const [group, list] of [['known_customer', KNOWN_CUSTOMERS], ['unknown_truth', OTHERS]] as const) {
  for (const d of list) {
    const a = await crmFor(d);
    rows.push({ domain: d, group, ...a });
    console.error(`${group.padEnd(15)} ${d.padEnd(20)} pages=${String(a.pages).padEnd(3)} ` +
      `vendor=${String(a.vendor ?? 'unknown').padEnd(12)} state=${a.state.padEnd(13)} compat=${a.compatibility}`);
  }
}
writeFileSync(new URL('./out/crm-check.json', import.meta.url).pathname, JSON.stringify(rows, null, 2));

const kc = rows.filter((r) => r.group === 'known_customer');
const found = kc.filter((r) => r.compatibility !== 'unknown');
console.error(`\nPOSITIVE CONTROL — every one of these provably runs HubSpot or Salesforce:`);
console.error(`  detected as compatible: ${found.length}/${kc.length}  (${Math.round((found.length / kc.length) * 100)}% recall)`);
console.error(`  MISSED: ${kc.filter((r) => r.compatibility === 'unknown').map((r) => r.domain).join(', ') || 'none'}`);
console.error(`  ^ every miss is a company we KNOW uses a supported CRM and could not see it.`);
const ot = rows.filter((r) => r.group === 'unknown_truth');
console.error(`\nCONTROL GROUP (true CRM unknown): fired on ${ot.filter((r) => r.vendor).length}/${ot.length}`);
console.error('DONE');
