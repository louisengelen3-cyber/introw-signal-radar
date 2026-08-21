import { mainContent } from './detect.mjs';

// Title vocabulary for the Introw persona model. Ordered: anti-personas resolve first
// so title collisions cannot inflate a partner persona (architecture §15.6/15.7).
export const PERSONA_RULES = [
  ['anti_hr_business_partner', /\b(hr business partner|people partner|hrbp|business partner,?\s*(?:hr|people|talent))\b/i],
  ['anti_equity_partner', /\b(managing partner|senior partner|equity partner|general partner|limited partner|founding partner|name partner|partner,?\s*(?:tax|audit|corporate|litigation|m&a|advisory|assurance|deals))\b/i],
  ['anti_corp_dev', /\b(corporate development|corp dev|m&a\b|mergers)\b/i],
  ['anti_marketplace_integrations', /\b(marketplace manager|app store|integrations? (?:manager|lead)|developer relations|devrel|platform ecosystem engineer)\b/i],
  ['anti_affiliate', /\b(affiliate (?:manager|marketing|program)|performance marketing|influencer (?:manager|marketing))\b/i],

  ['t1_partner_leadership', /\b(?:chief\s+partner\s+officer|(?:global\s+|regional\s+|emea\s+|amer\s+|apac\s+|international\s+)?(?:svp|vp|vice[- ]president|head|director|chief|lead)\b[^.|]{0,34}?\b(?:partner|partners|partnership|partnerships|alliance|alliances|channel|ecosystem)\b|(?:partner|partners|partnership|partnerships|channel|alliance|alliances)\s+(?:director|lead|head))\b/i],
  ['t1_partner_revops', /\b(partner\s+(?:revenue\s+)?operations|partner ops|channel operations)\b/i],
  ['t2_partner_marketing', /\b(partner(?:ship)?s?\s+marketing|channel marketing)\b/i],
  ['t2_cro_vp_sales', /\b(chief revenue officer|\bcro\b|(?:svp|vp|vice[- ]president)\s*(?:of\s+)?sales|sales director|commercial director)\b/i],
  ['t2_coo_founder', /\b(chief operating officer|\bcoo\b|co-?founder|founder|managing director|general manager)\b/i],
  ['t3_partner_ic', /\b((?:senior\s+|sr\.?\s+)?(?:partner(?:ship)?s?|channel|alliance)\s+(?:manager|account manager|success|lead|specialist|associate)|partner\s+enablement)\b/i],
  ['t3_growth_bd', /\b(business development|\bbdm?\b|head of growth|growth (?:marketeer|marketer|manager|lead)|account executive)\b/i],
];

export function classifyPersona(title) {
  const t = (title ?? '').replace(/\s+/g, ' ').trim();
  if (!t) return { persona: 'unclassified', matched: null };
  for (const [persona, re] of PERSONA_RULES) {
    const m = re.exec(t);
    if (m) return { persona, matched: m[0] };
  }
  return { persona: 'unclassified', matched: null };
}

export const TIER = {
  t1_partner_leadership: 1, t1_partner_revops: 1,
  t2_partner_marketing: 2, t2_cro_vp_sales: 2, t2_coo_founder: 2,
  t3_partner_ic: 3, t3_growth_bd: 3,
};

const NAME = String.raw`[A-Z][a-zà-öø-ÿ'’\-]+(?:\s+(?:van|von|de|der|den|di|du|la|le|el)\s+)?(?:\s+[A-Z][a-zà-öø-ÿ'’\-]+){1,2}`;
const TITLEWORD = String.raw`[A-Za-z][A-Za-z0-9&,'\-\/\. ]{3,70}`;

// Extract person records from structured-ish speaker/team markup.
// Preference order: microdata/JSON-LD > repeated card markup > flat text triples.
export function extractPeople(html, sourceUrl) {
  const out = [];
  const push = (name, title, company, method) => {
    if (!name || !title) return;
    const t = title.replace(/\s+/g, ' ').trim().replace(/[,;|·–—-]\s*$/, '');
    if (t.length < 3 || t.length > 90) return;
    const { persona, matched } = classifyPersona(t);
    out.push({ name: name.replace(/\s+/g, ' ').trim(), title: t, company: company?.replace(/\s+/g, ' ').trim() ?? null, persona, matchedOn: matched, method, sourceUrl });
  };

  // 1. JSON-LD Person
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const walk = (o) => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) return o.forEach(walk);
        if (o['@type'] === 'Person' && o.name) push(o.name, o.jobTitle ?? '', o.worksFor?.name ?? o.affiliation?.name, 'jsonld_person');
        Object.values(o).forEach(walk);
      };
      walk(JSON.parse(m[1].trim()));
    } catch { /* malformed JSON-LD is normal */ }
  }

  // 2. Repeated card markup: name in a heading, title in a sibling element.
  for (const m of html.matchAll(/<(h[2-6]|strong|b)[^>]*>\s*(${?:})?([^<>{}]{4,60}?)\s*<\/\1>\s*(?:<[^>]+>\s*){0,3}([^<>]{4,90}?)\s*</gi)) {
    const nm = m[3]?.trim(); const ti = m[4]?.trim();
    if (nm && ti && new RegExp(`^${NAME}$`).test(nm)) push(nm, ti, null, 'heading_sibling');
  }

  // 3. Flat text: "Name, Title, Company" or "Name — Title — Company"
  const text = mainContent(html);
  const sep = String.raw`\s*[,·|–—]\s*`;
  for (const m of text.matchAll(new RegExp(`(${NAME})${sep}(${TITLEWORD}?)${sep}([A-Z][A-Za-z0-9&.\\- ]{2,45})`, 'g'))) {
    push(m[1], m[2], m[3], 'text_triple');
  }
  for (const m of text.matchAll(new RegExp(`(${NAME})${sep}(${TITLEWORD})(?=\\s|$)`, 'g'))) {
    push(m[1], m[2], null, 'text_pair');
  }

  // dedupe on name+persona, keep richest record
  const byKey = new Map();
  for (const p of out) {
    const k = p.name.toLowerCase() + '|' + p.persona;
    const prev = byKey.get(k);
    const score = (p.company ? 2 : 0) + (p.method === 'jsonld_person' ? 3 : p.method === 'heading_sibling' ? 1 : 0) + p.title.length / 100;
    if (!prev || score > prev._s) byKey.set(k, { ...p, _s: score });
  }
  return [...byKey.values()].map(({ _s, ...r }) => r);
}
