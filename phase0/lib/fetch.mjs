// Cached, polite HTTP fetcher for Phase 0 validation.
// Every retrieval records retrievedAt + status so findings stay auditable.
import { createHash } from 'node:crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const CACHE = new URL('../cache/', import.meta.url).pathname;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastHost = new Map();

function cachePath(url) {
  const h = createHash('sha1').update(url).digest('hex');
  return join(CACHE, h.slice(0, 2), `${h}.json`);
}

export async function get(url, { timeout = 20000, force = false } = {}) {
  const p = cachePath(url);
  if (!force && existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'));

  let host;
  try { host = new URL(url).host; } catch { return { url, ok: false, error: 'bad-url' }; }
  const prev = lastHost.get(host) ?? 0;
  const wait = 1200 - (Date.now() - prev);
  if (wait > 0) await sleep(wait);
  lastHost.set(host, Date.now());

  const rec = { url, retrievedAt: new Date().toISOString() };
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), timeout);
    const res = await fetch(url, {
      redirect: 'follow',
      signal: ctl.signal,
      headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8', 'accept-language': 'en,nl;q=0.8,fr;q=0.7,de;q=0.7' },
    });
    clearTimeout(t);
    const body = await res.text();
    rec.ok = res.ok;
    rec.status = res.status;
    rec.finalUrl = res.url;
    rec.contentType = res.headers.get('content-type') ?? '';
    rec.body = body.slice(0, 900000);
  } catch (e) {
    rec.ok = false;
    rec.status = 0;
    rec.error = String(e?.message ?? e);
  }
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, JSON.stringify(rec));
  return rec;
}

export function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}
