import { readFileSync, writeFileSync } from 'node:fs';
import { get, stripTags } from './lib/fetch.mjs';
import { mainContent } from './lib/detect.mjs';

// Persona x source observability test (thesis §G, architecture §8).
// A Tier-1 persona with a zero row is a BLOCKING finding.

const TITLE_PATTERNS = [
  ['t1_partner_leadership', /\b((?:global\s+)?(?:vp|vice president|head|director|chief)\s+(?:of\s+)?(?:partner|partners|partnership|partnerships|alliance|alliances|channel|ecosystem)[a-z ]{0,24}|(?:partner|channel|alliance)s?\s+(?:director|lead|head)|chief partner officer)\b/i],
  ['t1_partner_revops', /\b(partner (?:revenue )?operations|partner ops|revenue operations|revops)\b/i],
  ['t2_partner_marketing', /\b(partner(?:ship)?s? marketing|channel marketing)\b/i],
  ['t2_cro_vpsales', /\b(chief revenue officer|\bcro\b|vp (?:of )?sales|vice president,? sales|sales director|commercial director)\b/i],
  ['t2_coo_founder', /\b(chief operating officer|\bcoo\b|founder|co-?founder|managing director|general manager)\b/i],
  ['t3_partner_ic', /\b(partner(?:ship)?s? manager|channel manager|partner account manager|partner success|alliance manager|partner lead)\b/i],
  ['t3_growth_bd', /\b(business development|bdm?\b|head of growth|growth (?:marketeer|manager|lead)|account executive)\b/i],
  ['anti_hr_bp', /\b(hr business partner|people partner|hrbp|business partner,? (?:hr|people))\b/i],
  ['anti_equity_partner', /\b(managing partner|senior partner|equity partner|general partner|founding partner|partner,? (?:tax|audit|corporate|litigation|m&a))\b/i],
  ['anti_corpdev', /\b(corporate development|strategic partnerships? (?:m&a|corp)|m&a)\b/i],
  ['anti_marketplace', /\b(marketplace manager|app store|integrations? manager|ecosystem engineer|developer relations|devrel)\b/i],
];

export function classifyTitle(title) {
  const t = (title ?? '').trim();
  if (!t) return 'unclassified';
  for (const [name, re] of TITLE_PATTERNS) if (re.test(t)) return name;
  return 'unclassified';
}

const TEAM_PATHS = ['/about', '/about-us', '/team', '/our-team', '/company/team', '/people', '/leadership', '/management', '/over-ons', '/ons-team', '/equipe', '/ueber-uns', '/unternehmen/team', '/company'];

// Extract name/title pairs from a page. Deliberately conservative: a title with no
// adjacent name is recorded as an unnamed title observation, never invented.
export function extractPeople(html) {
  const out = [];
  const text = mainContent(html);
  const titleRe = /\b((?:Global\s+|Senior\s+|Sr\.?\s+|EMEA\s+|Regional\s+)?(?:VP|Vice President|Head|Director|Chief|Manager|Lead)\s*(?:of\s+)?(?:Partner|Partners|Partnership|Partnerships|Alliance|Alliances|Channel|Ecosystem|Revenue Operations|RevOps)[A-Za-z ,&]{0,30}|(?:Partner|Channel|Alliance)s?\s+(?:Director|Manager|Lead|Marketing Manager|Operations[A-Za-z ]{0,15}))\b/g;
  for (const m of text.matchAll(titleRe)) {
    const before = text.slice(Math.max(0, m.index - 80), m.index);
    // A person name immediately preceding the title, e.g. "Bart Schouw Global VP Partners"
    const nm = /([A-Z][a-zà-ÿ'’-]+(?:\s+[A-Z][a-zà-ÿ'’-]+){1,2})[\s,–—|·-]*$/.exec(before);
    out.push({ name: nm ? nm[1] : null, title: m[0].trim(), persona: classifyTitle(m[0]) });
  }
  // dedupe
  const seen = new Set(); const res = [];
  for (const p of out) { const k = (p.name ?? '') + '|' + p.title.toLowerCase(); if (seen.has(k)) continue; seen.add(k); res.push(p); }
  return res;
}

async function probeTeamPages(domain) {
  const origin = `https://www.${domain}`;
  const found = [];
  const inspected = [];
  for (const p of TEAM_PATHS) {
    const r = await get(origin + p);
    if (!r.ok || r.status !== 200 || (r.body ?? '').length < 3000) continue;
    inspected.push(p);
    const people = extractPeople(r.body);
    for (const person of people) found.push({ ...person, sourceUrl: origin + p, retrievedAt: r.retrievedAt });
    if (inspected.length >= 4) break;
  }
  return { inspected, found };
}

async function main() {
  const cohorts = JSON.parse(readFileSync(new URL('./benchmark/cohorts.v1.json', import.meta.url)));
  const detect = JSON.parse(readFileSync(new URL('./out/detect.v1.json', import.meta.url)));
  const targets = [...cohorts.cohortD];
  // Also test partner pages already found by the detector: do they name a contact?
  const results = [];
  for (const t of targets) {
    const rec = { ...t, sources: {} };
    rec.sources.company_team_page = await probeTeamPages(t.domain);
    const d = detect.find((x) => x.domain === t.domain && x.cohort === 'cohortD') ?? detect.find((x) => x.domain === t.domain);
    const partnerUrls = (d?.partnerPages ?? []).filter((p) => p.status === 200).map((p) => p.url).slice(0, 3);
    const pp = { inspected: [], found: [] };
    for (const u of partnerUrls) {
      const r = await get(u);
      if (!r.ok || !r.body) continue;
      pp.inspected.push(u);
      for (const person of extractPeople(r.body)) pp.found.push({ ...person, sourceUrl: u, retrievedAt: r.retrievedAt });
    }
    rec.sources.partner_page = pp;
    results.push(rec);
    const n = (a) => a.found.filter((f) => f.name).length;
    console.error(`${t.domain.padEnd(20)} teamPages=${rec.sources.company_team_page.inspected.length} titles=${rec.sources.company_team_page.found.length} named=${n(rec.sources.company_team_page)} | partnerPages=${pp.inspected.length} titles=${pp.found.length} named=${n(pp)}`);
  }
  writeFileSync(new URL('./out/persona.v1.json', import.meta.url).pathname, JSON.stringify(results, null, 2));
  console.error('wrote phase0/out/persona.v1.json');
}
if (process.argv[1].endsWith('run-persona.mjs')) main();
