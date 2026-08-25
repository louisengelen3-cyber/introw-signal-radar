/**
 * F1: correct the 74.2% headline.
 *
 * 34.4% of it is UNTESTED — research stopped before the question was asked, not retrieval
 * failure. Those cases were assigned to "ours to fix" on the assumption that a careers surface
 * probably existed. This tests the assumption directly: probe a much wider set of careers
 * locations than the crawler tried, and see whether one exists at all.
 *
 * BAD  = a careers surface exists publicly and the pipeline failed to reach it.
 * GOOD = no public careers surface exists, so hiring evidence was never obtainable.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { get, mainContent, stripTags } from '../src/lib/http.js';
import { isSoft404 } from '../src/recovery/surfaces.js';

const u = JSON.parse(readFileSync('audit/out/unknown-audit-detail.json', 'utf8'));
const CASES: string[] = u.crm.UNTESTED;

const PATHS = ['/careers', '/career', '/jobs', '/vacancies', '/vacatures', '/werken-bij',
  '/karriere', '/stellenangebote', '/jobs-und-karriere', '/emplois', '/carrieres', '/nous-rejoindre',
  '/lediga-jobb', '/karriar', '/jobb', '/lavora-con-noi', '/empleo', '/about/careers',
  '/company/careers', '/en/careers', '/nl/vacatures', '/de/karriere', '/over-ons/jobs',
  '/about-us/careers', '/join-us', '/work-with-us', '/team', '/uber-uns/karriere'];
const SUBS = ['careers', 'jobs', 'career', 'work', 'karriere', 'vacatures', 'jobb'];

const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < CASES.length) {
    const d = CASES[i++];
    const hits: { url: string; chars: number; jobLinks: number }[] = [];
    let requests = 0;
    const probe = async (url: string) => {
      if (hits.length >= 2 || requests >= 40) return;
      requests++;
      const r = await get(url, { timeout: 12000 });
      if (!r.ok || !r.body) return;
      const text = stripTags(mainContent(r.body));
      const title = r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '';
      if (isSoft404(text, title) || text.length < 150) return;
      const jobLinks = [...r.body.matchAll(/href=["']([^"']+)["']/gi)]
        .filter((m) => /\/(job|vacature|stelle|position|opening|emploi)[s]?[/=-]/i.test(m[1])).length;
      hits.push({ url, chars: text.length, jobLinks });
    };
    for (const p of PATHS) { if (hits.length) break; await probe(`https://www.${d}${p}`); }
    if (!hits.length) for (const p of PATHS.slice(0, 12)) { if (hits.length) break; await probe(`https://${d}${p}`); }
    if (!hits.length) for (const s of SUBS) { if (hits.length) break; await probe(`https://${s}.${d}/`); }

    const verdict = hits.length === 0 ? 'GOOD_no_public_careers_surface'
      : hits.some((h) => h.jobLinks > 0) ? 'BAD_careers_with_vacancies_missed'
      : 'BAD_careers_page_missed_no_vacancies';
    rows.push({ domain: d, verdict, hits, requests });
    console.error(`${d.padEnd(24)} ${verdict.padEnd(36)} ${hits.length ? hits[0].url + ' jobLinks=' + hits[0].jobLinks : '(none of ' + requests + ' probes)'}`);
  }
}));
rows.sort((a, b) => a.domain.localeCompare(b.domain));
writeFileSync('phase5/out/F1-untested16.json', JSON.stringify(rows, null, 2));
const g = rows.filter((r) => r.verdict.startsWith('GOOD')).length;
const b = rows.length - g;
console.error(`\nGOOD (no public careers surface) : ${g}/${rows.length}`);
console.error(`BAD  (we missed a real surface)  : ${b}/${rows.length}`);
