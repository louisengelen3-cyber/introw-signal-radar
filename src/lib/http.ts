/**
 * Cached, polite HTTP with auditable retrieval records.
 *
 * Caching is not an optimisation here — it is what makes a benchmark run
 * reproducible and keeps repeated detector iterations off other people's servers.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const CACHE_DIR = process.env.RADAR_CACHE ?? join(process.cwd(), '.cache', 'http');
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0 Safari/537.36';

export interface Retrieval {
  url: string;
  ok: boolean;
  status: number;
  finalUrl?: string;
  contentType?: string;
  body?: string;
  error?: string;
  retrievedAt: string;
  /** Distinguishes "we could not look" from "there is nothing there". */
  blocked?: boolean;
}

const lastHit = new Map<string, number>();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function cachePath(url: string): string {
  const h = createHash('sha1').update(url).digest('hex');
  return join(CACHE_DIR, h.slice(0, 2), `${h}.json`);
}

export async function get(url: string, opts: { timeout?: number; force?: boolean } = {}): Promise<Retrieval> {
  const { timeout = 20000, force = false } = opts;
  const p = cachePath(url);
  if (!force && existsSync(p)) {
    try { return JSON.parse(readFileSync(p, 'utf8')) as Retrieval; } catch { /* refetch */ }
  }

  let host: string;
  try { host = new URL(url).host; } catch { return { url, ok: false, status: 0, error: 'invalid-url', retrievedAt: new Date().toISOString() }; }

  const wait = 1200 - (Date.now() - (lastHit.get(host) ?? 0));
  if (wait > 0) await sleep(wait);
  lastHit.set(host, Date.now());

  const rec: Retrieval = { url, ok: false, status: 0, retrievedAt: new Date().toISOString() };
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeout);
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctl.signal,
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
        'accept-language': 'en,nl;q=0.9,fr;q=0.8,de;q=0.8,es;q=0.7,it;q=0.7',
      },
    });
    clearTimeout(t);
    rec.ok = res.ok;
    rec.status = res.status;
    rec.finalUrl = res.url;
    rec.contentType = res.headers.get('content-type') ?? '';
    rec.body = (await res.text()).slice(0, 1_200_000);
    rec.blocked = [401, 403, 405, 429, 503].includes(res.status);
  } catch (e) {
    rec.error = String((e as Error)?.message ?? e);
    rec.blocked = /abort|timeout/i.test(rec.error);
  }
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(rec));
  return rec;
}

export function stripTags(html: string): string {
  return denoise(decodeEntities(html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()));
}

/**
 * Decode HTML entities.
 *
 * A quote is the product's unit of trust, and `you&#x27;re live` in a dossier reads as a
 * bug in front of a customer. Numeric and hex forms both appear in real markup, so both are
 * handled rather than the handful of named entities that were covered before.
 */
export function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;|&#160;|&#xa0;/gi, ' ')
    .replace(/&amp;|&#38;/gi, '&')
    .replace(/&lt;|&#60;/gi, '<')
    .replace(/&gt;|&#62;/gi, '>')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#0?39;|&apos;|&#x27;|&rsquo;|&lsquo;/gi, "'")
    .replace(/&ldquo;|&rdquo;|&#8220;|&#8221;/gi, '"')
    .replace(/&ndash;|&#8211;/gi, '–').replace(/&mdash;|&#8212;/gi, '—')
    .replace(/&hellip;|&#8230;/gi, '…')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeChar(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeChar(Number(d)));
}

function safeChar(code: number): string {
  return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ' ';
}

/**
 * Trim a snippet to whole words.
 *
 * Context windows cut at a character offset, which produced quotes like "ses and Demo
 * Environment so you can be fully armed when you resell…". A quote that starts mid-word
 * looks like a broken scraper regardless of how good the evidence behind it is.
 */
export function snapToWords(text: string, opts: { leadingEllipsis?: boolean } = {}): string {
  let t = text.replace(/\s+/g, ' ').trim();
  const cutStart = /^\S/.test(t) && opts.leadingEllipsis !== false;
  if (cutStart) t = t.replace(/^\S+\s+/, '');
  t = t.replace(/\s+\S*$/, '');
  return t.trim();
}

/**
 * Trim a snippet to whole SENTENCES where that is possible without gutting it.
 *
 * Word snapping still produced quotes like "of great partnerships. Let's create wonders,
 * together. Become a partner Integration Partners Salesforce Q2C automation" — a fragment
 * that starts mid-thought. Reps paste these into emails, so the unit of a quote should be a
 * sentence. Falls back to the word-snapped form when no sentence boundary is available,
 * because a readable fragment beats an empty string.
 */
export function snapToSentences(text: string, opts: { minLength?: number } = {}): string {
  const min = opts.minLength ?? 60;
  const t = snapToWords(text, { leadingEllipsis: false });
  // Start at the first sentence boundary, provided enough text survives it.
  const startMatch = t.match(/[.!?]["')\]]?\s+(?=[A-Z0-9"'(\u00C0-\u024F])/);
  let out = t;
  if (startMatch && startMatch.index !== undefined) {
    const candidate = t.slice(startMatch.index + startMatch[0].length).trim();
    if (candidate.length >= min) out = candidate;
  }
  // End at the last sentence boundary, on the same condition.
  const ends = [...out.matchAll(/[.!?]["')\]]?(?=\s|$)/g)];
  const last = ends.at(-1);
  if (last && last.index !== undefined) {
    const candidate = out.slice(0, last.index + last[0].length).trim();
    if (candidate.length >= min) out = candidate;
  }
  if (out.length >= min) return dropLeadingFragment(out);
  return dropLeadingFragment(t);
}

/**
 * Drop a leading partial word.
 *
 * Character-windowed snippets routinely begin mid-token — "evenue, and get support from our
 * no-nonsense enablement" is a real quote this produced, where the window cut through
 * "revenue". A quote that starts inside a word reads as a broken scraper no matter how good
 * the evidence behind it is. A fragment is a lowercase run that is not itself a plausible
 * sentence opener.
 */
function dropLeadingFragment(t: string): string {
  const m = t.match(/^([a-z][a-z'’-]*)([,.;:!?)]*\s+)/);
  if (!m) return t;
  // Common lowercase openers are left alone; anything else at the head of a cut window is
  // far more likely to be the tail of a word than a real first word.
  if (/^(the|a|an|our|your|their|we|you|and|to|for|with|as|by|in|on|at|of|is|are|it|this|that|all|new|get|join|become|earn|build|grow|access|partner|partners|resell|refer)$/.test(m[1])) return t;
  return t.slice(m[0].length);
}

/**
 * Remove stylesheet and script text that survived tag stripping.
 *
 * Tag-based removal assumes well-formed HTML, and real sites are not. Accenture's homepage
 * put `.sr-only, .herotext { position: absolute; ... }` into the extracted hero text, which
 * is the kind of debris that quietly matches a detector pattern and produces an
 * unexplainable classification. Anything shaped like a CSS rule or a bare declaration is
 * dropped: no commercial sentence looks like this.
 */
export function denoise(text: string): string {
  return text
    // Attribute soup from inline SVG and web components survives tag stripping when the
    // markup is malformed: `width="18px" viewBox="0 0 25 23" fill="none" xmlns="..."`.
    .replace(/\b[a-zA-Z:-]+\s*=\s*["'][^"']{0,200}["']/g, ' ')
    // …and an attribute whose closing quote was lost to truncation.
    .replace(/\b[a-zA-Z:-]+\s*=\s*["'][^"']{0,200}$/g, ' ')
    // `selector { prop: value; ... }`. The selector list is NOT matched with a starred group
    // over a repeatable subpattern — that construction backtracked quadratically and took
    // 8.8s on a 24k-character comma-separated run, stalling the build with no timeout. A
    // bounded character class cannot backtrack.
    // The selector run is built from CSS-shaped TOKENS joined by combinators, never from free
    // text. An earlier version used a broad character class including whitespace, which was
    // lazy enough to start inside prose and swallow the sentence before the brace
    // ("Together We Reinvented .sr-only { … }" lost the headline). Note the absence of /i:
    // element selectors are lowercase, so a capitalised English word cannot open a match.
    .replace(/(?<![\w-])(?:[.#][\w-]+|[a-z][\w-]*)(?:\s*[,>+~]\s*(?:[.#][\w-]+|[a-z][\w-]*)|\s*::?[\w-]+(?:\([^()]{0,40}\))?|\s+[.#][\w-]+|\[[^\]]{0,60}\]){0,20}\s*\{[^{}]{0,600}\}/g, ' ')
    .replace(/\{[^{}]{0,600}\}/g, ' ')
    // stray declarations left over from a truncated rule
    .replace(/\b(?:position|display|margin|padding|overflow|clip|width|height|font-size|line-height|z-index|border|background|color|transform|opacity)\s*:\s*[^;]{1,60};/gi, ' ')
    // literal escape sequences that leaked from JSON or entity-encoded markup
    .replace(/\\r\\n|\\n|\\t/g, ' ')
    .replace(/&lt;\/?[a-z][^&]{0,20}&gt;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Main content only. Phase 0 measured that a mega-nav advertising "100+ integrations"
 * flipped a genuine reseller programme to integration_only; site chrome must go
 * before any lexicon runs.
 */
export function mainContent(html: string): string {
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header\b[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside\b[\s\S]*?<\/aside>/gi, ' ');
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(h) ?? /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(h);
  if (main && main[1].length > 400) h = main[1];
  return stripTags(h);
}
