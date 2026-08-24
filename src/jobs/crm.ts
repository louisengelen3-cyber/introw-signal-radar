/**
 * CRM evidence from job descriptions.
 *
 * THE ONE DISTINCTION THIS FILE EXISTS TO MAKE
 *
 *   "You will own our HubSpot CRM."                → the COMPANY uses HubSpot
 *   "Experience with HubSpot preferred."           → the CANDIDATE should know HubSpot
 *   "Salesforce, HubSpot or similar CRM"           → neither; it is a category example
 *
 * All three contain the token "HubSpot", and a keyword detector cannot tell them apart. The
 * third is the dangerous one: it names two competing systems and proves neither, so a naive
 * detector would mark a company as both a HubSpot and a Salesforce shop from one sentence in
 * one advert.
 *
 * ORDER OF TESTS, and why it is what it is:
 *
 *   1. ALTERNATIVES first. A sentence offering a choice between systems proves nothing about
 *      any of them, however operational the surrounding verb is.
 *   2. COMPANY POSSESSION next. "our Salesforce instance" is decisive even inside a
 *      requirement sentence — the company has just told us it has one.
 *   3. REQUIREMENT framing next. Skills the candidate should bring are supporting evidence
 *      about a relationship, not proof of the system of record.
 *   4. OPERATIONAL DUTY last. "Maintain opportunity data in Salesforce" describes what the
 *      hire will do here, which is a statement about this company.
 *
 * ABSENCE IS NEVER EVIDENCE. No CRM found in vacancies means unknown — not "no CRM", and not
 * "not HubSpot". A company can run Salesforce for a decade and never name it in an advert.
 */

import type { JobCrmHit, Vacancy } from './types.js';

interface VendorDef { id: string; label: string; re: RegExp }

/** Word-boundary matching only. "hubspot.com" in a footer must not read as usage. */
const VENDORS: VendorDef[] = [
  { id: 'hubspot', label: 'HubSpot', re: /\bhub\s?spot\b/i },
  { id: 'salesforce', label: 'Salesforce', re: /\bsalesforce\b|\bsfdc\b/i },
  { id: 'pipedrive', label: 'Pipedrive', re: /\bpipedrive\b/i },
  // NEVER bare "dynamics". It matched "market dynamics" and "the dynamics of selling a
  // complex platform solution", producing a confirmed Microsoft Dynamics verdict for a
  // product-analytics company. The qualifier is mandatory.
  { id: 'dynamics', label: 'Microsoft Dynamics', re: /\b(microsoft|ms)\s+dynamics\b|\bdynamics\s*(365|crm)\b/i },
  { id: 'zoho', label: 'Zoho', re: /\bzoho\b/i },
  { id: 'attio', label: 'Attio', re: /\battio\b/i },
  { id: 'close', label: 'Close', re: /\bclose\.(io|com)\b/i },
  { id: 'copper', label: 'Copper', re: /\bcopper\s+crm\b/i },
  { id: 'sugar', label: 'SugarCRM', re: /\bsugar\s?crm\b/i },
];

/**
 * The sentence offers a CHOICE of systems, or names one as an example of a category.
 * Proves nothing about any named system.
 */
const ALTERNATIVES = [
  /\b(such as|e\.?g\.?|like|for example|including)\b/i,
  /\b(or|and\/or)\s+(similar|equivalent|comparable|another|other|any other)\b/i,
  /\b(crm|crms|crm systems?|crm platforms?|crm tools?)\b[^.]{0,40}\b(such as|like|e\.?g\.?)\b/i,
  /\bof\s+(a\s+)?(modern\s+)?crm\b/i,
];

/**
 * The company speaks about a system it possesses. Decisive.
 * Multilingual because European boards routinely post in Dutch, German and French, and a
 * locale-blind rule would simply find nothing and call it unknown.
 */
const POSSESSION = [
  /\b(our|we|us)\b[^.]{0,40}?\b(VENDOR)\b/i,
  // The noun must be BOUND to the vendor, not merely nearby. A looser proximity rule matched
  // "…a trustworthy single source of truth (Salesforce and the broader GTM stack)" on the
  // word "stack", which is a property of the GTM stack, not of Salesforce.
  /\b(VENDOR)[- ](instance|environment|portal|org|tenant|account|setup|admin|crm|instance)\b/i,
  // "System of record" and "source of truth" are only ever said about the speaker's own
  // systems, so a vendor named inside that phrase is company evidence however it is worded.
  /\b(system of record|source of truth)\b[^.]{0,60}\b(VENDOR)\b|\b(VENDOR)\b[^.]{0,40}\b(is|as) (our|the) (system of record|source of truth)\b/i,
  /\b(the company'?s|company)\s+(VENDOR)\b/i,
  /\b(we|our team|the team|sales team|marketing team|revops)\b[^.]{0,40}\b(use|uses|using|run|runs|work in|works in|live in|lives in)\b[^.]{0,20}\b(VENDOR)\b/i,
  // Dutch / German / French possessives
  /\b(ons|onze|in ons)\b[^.]{0,30}\b(VENDOR)\b/i,
  /\b(unser|unsere|unserem|in unserem)\b[^.]{0,30}\b(VENDOR)\b/i,
  /\b(notre|nos|dans notre)\b[^.]{0,30}\b(VENDOR)\b/i,
];

/** Skills the candidate should bring. Supporting, never confirming. */
const REQUIREMENT = [
  /\b(experience|experienced|familiarity|familiar|proficiency|proficient|knowledge|skilled|comfortable|hands[- ]on|exposure|background)\b[^.]{0,40}\b(VENDOR)\b/i,
  /\b(VENDOR)\b[^.]{0,40}\b(experience|skills?|knowledge|certification|certified|admin certification)\b/i,
  /\b(you (have|bring|know|are)|must have|should have|nice to have|a plus|preferred|ideally|bonus|advantage|pré|plus est)\b[^.]{0,50}\b(VENDOR)\b/i,
  /\b(VENDOR)\b[^.]{0,30}\b(is a plus|preferred|required|desirable|an advantage)\b/i,
  /\b(ervaring|kennis|vertrouwd)\b[^.]{0,40}\b(VENDOR)\b/i,
  /\b(erfahrung|kenntnisse|vertraut)\b[^.]{0,40}\b(VENDOR)\b/i,
];

/**
 * What the hire will DO, here. A duty verb pointed at the system is a statement about this
 * company's operations, which is what the mandate's own examples describe:
 * "Log all customer interactions in HubSpot", "Maintain opportunity data in Salesforce".
 */
const OPERATIONAL_DUTY = [
  /\b(own|owns|owning|administer|administering|maintain|maintaining|manage|managing|configure|configuring|build|building|log|logging|track|tracking|record|recording|update|updating|document|documenting|report|reporting|migrate|migrating|integrate|integrating|automate|automating|clean|cleansing)\b[^.]{0,50}\b(VENDOR)\b/i,
  /\b(in|into|within|inside|via|through|using)\s+(VENDOR)\b/i,
  /\b(VENDOR)\b[^.]{0,25}\b(hygiene|pipeline|workflows?|dashboards?|reports?|records?|data quality|opportunity stages?|lifecycle stages?)\b/i,
  /\b(bijhouden|vastleggen|beheren|onderhouden)\b[^.]{0,40}\b(VENDOR)\b/i,
  /\b(pflegen|verwalten|betreuen|dokumentieren)\b[^.]{0,40}\b(VENDOR)\b/i,
];

const expand = (patterns: RegExp[], vendorSrc: string): RegExp[] =>
  patterns.map((p) => new RegExp(p.source.replace(/VENDOR/g, `(?:${vendorSrc})`), p.flags));

/** Split into sentences. Bullet points count as sentences — job adverts are mostly bullets. */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;])\s+|\s*[•·▪●]\s*|\n+/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter((s) => s.length >= 12 && s.length <= 600);
}

export interface SentenceVerdict {
  vendor: string;
  label: string;
  level: 'crm_confirmed' | 'crm_supporting_evidence' | 'crm_mention_only';
  rule: string;
}

/** Classify one sentence for one vendor. Exported for direct adversarial testing. */
export function classifySentence(sentence: string, vendor: VendorDef): SentenceVerdict | null {
  const src = vendor.re.source;
  if (!vendor.re.test(sentence)) return null;

  // How many DIFFERENT CRM systems does this sentence name?
  const named = VENDORS.filter((v) => v.re.test(sentence));

  // 1. A choice between systems, or a category example, proves nothing about any of them.
  if (named.length >= 2) {
    return { vendor: vendor.id, label: vendor.label, level: 'crm_mention_only', rule: 'names_multiple_systems' };
  }
  if (ALTERNATIVES.some((re) => re.test(sentence))) {
    return { vendor: vendor.id, label: vendor.label, level: 'crm_mention_only', rule: 'category_example' };
  }

  // 2. The company speaking about a system it possesses. Decisive even inside a requirement.
  for (const re of expand(POSSESSION, src)) {
    if (re.test(sentence)) return { vendor: vendor.id, label: vendor.label, level: 'crm_confirmed', rule: 'company_possession' };
  }

  // 3. Skills the candidate should bring.
  for (const re of expand(REQUIREMENT, src)) {
    if (re.test(sentence)) return { vendor: vendor.id, label: vendor.label, level: 'crm_supporting_evidence', rule: 'candidate_requirement' };
  }

  // 4. What the hire will do, here.
  for (const re of expand(OPERATIONAL_DUTY, src)) {
    if (re.test(sentence)) return { vendor: vendor.id, label: vendor.label, level: 'crm_confirmed', rule: 'operational_duty' };
  }

  return { vendor: vendor.id, label: vendor.label, level: 'crm_mention_only', rule: 'bare_mention' };
}

const PROVES: Record<string, string> = {
  company_possession: 'the company refers to a CRM instance of its own',
  operational_duty: 'the role’s published duties involve working in this CRM at this company',
  candidate_requirement: 'the company asks candidates for experience with this CRM',
  category_example: 'this CRM was named as an example of a category',
  names_multiple_systems: 'the advert names more than one CRM in the same sentence',
  bare_mention: 'this CRM is named somewhere in the advert',
};

const DOES_NOT_PROVE: Record<string, string> = {
  company_possession: 'that it is the only CRM, or that it is the partner team’s system of record',
  operational_duty: 'that it is the company’s primary CRM, or that other systems are absent',
  candidate_requirement: 'that the company runs this CRM — asking for a skill is not the same as using the tool',
  category_example: 'anything at all about which CRM this company uses',
  names_multiple_systems: 'which of the named systems, if any, this company actually uses',
  bare_mention: 'that the company uses it operationally',
};

export interface CrmScanResult {
  hits: JobCrmHit[];
}

/** Scan one vacancy. A vacancy with no description yields nothing — never a negative. */
export function scanVacancy(v: Vacancy): CrmScanResult {
  const hits: JobCrmHit[] = [];
  if (!v.description) return { hits };

  // Keep the strongest verdict per vendor per vacancy: one advert is one observation.
  const best = new Map<string, { verdict: SentenceVerdict; quote: string }>();
  const rank = { crm_confirmed: 3, crm_supporting_evidence: 2, crm_mention_only: 1 } as const;

  for (const s of sentences(v.description)) {
    for (const vendor of VENDORS) {
      const verdict = classifySentence(s, vendor);
      if (!verdict) continue;
      const prior = best.get(vendor.id);
      if (!prior || rank[verdict.level] > rank[prior.verdict.level]) best.set(vendor.id, { verdict, quote: s });
    }
  }

  for (const { verdict, quote } of best.values()) {
    hits.push({
      vendor: verdict.label, level: verdict.level, quote, rule: verdict.rule,
      vacancyId: v.id, jobTitle: v.jobTitle, jobUrl: v.jobUrl, currentness: v.currentness,
      proves: PROVES[verdict.rule], doesNotProve: DOES_NOT_PROVE[verdict.rule],
    });
  }
  return { hits };
}
