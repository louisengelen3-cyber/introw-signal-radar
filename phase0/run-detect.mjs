import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { get, stripTags } from './lib/fetch.mjs';
import { detectCrm, classifyLinks, classifyProgram, countDirectoryEntries, fingerprintPrm, mainContent, selfDeclaredProgramTypes } from './lib/detect.mjs';

const exec = promisify(execFile);
const cohorts = JSON.parse(readFileSync(new URL('./benchmark/cohorts.v1.json', import.meta.url)));

const SUBDOMAINS = ['partners', 'partner', 'portal', 'partnerportal', 'deals', 'dealreg', 'dealer', 'dealers', 'installers', 'connect', 'channel'];
// Pages most likely to embed a CRM form. The homepage frequently does not.
const CRM_SWEEP_PATHS = ['/contact', '/contact-us', '/demo', '/request-a-demo', '/request-demo', '/book-a-demo', '/get-a-demo', '/pricing', '/get-started', '/contact-sales'];
const FALLBACK_PATHS = ['/partners', '/partner', '/partner-program', '/become-a-partner', '/resellers', '/reseller-program', '/dealers', '/installers', '/find-a-partner', '/partenaires', '/partnerprogramma', '/partnerprogramm', '/socios'];

async function dig(host, type) {
  try {
    const { stdout } = await exec('dig', ['+short', type, host], { timeout: 8000 });
    return stdout.trim().split('\n').filter(Boolean);
  } catch { return []; }
}

async function dnsSurvey(bare) {
  // Wildcard control first: many sites resolve every subdomain to a CDN, which makes
  // "the subdomain resolves" worthless as portal evidence.
  const ctlHost = `zzq7x-phase0-control.${bare}`;
  const ctlC = await dig(ctlHost, 'CNAME');
  const ctlA = await dig(ctlHost, 'A');
  const wildcard = ctlC.length > 0 || ctlA.length > 0;
  const wildcardTargets = new Set([...ctlC, ...ctlA]);
  const found = [];
  for (const s of SUBDOMAINS) {
    const h = `${s}.${bare}`;
    const c = await dig(h, 'CNAME');
    const a = await dig(h, 'A');
    if (!c.length && !a.length) continue;
    const distinct = [...c, ...a].some((v) => !wildcardTargets.has(v));
    found.push({ host: h, cname: c, a: a.slice(0, 2), distinctFromWildcard: distinct });
  }
  return { wildcard, wildcardTargets: [...wildcardTargets], subdomains: found };
}

async function probe(company) {
  const d = company.domain;
  const out = { ...company, retrievedAt: new Date().toISOString(), notes: [] };
  let home = null;
  for (const r of [`https://www.${d}/`, `https://${d}/`]) {
    const res = await get(r);
    if (res.ok && res.body) { home = res; break; }
    out.notes.push(`root ${r} -> ${res.status}${res.error ? ' ' + res.error : ''}`);
  }
  const bare = d.replace(/^www\./, '');
  out.dnsSurvey = await dnsSurvey(bare);

  if (!home) {
    out.reachable = false;
    out.blockReason = /403|429|503/.test(out.notes.join(' ')) ? 'bot_protection' : (out.dnsSurvey.subdomains.length || out.dnsSurvey.wildcard ? 'fetch_failed' : 'domain_unresolved');
    return out;
  }
  out.reachable = true;
  out.finalUrl = home.finalUrl;
  const origin = new URL(home.finalUrl ?? `https://${d}/`).origin;
  const pagesForCrm = [home];

  // --- sitemap ------------------------------------------------------------
  let sitemapUrls = [];
  const robots = await get(`${origin}/robots.txt`);
  const smFromRobots = robots.ok ? [...(robots.body ?? '').matchAll(/sitemap:\s*(\S+)/gi)].map((m) => m[1]) : [];
  for (const sm of [...new Set([...smFromRobots, `${origin}/sitemap.xml`, `${origin}/sitemap_index.xml`])].slice(0, 4)) {
    const r = await get(sm);
    if (!r.ok || !r.body || !/<(?:urlset|sitemapindex)/i.test(r.body)) continue;
    const locs = [...r.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
    if (/<sitemapindex/i.test(r.body)) {
      const kids = locs.filter((l) => /(page|partner|dealer|installer|main|content|index|en|nl|fr|de)/i.test(l)).slice(0, 4);
      for (const k of (kids.length ? kids : locs.slice(0, 3))) {
        const kr = await get(k);
        if (kr.ok && kr.body) sitemapUrls.push(...[...kr.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]));
      }
    } else sitemapUrls.push(...locs);
    if (sitemapUrls.length > 4000) break;
  }
  out.sitemapSize = sitemapUrls.length;

  const homeCls = classifyLinks(home.finalUrl ?? origin, home.body);
  const smCls = sitemapUrls.length
    ? classifyLinks(home.finalUrl ?? origin, sitemapUrls.map((u) => `<a href="${u}"></a>`).join(''))
    : { partner: [], dealreg: [], integration: [], affiliate: [] };
  const merge = (a, b) => { const s = new Set(); const r = []; for (const x of [...a, ...b]) { if (s.has(x.url)) continue; s.add(x.url); r.push(x); } return r; };
  const surfaces = {
    partner: merge(homeCls.partner, smCls.partner),
    dealreg: merge(homeCls.dealreg, smCls.dealreg),
    integration: merge(homeCls.integration, smCls.integration),
    affiliate: merge(homeCls.affiliate, smCls.affiliate),
  };
  out.surfaceCounts = Object.fromEntries(Object.entries(surfaces).map(([k, v]) => [k, v.length]));
  out.discoveryMethod = homeCls.partner.length ? 'homepage_links' : (smCls.partner.length ? 'sitemap' : 'none');
  out.selfDeclared = selfDeclaredProgramTypes(surfaces.partner.map((p) => p.url));

  if (!surfaces.partner.length && !surfaces.dealreg.length) {
    for (const p of FALLBACK_PATHS) {
      const r = await get(origin + p);
      if (r.ok && r.status === 200 && (r.body ?? '').length > 2500) {
        surfaces.partner.push({ url: origin + p, text: '(probed)' });
        out.discoveryMethod = 'path_probe';
        break;
      }
    }
  }

  // --- partner pages, ranked so integration pages do not win ---------------
  const rank = (u) => {
    let s = 0;
    if (/(find-a-partner|partner-directory|partner-locator|dealer-locator|find-an-installer|where-to-buy|partner-finder|zoek)/i.test(u)) s += 6;
    if (/\/(partners?|resellers?|dealers?|installers?|partenaires?|partnerprogramma)\/?$/i.test(u)) s += 5;
    if (/(become-a-partner|partner-program|reseller|channel-partner|distributor)/i.test(u)) s += 4;
    if (/(technology-partner|integration-partner|isv)/i.test(u)) s -= 4;
    if (/(login|signin|sign-in)/i.test(u)) s -= 1;
    if (/\/blog\/|\/news\/|\/press/i.test(u)) s -= 6;
    return s;
  };
  const chosen = [...surfaces.partner].sort((a, b) => rank(b.url) - rank(a.url)).slice(0, 5);
  out.partnerPages = [];
  let best = null;
  for (const c of chosen) {
    const r = await get(c.url);
    if (!r.ok || !r.body) { out.partnerPages.push({ url: c.url, status: r.status, ok: false }); continue; }
    pagesForCrm.push(r);
    const text = mainContent(r.body);
    const cls = classifyProgram(text);
    const dir = countDirectoryEntries(r.body, r.finalUrl ?? c.url);
    const rec = { url: c.url, status: r.status, textLen: text.length, classification: cls, directory: dir };
    out.partnerPages.push(rec);
    const strength = (cls.verdict === 'transacting' ? 3 : cls.verdict === 'weak_transacting' ? 2 : 1) * 1000 + cls.scores.transacting;
    if (!best || strength > best.strength) best = { strength, cls, url: c.url };
  }
  for (const c of surfaces.dealreg.slice(0, 3)) {
    const r = await get(c.url);
    if (r.ok && r.body) pagesForCrm.push(r);
    out.partnerPages.push({ url: c.url, status: r.status, kind: 'dealreg' });
  }
  out.dealRegSurface = surfaces.dealreg.slice(0, 5).map((x) => x.url);

  out.programClassification = best ? best.cls : classifyProgram(mainContent(home.body));
  out.programBasis = best ? 'partner_page' : 'homepage_only';
  out.programEvidenceUrl = best ? best.url : (home.finalUrl ?? origin);

  // --- CRM sweep across form-bearing pages --------------------------------
  out.crmSweep = [];
  for (const p of CRM_SWEEP_PATHS) {
    const r = await get(origin + p);
    if (r.ok && r.status === 200 && r.body) { pagesForCrm.push(r); out.crmSweep.push(p); }
  }
  out.crm = detectCrm(pagesForCrm);
  out.crmPagesInspected = pagesForCrm.length;
  out.prmFingerprint = fingerprintPrm(pagesForCrm);

  // PRM/vendor evidence from DNS is stronger and cheaper than page fingerprinting.
  out.prmFromDns = [];
  for (const s of out.dnsSurvey.subdomains) {
    if (!s.distinctFromWildcard) continue;
    for (const [vendor, re] of (await import('./lib/detect.mjs')).PRM_VENDORS) {
      if (s.cname.some((c) => re.test(c))) out.prmFromDns.push({ vendor, host: s.host, cname: s.cname });
    }
  }
  return out;
}

async function main() {
  const which = process.argv[2] ?? 'all';
  const list = [];
  for (const k of ['cohortA', 'cohortB', 'cohortC', 'cohortD']) {
    if (which !== 'all' && which !== k) continue;
    for (const c of cohorts[k]) list.push({ ...c, cohort: k });
  }
  const seen = new Set();
  const work = list.filter((c) => { const k = c.cohort + '|' + c.domain; if (seen.has(k)) return false; seen.add(k); return true; });
  mkdirSync(new URL('./out/', import.meta.url).pathname, { recursive: true });
  const OUT = new URL('./out/detect.v1.json', import.meta.url).pathname;
  const results = [];
  let i = 0;
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (i < work.length) {
      const c = work[i++];
      try {
        const r = await probe(c);
        results.push(r);
        writeFileSync(OUT, JSON.stringify(results, null, 2));
        console.error(`[${results.length}/${work.length}] ${c.cohort.slice(-1)} ${c.domain.padEnd(24)} ok=${r.reachable ? 'Y' : 'N'} sm=${String(r.sitemapSize ?? 0).padEnd(5)} ptr=${String(r.surfaceCounts?.partner ?? 0).padEnd(4)} prog=${(r.programClassification?.verdict ?? '-').padEnd(18)} crm=${(r.crm?.vendors?.[0]?.vendor ?? '-').padEnd(11)} prm=${r.prmFromDns?.map((x) => x.vendor).join(',') || '-'}`);
      } catch (e) { results.push({ ...c, error: String(e?.message ?? e) }); console.error(`[err] ${c.domain}: ${e?.message}`); }
    }
  }));
  writeFileSync(OUT, JSON.stringify(results, null, 2));
  console.error('DONE wrote phase0/out/detect.v1.json');
}
main();
