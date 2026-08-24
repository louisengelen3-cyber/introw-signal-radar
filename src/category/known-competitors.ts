/**
 * The maintained known-competitor list.
 *
 * This is ASSERTED BUSINESS DATA, not inference. It is deliberately kept separate from
 * `classifyCategory` so the two can disagree in public: when the list fires and the
 * classifier does not, that is a measurement of classifier recall, and when the classifier
 * fires and the list does not, that is a candidate for the list.
 *
 * Collapsing the two would make the classifier look better than it is, which is the exact
 * failure mode the productisation mandate forbids. Nothing here may be used to patch a
 * detector result — it is displayed as its own labelled fact.
 */
import { readFileSync } from 'node:fs';
import type { KnownCompetitorLookup } from './classify.js';

export interface KnownCompetitorList extends KnownCompetitorLookup {
  label: 'KNOWN_COMPETITOR_LIST';
  provenance: 'asserted_business_data';
  domains: Set<string>;
  lastReviewed: string;
}

export function loadKnownCompetitors(path?: string): KnownCompetitorList {
  const p = path ?? new URL('../../data/business/known-competitors.json', import.meta.url).pathname;
  const raw = JSON.parse(readFileSync(p, 'utf8')) as { domains: string[]; lastReviewed: string };
  const domains = new Set(raw.domains.map((d) => d.toLowerCase().replace(/^www\./, '')));
  return {
    label: 'KNOWN_COMPETITOR_LIST',
    provenance: 'asserted_business_data',
    domains,
    lastReviewed: raw.lastReviewed,
    isKnownCompetitor: (d: string) => domains.has(d.toLowerCase().replace(/^www\./, '')),
  };
}

/** Agreement between asserted data and inference. Reported, never used to correct either. */
export interface ListVsClassifier {
  domain: string;
  onList: boolean;
  classifierSaysPartnerTech: boolean;
  agreement: 'both' | 'list_only' | 'classifier_only' | 'neither';
}

export function compare(domain: string, onList: boolean, classifierSaysPartnerTech: boolean): ListVsClassifier {
  return {
    domain, onList, classifierSaysPartnerTech,
    agreement: onList && classifierSaysPartnerTech ? 'both'
      : onList ? 'list_only'
      : classifierSaysPartnerTech ? 'classifier_only'
      : 'neither',
  };
}
