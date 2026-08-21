import { get, stripTags } from './fetch.mjs';

/* ---------------------------------------------------------------- CRM ----- */
// Evidence standard: CONFIRMED = first-party artifact served by the company's own
// web property. Everything else is PROXY. Absence is UNKNOWN, never "no CRM".
const CRM_ARTIFACTS = [
  // vendor        id                              regex                                            standard
  ['hubspot', 'hs-tracking-script', /js(?:-eu1|-na1|-na2|-eu2)?\.hs-scripts\.com\/(\d+)/i, 'confirmed'],
  ['hubspot', 'hs-forms-embed', /js(?:-eu1|-na1)?\.hsforms\.net|forms\.hs(?:forms)?\.(?:net|com)\/embed/i, 'confirmed'],
  ['hubspot', 'hs-analytics', /js\.hs-analytics\.net|\/__hs|hs-banner\.com/i, 'confirmed'],
  ['hubspot', 'hs-meetings-link', /meetings(?:-eu1|-na2)?\.hubspot\.com\//i, 'confirmed'],
  ['hubspot', 'hs-hosted-assets', /hubspotusercontent[-\w]*\.(?:net|com)|\.hs-sites(?:-eu1)?\.com|hs-cdn\.net/i, 'confirmed'],
  ['hubspot', 'hs-cta', /cta-(?:service-cms2|redirect)\.hubspot\.com|hscta\.net/i, 'confirmed'],
  ['hubspot', 'hs-forms-api', /api\.hsforms\.com\/submissions/i, 'confirmed'],

  ['salesforce', 'sf-web-to-lead', /webto\.salesforce\.com\/servlet/i, 'confirmed'],
  ['salesforce', 'sf-experience-cloud', /[\w-]+\.my\.(?:salesforce|site)\.com|force\.com\//i, 'confirmed'],
  ['salesforce', 'sf-pardot', /pi\.pardot\.com|go\.pardot\.com|pardot\.com\/l\//i, 'confirmed'],
  ['salesforce', 'sf-embedded-svc', /embeddedservice|service\.force\.com/i, 'confirmed'],

  ['pipedrive', 'pd-leadbooster', /leadbooster-chat\.pipedrive\.com|webforms\.pipedrive\.com/i, 'confirmed'],
  ['zoho', 'zoho-forms', /zohopublic\.com|forms\.zohopublic|crm\.zoho\.com\/crm\/WebToLeadForm/i, 'confirmed'],
  ['dynamics', 'dyn-marketing', /dynamics\.com\/.*?\/form|d365mktforms|assets\.mkt\.dynamics\.com/i, 'confirmed'],
  ['attio', 'attio-form', /attio\.com\/forms|app\.attio\.com/i, 'confirmed'],
  ['marketo', 'marketo-form', /marketo\.com\/js\/forms|mktoForms2/i, 'confirmed'],
];

export function detectCrm(pages) {
  const hits = [];
  for (const p of pages) {
    if (!p?.body) continue;
    for (const [vendor, id, re, standard] of CRM_ARTIFACTS) {
      const m = p.body.match(re);
      if (m) hits.push({ vendor, artifact: id, standard, sample: m[0].slice(0, 90), sourceUrl: p.finalUrl ?? p.url, retrievedAt: p.retrievedAt });
    }
  }
  const byVendor = {};
  for (const h of hits) (byVendor[h.vendor] ??= []).push(h);
  // Distinct artifact families matter more than repeat hits of one family.
  const summary = Object.entries(byVendor).map(([vendor, hs]) => ({
    vendor,
    distinctArtifacts: [...new Set(hs.map((h) => h.artifact))],
    evidence: hs.slice(0, 6),
  })).sort((a, b) => b.distinctArtifacts.length - a.distinctArtifacts.length);
  return { state: summary.length ? 'evidence_found' : 'unknown', vendors: summary };
}

/* ------------------------------------------------------- partner surface -- */
// Multilingual because the thesis says the EU mid-market publishes in local language.
const PARTNER_URL_PAT = /(?:^|\/)(partners?|partenaires?|partnerprogramm|partnerprogramma|partenariat|socios|partner-program\w*|partnerprogram\w*|become-a-partner|word-partner|devenir-partenaire|partner-werden|reseller\w*|wederverkoper\w*|revendeur\w*|distributor\w*|distributeur\w*|verdeler\w*|dealers?|dealer-locator|handlers?|installers?|installateur\w*|installateure|find-a-partner|find-an-installer|partner-locator|partner-directory|partnerzoeker|where-to-buy|waar-te-koop|channel-partners?|alliances?|msps?|solution-providers?|systemintegrator\w*|agencies|agency-partners?)(?:\/|$|[?#.])/i;

const DEALREG_URL_PAT = /(deal-?registration|register-a-deal|deal-?reg|opportunity-registration|partner-login|partnerlogin|partner-portal|partnerportal|partner-sign-?in)/i;
const INTEGRATION_URL_PAT = /(integrations?|app-?(?:directory|store|marketplace)|marketplace|connectors?|plugins?|apps)(?:\/|$|[?#.])/i;
const AFFILIATE_URL_PAT = /(affiliates?|affiliate-program|ambassador|referral-program|influencer)/i;

const PARTNER_ANCHOR_PAT = /\b(partners?|partenaires?|partnerprogramm|resellers?|wederverkopers?|revendeurs?|distributors?|distributeurs?|verdelers?|dealers?|installers?|installateurs?|become a partner|word partner|partner worden|devenir partenaire|find a partner|find an installer|partner program\w*|channel partners?|msp|solution providers?|where to buy)\b/i;

export function classifyLinks(baseUrl, html) {
  const out = { partner: [], dealreg: [], integration: [], affiliate: [] };
  if (!html) return out;
  const seen = new Set();
  for (const m of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,220}?)<\/a>/gi)) {
    let href = m[1];
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) continue;
    let u;
    try { u = new URL(href, baseUrl); } catch { continue; }
    if (u.protocol !== 'https:' && u.protocol !== 'http:') continue;
    const base = new URL(baseUrl);
    const sameSite = u.hostname === base.hostname || u.hostname.endsWith('.' + base.hostname.replace(/^www\./, '')) || base.hostname.endsWith('.' + u.hostname.replace(/^www\./, ''));
    if (!sameSite) continue;
    const key = u.origin + u.pathname;
    if (seen.has(key)) continue;
    seen.add(key);
    const text = stripTags(m[2]).slice(0, 120);
    const path = u.pathname;
    const rec = { url: u.origin + u.pathname, text };
    if (DEALREG_URL_PAT.test(path)) out.dealreg.push(rec);
    else if (AFFILIATE_URL_PAT.test(path)) out.affiliate.push(rec);
    else if (PARTNER_URL_PAT.test(path) || PARTNER_ANCHOR_PAT.test(text)) out.partner.push(rec);
    else if (INTEGRATION_URL_PAT.test(path)) out.integration.push(rec);
  }
  return out;
}

/* ------------------------------- transacting vs integration classifier ---- */
// The thesis' single largest false-positive class. Scored on lexicon, reported with
// the matched terms so a human can audit the verdict rather than trust a label.
const TRANSACTING_TERMS = [
  'deal registration','register a deal','register deals','opportunity registration',
  'commission','commissions','margin','margins','rebate','rebates','discount tier','spiff',
  'become a reseller','reseller program','reseller programme','reseller agreement','resell',
  'referral fee','referral commission','revenue share','revenue sharing','earn up to',
  'partner tier','partner tiers','gold partner','silver partner','platinum partner','certified partner',
  'authorized reseller','authorised reseller','authorized dealer','value added reseller','var ',
  'distributor','distribution partner','installer network','certified installer','accredited installer',
  'dealer network','co-sell','co-selling','mdf','market development funds','deal desk',
  'partner portal','partner agreement','sell our','sell introw','joint selling','quote',
];
const INTEGRATION_TERMS = [
  'integration','integrations','api','sdk','webhook','oauth','connector','connectors',
  'app directory','app marketplace','build with','developer docs','technology partner',
  'tech partner','integrate with','works with','sync your','embed our','open source',
];
const AFFILIATE_TERMS = [
  'affiliate','affiliates','affiliate program','affiliate link','cookie duration','payout per sale',
  'ambassador program','influencer program',
];
const EQUITY_PARTNER_TERMS = [
  'equity partner','managing partner','senior partner','partner in the','made up to partner',
  'our partners and counsel','partnership track','general partner','limited partner','investment partner',
];

function countTerms(text, terms) {
  const t = text.toLowerCase();
  const found = [];
  for (const term of terms) {
    const n = t.split(term).length - 1;
    if (n > 0) found.push([term, n]);
  }
  return found.sort((a, b) => b[1] - a[1]);
}

export function classifyProgram(text) {
  const tx = countTerms(text, TRANSACTING_TERMS);
  const ig = countTerms(text, INTEGRATION_TERMS);
  const af = countTerms(text, AFFILIATE_TERMS);
  const eq = countTerms(text, EQUITY_PARTNER_TERMS);
  const sum = (a) => a.reduce((n, [, c]) => n + c, 0);
  const s = { transacting: sum(tx), integration: sum(ig), affiliate: sum(af), equity: sum(eq) };
  let verdict = 'unknown';
  if (s.equity >= 3 && s.equity > s.transacting) verdict = 'professional_services_partner';
  else if (s.transacting >= 3 && s.transacting >= s.integration) verdict = 'transacting';
  else if (s.affiliate >= 3 && s.affiliate > s.transacting) verdict = 'affiliate_only';
  else if (s.integration >= 5 && s.integration > s.transacting * 2) verdict = 'integration_only';
  else if (s.transacting > 0) verdict = 'weak_transacting';
  return { verdict, scores: s, topTransacting: tx.slice(0, 8), topIntegration: ig.slice(0, 5), topAffiliate: af.slice(0, 4), topEquity: eq.slice(0, 4) };
}

/* ------------------------------------------------- partner directory count */
// Returns a LOWER BOUND with the method used. Never presented as a census.
export function countDirectoryEntries(html, baseUrl) {
  if (!html) return null;
  const methods = [];
  // 1. JSON-LD ItemList
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const j = JSON.parse(m[1].trim());
      const arr = Array.isArray(j) ? j : [j];
      for (const o of arr) {
        if (o?.['@type'] === 'ItemList' && Array.isArray(o.itemListElement)) {
          methods.push({ method: 'jsonld_itemlist', count: o.numberOfItems ?? o.itemListElement.length });
        }
      }
    } catch { /* malformed JSON-LD is common; ignore */ }
  }
  // 2. Explicit "N partners" copy
  for (const m of html.matchAll(/([\d.,]{2,7})\s*\+?\s*(?:certified\s+|authorized\s+|authorised\s+|active\s+)?(partners|resellers|dealers|installers|distributors|agencies|msps)\b/gi)) {
    const n = Number(m[1].replace(/[.,]/g, ''));
    if (n >= 5 && n <= 200000) methods.push({ method: 'stated_count', count: n, term: m[2].toLowerCase(), quote: m[0].trim() });
  }
  // 3. Repeated card structures linking out
  const hosts = new Map();
  let base = null;
  try { base = new URL(baseUrl).hostname.replace(/^www\./, ''); } catch { /* */ }
  for (const m of html.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)) {
    try {
      const h = new URL(m[1]).hostname.replace(/^www\./, '');
      if (base && (h === base || h.endsWith('.' + base))) continue;
      if (/(facebook|twitter|x\.com|linkedin|youtube|instagram|google|apple|w3\.org|schema\.org|gravatar|cloudfront|googleapis)/i.test(h)) continue;
      hosts.set(h, (hosts.get(h) ?? 0) + 1);
    } catch { /* */ }
  }
  if (hosts.size >= 8) methods.push({ method: 'distinct_outbound_hosts', count: hosts.size });
  return methods.length ? methods : null;
}

/* --------------------------------------------------------- PRM fingerprint */
export const PRM_VENDORS = [
  ['introw', /introw\.(?:io|com)|introw-/i],
  ['partnerstack', /partnerstack\.com|\.pstk\.io|growsumo/i],
  ['impartner', /impartner\.com|impartner\.io|prmportal/i],
  ['allbound', /allbound\.com/i],
  ['channeltivity', /channeltivity\.com/i],
  ['zinfi', /zinfi\.(?:com|net)/i],
  ['magentrix', /magentrix\.com/i],
  ['kiflo', /kiflo\.com/i],
  ['partnerportal_io', /partnerportal\.io/i],
  ['workspan', /workspan\.com/i],
  ['crossbeam', /crossbeam\.com|reveal\.co/i],
  ['mindmatrix', /mindmatrix\.net/i],
  ['kademi', /kademi\.co/i],
  ['tackle', /tackle\.io/i],
  ['salesforce_prm', /\.my\.site\.com|force\.com\/partners?/i],
  ['hubspot_hosted', /\.hs-sites(?:-eu1)?\.com/i],
  ['channext', /channext\.com/i],
  ['unifyr', /unifyr\.com/i],
  ['euler', /euler\.io|geteuler/i],
];

export function fingerprintPrm(pages) {
  const hits = [];
  for (const p of pages) {
    if (!p?.body) continue;
    for (const [vendor, re] of PRM_VENDORS) {
      const m = p.body.match(re);
      if (m) hits.push({ vendor, sample: m[0].slice(0, 60), sourceUrl: p.finalUrl ?? p.url });
    }
  }
  const byVendor = {};
  for (const h of hits) (byVendor[h.vendor] ??= []).push(h);
  return Object.entries(byVendor).map(([vendor, hs]) => ({ vendor, count: hs.length, evidence: hs.slice(0, 3) }));
}

/* ------------------------------------------- main-content extraction ------ */
// Site chrome (mega-nav listing "100+ integrations") swamped whole-page lexicon
// classification and produced integration_only on real transacting programmes.
// Strip nav/header/footer, then prefer <main>/<article> when present.
export function mainContent(html) {
  if (!html) return '';
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav\b[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header\b[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer\b[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+\b(?:class|id)=["'][^"']*(?:mega-?menu|main-?nav|navbar|site-?header|site-?footer|dropdown-?menu)[^"']*["'][\s\S]{0,40000}?<\/(?:div|ul|section)>/gi, ' ');
  const main = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(h) ?? /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(h);
  if (main && main[1].length > 400) h = main[1];
  return h.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
}

/* ------------------------------------- self-declared programme vocabulary - */
// Companies that publish separate "channel/reseller partner" and "technology
// partner" pages are labelling their own programme. That is stronger evidence
// than any lexicon score we compute.
export function selfDeclaredProgramTypes(urls) {
  const map = [
    ['reseller', /(reseller|revendeur|wederverkoper|distributor|distributeur|verdeler|var\b)/i],
    ['referral', /(referral|referrer|introducer|tipgever)/i],
    ['channel', /(channel-partner|channelpartner|channel_program)/i],
    ['implementation', /(implementation-partner|solution-partner|system-?integrator|consulting-partner|delivery-partner)/i],
    ['installer_dealer', /(installer|installateur|dealer|handler|monteur|fitter)/i],
    ['agency', /(agency-partner|agencies|bureau-partner)/i],
    ['msp', /(\bmsp\b|managed-service)/i],
    ['technology', /(technology-partner|tech-partner|integration-partner|isv-partner)/i],
    ['affiliate', /(affiliate|ambassador|influencer)/i],
    ['accountant', /(accountant|boekhouder|comptable|steuerberater|bookkeeper)/i],
  ];
  const found = {};
  for (const u of urls) for (const [k, re] of map) if (re.test(u)) (found[k] ??= []).push(u);
  return found;
}
