/**
 * Dossier assembly.
 *
 * Every panel is built from evidence that was actually collected, and every panel that has
 * no evidence says so rather than disappearing. The builder does not decide anything
 * commercial: it produces an advisory machine interpretation clearly labelled as such, and
 * leaves `humanReview` null for a person to fill in.
 */

import { assessCompany, type Assessment } from '../pipeline/assess.js';
import { collectPositioning } from '../evidence/positioning.js';
import { classifyCategory } from '../category/classify.js';
import { loadKnownCompetitors } from '../category/known-competitors.js';
import { assessCrm } from '../evidence/crm.js';
import { assessPrm, detectPrmInText } from '../evidence/prm.js';
import { get, snapToSentences } from '../lib/http.js';
import { dedupe } from './dedup.js';
import { scanSurfaces, SURFACE_DEFS } from './surfaces.js';
import { detectProgrammes } from './programmes.js';
import { detectDirectory, NO_DIRECTORY } from './directory.js';
import { isContentPath, isPartnerSource, isReadableQuote, partitionAttributable } from './attribution.js';
import { buildCommercialSummary } from './summary.js';
import type {
  ConstructPanel, Contradiction, Dossier, MachineInterpretation, Observation,
  Programme, PublicationDiagnostics, ResearchTask, SurfaceFinding, SystemsPanel,
} from './types.js';
import type { SourceHealth } from '../evidence/positioning.js';

let obsSeq = 0;
function obs(o: Omit<Observation, 'id'>): Observation {
  return { id: `o${++obsSeq}`, ...o };
}

export interface BuildOptions {
  distributionIndex?: Parameters<typeof assessCompany>[1] extends { distributionIndex?: infer D } ? D : never;
  name?: string;
  /** Pre-computed assessment, so a caller can avoid re-crawling. */
  assessment?: Assessment;
}

export async function buildDossier(domain: string, opts: BuildOptions = {}): Promise<Dossier> {
  const bare = domain.replace(/^www\./, '');
  const builtAt = new Date().toISOString();

  const [assessment, positioning] = await Promise.all([
    opts.assessment ? Promise.resolve(opts.assessment) : assessCompany(bare, { name: opts.name, distributionIndex: opts.distributionIndex as any }),
    collectPositioning(bare),
  ]);

  const known = loadKnownCompetitors();
  const category = classifyCategory(bare, positioning, known);

  /* ── pages we actually read, reused by every text detector ─────────────── */
  const pages = assessment.pagesFetched
    .filter((p) => p.status >= 200 && p.status < 300 && p.chars > 0)
    .map((p) => ({ url: p.url, text: '', html: '' }));
  // The pipeline discards page text, so re-read from the HTTP cache. Cached reads are free
  // and keep the dossier consistent with what the assessment actually saw. Raw HTML is kept
  // too: directory detection counts outbound links, which tag stripping destroys.
  const { mainContent } = await import('../lib/http.js');
  for (const p of pages) {
    const r = await get(p.url);
    if (r.ok && r.body) { p.html = r.body; p.text = mainContent(r.body); }
  }
  const readable = pages.filter((p) => p.text.length > 80);
  // Programme and directory detection get the SAME attribution filter as the probes. The
  // guard previously protected one consumer of three, which is how Juro's contract-template
  // page still produced a "reseller motion" and Productsup's customer-segment page still
  // produced a "distributor motion" after the guard shipped.
  const attributablePages = readable.filter((p) => !isContentPath(p.url));
  const directory = detectDirectory(attributablePages, bare);

  /* ── constructs ────────────────────────────────────────────────────────── */
  const positive = assessment.positive;
  // Upstream snippets are character-windowed, so they routinely begin mid-word. Snapping
  // here keeps every quote in the dossier readable without changing the detector.
  const rawObs = (positive?.observations ?? []).map((o) => ({
    quote: snapToSentences(o.quote), sourceUrl: o.sourceUrl,
    construct: o.construct, proves: o.proves, doesNotProve: o.doesNotProve,
  }));
  // Drop observations that cannot be attributed to the partner motion. Both blind reviewers
  // found keyword matches from product marketing carrying confident partner labels, and the
  // summary repeats the label without the quote — so an unattributable claim is worse than
  // no claim. The count of drops is kept and surfaced rather than hidden.
  const { kept: attributableRaw, dropped: unattributable } = partitionAttributable(rawObs);
  const attributable = attributableRaw.filter((o) => isReadableQuote(o.quote));
  const deduped = dedupe(attributable);

  const toObservation = (o: typeof deduped.canonical[number], strength: Observation['strength']): Observation => obs({
    quote: o.quote, sourceUrl: o.sourceUrl ?? '', sourceType: 'partner_surface',
    retrievedAt: assessment.retrievedAt, strength,
    proves: o.proves, doesNotProve: o.doesNotProve,
    duplicateCount: o.duplicateCount, alsoSeenAt: o.alsoSeenAt,
  });

  const byConstruct = (name: string) => deduped.canonical.filter((o: any) => o.construct === name);

  /**
   * A construct state may never outrun its own evidence.
   *
   * The states came from the Phase 3 detector, which runs BEFORE the attribution guard,
   * while the evidence shown came from AFTER it. That produced labels like
   * `commercial_materiality: strong_proxy` beside `0 distinct claims from 0 independent
   * sources` — an unsourced assertion in a field named after evidence. The guard made this
   * worse rather than better: it removed the quote a careful reader used to catch the error
   * and left the confident label standing alone.
   *
   * So a state with no surviving evidence collapses to `unknown`, and a state resting on a
   * single claim cannot exceed `strong_proxy` / `moderate`. Downgrading is always safe;
   * asserting past the evidence never is.
   */
  const gate = <T extends string>(state: T, n: number, fallback: T, capped?: Partial<Record<string, T>>): T => {
    if (n === 0) return fallback;
    if (n === 1 && capped && capped[state]) return capped[state] as T;
    return state;
  };
  const nMat = byConstruct('materiality').length;
  const nOwn = byConstruct('ownership').length;
  const nSurf = byConstruct('surface').length;

  const constructs: ConstructPanel[] = [
    buildConstruct('commercial_materiality',
      gate(positive?.materiality ?? 'unknown', nMat, 'unknown', { confirmed: 'strong_proxy' }),
      byConstruct('materiality'), deduped, toObservation,
      'Partners appear to take part in winning customers or revenue, which is what makes partner operations worth tooling.',
      'It does not establish how much revenue, how many partners, or whether the motion is active today.',
      ['partner-sourced revenue share', 'number of active partners']),
    buildConstruct('operational_ownership',
      gate(positive?.ownership ?? 'unknown', nOwn, 'unknown'),
      byConstruct('ownership'), deduped, toObservation,
      'The company appears to run the partner motion itself, so it would be the buyer of tooling rather than a participant in someone else\'s.',
      'Operating a programme says nothing about its size; a competitor with an excellent programme scores identically here.',
      ['who owns the programme internally', 'whether operation is shared with a distributor']),
    buildConstruct('operational_surface',
      gate(positive?.surface ?? 'unknown', nSurf, 'unknown', { rich: 'moderate' }),
      byConstruct('surface'), deduped, toObservation,
      'Visible partner workflows suggest there is machinery that software could reduce the manual cost of.',
      'A published workflow is not a used workflow, and login-walled machinery is invisible either way.',
      ['volume through each workflow', 'what sits behind the partner login']),
  ];

  /* ── programmes and surfaces ───────────────────────────────────────────── */
  const progHits = detectProgrammes(attributablePages).filter((h) => isReadableQuote(h.quote));
  const progDedup = dedupe(progHits);
  const programmes: Programme[] = [...new Set(progHits.map((p) => p.kind))].map((kind) => {
    const mine = progDedup.canonical.filter((h: any) => h.kind === kind);
    return {
      kind,
      publishedName: (mine.find((m: any) => m.publishedName) as any)?.publishedName ?? null,
      evidence: mine.map((m: any) => obs({
        quote: m.quote, sourceUrl: m.sourceUrl, sourceType: 'partner_surface', retrievedAt: assessment.retrievedAt,
        strength: 'strong_proxy', proves: `the company uses ${kind.replace(/_/g, ' ')} partner vocabulary about itself`,
        doesNotProve: 'that the programme is active, staffed or material',
        duplicateCount: m.duplicateCount, alsoSeenAt: m.alsoSeenAt,
      })),
      surfaces: [],
    };
  // A programme whose evidence was all deduplicated or dropped has nothing to show; an empty
  // card asserts a motion exists while offering nothing to check it against.
  }).filter((p) => p.evidence.length > 0);

  const scan = scanSurfaces(attributablePages);
  scan.hits = scan.hits.filter((h) => isReadableQuote(h.quote));
  const surfaces: SurfaceFinding[] = SURFACE_DEFS.map((def) => {
    const hits = scan.hits.filter((h) => h.surface === def.surface);
    if (scan.couldNotLook) return { surface: def.surface, state: 'unknown' as const, evidence: [] };
    if (!hits.length) return { surface: def.surface, state: 'not_observed' as const, evidence: [] };
    const d = dedupe(hits);
    return {
      surface: def.surface, state: 'confirmed' as const,
      evidence: d.canonical.map((h: any) => obs({
        quote: h.quote, sourceUrl: h.sourceUrl, sourceType: 'partner_surface', retrievedAt: assessment.retrievedAt,
        strength: 'strong_proxy', proves: h.proves, doesNotProve: h.doesNotProve,
        duplicateCount: h.duplicateCount, alsoSeenAt: h.alsoSeenAt,
      })),
    };
  });
  // Surfaces live at the DOSSIER level only. Detection is company-wide, so attaching them to
  // `programmes[0]` both misattributed them to whichever programme happened to sort first and
  // — when no programme was detected at all — dropped every quote behind a claim the summary
  // still made. All three states are kept, because `not_observed` and `unknown` are different
  // facts and neither means "absent".

  /* ── systems ───────────────────────────────────────────────────────────── */
  const crmBodies: string[] = [];
  for (const u of [`https://www.${bare}/`, `https://${bare}/`, `https://www.${bare}/contact`, `https://www.${bare}/demo`, `https://www.${bare}/pricing`]) {
    const r = await get(u);
    if (r.ok && r.body) crmBodies.push(r.body);
  }
  const crm = assessCrm(crmBodies);
  const prm = assessPrm(
    assessment.dns.platform ? [{ host: assessment.dns.platform.host, cname: assessment.dns.platform.cname, distinct: true, nonProd: false }] : [],
    assessment.dns.lookupFailures,
  );

  // Text-side platform detection over the partner pages already fetched. Costs nothing and
  // catches deployments DNS cannot see.
  const prmText = detectPrmInText(attributablePages, isPartnerSource as (u: string) => boolean);
  const competitorNamed = prmText.filter((h) => h.vendor !== 'Introw');

  const systems: SystemsPanel = {
    crm: {
      state: crm.vendor === 'hubspot' ? 'hubspot_confirmed'
        : crm.vendor === 'salesforce' ? 'salesforce_confirmed'
        : crm.vendor ? 'other_crm_confirmed' : 'unknown',
      evidence: crm.observations.map((o) => obs({
        quote: o.matched, sourceUrl: `https://${bare}/`, sourceType: 'html_artifact', retrievedAt: builtAt,
        strength: o.state === 'confirmed' ? 'confirmed' : 'strong_proxy', proves: o.proves, doesNotProve: o.doesNotProve,
      })),
      // Measured: 33% recall against a group that provably runs a supported CRM.
      note: crm.vendor
        ? crm.rationale
        : 'No CRM artifact found on the retrieved pages. This is not evidence that the company has no CRM, and not evidence that it is not HubSpot or Salesforce. Public CRM detection was measured at 33% recall against companies known to run a supported CRM, and Salesforce was never detected at all.',
    },
    prm: {
      state: prm.detections.some((d) => d.vendor === 'introw') || prmText.some((h) => h.vendor === 'Introw') ? 'introw_confirmed'
        : prm.detections.some((d) => d.category === 'prm') || competitorNamed.length ? 'competitor_prm_confirmed'
        : prm.detections.length ? 'other_prm_confirmed' : 'unknown',
      vendor: prm.detections[0]?.label ?? prmText[0]?.vendor ?? null,
      evidence: [...prmText.map((h) => obs({
        quote: h.quote, sourceUrl: h.sourceUrl, sourceType: 'partner_page_text',
        retrievedAt: assessment.retrievedAt, strength: 'strong_proxy',
        proves: h.proves, doesNotProve: h.doesNotProve,
      })), ...prm.detections.map((d) => obs({
        quote: `${d.host} → ${d.cname.join(', ')}`, sourceUrl: `dns:${d.host}`, sourceType: 'dns_cname', retrievedAt: d.observedAt,
        strength: d.state === 'confirmed' ? 'confirmed' : 'weak_proxy',
        proves: `the partner surface at ${d.host} is served by ${d.label}`,
        doesNotProve: d.cannotEstablish,
      }))],
      note: (prm.detections.some((d) => d.category === 'prm' && d.vendor !== 'introw') || competitorNamed.length > 0)
        ? 'A competitor PRM is in use. This indicates programme maturity. It does NOT indicate dissatisfaction, contract timing, or any intent to switch.'
        : prm.note,
    },
  };

  /* ── coverage, diagnostics, interpretation ─────────────────────────────── */
  // A directory of named partner organisations is substantial evidence even when the
  // programme prose detectors find nothing, so it lifts coverage out of `none`.
  /**
   * Coverage describes the evidence we actually hold, so it is computed from the surviving
   * claims rather than inherited from the pre-attribution detector. Foleon previously read
   * `coverage: moderate` beside `0 observations → 0 distinct claims`, and Channable read
   * `coverage: none` beside three sourced claims — both incoherent, and a reviewer filtering
   * on the column would have got the inverse of what they asked for.
   */
  const claims = deduped.distinctClaimCount;
  const dirBonus = directory.isDirectory ? (directory.lowerBound >= 25 ? 2 : 1) : 0;
  const weight = claims + dirBonus * 2;
  const density: 'rich' | 'moderate' | 'sparse' | 'none' =
    weight === 0 ? 'none' : weight >= 8 ? 'rich' : weight >= 4 ? 'moderate' : 'sparse';
  const diagnostics: PublicationDiagnostics = {
    observationCount: deduped.observationCount,
    distinctClaimCount: deduped.distinctClaimCount,
    independentSourceCount: deduped.independentSourceCount,
    publicationDensity: density,
    constructEvidenceCount: constructs.reduce((n, c) => n + c.evidence.length, 0),
    // Programme and surface findings are evidence too. Counting only the probe observations
    // made the interpretation announce "No distinct partner claim was retrieved" on the same
    // screen as a summary naming the company's partner programme.
    supportingFindingCount: programmes.length + surfaces.filter((s) => s.state === 'confirmed').length + (directory.isDirectory ? 1 : 0),
    volumeSensitive: deduped.observationCount >= 9 && deduped.distinctClaimCount < deduped.observationCount * 0.7,
    unattributableDropped: unattributable.length,
  };

  const contradictions = buildContradictions(assessment, category, systems);
  const machineInterpretation = interpret(assessment, category, diagnostics, contradictions, directory, constructs);
  const researchTasks = buildResearchTasks(assessment, category, systems, diagnostics, constructs, directory);

  const selfDescription = positioning.items.find((i) => i.sourceType === 'meta_description' || i.sourceType === 'og_description' || i.sourceType === 'homepage_hero');

  const commercialSummary = buildCommercialSummary({
    companyName: opts.name ?? null,
    selfDescription: selfDescription?.text ?? null,
    programmes, surfaces, constructs, systems,
    people: { state: 'unknown', people: [], note: '' },
    coverage: density, categoryState: category.state,
    partnerPathsChecked: assessment.partnerPathAttempts.length,
    partnerDirectoryLowerBound: directory.isDirectory ? directory.lowerBound : null,
    directoryCertified: directory.certificationLanguage,
  });

  /**
   * When we actually looked, taken from the oldest contributing retrieval rather than from
   * the clock. The HTTP layer caches without expiry, so `builtAt` could stamp today's date
   * on a page fetched days earlier — a dossier reading "Last checked 24 Aug" over content
   * retrieved on the 21st, with nothing on screen to reveal it.
   */
  const retrievalTimes = [
    ...positioning.items.map((i) => i.retrievedAt),
    assessment.retrievedAt,
  ].filter(Boolean).sort();
  const oldestEvidenceAt = retrievalTimes[0] ?? builtAt;

  return {
    domain: bare,
    companyName: opts.name ?? null,
    selfDescription: selfDescription ? { text: selfDescription.text, sourceUrl: selfDescription.url } : null,
    geography: null,
    builtAt,
    oldestEvidenceAt,
    category: { ...category, knownCompetitorList: { onList: known.isKnownCompetitor(bare), lastReviewed: known.lastReviewed } },
    constructs, programmes,
    surfaces,
    partnerDirectory: {
      ...directory,
      observation: directory.isDirectory && directory.sourceUrl ? obs({
        quote: directory.evidenceQuote ?? '', sourceUrl: directory.sourceUrl, sourceType: 'partner_directory',
        retrievedAt: assessment.retrievedAt, strength: 'confirmed',
        proves: `the company publicly lists at least ${directory.lowerBound} partner organisations`,
        doesNotProve: 'the true number of partners, that they transact, or that the list is current — a directory is a lower bound and usually a filtered view',
      }) : null,
    },
    systems,
    people: {
      state: 'unknown', people: [],
      // No person lookup runs in this pipeline, so the note must say that rather than
      // report a null result. Measurement found public person evidence for 2 of 18
      // companies, which is why no crawler was built.
      note: 'No person lookup was performed for this account. Public person discovery was measured at 2 of 18 companies and is not viable, so the pipeline does not attempt it. This is not evidence that no partner team exists, and team size below two is never a disqualifier.',
    },
    temporal: {
      state: 'first_observation', baselineAt: builtAt, lastCheckedAt: builtAt, changes: [],
      note: 'First observation; no second dated observation exists to compare against, so no change can be reported. A first observation is never a change.',
    },
    contradictions, researchTasks,
    evidenceCoverage: density,
    coverageNote: density === 'sparse' || density === 'none'
      ? 'Sparse public evidence. This describes how much this company publishes, not how good a prospect it is.'
      : 'Public evidence was sufficient to read the partner surfaces that exist.',
    // Partner-path attempts are merged into source health so "no programme identified" is
    // interpretable: a logged 404 on /partners means something, a missing entry does not.
    /**
     * The union of BOTH pipelines. Health previously reported only the category
     * classifier's fetches — /product, /compare, /vs — while the partner pages that produced
     * 100% of the commercial content were invisible. Sana Commerce drew all eight of its
     * claims from /our-partners/ and its health block listed not one partner URL, which made
     * the entire Data Health view a monitor of the pipeline nobody buys.
     */
    sourceHealth: [
      ...positioning.health,
      ...assessment.pagesFetched.map((p) => ({
        url: p.url,
        health: (p.status >= 200 && p.status < 300 && p.chars > 200 ? 'success'
          : p.status === 404 ? 'not_found'
          : p.status >= 200 && p.status < 300 ? 'no_relevant_evidence'
          : p.status === 0 ? 'unknown' : 'not_found') as SourceHealth,
        status: p.status,
      })),
      ...assessment.partnerPathAttempts.map((p) => ({
        url: p.url,
        health: (p.outcome === 'found' ? 'success'
          : p.outcome === 'blocked' ? 'blocked'
          : p.outcome === 'error' ? 'unknown'
          : p.outcome === 'thin' ? 'no_relevant_evidence'
          : 'not_found') as SourceHealth,
        status: p.status,
      })),
    ],
    commercialSummary,
    machineInterpretation,
    humanReview: null,
    provenance: 'real_observation',
  };
}

function buildConstruct(
  construct: ConstructPanel['construct'],
  state: string,
  items: any[],
  deduped: ReturnType<typeof dedupe>,
  toObservation: (o: any, s: Observation['strength']) => Observation,
  whyItMatters: string,
  whyItMayNotMatter: string,
  unknown: string[],
): ConstructPanel {
  return {
    construct, state,
    evidence: items.map((o) => toObservation(o, state === 'confirmed' ? 'confirmed' : 'strong_proxy')),
    counterEvidence: [],
    unknown,
    sourceQuality: {
      distinctClaims: items.length,
      independentSources: new Set(items.map((o: any) => { try { return new URL(o.sourceUrl).hostname; } catch { return o.sourceUrl; } })).size,
      observedItems: deduped.observationCount,
    },
    whyItMatters, whyItMayNotMatter,
  };
}

function buildContradictions(a: Assessment, category: any, systems: SystemsPanel): Contradiction[] {
  const out: Contradiction[] = [];

  // The classifier and the maintained list can disagree. Neither wins silently.
  if (category.knownCompetitorList?.onList === false && category.state === 'partner_tech_vendor') {
    out.push({
      topic: 'Competitor status',
      positionA: { claim: 'The company positions its own product as partner management.', evidence: [] },
      positionB: { claim: 'It does not appear on the maintained competitor list.', evidence: [] },
      effect: 'Either the list is incomplete or the positioning is misleading. Worth resolving before outreach.',
    });
  }

  if (a.operator?.direction === 'both') {
    out.push({
      topic: 'Operator or participant',
      positionA: { claim: 'Pages describe the company recruiting its own partners.', evidence: [] },
      positionB: { claim: 'Pages also describe the company as a partner in someone else\'s programme.', evidence: [] },
      effect: 'Partner evidence on this site may belong to another vendor\'s programme. Attribution must be checked before the evidence is trusted.',
    });
  }

  if (systems.prm.state === 'competitor_prm_confirmed' && category.state === 'likely_target_category') {
    out.push({
      topic: 'Incumbent platform',
      positionA: { claim: 'A competitor PRM serves the partner surface.', evidence: systems.prm.evidence },
      positionB: { claim: 'Nothing observed indicates dissatisfaction or contract timing.', evidence: [] },
      effect: 'Programme maturity is evidenced; switching intent is not, and must not be inferred.',
    });
  }

  return out;
}

/**
 * Machine interpretation. Advisory only, and explicitly labelled as such everywhere it
 * appears. The states deliberately do not form an ordering.
 */
function interpret(
  a: Assessment, category: any, d: PublicationDiagnostics, contradictions: Contradiction[],
  directory: typeof NO_DIRECTORY, constructs: ConstructPanel[],
): MachineInterpretation {
  const disclaimer = 'Machine interpretation of collected evidence. Not a commercial verdict, not a prediction, and not comparable across companies.';
  const reasons: string[] = [];

  // The apex domain being blocked does not mean nothing was read: Channable's apex returned
  // 429 while partners.channable.com retrieved cleanly, and the interpretation still said
  // "nothing here is evidence about the company" directly above three sourced claims.
  if (!a.reachable && d.distinctClaimCount === 0 && !directory.isDirectory) {
    return { state: 'under_observed', disclaimer, diagnostics: d,
      reasons: [`The site could not be retrieved (${a.blockReason ?? 'unknown reason'}). Nothing here is evidence about the company.`] };
  }
  if (!a.reachable) {
    reasons.push(`The main domain could not be retrieved (${a.blockReason ?? 'unknown reason'}), but other surfaces were read; treat coverage as partial.`);
  }

  if (category.state === 'partner_tech_vendor' || category.state === 'direct_introw_competitor') {
    reasons.push(category.state === 'direct_introw_competitor'
      ? 'Listed as a known competitor (asserted business data).'
      : 'Own product positioning is partner management.');
    return { state: 'suppression_candidate', disclaimer, reasons, diagnostics: d };
  }
  if (category.state === 'supply_side_marketplace') {
    reasons.push('Partners appear to be supply rather than a route to market.');
    return { state: 'suppression_candidate', disclaimer, reasons, diagnostics: d };
  }

  if (directory.isDirectory) {
    reasons.push(`A published directory lists at least ${directory.lowerBound} partner organisations${directory.certificationLanguage ? ', described as certified' : ''}.`);
  }

  if (d.distinctClaimCount === 0 && !directory.isDirectory && d.supportingFindingCount === 0) {
    reasons.push('No distinct partner claim was retrieved. This reflects what the company publishes, not its suitability.');
    return { state: 'under_observed', disclaimer, reasons, diagnostics: d };
  }
  if (d.distinctClaimCount === 0 && d.supportingFindingCount > 0) {
    reasons.push(`No construct-level claim survived attribution, but ${d.supportingFindingCount} programme or workflow finding(s) were observed. Read those quotes directly.`);
    return { state: 'research', disclaimer, reasons, diagnostics: d };
  }

  if (d.distinctClaimCount === 0 && directory.isDirectory) {
    // The programme prose says nothing, but a named list of partner organisations is not
    // nothing. This is a research case, not an under-observed one.
    reasons.push('Programme prose is absent, so how the relationships work is unestablished.');
    return { state: 'research', disclaimer, reasons, diagnostics: d };
  }

  if (d.volumeSensitive) {
    reasons.push(`${d.observationCount} observations reduced to ${d.distinctClaimCount} distinct claims — much of the evidence is repetition, so treat density as weak.`);
  }
  if (contradictions.length) reasons.push(`${contradictions.length} unresolved contradiction${contradictions.length > 1 ? 's' : ''} in the evidence.`);

  // Read the GATED states, not the raw detector output — otherwise the interpretation is
  // computed from evidence the dossier has already discarded, and disagrees with the panels
  // printed beside it.
  const mat = constructs.find((c) => c.construct === 'commercial_materiality')?.state;
  const own = constructs.find((c) => c.construct === 'operational_ownership')?.state;
  const surf = constructs.find((c) => c.construct === 'operational_surface')?.state;

  // Operational surface is required. Two promotion rules existed in this codebase and the
  // dossier used the laxer one, which is how Planhat reached the top state with
  // `operational_surface: unknown` — the single construct that speaks to whether Introw's
  // product would have anything to do.
  const surfaceObserved = surf === 'rich' || surf === 'moderate' || surf === 'light';

  if ((mat === 'confirmed' || mat === 'strong_proxy') && own === 'direct' && surfaceObserved && d.distinctClaimCount >= 3) {
    reasons.push('Partners are described as taking part in revenue, the company appears to operate the motion itself, and partner workflows are visible.');
    return { state: contradictions.length ? 'research' : 'strong_evidence', disclaimer, reasons, diagnostics: d };
  }
  if ((mat === 'confirmed' || mat === 'strong_proxy') && own === 'direct' && !surfaceObserved) {
    reasons.push('Partners are described as taking part in revenue, but no partner workflow was observed — so there is no evidence of machinery for software to reduce.');
    return { state: 'research', disclaimer, reasons, diagnostics: d };
  }
  if (mat === 'weak_proxy' || own === 'unknown') {
    reasons.push('Partner motion is visible but its commercial role is not established.');
    return { state: 'research', disclaimer, reasons, diagnostics: d };
  }
  reasons.push('Partner evidence exists but does not support a confident reading.');
  return { state: 'plausible', disclaimer, reasons, diagnostics: d };
}

/** The smallest question that would move the decision — never "more research needed". */
function buildResearchTasks(a: Assessment, category: any, systems: SystemsPanel, d: PublicationDiagnostics, constructs: ConstructPanel[], directory: typeof NO_DIRECTORY): ResearchTask[] {
  const tasks: ResearchTask[] = [];

  // "No blocking question identified" appeared on the two dossiers with literally zero
  // evidence, inverting the signal exactly where caution matters most. When we know nothing,
  // everything is blocking, and the dossier must say so first.
  if (d.distinctClaimCount === 0) {
    tasks.push(directory.isDirectory
      ? { question: 'How do these partner relationships actually work commercially?',
          whyItBlocks: `A directory lists at least ${directory.lowerBound} organisations, but no programme prose was retrieved — so whether they resell, refer, implement or merely integrate is entirely unestablished.`,
          whereToLook: 'The partner page behind the directory, or the terms-and-conditions page, which usually states the commercial mechanics plainly.',
          resolves: 'commercial_materiality' }
      : { question: 'Does this company run a partner programme at all?',
          whyItBlocks: 'No partner claim was retrieved, so nothing here supports or refutes fit. Everything is blocking.',
          whereToLook: 'Check the site footer and main navigation for a partner link, then search for the company name with "partner program".',
          resolves: 'commercial_materiality' });
  }

  if (category.state === 'unknown') {
    tasks.push({ question: 'What does this company sell?', whyItBlocks: 'Without the product category we cannot tell an operator from a partner-tech vendor, which is the single most common way this system is wrong.', whereToLook: 'The homepage headline, or the first line of the About page.', resolves: 'category' });
  }
  if (category.state === 'partner_tech_vendor') {
    tasks.push({ question: 'Is partner management the whole product, or one module of a broader one?', whyItBlocks: 'A company with a partner-management module may still be a customer; a pure PRM vendor will not be.', whereToLook: 'The pricing page or the product menu.', resolves: 'category' });
  }
  if (a.operator?.direction === 'both' || a.operator?.direction === 'unknown') {
    tasks.push({ question: 'Does this company recruit its own partners, or has it joined someone else\'s programme?', whyItBlocks: 'Participant pages read exactly like operator pages, and the evidence would belong to a different company.', whereToLook: 'Look for a "become a partner" intake form on this domain, not a partner badge.', resolves: 'operational_ownership' });
  }
  if (systems.crm.state === 'unknown') {
    tasks.push({ question: 'Which CRM does the partner team use?', whyItBlocks: 'Introw syncs into HubSpot or Salesforce; the answer is unobservable publicly about two-thirds of the time.', whereToLook: 'Ask on the first call. Public detection is not reliable enough to be worth more effort.', resolves: 'crm' });
  }
  if (d.volumeSensitive) {
    tasks.push({ question: 'Is the partner motion real, or is the same claim repeated across many pages?', whyItBlocks: `${d.observationCount} observations collapsed to ${d.distinctClaimCount} distinct claims.`, whereToLook: 'Open two partner pages from different sections and check whether they say different things.', resolves: 'commercial_materiality' });
  }
  const surface = constructs.find((c) => c.construct === 'operational_surface');
  if (surface && surface.state !== 'rich' && d.distinctClaimCount > 0) {
    tasks.push({ question: 'Is there partner machinery behind a login that we cannot see?', whyItBlocks: 'Deal registration and pipeline usually sit behind the partner portal, so absence of public evidence is expected rather than informative.', whereToLook: 'Check whether a partner login exists at all; its presence implies machinery we cannot inspect.', resolves: 'operational_surface' });
  }

  return tasks;
}
