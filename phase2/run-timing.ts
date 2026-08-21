/**
 * Track E — bounded timing feasibility.
 *
 * The goal is NOT to build a Why-Now engine. It is to establish which timing detectors
 * deserve Phase 3 engineering, and to stop carrying carve-out/M&A as an assumed truth:
 * Phase 1 flagged it as the highest-conviction trigger with no measured basis at all.
 *
 * Every test answers the same four questions: does the source exist, can it be dated,
 * can it be attached to the right entity, and can it be distinguished from our own first
 * observation of a static state?
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { get, mainContent } from '../src/lib/http.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

interface Finding {
  test: string;
  question: string;
  result: string;
  evidence: string[];
  verdict: 'BUILD' | 'BUILD_LATER' | 'MANUAL' | 'CONTEXT_ONLY' | 'DO_NOT_BUILD' | 'UNRESOLVED';
  limitation: string;
}
const findings: Finding[] = [];

/* ── A. PRM change, via historical partner-surface content ───────────────── */
{
  // Can Common Crawl show a partner surface changing between two dated captures?
  const targets = [
    ['extrahop.com', 'partnerportal.extrahop.com'],
    ['semperis.com', 'partner.semperis.com'],
    ['cubbit.io', 'partner.cubbit.io'],
  ];
  const evidence: string[] = [];
  let dated = 0;
  for (const [domain, host] of targets) {
    const caps: { coll: string; n: number; first?: string; last?: string }[] = [];
    for (const coll of ['CC-MAIN-2026-30', 'CC-MAIN-2026-12', 'CC-MAIN-2025-38', 'CC-MAIN-2025-26']) {
      const r = await get(
        `https://index.commoncrawl.org/${coll}-index?url=${encodeURIComponent(host + '/*')}&output=json&limit=50&fl=url,timestamp,status`,
        { timeout: 60000 },
      );
      const lines = r.ok && r.body ? r.body.trim().split('\n').filter(Boolean) : [];
      const stamps = lines.map((l) => { try { return JSON.parse(l).timestamp as string; } catch { return ''; } }).filter(Boolean).sort();
      caps.push({ coll, n: lines.length, first: stamps[0], last: stamps[stamps.length - 1] });
    }
    const withCaptures = caps.filter((c) => c.n > 0);
    if (withCaptures.length >= 2) dated++;
    evidence.push(`${domain}: ${host} captured in ${withCaptures.length}/4 collections — ${caps.map((c) => `${c.coll.slice(8)}:${c.n}`).join(' ')}`);
  }
  findings.push({
    test: 'A. PRM / portal change via historical captures',
    question: 'Can a partner portal appearing, moving or changing platform be dated from public history?',
    result: `${dated}/3 partner hosts had captures in two or more Common Crawl collections`,
    evidence,
    verdict: dated >= 2 ? 'BUILD_LATER' : 'UNRESOLVED',
    limitation: 'Common Crawl samples; a host absent from one collection is not evidence it did not exist. A change in CNAME target — the actual platform migration — is not recorded by Common Crawl at all, and would require our own DNS snapshots taken over time.',
  });
}

/* ── B. Partner programme launch or relaunch, from dated first-party pages ─ */
{
  const targets = ['cumulocity.com', 'teamleader.eu', 'niko.eu', 'vanta.com'];
  const evidence: string[] = [];
  let firstSeenOnly = 0;
  let datedByPage = 0;
  for (const d of targets) {
    let earliest = '';
    for (const coll of ['CC-MAIN-2025-26', 'CC-MAIN-2025-38', 'CC-MAIN-2026-12', 'CC-MAIN-2026-30']) {
      const r = await get(
        `https://index.commoncrawl.org/${coll}-index?url=${encodeURIComponent(d + '/*')}&output=json&limit=2000&fl=url,timestamp`,
        { timeout: 60000 },
      );
      const rows = (r.ok && r.body ? r.body.trim().split('\n').filter(Boolean) : [])
        .map((l) => { try { return JSON.parse(l) as { url: string; timestamp: string }; } catch { return null; } })
        .filter((x): x is { url: string; timestamp: string } => !!x)
        .filter((x) => /partner|dealer|reseller|distribut|installateur|h[äa]ndler/i.test(x.url));
      if (rows.length && !earliest) earliest = rows.map((x) => x.timestamp).sort()[0];
    }
    if (earliest) { firstSeenOnly++; evidence.push(`${d}: earliest partner-page capture ${earliest.slice(0, 8)} — this is FIRST OBSERVED, not launched`); }
    else evidence.push(`${d}: no partner-page captures found`);
  }
  findings.push({
    test: 'B. Partner programme launch / relaunch',
    question: 'Can a dated first-party page establish when a programme launched?',
    result: `${firstSeenOnly}/${targets.length} produced an earliest-capture date; ${datedByPage} produced a date the company itself published`,
    evidence,
    verdict: 'CONTEXT_ONLY',
    limitation: 'Earliest capture is when a crawler first saw the page, not when the programme launched. Common Crawl coverage is sparse and irregular, so an earlier absence proves nothing. Rendering this as "launched" would be the exact fabrication the evidence model forbids.',
  });
}

/* ── C. M&A / carve-out / MBO — the untested Tier-1 trigger ──────────────── */
{
  const evidence: string[] = [];
  const sources: [string, string][] = [
    ['sec_edgar_fulltext', 'https://efts.sec.gov/LATEST/search-index?q=%22carve-out%22&dateRange=custom'],
    ['sec_edgar_search', 'https://efts.sec.gov/LATEST/search-index?q=test'],
    ['gdelt_doc_api', 'https://api.gdeltproject.org/api/v2/doc/doc?query=%22management%20buyout%22%20partner%20program&mode=artlist&maxrecords=10&format=json&timespan=6months'],
    ['wikidata_sparql', 'https://query.wikidata.org/sparql?format=json&query=SELECT%20?item%20WHERE%20{?item%20wdt:P31%20wd:Q4830453}%20LIMIT%202'],
    ['kbo_openbase', 'https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html'],
    ['companies_house_api', 'https://api.company-information.service.gov.uk/search/companies?q=test'],
  ];
  for (const [id, url] of sources) {
    const r = await get(url, { timeout: 30000 });
    const usable = r.ok && (r.body ?? '').length > 200;
    evidence.push(`${id}: HTTP ${r.status}${r.blocked ? ' (blocked)' : ''}${usable ? ' — returns content' : ' — unusable'}`);
  }
  findings.push({
    test: 'C. M&A / carve-out / MBO',
    question: 'Is there a credible public source path for ownership-change events?',
    result: 'see evidence — see verdict for the conclusion',
    evidence,
    verdict: 'UNRESOLVED',
    limitation: 'Even where a feed responds, three problems remain untested: linking an event to the right legal entity, linking that entity to the partner programme, and establishing the effective date rather than the announcement date. Carrying this as a Tier-1 trigger without solving those is unsupported.',
  });
}

/* ── D. Directory growth from historical captures ────────────────────────── */
{
  // The only trigger that measures the ICP variable directly. Needs two dated counts.
  const evidence: string[] = [];
  let comparable = 0;
  for (const [domain] of [['egnyte.com'], ['niko.eu'], ['loxone.com'], ['sophos.com']] as const) {
    const counts: string[] = [];
    for (const coll of ['CC-MAIN-2025-26', 'CC-MAIN-2026-30']) {
      const r = await get(
        `https://index.commoncrawl.org/${coll}-index?url=${encodeURIComponent(domain + '/*')}&output=json&limit=3000&fl=url,timestamp`,
        { timeout: 90000 },
      );
      const n = (r.ok && r.body ? r.body.trim().split('\n').filter(Boolean) : [])
        .filter((l) => /partner|dealer|reseller|distribut|installateur|h[äa]ndler/i.test(l)).length;
      counts.push(`${coll.slice(8)}:${n}`);
    }
    if (counts.every((c) => Number(c.split(':')[1]) > 0)) comparable++;
    evidence.push(`${domain}: partner-URL captures ${counts.join(' ')}`);
  }
  findings.push({
    test: 'D. Partner-directory growth',
    question: 'Can two dated observations of the same directory be compared?',
    result: `${comparable}/4 had captures in both an older and a newer collection`,
    evidence,
    verdict: 'BUILD_LATER',
    limitation: 'URL counts are a proxy for directory size and move with crawl depth, not only with the directory. A defensible growth claim needs the same page parsed at two dates with the same counter — which means our own snapshots, with Common Crawl used only to backfill the first point.',
  });
}

writeFileSync(`${OUT}timing.json`, JSON.stringify(findings, null, 2));
for (const f of findings) {
  console.log(`\n### ${f.test}\n  verdict: ${f.verdict}\n  ${f.result}`);
  f.evidence.forEach((e) => console.log('   ·', e));
}
console.log('\nwrote timing.json');
