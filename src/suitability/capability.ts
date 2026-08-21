/**
 * Introw capability map, and the channel operating models it implies.
 *
 * Reconstructed ONLY from the supplied Introw materials (thesis §B.2 product
 * navigation, §B.5 integrations, §K.3 stated weaknesses, §F anti-ICP). No product
 * feature is invented here, and every entry cites where it came from.
 *
 * The purpose is not to describe Introw. It is to answer one question:
 *
 *   Which channel OPERATING STRUCTURES naturally benefit from these capabilities,
 *   and which require capabilities Introw is not designed to provide?
 *
 * That question is the basis of the suitability model. Company size is deliberately
 * absent from it — size is a proxy, and the thesis's own evidence (Factorial at
 * 1,000+ employees is a customer; Payflip is tiny) shows it does not discriminate.
 */

export type CapabilitySource = 'product_nav' | 'integrations' | 'stated_weakness' | 'anti_icp' | 'customer_evidence';

export interface Capability {
  id: string;
  label: string;
  /** Where in the supplied material this comes from. */
  source: CapabilitySource;
  /** What partner-operating work it does. */
  serves: string;
}

/** What Introw provides. Thesis §B.2 product navigation, first-party. */
export const CAPABILITIES: Capability[] = [
  { id: 'crm_native_sync', label: 'CRM stays system of record; bi-directional sync', source: 'integrations', serves: 'partner activity becomes a reportable, automatable CRM object' },
  { id: 'deal_registration', label: 'Deal & lead registration with duplicate detection', source: 'product_nav', serves: 'structured intake and attribution of partner-sourced opportunities' },
  { id: 'partner_onboarding_tiering', label: 'Partner management: onboarding and tiering', source: 'product_nav', serves: 'a repeatable intake process and simple tier structure' },
  { id: 'partner_portal', label: 'No-code branded partner portal, embeddable, portal-optional', source: 'product_nav', serves: 'a partner-facing surface without engineering' },
  { id: 'partner_engagement', label: 'Automatic deal updates; Slack/Teams/email/AI-assistant access', source: 'product_nav', serves: 'reaching partners who will not log into a portal' },
  { id: 'commission_spiff', label: 'Commission & SPIFF with payout automation', source: 'product_nav', serves: 'commission calculation for direct partner relationships' },
  { id: 'content_enablement', label: 'Co-branded content enablement with per-asset tracking', source: 'product_nav', serves: 'asset distribution to partners' },
  { id: 'partner_lms', label: 'Partner LMS and certification', source: 'product_nav', serves: 'training and certifying partner staff' },
  { id: 'partner_campaigns_mdf', label: 'Partner campaigns and MDF (add-on)', source: 'product_nav', serves: 'basic marketing funds — an add-on, not the core' },
  { id: 'cpq', label: 'CPQ — partner-generated quotes (add-on)', source: 'product_nav', serves: 'partner quoting' },
  { id: 'support_collaboration', label: 'Support ticket collaboration and AI partner agent', source: 'product_nav', serves: 'absorbing routine partner support load' },
  { id: 'reporting', label: 'Dashboards, partner goals, custom reports', source: 'product_nav', serves: 'partner pipeline visibility inside the CRM' },
];

/** What Introw is NOT designed to provide. Thesis §K.3 and §F.2, multi-source. */
export const CAPABILITY_GAPS: Capability[] = [
  { id: 'multi_tier_governance', label: 'Multi-tier distributor governance', source: 'stated_weakness', serves: 'vendor → distributor → reseller → end-customer chains, sell-through reporting, distributor-managed partner tiers' },
  { id: 'tcma', label: 'Through-channel marketing automation at enterprise depth', source: 'stated_weakness', serves: 'syndicated campaigns run on behalf of hundreds of partners' },
  { id: 'deep_mdf', label: 'Deep MDF / co-op fund governance', source: 'stated_weakness', serves: 'claims, proof-of-performance, accrual-based co-op economics' },
  { id: 'native_account_mapping', label: 'Native account mapping (delivered via Crossbeam, gated to Scale+)', source: 'stated_weakness', serves: 'overlap analysis across partner CRMs' },
  { id: 'crm_independence', label: 'Any CRM other than HubSpot or Salesforce', source: 'integrations', serves: 'organisations whose partner system of record is not one of those two' },
  { id: 'decentralised_governance', label: 'Many independent regional or business-unit partner organisations', source: 'anti_icp', serves: 'federated programmes with separate owners, tiers and systems per region or BU' },
];

/* ──────────────────────────────────────────── operating-model dimensions ── */

/**
 * The structural dimensions that could plausibly separate an Introw-suitable channel
 * from an unsuitable one. These are HYPOTHESES to be measured, not settled rules —
 * each one names what would confirm it and what would refute it.
 */
export interface SuitabilityDimension {
  id: string;
  question: string;
  /** Why this could matter, tied to a capability or a gap. */
  mechanism: string;
  /** Which capability or gap it engages. */
  relatesTo: string;
  /** Public evidence that would raise it. */
  observableVia: string;
  /** Honest note on what the observation cannot establish. */
  cannotEstablish: string;
}

export const DIMENSIONS: SuitabilityDimension[] = [
  {
    id: 'channel_depth',
    question: 'Does the company sell direct-to-partner, or through a distribution tier?',
    mechanism: 'Introw\'s object model assumes the operator has a direct relationship with the transacting partner. In a two-tier model the distributor owns onboarding, credit, tiering and often deal registration, so the vendor is not the party doing the work Introw automates.',
    relatesTo: 'multi_tier_governance',
    observableVia: 'explicit two-tier language ("buy through an authorised distributor", "our distributors then sell to resellers"), separate distributor and reseller programme pages, distributor locator distinct from reseller locator',
    cannotEstablish: 'whether the vendor also runs a direct programme alongside distribution — many do',
  },
  {
    id: 'governance_centralisation',
    question: 'Is the programme run once, or separately per region or business unit?',
    mechanism: 'A federated programme has several owners, several systems and several budgets. Introw is a departmental purchase for one partner function.',
    relatesTo: 'decentralised_governance',
    observableVia: 'country- or region-specific partner programme pages with different programme names, per-region partner portals, per-BU partner sites',
    cannotEstablish: 'whether localised pages reflect separate governance or merely translation',
  },
  {
    id: 'incentive_complexity',
    question: 'Is partner economics a commission, or an enterprise incentive system?',
    mechanism: 'Introw automates commission and SPIFF. Rebate accrual, co-op claims, proof-of-performance and MDF governance are named gaps.',
    relatesTo: 'deep_mdf',
    observableVia: 'published rebate, co-op, MDF-claim, proof-of-performance, back-end margin or accrual language',
    cannotEstablish: 'the scale of those programmes, or whether they are administered in-house',
  },
  {
    id: 'programme_multiplicity',
    question: 'How many distinct partner programmes does the company operate?',
    mechanism: 'Several concurrent programmes with different objects imply a channel organisation rather than a partner function.',
    relatesTo: 'decentralised_governance',
    observableVia: 'distinct named programmes (reseller, distributor, technology, service, MSP, OEM, referral) each with their own page and terms',
    cannotEstablish: 'whether they share one owner and one system',
  },
  {
    id: 'operational_artifacts',
    question: 'Are the objects Introw creates already visible — registration, onboarding, tiers, portal?',
    mechanism: 'These are exactly what Introw provides. Their presence means the company already does this work, probably manually or on a competitor platform.',
    relatesTo: 'deal_registration',
    observableVia: 'deal-registration process, partner application/onboarding, named tiers, a partner portal',
    cannotEstablish: 'how well any of it works, or how many partners use it',
  },
  {
    id: 'enterprise_infrastructure',
    question: 'Has the company built partner infrastructure beyond what a platform provides?',
    mechanism: 'A partner university, a certification catalogue, a partner-specific support organisation and a large multi-language portal estate indicate a channel operation with its own engineering.',
    relatesTo: 'tcma',
    observableVia: 'partner university/academy sites, certification catalogues with many named tracks, dedicated partner support portals, partner-specific developer programmes',
    cannotEstablish: 'whether that infrastructure is loved or resented',
  },
  {
    id: 'crm_environment',
    question: 'Is the partner system of record HubSpot or Salesforce?',
    mechanism: 'Hard product dependency. No CRM integration, no product.',
    relatesTo: 'crm_independence',
    observableVia: 'first-party CRM artifacts',
    cannotEstablish: 'anything, most of the time — measured at roughly 22% coverage; unknown is the majority state and is neutral',
  },
];

/**
 * Structures the supplied material says Introw serves well, drawn from the customer
 * evidence rather than from marketing. Used to sanity-check the dimensions above.
 */
export const SERVED_STRUCTURES = [
  'a single partner function managing a direct reseller or referral network from one CRM (Cumulocity, Cubbit)',
  'a manufacturer managing a certified installer network directly (Quatt)',
  'a large but centrally-run partner organisation on one system (Factorial)',
  'a company rebuilding a programme from zero after an ownership change (Cumulocity, the AWS-marketplace reviewer)',
  'a company displacing a portal-first PRM that failed on adoption (Cubbit)',
];
