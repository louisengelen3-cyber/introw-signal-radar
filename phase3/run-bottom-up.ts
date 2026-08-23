/**
 * P0 — bottom-up customer teardown, for hypothesis GENERATION.
 *
 * Deliberately not driven by the existing feature list. It does not go looking for CRM,
 * partner counts, deal registration or distributors. It reads what customers actually say
 * on their partner surfaces and lets repeated language suggest the patterns.
 *
 * The four missed customers all publish their partner motion in plain business English —
 * "grow their recurring revenue streams", "win new deals", "expand our reach", "do you
 * have a new lead for us" — while the Phase 2 lexicon only recognises formalised channel
 * vocabulary. This run tests how general that is across the whole customer set.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { get, mainContent } from '../src/lib/http.js';
import { rankPartnerUrls, siteUrls } from '../src/evidence/collect.js';

const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const CUSTOMERS = [
  'cumulocity.com', 'ringover.com', 'factorialhr.com', 'quatt.io', 'cubbit.io', 'zenity.io',
  'sedai.io', 'epiphan.com', 'xelix.com', 'safebreach.com', 'payflip.be', 'coder.com',
  'sharegate.com', 'archerirm.com', 'axon.com', 'aikido.dev', 'parloa.com',
  'reversinglabs.com', 'storyblok.com',
];

/**
 * Open-ended probes, grouped by the COMMERCIAL QUESTION they answer rather than by the
 * feature they would become. Each is a way a company might describe the same thing.
 */
const PROBES: [string, string, RegExp][] = [
  // — does the company say partners bring revenue or customers?
  ['materiality', 'partner grows their own revenue', /\b(grow (?:their|your) (?:own )?(?:business|revenue|recurring revenue)|new revenue stream|additional revenue|revenue stream|increase (?:their|your) revenue|earn (?:recurring )?(?:revenue|commission)|profitable)\b/i],
  ['materiality', 'partner wins or sources deals', /\b(win new (?:deals|business|clients)|source (?:new )?(?:deals|opportunities)|bring (?:us )?(?:leads|deals|customers)|generate (?:leads|pipeline|opportunities)|new lead|refer (?:a |your )?(?:client|customer|lead))\b/i],
  ['materiality', 'partner extends reach to new customers', /\b(expand (?:our|your|their) reach|extend (?:our|your) reach|reach new (?:customers|markets|clients)|access (?:to )?new (?:customers|markets)|serve (?:their|your) customers)\b/i],
  ['materiality', 'partner sells or resells', /\b(resell|reseller|value[- ]added reseller|\bVAR\b|sell (?:our|the) (?:solution|product|platform)|co-?sell|co-?selling|joint (?:selling|go[- ]to[- ]market))\b/i],
  ['materiality', 'partner implements or delivers', /\b(implementation partner|delivery (?:partner|project)|deploy (?:our|the) (?:solution|platform)|integrate .{0,20}into (?:their|your) (?:delivery|projects|offering)|service partner)\b/i],

  // — does the company operate the partner motion itself?
  ['ownership', 'recruits partners in the first person', /\b(become a partner|become our partner|join (?:our|the) (?:partner|programme?|network)|partner with us|apply to (?:our|the) partner|we (?:are )?(?:seek|look)(?:ing)? (?:for )?partners|word partner|partner worden|devenir partenaire|partner werden)\b/i],
  ['ownership', 'operates an intake form or enquiry', /\b(partner (?:enquiry|inquiry|application|form|sign[- ]?up|registration)|submit (?:a |your )?(?:lead|deal|referral)|fill in the form|register (?:a |your )?(?:lead|deal|opportunity)|get in touch within \d+ hours)\b/i],
  ['ownership', 'names partner types it manages', /\b((?:technology|referral|reseller|implementation|solution|service|channel|agency|payroll|accounting|accountancy|benefit|hr|distribution|consulting|staffing|msp|var) partners)\b/i],
  ['ownership', 'describes what it gives partners', /\b(partner (?:resources|benefits|enablement|support|training|portal|materials|toolkit|assets)|we (?:provide|offer|give) (?:our )?partners|dedicated (?:partner|channel) (?:manager|team|support))\b/i],
  ['ownership', 'has a named partner contact or team', /\b(partner (?:team|manager|success|operations)|contact (?:our|the) partner|your partner manager|alliances team)\b/i],

  // — is there enough operational surface for PRM software to matter?
  ['surface', 'formal deal registration', /\b(deal registration|register a deal|opportunity registration|deal[- ]?reg\b)\b/i],
  ['surface', 'partner portal or login', /\b(partner portal|partner login|partner hub|espace partenaires?|partnerportaal)\b/i],
  ['surface', 'partner tiers', /\b((?:gold|silver|bronze|platinum|premier|elite|registered|certified) partner|partner (?:tiers?|levels?))\b/i],
  ['surface', 'certification or training', /\b(certif(?:ied|ication)|accredit|partner (?:academy|university|training)|onboarding)\b/i],
  ['surface', 'commission or margin mechanics', /\b(commission|margin|revenue share|referral fee|payout|spiff|rebate)\b/i],
  ['surface', 'partner directory or locator', /\b(find a (?:partner|reseller|installer|dealer)|partner director|our partners include|meet our partners|partner locator)\b/i],
  ['surface', 'multiple distinct programme tracks', /\b(partner (?:programs|programmes)\b|explore (?:our )?partnership options|find your fit|choose (?:your|the right) (?:program|partnership))\b/i],
];

interface Row {
  domain: string;
  pages: string[];
  chars: number;
  hits: Record<string, string[]>; // dimension -> probe labels
  quotes: { probe: string; quote: string; url: string }[];
}

const rows: Row[] = [];
let i = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (i < CUSTOMERS.length) {
    const d = CUSTOMERS[i++];
    try {
      let home = await get(`https://www.${d}/`);
      if (!home.ok || !home.body) home = await get(`https://${d}/`);
      if (!home.ok || !home.body) { rows.push({ domain: d, pages: [], chars: 0, hits: {}, quotes: [] }); continue; }
      const origin = new URL(home.finalUrl ?? `https://${d}/`).origin;
      const inv = await siteUrls(origin, home.body, home.finalUrl ?? origin);
      const ranked = rankPartnerUrls(inv, 5);
      const texts: { url: string; text: string }[] = [];
      for (const u of ranked) {
        const r = await get(u);
        if (r.ok && r.body) texts.push({ url: u, text: mainContent(r.body) });
      }
      const hits: Record<string, string[]> = {};
      const quotes: Row['quotes'] = [];
      for (const [dim, label, re] of PROBES) {
        for (const t of texts) {
          const m = re.exec(t.text);
          if (!m) continue;
          (hits[dim] ??= []).push(label);
          const s = Math.max(0, m.index - 60);
          quotes.push({ probe: label, quote: t.text.slice(s, m.index + m[0].length + 70).replace(/\s+/g, ' ').trim(), url: t.url });
          break;
        }
      }
      for (const k of Object.keys(hits)) hits[k] = [...new Set(hits[k])];
      rows.push({ domain: d, pages: ranked, chars: texts.reduce((n, t) => n + t.text.length, 0), hits, quotes });
      console.error(`[${rows.length}/${CUSTOMERS.length}] ${d.padEnd(22)} pages=${ranked.length} materiality=${(hits.materiality ?? []).length} ownership=${(hits.ownership ?? []).length} surface=${(hits.surface ?? []).length}`);
    } catch (e) { console.error(`[err] ${d}: ${(e as Error).message}`); }
  }
}));

writeFileSync(`${OUT}bottom-up.json`, JSON.stringify(rows, null, 2));

/* ── which probes actually repeat across customers? ─────────────────────── */
const freq: Record<string, { dim: string; n: number }> = {};
for (const [dim, label] of PROBES.map(([d, l]) => [d, l] as const)) freq[label] = { dim, n: 0 };
for (const r of rows) for (const [dim, labels] of Object.entries(r.hits)) for (const l of labels) if (freq[l]) freq[l].n++;

console.error(`\n## Probe frequency across ${rows.length} customers (${rows.filter((r) => r.pages.length).length} with retrievable partner pages)`);
for (const [label, v] of Object.entries(freq).sort((a, b) => b[1].n - a[1].n)) {
  console.error(`  ${String(v.n).padStart(2)}  ${v.dim.padEnd(12)} ${label}`);
}
console.error('DONE');
