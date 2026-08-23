/**
 * Category-competitor detection.
 *
 * Why this module exists: against the Phase 4 hard-negative set the Phase 3 constructs
 * promoted 5 of 6 PRM competitors to `high_fit`. A blind reviewer reading the SAME
 * evidence packets promoted 0 of 6. The information needed to reject them was therefore
 * present in the evidence — the constructs simply did not use it.
 *
 * The failure is not a scoring error. It is a category error. The three constructs measure
 * "does this company run a serious partner programme". A PRM vendor is the global maximum
 * of that measurement: partner operations are simultaneously its product and its
 * go-to-market. No amount of re-weighting separates it from a genuine prospect, because on
 * the dimensions being measured it is not a weaker case — it is a stronger one.
 *
 * So this is a SEPARATE QUESTION, asked separately, exactly as Phase 2 separated channel
 * reality from Introw suitability. It asks: is partner management what this company SELLS?
 *
 * DELIBERATELY NOT A DOMAIN LIST. The mandate forbids patching company names, and a name
 * list would not generalise to the vendors nobody on the team has heard of — which are
 * precisely the ones a discovery instrument is for. Every signal below keys on
 * self-description, grammatical voice, or source-path shape.
 */

export type CategorySignal = 'sells_partner_tech' | 'second_person_channel' | 'definitional_content' | 'content_marketing_path';

export interface CategoryVerdict {
  /** `excluded` only ever means "this looks like a partner-tech vendor". Never "bad prospect". */
  state: 'excluded' | 'review_required' | 'clear';
  signals: CategorySignal[];
  /** The quote or path that fired, so a human can overturn it. Never hidden. */
  evidence: { signal: CategorySignal; quote: string; sourceUrl?: string }[];
  rationale: string;
}

/**
 * Signal 1 — the company describes partner management as its PRODUCT.
 * A partner-modified product noun ("partner portal software"), or a promise to run
 * someone else's channel. This is the only signal that is close to decisive on its own.
 */
const SELLS_PARTNER_TECH: RegExp[] = [
  /\b(partner|channel|reseller|affiliate|PRM)[- ](portal|management|relationship management|automation|ecosystem|marketing|locator)\s+(software|platform|solution|tool|product|system|technology)\b/i,
  /\b(software|platform|solution)\s+(that|to)\s+(help|helps|lets|enables?)\s+\w{0,12}\s*(you|companies|brands|vendors|businesses)\s+(manage|recruit|onboard|scale|grow|activate|track)\s+\w{0,12}\s*(partner|channel|reseller|affiliate)/i,
  /\b(is|are)\s+using\s+\[?COMPANY\]?\s+to\s+(manage|onboard|activate|recruit|track|scale)/i,
  /\buse\s+\[?COMPANY\]?\s+to\s+(manage|onboard|activate|recruit|track)\b/i,
  /\bpre-?configured\s+\w{0,12}\s*PRM\s+templates\b/i,
  /\b(our|the)\s+(PRM|partner portal|partner management)\s+(product|platform|software)\b/i,
  /\bpartner (relationship management|ecosystem) (platform|software)\b/i,
];

/**
 * Signal 2 — second-person channel voice.
 * "Grow YOUR partner programme" addresses a reader who owns a channel. A company
 * describing its own channel writes in the first person. This was the discriminator the
 * blind reviewer named unprompted, which is why it is here rather than something cleverer.
 */
const SECOND_PERSON_CHANNEL =
  /\byour\s+(partner|partners|channel|resellers|reseller|partner program(me)?|program(me)?|ecosystem|PRM|partner portal|partner ecosystem|affiliates?)\b|\bhelps?\s+you\s+(manage|recruit|onboard|scale|grow|activate)\s+\w{0,12}\s*partner/i;

/**
 * Signal 3 — definitional / glossary content.
 * "Reseller: a partner who purchases your product at a discount" is a dictionary entry,
 * not a programme. Vendors of channel software publish these for SEO; operators do not.
 */
const DEFINITIONAL =
  /\b(what is (a|an)\b|\[definition\]|definition\]|refers to the practice|is a formal (notification|process)|glossary|find terms by letter)\b/i;

/**
 * Signal 4 — the evidence came from a content-marketing path.
 * Weakest of the four and never decisive alone: real operators publish partner blog posts
 * too. It matters only as corroboration, because a programme claim sourced ENTIRELY from
 * /glossary/ and /blog/ is a claim about published content, not about an operation.
 */
const CONTENT_SECTION = /^(glossary|blog|resources?|learn|guides?|academy|insights|whitepapers?|news|library)$/i;
const PROGRAMME_SECTION = /^(partners?|reseller|resellers|channel|become-a-partner|partner-program(me)?|partnerprogramma|portal|partenaires|partnerprogramm)$/i;

/**
 * Section is decided by the FIRST path segment, never by a substring anywhere in the URL.
 * Matching anywhere lets a slug masquerade as a section: `/glossary/reseller` and
 * `/blog/channel-tips` both contain a programme word, so a substring test reads a channel
 * glossary as a channel programme — which is precisely the confusion this signal exists to
 * catch.
 */
function firstSegment(u: string): string {
  try { return new URL(u).pathname.split('/').filter(Boolean)[0] ?? ''; } catch { return ''; }
}

export interface ObservationLike {
  quote?: string;
  sourceUrl?: string;
}

export function assessCategory(observations: ObservationLike[]): CategoryVerdict {
  const evidence: CategoryVerdict['evidence'] = [];
  const signals = new Set<CategorySignal>();

  for (const o of observations) {
    const q = o.quote ?? '';
    if (q) {
      for (const re of SELLS_PARTNER_TECH) {
        const m = q.match(re);
        if (m) { signals.add('sells_partner_tech'); evidence.push({ signal: 'sells_partner_tech', quote: m[0], sourceUrl: o.sourceUrl }); break; }
      }
      const sp = q.match(SECOND_PERSON_CHANNEL);
      if (sp) { signals.add('second_person_channel'); evidence.push({ signal: 'second_person_channel', quote: sp[0], sourceUrl: o.sourceUrl }); }
      const df = q.match(DEFINITIONAL);
      if (df) { signals.add('definitional_content'); evidence.push({ signal: 'definitional_content', quote: df[0], sourceUrl: o.sourceUrl }); }
    }
  }

  // Path shape is a property of the evidence SET, not of any one observation: it fires only
  // when a programme claim rests wholly on content-marketing URLs and none on a real
  // programme surface.
  const withUrl = observations.filter((o) => o.sourceUrl);
  const contentOnly =
    withUrl.length >= 3 &&
    withUrl.every((o) => CONTENT_SECTION.test(firstSegment(o.sourceUrl!))) &&
    !withUrl.some((o) => PROGRAMME_SECTION.test(firstSegment(o.sourceUrl!)));
  if (contentOnly) {
    signals.add('content_marketing_path');
    evidence.push({ signal: 'content_marketing_path', quote: `all ${withUrl.length} sourced surfaces are content-marketing paths`, sourceUrl: withUrl[0].sourceUrl });
  }

  const s = [...signals];
  // Product self-description is decisive alone. Otherwise two independent signals are
  // required — the same two-indicator rule that fixed firm-type suppression in Phase 1,
  // where single-indicator matching produced a 67% false-positive rate.
  if (signals.has('sells_partner_tech')) {
    return { state: 'excluded', signals: s, evidence, rationale: 'the company describes partner management as a product it sells' };
  }
  if (s.length >= 2) {
    return { state: 'excluded', signals: s, evidence, rationale: `two independent partner-tech indicators: ${s.join(' + ')}` };
  }
  if (s.length === 1) {
    return { state: 'review_required', signals: s, evidence, rationale: `single uncorroborated indicator (${s[0]}); not sufficient to exclude` };
  }
  return { state: 'clear', signals: [], evidence: [], rationale: 'no partner-tech self-description observed (this is not proof the company is not one)' };
}
