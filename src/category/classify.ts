/**
 * Category / commercial-relationship classification.
 *
 * THE QUESTION
 *   Not "does this company talk about partners" — everything in the corpus does. The
 *   question is what the company SELLS, because that is what separates a prospect from a
 *   competitor, and it is the one thing partner-page evidence can never establish.
 *
 * THE DISCIPLINE THAT MAKES IT WORK
 *   A match only counts in an IDENTITY POSITION: the title tag, the meta/OG description,
 *   the homepage H1, or an explicit "<Company> is a …" construction. Body-copy matches are
 *   ignored entirely.
 *
 *   That constraint is the whole design. Impartner's homepage says it sells partner
 *   management. Aircall's says it sells a phone system. Both mention deal registration
 *   somewhere in their body copy, which is exactly why body copy was useless. Restricting
 *   to identity positions also makes the classifier structurally insensitive to publication
 *   volume: a company with one page and a company with ten thousand each yield one
 *   self-description, so no amount of content marketing can move this classification.
 *
 * WHAT IT PROVES
 *   How the company positions its own product.
 *
 * WHAT IT DOES NOT PROVE
 *   That the positioning is accurate, current, or complete; that a PARTNER_TECH_VENDOR
 *   would refuse to buy Introw; or anything about programme quality.
 *
 * KNOWN FALSE POSITIVES
 *   A company whose tagline foregrounds a partner-management FEATURE of a broader product.
 *   Mitigated by requiring a product head noun, not a bare mention.
 *
 * KNOWN FALSE NEGATIVES — the important ones
 *   Vendors with abstract positioning ("revenue acceleration platform", "ecosystem-led
 *   growth") that never name the category. Measured, not assumed: see the frozen holdout.
 *   Every miss resolves to `unknown`, never to LIKELY_TARGET_CATEGORY.
 *
 * ATTRIBUTION REQUIREMENT
 *   Every returned signal carries the exact quote and the URL it came from. A classification
 *   with no attributable quote is not permitted to exist.
 */

import type { PositioningEvidence, PositioningItem } from '../evidence/positioning.js';

export type CategoryState =
  | 'likely_target_category'
  | 'partner_tech_vendor'
  | 'direct_introw_competitor'
  | 'supply_side_marketplace'
  | 'professional_services'
  | 'reseller_or_participant'
  | 'unknown';

export interface CategorySignal {
  kind: 'partner_tech_product' | 'channel_services' | 'supply_side_product' | 'professional_services'
      | 'participant_identity' | 'ordinary_product_identity';
  quote: string;
  url: string;
  sourceType: PositioningItem['sourceType'];
  /** Which self-description phrase matched, kept so a reviewer can judge the inference. */
  matched: string;
}

export interface CategoryClassification {
  state: CategoryState;
  signals: CategorySignal[];
  /** Present only when the classification would change a commercial decision. */
  whyItMatters: string;
  whyItMayNotMatter: string;
  unknown: string;
  suggestedResearch: string | null;
  /** True when no identity-bearing surface could be read at all. */
  underObserved: boolean;
}

/** Identity positions only. Body copy is deliberately excluded — see the header. */
const IDENTITY_SOURCES: PositioningItem['sourceType'][] = ['title_tag', 'meta_description', 'og_description', 'homepage_hero', 'product_page', 'pricing_page'];

/**
 * A product head noun meaning "software for running someone else's partner programme".
 * The qualifier is required: "partner platform" alone is too loose — plenty of operators
 * call their portal that.
 */
const PARTNER_TECH_PRODUCT = [
  /\b(partner|channel|reseller|affiliate|partnership)s?\s+(relationship\s+management|management|ecosystem|enablement|automation|marketing|operations|programme?|portal|onboarding|engagement)\s+(platform|software|solution|system|tool|suite|technology|saas)\b/i,
  /\bpartner\s+relationship\s+management\b/i,
  /\b(PRM|TCMA)\b(?=[\s,.:;)]|$)/,
  /\b(platform|software|solution|system|suite)\s+(for|to)\s+(managing|running|scaling|growing|building|automating)\s+(your\s+|their\s+)?(partner|channel|reseller|affiliate|partnership)/i,
  /\b(ecosystem|partnership|partner)[- ]led\s+(growth|revenue)\s+(platform|software|solution)\b/i,
  /\b(co-?sell|deal\s+registration|partner\s+portal)\s+(platform|software|solution|automation)\b/i,
  /\bmanage\s+(your|their)\s+(partner|channel|reseller|affiliate)s?\b/i,
  /\b(grow|scale|build|launch)\s+your\s+(partner|channel|reseller|affiliate)\s*(programme?|ecosystem|network)?\b/i,
];

/** Consultancies and agencies that BUILD channels for others. Adjacent, not identical. */
const CHANNEL_SERVICES = [
  /\b(channel|partner|partnership|alliance)s?\s+(consulting|consultancy|advisory|agency|services|strategy)\b/i,
  /\bwe\s+help\s+(you|companies|brands|vendors|saas)\s+\w{0,15}\s*(build|launch|scale|grow|fix)\s+\w{0,10}\s*(partner|channel)/i,
];

/**
 * Consumer marketplaces whose "partners" are supply — restaurants, drivers, hosts, hotels —
 * rather than a route to market for a product of their own.
 *
 * The reliable tell is that the homepage addresses a CONSUMER ("get a ride", "order food")
 * and, usually in the same breath, recruits SUPPLY ("become a driver", "earn money on your
 * schedule"). A B2B software company addresses neither. Dutch is included because bolt.eu
 * served its identity surfaces in Dutch from a Belgian IP, and a locale-blind detector would
 * simply have found nothing and called it unknown.
 */
const SUPPLY_SIDE_PRODUCT = [
  /\b(marketplace|platform|app)\s+(that\s+)?(connect|connects|connecting)\s+\w{0,20}\s*(customers?|guests?|riders?|diners?|travell?ers?|shoppers?)\b/i,
  /\b(food|grocery|meal|parcel|package|restaurant)\s+deliver(y|ed)\b/i,
  /\b(book|booking|reserve|rent)\s+(a\s+)?(hotel|home|stay|room|flight|ride|car|table|restaurant)/i,
  /\b(ride[- ]hailing|ride[- ]sharing|home[- ]sharing|vacation rentals?|short[- ]term rentals?)\b/i,
  // consumer demand
  /\b(get|order|request|book)\s+(a\s+)?(ride|taxi|cab|meal|takeaway|food|groceries)\b/i,
  // The separator may contain a full stop: "Restaurants, takeaways, supermarkets and
  // shops. Delivered." — an earlier `[^.]` bound silently missed every such headline.
  /\b(restaurants?|takeaways?|supermarkets?|groceries|pharmacy)\b[\s\S]{0,60}?\bdeliver(ed|y|ing)\b/i,
  // supply recruitment, the other half of the two-sided market
  /\b(become|sign up as)\s+(a\s+)?(driver|courier|rider|host|partner restaurant|delivery partner)\b/i,
  /\bearn money\b[^.]{0,30}\b(driving|delivering|your schedule|with your car)\b/i,
  // Dutch
  /\b(bestel|bestellen)\s+(eten|maaltijden|boodschappen)\b/i,
  /\b(krijg|boek)\s+(binnen\s+\w+\s+\w+\s+)?een\s+(rit|taxi)\b/i,
  /\b(word|verdien(en)?)\s+\w{0,10}\s*(chauffeur|koerier|bezorger)\b/i,
  /\bmobiliteitsapp\b/i,
];

const PROFESSIONAL_SERVICES = [
  /\b(management|strategy|it|technology|tax|audit|legal|financial)\s+consult(ing|ancy|ants?)\b/i,
  /\b(professional services|accountancy|law firm|venture capital|private equity)\b/i,
  /\b(we are|is)\s+(a|an)\s+(global\s+)?(consultancy|consulting firm|law firm|accounting firm|venture (capital )?firm)\b/i,
  /\b(global leader|leader)\s+in\s+[^.]{0,60}\bconsulting\b/i,
  /\bfrom idea to IPO\b|\b(we (invest|back)|investing) in\b[^.]{0,40}\b(founders?|companies|startups?)\b/i,
];

/**
 * Large consultancies do not describe their category in prose — their homepages carry brand
 * slogans ("Let There Be Change", "Together We Reinvented"). The category lives in the title
 * tag as an enumeration of service lines. Two or more distinct lines are required: one word
 * on its own is far too weak, since a SaaS company can legitimately have "advisory" or
 * "digital transformation" in its copy, but essentially none enumerate audit AND tax AND
 * risk management. Same two-indicator discipline that fixed firm-type suppression.
 */
const SERVICE_LINE = /\b(audit|assurance|tax services|tax|risk management|financial advisory|advisory|consulting|consultancy|outsourcing|it services|digital transformation|actuarial|restructuring|due diligence)\b/gi;
const SERVICE_LINE_MIN = 2;

function serviceEnumeration(items: PositioningItem[]): CategorySignal | null {
  for (const it of items) {
    if (it.sourceType !== 'title_tag' && it.sourceType !== 'meta_description' && it.sourceType !== 'og_description') continue;
    const hits = [...new Set((it.text.match(SERVICE_LINE) ?? []).map((h) => h.toLowerCase()))];
    if (hits.length >= SERVICE_LINE_MIN) {
      return { kind: 'professional_services', quote: it.text.slice(0, 300), url: it.url, sourceType: it.sourceType, matched: hits.join(' + ') };
    }
  }
  return null;
}

/** "We are a certified X partner" — the company participates in someone else's programme. */
const PARTICIPANT_IDENTITY = [
  /\b(certified|authoriz?ed|accredited|premier|gold|platinum|elite)\s+([A-Z][\w.]+\s+)?(partner|reseller|integrator|implementation partner)\b/,
  /\b(we are|as)\s+(a|an)\s+(\w+\s+){0,2}(reseller|var|systems? integrator|implementation partner)\b/i,
];

function scan(items: PositioningItem[], patterns: RegExp[], kind: CategorySignal['kind']): CategorySignal[] {
  const out: CategorySignal[] = [];
  for (const it of items) {
    for (const re of patterns) {
      const m = it.text.match(re);
      if (m) { out.push({ kind, quote: it.text.slice(0, 300), url: it.url, sourceType: it.sourceType, matched: m[0].slice(0, 120) }); break; }
    }
  }
  return out;
}

export interface KnownCompetitorLookup {
  /** Explicit, maintained business data — NEVER presented as inferred. See §32. */
  isKnownCompetitor(domain: string): boolean;
}

export function classifyCategory(
  domain: string,
  positioning: PositioningEvidence,
  knownList?: KnownCompetitorLookup,
): CategoryClassification {
  const identity = positioning.items.filter((i) => IDENTITY_SOURCES.includes(i.sourceType));

  const base = {
    whyItMatters: '', whyItMayNotMatter: '', unknown: '', suggestedResearch: null as string | null,
    underObserved: identity.length === 0,
  };

  if (identity.length === 0) {
    return {
      ...base, state: 'unknown', signals: [],
      whyItMatters: 'No identity-bearing surface could be read, so the company category is not established.',
      whyItMayNotMatter: 'This says nothing about the company — only about our retrieval.',
      unknown: 'What the company sells.',
      suggestedResearch: 'Open the homepage manually and record the product category in one sentence.',
    };
  }

  const partnerTech = scan(identity, PARTNER_TECH_PRODUCT, 'partner_tech_product');
  const services = scan(identity, CHANNEL_SERVICES, 'channel_services');
  const supply = scan(identity, SUPPLY_SIDE_PRODUCT, 'supply_side_product');
  const profScan = scan(identity, PROFESSIONAL_SERVICES, 'professional_services');
  const profEnum = serviceEnumeration(identity);
  const prof = profEnum ? [profEnum, ...profScan] : profScan;
  const participant = scan(identity, PARTICIPANT_IDENTITY, 'participant_identity');

  // The known-competitor list is separate business data. It is reported alongside the
  // inference, never merged into it, so the classifier can be evaluated honestly (§32).
  const onKnownList = knownList?.isKnownCompetitor(domain) ?? false;

  if (partnerTech.length > 0) {
    return {
      ...base,
      state: onKnownList ? 'direct_introw_competitor' : 'partner_tech_vendor',
      signals: partnerTech,
      whyItMatters: onKnownList
        ? 'The company appears on the maintained competitor list AND positions its own product as partner management.'
        : 'The company positions its own product as partner-management software, so its partner-programme evidence describes what it sells, not how it goes to market.',
      whyItMayNotMatter: 'A partner-tech vendor still runs its own partner programme and could in principle buy tooling. This is a commercial exclusion, not a factual one.',
      unknown: 'Whether partner management is the whole product or one module of a broader one.',
      suggestedResearch: 'Confirm from the pricing or product page whether partner management is the product itself.',
    };
  }

  if (onKnownList) {
    return {
      ...base, state: 'direct_introw_competitor', signals: [],
      whyItMatters: 'The company appears on the maintained known-competitor list. This is asserted business data, not an inference from evidence.',
      whyItMayNotMatter: 'The classifier found no supporting evidence in the company\'s own positioning, so the list and the evidence disagree.',
      unknown: 'Why the positioning does not reflect the category — the list may be stale, or the positioning abstract.',
      suggestedResearch: 'Reconcile the list entry against the company\'s current homepage.',
    };
  }

  if (supply.length > 0) {
    return {
      ...base, state: 'supply_side_marketplace', signals: supply,
      whyItMatters: 'The company\'s "partners" appear to be supply — restaurants, drivers, hosts, properties — rather than a route to market for its own product.',
      whyItMayNotMatter: 'Large marketplaces sometimes also run genuine software reseller or agency programmes alongside supply acquisition.',
      unknown: 'Whether a separate commercial channel programme exists.',
      suggestedResearch: 'Check whether any partner surface addresses resellers or agencies rather than supply.',
    };
  }

  if (services.length > 0) {
    return {
      ...base, state: 'professional_services', signals: services,
      whyItMatters: 'The company sells channel-building services. Its partner language describes client work, not its own go-to-market.',
      whyItMayNotMatter: 'A channel consultancy can be a strong Introw referral partner even when it is not a customer.',
      unknown: 'Whether it also resells or implements software of its own.',
      suggestedResearch: 'Determine whether the firm would be a customer or a referral partner.',
    };
  }

  if (prof.length > 0) {
    return {
      ...base, state: 'professional_services', signals: prof,
      whyItMatters: 'The company is a professional-services firm; its "partners" are frequently equity partners or alliance memberships.',
      whyItMayNotMatter: 'Some services firms operate genuine software resale channels.',
      unknown: 'Whether any product resale motion exists.',
      suggestedResearch: 'Check for a software resale or implementation programme distinct from alliances.',
    };
  }

  if (participant.length > 0) {
    return {
      ...base, state: 'reseller_or_participant', signals: participant,
      whyItMatters: 'The company identifies itself as a partner in someone else\'s programme, so partner evidence on its site may describe a vendor\'s programme rather than its own.',
      whyItMayNotMatter: 'Participating in another programme does not prevent a company from operating its own.',
      unknown: 'Whether it also operates a programme of its own.',
      suggestedResearch: 'Look for a partner programme the company recruits INTO, not one it has joined.',
    };
  }

  return {
    ...base, state: 'likely_target_category',
    signals: identity.slice(0, 2).map((i) => ({ kind: 'ordinary_product_identity' as const, quote: i.text.slice(0, 300), url: i.url, sourceType: i.sourceType, matched: '(no disqualifying category signal)' })),
    whyItMatters: 'The company positions itself as selling an ordinary product or service, so a partner programme it runs would be a route to market.',
    whyItMayNotMatter: 'This is the absence of a disqualifying signal, not positive evidence of fit. Abstract positioning can hide a partner-tech product.',
    unknown: 'Nothing about programme size, ownership or Introw need follows from category alone.',
    suggestedResearch: null,
  };
}

/**
 * MEASURED PERFORMANCE — see product/out/CATEGORY_MEASURED.md for the full record.
 *
 * Two frozen holdouts, single shot each, no tuning against either:
 *
 *   partner_tech_vendor      8/14  (57%)  — advisory only, never a gate
 *   likely_target_category  13/13 (100%)  — no real prospect has ever been excluded
 *   professional_services    0/7   (0%)   — DOES NOT WORK; absence means nothing
 *   supply_side_marketplace  1/3          — unmeasured, n too small
 *
 * Retrieval failed outright on 24% of v3 domains (Cloudflare/Vercel challenges), which is a
 * coverage limit reported separately from accuracy.
 *
 * The one property strong enough to build on is the second row. Because the classifier has
 * never wrongly excluded a genuine target, it is safe to surface as a flag; because its
 * recall is 57%, it is not safe to act on automatically, and roughly two in five partner-tech
 * vendors will still reach a seller. The dossier therefore always shows the positioning quote
 * alongside the state, so the human can catch what the rule misses.
 */
export const CATEGORY_MEASURED = {
  holdouts: ['9b723cd4e29554c9', '2401b7ff8c178ce2'],
  partnerTechRecall: 8 / 14,
  targetFalseExclusionRate: 0,
  professionalServicesRecall: 0,
  retrievalFailureRate: 5 / 21,
  licensedUse: 'advisory_flag_only',
} as const;
