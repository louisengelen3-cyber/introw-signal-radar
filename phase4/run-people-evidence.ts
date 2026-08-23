/**
 * Workstream D — positive people evidence.
 *
 * Phase 0 found roughly one named Tier-1 partner persona per ten companies, using licensed
 * people data that is unavailable for this sprint. So the question here is narrower and
 * answerable: how much partner-ROLE evidence survives on the public web alone, and can it
 * ever support the TWO_PLUS reading — that more than one person works on partnerships?
 *
 * Constraint honoured throughout: team size below two is NEVER a disqualifier. A single
 * named partner manager is a strong positive; the absence of any name is `unknown`, because
 * most companies simply do not publish their org chart.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { get } from '../src/lib/http.js';
import { mainContent, stripTags } from '../src/evidence/collect.js';

export type PersonEvidenceState =
  | 'named_individual'      // a person's name attached to a partner role
  | 'named_role_unnamed'    // the role provably exists, nobody named ("your Partner Manager")
  | 'role_implied'          // partner work is described as staffed, no role title
  | 'unknown';              // nothing — NEVER "no partner team"

/** Titles that mean channel/partnership work. Anti-personas are excluded, not scored down. */
const PARTNER_TITLE =
  /\b((?:global |regional |senior |sr\.? |vp,? |vice president(?:,| of)? |head of |director(?:,| of)? |chief )?(?:partner|partnership|channel|alliance|alliances|ecosystem)s?\s+(?:success\s+)?(?:manager|director|lead|marketing manager|operations|ops|executive|officer|specialist|partnerships?))\b/gi;
const ANTI =
  /\b(hr business partner|human resources? business partner|people partner|equity partner|managing partner|partner at|general partner|limited partner|tax partner|audit partner|business partner\b)/i;
/** "your dedicated Partner Manager" proves the role is staffed without naming anyone. */
const ROLE_UNNAMED =
  /\b(?:a |your |our |dedicated |assigned )(?:dedicated |personal |named )?(partner|partnership|channel|alliance)\s+(?:success\s+)?(manager|director|lead|team|contact)\b/i;
const ROLE_IMPLIED =
  /\b(our (partner|partnerships?|channel|alliances) team|the (partner|channel) team|partner team will|reach out to (our|the) (partner|channel))\b/i;
/** A capitalised name adjacent to a partner title. Deliberately conservative. */
const NAMED = /\b([A-Z][a-z]{2,15}(?:\s+[A-Z][a-z'’-]{1,20}){1,2})\s*[,–—|-]{0,2}\s*(?:is\s+)?(?:the\s+)?((?:VP|Vice President|Head of|Director|Manager|Lead|Chief)\b[^.\n]{0,45}?(?:partner|partnership|channel|alliance)[a-z]*)\b/g;
/**
 * Nav chrome defeats naive name extraction. "Browse Partner Directory | Become a Partner"
 * yielded the "person" Browse Partner, title Directory... — `Director` matched inside
 * `Directory`. Both halves are now filtered: a name may not contain site vocabulary, and a
 * title may not be a directory link. This is the same failure that produced "Chief Partner"
 * and "April" as company names in the Phase 2 event runner.
 */
const NOT_A_NAME = /\b(partner|partners|channel|alliance|browse|become|directory|programme?|portal|login|contact|learn|read|view|find|search|explore|discover|solutions?|resources?|overview|home|our|the|welcome|apply|join|register|request)\b/i;
const NOT_A_TITLE = /\bdirector(y|ies)\b/i;

const PATHS = ['/partners', '/partner', '/partner-program', '/about', '/about-us', '/team', '/leadership', '/company/team', '/contact'];

async function peopleFor(domain: string) {
  const chunks: { url: string; text: string }[] = [];
  for (const p of PATHS) {
    for (const scheme of [`https://www.${domain}`, `https://${domain}`]) {
      try {
        const r = await get(scheme + p);
        if (r.ok && r.body) { chunks.push({ url: scheme + p, text: stripTags(mainContent(r.body)) }); break; }
      } catch { /* skip */ }
    }
  }
  const named: { name: string; title: string; url: string }[] = [];
  const titles = new Set<string>();
  let unnamedRole: string | null = null, implied: string | null = null;

  for (const c of chunks) {
    for (const m of c.text.matchAll(NAMED)) {
      if (ANTI.test(m[2]) || NOT_A_NAME.test(m[1]) || NOT_A_TITLE.test(m[2])) continue;
      named.push({ name: m[1], title: m[2].trim().slice(0, 60), url: c.url });
    }
    for (const m of c.text.matchAll(PARTNER_TITLE)) {
      if (ANTI.test(m[0])) continue;
      titles.add(m[0].toLowerCase().replace(/\s+/g, ' ').trim());
    }
    if (!unnamedRole) { const m = c.text.match(ROLE_UNNAMED); if (m && !ANTI.test(m[0])) unnamedRole = m[0]; }
    if (!implied) { const m = c.text.match(ROLE_IMPLIED); if (m) implied = m[0]; }
  }
  const distinctNames = [...new Map(named.map((n) => [n.name, n])).values()];
  const state: PersonEvidenceState =
    distinctNames.length > 0 ? 'named_individual'
    : unnamedRole ? 'named_role_unnamed'
    : implied ? 'role_implied'
    : 'unknown';
  return { pages: chunks.length, state, distinctNames, titles: [...titles].slice(0, 6), unnamedRole, implied,
    twoPlus: distinctNames.length >= 2 };
}

const SET = ['parloa.com','cubbit.io','aikido.dev','axon.com','coder.com','archerirm.com',
  'gitlab.com','pipedrive.com','freshworks.com','talkdesk.com','zendesk.com','datadoghq.com',
  'aircall.io','nedap.com','personio.com','silverfin.com','kiflo.com','impartner.com'];

const rows: any[] = [];
for (const d of SET) {
  const a = await peopleFor(d);
  rows.push({ domain: d, ...a });
  console.error(`${d.padEnd(20)} pages=${String(a.pages).padEnd(3)} ${a.state.padEnd(20)} ` +
    `names=${String(a.distinctNames.length).padEnd(3)} twoPlus=${String(a.twoPlus).padEnd(6)} ` +
    `${a.distinctNames.slice(0, 2).map((n: any) => n.name + ' / ' + n.title.slice(0, 28)).join(' | ')}`);
}
writeFileSync(new URL('./out/people-evidence.json', import.meta.url).pathname, JSON.stringify(rows, null, 2));
const by: Record<string, number> = {};
for (const r of rows) by[r.state] = (by[r.state] ?? 0) + 1;
console.error(`\nstates: ${Object.entries(by).map(([k, v]) => `${k}=${v}`).join(' · ')}`);
console.error(`TWO_PLUS satisfied: ${rows.filter((r) => r.twoPlus).length}/${rows.length}`);
console.error(`any person evidence at all: ${rows.filter((r) => r.state !== 'unknown').length}/${rows.length}`);
console.error('NOTE: `unknown` never means "no partner team" — team size below two is not a disqualifier.');
console.error('DONE');
