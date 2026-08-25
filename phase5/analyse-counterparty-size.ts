/**
 * The seed confound, measured.
 *
 * The reseller arm is dominated by GLOBAL systems integrators (Capgemini, Cognizant, Wipro,
 * Deloitte). Those partner with enterprise giants by definition, so the arm does not test the
 * hypothesis as stated — which was about mid-market VARs, MSPs and local consultancies. This
 * splits the arm by counterparty scale to see whether counterparty SIZE, not counterparty
 * TYPE, is what determines the segment of vendor surfaced.
 */
import { readFileSync, writeFileSync } from 'node:fs';
const res: any[] = JSON.parse(readFileSync('phase5/out/inversion-reseller_side.json', 'utf8'));
const conf: any[] = JSON.parse(readFileSync('phase5/out/inversion-confirmatory.json', 'utf8'));

const GIANT = ['microsoft','oracle','sap','ibm','salesforce','aws','amazon','google','cisco','dell','hpe','hp','vmware','adobe','servicenow','workday','nvidia','intel','redhat','red hat','broadcom','citrix','juniper','netapp','fortinet','palo alto','paloalto','checkpoint','check point','crowdstrike','zscaler','splunk','snowflake','databricks','sas','teradata','informatica','pega','uipath','automation anywhere','genesys','avaya','nutanix','veeam','commvault','elastic','mongodb','confluent','atlassian','okta','cloudera','qlik','tableau','anaplan','celonis','apple','lenovo','samsung','xerox','canon','ricoh','mimecast','proofpoint','sophos','trellix','tenable','rapid7','varonis','netskope'];
const isGiant = (m: any) => {
  const d = (m.vendorDomain ?? '').toLowerCase().split('.')[0];
  const n = (m.vendorName ?? '').toLowerCase().trim();
  return GIANT.some((t) => d === t.replace(/\s+/g, '') || n === t || n.startsWith(`${t} `));
};

/** Global SIs and national VARs, tagged from what they are — not from what they surfaced. */
const GLOBAL_SI = new Set(['capgemini.com','cognizant.com','wipro.com','deloitte.com','bain.com','sopra-steria.com','nagarro.com','valtech.com','xebia.com','devoteam.com']);
const NATIONAL_VAR = new Set(['softcat.com','computacenter.com','bechtle.com','insight.com','nomios.com','cegeka.com']);
const LOCAL = new Set(['smcconsulting.be','ojc-consulting.com','hrpartners.securex.be','securex.be']);

const rows = [...res, ...conf].filter((r) => (r.mentions ?? []).length > 0);
const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 1000) / 10);

const buckets: Record<string, { cps: string[]; total: number; giants: number }> = {
  'global systems integrator': { cps: [], total: 0, giants: 0 },
  'national VAR / MSP': { cps: [], total: 0, giants: 0 },
  'local consultancy / marketplace': { cps: [], total: 0, giants: 0 },
};
const perCp: any[] = [];
for (const r of rows) {
  const cp = r.counterparty;
  const b = GLOBAL_SI.has(cp) ? 'global systems integrator'
    : NATIONAL_VAR.has(cp) ? 'national VAR / MSP'
    : LOCAL.has(cp) ? 'local consultancy / marketplace' : null;
  const g = (r.mentions ?? []).filter(isGiant).length;
  const t = (r.mentions ?? []).length;
  perCp.push({ counterparty: cp, bucket: b ?? 'unclassified', vendors: t, giants: g, giantPct: pct(g, t) });
  if (!b) continue;
  buckets[b].cps.push(cp); buckets[b].total += t; buckets[b].giants += g;
}

console.log('IS IT COUNTERPARTY TYPE, OR COUNTERPARTY SIZE?\n');
console.log('bucket                            counterparties  vendors  giants  giant share');
console.log('─'.repeat(84));
for (const [k, v] of Object.entries(buckets)) {
  console.log(`${k.padEnd(34)} ${String(v.cps.length).padStart(13)}  ${String(v.total).padStart(7)}  ${String(v.giants).padStart(6)}  ${String(pct(v.giants, v.total) + '%').padStart(10)}`);
}
console.log('\nper counterparty, most enterprise-skewed first');
for (const p of perCp.sort((a, b) => b.giantPct - a.giantPct)) {
  console.log(`  ${p.counterparty.padEnd(24)} ${String(p.vendors).padStart(4)} vendors  ${String(p.giantPct + '%').padStart(6)} giants   ${p.bucket}`);
}
writeFileSync('phase5/out/A-counterparty-size.json', JSON.stringify({ buckets, perCp }, null, 2));
