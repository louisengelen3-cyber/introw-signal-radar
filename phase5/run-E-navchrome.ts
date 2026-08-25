/**
 * The true cause of the tier false positive, measured.
 *
 * The 25 Aug audit attributed EXPO.e's confirmed tier claim to negation — a keyword matcher
 * reading "we don't use tiered services". That diagnosis was wrong. All four of EXPO.e's
 * confirmed surfaces come from /partner-login, whose extracted text is navigation chrome:
 * "Massive Margin Money Makers Platinum Partner S4 Object Storage SASE & SD-WAN". No sentence
 * on that page asserts a tier; a menu does.
 *
 * This measures how much of the corpus's surface evidence rests on that class of page.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const doss: any[] = JSON.parse(readFileSync('product/out/dossiers.json', 'utf8'));
const batch: any[] = JSON.parse(readFileSync('discovery/batch/out-research.json', 'utf8'));

/** Pages whose extracted text is chrome rather than prose. */
const CHROME_URL = /\/(partner-)?(login|log-in|signin|sign-in|auth|account|portal-login)(\/|$|\?)/i;
/** A quote that is a menu: many capitalised fragments, few sentence terminators. */
function looksLikeMenu(q: string): boolean {
  if (!q) return false;
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length < 8) return false;
  const caps = words.filter((w) => /^[A-Z][a-z]/.test(w)).length;
  const terminators = (q.match(/[.!?]/g) ?? []).length;
  return caps / words.length > 0.45 && terminators <= 1;
}

let total = 0, fromChromeUrl = 0, fromMenuQuote = 0, either = 0;
const offenders: any[] = [];
for (const d of doss) {
  for (const s of d.surfaces ?? []) {
    if (s.state !== 'confirmed') continue;
    for (const e of s.evidence ?? []) {
      total++;
      const c = CHROME_URL.test(e.sourceUrl ?? '');
      const m = looksLikeMenu(e.quote ?? '');
      if (c) fromChromeUrl++;
      if (m) fromMenuQuote++;
      if (c || m) { either++; offenders.push({ domain: d.domain, surface: s.surface, url: e.sourceUrl, chromeUrl: c, menuQuote: m, quote: (e.quote ?? '').slice(0, 110) }); }
    }
  }
}
const pct = (n: number) => Math.round((n / total) * 1000) / 10;
console.log(`SURFACE EVIDENCE ITEMS across ${doss.length} production dossiers: ${total}`);
console.log(`  sourced from a login/auth page  : ${fromChromeUrl} (${pct(fromChromeUrl)}%)`);
console.log(`  quote reads as a navigation menu: ${fromMenuQuote} (${pct(fromMenuQuote)}%)`);
console.log(`  either                          : ${either} (${pct(either)}%)`);
const bySurface: Record<string, number> = {};
for (const o of offenders) bySurface[o.surface] = (bySurface[o.surface] ?? 0) + 1;
console.log(`\n  by surface: ${Object.entries(bySurface).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join('  ')}`);
console.log(`\n  worst offenders:`);
for (const o of offenders.slice(0, 8)) console.log(`    ${o.domain.padEnd(20)} ${o.surface.padEnd(20)} chrome=${o.chromeUrl} menu=${o.menuQuote}`);
writeFileSync('phase5/out/E-navchrome.json', JSON.stringify({ total, fromChromeUrl, fromMenuQuote, either, bySurface, offenders }, null, 2));
