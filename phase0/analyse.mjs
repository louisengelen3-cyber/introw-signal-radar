import { readFileSync, writeFileSync } from 'node:fs';
const R = JSON.parse(readFileSync(new URL('./out/detect.v1.json', import.meta.url)));
const C = (k) => R.filter((r) => r.cohort === k);
const pct = (n, d) => d ? `${n}/${d} (${Math.round(100 * n / d)}%)` : '0/0';
const L = [];
const say = (s = '') => { L.push(s); console.log(s); };

say('# Phase 0 — measured benchmark results (frozen cohorts v1)');
say(`Run date: ${new Date().toISOString().slice(0, 10)}. Records: ${R.length}.`);
say();

/* -------------------------------------------------- reachability --------- */
say('## 1. Reachability / coverage');
for (const k of ['cohortA', 'cohortB', 'cohortC', 'cohortD']) {
  const c = C(k), ok = c.filter((r) => r.reachable);
  const blocked = c.filter((r) => r.blockReason === 'bot_protection');
  const gone = c.filter((r) => r.blockReason === 'domain_unresolved');
  say(`- ${k}: reachable ${pct(ok.length, c.length)} · bot-blocked ${blocked.length} (${blocked.map((x) => x.domain).join(', ') || '-'}) · unresolved ${gone.length} (${gone.map((x) => x.domain).join(', ') || '-'})`);
}
say();

/* -------------------------------------------------- channel detection ---- */
say('## 2. Transacting-channel detection');
const hasChannel = (r) => ['transacting', 'weak_transacting'].includes(r.programClassification?.verdict);
const hasSurface = (r) => (r.surfaceCounts?.partner ?? 0) > 0 || (r.surfaceCounts?.dealreg ?? 0) > 0 || (r.prmFromDns?.length ?? 0) > 0;
for (const k of ['cohortA', 'cohortB', 'cohortC']) {
  const c = C(k).filter((r) => r.reachable);
  say(`- ${k}: any partner surface ${pct(c.filter(hasSurface).length, c.length)} · classified transacting/weak ${pct(c.filter(hasChannel).length, c.length)}`);
}
say();
say('### Cohort A (all are real transacting-channel companies) — per-account');
for (const r of C('cohortA').sort((a, b) => a.domain.localeCompare(b.domain))) {
  if (!r.reachable) { say(`  ${r.domain.padEnd(20)} UNREACHABLE (${r.blockReason})`); continue; }
  say(`  ${r.domain.padEnd(20)} surfaces=${String(r.surfaceCounts.partner).padEnd(4)} dealreg=${String(r.surfaceCounts.dealreg).padEnd(3)} verdict=${(r.programClassification?.verdict ?? '-').padEnd(18)} basis=${r.programBasis} prm=${r.prmFromDns?.map((x) => x.vendor).join(',') || '-'}`);
}
say();
say('### Cohort C traps — did the classifier suppress them?');
for (const r of C('cohortC').sort((a, b) => (a.trap ?? '').localeCompare(b.trap ?? ''))) {
  if (!r.reachable) { say(`  ${r.domain.padEnd(20)} ${(r.trap ?? '').padEnd(34)} UNREACHABLE`); continue; }
  say(`  ${r.domain.padEnd(20)} ${(r.trap ?? '').padEnd(34)} verdict=${(r.programClassification?.verdict ?? '-').padEnd(18)} partnerSurfaces=${r.surfaceCounts.partner}`);
}
say();

/* -------------------------------------------------- CRM ------------------ */
say('## 3. CRM detection (CONFIRMED standard = first-party artifact)');
const crmOf = (r) => r.crm?.vendors?.[0];
for (const k of ['cohortA', 'cohortB', 'cohortC']) {
  const c = C(k).filter((r) => r.reachable);
  const any = c.filter((r) => crmOf(r));
  const hs = c.filter((r) => r.crm?.vendors?.some((v) => v.vendor === 'hubspot'));
  const sf = c.filter((r) => r.crm?.vendors?.some((v) => v.vendor === 'salesforce'));
  say(`- ${k}: any CRM artifact ${pct(any.length, c.length)} · hubspot ${pct(hs.length, c.length)} · salesforce ${pct(sf.length, c.length)} · UNKNOWN ${pct(c.length - any.length, c.length)}`);
}
say();
say('### Known-HubSpot customers from Introw case studies (ground truth: HubSpot)');
for (const d of ['cumulocity.com', 'cubbit.io', 'quatt.io', 'factorialhr.com']) {
  const r = R.find((x) => x.domain === d && x.cohort === 'cohortA');
  const v = r?.crm?.vendors ?? [];
  say(`  ${d.padEnd(20)} detected=${v.map((x) => `${x.vendor}[${x.distinctArtifacts.length}]`).join(',') || 'NONE'} pagesInspected=${r?.crmPagesInspected ?? 0}`);
}
say();

/* -------------------------------------------------- PRM / suppression ---- */
say('## 4. Incumbent-PRM / existing-customer fingerprint (DNS CNAME)');
const prm = R.filter((r) => r.prmFromDns?.length);
say(`- accounts with a vendor-attributable partner-subdomain CNAME: ${prm.length}/${R.length}`);
for (const r of prm) say(`  ${r.cohort.slice(-1)} ${r.domain.padEnd(20)} ${r.prmFromDns.map((x) => `${x.vendor} @ ${x.host}`).join('; ')}`);
const inA = C('cohortA').filter((r) => r.prmFromDns?.some((x) => x.vendor === 'introw'));
say(`- Introw fingerprint recall on known customers: ${pct(inA.length, C('cohortA').filter((r) => r.reachable).length)} of reachable Cohort A`);
say(`- false positives outside Cohort A: ${R.filter((r) => r.cohort !== 'cohortA' && r.prmFromDns?.some((x) => x.vendor === 'introw')).length}`);
say();

/* -------------------------------------------------- DNS wildcards -------- */
say('## 5. DNS wildcard contamination (why "subdomain resolves" is not evidence)');
const wc = R.filter((r) => r.dnsSurvey?.wildcard);
say(`- domains with a catch-all wildcard: ${pct(wc.length, R.length)} — ${wc.map((r) => r.domain).slice(0, 14).join(', ')}`);
const naive = R.reduce((n, r) => n + (r.dnsSurvey?.subdomains?.length ?? 0), 0);
const strict = R.reduce((n, r) => n + (r.dnsSurvey?.subdomains?.filter((s) => s.distinctFromWildcard).length ?? 0), 0);
say(`- naive "subdomain resolves" hits: ${naive} · after wildcard control: ${strict} (${Math.round(100 * (1 - strict / naive))}% were wildcard noise)`);
say();

/* -------------------------------------------------- directory counts ----- */
say('## 6. Partner-directory countability');
let withDir = 0, statedOnly = 0, none = 0;
const rows = [];
for (const r of R.filter((x) => x.reachable)) {
  const pages = (r.partnerPages ?? []).filter((p) => p.directory);
  if (!pages.length) { none++; continue; }
  const methods = new Set(pages.flatMap((p) => p.directory.map((d) => d.method)));
  const stated = pages.flatMap((p) => p.directory.filter((d) => d.method === 'stated_count'));
  if (stated.length) statedOnly++;
  withDir++;
  rows.push(`  ${r.cohort.slice(-1)} ${r.domain.padEnd(20)} methods=${[...methods].join(',')} ${stated.length ? 'stated=' + stated.slice(0, 2).map((s) => `${s.count} ${s.term}`).join('/') : ''}`);
}
say(`- some countable signal: ${withDir} · explicit stated count: ${statedOnly} · nothing countable: ${none}`);
rows.slice(0, 30).forEach(say);
say();

/* -------------------------------------------------- discovery method ----- */
say('## 7. How the partner surface was found');
const m = {};
for (const r of R.filter((x) => x.reachable)) m[r.discoveryMethod ?? 'none'] = (m[r.discoveryMethod ?? 'none'] ?? 0) + 1;
say('- ' + Object.entries(m).map(([k, v]) => `${k}=${v}`).join(' · '));
say();
writeFileSync(new URL('./out/BENCHMARK_RESULTS.md', import.meta.url).pathname, L.join('\n'));
