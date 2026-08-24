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
const PARTNER_SEGMENT = /^(partners?|partner-program(me)?|partner-programma|partnerships?|resellers?|reseller-program(me)?|channel|channel-partners?|agencies|agency-partners?|become-a-partner|partner-network|partenaires|partnerprogramm|partnerprogramma)$/i;
const PARTNER_HOST = /^(partners?|reseller|channel|partnerportal|partnerlisting)\./i;

/**
 * Partner vocabulary that must appear in the quote when the source is not a partner page.
 * Deliberately about the RELATIONSHIP, not about commerce: "commission" and "revenue share"
 * are exactly the words that produced the false positives above, because companies use them
 * with customers too.
 */
const PARTNER_VOCAB = /\b(partner|partners|partnership|partnerships|reseller|resellers|VAR|distributor|distributors|referral partner|channel partner|agency partner|integrator|integrators|affiliate|affiliates|wederverkoper|partenaire|vertriebspartner)\b/i;

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

export function isAttributable(o: Attributable): boolean {
  if (isPartnerSource(o.sourceUrl)) return true;
  return PARTNER_VOCAB.test(o.quote);
}

/** Splits evidence into what may be used and what was dropped, so drops stay auditable. */
export function partitionAttributable<T extends Attributable>(items: T[]): { kept: T[]; dropped: T[] } {
  const kept: T[] = [];
  const dropped: T[] = [];
  for (const i of items) (isAttributable(i) ? kept : dropped).push(i);
  return { kept, dropped };
}
