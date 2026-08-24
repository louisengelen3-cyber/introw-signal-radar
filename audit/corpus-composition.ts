/** Composition of the CURRENT production corpus. Read-only. */
import { readFileSync } from 'node:fs';
const ds = JSON.parse(readFileSync(new URL('../product/out/dossiers.json', import.meta.url).pathname, 'utf8')) as any[];

/**
 * Hand-classified by reading each self-description. Assigned by me, not by the Radar —
 * the Radar has no industry field, which is itself worth stating.
 */
const INDUSTRY: Record<string, string> = {
  'getaccept.com': 'martech_salestech', 'planhat.com': 'saas_software', 'trengo.com': 'martech_salestech',
  'oneflow.com': 'saas_software', 'channable.com': 'ecommerce_tech', 'efficy.com': 'saas_software',
  'apaleo.com': 'hospitality_tech', 'sana-commerce.com': 'ecommerce_tech', 'leapsome.com': 'hr_business_software',
  'mews.com': 'hospitality_tech', 'weglot.com': 'saas_software', 'juro.com': 'legal_tech',
  'pleo.io': 'fintech', 'spendesk.com': 'fintech', 'payfit.com': 'hr_business_software',
  'foleon.com': 'martech_salestech', 'factorialhr.com': 'hr_business_software', 'upsales.com': 'saas_software',
  'twikey.com': 'fintech', 'lano.io': 'hr_business_software', 'cegeka.com': 'it_services',
  'productsup.com': 'ecommerce_tech', 'younium.com': 'fintech', 'vinted.com': 'consumer_marketplace',
  'kiflo.com': 'partner_tech', 'archerirm.com': 'saas_software', 'magentrix.com': 'partner_tech',
  'aikido.dev': 'cybersecurity_it', 'cubbit.io': 'infrastructure', 'datadoghq.com': 'saas_software',
  'doordash.com': 'consumer_marketplace', 'deloitte.com': 'professional_services',
  'glovoapp.com': 'consumer_marketplace', 'devoteam.com': 'it_services', 'aircall.io': 'martech_salestech',
};

const SOFTWARE = new Set(['saas_software', 'martech_salestech', 'ecommerce_tech', 'hospitality_tech',
  'hr_business_software', 'fintech', 'legal_tech', 'cybersecurity_it', 'infrastructure', 'partner_tech']);

const t: Record<string, number> = {};
for (const d of ds) { const i = INDUSTRY[d.domain] ?? 'unclassified'; t[i] = (t[i] ?? 0) + 1; }

console.log(`CURRENT PRODUCTION CORPUS — n=${ds.length}\n`);
console.log('By industry:');
for (const [k, v] of Object.entries(t).sort((a, b) => b[1] - a[1]))
  console.log(`  ${k.padEnd(24)} ${String(v).padStart(2)}  ${Math.round((v / ds.length) * 100)}%`);

const soft = ds.filter((d) => SOFTWARE.has(INDUSTRY[d.domain] ?? '')).length;
const phys = ds.filter((d) => {
  const i = INDUSTRY[d.domain] ?? '';
  return !SOFTWARE.has(i) && !['professional_services', 'consumer_marketplace', 'it_services'].includes(i);
}).length;
console.log(`\n  SOFTWARE / TECH                 ${soft}  ${Math.round((soft / ds.length) * 100)}%`);
console.log(`  MANUFACTURING / INDUSTRIAL / HARDWARE   ${phys}  ${Math.round((phys / ds.length) * 100)}%`);
console.log(`  other (services, marketplaces)  ${ds.length - soft - phys}`);

console.log(`\nPartner motions identified across the whole corpus:`);
const m: Record<string, number> = {};
for (const d of ds) for (const p of new Set(d.programmes.map((x: any) => x.kind))) m[p as string] = (m[p as string] ?? 0) + 1;
for (const [k, v] of Object.entries(m).sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(20)} ${v}`);
const absent = ['distributor', 'implementation', 'strategic_alliance', 'affiliate'].filter((x) => !m[x]);
console.log(`  motions NEVER identified in the corpus: ${absent.join(', ') || 'none'}`);
