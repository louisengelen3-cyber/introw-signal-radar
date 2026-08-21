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
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
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
