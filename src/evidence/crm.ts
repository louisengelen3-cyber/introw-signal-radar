/**
 * CRM detection — deliberately one-directional.
 *
 * Introw syncs into HubSpot or Salesforce, so "which CRM" is a real qualification question.
 * Phase 0 measured CRM identification at 22% on a realistic cohort, and nothing since has
 * improved it, so this module exists to find out whether that ceiling is a detector
 * weakness or a property of the web.
 *
 * THE INVARIANT THAT GOVERNS THIS FILE:
 *
 *     a found fingerprint  =  evidence the company uses that CRM
 *     no fingerprint found =  UNKNOWN
 *
 * Not "no CRM". Not "not HubSpot". The mandate forbids a NO_CRM state and forbids reading
 * a missing HubSpot fingerprint as evidence of absence, and both prohibitions are load
 * bearing: marketing-site tracking tags say what the MARKETING team deployed. A company can
 * run Salesforce as its system of record and never emit a single Salesforce asset from its
 * public website, because Salesforce is not a website technology. HubSpot is
 * over-represented in this kind of detection precisely because it also sells a CMS.
 *
 * That asymmetry is not a caveat on the result. It IS the result.
 */

import type { CrmVendor } from '../domain/types.js';

export type CrmEvidenceState =
  | 'confirmed'      // an artifact only that vendor's product emits
  | 'strong_proxy'   // an artifact that vendor's product usually emits
  | 'weak_proxy'     // a mention, not an artifact
  | 'unknown';       // nothing found — NEVER "none" and NEVER "not vendor X"

export interface CrmObservation {
  vendor: CrmVendor;
  state: CrmEvidenceState;
  marker: string;
  matched: string;
  /** What the marker actually licenses us to say. Kept alongside every hit, never stripped. */
  proves: string;
  doesNotProve: string;
}

interface Marker {
  vendor: CrmVendor;
  state: CrmEvidenceState;
  id: string;
  re: RegExp;
  proves: string;
  doesNotProve: string;
}

/**
 * Every marker below is an ARTIFACT the vendor's own product serves, not a word on a page.
 * "We love HubSpot" is not evidence; `js.hs-scripts.com/1234567.js` is.
 */
const MARKERS: Marker[] = [
  // ── HubSpot ───────────────────────────────────────────────────────────────
  { vendor: 'hubspot', state: 'confirmed', id: 'hs_tracking_portal',
    re: /js\.hs-scripts\.com\/(\d{4,10})\.js/i,
    proves: 'a HubSpot tracking script with a numeric portal id is served from this site',
    doesNotProve: 'that HubSpot is the CRM of record, or that sales uses it at all' },
  { vendor: 'hubspot', state: 'confirmed', id: 'hs_forms',
    re: /(?:js\.hsforms\.net|forms\.hsforms\.com|js\.hsforms\.com)/i,
    proves: 'HubSpot forms are embedded, so leads land in a HubSpot portal',
    doesNotProve: 'that opportunities and partner deals are managed there' },
  { vendor: 'hubspot', state: 'strong_proxy', id: 'hs_analytics',
    re: /(?:hs-analytics\.net|track\.hubspot\.com|hubspotusercontent|hs-banner\.com)/i,
    proves: 'HubSpot-hosted assets or analytics are in use',
    doesNotProve: 'which HubSpot products are licensed' },
  { vendor: 'hubspot', state: 'strong_proxy', id: 'hs_cms',
    re: /\.hs-sites\.com|cdn\d?\.hubspot\.(?:net|com)/i,
    proves: 'HubSpot CMS or CDN is serving content',
    doesNotProve: 'anything about the CRM — HubSpot CMS is bought without Sales Hub' },

  // ── Salesforce ────────────────────────────────────────────────────────────
  { vendor: 'salesforce', state: 'confirmed', id: 'sf_web_to_lead',
    re: /webto\.salesforce\.com\/servlet\/servlet\.WebToLead/i,
    proves: 'a Salesforce Web-to-Lead endpoint receives this site\'s form submissions',
    doesNotProve: 'that the partner motion is run in Salesforce' },
  { vendor: 'salesforce', state: 'confirmed', id: 'sf_my_domain',
    re: /[a-z0-9-]+\.my\.salesforce\.com|[a-z0-9-]+\.my\.site\.com|[a-z0-9-]+\.force\.com/i,
    proves: 'a Salesforce org domain is referenced by this site',
    doesNotProve: 'that the org is the primary CRM rather than a support or community org' },
  { vendor: 'salesforce', state: 'strong_proxy', id: 'sf_pardot',
    re: /(?:pi\.pardot\.com|pardot\.com\/l\/|go\.pardot\.com)/i,
    proves: 'Pardot / Account Engagement is in use, which is sold against Salesforce CRM',
    doesNotProve: 'that Salesforce CRM is deployed — Pardot is occasionally run standalone' },
  { vendor: 'salesforce', state: 'strong_proxy', id: 'sf_static',
    re: /sfdcstatic\.com|salesforceliveagent\.com|lightning\.force\.com/i,
    proves: 'Salesforce-hosted assets are served on this site',
    doesNotProve: 'which Salesforce clouds are licensed' },

  // ── Incompatible-if-confirmed ─────────────────────────────────────────────
  // These matter only because Introw does not integrate with them. Even here a hit is
  // evidence of USE, never evidence that HubSpot/Salesforce is absent: companies run two.
  { vendor: 'pipedrive', state: 'confirmed', id: 'pd_forms',
    re: /webforms\.pipedrive\.com|pipedriveassets\.com/i,
    proves: 'Pipedrive web forms or assets are in use',
    doesNotProve: 'that HubSpot or Salesforce is absent' },
  { vendor: 'zoho', state: 'confirmed', id: 'zoho_forms',
    re: /(?:forms\.zohopublic\.com|crm\.zoho\.com\/crm\/WebToLeadForm|zohocdn\.com)/i,
    proves: 'Zoho form or CDN assets are in use',
    doesNotProve: 'that HubSpot or Salesforce is absent' },
  { vendor: 'dynamics', state: 'strong_proxy', id: 'dyn_forms',
    re: /dynamics\.com\/[a-z0-9-]+\/form|assets\.[a-z0-9-]*dynamics\.com/i,
    proves: 'Microsoft Dynamics form assets are referenced',
    doesNotProve: 'that Dynamics is the CRM of record' },
];

export interface CrmAssessment {
  observations: CrmObservation[];
  /** Best-supported vendor, or null. `null` means UNKNOWN, never "no CRM". */
  vendor: CrmVendor | null;
  state: CrmEvidenceState;
  /**
   * Introw compatibility. Note there is no `incompatible` value reachable from absence —
   * only a confirmed non-supported CRM with no HubSpot/Salesforce evidence downgrades this,
   * and even then only to `unknown`, because dual-CRM estates are common.
   */
  compatibility: 'compatible_confirmed' | 'compatible_proxy' | 'unknown';
  rationale: string;
}

const RANK: Record<CrmEvidenceState, number> = { confirmed: 3, strong_proxy: 2, weak_proxy: 1, unknown: 0 };

/** @param sources raw page bodies / header blobs. Pass HTML, not stripped text — markers live in tags. */
export function assessCrm(sources: string[]): CrmAssessment {
  const observations: CrmObservation[] = [];
  const joined = sources.join('\n');
  for (const m of MARKERS) {
    const hit = joined.match(m.re);
    if (hit) observations.push({ vendor: m.vendor, state: m.state, marker: m.id, matched: hit[0].slice(0, 120), proves: m.proves, doesNotProve: m.doesNotProve });
  }

  if (observations.length === 0) {
    return {
      observations: [], vendor: null, state: 'unknown', compatibility: 'unknown',
      rationale: 'no CRM artifact observed on the retrieved surfaces. This is not evidence that the company has no CRM, and not evidence that it is not HubSpot or Salesforce.',
    };
  }

  // Supported vendors win ties: the question being asked is "can Introw integrate", and a
  // company emitting both HubSpot and Zoho artifacts is a qualified lead, not a blocked one.
  const best = [...observations].sort((a, b) => {
    const supported = (v: CrmVendor) => (v === 'hubspot' || v === 'salesforce' ? 1 : 0);
    return (RANK[b.state] - RANK[a.state]) || (supported(b.vendor) - supported(a.vendor));
  })[0];

  const supportedHit = observations.filter((o) => o.vendor === 'hubspot' || o.vendor === 'salesforce');
  const strongestSupported = supportedHit.sort((a, b) => RANK[b.state] - RANK[a.state])[0];

  const compatibility: CrmAssessment['compatibility'] =
    strongestSupported?.state === 'confirmed' ? 'compatible_confirmed'
    : strongestSupported ? 'compatible_proxy'
    : 'unknown';

  return {
    observations, vendor: best.vendor, state: best.state, compatibility,
    rationale: strongestSupported
      ? `${strongestSupported.vendor} evidence at ${strongestSupported.state} (${strongestSupported.marker})`
      : `only unsupported-CRM artifacts observed (${[...new Set(observations.map((o) => o.vendor))].join(', ')}); this does not establish that HubSpot or Salesforce is absent`,
  };
}
