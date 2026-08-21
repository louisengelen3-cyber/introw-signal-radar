/**
 * PRM / partner-platform intelligence.
 *
 * Phase 1 found competitor fingerprints unexpectedly, in the unseen set: Allbound at
 * ExtraHop and Semperis, Impartner at Nokia and Proofpoint. This module makes that a
 * deliberate capability rather than a by-product.
 *
 * Two rules, both non-negotiable:
 *
 *  - **FOUND is strong evidence. NOT FOUND is UNKNOWN.** A missing fingerprint never
 *    means "no PRM". Most vendors serve tenants from the customer's own domain, and a
 *    portal behind a login leaks nothing.
 *  - **A detected competitor is not buying intent.** It is maturity evidence and a
 *    switching cost at the same time. Inferring dissatisfaction from infrastructure is
 *    exactly the fabrication the thesis forbids.
 *
 * Vendors are listed only where a fingerprint can actually be defined. Guessing a
 * pattern for a vendor we have never observed would manufacture confidence.
 */

import type { Confidence } from '../domain/types.js';

export type PrmEvidenceState = 'confirmed' | 'strong_proxy' | 'ambiguous' | 'unknown';

export interface PrmVendorDef {
  id: string;
  label: string;
  /** CNAME targets that identify the vendor's hosting. */
  cname: RegExp;
  /** Whether a CNAME match alone is decisive, or needs corroboration. */
  cnameDecisive: boolean;
  /** Optional artifacts on a portal login page. */
  pageArtifacts?: RegExp;
  /** What the vendor sells, so the commercial reading is explicit. */
  category: 'prm' | 'directory' | 'ecosystem_data' | 'general_portal';
  /** Confirmed observed in this project's own measurements, or defined but unobserved. */
  observed: boolean;
}

export const PRM_VENDORS: PrmVendorDef[] = [
  // Observed in Phase 1/2 measurements.
  { id: 'introw', label: 'Introw', cname: /\bcname\.introw\.io\b|\bintrow\.(?:io|com)\b/i, cnameDecisive: true, category: 'prm', observed: true },
  { id: 'allbound', label: 'Allbound', cname: /\ballbound\.(?:com|eu)\b/i, cnameDecisive: true, pageArtifacts: /allbound/i, category: 'prm', observed: true },
  { id: 'impartner', label: 'Impartner', cname: /\bimpartner\.(?:com|io)\b|\bprm\.impartner\b/i, cnameDecisive: true, pageArtifacts: /impartner/i, category: 'prm', observed: true },
  { id: 'partnerpage', label: 'PartnerPage.io', cname: /\bpartnerpage\.io\b/i, cnameDecisive: true, pageArtifacts: /content\.partnerpage\.io/i, category: 'directory', observed: true },

  // Defined from vendor-documented hosting patterns; not yet observed in our own data.
  { id: 'partnerstack', label: 'PartnerStack', cname: /\bpartnerstack\.com\b|\.pstk\.io\b|\bgrowsumo\b/i, cnameDecisive: true, pageArtifacts: /partnerstack|pstk\.io/i, category: 'prm', observed: false },
  { id: 'channeltivity', label: 'Channeltivity', cname: /\bchanneltivity\.com\b/i, cnameDecisive: true, pageArtifacts: /channeltivity/i, category: 'prm', observed: false },
  { id: 'zinfi', label: 'ZINFI', cname: /\bzinfi\.(?:com|net)\b/i, cnameDecisive: true, pageArtifacts: /zinfi/i, category: 'prm', observed: false },
  { id: 'magentrix', label: 'Magentrix', cname: /\bmagentrix\.com\b/i, cnameDecisive: true, pageArtifacts: /magentrix/i, category: 'prm', observed: false },
  { id: 'kiflo', label: 'Kiflo', cname: /\bkiflo\.com\b/i, cnameDecisive: true, pageArtifacts: /kiflo/i, category: 'prm', observed: false },
  { id: 'mindmatrix', label: 'Mindmatrix', cname: /\bmindmatrix\.net\b/i, cnameDecisive: true, category: 'prm', observed: false },
  { id: 'kademi', label: 'Kademi', cname: /\bkademi\.co\b/i, cnameDecisive: true, category: 'prm', observed: false },
  { id: 'channext', label: 'Channext', cname: /\bchannext\.com\b/i, cnameDecisive: true, category: 'prm', observed: false },
  { id: 'unifyr', label: 'Unifyr', cname: /\bunifyr\.com\b/i, cnameDecisive: true, category: 'prm', observed: false },
  { id: 'partnerfleet', label: 'Partner Fleet', cname: /\bpartnerfleet\.io\b/i, cnameDecisive: true, category: 'directory', observed: false },
  { id: 'crossbeam', label: 'Crossbeam / Reveal', cname: /\bcrossbeam\.com\b|\breveal\.co\b/i, cnameDecisive: true, category: 'ecosystem_data', observed: false },

  // Deliberately NOT decisive: a general-purpose community platform is used for many
  // portal types. Treating it as a PRM produced a false transacting verdict in Phase 1.
  { id: 'salesforce_experience', label: 'Salesforce Experience Cloud', cname: /\.my\.site\.com\b|\bforce\.com\b/i, cnameDecisive: false, category: 'general_portal', observed: true },
];

export interface PrmDetection {
  vendor: string;
  label: string;
  category: PrmVendorDef['category'];
  state: PrmEvidenceState;
  host: string;
  cname: string[];
  confidence: Confidence;
  method: string;
  observedAt: string;
  /** Explicit, so no consumer can invert the detection. */
  cannotEstablish: string;
}

export interface PrmAssessment {
  detections: PrmDetection[];
  /** `unknown` whenever nothing was found — never "no PRM". */
  state: PrmEvidenceState;
  /** Lookups that failed rather than returned nothing. */
  lookupFailures: number;
  note: string;
}

export function assessPrm(
  hosts: { host: string; cname: string[]; distinct: boolean; nonProd: boolean }[],
  lookupFailures: number,
): PrmAssessment {
  const now = new Date().toISOString();
  const detections: PrmDetection[] = [];

  for (const h of hosts) {
    if (!h.distinct || h.nonProd) continue;
    for (const v of PRM_VENDORS) {
      if (!h.cname.some((c) => v.cname.test(c))) continue;
      detections.push({
        vendor: v.id,
        label: v.label,
        category: v.category,
        state: v.cnameDecisive ? 'confirmed' : 'ambiguous',
        host: h.host,
        cname: h.cname,
        confidence: v.cnameDecisive ? 'high' : 'low',
        method: v.cnameDecisive
          ? `${h.host} resolves to ${v.label}'s hosting; the company runs a partner surface on that platform`
          : `${h.host} resolves to ${v.label}, a general-purpose portal platform — this does not establish a partner-management system`,
        observedAt: now,
        cannotEstablish: 'whether the platform is liked, how many partners use it, when the contract renews, or whether the company would consider replacing it',
      });
      break;
    }
  }

  const confirmed = detections.filter((d) => d.state === 'confirmed');
  return {
    detections,
    state: confirmed.length ? 'confirmed' : detections.length ? 'ambiguous' : 'unknown',
    lookupFailures,
    note: confirmed.length
      ? 'A partner platform is in use. This is maturity evidence and a switching cost simultaneously; it is not buying intent.'
      : lookupFailures > 0
        ? `No fingerprint found, and ${lookupFailures} lookups failed. Absence here is not evidence that no platform is in use.`
        : 'No fingerprint found. Most vendors serve tenants from the customer\'s own domain and a login-walled portal leaks nothing, so this is unknown rather than absent.',
  };
}

/**
 * The commercial reading of a competitor detection, stated so the UI cannot over-claim.
 * Deliberately returns two opposed readings rather than a verdict.
 */
export function competitiveReading(d: PrmDetection): { maturity: string; switchingCost: string; forbidden: string } {
  return {
    maturity: `${d.label} in production means the company has already bought into the category, sized a budget and staffed someone to run it.`,
    switchingCost: `It also means an incumbent contract, migrated data and internal credibility attached to the current choice.`,
    forbidden: 'Do not infer dissatisfaction, renewal timing, or readiness to switch. None of that is observable here.',
  };
}
