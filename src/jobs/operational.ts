/**
 * Operational evidence from job descriptions.
 *
 * Bounded on purpose. This is not open-ended information extraction: every fact below is one
 * the dossier already has a place for, and anything else a vacancy happens to say is ignored.
 *
 * The rule that governs the people facts, and it is the one most easily got wrong:
 *
 *   "You will join our team of four Partner Managers."  → the company states a team size
 *   "We are hiring a Partner Manager."                  → the company is hiring for the role
 *
 * The second proves a role is being recruited. It does NOT prove a partner team already
 * exists, and it certainly does not prove there are two or more people in it. Only a number
 * the company states about itself becomes a number.
 */

import type { JobOperationalHit, OperationalFact, Vacancy } from './types.js';
import { sentences } from './crm.js';

interface FactDef {
  fact: OperationalFact;
  patterns: RegExp[];
  proves: string;
  doesNotProve: string;
}

const FACTS: FactDef[] = [
  { fact: 'deal_registration',
    patterns: [/\bdeal[- ]registration\b/i, /\bregister(ing|ed)?\s+(a\s+)?deals?\b/i, /\bpartner[- ]submitted (opportunit|deal)/i, /\bopportunity registration\b/i],
    proves: 'the company operates a deal-registration process with partners',
    doesNotProve: 'how many deals are registered, or that the process is systematised rather than manual' },
  { fact: 'partner_pipeline',
    patterns: [/\bpartner[- ](sourced|generated|influenced)\s+(pipeline|revenue|bookings)\b/i, /\bpipeline (from|with|through) partners\b/i, /\bpartner pipeline\b/i],
    proves: 'the company tracks pipeline attributable to partners',
    doesNotProve: 'the size of that pipeline or its share of total revenue' },
  { fact: 'partner_portal',
    patterns: [/\bpartner portal\b/i, /\bpartner hub\b/i, /\bpartner (login|sign[- ]?in)\b/i],
    proves: 'partners have an authenticated destination',
    doesNotProve: 'what sits inside it — a portal is invisible to public research by design' },
  { fact: 'prm_usage',
    patterns: [/\b(PRM|partner relationship management)\s*(system|platform|tool|software)?\b/, /\b(Impartner|Allbound|PartnerStack|Kiflo|Channeltivity|ZINFI|Magentrix|Introw|Crossbeam|WorkSpan|Zift)\b/],
    proves: 'the advert names a partner-management platform',
    doesNotProve: 'that it is deployed, current, or the only one — and nothing about satisfaction or intent to switch' },
  { fact: 'co_selling',
    patterns: [/\bco-?sell(ing)?\b/i, /\bjoint (selling|go-to-market|pipeline)\b/i, /\bselling (alongside|together with) partners\b/i],
    proves: 'the company describes selling alongside partners',
    doesNotProve: 'that co-selling is systematised or material' },
  { fact: 'referral_process',
    patterns: [/\breferral (partner|programme?|process|fee|commission)\b/i, /\brefer(ring|red)? (customers?|clients?|leads?) to us\b/i],
    proves: 'a referral motion exists with a defined process',
    doesNotProve: 'the volume or value of referrals' },
  { fact: 'lead_routing',
    patterns: [/\blead (routing|assignment|distribution)\b/i, /\bround[- ]robin\b/i, /\broute (inbound )?leads?\b/i],
    proves: 'the company operates a defined lead-routing process',
    doesNotProve: 'lead volume, or that partners are part of that routing' },
  { fact: 'partner_onboarding',
    patterns: [/\bpartner onboarding\b/i, /\bonboard(ing)? (new )?partners\b/i, /\bpartner activation\b/i],
    proves: 'the company describes a defined start process for new partners',
    doesNotProve: 'how many partners are onboarded, or how much of it is manual' },
  { fact: 'partner_enablement',
    patterns: [/\bpartner (enablement|training|certification|academy)\b/i, /\benable (our )?partners\b/i],
    proves: 'material or training is produced specifically for partners',
    doesNotProve: 'that partners consume it' },
  { fact: 'channel_operations',
    patterns: [/\bchannel (operations|ops|programme?|strategy|management)\b/i, /\bindirect (sales|channel)\b/i, /\btwo[- ]tier (distribution|channel)\b/i],
    proves: 'the company describes a channel function',
    doesNotProve: 'the size or maturity of that channel' },
  { fact: 'revops_process',
    patterns: [/\b(revenue|sales|marketing) operations\b/i, /\brevops\b/i, /\bpipeline hygiene\b/i, /\bforecast(ing)? (accuracy|process)\b/i],
    proves: 'the company runs a revenue-operations function',
    doesNotProve: 'anything about partner operations specifically' },
  { fact: 'system_ownership',
    // Named business systems only. A looser noun list matched "Run your own workflow on AI
    // coding tooling", which is about an engineer's editor, not the company's GTM stack.
    patterns: [
      /\b(own|owns|owning|administer|administering|admin of)\b[^.]{0,40}\b(crm|erp|prm|revenue systems?|business systems?|go-to-market systems?|gtm (stack|systems?)|billing systems?|sales stack|data warehouse)\b/i,
      /\b(system|tooling|platform) (owner|ownership)\b[^.]{0,40}\b(revenue|sales|marketing|commercial|gtm|business)\b/i,
      /\bbusiness systems\b/i,
    ],
    proves: 'a named role owns the company’s systems',
    doesNotProve: 'which systems, unless separately evidenced' },
  { fact: 'manual_workflow',
    patterns: [/\b(manual|manually|spreadsheets?|google sheets|excel)\b[^.]{0,50}\b(process|tracking|reporting|reconcil|pipeline|commission)/i,
               /\b(process|tracking|reporting|commission)[^.]{0,40}\b(is|are|currently)\s+(manual|manually|in spreadsheets)/i],
    proves: 'the advert describes a process the company currently runs manually',
    doesNotProve: 'that the manual process concerns partners, unless the sentence says so' },
];

/** Roles that make a vacancy itself evidence of a partner function being recruited. */
const PARTNER_ROLE_TITLE = /\b(partner(ships?)?|channel|alliances?)\b[^,|]{0,30}\b(manager|director|lead|head|vp|specialist|associate|executive|operations|marketing)\b|\b(head|director|vp|manager)\s+of\s+(partner|channel|alliance)/i;

/**
 * A team size the COMPANY states about itself. Written words as well as digits, because
 * adverts say "a team of four" far more often than "a team of 4".
 */
const WORD_NUMBER: Record<string, number> = {
  two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  twee: 2, drie: 3, vier: 4, vijf: 5, zwei: 2, drei: 3, vier_de: 4, fünf: 5,
};
const TEAM_SIZE = new RegExp(
  String.raw`\b(?:join|joining|part of|alongside)\b[^.]{0,40}?\bteam of\s+(\d{1,2}|${Object.keys(WORD_NUMBER).join('|')})\b[^.]{0,40}?\b(partner|channel|alliance)`,
  'i',
);
const TEAM_SIZE_ALT = new RegExp(
  String.raw`\b(\d{1,2}|${Object.keys(WORD_NUMBER).join('|')})\s+(partner|channel|alliance)\s*(managers?|leads?|directors?)\b`,
  'i',
);

/**
 * A readable excerpt centred on the match. Job adverts are bullet lists without full stops,
 * so a "sentence" is routinely several hundred characters of unrelated responsibilities and
 * the fact that matched can sit anywhere inside it.
 */
function window(sentence: string, re: RegExp, pad = 90): string {
  const m = sentence.match(re);
  if (!m || m.index === undefined || sentence.length <= pad * 2 + m[0].length) return sentence;
  const start = Math.max(0, m.index - pad);
  const end = Math.min(sentence.length, m.index + m[0].length + pad);
  return (start > 0 ? '…' : '') + sentence.slice(start, end).trim() + (end < sentence.length ? '…' : '');
}

export function scanVacancyOperational(v: Vacancy): JobOperationalHit[] {
  const hits: JobOperationalHit[] = [];
  const base = { vacancyId: v.id, jobTitle: v.jobTitle, jobUrl: v.jobUrl, currentness: v.currentness };
  const seen = new Set<OperationalFact>();

  // The title alone is evidence that a partner role is being recruited — and nothing more.
  if (PARTNER_ROLE_TITLE.test(v.jobTitle)) {
    hits.push({
      ...base, fact: 'partner_role_hiring', quote: v.jobTitle, rule: 'partner_role_title',
      proves: 'the company is currently recruiting for a partner-facing role',
      doesNotProve: 'that a partner team already exists, how large it is, or that the company is evaluating any software',
    });
    seen.add('partner_role_hiring');
  }

  if (!v.description) return hits;

  for (const s of sentences(v.description)) {
    // A stated team size is the one number this layer will record, because the company
    // volunteered it. "We are hiring a Partner Manager" never becomes a count.
    if (!seen.has('partner_team_size_stated')) {
      const m = s.match(TEAM_SIZE) ?? s.match(TEAM_SIZE_ALT);
      if (m) {
        const raw = m[1].toLowerCase();
        const n = /^\d+$/.test(raw) ? Number(raw) : WORD_NUMBER[raw];
        if (n && n >= 1 && n <= 50) {
          hits.push({
            ...base, fact: 'partner_team_size_stated', quote: s, rule: 'company_states_team_size', statedValue: n,
            proves: `the company states that its partner team has ${n} ${n === 1 ? 'person' : 'people'}`,
            doesNotProve: 'that the number is current, complete, or counts only partner-dedicated staff',
          });
          seen.add('partner_team_size_stated');
        }
      }
    }

    for (const def of FACTS) {
      if (seen.has(def.fact)) continue;   // one advert is one observation per fact
      const hit = def.patterns.find((re) => re.test(s));
      if (!hit) continue;
      hits.push({ ...base, fact: def.fact, quote: window(s, hit), rule: `pattern:${def.fact}`, proves: def.proves, doesNotProve: def.doesNotProve });
      seen.add(def.fact);
    }
  }

  return hits;
}
