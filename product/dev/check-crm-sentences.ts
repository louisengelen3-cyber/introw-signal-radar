import { classifySentence, sentences } from '../../src/jobs/crm.js';

// The vendor list is private to crm.ts; re-declare the two that matter for the audit.
const HUBSPOT = { id: 'hubspot', label: 'HubSpot', re: /\bhub\s?spot\b/i };
const SALESFORCE = { id: 'salesforce', label: 'Salesforce', re: /\bsalesforce\b|\bsfdc\b/i };

type Case = [string, string, 'crm_confirmed' | 'crm_supporting_evidence' | 'crm_mention_only' | 'none'];

const CASES: Case[] = [
  // --- must CONFIRM: the company speaks about a system it has -------------------
  ['You will own our HubSpot CRM.', 'hubspot', 'crm_confirmed'],
  ['Own and administer our HubSpot CRM.', 'hubspot', 'crm_confirmed'],
  ['Administer our Salesforce instance.', 'salesforce', 'crm_confirmed'],
  ['Maintain opportunity data in Salesforce.', 'salesforce', 'crm_confirmed'],
  ['Our sales team uses HubSpot to manage pipeline.', 'hubspot', 'crm_confirmed'],
  ['Build workflows in our HubSpot environment.', 'hubspot', 'crm_confirmed'],
  ['Log all customer interactions in HubSpot.', 'hubspot', 'crm_confirmed'],
  ['Maintain Salesforce opportunity stages and pipeline hygiene.', 'salesforce', 'crm_confirmed'],
  ['Track customer activity in Salesforce.', 'salesforce', 'crm_confirmed'],
  ['Manage HubSpot workflows and lifecycle stages.', 'hubspot', 'crm_confirmed'],
  ['Je houdt alles bij in ons HubSpot CRM.', 'hubspot', 'crm_confirmed'],
  ['Du pflegst unsere Salesforce-Daten.', 'salesforce', 'crm_confirmed'],

  // --- must be SUPPORTING only: a skill the candidate should bring --------------
  ['Experience with HubSpot is a plus.', 'hubspot', 'crm_supporting_evidence'],
  ['Experience with HubSpot preferred.', 'hubspot', 'crm_supporting_evidence'],
  ['Proficiency in Salesforce required.', 'salesforce', 'crm_supporting_evidence'],
  ['You have hands-on experience with Salesforce.', 'salesforce', 'crm_supporting_evidence'],
  ['Salesforce certification is an advantage.', 'salesforce', 'crm_supporting_evidence'],
  ['Ervaring met HubSpot is een pré.', 'hubspot', 'crm_supporting_evidence'],

  // --- must be MENTION ONLY: a choice, or a category example --------------------
  ['Experience with CRM systems such as Salesforce or HubSpot.', 'salesforce', 'crm_mention_only'],
  ['Experience with CRM systems such as Salesforce or HubSpot.', 'hubspot', 'crm_mention_only'],
  ['Salesforce, HubSpot or similar CRM.', 'hubspot', 'crm_mention_only'],
  ['Familiarity with a modern CRM (e.g. HubSpot).', 'hubspot', 'crm_mention_only'],
  ['You know your way around a CRM like Salesforce.', 'salesforce', 'crm_mention_only'],
  ['We integrate with HubSpot and Salesforce for our customers.', 'hubspot', 'crm_mention_only'],

  // --- must not fire at all ----------------------------------------------------
  ['We are hiring an Account Executive for the Benelux region.', 'hubspot', 'none'],
  ['Visit us at example.com for more information.', 'salesforce', 'none'],
];

let fail = 0;
for (const [sentence, vendorId, expected] of CASES) {
  const vendor = vendorId === 'hubspot' ? HUBSPOT : SALESFORCE;
  const got = classifySentence(sentence, vendor);
  const actual = got?.level ?? 'none';
  const ok = actual === expected;
  if (!ok) { fail++; console.log(`  MISS  [${vendorId}] want ${expected} got ${actual} (${got?.rule ?? '-'})\n        "${sentence}"`); }
}
console.log(`\n${CASES.length - fail}/${CASES.length} classifier cases pass`);

console.log('\nsentence splitting on a realistic bullet block:');
for (const s of sentences('About the role • Own and administer our HubSpot CRM. • Experience with Looker is a plus.\nYou will report to the CRO.'))
  console.log('  -', s);

// --- regression for the rules tightened after the first precision audit -------
const EXTRA: Case[] = [
  ['a trustworthy single source of truth (Salesforce and the broader GTM stack)', 'salesforce', 'crm_confirmed'],
  ['Partner with the Data team on our reporting stack and Salesforce roadmap.', 'salesforce', 'crm_confirmed'],
  ['You will work with the wider GTM stack, and Salesforce knowledge helps.', 'salesforce', 'crm_supporting_evidence'],
  ['Administer the Salesforce org and keep data clean.', 'salesforce', 'crm_confirmed'],
];
let extraFail = 0;
for (const [sentence, vendorId, expected] of EXTRA) {
  const vendor = vendorId === 'hubspot' ? HUBSPOT : SALESFORCE;
  const got = classifySentence(sentence, vendor);
  const actual = got?.level ?? 'none';
  if (actual !== expected) { extraFail++; console.log(`  MISS  want ${expected} got ${actual} (${got?.rule ?? '-'})\n        "${sentence}"`); }
}
console.log(`${EXTRA.length - extraFail}/${EXTRA.length} tightened-rule cases pass`);
