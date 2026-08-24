/**
 * Product-positioning evidence.
 *
 * WHAT THIS DETECTS
 *   What a company says it SELLS — its own product category, in its own words, from the
 *   surfaces where a company states that: the homepage hero, the meta/OG description, the
 *   product and platform pages, pricing, and comparison pages.
 *
 * WHY IT EXISTS
 *   The hardening sprint established that partner-page language cannot separate "operates a
 *   partner programme" from "sells partner-management software". Both write about deal
 *   registration, tiers and portals, in the same words, at the same density. The instrument
 *   kept promoting Introw's competitors because it only ever looked at partner surfaces,
 *   where the two are genuinely indistinguishable.
 *
 *   The distinction lives somewhere else entirely. Aircall's homepage says it sells a phone
 *   system. Impartner's says it sells partner management. That is a different question asked
 *   of a different page, which is why this is a separate collector rather than another
 *   pattern in the partner-page detector.
 *
 * WHAT IT PROVES
 *   What the company publishes about its own product category.
 *
 * WHAT IT DOES NOT PROVE
 *   What the company actually earns money from; whether the positioning is current; or
 *   anything at all about the partner programme, which is a different question.
 *
 * KNOWN FALSE POSITIVES
 *   Companies with a partner-management FEATURE inside a broader product (some CRMs, some
 *   marketplaces). Handled downstream by requiring the category to be the head noun of the
 *   self-description rather than a feature in a list.
 *
 * KNOWN FALSE NEGATIVES
 *   Bot-protected sites; homepages that are pure imagery; holding companies whose product
 *   lives on a different domain. All resolve to `unknown`, never to "not a vendor".
 *
 * DEPENDENCE ON PUBLICATION DENSITY
 *   Low by construction. This reads a bounded, fixed set of surfaces and cares about WHAT
 *   they say, not how many of them exist. A company with one page and a company with ten
 *   thousand both yield one self-description.
 */

import { get } from '../lib/http.js';
import { mainContent, stripTags } from './collect.js';

export type PositioningSourceType =
  | 'meta_description' | 'og_description' | 'title_tag'
  | 'homepage_hero' | 'product_page' | 'pricing_page' | 'comparison_page';

export type SourceHealth = 'success' | 'no_relevant_evidence' | 'blocked' | 'timeout' | 'parse_error' | 'not_found' | 'unknown';

export interface PositioningItem {
  sourceType: PositioningSourceType;
  url: string;
  /** Verbatim, trimmed. Interpretation happens elsewhere and never rewrites this. */
  text: string;
  retrievedAt: string;
}

export interface PositioningEvidence {
  items: PositioningItem[];
  /** Per-URL retrieval outcome. A technical failure must never read as commercial evidence. */
  health: { url: string; health: SourceHealth; status?: number }[];
  /** True only when at least one identity-bearing surface was actually read. */
  observed: boolean;
}

const PRODUCT_PATHS = ['/product', '/products', '/platform', '/pricing', '/what-we-do', '/solutions', '/overview'];
const COMPARISON_PATHS = ['/compare', '/alternatives', '/vs'];

function metaOf(html: string, prop: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:name|property)=["']${prop}["'][^>]*content=["']([^"']{10,400})["']`, 'i');
  const alt = new RegExp(`<meta[^>]+content=["']([^"']{10,400})["'][^>]*(?:name|property)=["']${prop}["']`, 'i');
  const m = html.match(re) ?? html.match(alt);
  return m ? decodeEntities(m[1]).trim() : null;
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&rsquo;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

/**
 * The hero is the first substantial line of body copy. Nav chrome is stripped first —
 * the "Browse Partner Directory" failure came from reading navigation as content, and the
 * hero is exactly where that mistake is easiest to make.
 */
function heroOf(html: string): string | null {
  const h1 = html.match(/<h1[^>]*>([\s\S]{5,300}?)<\/h1>/i);
  const fromH1 = h1 ? decodeEntities(stripTags(h1[1])).replace(/\s+/g, ' ').trim() : '';
  const body = stripTags(mainContent(html)).replace(/\s+/g, ' ').trim();
  const lead = body.slice(0, 400);
  const combined = [fromH1, lead].filter(Boolean).join(' — ');
  return combined.length >= 12 ? combined.slice(0, 500) : null;
}

/**
 * Bot challenges and soft-404s arrive as HTTP 200 with a real body, so status alone cannot
 * classify them. booking.com answers 200 with "we need to verify that you're not a robot",
 * and expediapartnercentral.com answers 200 with "Page not found" under the title "Partner
 * Central". Both were being recorded as `success`, which turns a retrieval failure into
 * commercial evidence — the precise inversion the mandate forbids.
 */
const BOT_CHALLENGE = /\b(verify (that )?you'?re not a robot|enable javascript and then reload|checking your browser|attention required|cf-browser-verification|please verify you are a human|access denied|request blocked|unusual traffic)\b/i;
const SOFT_NOT_FOUND = /\b(page not found|404 error|the page you (requested|are looking for) (could not be found|doesn'?t exist)|this page (doesn'?t|does not) exist)\b/i;

/**
 * A login or consent wall is a real page that says nothing about what the company sells.
 * expediapartnercentral.com's homepage is "Partner Central - Login", and reading it as
 * product positioning produced a confident category from a sign-in form.
 */
const AUTH_WORD = /^(sign ?in|log ?in|login|logon|authentication|sso|password|create an account|welcome back|account access)$/i;

export function isAuthWall(text: string): boolean {
  const t = text.trim();
  if (/\b(sign in|log ?in) to (your|the) (account|portal|partner)/i.test(t)) return true;
  // Titles are segmented by | — · –. "Partner Central - Login" is an auth wall; a product
  // page whose body merely contains the word "login" is not. Segment-level matching is what
  // separates the two, and it is why a prefix-anchored pattern missed this entirely.
  const head = t.split(/\s[—–-]\s|\s*[|·]\s*/).map((x) => x.trim()).filter(Boolean);
  if (head.some((seg) => AUTH_WORD.test(seg))) return true;
  return false;
}

/**
 * A language switcher is not a product description. expediapartnercentral.com's hero reads
 * "English (US) English US English UK Español (España) Español (Latinoamérica) Italiano
 * Français Deutsch 日本語 …", which a category rule will happily classify as an ordinary
 * product. Chrome that survives extraction is more dangerous than chrome that blocks it,
 * because it produces a confident answer rather than an honest unknown.
 */
const LOCALE_TOKEN = /\b(english|espa[nñ]ol|fran[cç]ais|deutsch|italiano|portugu[eê]s|nederlands|svenska|norsk|dansk|suomi|polski|t[uü]rk[cç]e|русский|日本語|简体中文|繁體中文|한국어|中文)\b/gi;

export function isLocaleChrome(text: string): boolean {
  const locales = new Set((text.match(LOCALE_TOKEN) ?? []).map((x) => x.toLowerCase()));
  if (locales.size < 3) return false;
  // Five or more language names is a picker outright: no product description enumerates
  // them, and the surrounding words are whatever the switcher happened to sit next to.
  if (locales.size >= 5) return true;
  // Three or more language names, and little else, means we captured the picker.
  const stripped = text.replace(LOCALE_TOKEN, ' ').replace(/[()\[\]‪‬,|·—–-]/g, ' ').replace(/\s+/g, ' ').trim();
  return stripped.split(/\s+/).filter((w) => w.length > 2).length < 12;
}

function healthOf(r: { ok: boolean; status: number; blocked?: boolean; error?: string; body?: string }): SourceHealth {
  if (r.blocked) return 'blocked';
  if (r.error === 'timeout') return 'timeout';
  if (r.status === 404) return 'not_found';
  if (r.ok && r.body) {
    // Content-based checks run against the rendered text, not the raw markup, so a script
    // that merely mentions "captcha" cannot trip them.
    const text = stripTags(r.body).slice(0, 2500);
    if (BOT_CHALLENGE.test(text)) return 'blocked';
    if (SOFT_NOT_FOUND.test(text)) return 'not_found';
    return 'success';
  }
  if (r.ok && !r.body) return 'parse_error';
  if (r.status === 0) return 'unknown';
  return 'no_relevant_evidence';
}

export async function collectPositioning(bareDomain: string, budget = 6): Promise<PositioningEvidence> {
  const items: PositioningItem[] = [];
  const health: PositioningEvidence['health'] = [];

  let home = await get(`https://www.${bareDomain}/`);
  if (!home.ok || !home.body) home = await get(`https://${bareDomain}/`);
  const homeHealth = healthOf(home);
  health.push({ url: `https://${bareDomain}/`, health: homeHealth, status: home.status });

  // A blocked or soft-404 homepage yields no identity evidence. Returning early keeps the
  // challenge page's own words ("verify you are a human") out of the evidence set.
  if (homeHealth !== 'success' || !home.body) return { items, health, observed: false };

  const origin = new URL(home.finalUrl ?? `https://${bareDomain}`).origin;
  const push = (sourceType: PositioningSourceType, url: string, text: string | null, retrievedAt: string) => {
    if (!text || text.trim().length < 12) return;
    if (isAuthWall(text)) return;      // a sign-in form is not a product description
    if (isLocaleChrome(text)) return;  // nor is a language switcher
    items.push({ sourceType, url, text: text.trim().slice(0, 600), retrievedAt });
  };

  push('title_tag', origin, home.body.match(/<title[^>]*>([\s\S]{3,200}?)<\/title>/i)?.[1] ? decodeEntities(stripTags(home.body.match(/<title[^>]*>([\s\S]{3,200}?)<\/title>/i)![1])).trim() : null, home.retrievedAt);
  push('meta_description', origin, metaOf(home.body, 'description'), home.retrievedAt);
  push('og_description', origin, metaOf(home.body, 'og:description'), home.retrievedAt);
  push('homepage_hero', origin, heroOf(home.body), home.retrievedAt);

  // Product surfaces, bounded. Only the first that responds per group — this is an identity
  // probe, not a crawl, and reading more pages would reintroduce the volume sensitivity
  // this collector exists to avoid.
  let spent = 0;
  for (const [paths, type] of [[PRODUCT_PATHS, 'product_page'], [COMPARISON_PATHS, 'comparison_page']] as const) {
    for (const p of paths) {
      if (spent >= budget) break;
      const r = await get(origin + p);
      spent++;
      const h = healthOf(r);
      health.push({ url: origin + p, health: h, status: r.status });
      if (h !== 'success' || !r.body) continue;
      push(p === '/pricing' ? 'pricing_page' : type, origin + p, heroOf(r.body), r.retrievedAt);
      break;
    }
  }

  return { items, health, observed: items.length > 0 };
}
