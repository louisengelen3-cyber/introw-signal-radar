/**
 * Phase 3 temporal baseline.
 *
 * Runs from the baseline forward regardless of what the positive-fit research concludes,
 * because every timing verdict in Phase 2 failed for want of a second dated observation.
 * The watchlist is the union of the frozen benchmarks — companies whose evidence we
 * already understand, so a future delta is interpretable rather than merely novel.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { get, mainContent } from '../src/lib/http.js';
import { rankPartnerUrls, siteUrls, surveyDns } from '../src/evidence/collect.js';
import {
  detectChange, loadSnapshots, previousSnapshot, recordSnapshot, writeBaselineIfAbsent,
  type ChangeObservation,
} from '../src/temporal/snapshot.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const baseline = writeBaselineIfAbsent();
console.error(`temporal baseline: ${baseline.startedAt}`);

/* watchlist: everything in the frozen suitability benchmark */
const bench = JSON.parse(readFileSync(new URL('../phase2/benchmark/suitability.v1.json', import.meta.url), 'utf8')) as Record<string, { name: string; domain: string }[]>;
const watch = [...new Set(
  ['cohortA_customers', 'cohortB_plausible', 'cohortC_hypothesised_poor_fit']
    .flatMap((k) => bench[k].map((c) => c.domain)),
)];
console.error(`watchlist: ${watch.length} companies`);

const changes: ChangeObservation[] = [];
let recorded = 0;

async function snapshotCompany(domain: string): Promise<void> {
  const bare = domain.replace(/^www\./, '');

  /* DNS: the cleanest platform-migration signal, and the cheapest to repeat. */
  const dns = await surveyDns(bare);
  for (const h of dns.hosts.filter((x) => x.distinct && !x.nonProd)) {
    const evidence = [...h.cname, ...h.a].sort().join(' ');
    const prev = previousSnapshot(loadSnapshots(), bare, `dns:${h.host}`, 'dns_partner_host');
    const snap = recordSnapshot({
      companyId: bare, sourceUrl: `dns:${h.host}`, observationType: 'dns_partner_host',
      rawEvidence: evidence, evidenceState: 'confirmed', sourceHealth: 'ok',
    });
    changes.push(detectChange(prev, snap));
    recorded++;
  }
  if (dns.platform) {
    const prev = previousSnapshot(loadSnapshots(), bare, `dns:${dns.platform.host}`, 'prm_fingerprint');
    const snap = recordSnapshot({
      companyId: bare, sourceUrl: `dns:${dns.platform.host}`, observationType: 'prm_fingerprint',
      rawEvidence: `${dns.platform.vendor} ${dns.platform.cname.join(' ')}`,
      evidenceState: 'confirmed', sourceHealth: 'ok',
    });
    changes.push(detectChange(prev, snap));
    recorded++;
  }

  /* Partner surface content. */
  let home = await get(`https://www.${bare}/`);
  if (!home.ok || !home.body) home = await get(`https://${bare}/`);
  if (!home.ok || !home.body) {
    const prev = previousSnapshot(loadSnapshots(), bare, `https://${bare}/`, 'partner_surface_content');
    const snap = recordSnapshot({
      companyId: bare, sourceUrl: `https://${bare}/`, observationType: 'partner_surface_content',
      rawEvidence: '', evidenceState: 'blocked',
      sourceHealth: home.blocked ? 'blocked' : 'error',
    });
    changes.push(detectChange(prev, snap));
    recorded++;
    return;
  }

  const origin = new URL(home.finalUrl ?? `https://${bare}/`).origin;
  const inventory = await siteUrls(origin, home.body, home.finalUrl ?? origin);
  const ranked = rankPartnerUrls(inventory, 3);

  const invPrev = previousSnapshot(loadSnapshots(), bare, origin, 'partner_url_inventory');
  const invSnap = recordSnapshot({
    companyId: bare, sourceUrl: origin, observationType: 'partner_url_inventory',
    rawEvidence: ranked.sort().join('\n'),
    evidenceState: ranked.length ? 'confirmed' : 'unknown', sourceHealth: 'ok',
  });
  changes.push(detectChange(invPrev, invSnap));
  recorded++;

  for (const u of ranked) {
    const r = await get(u);
    const prev = previousSnapshot(loadSnapshots(), bare, u, 'partner_surface_content');
    const snap = recordSnapshot({
      companyId: bare, sourceUrl: u, observationType: 'partner_surface_content',
      rawEvidence: r.ok && r.body ? mainContent(r.body) : '',
      evidenceState: r.ok && r.body ? 'confirmed' : 'blocked',
      sourceHealth: r.ok && r.body ? 'ok' : (r.blocked ? 'blocked' : 'error'),
    });
    changes.push(detectChange(prev, snap));
    recorded++;
  }
}

let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < watch.length) {
    const d = watch[i++];
    try { await snapshotCompany(d); } catch (e) { console.error(`[err] ${d}: ${(e as Error).message}`); }
    if (i % 10 === 0) console.error(`  ${i}/${watch.length} companies · ${recorded} snapshots`);
  }
}));

const byKind: Record<string, number> = {};
for (const c of changes) byKind[c.kind] = (byKind[c.kind] ?? 0) + 1;
const semantic = changes.filter((c) => c.kind === 'semantic_change');

writeFileSync(`${OUT}snapshot-run.json`, JSON.stringify({
  baselineStartedAt: baseline.startedAt,
  runAt: new Date().toISOString(),
  companies: watch.length,
  snapshotsRecorded: recorded,
  byKind,
  semanticChanges: semantic,
}, null, 2));

console.error(`\nrecorded ${recorded} snapshots across ${watch.length} companies`);
console.error(`change kinds: ${Object.entries(byKind).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
if (semantic.length) semantic.forEach((s) => console.error(`  SEMANTIC ${s.companyId} ${s.sourceUrl}: ${s.semanticDelta}`));
console.error('DONE');
