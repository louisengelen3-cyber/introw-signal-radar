/**
 * Evidence attribution guard.
 *
 * WHY THIS EXISTS
 *   Two independent blind reviewers found the same failure: probes matching a single word
 *   out of context, then carrying a confident label the quote does not support.
 *
 *     Trengo   "AI Journeys will bring leads and customers to their answers, fast. 98%
 *               WhatsApp open rate"  — homepage chat marketing, labelled "partners bring
 *               it leads". It matched on `leads`.
 *     Mews     a webinar about "Partial Rebates" — correcting a guest's hotel bill —
 *               labelled "the company pays partners for commercial outcomes". Matched
 *               on `rebate`.
 *     Productsup  a wholesaler/distributor CUSTOMER-SEGMENT page read as a distributor
 *               partner programme.
 *
 *   In each case the quote sits right beside the label, so a careful reader catches it. But
 *   the commercial summary repeats the label without the quote, and a seller working two
 *   hundred accounts skims summaries. A label the quote cannot support is therefore worse
 *   than no evidence at all.
 *
 * THE RULE
 *   An observation may only support a partner claim if it is ATTRIBUTABLE to the partner
 *   motion — either it came from a genuine partner section of the site, or the quote itself
 *   contains partner vocabulary. Everything else is dropped, not downgraded: a claim that
 *   cannot be attributed is not weak evidence, it is evidence about something else.
 *
 * WHAT IT DOES NOT FIX
 *   A quote that is genuinely about partners but genuinely means something else — a vendor
 *   glossary, a participant page. Category classification and the participant checks handle
 *   those, and they are imperfect too.
 */

/** Path segments that are unambiguously the company's own partner section. */
// Prefix-matched on the segment, so `/partner-terms-and-conditions` and `/partner-hub`
// count. Trengo's partner T&Cs name the PRM it runs, and an exact-match list missed the
// single most commercially decisive page in the corpus.
const PARTNER_SEGMENT = /^(partners?|partnerships?|resellers?|channel|agencies|partenaires|partnerprogramm|partnerprogramma)(-[a-z-]+)?$/i;
const PARTNER_HOST = /^(partners?|reseller|channel|partnerportal|partnerlisting)\./i;

/**
 * What must appear in the quote when the source is NOT a partner page.
 *
 * The first version accepted any occurrence of the token "partner", which was close to
 * vacuous: the detectors matched on partner vocabulary to begin with, so almost every quote
 * they produced contained it. Tested against the four cases this guard exists to stop, it
 * caught one — and only because that particular 220-character window happened to omit the
 * word.
 *
 * The bar is now a PROGRAMME-RELATIONSHIP construction — the company and a partner in a
 * defined commercial relationship — not the bare noun. "Hotel partners get partial rebates"
 * no longer qualifies; "become a partner" and "our reseller programme" do.
 */
const PARTNER_RELATIONSHIP = new RegExp([
  String.raw`\b(our|its|their)\s+(partner|partners|reseller|resellers|channel|agency|agencies|integrator|integrators)\b`,
  String.raw`\b(become|join|apply to be|sign up as)\s+(a|an|our)?\s*(partner|reseller|distributor|affiliate|agency)\b`,
  String.raw`\b(partner|reseller|channel|affiliate|agency|referral|distributor)\s+(program(me)?|network|portal|tier|tiers|directory|agreement|terms|manager|team)\b`,
  String.raw`\b(partner with us|partner programme?|word partner|devenir partenaire|partner werden|partnerprogramma)\b`,
  String.raw`\b(certified|authoriz?ed|accredited)\s+(partner|reseller|installer|agency|integrator)s?\b`,
  String.raw`\bpartners?\s+(can|will|may|receive|earn|register|resell|refer|deliver|implement|get)\b`,
].join('|'), 'i');

export interface Attributable {
  quote: string;
  sourceUrl?: string;
}

export function isPartnerSource(sourceUrl: string | undefined): boolean {
  if (!sourceUrl) return false;
  try {
    const u = new URL(sourceUrl);
    if (PARTNER_HOST.test(u.hostname)) return true;
    return u.pathname.split('/').filter(Boolean).some((s) => PARTNER_SEGMENT.test(s));
  } catch { return false; }
}

/**
 * Content-marketing sections, where partner vocabulary is the SUBJECT of an article rather
 * than a claim about the company.
 *
 * juro.com/contract-templates/reseller-agreement is a free downloadable contract template
 * published for search traffic. Its boilerplate — "The reseller, in turn, earns margin on
 * the deals it closes" — contains the word `reseller`, passed the vocabulary check, and
 * produced the summary sentence "Public pages describe a reseller motion" for a company with
 * no partner programme at all. That is FP-3, definitional content, the same mechanism that
 * killed the previous product, arriving through the one consumer the guard did not cover.
 *
 * A content path is disqualifying outright: no quote from /blog, /glossary, /customers or
 * /contract-templates may support a claim about this company's partner motion.
 */
const CONTENT_SEGMENT = /^(blog|glossary|resources?|learn|guides?|academy|insights|news|templates?|contract-templates|library|help|docs|support|customers?|case-stud(y|ies)|stories|press|newsroom|events?|webinars?|ebooks?|whitepapers?|wholesalers?-and-distributors)$/i;

export function isContentPath(sourceUrl: string | undefined): boolean {
  if (!sourceUrl) return false;
  try {
    return new URL(sourceUrl).pathname.split('/').filter(Boolean).some((s) => CONTENT_SEGMENT.test(s));
  } catch { return false; }
}

export function isAttributable(o: Attributable): boolean {
  // Checked FIRST: a content path disqualifies regardless of how partner-ish the words are.
  if (isContentPath(o.sourceUrl)) return false;
  if (isPartnerSource(o.sourceUrl)) return true;
  return PARTNER_RELATIONSHIP.test(o.quote);
}

/** Splits evidence into what may be used and what was dropped, so drops stay auditable. */
export function partitionAttributable<T extends Attributable>(items: T[]): { kept: T[]; dropped: T[] } {
  const kept: T[] = [];
  const dropped: T[] = [];
  for (const i of items) (isAttributable(i) ? kept : dropped).push(i);
  return { kept, dropped };
}
