/**
 * Trade-channel detection.
 *
 * WHY A SEPARATE MODULE
 *   Phase A+B recovered `vaillant.de/kontakt/fachpartner-finden/heizungsbauer-in-der-naehe/`,
 *   whose text reads "Ihr Vaillant **Fachpartner**" and "unseren **zertifizierten**
 *   Heizungsbauer". The production programme and surface detectors returned EMPTY on it. The
 *   page was in hand and the vocabulary could not read it — which is precisely the order the
 *   audit predicted: fix sources first, and vocabulary becomes the next binding constraint.
 *
 *   This lives outside the production detectors so the deployed dossier behaviour is
 *   unchanged until the results are reviewed.
 *
 * THE DISTINCTION THAT MATTERS MOST HERE
 *   A locator is not a programme. "Find a Vaillant specialist near you" is addressed to a
 *   CONSUMER and proves an organised partner network exists. "Become a Vaillant specialist
 *   partner" is addressed to a BUSINESS and proves the company recruits and manages one.
 *   Both are useful and they are different facts, so they are typed separately and never
 *   merged.
 */

export type DirectoryType =
  | 'reseller_directory' | 'dealer_locator' | 'installer_locator' | 'service_network'
  | 'solution_partner_directory' | 'msp_directory' | 'distributor_directory'
  | 'technology_partner_directory' | 'affiliate_directory' | 'unknown_directory';

export type TradeMotion =
  | 'dealer' | 'installer' | 'distributor' | 'reseller' | 'system_integrator'
  | 'msp' | 'service_partner' | 'oem_partner' | 'solution_partner';

export type TradeSurface =
  | 'partner_recruitment' | 'partner_locator' | 'certification' | 'training'
  | 'partner_portal' | 'territory' | 'lead_routing' | 'tiering';

export interface TradeHit<T extends string> {
  kind: T;
  quote: string;
  language: string;
  rule: string;
  proves: string;
  doesNotProve: string;
}

const W = (s: string) => `(?:^|[^\\p{L}])(?:${s})(?![\\p{L}])`;

/**
 * Compound-aware matching. German and Dutch build single words where English uses two, so
 * whitespace tokenisation misses them entirely: `installatiepartners`, `Vertriebspartner`,
 * `Fachpartnersuche`. Each pattern therefore allows the term to sit inside a longer compound.
 */
const COMPOUND = (stem: string) => `\\p{L}*${stem}\\p{L}*`;

/* ── motions ─────────────────────────────────────────────────────────────── */

const MOTIONS: { kind: TradeMotion; lang: string; re: RegExp; proves: string }[] = [
  { kind: 'installer', lang: 'de', re: new RegExp(W(COMPOUND('fachpartner') + '|' + COMPOUND('fachbetrieb') + '|' + COMPOUND('fachhandwerk') + '|' + COMPOUND('installateur')), 'iu'),
    proves: 'the company organises a network of qualified installation firms' },
  { kind: 'installer', lang: 'nl', re: new RegExp(W(COMPOUND('installatiepartner') + '|' + COMPOUND('installateur') + '|' + COMPOUND('vakinstallateur')), 'iu'),
    proves: 'the company organises a network of qualified installation firms' },
  { kind: 'installer', lang: 'fr', re: new RegExp(W(COMPOUND('installateur') + '|installateurs agréés'), 'iu'),
    proves: 'the company organises a network of qualified installation firms' },
  { kind: 'dealer', lang: 'de', re: new RegExp(W(COMPOUND('fachhändler') + '|' + COMPOUND('fachhaendler') + '|' + COMPOUND('vertragshändler')), 'iu'),
    proves: 'the company appoints dealers to sell its products' },
  { kind: 'dealer', lang: 'nl', re: new RegExp(W(COMPOUND('dealer') + '|' + COMPOUND('verdeler') + '|' + COMPOUND('verkooppunt')), 'iu'),
    proves: 'the company appoints dealers to sell its products' },
  { kind: 'reseller', lang: 'de', re: new RegExp(W(COMPOUND('wiederverkäufer') + '|' + COMPOUND('vertriebspartner')), 'iu'),
    proves: 'the company appoints resellers or sales partners' },
  { kind: 'reseller', lang: 'nl', re: new RegExp(W(COMPOUND('wederverkoper')), 'iu'),
    proves: 'the company appoints resellers' },
  { kind: 'reseller', lang: 'fr', re: new RegExp(W(COMPOUND('revendeur')), 'iu'),
    proves: 'the company appoints resellers' },
  { kind: 'service_partner', lang: 'de', re: new RegExp(W(COMPOUND('servicepartner') + '|' + COMPOUND('wartungspartner') + '|' + COMPOUND('servicenetz')), 'iu'),
    proves: 'the company organises partners for service and maintenance' },
  { kind: 'service_partner', lang: 'en', re: /\b(service|maintenance)\s+partners?\b|\bservice\s+(network|centres?|centers?)\b/i,
    proves: 'the company organises partners for service and maintenance' },
  { kind: 'system_integrator', lang: 'en', re: /\bsystems?\s+integrators?\b|\bintegrator\s+(network|program(me)?|partners?)\b/i,
    proves: 'the company works with systems integrators as a route to market' },
  { kind: 'system_integrator', lang: 'de', re: new RegExp(W(COMPOUND('systemintegrator')), 'iu'),
    proves: 'the company works with systems integrators as a route to market' },
  { kind: 'msp', lang: 'en', re: /\b(MSP|MSSP)\b|\bmanaged[- ]service[- ]providers?\b/i,
    proves: 'the company runs a route to market through managed service providers' },
  { kind: 'oem_partner', lang: 'en', re: /\bOEM\s+(partners?|program(me)?)\b|\bdesign[- ]in\s+(registration|program(me)?)\b/i,
    proves: 'the company operates an OEM or design-in partner track' },
  { kind: 'distributor', lang: 'de', re: new RegExp(W(COMPOUND('vertriebspartner') + '|autorisierte\\s+distributoren'), 'iu'),
    proves: 'the company names authorised distributors' },
  // English trade terms. The first pass covered DE/NL/FR and left these out, so Niko's
  // English "Find your Niko distributor" matched nothing at all.
  { kind: 'distributor', lang: 'en', re: /\b(authoriz?ed\s+distributors?|find\s+(your|a)\s+\w{0,14}\s?distributor|distributor\s+(locator|network|directory))\b/i,
    proves: 'the company names distributors as a route to market' },
  { kind: 'dealer', lang: 'en', re: /\b(authoriz?ed\s+dealers?|dealer\s+(locator|network|directory)|find\s+a\s+dealer|where\s+to\s+buy)\b/i,
    proves: 'the company appoints dealers to sell its products' },
  { kind: 'installer', lang: 'en', re: /\b(certified|approved|authoriz?ed|accredited)\s+installers?\b|\binstaller\s+(network|locator|program(me)?|directory)\b|\bfind\s+an\s+installer\b/i,
    proves: 'the company organises a network of qualified installation firms' },
  { kind: 'solution_partner', lang: 'en', re: /\bsolution\s+(partners?|providers?)\b|\btechnology\s+partners?\b/i,
    proves: 'the company names solution or technology partners' },
];

/* ── surfaces ────────────────────────────────────────────────────────────── */

const SURFACES: { kind: TradeSurface; lang: string; re: RegExp; proves: string; doesNotProve: string }[] = [
  // Addressed to a BUSINESS: the company recruits partners.
  { kind: 'partner_recruitment', lang: 'de', re: /\b(fachpartner|partner|händler|vertriebspartner|installateur)\s+werden\b|\bwerden sie\s+\w{0,12}(partner|händler)\b/iu,
    proves: 'the company publicly invites firms to join its partner network',
    doesNotProve: 'how many join, or that the network is actively managed' },
  { kind: 'partner_recruitment', lang: 'nl', re: /\b(partner|dealer|installateur|verdeler)\s+worden\b|\bword\s+(onze\s+)?(partner|dealer|installateur)\b/iu,
    proves: 'the company publicly invites firms to join its partner network',
    doesNotProve: 'how many join, or that the network is actively managed' },
  { kind: 'partner_recruitment', lang: 'fr', re: /\bdevenir\s+(un\s+)?(partenaire|revendeur|installateur|distributeur)\b/iu,
    proves: 'the company publicly invites firms to join its partner network',
    doesNotProve: 'how many join, or that the network is actively managed' },
  // Addressed to a CONSUMER: an organised network exists, which is a different fact.
  { kind: 'partner_locator', lang: 'de', re: /\b(händlersuche|fachpartner\s*(finden|suche)|installateur\s*(finden|suche)|partner\s*finden|bezugsquellen)\b/iu,
    proves: 'the company publishes a searchable directory of its partners',
    doesNotProve: 'that it recruits, tiers or manages them — a locator is addressed to buyers, not to partners' },
  { kind: 'partner_locator', lang: 'nl', re: /\b(dealer\s*zoeken|installateur\s*zoeken|verkooppunten|vind\s+een\s+(dealer|installateur))\b/iu,
    proves: 'the company publishes a searchable directory of its partners',
    doesNotProve: 'that it recruits, tiers or manages them' },
  { kind: 'partner_locator', lang: 'fr', re: /\b(trouver\s+un\s+(revendeur|installateur|distributeur)|points?\s+de\s+vente|où\s+acheter)\b/iu,
    proves: 'the company publishes a searchable directory of its partners',
    doesNotProve: 'that it recruits, tiers or manages them' },
  { kind: 'certification', lang: 'de', re: /\b(zertifizierte[rn]?|geprüfte[rn]?|autorisierte[rn]?)\s+\p{L}*(partner|händler|betrieb|installateur|handwerker)/iu,
    proves: 'the company formally distinguishes qualified partners',
    doesNotProve: 'how many are certified, or what certification requires' },
  { kind: 'certification', lang: 'nl', re: /\b(gecertificeerde?|erkende?)\s+\p{L}*(partner|dealer|installateur)/iu,
    proves: 'the company formally distinguishes qualified partners',
    doesNotProve: 'how many are certified' },
  { kind: 'training', lang: 'de', re: /\b(partner|händler|installateur)\p{L}*\s*(schulung|akademie|weiterbildung|training)\b|\b(schulungen|akademie)\s+für\s+\p{L}*partner/iu,
    proves: 'the company produces training specifically for partners',
    doesNotProve: 'that partners attend it' },
  { kind: 'partner_portal', lang: 'de', re: /\b(partnerportal|händlerportal|fachpartnerportal|partner[- ]login|profi[- ]?portal)\b/iu,
    proves: 'partners have an authenticated destination',
    doesNotProve: 'what is inside it — a portal is invisible to public research by design' },
  { kind: 'partner_portal', lang: 'nl', re: /\b(partnerportaal|dealerportaal|installateursportaal|partner[- ]login)\b/iu,
    proves: 'partners have an authenticated destination',
    doesNotProve: 'what is inside it' },
  { kind: 'lead_routing', lang: 'de', re: /\b(anfragen|kundenanfragen|leads?)\b[^.]{0,60}\b(weitergeleitet|weiterleiten|vermitteln|vermittelt)\b/iu,
    proves: 'the company routes customer enquiries to its partners',
    doesNotProve: 'the volume of enquiries or how they are allocated' },
  { kind: 'lead_routing', lang: 'nl', re: /\b(aanvragen|leads?|klantaanvragen)\b[^.]{0,60}\b(doorsturen|doorgestuurd|doorverwezen)\b/iu,
    proves: 'the company routes customer enquiries to its partners',
    doesNotProve: 'the volume of enquiries' },
  { kind: 'tiering', lang: 'de', re: /\b(gold|silber|platin|bronze|premium|zertifiziert)[- ]?(partner|händler|fachpartner)\b|\bpartner[- ]?(stufen|level)\b/iu,
    proves: 'the partner network is formally tiered',
    doesNotProve: 'how many partners sit in each tier' },
  /**
   * Dutch referral-with-commission. Quatt — Introw's own manufacturing reference customer —
   * publishes "Introduceer klanten, verdien €400 per installatie" and the first pass matched
   * none of it, because the motion is described in plain commercial Dutch rather than in
   * partner vocabulary of any language.
   */
  { kind: 'lead_routing', lang: 'nl', re: /\b(introduceer|breng|verwijs)\s+(klanten|clienten|opdrachtgevers)\b|\bklanten\s+(aanbrengen|doorverwijzen)\b/iu,
    proves: 'the company asks partners to introduce customers to it',
    doesNotProve: 'the volume of introductions, or how they are tracked' },
  { kind: 'tiering', lang: 'nl', re: /\bverdien\s*€?\s*[\d.,]+\s*(per|voor)\s+\w{0,16}\b|\b(vergoeding|commissie|marge)\s+per\s+\w{0,16}\b/iu,
    proves: 'the company publishes what a partner earns per transaction',
    doesNotProve: 'total partner earnings, volume, or that the scheme is actively used' },
  { kind: 'partner_recruitment', lang: 'nl2', re: /\b(meld\s+je\s+(direct\s+)?aan|aanmelden\s+als\s+(partner|installateur|dealer)|word\s+partner)\b/iu,
    proves: 'the company publishes an intake step for prospective partners',
    doesNotProve: 'that applications are reviewed or that a pipeline exists' },
];

/** Product nouns that would otherwise read as channel language. */
const PRODUCT_NOISE = /\b(installateur|dealer)\s*(handbuch|manual|handleiding|anleitung|app|software|tool)\b/iu;

export interface TradeScan {
  motions: TradeHit<TradeMotion>[];
  surfaces: TradeHit<TradeSurface>[];
  directoryType: DirectoryType | null;
}

const CONTEXT = 100;

function excerpt(text: string, m: RegExpMatchArray): string {
  const i = m.index ?? 0;
  return text.slice(Math.max(0, i - CONTEXT), i + m[0].length + CONTEXT).replace(/\s+/g, ' ').trim();
}

/** Classify a locator by the motion it lists. Types carry different commercial meaning. */
export function directoryTypeFor(motions: TradeMotion[], text: string): DirectoryType | null {
  if (/\baffiliate\b/i.test(text)) return 'affiliate_directory';
  if (motions.includes('msp')) return 'msp_directory';
  if (motions.includes('installer')) return 'installer_locator';
  if (motions.includes('service_partner')) return 'service_network';
  if (motions.includes('dealer')) return 'dealer_locator';
  if (motions.includes('distributor')) return 'distributor_directory';
  if (motions.includes('system_integrator') || motions.includes('solution_partner')) return 'solution_partner_directory';
  if (motions.includes('reseller')) return 'reseller_directory';
  return null;
}

export function scanTrade(pages: { url: string; text: string }[]): TradeScan {
  const motions = new Map<string, TradeHit<TradeMotion>>();
  const surfaces = new Map<string, TradeHit<TradeSurface>>();

  for (const p of pages) {
    if (PRODUCT_NOISE.test(p.text)) continue;
    for (const def of MOTIONS) {
      const m = p.text.match(def.re);
      if (!m) continue;
      if (motions.has(def.kind)) continue;   // one fact per kind, whatever language matched
      motions.set(def.kind, {
        kind: def.kind, quote: excerpt(p.text, m), language: def.lang, rule: `trade_motion:${def.kind}`,
        proves: def.proves,
        doesNotProve: 'that the relationship is commercially managed, or that the company operates it rather than participates in it',
      });
    }
    for (const def of SURFACES) {
      const m = p.text.match(def.re);
      if (!m) continue;
      if (surfaces.has(def.kind)) continue;
      surfaces.set(def.kind, {
        kind: def.kind, quote: excerpt(p.text, m), language: def.lang, rule: `trade_surface:${def.kind}`,
        proves: def.proves, doesNotProve: def.doesNotProve,
      });
    }
  }

  const kinds = [...new Set([...motions.values()].map((m) => m.kind))];
  return {
    motions: [...motions.values()],
    surfaces: [...surfaces.values()],
    directoryType: directoryTypeFor(kinds, pages.map((p) => p.text).join(' ').slice(0, 20000)),
  };
}
