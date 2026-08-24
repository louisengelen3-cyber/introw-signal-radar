/**
 * Additive recovery (mandate §14, §15, §17, §18).
 *
 * The invariant this file exists to enforce:
 *
 *     BASE RESEARCH + RECOVERY SOURCES = MERGED EVIDENCE SET
 *     never
 *     RECOVERY REPLACES BASE RESEARCH
 *
 * This is not a style preference. Measured on 106 companies, recovery run ALONE regressed 12
 * accounts that base research identifies, because sitemap-first surface discovery and the
 * base pipeline's path probing reach different pages. Union regressed none. Recovery is a
 * complementary source, and the type system here refuses to let it become a replacement:
 * `mergeRecovery` only ever adds to what base found.
 */
import type { SourceAuthority } from '../domain/types.js';
import { findPartnerSurfaces, isSoft404 } from './surfaces.js';
import { get, mainContent, stripTags } from '../lib/http.js';
import { isContentPath } from '../dossier/attribution.js';
import { resolveDomains, selectForResearch } from './domains.js';
import { scanTrade } from './trade.js';

/**
 * Source precedence (§15). Lower rank wins when two sources disagree about the same claim.
 * Recovery sources enter at their own authority level and never outrank a first-party base
 * observation simply for being newer.
 */
export const SOURCE_PRECEDENCE: Record<SourceAuthority, number> = {
  subject_first_party: 1,
  counterparty: 5,
  vendor_hosted: 3,
  reputable_third_party: 6,
  aggregator: 7,
  discovery_only: 8,
};

/** Finer precedence within first-party sources, for the recovery layer specifically. */
export type RecoveryOrigin =
  | 'canonical_domain'      // 1 — the company's main site (base research already reads this)
  | 'regional_domain'       // 2 — vaillant.de for vaillant.com
  | 'programme_subdomain'   // 3 — partners.example.com
  | 'company_locator'       // 4 — the company's own dealer/installer finder
  | 'company_documentation' // 5
  | 'counterparty_source'   // 6 — a distributor naming the company
  | 'directory_aggregator'  // 7
  | 'search_snippet';       // 8 — weakest; never carries a claim alone

export const ORIGIN_PRECEDENCE: Record<RecoveryOrigin, number> = {
  canonical_domain: 1, regional_domain: 2, programme_subdomain: 3, company_locator: 4,
  company_documentation: 5, counterparty_source: 6, directory_aggregator: 7, search_snippet: 8,
};

/**
 * Evidence sufficiency (§18). Describes how COMPLETE the evidence is, never how good the
 * prospect is. A sparse dossier and a rich dossier may both be excellent prospects; this
 * state says only whether a human has enough to look at.
 */
export type SufficiencyState = 'sufficient_for_review' | 'partial' | 'under_observed' | 'blocked';

export interface RecoveryContribution {
  attempted: boolean;
  /** Domains recovery searched beyond the canonical one. */
  domainsSearched: string[];
  surfacesFound: number;
  pagesRead: number;
  softNotFound: number;
  /** Motions and surfaces found ONLY by recovery — the additive contribution. */
  addedMotions: string[];
  addedSurfaces: string[];
  addedDirectoryType: string | null;
  /** URLs recovery contributed, for provenance in the dossier (§11). */
  sourceUrls: { url: string; origin: RecoveryOrigin }[];
  /** True when recovery found nothing base did not already have. */
  redundant: boolean;
  stoppedBecause: 'sufficient' | 'budget_exhausted' | 'nothing_found' | 'blocked';
}

export interface BaseEvidence {
  programmes: string[];
  confirmedSurfaces: string[];
  directoryType: string | null;
  pagesRead: number;
}

/**
 * Classify a recovered URL's origin so precedence can be applied without guessing later.
 */
export function originOf(url: string, canonical: string): RecoveryOrigin {
  let host = '';
  try { host = new URL(url).hostname.replace(/^www\./, '').toLowerCase(); } catch { return 'search_snippet'; }
  const base = canonical.replace(/^www\./, '').toLowerCase();
  const path = (() => { try { return new URL(url).pathname.toLowerCase(); } catch { return ''; } })();
  const isLocator = /(finder|locator|suche|zoeken|trouver|find-a|where-to-buy|haendler|dealer-search)/.test(path);
  if (host === base) return isLocator ? 'company_locator' : 'canonical_domain';
  // A channel-named subdomain is a programme surface wherever it is registered.
  // partner.example.com is programme infrastructure whether the canonical is example.com or
  // example.de — treating it as a mere regional copy understates its precedence.
  const label = host.split('.')[0];
  const CHANNEL_LABEL = /^(partner|partners|pro|dealer|dealers|reseller|resellers|installer|installers|channel|portal)$/;
  const brand = base.split('.')[0];
  const sameBrand = host.endsWith(`.${base}`) || label === brand || host.includes(`${brand}.`);
  if (sameBrand && CHANNEL_LABEL.test(label)) return 'programme_subdomain';
  if (host.endsWith(`.${base}`)) return 'programme_subdomain';
  // A different registrable domain sharing the brand token, e.g. example.de for example.com
  if (sameBrand) return isLocator ? 'company_locator' : 'regional_domain';
  return 'counterparty_source';
}

/**
 * Decide sufficiency from what base research found (§18). Deliberately rule-based and
 * non-numeric: a threshold on a score would reintroduce ranking by the back door.
 */
export function sufficiency(base: BaseEvidence, blocked = false): SufficiencyState {
  if (blocked) return 'blocked';
  const hasMotion = base.programmes.length > 0 || base.confirmedSurfaces.length > 0;
  const hasOperational = base.confirmedSurfaces.length >= 2 || base.directoryType != null;
  if (hasMotion && hasOperational) return 'sufficient_for_review';
  if (hasMotion) return 'partial';
  return 'under_observed';
}

/** Recovery is worth attempting only where base research left something to find (§17). */
export function shouldAttemptRecovery(base: BaseEvidence, blocked = false): boolean {
  const s = sufficiency(base, blocked);
  return s === 'partial' || s === 'under_observed';
}

export interface RecoveryOptions {
  /** Maximum related domains to search. Bounded so one company cannot cost 40 crawls. */
  domainBudget?: number;
  /** Maximum partner surfaces to read across all domains. */
  surfaceBudget?: number;
}

/**
 * Run the recovery layer for one company and report ONLY what it adds beyond base evidence.
 *
 * The function cannot remove or downgrade a base finding: `addedMotions` and `addedSurfaces`
 * are computed by set difference against what base already had, so a recovery run that finds
 * less than base simply contributes nothing. That is the §14 invariant expressed in code.
 */
export async function mergeRecovery(
  domain: string,
  base: BaseEvidence,
  opts: RecoveryOptions = {},
): Promise<RecoveryContribution> {
  const domainBudget = opts.domainBudget ?? 3;
  const surfaceBudget = opts.surfaceBudget ?? 10;
  const empty = (stoppedBecause: RecoveryContribution['stoppedBecause']): RecoveryContribution => ({
    attempted: true, domainsSearched: [], surfacesFound: 0, pagesRead: 0, softNotFound: 0,
    addedMotions: [], addedSurfaces: [], addedDirectoryType: null, sourceUrls: [],
    redundant: true, stoppedBecause,
  });

  // §17 step 1–2: which domains carry the programme.
  const resolution = await resolveDomains(domain);
  const related = selectForResearch(resolution, domainBudget);
  const domains = [domain, ...related.map((d) => d.domain)];

  // §17 step 3–5: sitemap → navigation → probe, soft-404 filtered inside.
  const found = await findPartnerSurfaces({ domains, limit: surfaceBudget, probeFallback: true });
  if (found.surfaces.length === 0) return { ...empty('nothing_found'), domainsSearched: domains, softNotFound: found.softNotFound };

  /**
   * Fetch what surface discovery located. Mirrors the validated path exactly: main content
   * only, soft-404 rejected before any scanning, thin pages skipped, and content paths
   * (blogs, news, press) excluded so a company writing ABOUT partners is never read as a
   * company recruiting them.
   */
  const pages: { url: string; text: string }[] = [];
  let soft = found.softNotFound;
  for (const s of found.surfaces) {
    const r = await get(s.url, { timeout: 20000 });
    if (!r.ok || !r.body) continue;
    const text = stripTags(mainContent(r.body));
    const title = r.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '';
    if (isSoft404(text, title)) { soft++; continue; }
    if (text.length < 200) continue;
    if (isContentPath(s.url)) continue;
    pages.push({ url: s.url, text });
  }
  if (pages.length === 0) return { ...empty('nothing_found'), domainsSearched: domains, surfacesFound: found.surfaces.length, softNotFound: soft };
  const trade = scanTrade(pages);

  // The additive computation. Set difference against base — never a replacement.
  const baseMotions = new Set(base.programmes);
  const baseSurfaces = new Set(base.confirmedSurfaces);
  const addedMotions = trade.motions.map((m) => m.kind).filter((k) => !baseMotions.has(k));
  const addedSurfaces = trade.surfaces.map((s) => s.kind).filter((k) => !baseSurfaces.has(k));
  const addedDirectoryType = base.directoryType == null ? trade.directoryType : null;

  const sourceUrls = pages.map((p) => ({ url: p.url, origin: originOf(p.url, domain) }))
    .sort((a, b) => ORIGIN_PRECEDENCE[a.origin] - ORIGIN_PRECEDENCE[b.origin]);

  const redundant = addedMotions.length === 0 && addedSurfaces.length === 0 && addedDirectoryType == null;
  return {
    attempted: true,
    domainsSearched: domains,
    surfacesFound: found.surfaces.length,
    pagesRead: pages.length,
    softNotFound: soft,
    addedMotions, addedSurfaces, addedDirectoryType,
    sourceUrls,
    redundant,
    stoppedBecause: redundant ? 'nothing_found' : 'sufficient',
  };
}
