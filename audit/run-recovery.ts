/**
 * Source-recovery measurement.
 *
 * Runs the SAME detectors the production dossier uses — programme detection, surface
 * detection, directory detection, the attribution guard — but over surfaces found by the new
 * multi-domain + sitemap recovery layer instead of the production URL inventory.
 *
 * Production code paths are untouched. This measures whether better SOURCES change what the
 * EXISTING detectors can see, which is the question §41 asks first.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolveDomains, selectForResearch } from '../src/recovery/domains.js';
import { findPartnerSurfaces, isSoft404 } from '../src/recovery/surfaces.js';
import { discoverHosts } from '../src/evidence/collect.js';
import { get, mainContent, stripTags } from '../src/lib/http.js';
import { detectProgrammes } from '../src/dossier/programmes.js';
import { scanSurfaces } from '../src/dossier/surfaces.js';
import { detectDirectory } from '../src/dossier/directory.js';
import { isContentPath, isReadableQuote } from '../src/dossier/attribution.js';
import { scanTrade } from '../src/recovery/trade.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const set = JSON.parse(readFileSync(new URL('./cross-industry.v1.json', import.meta.url).pathname, 'utf8'));
const targets: { domain: string; cohort: string; country: string }[] = [];
for (const [cohort, list] of Object.entries(set.cohorts) as [string, any[]][]) for (const c of list) targets.push({ cohort, ...c });

const only = process.argv.slice(2);
const work = only.length ? targets.filter((t) => only.includes(t.domain)) : targets;

const rows: any[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < work.length) {
    const t = work[i++];
    try {
      const { hosts } = await discoverHosts(t.domain).catch(() => ({ hosts: [] as string[] }));
      const res = await resolveDomains(t.domain, { probeBudget: 5, knownHosts: hosts });
      const domains = [t.domain, ...selectForResearch(res, 2).map((r) => r.domain)];
      const found = await findPartnerSurfaces({ domains, limit: 10 });

      // Fetch what was found and run the production detectors over it.
      const pages: { url: string; text: string; html: string }[] = [];
      let soft = 0;
      for (const s of found.surfaces) {
        const r = await get(s.url, { timeout: 20000 });
        if (!r.ok || !r.body) continue;
        const text = stripTags(mainContent(r.body));
        const title = r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '';
        if (isSoft404(text, title)) { soft++; continue; }
        if (text.length < 200) continue;
        pages.push({ url: s.url, text, html: r.body });
      }
      const attributable = pages.filter((p) => !isContentPath(p.url));
      const programmes = [...new Set(detectProgrammes(attributable).filter((h) => isReadableQuote(h.quote)).map((h) => h.kind))];
      const scan = scanSurfaces(attributable);
      const confirmed = [...new Set(scan.hits.filter((h) => isReadableQuote(h.quote)).map((h) => h.surface))];
      const directory = detectDirectory(attributable, t.domain);
      // Phase D: trade vocabulary. Runs only after source recovery has put the right page in
      // hand — the order §41 prescribes.
      const trade = scanTrade(attributable);

      rows.push({
        ...t,
        relatedDomains: res.related.length,
        domainsSearched: domains,
        surfacesFound: found.surfaces.length,
        surfaceOrigins: found.surfaces.reduce((a: any, s) => { a[s.origin] = (a[s.origin] ?? 0) + 1; return a; }, {}),
        pagesRead: pages.length,
        softNotFound: soft + found.softNotFound,
        programmes, confirmedSurfaces: confirmed,
        tradeMotions: trade.motions.map((m) => m.kind),
        tradeSurfaces: trade.surfaces.map((s) => s.kind),
        directoryType: trade.directoryType,
        motion: programmes.length > 0 || confirmed.length > 0 || trade.motions.length > 0 || trade.surfaces.length > 0,
        motionFromTradeOnly: programmes.length === 0 && confirmed.length === 0 && (trade.motions.length > 0 || trade.surfaces.length > 0),
        directory: directory.isDirectory ? directory.lowerBound : null,
        sampleUrls: found.surfaces.slice(0, 3).map((s) => s.url),
      });
      writeFileSync(`${OUT}recovery-full.json`, JSON.stringify(rows, null, 2));
      const r = rows.at(-1)!;
      console.error(`[${rows.length}/${work.length}] ${t.cohort.slice(0, 15).padEnd(16)} ${t.domain.padEnd(24)} dom=${domains.length} surf=${String(r.surfacesFound).padEnd(2)} read=${String(r.pagesRead).padEnd(2)} motion=${r.motion ? 'YES' : 'no '} progs=${programmes.length} trade=${trade.motions.length}/${trade.surfaces.length} dir=${trade.directoryType ?? '-'}`);
    } catch (e) { console.error(`[err] ${t.domain}: ${(e as Error).message}`); }
  }
}));
console.error('DONE');
