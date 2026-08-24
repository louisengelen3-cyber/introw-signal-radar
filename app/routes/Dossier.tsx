import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CATEGORY_LABEL, CRM_LABEL, MACHINE_LABEL, MATERIALITY_LABEL, OUTCOME_HELP, OUTCOME_LABEL,
  OWNERSHIP_LABEL, PEOPLE_LABEL, PRM_LABEL, SURFACE_LABEL, WORKFLOW_LABEL,
  clearReview, getReview, humanise, loadDossier, logEvent, saveReview, workflowState,
  type ReviewRecord,
} from '../data.js';
import {
  Chip, EmptyState, ErrorState, EvidenceList, Info, Loading, Panel, StateChip, fmtDate, shortUrl, type Tone,
} from '../components/ui.js';
import type { ConstructPanel, Dossier as D, HumanOutcome, SurfaceFinding } from '../../src/dossier/types.js';

/* ── tone mapping: KIND, not quality ─────────────────────────────────────── */

function categoryTone(state: string): Tone {
  if (state === 'direct_introw_competitor' || state === 'partner_tech_vendor') return 'blocker';
  if (state === 'supply_side_marketplace' || state === 'professional_services' || state === 'reseller_or_participant') return 'uncertain';
  // Target-like is the absence of a disqualifying signal, not positive evidence. Neutral.
  return 'neutral';
}

function machineTone(state: string): Tone {
  if (state === 'suppression_candidate') return 'blocker';
  if (state === 'strong_evidence') return 'verified';
  if (state === 'under_observed') return 'neutral';
  return 'uncertain';
}

const constructTone = (state: string): Tone => {
  if (state === 'unknown') return 'neutral';
  if (state === 'contradicted' || state === 'participant_only') return 'blocker';
  if (state === 'weak_proxy' || state === 'light' || state === 'mixed' || state === 'distributor_mediated') return 'uncertain';
  return 'verified';
};

/** "None evidence" is not English. Coverage reads as a phrase, not an enum. */
const COVERAGE_LABEL: Record<string, string> = {
  rich: 'Rich evidence', moderate: 'Moderate evidence', sparse: 'Sparse evidence', none: 'No evidence retrieved',
};

const CONSTRUCT_QUESTION: Record<string, string> = {
  commercial_materiality: 'Do partners visibly take part in winning customers or revenue?',
  operational_ownership: 'Does the company itself operate the partner motion?',
  operational_surface: 'Which partner workflows are publicly visible?',
};

const CONSTRUCT_TITLE: Record<string, string> = {
  commercial_materiality: 'Commercial materiality',
  operational_ownership: 'Operational ownership',
  operational_surface: 'Operational surface',
};

function constructLabel(c: ConstructPanel): string {
  if (c.construct === 'commercial_materiality') return MATERIALITY_LABEL[c.state] ?? humanise(c.state);
  if (c.construct === 'operational_ownership') return OWNERSHIP_LABEL[c.state] ?? humanise(c.state);
  return SURFACE_LABEL[c.state] ?? humanise(c.state);
}

/* ── panels ──────────────────────────────────────────────────────────────── */

function ConstructCard({ c, domain }: { c: ConstructPanel; domain: string }) {
  const [why, setWhy] = useState(false);
  return (
    <Panel
      title={CONSTRUCT_TITLE[c.construct] ?? humanise(c.construct)}
      aside={<StateChip label={constructLabel(c)} tone={constructTone(c.state)} />}
    >
      <p className="q">{CONSTRUCT_QUESTION[c.construct]}</p>
      {c.evidence.length > 0
        ? <EvidenceList items={c.evidence} domain={domain} limit={2} />
        : <p className="dim small">No evidence survived attribution for this construct, so the state is unknown rather than negative.</p>}
      {c.counterEvidence.length > 0 && (
        <>
          <h4 className="sub">Counter-evidence</h4>
          <EvidenceList items={c.counterEvidence} domain={domain} limit={2} />
        </>
      )}
      <div className="unknown-line"><span className="lab">Unknown</span>{c.unknown.join(' · ')}</div>
      <div className="srcq">
        {c.sourceQuality.distinctClaims} distinct {c.sourceQuality.distinctClaims === 1 ? 'claim' : 'claims'} ·{' '}
        {c.sourceQuality.independentSources} independent {c.sourceQuality.independentSources === 1 ? 'source' : 'sources'}
        <Info>Distinct claims after deduplication, and how many separate hosts they came from. Repetition is not additional evidence.</Info>
      </div>
      {c.evidence.length > 0 && (
        <>
          <button className="link-btn" aria-expanded={why} onClick={() => setWhy((v) => !v)}>
            {why ? 'Hide interpretation notes' : 'How to read this state'}
          </button>
          {why && (
            <dl className="why">
              <dt>Why it may matter</dt><dd>{c.whyItMatters}</dd>
              <dt className="neg">Why it may not</dt><dd>{c.whyItMayNotMatter}</dd>
            </dl>
          )}
        </>
      )}
    </Panel>
  );
}

const SURFACE_MARK: Record<SurfaceFinding['state'], string> = { confirmed: '✓', not_observed: '–', unknown: '?' };
const SURFACE_HELP: Record<SurfaceFinding['state'], string> = {
  confirmed: 'Seen on a page we retrieved.',
  not_observed: 'We read surfaces where this usually appears and did not see it. This is NOT evidence that it does not exist — deal registration normally sits behind a partner login.',
  unknown: 'We could not read the relevant surfaces.',
};

function SurfaceGrid({ surfaces }: { surfaces: SurfaceFinding[] }) {
  if (!surfaces.length) return null;
  return (
    <ul className="surf-grid">
      {surfaces.map((s) => (
        <li key={s.surface} className={`surf surf-${s.state}`} title={SURFACE_HELP[s.state]}>
          <span className="surf-mark" aria-hidden="true">{SURFACE_MARK[s.state]}</span>
          <span>{humanise(s.surface)}</span>
          <span className="sr-only">— {s.state.replace(/_/g, ' ')}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── review ──────────────────────────────────────────────────────────────── */

const OUTCOMES: HumanOutcome[] = ['promote', 'research', 'watch', 'reject', 'suppress'];
const KEYS: Record<string, HumanOutcome> = { p: 'promote', r: 'research', w: 'watch', x: 'reject', s: 'suppress' };
const KEY_FOR = (o: HumanOutcome) => Object.entries(KEYS).find(([, v]) => v === o)?.[0].toUpperCase() ?? '';

function ReviewBar({ domain, existing, onSaved, onNext, remaining }: {
  domain: string; existing: ReviewRecord | null; onSaved: () => void; onNext: () => void; remaining: number;
}) {
  const [openedAt] = useState(() => Date.now());
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>(existing?.confidence ?? 'medium');
  const [rationale, setRationale] = useState(existing?.rationale ?? '');
  const [saved, setSaved] = useState<HumanOutcome | null>(existing?.outcome ?? null);
  // Keyboard shortcuts commit AND navigate, so they stay off until the reviewer has engaged
  // with this panel. A stray keypress while reading should never file a verdict.
  const [keysArmed, setKeysArmed] = useState(false);

  const commit = useCallback((o: HumanOutcome, advance: boolean) => {
    saveReview({
      domain, outcome: o, confidence, rationale: rationale.trim() || null,
      reviewedAt: new Date().toISOString(), reviewer: 'local',
      decisionSeconds: Math.round((Date.now() - openedAt) / 1000),
    });
    setSaved(o);
    onSaved();
    if (advance) onNext();
  }, [domain, confidence, rationale, openedAt, onSaved, onNext]);

  // Confidence and rationale are set first; the decision keys save and move on. An earlier
  // build put the note box below the buttons, so pressing P and then typing discarded it.
  useEffect(() => {
    if (!keysArmed) return;
    const h = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) return;
      const o = KEYS[e.key.toLowerCase()];
      if (o) { e.preventDefault(); commit(o, true); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [commit, keysArmed]);

  return (
    <div className="review" onMouseEnter={() => setKeysArmed(true)} onFocus={() => setKeysArmed(true)}>
      <div className="review-row">
        <span className="lab">Confidence</span>
        <div className="btn-row" role="group" aria-label="Decision confidence">
          {(['low', 'medium', 'high'] as const).map((c) => (
            <button key={c} className={`btn btn-ghost ${confidence === c ? 'on' : ''}`}
              aria-pressed={confidence === c} onClick={() => setConfidence(c)}>{humanise(c)}</button>
          ))}
        </div>
        {existing && <button className="link-btn push" onClick={() => { clearReview(domain); setSaved(null); onSaved(); }}>Clear decision</button>}
      </div>

      <label className="review-note">
        <span className="sr-only">Rationale</span>
        <textarea
          placeholder="Rationale (optional) — what decided it? Write this first; the decision buttons save and move on."
          value={rationale} onChange={(e) => setRationale(e.target.value)}
          onFocus={() => logEvent('review_started', { domain })}
        />
      </label>

      <div className="review-row">
        <span className="lab">Decision</span>
        <div className="btn-row" role="group" aria-label="Review decision">
          {OUTCOMES.map((o) => (
            <button key={o} className={`btn btn-${o} ${saved === o ? 'on' : ''}`}
              title={`${OUTCOME_HELP[o]} (${KEY_FOR(o)})`} onClick={() => commit(o, true)}>
              {OUTCOME_LABEL[o]}<kbd>{KEY_FOR(o)}</kbd>
            </button>
          ))}
        </div>
        <span className="push dim small">{remaining} undecided left</span>
      </div>
      <p className="dim small review-help">
        <strong>Promote</strong> means the evidence is enough to consider outreach — not that this is the top account, and not “call now”.
        {' '}Keyboard shortcuts {keysArmed ? 'are active' : 'activate when you reach this panel'}; a decision can be changed or cleared at any time.
      </p>
    </div>
  );
}

/* ── screen ──────────────────────────────────────────────────────────────── */

export function DossierView({ domain, onBack, onNext, remaining, onReviewed }: {
  domain: string; onBack: () => void; onNext: () => void; remaining: number; onReviewed: () => void;
}) {
  const [d, setD] = useState<D | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const review = useMemo(() => getReview(domain), [domain, tick]);

  useEffect(() => {
    let live = true;
    setD(null); setError(null);
    loadDossier(domain)
      .then((x) => { if (live) { setD(x); logEvent('account_opened', { domain }); } })
      .catch((e) => { if (live) setError(String(e.message ?? e)); });
    return () => { live = false; };
  }, [domain]);

  if (error) return <><BackLink onBack={onBack} /><ErrorState error={error} retry={() => setD(null)} /></>;
  if (!d) return <><BackLink onBack={onBack} /><Loading what="dossier" /></>;

  const mi = d.machineInterpretation;
  const g = mi.diagnostics;
  const confirmedSurfaces = (d.surfaces ?? []).filter((s) => s.state === 'confirmed');
  const underObserved = mi.state === 'under_observed';

  return (
    <article className="dossier">
      <BackLink onBack={onBack} />

      <header className="dh">
        <div>
          <h1 className="display dh-name">{d.companyName ?? d.domain}</h1>
          <div className="dh-meta">
            <a href={`https://${d.domain}`} target="_blank" rel="noreferrer" className="mono">{d.domain} ↗</a>
            <span className="ev-sep" aria-hidden="true">·</span>
            <span>Evidence retrieved {fmtDate(d.oldestEvidenceAt ?? d.builtAt)}</span>
          </div>
        </div>
        <div className="dh-chips">
          <StateChip label={WORKFLOW_LABEL[workflowState(mi.state, review)]} tone={review ? 'accent' : 'neutral'} />
          <StateChip label={CATEGORY_LABEL[d.category.state] ?? humanise(d.category.state)} tone={categoryTone(d.category.state)} />
          <StateChip label={COVERAGE_LABEL[d.evidenceCoverage] ?? humanise(d.evidenceCoverage)} tone="neutral"
            title="How much public evidence was found. This reflects what the company publishes, not commercial fit." />
        </div>
      </header>

      {d.category.knownCompetitorList.onList && (
        <div className="alert alert-blocker" role="note">
          <strong>On the maintained competitor list.</strong> This is asserted commercial reference data,
          not a model inference — reviewed {fmtDate(d.category.knownCompetitorList.lastReviewed)}.
        </div>
      )}

      <section className="summary">
        <span className="lab">Commercial summary</span>
        <p className="summary-body">{d.commercialSummary}</p>
        <p className="summary-note">
          Assembled from clauses the collected evidence supports. Claims about the partner motion appear as
          quotes below; statements about what was retrieved or not established are drawn from the retrieval log.
        </p>
      </section>

      <section className={`machine machine-${mi.state}`}>
        <div className="machine-top">
          <span className="lab">Machine interpretation</span>
          <StateChip label={MACHINE_LABEL[mi.state] ?? humanise(mi.state)} tone={machineTone(mi.state)} />
        </div>
        <ul className="machine-reasons">{mi.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
        <p className="machine-disclaimer">{mi.disclaimer}</p>
        <div className="machine-diag">
          {g.observationCount} observations → <strong>{g.distinctClaimCount} distinct</strong> from {g.independentSourceCount}{' '}
          independent {g.independentSourceCount === 1 ? 'source' : 'sources'}
          {g.unattributableDropped > 0 && <> · {g.unattributableDropped} dropped as unattributable</>}
          {g.volumeSensitive && <span className="warn"> · volume-sensitive: much of this is repetition</span>}
          <Info>Kept visible so evidence volume cannot quietly drive the interpretation. An earlier model promoted companies mainly because they published more partner content.</Info>
        </div>
      </section>

      {review && (
        <div className="alert alert-accent" role="status">
          <strong>Your decision: {OUTCOME_LABEL[review.outcome]}</strong> ({review.confidence} confidence, {fmtDate(review.reviewedAt)})
          {review.rationale ? <> — “{review.rationale}”</> : null}
          <span className="dim"> · recorded separately from the machine interpretation above</span>
        </div>
      )}

      {underObserved && (
        <div className="alert alert-neutral" role="note">
          <strong>Under-observed.</strong> Public evidence is insufficient for confident qualification.
          This does <em>not</em> mean low fit — it means this company publishes little, or we could not read it.
          {d.researchTasks[0] && <> Suggested next check: {d.researchTasks[0].question}</>}
        </div>
      )}

      <h2 className="sect display">Constructs</h2>
      <div className="grid-3">{d.constructs.map((c) => <ConstructCard key={c.construct} c={c} domain={d.domain} />)}</div>

      {(d.surfaces ?? []).length > 0 && (
        <>
          <h2 className="sect display">Partner workflows</h2>
          <p className="sect-sub">
            Workflows visible on the pages we retrieved. <strong>Not observed</strong> means we read surfaces
            where this usually appears and did not see it — it is not evidence that it does not exist, and
            deal registration normally sits behind a partner login.
          </p>
          <Panel>
            <SurfaceGrid surfaces={d.surfaces} />
            <EvidenceList items={confirmedSurfaces.flatMap((s) => s.evidence)} domain={d.domain} limit={3} />
          </Panel>
        </>
      )}

      <h2 className="sect display">Partner programmes</h2>
      {d.programmes.length === 0 ? (
        <EmptyState
          title="No programme type identified"
          body="The pages retrieved do not name a reseller, referral, agency or other partner motion."
          note="This is not evidence that none exists — it may not be published, or may sit behind a login."
        />
      ) : (
        <div className="grid-2">
          {d.programmes.map((p) => (
            <Panel key={p.kind} title={humanise(p.kind)}
              aside={p.publishedName ? <span className="prog-name">“{p.publishedName}”</span> : undefined}>
              <EvidenceList items={p.evidence} domain={d.domain} limit={2} />
            </Panel>
          ))}
        </div>
      )}

      {d.partnerDirectory.isDirectory && (
        <>
          <h2 className="sect display">Partner directory</h2>
          <Panel
            title={`At least ${d.partnerDirectory.lowerBound} partner organisations listed`}
            aside={d.partnerDirectory.certificationLanguage ? <StateChip label="Described as certified" tone="verified" /> : undefined}
          >
            <p className="dim small">
              A lower bound, not a count — directories are usually filtered views. It proves the relationships are published, not that they transact.
            </p>
            {d.partnerDirectory.sampleNames.length > 0 && (
              <ul className="dir-names">
                {d.partnerDirectory.sampleNames.map((n) => <li key={n} className="mono">{n}</li>)}
                {d.partnerDirectory.lowerBound > d.partnerDirectory.sampleNames.length && (
                  <li className="dir-more">+{d.partnerDirectory.lowerBound - d.partnerDirectory.sampleNames.length} more</li>
                )}
              </ul>
            )}
            {d.partnerDirectory.observation && <EvidenceList items={[d.partnerDirectory.observation]} domain={d.domain} />}
          </Panel>
        </>
      )}

      <h2 className="sect display">Category and systems</h2>
      <div className="grid-2">
        <Panel title="Category" aside={<StateChip label={CATEGORY_LABEL[d.category.state] ?? humanise(d.category.state)} tone={categoryTone(d.category.state)} />}>
          <dl className="why">
            <dt>Why it may matter</dt><dd>{d.category.whyItMatters}</dd>
            <dt className="neg">Why it may not</dt><dd>{d.category.whyItMayNotMatter}</dd>
            <dt>Unknown</dt><dd>{d.category.unknown}</dd>
          </dl>
          {d.category.signals.slice(0, 2).map((s, i) => (
            <div key={i} className="cat-sig">
              <blockquote className="ev-quote">{s.quote}</blockquote>
              <div className="ev-meta">
                <a className="ev-src" href={s.url} target="_blank" rel="noreferrer">{shortUrl(s.url)} ↗</a>
                <span className="ev-sep" aria-hidden="true">·</span><span>{humanise(s.sourceType)}</span>
              </div>
            </div>
          ))}
          <div className="prov">
            <span className="lab">Provenance</span>
            {d.category.knownCompetitorList.onList
              ? <>Known-competitor list — <strong>asserted commercial data</strong>, maintained by hand and reported separately from the inference above.</>
              : <>Inferred from the company’s own positioning. Not on the maintained competitor list. The rule caught <strong>8 of 14</strong> partner-tech vendors across two frozen holdouts, so the absence of a flag means little.</>}
          </div>
        </Panel>

        <Panel title="Systems and people">
          <dl className="kv">
            <dt>CRM</dt>
            <dd><StateChip label={CRM_LABEL[d.systems.crm.state] ?? humanise(d.systems.crm.state)} tone={d.systems.crm.state === 'unknown' ? 'neutral' : 'verified'} /></dd>
            <dd className="kv-note">{d.systems.crm.note}</dd>

            <dt>Partner platform</dt>
            <dd>
              <StateChip label={PRM_LABEL[d.systems.prm.state] ?? humanise(d.systems.prm.state)}
                tone={d.systems.prm.state === 'competitor_prm_confirmed' ? 'blocker' : d.systems.prm.state === 'unknown' ? 'neutral' : 'verified'} />
              {d.systems.prm.vendor && <span className="mono kv-vendor">{d.systems.prm.vendor}</span>}
            </dd>
            <dd className="kv-note">{d.systems.prm.note}</dd>

            <dt>People</dt>
            <dd><StateChip label={PEOPLE_LABEL[d.people.state] ?? humanise(d.people.state)} tone={d.people.state === 'unknown' ? 'neutral' : 'verified'} /></dd>
            <dd className="kv-note">{d.people.note}</dd>
          </dl>
          {d.systems.prm.evidence.length > 0 && <EvidenceList items={d.systems.prm.evidence} domain={d.domain} limit={1} />}
          {d.systems.crm.evidence.length > 0 && <EvidenceList items={d.systems.crm.evidence} domain={d.domain} limit={1} />}
        </Panel>
      </div>

      {d.contradictions.length > 0 && (
        <>
          <h2 className="sect display">Contradictions</h2>
          <div className="grid-2">
            {d.contradictions.map((c, i) => (
              <div key={i} className="contra">
                <h3>{c.topic}</h3>
                <p><span className="lab">A</span>{c.positionA.claim}</p>
                <p><span className="lab">B</span>{c.positionB.claim}</p>
                <p className="contra-effect">{c.effect}</p>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="sect display">What to verify next</h2>
      {d.researchTasks.length === 0
        ? <EmptyState title="No blocking question identified" body="The evidence collected does not leave a specific gap that would change the decision." />
        : (
          <ol className="tasks">
            {d.researchTasks.map((t, i) => (
              <li key={i}>
                <h3>{t.question}</h3>
                <p><span className="lab">Why it blocks</span>{t.whyItBlocks}</p>
                <p><span className="lab">Where to look</span>{t.whereToLook}</p>
              </li>
            ))}
          </ol>
        )}

      <h2 className="sect display">Retrieval</h2>
      <Panel>
        <p className="dim small">
          What was fetched to build this dossier. A failure here is never evidence about the company —
          it is the difference between “we looked and found nothing” and “we could not look”.
        </p>
        <HealthSummary health={d.sourceHealth} />
      </Panel>

      <h2 className="sect display" id="decision">Your decision</h2>
      <ReviewBar domain={d.domain} existing={review} remaining={remaining}
        onSaved={() => { setTick((t) => t + 1); onReviewed(); }} onNext={onNext} />
    </article>
  );
}

function HealthSummary({ health }: { health: D['sourceHealth'] }) {
  const tally: Record<string, number> = {};
  for (const h of health) tally[h.health] = (tally[h.health] ?? 0) + 1;
  const partnerPaths = health.filter((h) => /partner|reseller|agenc|partenaires|channel/i.test(h.url));
  const hits = partnerPaths.filter((h) => h.health === 'success').length;
  const tone = (k: string): Tone => (k === 'success' ? 'verified' : k === 'blocked' || k === 'timeout' || k === 'parse_error' ? 'blocker' : 'neutral');
  return (
    <>
      <div className="health-row">
        {Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <Chip key={k} tone={tone(k)}>{v} {humanise(k).toLowerCase()}</Chip>
        ))}
      </div>
      {partnerPaths.length > 0 && (
        <p className="srcq">
          {partnerPaths.length} conventional partner {partnerPaths.length === 1 ? 'path' : 'paths'} checked ·{' '}
          {hits} returned a partner page
        </p>
      )}
    </>
  );
}

function BackLink({ onBack }: { onBack: () => void }) {
  return <button className="link-btn back" onClick={onBack}>← All accounts</button>;
}
