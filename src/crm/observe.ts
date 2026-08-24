/**
 * Turn a piece of read text into CRM observations (mandate §55).
 *
 * This is the single entry point where evidence becomes structured: it owns the mapping from
 * the sentence classifier's rule to the forensic `languageBasis`, so there is exactly one
 * place where "what the sentence did" becomes "what we may claim".
 */
import { classifySentence, sentences } from '../jobs/crm.js';
import { VENDORS } from '../jobs/crm.js';
import type { CrmObservation, CrmSourceType, LanguageBasis } from './forensics.js';

/** Classifier rule → forensic basis. Anything unmapped falls to the weakest reading. */
const BASIS: Record<string, LanguageBasis> = {
  company_possession: 'company_possession',
  operational_duty: 'operational_duty',
  candidate_requirement: 'candidate_experience',
  customer_integration: 'customer_integration',
  category_example: 'alternatives_list',
  names_multiple_systems: 'alternatives_list',
  bare_mention: 'alternatives_list',
};

const PROVES: Record<LanguageBasis, string> = {
  company_possession: 'the company refers to a CRM instance of its own',
  operational_duty: 'the published duties of a role at this company involve working in this CRM',
  candidate_experience: 'the company asks candidates for experience with this CRM',
  alternatives_list: 'this CRM is named, in language that does not attach it to this company',
  customer_integration: 'the company ships or describes an integration with this CRM',
  fingerprint: 'an artifact belonging to this vendor is served from the company’s website',
};

const DOES_NOT_PROVE: Record<LanguageBasis, string> = {
  company_possession: 'that it is the only CRM, or that it is the partner team’s system of record',
  operational_duty: 'that it is the company’s primary CRM, or that other systems are absent',
  candidate_experience: 'that the company runs this CRM — asking for a skill is not using the tool',
  alternatives_list: 'anything about which CRM this company actually uses',
  customer_integration: 'that the company uses this CRM internally',
  fingerprint: 'which of the vendor’s products is licensed, or that sales runs on it',
};

export interface ObserveInput {
  company: string;
  text: string;
  sourceUrl: string;
  sourceType: CrmSourceType;
  sourcePublishedAt: string | null;
  jobTitle: string | null;
  observedAt: string;
}

/**
 * Observe one document. At most one observation per vendor: an advert repeating "Salesforce"
 * in six bullets is one fact about one company, and counting bullets would reward verbosity.
 */
export function observeText(input: ObserveInput): CrmObservation[] {
  const best = new Map<string, { basis: LanguageBasis; quote: string; rule: string }>();
  const RANK: Record<LanguageBasis, number> = {
    company_possession: 5, operational_duty: 4, candidate_experience: 3,
    customer_integration: 2, alternatives_list: 1, fingerprint: 0,
  };
  for (const s of sentences(input.text)) {
    for (const vendor of VENDORS) {
      const v = classifySentence(s, vendor);
      if (!v) continue;
      const basis = BASIS[v.rule] ?? 'alternatives_list';
      const prior = best.get(v.label);
      if (!prior || RANK[basis] > RANK[prior.basis]) best.set(v.label, { basis, quote: s, rule: v.rule });
    }
  }
  return [...best.entries()].map(([vendorLabel, b]) => ({
    company: input.company,
    vendor: vendorLabel,
    sourceType: input.sourceType,
    languageBasis: b.basis,
    quote: b.quote,
    sourceUrl: input.sourceUrl,
    observedAt: input.observedAt,
    sourcePublishedAt: input.sourcePublishedAt,
    jobTitle: input.jobTitle,
    rule: b.rule,
    proves: PROVES[b.basis],
    doesNotProve: DOES_NOT_PROVE[b.basis],
  }));
}

/** A website fingerprint. Never confirming — §20. */
export function observeFingerprint(opts: {
  company: string; vendor: string; quote: string; sourceUrl: string; observedAt: string;
}): CrmObservation {
  return {
    company: opts.company, vendor: opts.vendor,
    sourceType: 'website_fingerprint', languageBasis: 'fingerprint',
    quote: opts.quote, sourceUrl: opts.sourceUrl,
    observedAt: opts.observedAt, sourcePublishedAt: null, jobTitle: null,
    rule: 'website_artifact',
    proves: PROVES.fingerprint, doesNotProve: DOES_NOT_PROVE.fingerprint,
  };
}
