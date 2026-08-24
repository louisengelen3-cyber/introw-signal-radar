/**
 * Operational-surface detection.
 *
 * WHAT THIS DETECTS
 *   Which partner workflows a company exposes publicly — application, onboarding, deal
 *   registration, a portal, tiers, and so on.
 *
 * THE THREE-STATE RULE, which is the entire reason this is not a boolean:
 *
 *   confirmed     we saw it
 *   not_observed  we read surfaces where it would normally appear and did not see it
 *   unknown       we could not read those surfaces at all
 *
 *   `not_observed` is NOT `absent`. A login-walled portal is invisible to us by design, and
 *   deal registration lives behind that login at most companies that have it. The product
 *   must never let a reader slide from "we didn't see it" to "they don't have it".
 *
 * WHAT IT PROVES
 *   That the company publishes this workflow on a page we retrieved.
 *
 * WHAT IT DOES NOT PROVE
 *   Volume, usage, or that the workflow is operated rather than merely advertised.
 *
 * KNOWN FALSE POSITIVES
 *   A vendor's page describing the workflow generically ("what is deal registration"). The
 *   category classifier is the defence; this detector deliberately does not try to
 *   second-guess it.
 *
 * DEPENDENCE ON PUBLICATION DENSITY
 *   Moderate and unavoidable — a company that publishes more surfaces exposes more
 *   workflows. Mitigated by deduplication and by reporting distinct claims, never raw hits.
 */

import { snapToSentences } from '../lib/http.js';
import type { SurfaceKind } from './types.js';

interface SurfaceDef {
  surface: SurfaceKind;
  label: string;
  patterns: RegExp[];
  proves: string;
  doesNotProve: string;
}

export const SURFACE_DEFS: SurfaceDef[] = [
  { surface: 'partner_recruitment', label: 'Partner recruitment',
    patterns: [/\b(become a (partner|reseller|distributor)|join our partner|partner with us|word partner|devenir partenaire|partner werden)\b/i],
    proves: 'the company publicly invites organisations to join a programme',
    doesNotProve: 'that anyone joins, or how many' },
  { surface: 'application', label: 'Application',
    patterns: [/\b(partner application|apply (to|for) (the |our )?partner|application form|aanmelden als partner|candidature partenaire)\b/i],
    proves: 'there is an intake step with a form',
    doesNotProve: 'that applications are reviewed or that a pipeline exists' },
  { surface: 'onboarding', label: 'Onboarding',
    patterns: [/\b(partner onboarding|onboard(ing)? (our|new) partners|get started as a partner)\b/i],
    proves: 'the company describes a defined start process for new partners',
    doesNotProve: 'that it is systematised rather than manual' },
  { surface: 'enablement', label: 'Enablement',
    patterns: [/\b(partner (enablement|training|academy|resources?|toolkit|collateral)|sales enablement for partners)\b/i],
    proves: 'material is produced specifically for partners',
    doesNotProve: 'that partners consume it' },
  { surface: 'certification', label: 'Certification',
    // `accreditation` alone matched "continuously audited with certifications from
    // accreditation bodies" on glovoapp.com/en/security — an ISO compliance statement about
    // infrastructure providers, promoted into the summary as proof that the company
    // "distinguishes qualified partners formally". Every alternative now names a partner.
    patterns: [/\b(partner certification|certified (partner|reseller|installer|implementation|agency)|partner accreditation|become a certified partner)\b/i],
    proves: 'the company distinguishes qualified partners formally',
    doesNotProve: 'the number certified' },
  { surface: 'lead_submission', label: 'Lead submission',
    patterns: [/\b(submit a lead|lead submission|send us a lead|share a lead|pass (us )?a lead)\b/i],
    proves: 'partners can hand commercial opportunities to the company',
    doesNotProve: 'the volume of leads' },
  { surface: 'referral_submission', label: 'Referral submission',
    patterns: [/\b(refer a (customer|client|company|business)|referral (form|submission|link)|submit a referral)\b/i],
    proves: 'a referral motion exists with a defined intake',
    doesNotProve: 'that referrals are paid or tracked' },
  { surface: 'deal_registration', label: 'Deal registration',
    patterns: [/\b(deal registration|register a deal|opportunity registration|projektregistrierung|dealregistratie|enregistrement d'affaire)\b/i],
    proves: 'the company operates opportunity conflict management with partners',
    doesNotProve: 'the number of deals registered' },
  { surface: 'co_selling', label: 'Co-selling',
    patterns: [/\b(co-?sell|selling together|joint (selling|go-to-market)|sell with us)\b/i],
    proves: 'the company describes selling alongside partners',
    doesNotProve: 'that co-selling is systematised' },
  { surface: 'portal', label: 'Partner portal',
    patterns: [/\b(partner portal|partner login|partner hub|partner sign[- ]?in|partnerportaal|espace partenaires)\b/i],
    proves: 'partners have an authenticated destination',
    doesNotProve: 'what is inside it — the portal is invisible to us by design' },
  { surface: 'partner_pipeline', label: 'Partner pipeline',
    patterns: [/\b(partner[- ]sourced (pipeline|revenue)|pipeline (from|with) partners|partner pipeline)\b/i],
    proves: 'the company speaks about partner-originated pipeline',
    doesNotProve: 'its size' },
  { surface: 'programme_tiers', label: 'Programme tiers',
    patterns: [/\b((gold|silver|bronze|platinum|premier|elite|registered|authorized|select)\s+(partner|tier)|partner tiers?|tier(ed)? programme?)\b/i],
    proves: 'the programme distinguishes partners by level',
    doesNotProve: 'how many sit in each tier' },
  { surface: 'partner_resources', label: 'Partner resources',
    patterns: [/\b(partner (resource|asset|material|library|centre|center)|for our partners)\b/i],
    proves: 'a partner-specific content area exists',
    doesNotProve: 'that it is maintained' },
];

export interface SurfaceHit {
  surface: SurfaceKind;
  label: string;
  quote: string;
  sourceUrl: string;
  proves: string;
  doesNotProve: string;
}

export interface SurfaceScan {
  hits: SurfaceHit[];
  /** Surfaces looked for and not found — only meaningful when pages were actually read. */
  notObserved: SurfaceKind[];
  /** True when nothing could be read, in which case every surface is `unknown`, not absent. */
  couldNotLook: boolean;
}

const CONTEXT = 110;

export function scanSurfaces(pages: { url: string; text: string }[]): SurfaceScan {
  if (pages.length === 0) return { hits: [], notObserved: [], couldNotLook: true };

  const hits: SurfaceHit[] = [];
  const found = new Set<SurfaceKind>();

  for (const p of pages) {
    for (const def of SURFACE_DEFS) {
      for (const re of def.patterns) {
        const m = p.text.match(re);
        if (!m || m.index === undefined) continue;
        const start = Math.max(0, m.index - CONTEXT);
        const end = m.index + m[0].length + CONTEXT;
        const raw = p.text.slice(start, end);
        // Sentence-snapping can trim away the very term that matched, leaving a quote that
        // does not mention the workflow it is offered as proof of — Aikido's `portal` and
        // `co_selling` were both "confirmed" on quotes containing neither word. If the match
        // does not survive the snap, keep the raw window.
        const snapped = snapToSentences(raw);
        const quote = snapped.toLowerCase().includes(m[0].toLowerCase()) ? snapped : raw.replace(/\s+/g, ' ').trim();
        hits.push({
          surface: def.surface, label: def.label,
          quote,
          sourceUrl: p.url, proves: def.proves, doesNotProve: def.doesNotProve,
        });
        found.add(def.surface);
        break;
      }
    }
  }

  return {
    hits,
    notObserved: SURFACE_DEFS.map((d) => d.surface).filter((s) => !found.has(s)),
    couldNotLook: false,
  };
}
