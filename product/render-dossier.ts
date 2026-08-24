/**
 * Render a dossier as text carrying exactly what the product's dossier screen shows.
 *
 * Used for the seller-efficiency experiment so the assistant arm reviews the real product
 * output rather than a summary of it. Anything omitted here would inflate the result.
 */
import type { Dossier } from '../src/dossier/types.js';

const h = (s: string) => `\n## ${s}\n`;

/**
 * Standing limits, stated ONCE per document rather than in every dossier.
 *
 * Both blind reviewers reported that the identical CRM, people, timeline and
 * "why it may matter" blocks made roughly half the file uninformative, and that they
 * stopped reading them after the second company. Repeating a caveat until it is skipped is
 * worse than stating it once where it will be read.
 */
export const STANDING_LIMITS = `# How to read these dossiers

Every quote below is verbatim, with the URL it came from. Read the quote, not the label.

Standing limits, true of every dossier in this file — not repeated per company:

- **CRM unknown is the normal case.** Public CRM detection was measured at 33% recall against
  companies that provably run a supported CRM, and Salesforce was never detected once.
  Unknown never means "no CRM" and never means "not HubSpot".
- **Partner people are not publicly observable.** 2 of 18 companies yielded any person
  evidence. Unknown never means "no partner team", and team size is never a disqualifier.
- **Every account is at its first observation.** A first observation is never a change, so no
  timing or "why now" claim is available for anyone yet.
- **Sparse evidence describes what a company publishes, not how good a prospect it is.**
- **Category classification is advisory.** It catches roughly 57% of partner-tech vendors
  out-of-sample. Its disqualifying rules have not yet wrongly excluded a genuine target in 13
  cases, which bounds that error at roughly 21% rather than establishing it as zero. Treat a
  flag as worth checking and the absence of one as meaning nothing.
- **A partner directory count is a lower bound**, and usually a filtered view.

`;

export function renderDossier(d: Dossier): string {
  const L: string[] = [];
  L.push(`# ${d.companyName ?? d.domain}  (${d.domain})`);
  L.push(`Last checked ${d.builtAt.slice(0, 10)} · evidence coverage: ${d.evidenceCoverage}`);

  L.push(h('Commercial summary'));
  L.push(d.commercialSummary);

  L.push(h('Machine interpretation (advisory — not a verdict)'));
  L.push(`State: ${d.machineInterpretation.state}`);
  for (const r of d.machineInterpretation.reasons) L.push(`  - ${r}`);
  const g = d.machineInterpretation.diagnostics;
  L.push(`  diagnostics: ${g.observationCount} observations → ${g.distinctClaimCount} distinct claims from ${g.independentSourceCount} independent source(s); coverage ${g.publicationDensity}${g.volumeSensitive ? '; VOLUME-SENSITIVE: much of this evidence is repetition' : ''}`);

  L.push(h('Category'));
  L.push(`State: ${d.category.state}`);
  L.push(`  Why it may matter: ${d.category.whyItMatters}`);
  L.push(`  Why it may not: ${d.category.whyItMayNotMatter}`);
  L.push(`  Unknown: ${d.category.unknown}`);
  L.push(`  Known-competitor list: ${d.category.knownCompetitorList.onList ? 'LISTED' : 'not listed'} (asserted business data, separate from the inference above)`);
  for (const s of d.category.signals.slice(0, 2)) L.push(`  evidence [${s.sourceType}] "${s.quote.slice(0, 220)}"  — ${s.url}`);

  L.push(h('Constructs'));
  for (const c of d.constructs) {
    L.push(`### ${c.construct}: ${c.state}`);
    // The why-blocks are per-construct constants; printing them only where there is
    // evidence to weigh keeps them readable instead of skipped.
    if (c.evidence.length > 0) {
      L.push(`  Why it may matter: ${c.whyItMatters}`);
      L.push(`  Why it may not: ${c.whyItMayNotMatter}`);
    }
    L.push(`  Unknown: ${c.unknown.join(' · ')}`);
    L.push(`  Source quality: ${c.sourceQuality.distinctClaims} distinct claims from ${c.sourceQuality.independentSources} independent source(s)`);
    for (const o of c.evidence) {
      L.push(`  · "${o.quote}"`);
      L.push(`      source: ${o.sourceUrl}${o.duplicateCount && o.duplicateCount > 1 ? `  (same claim seen ${o.duplicateCount}×)` : ''}`);
      L.push(`      proves: ${o.proves}`);
      L.push(`      does NOT prove: ${o.doesNotProve}`);
    }
    if (c.evidence.length === 0) L.push('  (no evidence collected for this construct)');
  }

  if (d.partnerDirectory.isDirectory) {
    L.push(h('Partner directory'));
    L.push(`At least ${d.partnerDirectory.lowerBound} partner organisations publicly listed${d.partnerDirectory.certificationLanguage ? ', described as certified' : ''}.`);
    L.push(`This is a LOWER BOUND, not a partner count. Sample: ${d.partnerDirectory.sampleNames.join(', ')}`);
    L.push(`Source: ${d.partnerDirectory.sourceUrl}`);
  }

  L.push(h('Programmes'));
  if (!d.programmes.length) L.push('None identified from the pages retrieved. This is not evidence that none exists.');
  for (const p of d.programmes) {
    L.push(`### ${p.kind}${p.publishedName ? ` — "${p.publishedName}"` : ''}`);
    for (const s of p.surfaces) L.push(`  [${s.state === 'confirmed' ? 'CONFIRMED' : s.state}] ${s.surface}`);
    for (const o of p.evidence.slice(0, 2)) L.push(`  · "${o.quote.slice(0, 240)}"  — ${o.sourceUrl}`);
  }

  // Only the varying half is printed; the standing caveats live in the preamble.
  L.push(h('Systems and people'));
  L.push(`CRM: ${d.systems.crm.state}${d.systems.crm.state !== 'unknown' ? ` — ${d.systems.crm.note}` : ''}`);
  L.push(`Partner platform: ${d.systems.prm.state}${d.systems.prm.vendor ? ` (${d.systems.prm.vendor})` : ''}${d.systems.prm.state !== 'unknown' ? ` — ${d.systems.prm.note}` : ''}`);
  L.push(`People: ${d.people.state}`);

  if (d.contradictions.length) {
    L.push(h('Contradictions'));
    for (const c of d.contradictions) {
      L.push(`### ${c.topic}`);
      L.push(`  A: ${c.positionA.claim}`);
      L.push(`  B: ${c.positionB.claim}`);
      L.push(`  Effect: ${c.effect}`);
    }
  }

  L.push(h('What to verify next'));
  if (!d.researchTasks.length) L.push('No blocking question identified.');
  for (const t of d.researchTasks) {
    L.push(`  Q: ${t.question}`);
    L.push(`     why it blocks: ${t.whyItBlocks}`);
    L.push(`     where to look: ${t.whereToLook}`);
  }

  if (d.temporal.state !== 'first_observation') {
    L.push(h('Timeline'));
    L.push(`${d.temporal.state} — ${d.temporal.note}`);
  }

  L.push(h('Retrieval health'));
  L.push(d.sourceHealth.map((s) => `${s.url}: ${s.health}`).join('\n'));

  return L.join('\n');
}
