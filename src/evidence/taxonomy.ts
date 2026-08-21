/**
 * Channel-evidence taxonomy.
 *
 * Every detector below exists because a Phase 0 measurement demanded it, or because
 * a named false-positive class must be defended against. Each rule declares what it
 * can prove, what it cannot, and what it is likely to be confused by — that text is
 * carried into the evidence record so a reviewer can audit the verdict rather than
 * trust a label.
 *
 * Multilingual by construction: English-only detection would silently define the
 * market as US SaaS and hide the EU mid-market the thesis calls under-served.
 */

import type {
  ChannelEvidenceClass,
  CommercialityImplication,
  PartnerMotion,
} from '../domain/types.js';

export interface LexRule {
  id: string;
  evidenceClass: ChannelEvidenceClass;
  implication: CommercialityImplication;
  strength: 'strong' | 'weak';
  motions: PartnerMotion[];
  /** What a match proves. Deliberately narrow. */
  proves: string;
  /** What a match does NOT prove. Carried into the evidence record. */
  doesNotProve: string;
  contaminationRisk: string | null;
  patterns: { lang: string; re: RegExp }[];
}

const en = (re: RegExp) => ({ lang: 'en', re });
const nl = (re: RegExp) => ({ lang: 'nl', re });
const fr = (re: RegExp) => ({ lang: 'fr', re });
const de = (re: RegExp) => ({ lang: 'de', re });

/* ───────────────────────────────────────────── STRONG transacting rules ── */

export const LEXICON: LexRule[] = [
  {
    id: 'deal_registration',
    evidenceClass: 'DEAL_REGISTRATION',
    implication: 'transacting',
    strength: 'strong',
    motions: ['reseller', 'referral'],
    proves: 'the company operates a process for partners to register opportunities it will attribute',
    doesNotProve: 'that any deals are actually registered, or that the process is active',
    contaminationRisk: null,
    patterns: [
      en(/\b(deal registration|register (?:a |your )?deal|register (?:an )?opportunity|opportunity registration|deal reg\b|lead registration|register a lead)\b/i),
      nl(/\b(deal ?registratie|registreer (?:een )?deal|lead ?registratie|opportuniteit registreren)\b/i),
      fr(/\b(enregistrement (?:de |d'une )?(?:affaire|opportunit)|d[ée]clarer une affaire|enregistrer un lead)\b/i),
      de(/\b(deal[- ]?registrierung|projektregistrierung|opportunity[- ]?registrierung|projektschutz)\b/i),
    ],
  },
  {
    id: 'commission_margin',
    evidenceClass: 'COMMISSION',
    implication: 'transacting',
    strength: 'strong',
    motions: ['reseller', 'referral', 'agency'],
    proves: 'the company pays partners for commercial outcomes',
    doesNotProve: 'the size of the programme or that payouts are material',
    contaminationRisk: 'affiliate programmes also pay commission — check for affiliate framing alongside',
    patterns: [
      en(/\b(partner commission|commission structure|revenue share|revenue sharing|margin(?:s)? (?:on|for) (?:resale|deals)|reseller margin|partner discount|deal desk|rebate)\b/i),
      nl(/\b(partner ?commissie|marge(?:s)? (?:voor|op) (?:wederverkoop|partners)|omzetdeling|korting voor partners)\b/i),
      fr(/\b(commission partenaire|marge revendeur|partage (?:des |de )?revenus|remise partenaire)\b/i),
      de(/\b(partnerprovision|händlermarge|umsatzbeteiligung|partnerrabatt)\b/i),
    ],
  },
  {
    id: 'reseller_language',
    evidenceClass: 'RESELLER_LANGUAGE',
    implication: 'transacting',
    strength: 'strong',
    motions: ['reseller'],
    proves: 'the company invites or names organisations that resell its product',
    doesNotProve: 'that resale volume is meaningful, or that the programme is currently staffed',
    contaminationRisk: null,
    patterns: [
      en(/\b(become a reseller|reseller program(?:me)?|authoriz?ed reseller|authorised reseller|value[- ]added reseller|\bVAR\b|resell (?:our|the) (?:product|platform|solution)|reseller agreement|sell (?:our|introw))\b/i),
      nl(/\b(word (?:een )?wederverkoper|wederverkoper(?:s)? ?programma|erkend(?:e)? wederverkoper|verdeler worden|erkend verdeler)\b/i),
      fr(/\b(devenir revendeur|programme revendeur|revendeur agr[ée]{2}|revendeur officiel)\b/i),
      de(/\b(fachh[äa]ndler werden|wiederverk[äa]ufer(?:programm)?|autorisierter h[äa]ndler|vertriebspartner werden)\b/i),
    ],
  },
  {
    id: 'referral_language',
    evidenceClass: 'REFERRAL_LANGUAGE',
    implication: 'transacting',
    strength: 'strong',
    motions: ['referral'],
    proves: 'the company operates a structured introduction/referral motion with partners',
    doesNotProve: 'that referrals convert, or that this is more than a landing page',
    contaminationRisk: 'customer refer-a-friend schemes are consumer affiliate motions, not B2B channel',
    patterns: [
      en(/\b(referral partner|refer (?:a |your )?client|referral program(?:me)? for (?:partners|agencies|consultants)|introducer)\b/i),
      nl(/\b(referral ?partner|doorverwijs ?partner|tipgever|klanten doorverwijzen)\b/i),
      fr(/\b(partenaire (?:de )?recommandation|apporteur d'affaires|programme de recommandation)\b/i),
      de(/\b(empfehlungspartner|tippgeber|vermittlungspartner)\b/i),
    ],
  },
  {
    id: 'dealer_language',
    evidenceClass: 'DEALER_LANGUAGE',
    implication: 'transacting',
    strength: 'strong',
    motions: ['dealer', 'distributor'],
    proves: 'the company sells through named dealers',
    doesNotProve: 'that dealers are exclusive, active, or managed by the company directly',
    contaminationRisk: null,
    patterns: [
      en(/\b(become a dealer|dealer network|authoriz?ed dealer|authorised dealer|dealer locator|find a dealer|where to buy|our dealers)\b/i),
      nl(/\b(dealer worden|dealernetwerk|erkende dealer|dealer zoeken|waar te koop|verkooppunten)\b/i),
      fr(/\b(devenir concessionnaire|r[ée]seau de distributeurs|o[uù] acheter|points de vente|trouver un revendeur)\b/i),
      de(/\b(h[äa]ndler werden|h[äa]ndlernetz|fachh[äa]ndler(?:suche)?|bezugsquellen|h[äa]ndler finden)\b/i),
    ],
  },
  {
    id: 'installer_language',
    evidenceClass: 'INSTALLER_LANGUAGE',
    implication: 'transacting',
    strength: 'strong',
    motions: ['installer'],
    proves: 'the company works through a named network of installing companies',
    doesNotProve: 'that installers buy directly, or that the company manages them rather than a distributor',
    contaminationRisk: 'some installer directories are maintained by a trade body, not the vendor',
    patterns: [
      en(/\b(certified installer|approved installer|accredited installer|installer network|find an installer|become an installer|installer program(?:me)?)\b/i),
      nl(/\b(erkend(?:e)? installateur|installateur worden|installateursnetwerk|vind een installateur|gecertificeerde installateur)\b/i),
      fr(/\b(installateur (?:agr[ée]{2}|certifi[ée]|partenaire)|trouver un installateur|devenir installateur|r[ée]seau d'installateurs)\b/i),
      de(/\b(zertifizierter installateur|fachpartner|installateur finden|partner[- ]?installateur|fachbetrieb finden)\b/i),
    ],
  },
  {
    id: 'distributor_language',
    evidenceClass: 'DISTRIBUTOR_LANGUAGE',
    implication: 'transacting',
    strength: 'strong',
    motions: ['distributor'],
    proves: 'the company sells through distribution',
    doesNotProve: 'that the company runs the downstream partner relationships itself',
    contaminationRisk: 'a distributor-only model may mean the channel is operated by the distributor',
    patterns: [
      en(/\b(our distributors|distribution partner|authoriz?ed distributor|authorised distributor|become a distributor|distributor network)\b/i),
      nl(/\b(distributeur(?:s)?|verdeler(?:s)? worden|distributienetwerk|officiële verdeler)\b/i),
      fr(/\b(nos distributeurs|distributeur agr[ée]{2}|devenir distributeur|r[ée]seau de distribution)\b/i),
      de(/\b(distributor|vertriebspartner|distributionspartner|gro[ßs]h[äa]ndler)\b/i),
    ],
  },
  {
    id: 'partner_tiers',
    evidenceClass: 'PARTNER_TIERS',
    implication: 'transacting',
    strength: 'strong',
    motions: [],
    proves: 'the company differentiates partners by commitment or performance — a managed programme',
    doesNotProve: 'how many partners sit in each tier',
    contaminationRisk: 'metal-tier words also appear in sponsorship and event pages',
    patterns: [
      en(/\b((?:gold|silver|bronze|platinum|elite|premier|registered|authoriz?ed) partner|partner tier|tiered partner program|partner levels?)\b/i),
      nl(/\b((?:goud|zilver|brons|platina)(?:en)? partner|partner ?niveau|partnerniveaus)\b/i),
      fr(/\b(partenaire (?:or|argent|bronze|platine|premier)|niveaux? de partenariat)\b/i),
      de(/\b((?:gold|silber|bronze|platin)[- ]?partner|partnerstufen?|partnerlevel)\b/i),
    ],
  },
  {
    id: 'certification',
    evidenceClass: 'CERTIFICATION',
    implication: 'transacting',
    strength: 'weak',
    motions: [],
    proves: 'the company trains and certifies people outside its own staff',
    doesNotProve: 'that certified parties resell or source deals — certification also serves customers',
    contaminationRisk: 'customer training academies look identical to partner certification',
    patterns: [
      en(/\b(partner certification|certified partner program|partner academy|partner training|partner enablement)\b/i),
      nl(/\b(partner ?certificering|partner ?academy|partner ?opleiding|partner ?training)\b/i),
      fr(/\b(certification partenaire|acad[ée]mie partenaires|formation partenaires)\b/i),
      de(/\b(partnerzertifizierung|partner[- ]?akademie|partnerschulung)\b/i),
    ],
  },
  {
    id: 'onboarding',
    evidenceClass: 'ONBOARDING',
    implication: 'transacting',
    strength: 'weak',
    motions: [],
    proves: 'the company has a defined intake process for new partners',
    doesNotProve: 'that the intake is used, or that partners transact after it',
    contaminationRisk: null,
    patterns: [
      en(/\b(partner onboarding|apply to (?:the |our )?partner program|partner application|join our partner)\b/i),
      nl(/\b(partner ?onboarding|aanmelden als partner|partner ?aanvraag|word partner)\b/i),
      fr(/\b(devenir partenaire|candidature partenaire|rejoindre le programme partenaires)\b/i),
      de(/\b(partner werden|partneranmeldung|partnerbewerbung|partnerprogramm beitreten)\b/i),
    ],
  },

  /* ───────────────────────────────── counter-evidence: not transacting ── */
  {
    id: 'tech_integration',
    evidenceClass: 'TECH_INTEGRATION',
    implication: 'integration',
    strength: 'strong',
    motions: ['technology'],
    proves: 'the company exposes technical connections to other products',
    doesNotProve: 'anything about a commercial partner motion — Phase 0 measured this as inverted',
    contaminationRisk: 'the single largest false-positive generator in this domain',
    patterns: [
      en(/\b(technology partner|tech partner|integration partner|ISV partner|build (?:an? )?integration|developer program|API partner|connect your)\b/i),
      nl(/\b(technologie ?partner|integratie ?partner|koppeling(?:en)? bouwen)\b/i),
      fr(/\b(partenaire technologique|partenaire d'int[ée]gration)\b/i),
      de(/\b(technologiepartner|integrationspartner)\b/i),
    ],
  },
  {
    id: 'app_marketplace',
    evidenceClass: 'APP_MARKETPLACE',
    implication: 'integration',
    strength: 'strong',
    motions: ['technology'],
    proves: 'the company hosts or appears in a catalogue of software integrations',
    doesNotProve: 'that a transacting channel exists',
    contaminationRisk: 'app directories are highly visible and scrape cleanly, which is why they mislead',
    patterns: [
      en(/\b(app (?:directory|marketplace|store)|integration (?:directory|marketplace|catalog(?:ue)?)|browse integrations|\d+\+? integrations)\b/i),
      nl(/\b(app ?(?:winkel|markt)|integratie ?(?:overzicht|catalogus))\b/i),
      fr(/\b(catalogue d'int[ée]grations|place de march[ée] d'applications)\b/i),
      de(/\b(integrationskatalog|app[- ]?marktplatz)\b/i),
    ],
  },
  {
    id: 'affiliate',
    evidenceClass: 'AFFILIATE',
    implication: 'affiliate',
    strength: 'strong',
    motions: ['affiliate'],
    proves: 'the company runs a link-attributed performance-marketing motion',
    doesNotProve: 'a B2B partner operation — different buyer, different object model',
    contaminationRisk: 'affiliate and referral language overlap; affiliate framing wins when links/cookies appear',
    patterns: [
      en(/\b(affiliate program(?:me)?|affiliate link|cookie duration|payout per sale|commission per referral|ambassador program|influencer program|join our affiliate)\b/i),
      nl(/\b(affiliate ?programma|affiliate ?link|ambassadeurs ?programma)\b/i),
      fr(/\b(programme d'affiliation|lien d'affiliation)\b/i),
      de(/\b(affiliate[- ]?programm|partnerprogramm f[üu]r blogger|empfehlungslink)\b/i),
    ],
  },
  {
    id: 'strategic_alliance',
    evidenceClass: 'STRATEGIC_ALLIANCE',
    implication: 'strategic',
    strength: 'weak',
    motions: ['strategic_alliance'],
    proves: 'the company names a small number of corporate relationships',
    doesNotProve: 'repeatable channel operations',
    contaminationRisk: null,
    patterns: [
      en(/\b(strategic (?:alliance|partnership)s?|global alliance|joint venture|alliance partner)\b/i),
      nl(/\b(strategisch(?:e)? (?:alliantie|partnerschap)|joint venture)\b/i),
      fr(/\b(alliance strat[ée]gique|partenariat strat[ée]gique|coentreprise)\b/i),
      de(/\b(strategische (?:allianz|partnerschaft)|joint venture)\b/i),
    ],
  },
  {
    id: 'equity_partner',
    evidenceClass: 'OTHER',
    implication: 'neutral',
    strength: 'strong',
    motions: [],
    proves: 'the word "partner" on this page refers to a senior employee or owner, not a channel',
    doesNotProve: 'anything about a channel — this rule exists purely to suppress',
    contaminationRisk: 'this IS the contamination — professional-services and investment firms',
    patterns: [
      en(/\b(managing partner|senior partner|equity partner|general partner|limited partner|founding partner|partner (?:in|at) (?:our|the) (?:London|New York|firm)|our partners and counsel|made up to partner|partnership track|partner,? (?:tax|audit|corporate|litigation|M&A|advisory|assurance|deals|restructuring))\b/i),
      nl(/\b(vennoot|managing partner|equity partner)\b/i),
      fr(/\b(associ[ée] g[ée]rant|associ[ée] principal|avocat associ[ée])\b/i),
      de(/\b(gesch[äa]ftsf[üu]hrender partner|seniorpartner|equity[- ]?partner)\b/i),
    ],
  },
  {
    id: 'customer_logos',
    evidenceClass: 'CUSTOMER_LOGOS',
    implication: 'neutral',
    strength: 'weak',
    motions: [],
    proves: 'the page shows organisations the company works with in some capacity',
    doesNotProve: 'that those organisations are partners rather than customers',
    contaminationRisk: 'customer logo walls are routinely mistaken for partner directories',
    patterns: [
      en(/\b(trusted by|our customers|customer stories|used by (?:teams|companies) at|join \d[\d,.]* companies)\b/i),
      nl(/\b(vertrouwd door|onze klanten|klantverhalen)\b/i),
      fr(/\b(ils nous font confiance|nos clients)\b/i),
      de(/\b(vertrauen uns|unsere kunden|kundenstimmen)\b/i),
    ],
  },
];

/* ──────────────────────────────────────────────── URL-shape detection ──── */

/** Multilingual partner-surface URL patterns. Order matters: dealreg beats partner. */
export const URL_SHAPES: { id: string; evidenceClass: ChannelEvidenceClass; implication: CommercialityImplication; re: RegExp }[] = [
  { id: 'url_dealreg', evidenceClass: 'DEAL_REGISTRATION', implication: 'transacting', re: /(deal-?registration|register-a-deal|deal-?reg|opportunity-registration|projektregistrierung|dealregistratie)/i },
  { id: 'url_portal', evidenceClass: 'PARTNER_PORTAL', implication: 'transacting', re: /(partner-?(?:portal|login|sign-?in|hub)|partnerportaal|espace-partenaires|partnerportal)/i },
  { id: 'url_directory', evidenceClass: 'PARTNER_DIRECTORY', implication: 'transacting', re: /(find-a-(?:partner|dealer|installer|reseller)|partner-(?:directory|locator|finder)|dealer-locator|where-to-buy|waar-te-koop|verkooppunten|trouver-un-(?:revendeur|installateur)|h[äa]ndlersuche|bezugsquellen|partnerzoeker|installateur-zoeken)/i },
  { id: 'url_reseller', evidenceClass: 'RESELLER_LANGUAGE', implication: 'transacting', re: /(resellers?|wederverkoper|revendeur|wiederverk[äa]ufer|fachh[äa]ndler|distributeurs?|distributors?|verdeler)/i },
  { id: 'url_installer_dealer', evidenceClass: 'INSTALLER_LANGUAGE', implication: 'transacting', re: /(installers?|installateur|dealers?|h[äa]ndler|monteur|fachbetrieb)/i },
  { id: 'url_become_partner', evidenceClass: 'ONBOARDING', implication: 'transacting', re: /(become-a-partner|partner-worden|word-partner|devenir-partenaire|partner-werden|partner-program|partnerprogramma|partnerprogramm|programme-partenaires|hazte-socio)/i },
  { id: 'url_affiliate', evidenceClass: 'AFFILIATE', implication: 'affiliate', re: /(affiliates?|ambassador|influencer)/i },
  { id: 'url_integration', evidenceClass: 'APP_MARKETPLACE', implication: 'integration', re: /(integrations?|app-?(?:directory|store|marketplace)|marketplace|connectors?|plugins?|koppelingen)/i },
  { id: 'url_partner_generic', evidenceClass: 'PROGRAM_PAGE', implication: 'neutral', re: /(partners?|partenaires?|socios|partnerschaft)/i },
];

/**
 * Domains and page shapes that mean "the word partner here is not a channel".
 * Kept separate from the lexicon because these suppress at the *company* level,
 * not the page level — Phase 0's Deloitte false positive was caused by trying to
 * do this with page lexicon alone.
 */
export const FIRM_TYPE_SUPPRESSION: { id: string; reason: string; re: RegExp }[] = [
  { id: 'law_firm', reason: 'law firm — "partner" means equity partner', re: /\b(law firm|solicitors|attorneys at law|barristers|advocaten|avocats|rechtsanwälte|LLP\b)\b/i },
  { id: 'accounting_audit', reason: 'accounting/audit firm — "partner" means equity partner', re: /\b(audit(?:ing)? (?:and|&) (?:tax|assurance)|chartered accountants|wirtschaftsprüfer|expert-comptable|accountancy firm|assurance,? tax(?:,| and) advisory)\b/i },
  { id: 'consulting_firm', reason: 'management consultancy — "partner" means equity partner', re: /\b(management consult(?:ing|ancy) firm|strategy consult(?:ing|ancy)|we are a (?:global )?consultancy)\b/i },
  { id: 'investment_firm', reason: 'VC/PE firm — "partner" means investment partner', re: /\b(venture capital|private equity|we invest in|our portfolio compan|early[- ]stage investor|seed fund)\b/i },
  { id: 'staffing_marketplace', reason: 'staffing/recruitment marketplace — partner postings are marketplace artifacts', re: /\b(freelance marketplace|hire (?:vetted|top) (?:freelancers|talent)|talent marketplace|staffing agency|recruitment marketplace|find work|post a job)\b/i },
];
