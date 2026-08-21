/**
 * Entity resolution v2.
 *
 * Phase 1 measured this as the largest single cause of industrial false negatives —
 * larger than any evidence problem. Six of twenty-one industrial candidates resolved to
 * parked or dead domains, and `bata.com` resolved to a shoe manufacturer for what was an
 * electrical brand on a Belgian wholesaler's list.
 *
 * Three changes follow, all generalisable:
 *
 *  1. **Candidate generation** handles the name shapes industrial brands actually use —
 *     ampersands, hyphens, umlauts, abbreviations, first-token brands.
 *  2. **Context corroboration.** A live site that mentions the name is not enough. The
 *     resolved company must also be plausible given where it was discovered: an
 *     electrical wholesaler's brand list should not resolve to a footwear company.
 *  3. **Explicit states.** Ambiguity is reported, not silently resolved, and alternatives
 *     are preserved. Identity confidence is independent of channel confidence.
 */

import { get, mainContent, stripTags } from '../lib/http.js';
import type { Confidence } from '../domain/types.js';

export type IdentityState =
  | 'confirmed'      // the discovering source linked out to it, or the site names the company and fits the context
  | 'probable'       // the site names the company but context could not be corroborated
  | 'ambiguous'      // one or more live candidates, none corroborated
  | 'wrong_entity'   // a live site that is demonstrably a different company
  | 'dead_domain'    // resolves but serves nothing usable
  | 'unresolved';    // no candidate responded

export interface ResolutionCandidate {
  domain: string;
  live: boolean;
  namesCompany: boolean;
  contextFit: 'fit' | 'mismatch' | 'unknown';
  title: string | null;
  note: string;
}

export interface Resolution {
  input: string;
  domain: string | null;
  state: IdentityState;
  confidence: Confidence;
  method: string;
  /** Kept so a human can adjudicate rather than re-do the search. */
  alternatives: ResolutionCandidate[];
  probes: number;
  /** Set when the resolved site says the brand belongs to a parent group. */
  parentHint?: string;
}

/* ────────────────────────────────────────────── name normalisation ─────── */

const LEGAL_SUFFIX = /\b(gmbh|mbh|bv|b\.v|nv|n\.v|sa|s\.a|sas|sarl|srl|spa|s\.p\.a|ltd|limited|inc|incorporated|llc|plc|ag|kg|kgaa|se|oy|oyj|ab|aps|a\/s|as|holding|holdings|group|groupe|gruppe|international|worldwide|europe|benelux|deutschland|france|italia|espana|nederland)\b/gi;
const NOISE = /\b(the|and|und|et|en|of|for|by|technologies|technology|systems|solutions|products|industries|industrie|electric|electronics|elektro)\b/gi;

export function normalise(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[+&]/g, ' and ')
    .replace(LEGAL_SUFFIX, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Tokens that actually identify the company, with noise words removed. */
export function identityTokens(name: string): string[] {
  const stripped = normalise(name).replace(NOISE, ' ');
  const tokens = stripped.split(/\s+/).filter((t) => t.length > 1);
  return tokens.length ? tokens : normalise(name).split(/\s+/).filter((t) => t.length > 1);
}

/**
 * Hostname labels to try, most specific first.
 * Industrial brands are frequently hyphenated (`Pepperl+Fuchs` → pepperl-fuchs),
 * abbreviated to a first token (`LAPP CABLE` → lapp), or joined across an ampersand
 * (`LEINE & LINDE` → leinelinde). Guessing only the collapsed form loses the segment.
 */
export function labelCandidates(name: string): string[] {
  const words = normalise(name).split(/\s+/).filter((w) => w.length > 1);
  const meaningful = words.filter((w) => w !== 'and');
  const out = new Set<string>();
  if (!meaningful.length) return [];

  out.add(meaningful.join(''));
  if (meaningful.length > 1) {
    out.add(meaningful.join('-'));
    out.add(meaningful.slice(0, 2).join(''));
    out.add(meaningful.slice(0, 2).join('-'));
    out.add(meaningful[0]);
  }
  // "X and Y" also lives as x-y and xy, already covered, plus "xandy".
  if (words.includes('and')) out.add(words.join(''));
  return [...out].filter((l) => l.length >= 3 && l.length <= 40);
}

const TLDS = ['com', 'de', 'nl', 'be', 'eu', 'io', 'fr', 'at', 'ch', 'it', 'es', 'se', 'dk', 'fi', 'pl', 'co.uk', 'net'];

/* ──────────────────────────────────────────── context corroboration ────── */

/**
 * Vocabulary that indicates a company operates in a given business context.
 * Used only to REFUTE an otherwise-plausible match — never to confirm one on its own.
 */
const CONTEXT_VOCAB: Record<string, RegExp> = {
  electrical_industrial: /\b(electrical|electronics|automation|industrial|sensor|installation|cable|lighting|switchgear|enclosure|elektro|elektrisch|installatie|verlichting|schakel|automatisering|industrie|kabel|leuchte|schalter|beleuchtung|capteur|éclairage|armoire)\b/i,
  cybersecurity: /\b(security|cyber|threat|malware|endpoint|firewall|zero trust|detection|soc\b|siem|vulnerabilit)\b/i,
  it_security: /\b(security|cyber|backup|storage|network|cloud|endpoint|data protection|infrastructure|software|it\b)\b/i,
  prm_tenant: /./,
};

/**
 * Consumer/service business vocabulary that CONTRADICTS a B2B industrial or software
 * context. Multilingual for the same reason the channel lexicon is: bata.com describes
 * itself as a "magasin de chaussures", and an English-only check reads that as neutral.
 */
const CONSUMER_CONFLICT = /\b(footwear|shoes|sneakers|apparel|clothing store|chaussures|schuhe|schoenen|scarpe|zapatos|kleding|bekleidung|restaurant|hotel|voyage|travel agency|insurance|verzekering|versicherung|law firm|cabinet d'avocats|advocatenkantoor|uitzendbureau|cosmetic|cosmétique|kosmetik|jouets|speelgoed|meubles|meubelen|möbel|real estate|immobilier|vastgoed|immobilien|supermark|grocer)\b/i;

/** Contexts that positively CONTRADICT another context — used to catch wrong entities. */
const CONTEXT_CONFLICT: Record<string, RegExp> = {
  electrical_industrial: CONSUMER_CONFLICT,
  cybersecurity: CONSUMER_CONFLICT,
  it_security: CONSUMER_CONFLICT,
  prm_tenant: /(?!)/,
};

/**
 * A brand page that says it belongs to a parent group. Recorded rather than discarded:
 * where a brand is owned by a parent, the partner programme is frequently the parent's,
 * which is a Track B ownership question rather than a resolution failure.
 */
const PARENT_OF = /\b(?:is (?:now )?(?:part of|a (?:brand|company|division|subsidiary) of)|belongs to|a\s+([A-Z][\w&.\- ]{2,40}?)\s+(?:company|group|brand))\b[^.]{0,60}/i;
const PARENT_NAMED = /\b(?:part of|a (?:brand|company|division|subsidiary) of|belongs to)\s+([A-Z][\w&.\- ]{2,40})/;

/** A page that exists only to point elsewhere, or carries no real content. */
const STUB = /\b(notre site se trouve|our (?:new )?(?:site|website) (?:is|can be found)|deze website is verhuisd|diese seite ist umgezogen|redirecting|weiterleitung)\b/i;

/**
 * Refutation must be at least as well-evidenced as confirmation.
 *
 * A single stray consumer word anywhere in 4,000 characters is not proof of a different
 * company — an over-broad first version flipped Netskope to `wrong_entity` on the word
 * "mode". A mismatch therefore requires the conflicting vocabulary to be PROMINENT:
 * present in the page title, or repeated in the body.
 */
function assessContext(title: string, body: string, context: string | undefined): 'fit' | 'mismatch' | 'unknown' {
  if (!context) return 'unknown';
  const conflict = CONTEXT_CONFLICT[context];
  if (conflict) {
    const inTitle = conflict.test(title);
    const occurrences = (body.match(new RegExp(conflict.source, 'gi')) ?? []).length;
    if (inTitle || occurrences >= 2) return 'mismatch';
  }
  const vocab = CONTEXT_VOCAB[context];
  if (vocab && (vocab.test(title) || vocab.test(body))) return 'fit';
  return 'unknown';
}

/* ─────────────────────────────────────────────────────── resolution ────── */

const PARKED = /\b(domain (?:is )?(?:for sale|may be for sale|parked)|buy this domain|coming soon|under construction|in aanbouw|im aufbau|en construction|strona w budowie|default web page|apache2 (?:ubuntu|debian) default)\b/i;

export interface ResolveOptions {
  /** Page that listed the company; its outbound links are the strongest signal. */
  hintUrl?: string;
  /** Business context implied by the discovery source, used to refute wrong entities. */
  context?: string;
  maxProbes?: number;
}

export async function resolveEntity(name: string, opts: ResolveOptions = {}): Promise<Resolution> {
  const { hintUrl, context, maxProbes = 18 } = opts;
  const tokens = identityTokens(name);
  const alternatives: ResolutionCandidate[] = [];
  let probes = 0;

  const fail = (state: IdentityState, method: string): Resolution =>
    ({ input: name, domain: null, state, confidence: 'low', method, alternatives, probes });

  if (!tokens.length) return fail('unresolved', 'name produced no identifying tokens');

  // ── 1. The discovering page linked out to the company ────────────────────
  if (hintUrl) {
    const r = await get(hintUrl, { timeout: 25000 });
    probes++;
    if (r.ok && r.body) {
      const selfHost = new URL(r.finalUrl ?? hintUrl).hostname.replace(/^www\./, '');
      const counts = new Map<string, number>();
      for (const m of r.body.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)) {
        try {
          const h = new URL(m[1]).hostname.replace(/^www\./, '');
          if (!h || h === selfHost || h.endsWith('.' + selfHost) || selfHost.endsWith('.' + h)) continue;
          if (/(facebook|twitter|x\.com|linkedin|youtube|instagram|google|apple|w3\.org|schema|cookie|vimeo|cdn|cloudinary|bunny|hubs\.ly|powerbi|wpengine|gstatic|fonts)/i.test(h)) continue;
          counts.set(h, (counts.get(h) ?? 0) + 1);
        } catch { /* skip */ }
      }
      const hit = [...counts.keys()].find((h) => {
        const label = normalise(h.split('.')[0]).replace(/\s+/g, '');
        return tokens.some((t) => label.includes(t) || t.includes(label));
      });
      if (hit) {
        return {
          input: name, domain: hit, state: 'confirmed', confidence: 'high',
          method: 'the discovering page links out to a domain matching the company name',
          alternatives, probes,
        };
      }
    }
  }

  // ── 2. Generate and verify candidates ────────────────────────────────────
  let sawDead = false;
  for (const label of labelCandidates(name)) {
    for (const tld of TLDS) {
      if (probes >= maxProbes) break;
      const domain = `${label}.${tld}`;
      if (alternatives.some((a) => a.domain === domain)) continue;
      probes++;

      let hit = await get(`https://www.${domain}/`, { timeout: 10000 });
      if (!hit.ok || !hit.body) hit = await get(`https://${domain}/`, { timeout: 10000 });
      if (!hit.ok || !hit.body || hit.body.length < 400) continue;

      const title = /<title[^>]*>([\s\S]{0,200}?)<\/title>/i.exec(hit.body)?.[1]?.trim() ?? null;
      const text = `${title ?? ''} ${mainContent(hit.body).slice(0, 4000)}`;
      const flat = normalise(text).replace(/\s+/g, '');

      const visible = stripTags(hit.body).slice(0, 2000);
      // A stub that only points elsewhere is not the company's site, and a page with
      // almost no text cannot corroborate anything.
      if (PARKED.test(visible) || STUB.test(visible) || flat.length < 200) {
        sawDead = true;
        alternatives.push({ domain, live: true, namesCompany: false, contextFit: 'unknown', title, note: 'parked, redirect stub, or too little content to corroborate' });
        continue;
      }

      const namesCompany = tokens.every((t) => flat.includes(t));
      const contextFit = assessContext(title ?? '', mainContent(hit.body).slice(0, 6000), context);
      alternatives.push({ domain, live: true, namesCompany, contextFit, title, note: namesCompany ? 'names the company' : 'live but does not name the company' });

      if (namesCompany && contextFit === 'mismatch') {
        // The name matches but the business does not. This is the bata.com case: a real
        // company with the right name in the wrong industry.
        continue;
      }
      const parentHint = PARENT_OF.test(text) ? (PARENT_NAMED.exec(text)?.[1]?.trim() ?? undefined) : undefined;
      if (namesCompany && contextFit === 'fit') {
        return { input: name, domain, state: 'confirmed', confidence: 'high', method: `guessed ${domain}; page names the company and matches the ${context} context`, alternatives, probes, parentHint };
      }
      if (namesCompany) {
        return { input: name, domain, state: 'probable', confidence: 'medium', method: `guessed ${domain}; page names the company but the business context could not be corroborated`, alternatives, probes, parentHint };
      }
    }
    if (probes >= maxProbes) break;
  }

  const nameMatchesWrongContext = alternatives.filter((a) => a.namesCompany && a.contextFit === 'mismatch');
  if (nameMatchesWrongContext.length) {
    return { input: name, domain: null, state: 'wrong_entity', confidence: 'medium',
      method: `${nameMatchesWrongContext.map((a) => a.domain).join(', ')} names the company but operates in a conflicting business context — likely a different organisation of the same name`,
      alternatives, probes };
  }
  if (alternatives.some((a) => a.live && a.namesCompany === false) && !sawDead) {
    return fail('ambiguous', `${alternatives.length} live candidates, none naming the company`);
  }
  if (sawDead) return fail('dead_domain', 'candidate domains are parked, placeholder or empty');
  return fail('unresolved', 'no candidate domain responded');
}
