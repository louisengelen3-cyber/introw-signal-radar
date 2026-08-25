/** Parts 8, 9, 10, 16, 17, 18, 19, 20, 27 — remaining derived datasets. */
import { readFileSync, writeFileSync } from 'node:fs';
const J = (f: string) => JSON.parse(readFileSync(f, 'utf8'));
const rows: any[] = J('audit/out/introw-radar-reliability-audit.json');
const existing: any[] = J('crm-research/out/existing.json');
const batch: any[] = J('discovery/batch/out-research.json');
const doss: any[] = J('product/out/dossiers.json');
const cands = J('discovery/batch/candidates.v1.json');
const ameas = J('phase5/out/A-measurement.json');
const bh: any[] = J('phase5/out/B-harvest.json');
const navc = J('phase5/out/E-navchrome.json');
const N = rows.length;
const pct = (n: number, d = N) => (d === 0 ? 0 : Math.round((n / d) * 1000) / 10);
const esc = (v: any) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (f: string, h: string[], d: any[][]) => writeFileSync(`audit/out/${f}`, [h.join(','), ...d.map((r) => r.map(esc).join(','))].join('\n') + '\n');

/* ── PART 8: CRM funnel + per-source unique attribution ───────────────────── */
const crmAccts = [...existing.map((r) => ({ d: r.domain, cov: r.coverage, obs: r.observationDetail ?? [], vend: r.vendors ?? [], conflict: r.conflict })),
  ...batch.map((r) => ({ d: r.domain, cov: r.crmCoverage, obs: r.crm?.observationDetail ?? [], vend: r.crm?.vendor ? [{ vendor: r.crm.vendor, level: r.crm.level }] : [], conflict: r.crm?.conflict }))];
const M = crmAccts.length;
const jobObs = crmAccts.flatMap((a) => a.obs.filter((o: any) => o.sourceType !== 'website_fingerprint'));
const decisiveObs = jobObs.filter((o: any) => o.basis === 'company_possession' || o.basis === 'operational_duty');
const funnel: [string, number][] = [
  ['accounts researched', M],
  ['CRM research attempted', crmAccts.filter((a) => a.cov).length],
  ['careers surface reachable', crmAccts.filter((a) => (a.cov?.careersPagesFound ?? 0) > 0 || a.cov?.atsBoardFound).length],
  ['jobs found (>=1 readable vacancy)', crmAccts.filter((a) => (a.cov?.vacanciesRead ?? 0) > 0).length],
  ['relevant (non-partner) jobs read', crmAccts.filter((a) => (a.cov?.nonPartnerTitlesRead ?? 0) > 0).length],
  ['any CRM language in a job source', crmAccts.filter((a) => a.obs.some((o: any) => o.sourceType !== 'website_fingerprint')).length],
  ['vendor-specific evidence (any source)', crmAccts.filter((a) => a.obs.length > 0).length],
  ['operational possession evidence', crmAccts.filter((a) => a.obs.some((o: any) => o.basis === 'company_possession' || o.basis === 'operational_duty')).length],
  ['current CRM established', crmAccts.filter((a) => a.vend.some((v: any) => v.level === 'confirmed_current')).length],
  ['historical CRM established', crmAccts.filter((a) => a.vend.some((v: any) => v.level === 'confirmed_historical')).length],
  ['conflicts', crmAccts.filter((a) => a.conflict).length],
  ['remains unknown', M - crmAccts.filter((a) => a.vend.some((v: any) => /^confirmed_/.test(v.level))).length],
];
console.log('PART 8 — CRM FUNNEL (n=' + M + ')');
for (const [k, v] of funnel) console.log(`  ${String(v).padStart(4)}  ${k}`);

const FAM: [string, RegExp][] = [
  ['partner/channel', /partner|channel|allian|reseller/i],
  ['RevOps / Sales Ops', /rev\s?ops|revenue operations|sales operations|sales ops|deal desk/i],
  ['Marketing Ops', /marketing/i],
  ['Customer Success', /customer success|account manager|support/i],
  ['AE / Sales', /account executive|sales|business development|bdr|sdr|commercial|vertrieb|verkoop/i],
  ['other / untitled', /.*/],
];
const famOf = (t: string | null) => { if (!t) return 'other / untitled'; for (const [n, re] of FAM) if (re.test(t)) return n; return 'other / untitled'; };
/** UNIQUE incremental: accounts whose ONLY decisive evidence came from this family/source. */
const uniqueBy = (keyer: (o: any) => string) => {
  const out: Record<string, number> = {};
  for (const a of crmAccts) {
    const dec = a.obs.filter((o: any) => o.basis === 'company_possession' || o.basis === 'operational_duty');
    if (dec.length === 0) continue;
    const keys = new Set(dec.map(keyer));
    if (keys.size === 1) { const k = [...keys][0]; out[k] = (out[k] ?? 0) + 1; }
  }
  return out;
};
const uFam = uniqueBy((o) => famOf(o.jobTitle));
const uSrc = uniqueBy((o) => o.sourceType);
const famRows = [...new Set([...FAM.map((f) => f[0])])].map((f) => {
  const obsN = jobObs.filter((o: any) => famOf(o.jobTitle) === f).length;
  const decN = decisiveObs.filter((o: any) => famOf(o.jobTitle) === f).length;
  return ['job_family', f, obsN, decN, uFam[f] ?? 0];
});
const SRCS = ['company_ats_vacancy', 'company_current_vacancy', 'company_cached_vacancy', 'company_careers_index', 'recruiting_mirror', 'job_board_reproduction', 'public_linkedin_job', 'search_snippet', 'website_fingerprint', 'company_documentation'];
const srcRows = SRCS.map((s) => {
  const obsN = crmAccts.flatMap((a) => a.obs).filter((o: any) => o.sourceType === s).length;
  const decN = crmAccts.flatMap((a) => a.obs).filter((o: any) => o.sourceType === s && (o.basis === 'company_possession' || o.basis === 'operational_duty')).length;
  return ['source', s, obsN, decN, uSrc[s] ?? 0];
});
csv('crm-forensics.csv', ['dimension', 'bucket', 'observations', 'decisive_observations', 'accounts_uniquely_unlocked'],
  [...funnel.map(([k, v]) => ['funnel', k, v, '', '']), ...famRows, ...srcRows]);
console.log('\n  unique accounts unlocked by job family: ' + JSON.stringify(uFam));
console.log('  unique accounts unlocked by source     : ' + JSON.stringify(uSrc));
const nonPartnerDecisive = decisiveObs.filter((o: any) => famOf(o.jobTitle) !== 'partner/channel').length;
console.log(`  decisive observations from NON-partner roles: ${nonPartnerDecisive}/${decisiveObs.length}`);

/* ── PART 9: ATS / job coverage states ────────────────────────────────────── */
const ats = [
  ['supported ATS board attributed', crmAccts.filter((a) => a.cov?.atsBoardFound).length],
  ['no ATS board but vacancies read', crmAccts.filter((a) => !a.cov?.atsBoardFound && (a.cov?.vacanciesRead ?? 0) > 0).length],
  ['careers page found, no readable vacancy (JS-only or listing)', crmAccts.filter((a) => (a.cov?.careersPagesFound ?? 0) > 0 && (a.cov?.vacanciesRead ?? 0) === 0).length],
  ['no careers surface reached at all', crmAccts.filter((a) => !a.cov?.atsBoardFound && (a.cov?.careersPagesFound ?? 0) === 0).length],
  ['historical vacancies read despite no board', crmAccts.filter((a) => !a.cov?.atsBoardFound && (a.cov?.historicalVacanciesRead ?? 0) > 0).length],
  ['indexed jobs used despite unsupported ATS', 0],
  ['blocked (403 on careers)', rows.filter((r) => r.crm_state === 'blocked').length],
];
csv('ats-coverage.csv', ['state', 'accounts', 'pct_of_crm_population'], ats.map(([k, v]) => [k, v, pct(v as number, M)]));
console.log('\nPART 9 — ATS COVERAGE');
for (const [k, v] of ats) console.log(`  ${String(v).padStart(4)} (${String(pct(v as number, M)).padStart(5)}%)  ${k}`);

/* ── PART 10: discovery funnel per mechanism ──────────────────────────────── */
const allRes = cands.runs.flatMap((r: any) => r.results);
const lab = (l: string) => allRes.filter((r: any) => r.label === l).length;
const invV = ameas.resellerVendors ?? [];
const bhM = bh.flatMap((h) => h.mentions ?? []);
const funnels = [
  ['search_query_family', 'search results', allRes.length, 'non-companies: trade press, registries, listicles, law'],
  ['search_query_family', 'unique domains', new Set(allRes.map((r: any) => r.domain)).size, 'duplicates across queries'],
  ['search_query_family', 'valid companies', allRes.length - lab('IRRELEVANT'), '25 were not companies'],
  ['search_query_family', 'channel operators', lab('VALID_OPERATOR') + lab('VALID_OPERATOR_VIA_DIRECTORY'), '6 participants, 4 partner-tech vendors removed'],
  ['search_query_family', 'researched', 42, 'all fresh operators researched, no cheap gate'],
  ['search_query_family', 'commercially reviewable', rows.filter((r) => r.discovery_mechanism === 'search_query_family' && r.commercial_review_readiness?.startsWith('SUFF')).length, 'ownership or motion not established'],
  ['counterparty_inversion', 'vendor mentions', invV.length, '—'],
  ['counterparty_inversion', 'resolved to a domain', invV.filter((v: any) => v.domain).length, '58% arrive as slug names with no domain'],
  ['counterparty_inversion', 'researched sample', 30, 'bounded sample of fresh non-giant vendors'],
  ['counterparty_inversion', 'partner motion established', rows.filter((r) => r.discovery_mechanism === 'counterparty_inversion' && r.partner_motion_state === 'established').length, 'R1/E1'],
  ['counterparty_inversion', 'commercially reviewable', rows.filter((r) => r.discovery_mechanism === 'counterparty_inversion' && r.commercial_review_readiness?.startsWith('SUFF')).length, 'ownership not established'],
  ['prm_customer_harvest', 'customer mentions', bhM.length, '—'],
  ['prm_customer_harvest', 'resolved to a domain', 78, '41% unresolvable from a name alone'],
  ['prm_customer_harvest', 'researched sample', 45, 'stratified across SMB/mid/enterprise'],
  ['prm_customer_harvest', 'partner motion established', rows.filter((r) => r.discovery_mechanism === 'prm_customer_harvest' && r.partner_motion_state === 'established').length, 'R1/E1'],
  ['prm_customer_harvest', 'commercially reviewable', rows.filter((r) => r.discovery_mechanism === 'prm_customer_harvest' && r.commercial_review_readiness?.startsWith('SUFF')).length, 'ownership not established'],
];
csv('discovery-funnel.csv', ['mechanism', 'stage', 'n', 'dominant_dropoff_reason'], funnels);
console.log('\nPART 10 — DISCOVERY FUNNEL');
for (const f of funnels) console.log(`  ${String(f[0]).padEnd(24)} ${String(f[2]).padStart(4)}  ${f[1]}`);

/* ── PART 16/17: source yield and information gain ────────────────────────── */
const gain = [
  ['company website (base partner research)', 151, rows.filter((r) => r.partner_motion_state === 'established').length, 'partner motion, programme type, workflows'],
  ['recovery (regional + programme subdomains)', 77, 27, 'motion on non-canonical domains'],
  ['counterparty inversion', 19, rows.filter((r) => r.discovery_mechanism === 'counterparty_inversion').length, 'entire vendor population — 150 fresh domains'],
  ['PRM customer harvest', 13, rows.filter((r) => r.discovery_mechanism === 'prm_customer_harvest').length, 'entire proxy-positive population'],
  ['current jobs (ATS + careers)', M, 3, 'CRM current'],
  ['non-partner jobs specifically', M, nonPartnerDecisive, 'ALL decisive CRM observations'],
  ['historical jobs', M, 0, 'nothing'],
  ['LinkedIn / public indexed', 8, 7, 'partner people only — zero CRM, zero partner-programme'],
  ['website fingerprints', 151, 0, 'supporting only, never decisive'],
  ['partner directories', 151, rows.filter((r) => r.partner_directory_state === 'confirmed').length, 'directory presence, lower bound only'],
  ['programme-scale prose', 47, rows.filter((r) => r.programme_scale_state === 'claimed').length, 'claimed programme size'],
  ['search engine (targeted CRM)', 4, 0, 'nothing — 3 false positives avoided'],
];
csv('source-yield.csv', ['source_family', 'research_attempts_or_accounts', 'unique_useful_facts', 'coverage_unlocked'], gain);

/* ── PART 27: does programme_tiers contribute unique information? ─────────── */
const tierAccts = rows.filter((r) => r.partner_tiers_state === 'confirmed');
const tierOnly = tierAccts.filter((r) => r.partner_portal_state !== 'confirmed' && r.deal_registration_state !== 'confirmed' && r.partner_enablement_state !== 'confirmed');
console.log('\nPART 27 — programme_tiers utility');
console.log(`  accounts with a confirmed tier finding      : ${tierAccts.length}`);
console.log(`  of those, menu-like evidence (Phase 5, n=6) : ${navc.bySurface.programme_tiers} of 6 = 67%`);
console.log(`  accounts where tiers is the ONLY workflow   : ${tierOnly.length}  <- its unique contribution`);
writeFileSync('audit/out/tiers-utility.json', JSON.stringify({ confirmed: tierAccts.length, menuLikeOf6: navc.bySurface.programme_tiers, uniqueContribution: tierOnly.length, domains: tierAccts.map((r) => r.domain) }, null, 2));
console.log('\nwrote crm-forensics.csv, ats-coverage.csv, discovery-funnel.csv, source-yield.csv, tiers-utility.json');
