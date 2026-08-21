/**
 * Phase 1A — classification half.
 *
 * Given a domain, collect channel evidence from three complementary inventory
 * sources and emit a commerciality verdict with the evidence that produced it.
 * Runs against the frozen benchmark and against an unseen discovered sample; the
 * two are kept separate so benchmark tuning cannot flatter the unseen numbers.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { get, mainContent } from '../src/lib/http.js';
import {
  commonCrawlUrls, discoverHosts, extractPartnerCount, rankPartnerUrls, siteUrls, surveyDns,
} from '../src/evidence/collect.js';
import { assessScale, classify, type ClassifyResult, type ScaleAssessment } from '../src/evidence/classify.js';
import type { PartnerCount, SourceRef } from '../src/domain/types.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const CC_COLLECTIONS = ['CC-MAIN-2026-30', 'CC-MAIN-2026-12'];
const USE_CC = process.env.SKIP_CC !== '1';

export interface ClassifiedCompany {
  name: string;
  domain: string;
  set: string;
  label?: string;
  reachable: boolean;
  blockReason?: string;
  inventory: { site: number; dns: number; commonCrawl: number; sources: string[] };
  dns: { wildcard: boolean; platform: { vendor: string; host: string; cname: string[] } | null; distinctHosts: number };
  partnerPagesFetched: { url: string; status: number; chars: number }[];
  classification: ClassifyResult | null;
  scale: ScaleAssessment | null;
  partnerCount: PartnerCount;
  retrievedAt: string;
}

async function classifyCompany(name: string, domain: string, set: string, label?: string): Promise<ClassifiedCompany> {
  const bare = domain.replace(/^www\./, '');
  const now = new Date().toISOString();
  const rec: ClassifiedCompany = {
    name, domain: bare, set, label,
    reachable: false,
    inventory: { site: 0, dns: 0, commonCrawl: 0, sources: [] },
    dns: { wildcard: false, platform: null, distinctHosts: 0 },
    partnerPagesFetched: [],
    classification: null,
    scale: null,
    partnerCount: { value: null, countType: 'unknown', enumerationComplete: null, unit: null, source: null, observedAt: null, confidence: 'low' },
    retrievedAt: now,
  };

  // ── inventory source 1: DNS + certificate transparency ────────────────────
  const { hosts, sources } = await discoverHosts(bare);
  const dns = await surveyDns(bare, hosts.filter((h) => /(partner|dealer|installer|reseller|channel|portal|deal|ecosystem|distrib)/i.test(h)).slice(0, 20));
  rec.dns = { wildcard: dns.wildcard, platform: dns.platform, distinctHosts: dns.hosts.filter((h) => h.distinct && !h.nonProd).length };
  rec.inventory.dns = hosts.length;
  rec.inventory.sources.push(...sources);

  // ── inventory source 2: the site itself ───────────────────────────────────
  let home = await get(`https://www.${bare}/`);
  if (!home.ok || !home.body) home = await get(`https://${bare}/`);
  let siteInventory: string[] = [];
  let identityText = '';
  if (home.ok && home.body) {
    rec.reachable = true;
    rec.inventory.sources.push('site');
    const origin = new URL(home.finalUrl ?? `https://${bare}/`).origin;
    siteInventory = await siteUrls(origin, home.body, home.finalUrl ?? origin);
    identityText = mainContent(home.body).slice(0, 6000);
    // About pages carry the firm-type language that separates an alliance ecosystem
    // from an equity partnership. Homepage alone was not enough (Deloitte, Phase 0).
    for (const p of ['/about', '/about-us', '/company', '/who-we-are']) {
      const r = await get(origin + p);
      if (r.ok && r.body) { identityText += ' ' + mainContent(r.body).slice(0, 4000); break; }
    }
  } else {
    rec.blockReason = home.blocked ? 'bot_protection' : (dns.hosts.length ? 'fetch_failed' : 'domain_unresolved');
  }
  rec.inventory.site = siteInventory.length;

  // ── inventory source 3: Common Crawl (does not touch the target) ──────────
  let ccUrls: string[] = [];
  if (USE_CC) {
    const cc = await commonCrawlUrls(bare, CC_COLLECTIONS);
    ccUrls = cc.urls;
    rec.inventory.commonCrawl = ccUrls.length;
    if (ccUrls.length) rec.inventory.sources.push('common_crawl');
  }

  const urlInventory = [...new Set([
    ...siteInventory,
    ...ccUrls,
    ...dns.hosts.filter((h) => h.distinct && !h.nonProd).map((h) => `https://${h.host}/`),
  ])];

  // ── fetch the highest-ranked partner surfaces ─────────────────────────────
  const ranked = rankPartnerUrls(urlInventory).slice(0, 6);
  const pages: { url: string; text: string; retrievedAt: string; httpStatus: number }[] = [];
  let bestCountHtml: { rank: number; html: string; source: SourceRef } | null = null;
  for (const u of ranked) {
    const r = await get(u);
    rec.partnerPagesFetched.push({ url: u, status: r.status, chars: r.body?.length ?? 0 });
    if (!r.ok || !r.body) continue;
    const text = mainContent(r.body);
    pages.push({ url: u, text, retrievedAt: r.retrievedAt, httpStatus: r.status });
    // Try a count on every partner page, preferring directory-shaped URLs, then size.
    const isDirectory = /(find-a-|directory|locator|where-to-buy|verkooppunten|h[äa]ndlersuche|partners?\/?$|dealers?\/?$|installateur)/i.test(u);
    const rank = (isDirectory ? 1_000_000 : 0) + r.body.length;
    if (!bestCountHtml || rank > bestCountHtml.rank) {
      bestCountHtml = {
        rank,
        html: r.body,
        source: { url: u, authority: 'subject_first_party', establishes: 'the company publishes this list of partner organisations', observedAt: r.retrievedAt, retrievedAt: r.retrievedAt, httpStatus: r.status },
      };
    }
  }
  if (home.ok && home.body) pages.push({ url: home.finalUrl ?? `https://${bare}/`, text: mainContent(home.body), retrievedAt: home.retrievedAt, httpStatus: home.status });

  if (bestCountHtml) rec.partnerCount = extractPartnerCount(bestCountHtml.html, bestCountHtml.source);

  rec.scale = assessScale(
    rec.partnerCount.value,
    ['exact_public', 'directory_count'].includes(rec.partnerCount.countType),
    urlInventory.length,
    pages.map((p) => p.text).join(' ').slice(0, 40000),
  );
  rec.classification = classify({
    companyId: bare,
    pages,
    urlInventory,
    identityText,
    prmFingerprint: dns.platform,
  });
  return rec;
}

/* ────────────────────────────────────────────────────────────── runner ──── */

interface Target { name: string; domain: string; set: string; label?: string }

const targets: Target[] = [];
const which = process.argv[2] ?? 'all';

if (which === 'all' || which === 'benchmark') {
  const cohorts = JSON.parse(readFileSync(new URL('../phase0/benchmark/cohorts.v1.json', import.meta.url), 'utf8')) as Record<string, { name: string; domain: string; trap?: string }[]>;
  for (const [k, label] of [['cohortA', 'known_customer'], ['cohortB', 'likely_fit'], ['cohortC', 'trap']] as const) {
    for (const c of cohorts[k]) targets.push({ name: c.name, domain: c.domain, set: k, label: c.trap ?? label });
  }
}
if (which === 'all' || which === 'unseen') {
  const unseen = JSON.parse(readFileSync(new URL('./benchmark/unseen.v1.json', import.meta.url), 'utf8')) as { companies: Target[] };
  targets.push(...unseen.companies.map((c) => ({ ...c, set: 'unseen' })));
}

const seen = new Set<string>();
const work = targets.filter((t) => { const k = t.set + '|' + t.domain; if (seen.has(k)) return false; seen.add(k); return true; });

const results: ClassifiedCompany[] = [];
const OUTFILE = `${OUT}classify.${which}.json`;
let i = 0;
await Promise.all(Array.from({ length: 5 }, async () => {
  while (i < work.length) {
    const t = work[i++];
    try {
      const r = await classifyCompany(t.name, t.domain, t.set, t.label);
      results.push(r);
      writeFileSync(OUTFILE, JSON.stringify(results, null, 2));
      const c = r.classification;
      console.error(
        `[${results.length}/${work.length}] ${t.set.slice(-1)} ${t.domain.padEnd(24)} ` +
        `inv=${String(r.inventory.site + r.inventory.commonCrawl).padEnd(5)} ` +
        `prm=${(r.dns.platform?.vendor ?? '-').padEnd(10)} ` +
        `=> ${(c?.commerciality ?? 'error').padEnd(17)} [${c?.rule ?? ''}] cnt=${r.partnerCount.value ?? '-'}/${r.partnerCount.countType}`,
      );
    } catch (e) {
      console.error(`[err] ${t.domain}: ${(e as Error).message}`);
    }
  }
}));
writeFileSync(OUTFILE, JSON.stringify(results, null, 2));
console.error(`DONE wrote ${OUTFILE}`);
