/**
 * One company, one assessment.
 *
 * This is the funnel the Phase 2 mandate specifies, up to (not including) commercial
 * review. Each stage keeps its own evidence and its own uncertainty; nothing is collapsed
 * into a score, and no stage is allowed to answer another stage's question.
 *
 *   inventory → DNS/platform → channel classification → operator resolution
 *             → programme structure → Introw suitability
 */

import { get, mainContent } from '../lib/http.js';
import {
  commonCrawlUrls, discoverHosts, extractPartnerCount, probePartnerPaths,
  rankOperatingModelUrls, rankPartnerUrls, siteUrls, surveyDns,
} from '../evidence/collect.js';
import { assessScale, classify, type ClassifyResult, type ScaleAssessment } from '../evidence/classify.js';
import { resolveOperator, type OperatorResolution } from './operator.js';
import { assessSuitability, type SuitabilityResult } from '../suitability/assess.js';
import { findSightings, type DistributionIndex } from '../suitability/distribution.js';
import { assessPositive, promote, type PositiveAssessment, type Promotion } from '../suitability/positive.js';
import type { PartnerCount, SourceRef } from '../domain/types.js';

const CC_COLLECTIONS = ['CC-MAIN-2026-30', 'CC-MAIN-2026-12'];
const LOCALE_SEG = /^\/[a-z]{2}([-_][a-z]{2})?(\/[a-z]{2})?\/?$/i;

export interface Assessment {
  domain: string;
  retrievedAt: string;
  reachable: boolean;
  /** `blocked` is distinct from `unknown`: we tried and were refused. */
  blockReason?: 'bot_protection' | 'fetch_failed' | 'domain_unresolved';
  inventory: { site: number; commonCrawl: number; dnsHosts: number; probed: number; probeHits: number; softNotFound: number; sources: string[] };
  dns: { wildcard: boolean; platform: { vendor: string; host: string; cname: string[] } | null; distinctHosts: number; lookupFailures: number };
  pagesFetched: { url: string; status: number; chars: number }[];
  classification: ClassifyResult | null;
  operator: OperatorResolution | null;
  scale: ScaleAssessment | null;
  suitability: SuitabilityResult | null;
  /** Phase 3: the three positive constructs, measured separately and never summed. */
  positive: PositiveAssessment | null;
  promotion: Promotion | null;
  partnerCount: PartnerCount;
}

export interface AssessOptions {
  /** Counterparty distribution index; when absent, distribution evidence is simply unknown. */
  distributionIndex?: DistributionIndex;
  /** Company name as published, used for distributor lookup. */
  name?: string;
  /** Skip Common Crawl when running large sweeps where it is not needed. */
  useCommonCrawl?: boolean;
  /** Skip targeted path probing (the expensive part) when inventory is already rich. */
  usePathProbing?: boolean;
  pageBudget?: number;
}

export async function assessCompany(domain: string, opts: AssessOptions = {}): Promise<Assessment> {
  const { useCommonCrawl = true, usePathProbing = true, pageBudget = 7, distributionIndex, name } = opts;
  const bare = domain.replace(/^www\./, '');
  const now = new Date().toISOString();

  const a: Assessment = {
    domain: bare, retrievedAt: now, reachable: false,
    inventory: { site: 0, commonCrawl: 0, dnsHosts: 0, probed: 0, probeHits: 0, softNotFound: 0, sources: [] },
    dns: { wildcard: false, platform: null, distinctHosts: 0, lookupFailures: 0 },
    pagesFetched: [], classification: null, operator: null, scale: null, suitability: null, positive: null, promotion: null,
    partnerCount: { value: null, countType: 'unknown', enumerationComplete: null, unit: null, source: null, observedAt: null, confidence: 'low' },
  };

  /* ── DNS + certificate transparency ────────────────────────────────────── */
  const { hosts, sources } = await discoverHosts(bare);
  const dns = await surveyDns(
    bare,
    hosts.filter((h) => /(partner|dealer|installer|reseller|channel|portal|deal|ecosystem|distrib)/i.test(h)).slice(0, 20),
  );
  a.dns = { wildcard: dns.wildcard, platform: dns.platform, distinctHosts: dns.hosts.filter((h) => h.distinct && !h.nonProd).length, lookupFailures: dns.lookupFailures };
  a.inventory.dnsHosts = hosts.length;
  a.inventory.sources.push(...sources);

  /* ── the site itself ───────────────────────────────────────────────────── */
  let home = await get(`https://www.${bare}/`);
  if (!home.ok || !home.body) home = await get(`https://${bare}/`);
  let siteInventory: string[] = [];
  let identityText = '';
  let origin = `https://${bare}`;

  if (home.ok && home.body) {
    a.reachable = true;
    a.inventory.sources.push('site');
    origin = new URL(home.finalUrl ?? origin).origin;
    siteInventory = await siteUrls(origin, home.body, home.finalUrl ?? origin);
    identityText = mainContent(home.body).slice(0, 6000);
    for (const p of ['/about', '/about-us', '/company', '/who-we-are', '/over-ons', '/ueber-uns']) {
      const r = await get(origin + p);
      if (r.ok && r.body) { identityText += ' ' + mainContent(r.body).slice(0, 4000); break; }
    }
  } else {
    a.blockReason = home.blocked ? 'bot_protection' : (dns.hosts.length ? 'fetch_failed' : 'domain_unresolved');
  }
  a.inventory.site = siteInventory.length;

  /* ── Common Crawl: an inventory that does not touch the target ─────────── */
  let ccUrls: string[] = [];
  if (useCommonCrawl) {
    const cc = await commonCrawlUrls(bare, CC_COLLECTIONS);
    ccUrls = cc.urls;
    a.inventory.commonCrawl = ccUrls.length;
    if (ccUrls.length) a.inventory.sources.push('common_crawl');
  }

  let urlInventory = [...new Set([
    ...siteInventory,
    ...ccUrls,
    ...dns.hosts.filter((h) => h.distinct && !h.nonProd).map((h) => `https://${h.host}/`),
  ])];

  /* ── targeted locale-aware probing, only when crawling found nothing ───── */
  // Bounded and last-resort: large catalogue sites publish thousands of URLs whose
  // homepage is a country selector and whose sitemap is all products.
  if (usePathProbing && a.reachable && rankPartnerUrls(urlInventory).length === 0) {
    const localeRoots: string[] = [];
    for (const m of (home.body ?? '').matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)) {
      try {
        const u = new URL(m[1], home.finalUrl ?? origin);
        if (LOCALE_SEG.test(u.pathname)) localeRoots.push(u.origin + u.pathname);
      } catch { /* skip */ }
    }
    const probe = await probePartnerPaths(origin, [...new Set(localeRoots)], 30, identityText.slice(0, 6000));
    a.inventory.probed = probe.probed;
    a.inventory.probeHits = probe.found.length;
    a.inventory.softNotFound = probe.softNotFound;
    if (probe.found.length) {
      a.inventory.sources.push('path_probe');
      urlInventory = [...new Set([...urlInventory, ...probe.found])];
    }
  }

  /* ── fetch the highest-ranked partner surfaces ─────────────────────────── */
  const ranked = rankPartnerUrls(urlInventory, pageBudget);
  const pages: { url: string; text: string; retrievedAt: string; httpStatus: number }[] = [];
  let bestCount: { rank: number; html: string; source: SourceRef } | null = null;

  for (const u of ranked) {
    const r = await get(u);
    a.pagesFetched.push({ url: u, status: r.status, chars: r.body?.length ?? 0 });
    if (!r.ok || !r.body) continue;
    pages.push({ url: u, text: mainContent(r.body), retrievedAt: r.retrievedAt, httpStatus: r.status });
    const isDirectory = /(find-a-|directory|locator|where-to-buy|verkooppunten|h[äa]ndlersuche|partners?\/?$|dealers?\/?$|installateur)/i.test(u);
    const rank = (isDirectory ? 1_000_000 : 0) + r.body.length;
    if (!bestCount || rank > bestCount.rank) {
      bestCount = {
        rank, html: r.body,
        source: { url: u, authority: 'subject_first_party', establishes: 'the company publishes this list of partner organisations', observedAt: r.retrievedAt, retrievedAt: r.retrievedAt, httpStatus: r.status },
      };
    }
  }
  if (home.ok && home.body) {
    pages.push({ url: home.finalUrl ?? origin, text: mainContent(home.body), retrievedAt: home.retrievedAt, httpStatus: home.status });
  }
  if (bestCount) a.partnerCount = extractPartnerCount(bestCount.html, bestCount.source);

  /* ── a second selection, aimed at the operating model ──────────────────── */
  // Channel ranking answers "does a channel exist". Suitability asks "how does it run",
  // and those live on different pages: distributor terms, programme benefits, tiers.
  const modelUrls = rankOperatingModelUrls(urlInventory, 4).filter((u) => !ranked.includes(u));
  for (const u of modelUrls) {
    const r = await get(u);
    a.pagesFetched.push({ url: u, status: r.status, chars: r.body?.length ?? 0 });
    if (!r.ok || !r.body) continue;
    pages.push({ url: u, text: mainContent(r.body), retrievedAt: r.retrievedAt, httpStatus: r.status });
  }

  /* ── the three separate questions ──────────────────────────────────────── */
  a.classification = classify({ companyId: bare, pages, urlInventory, identityText, prmFingerprint: dns.platform });

  const allText = pages.map((p) => p.text).join(' ').slice(0, 60000);
  a.scale = assessScale(
    a.partnerCount.value,
    ['exact_public', 'directory_count'].includes(a.partnerCount.countType),
    urlInventory.length,
    allText,
  );
  a.operator = resolveOperator({ domain: bare, pages, urlInventory, identityText, platform: dns.platform });
  const sightings = distributionIndex ? findSightings(distributionIndex, name ?? bare, bare) : [];
  a.suitability = assessSuitability({
    domain: bare,
    pages,
    urlInventory,
    classification: a.classification,
    operator: a.operator,
    scale: a.scale,
    platform: dns.platform,
    reachable: a.reachable,
    distributorSightings: sightings,
  });

  /* ── Phase 3: positive constructs ──────────────────────────────────────── */
  // Measured on the same pages, but with probes written for ordinary business English
  // rather than formal channel vocabulary — the Phase 2 lexicon missed customers whose
  // partner motion is real and plainly described.
  a.positive = assessPositive({
    pages,
    direction: a.operator?.direction ?? 'unknown',
    distributorCount: new Set(sightings.map((d) => d.distributor)).size,
    reachable: a.reachable,
  });
  // Contradictions come from the Phase 2 layer, so promotion can never override a
  // positively-evidenced structural problem.
  const contradictions = (a.suitability?.blockers ?? [])
    .concat(a.classification?.suppression ? [a.classification.suppression.reason] : [])
    .concat(['integration_only', 'affiliate_only'].includes(a.classification?.commerciality ?? '')
      ? [`channel classified ${a.classification!.commerciality}`] : []);
  a.promotion = promote(a.positive, contradictions);
  return a;
}
