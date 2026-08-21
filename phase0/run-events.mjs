import { writeFileSync } from 'node:fs';
import { get } from './lib/fetch.mjs';
import { extractPeople, TIER } from './lib/people.mjs';
import { classifyLinks } from './lib/detect.mjs';

// Partnership/channel event organisers. Chosen from Introw's own /events pages
// (first-party evidence of which events they treat as their sourcing channel)
// plus the two largest independent channel-community organisers.
const SEEDS = [
  ['catalyst_partnership_leaders', 'https://www.joincatalyst.com/'],
  ['catalyst_nyc', 'https://www.joincatalyst.com/catalyst-summit-nyc-2026'],
  ['catalyst_agenda', 'https://www.joincatalyst.com/agenda-catalyst-26'],
  ['partnertechx_speakers', 'https://channelfocuscommunity.net/partnertechx-2026/partnertechx-2026-speakers-and-experts/'],
  ['channelfocus', 'https://channelfocuscommunity.net/'],
  ['partnershipleaders', 'https://partnershipleaders.com/'],
  ['channelpartners_conf', 'https://www.channelpartnersconference.com/'],
  ['impartner_events', 'https://impartner.com/events-live/'],
];

const SPEAKER_LINK = /(speaker|spreker|agenda|sessions?|line-?up|exhibitor|sponsor|attendees|who-?s-?(?:coming|attending)|program(?:me)?)/i;

async function crawlOrganiser(id, root) {
  const pages = [];
  const r = await get(root);
  if (!r.ok) return { id, root, status: r.status, pages, people: [] };
  pages.push(r);
  const links = [...new Set([...(r.body.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi))].map((m) => m[1]))];
  const cand = [];
  for (const h of links) {
    let u; try { u = new URL(h, r.finalUrl ?? root); } catch { continue; }
    if (u.hostname !== new URL(r.finalUrl ?? root).hostname) continue;
    if (!SPEAKER_LINK.test(u.pathname)) continue;
    cand.push(u.origin + u.pathname);
  }
  for (const u of [...new Set(cand)].slice(0, 8)) {
    const p = await get(u);
    if (p.ok && p.body) pages.push(p);
  }
  const people = [];
  for (const p of pages) for (const person of extractPeople(p.body, p.finalUrl ?? p.url)) people.push(person);
  // dedupe across pages
  const seen = new Set(); const uniq = [];
  for (const p of people) { const k = p.name.toLowerCase(); if (seen.has(k)) continue; seen.add(k); uniq.push(p); }
  return { id, root, status: r.status, pagesInspected: pages.map((p) => p.finalUrl ?? p.url), people: uniq };
}

const out = [];
for (const [id, root] of SEEDS) {
  const r = await crawlOrganiser(id, root);
  out.push(r);
  const t = {};
  for (const p of r.people) t[p.persona] = (t[p.persona] ?? 0) + 1;
  const t1 = r.people.filter((p) => TIER[p.persona] === 1).length;
  console.error(`${id.padEnd(30)} status=${r.status} pages=${r.pagesInspected?.length ?? 0} people=${r.people.length} tier1=${t1} withCompany=${r.people.filter((p) => p.company).length}`);
}
writeFileSync(new URL('./out/events.v1.json', import.meta.url).pathname, JSON.stringify(out, null, 2));
console.error('wrote phase0/out/events.v1.json');
