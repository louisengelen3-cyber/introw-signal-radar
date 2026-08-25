/** Workstream A measurement: yield, overlap, and the segment comparison that decides it. */
import { readFileSync, writeFileSync } from 'node:fs';
const res: any[] = JSON.parse(readFileSync('phase5/out/inversion-reseller_side.json', 'utf8'));
const dist: any[] = JSON.parse(readFileSync('phase5/out/inversion-distributor_side.json', 'utf8'));
const seen = new Set<string>(JSON.parse(readFileSync('/tmp/seen.json', 'utf8')));
const audit: any[] = JSON.parse(readFileSync('audit/out/introw-radar-reliability-audit.json', 'utf8'));
const known77 = new Set(audit.map((r) => r.domain));

const collapse = (rows: any[]) => {
  const byVendor = new Map<string, { key: string; domain: string | null; name: string; basis: string; by: Set<string>; url: string; quote: string }>();
  for (const r of rows) for (const m of r.mentions ?? []) {
    const key = m.vendorDomain ?? `name:${m.vendorName.toLowerCase()}`;
    const e = byVendor.get(key) ?? { key, domain: m.vendorDomain, name: m.vendorName, basis: m.basis, by: new Set<string>(), url: m.sourceUrl, quote: m.quote };
    e.by.add(m.publishedBy);
    byVendor.set(key, e);
  }
  return [...byVendor.values()];
};

const rA = collapse(res), rD = collapse(dist);
const pct = (n: number, t: number) => (t === 0 ? 0 : Math.round((n / t) * 1000) / 10);

const report = (label: string, rows: any[], vendors: any[]) => {
  const reached = rows.filter((r) => (r.surfacesRead ?? []).length > 0).length;
  const withV = rows.filter((r) => (r.distinctVendors ?? []).length > 0).length;
  const resolved = vendors.filter((v) => v.domain);
  const nameOnly = vendors.filter((v) => !v.domain);
  const multi = vendors.filter((v) => v.by.size > 1);
  console.log(`\n${label}  (n=${rows.length} counterparties)`);
  console.log(`  counterparties with a readable listing surface : ${reached}/${rows.length} (${pct(reached, rows.length)}%)`);
  console.log(`  counterparties naming at least one vendor      : ${withV}/${rows.length} (${pct(withV, rows.length)}%)`);
  console.log(`  distinct vendors surfaced                      : ${vendors.length}`);
  console.log(`    resolved to a domain (outbound link)         : ${resolved.length} (${pct(resolved.length, vendors.length)}%)`);
  console.log(`    name only (slug, needs later resolution)     : ${nameOnly.length} (${pct(nameOnly.length, vendors.length)}%)`);
  console.log(`  named by more than one counterparty            : ${multi.length}`);
  const overlapSeen = resolved.filter((v) => seen.has(v.domain!.toLowerCase())).length;
  const overlap77 = resolved.filter((v) => known77.has(v.domain!)).length;
  console.log(`  overlap with the 247 previously-seen domains    : ${overlapSeen} of ${resolved.length} resolved`);
  console.log(`  overlap with the audited 77                     : ${overlap77}`);
  console.log(`  NOT previously seen (new to the project)        : ${resolved.length - overlapSeen}`);
  return { reached, withV, vendors: vendors.length, resolved: resolved.length, nameOnly: nameOnly.length, multi: multi.length, overlapSeen, overlap77, fresh: resolved.length - overlapSeen };
};

console.log('WORKSTREAM A — reseller-side inversion, measured');
const sA = report('RESELLER SIDE', res, rA);
const sD = report('DISTRIBUTOR SIDE (the Phase 2 seed, for comparison)', dist, rD);

/* Segment mix — the comparison the mandate says decides the workstream. */
/**
 * Enterprise giants must be matched by NAME as well as by domain.
 *
 * The first version of this measurement counted giants only among domain-resolved vendors and
 * reported 3.9% for a seed containing Capgemini, Cognizant and Wipro. That was an artefact I
 * created: giants arrive predominantly as slug NAMES (wipro publishes microsoft, ibm, dell as
 * page slugs, not as outbound links), so restricting the denominator to resolved domains
 * excluded precisely the population being counted.
 */
const GIANT_TOKENS = ['microsoft','oracle','sap','ibm','salesforce','aws','amazon','google','cisco','dell','hpe','hp','vmware','adobe','servicenow','workday','nvidia','intel','redhat','red hat','broadcom','citrix','juniper','netapp','fortinet','palo alto','paloalto','checkpoint','check point','crowdstrike','zscaler','splunk','snowflake','databricks','sas','teradata','informatica','pega','uipath','automation anywhere','genesys','avaya','nutanix','veeam','commvault','elastic','mongodb','confluent','atlassian','okta','cloudera','qlik','tableau','anaplan','celonis'];
const isGiant = (v: any): boolean => {
  const d = (v.domain ?? '').toLowerCase().split('.')[0];
  const n = (v.name ?? '').toLowerCase().trim();
  return GIANT_TOKENS.some((t) => d === t.replace(/\s+/g, '') || n === t || n.startsWith(`${t} `));
};
/** Service categories a /solutions page emits as slugs. Not vendors. */
const SERVICE_CATEGORY = /^(digital|cyber|network|data|cloud|modern|managed|security|workspace|automation|ai|analytics|infrastructure|software|hardware|licensing|end user|unified|collaboration|storage|backup|devops|sustainab)\w*(\s|$)|(\sand\s)|services?$|solutions?$/i;

const mix = (label: string, vendors: any[]) => {
  const n = vendors.length;
  const giants = vendors.filter(isGiant);
  const eu = vendors.filter((v) => v.domain && /\.(be|nl|de|fr|it|es|se|no|dk|fi|at|ch|pl|eu)$/i.test(v.domain));
  const noise = vendors.filter((v) => !v.domain && SERVICE_CATEGORY.test(v.name));
  console.log(`\n${label} segment mix (ALL vendors, domain + name, n=${n})`);
  console.log(`  enterprise giants                : ${giants.length} (${pct(giants.length, n)}%)`);
  console.log(`  European ccTLD (resolved only)   : ${eu.length}`);
  console.log(`  service-category noise from slugs: ${noise.length} (${pct(noise.length, n)}%)`);
  console.log(`  remainder (candidate mid-market) : ${n - giants.length - noise.length}`);
  return { n, giants: giants.length, eu: eu.length, noise: noise.length, remainder: n - giants.length - noise.length };
};
const mA = mix('RESELLER SIDE', rA);
const mD = mix('DISTRIBUTOR SIDE', rD);
console.log(`\nTHE COMPARISON THAT DECIDES IT`);
console.log(`  enterprise-giant share  reseller ${pct(mA.giants, mA.n)}%  vs  distributor ${pct(mD.giants, mD.n)}%`);
console.log(`  slug noise rate         reseller ${pct(mA.noise, mA.n)}%  vs  distributor ${pct(mD.noise, mD.n)}%`);
console.log(`  candidate mid-market    reseller ${mA.remainder}  vs  distributor ${mD.remainder}`);

writeFileSync('phase5/out/A-measurement.json', JSON.stringify({
  reseller: { ...sA, mix: mA }, distributor: { ...sD, mix: mD },
  resellerVendors: rA.map((v) => ({ key: v.key, domain: v.domain, name: v.name, basis: v.basis, publishedBy: [...v.by], sourceUrl: v.url })),
  distributorVendors: rD.map((v) => ({ key: v.key, domain: v.domain, name: v.name, basis: v.basis, publishedBy: [...v.by] })),
}, null, 2));
