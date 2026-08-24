import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  DOSSIERS, OUTCOME_HELP, OUTCOME_LABEL, WORKFLOW_LABEL, allReviews, clearReview,
  getReview, saveReview, workflowState, type ReviewRecord, type WorkflowState,
} from './data.js';
import type {
  ConstructPanel, Contradiction, Dossier, HumanOutcome, Observation, ResearchTask, SurfaceFinding,
} from '../src/dossier/types.js';
import './styles.css';

/* ══════════════════════════════════════════════════════ evidence primitives ══
 * The most important rule in the interface: `unknown` is rendered with the same
 * visual weight as a confirmed value. It is a result, not a gap, and styling it as
 * an error would push reviewers toward treating absence as a negative.
 */

/**
 * `likely_target_category` means only that no disqualifying signal was found — it is not
 * positive evidence, and the measured record is explicit that 6 of 14 known partner-tech
 * vendors sit inside it. Rendering it green put 28 of 35 rows in a colour a seller reads as
 * "qualified". It is neutral here, and only genuine findings earn the good tone.
 */
function categoryTone(state: string): 'known' | 'unknown' | 'caution' {
  if (state === 'unknown') return 'unknown';
  if (state === 'likely_target_category') return 'known';
  return 'caution';
}

function StateChip({ value, tone }: { value: string; tone?: 'known' | 'unknown' | 'caution' | 'good' }) {
  const t = tone ?? (/^unknown$|_unknown$|^none$/.test(value) ? 'unknown' : 'known');
  return <span className={`chip chip-${t}`}>{humanise(value)}</span>;
}

function humanise(s: string): string {
  return s.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

/** A quote with its source and, always, what it does not prove. */
function EvidenceItem({ o }: { o: Observation }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="ev">
      <blockquote className="ev-q">{o.quote}</blockquote>
      <div className="ev-meta">
        <a className="ev-src" href={o.sourceUrl} target="_blank" rel="noreferrer">{shortUrl(o.sourceUrl)}</a>
        <span className="ev-dot">·</span>
        <span className="ev-strength">{humanise(o.strength)}</span>
        {o.duplicateCount && o.duplicateCount > 1 ? (
          <>
            <span className="ev-dot">·</span>
            <span className="ev-dup" title="The same claim appeared this many times. Repetition is not extra evidence.">
              seen {o.duplicateCount}×
            </span>
          </>
        ) : null}
        <button className="ev-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? 'Hide' : 'What this proves'}
        </button>
      </div>
      {open && (
        <div className="ev-claims">
          <div><span className="ev-lab">Proves</span>{o.proves}</div>
          <div><span className="ev-lab ev-lab-neg">Does not prove</span>{o.doesNotProve}</div>
          <div><span className="ev-lab">Retrieved</span>{fmtDate(o.retrievedAt)}</div>
        </div>
      )}
    </li>
  );
}

function shortUrl(u: string): string {
  try { const x = new URL(u); return x.hostname.replace(/^www\./, '') + (x.pathname === '/' ? '' : x.pathname); }
  catch { return u; }
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

/* ═══════════════════════════════════════════════════════════════════ panels ══ */

function ConstructCard({ c }: { c: ConstructPanel }) {
  const known = c.state !== 'unknown';
  // The why-blocks are identical for every company. Reviewers read them once and skipped
  // them thereafter, so they collapse by default: available, not in the way.
  const [why, setWhy] = useState(false);
  return (
    <section className="panel">
      <header className="panel-h">
        <h3>{humanise(c.construct)}</h3>
        <StateChip value={c.state} tone={known ? 'known' : 'unknown'} />
      </header>
      <button className="why-toggle" onClick={() => setWhy((v) => !v)} aria-expanded={why}>
        {why ? 'Hide' : 'How to read this state'}
      </button>
      {why && (
        <div className="why">
          <div><span className="why-lab">Why it may matter</span>{c.whyItMatters}</div>
          <div><span className="why-lab why-lab-neg">Why it may not</span>{c.whyItMayNotMatter}</div>
        </div>
      )}
      {c.evidence.length > 0 && (
        <ul className="ev-list">{c.evidence.map((o) => <EvidenceItem key={o.id} o={o} />)}</ul>
      )}
      {c.counterEvidence.length > 0 && (
        <>
          <div className="sub-lab">Counter-evidence</div>
          <ul className="ev-list">{c.counterEvidence.map((o) => <EvidenceItem key={o.id} o={o} />)}</ul>
        </>
      )}
      <div className="unknowns">
        <span className="why-lab">Unknown</span>
        {c.unknown.join(' · ')}
      </div>
      <div className="srcq" title="Distinct claims after deduplication, and how many independent hosts they came from. Repetition is not evidence.">
        {c.sourceQuality.distinctClaims} distinct {c.sourceQuality.distinctClaims === 1 ? 'claim' : 'claims'}
        {' · '}{c.sourceQuality.independentSources} independent {c.sourceQuality.independentSources === 1 ? 'source' : 'sources'}
      </div>
    </section>
  );
}

function SurfaceGrid({ surfaces }: { surfaces: SurfaceFinding[] }) {
  if (!surfaces.length) return null;
  const mark = (s: SurfaceFinding['state']) => (s === 'confirmed' ? '✓' : s === 'not_observed' ? '–' : '?');
  const help: Record<SurfaceFinding['state'], string> = {
    confirmed: 'Seen on a retrieved page.',
    not_observed: 'We read surfaces where this would normally appear and did not see it. This is NOT evidence that it does not exist.',
    unknown: 'We could not read the relevant surfaces.',
  };
  return (
    <div className="surf-grid">
      {surfaces.map((s) => (
        <div key={s.surface} className={`surf surf-${s.state}`} title={help[s.state]}>
          <span className="surf-mark">{mark(s.state)}</span>
          <span className="surf-name">{humanise(s.surface)}</span>
        </div>
      ))}
    </div>
  );
}

function ContradictionCard({ c }: { c: Contradiction }) {
  return (
    <div className="contra">
      <div className="contra-top">{c.topic}</div>
      <div className="contra-side"><span className="contra-lab">A</span>{c.positionA.claim}</div>
      <div className="contra-side"><span className="contra-lab">B</span>{c.positionB.claim}</div>
      <div className="contra-eff">{c.effect}</div>
    </div>
  );
}

function ResearchList({ tasks }: { tasks: ResearchTask[] }) {
  if (!tasks.length) return <p className="dim">No blocking question identified.</p>;
  return (
    <ol className="tasks">
      {tasks.map((t, i) => (
        <li key={i}>
          <div className="task-q">{t.question}</div>
          <div className="task-w"><span className="why-lab">Why it blocks</span>{t.whyItBlocks}</div>
          <div className="task-w"><span className="why-lab">Where to look</span>{t.whereToLook}</div>
        </li>
      ))}
    </ol>
  );
}

/* ══════════════════════════════════════════════════════════════ review bar ══ */

const OUTCOMES: HumanOutcome[] = ['promote', 'research', 'watch', 'reject', 'suppress'];
const KEYS: Record<string, HumanOutcome> = { p: 'promote', r: 'research', w: 'watch', x: 'reject', s: 'suppress' };

/**
 * Review controls.
 *
 * Three things were wrong and all three cost real decisions:
 *   - the rationale box sat BELOW the buttons, so pressing P and then typing why silently
 *     discarded the note;
 *   - confidence defaulted to medium and the keyboard path never touched it, so every
 *     keyboard review was recorded medium regardless;
 *   - nothing advanced, so reviewing 200 accounts meant 200 × (Back → scan → click).
 *
 * Confidence and rationale are therefore set FIRST, the decision keys commit last, and
 * committing moves to the next undecided account.
 */
function ReviewBar({ d, onDone, onNext, openedAt, remaining }: {
  d: Dossier; onDone: () => void; onNext: () => void; openedAt: number; remaining: number;
}) {
  const existing = getReview(d.domain);
  const [outcome, setOutcome] = useState<HumanOutcome | null>(existing?.outcome ?? null);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>(existing?.confidence ?? 'medium');
  const [rationale, setRationale] = useState(existing?.rationale ?? '');

  const commit = useCallback((o: HumanOutcome, advance: boolean) => {
    saveReview({
      domain: d.domain, outcome: o, confidence, rationale: rationale.trim() || null,
      reviewedAt: new Date().toISOString(), reviewer: 'local',
      decisionSeconds: Math.round((Date.now() - openedAt) / 1000),
    });
    onDone();
    if (advance) onNext();
  }, [d.domain, confidence, rationale, onDone, onNext, openedAt]);

  // Keyboard-efficient review: the whole point is decisions per minute.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) return;
      const o = KEYS[e.key.toLowerCase()];
      if (o) { e.preventDefault(); setOutcome(o); commit(o, true); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [commit]);

  return (
    <div className="reviewbar">
      <div className="rb-row">
        <span className="rb-lab">Confidence</span>
        <div className="rb-btns">
          {(['low', 'medium', 'high'] as const).map((c) => (
            <button key={c} className={`rb-conf ${confidence === c ? 'is-on' : ''}`} onClick={() => setConfidence(c)}>{humanise(c)}</button>
          ))}
        </div>
        {existing && <button className="rb-clear" onClick={() => { clearReview(d.domain); onDone(); }}>Clear decision</button>}
      </div>
      <textarea
        className="rb-note" placeholder="Rationale (optional) — what decided it? Type this before deciding; the decision keys save and move on."
        value={rationale} onChange={(e) => setRationale(e.target.value)}
      />
      <div className="rb-row">
        <span className="rb-lab">Decision</span>
        <div className="rb-btns">
          {OUTCOMES.map((o) => (
            <button
              key={o}
              className={`rb-btn rb-${o} ${outcome === o ? 'is-on' : ''}`}
              title={`${OUTCOME_HELP[o]}  (${Object.entries(KEYS).find(([, v]) => v === o)?.[0].toUpperCase()})`}
              onClick={() => { setOutcome(o); commit(o, true); }}
            >
              {OUTCOME_LABEL[o]}
              <kbd>{Object.entries(KEYS).find(([, v]) => v === o)?.[0].toUpperCase()}</kbd>
            </button>
          ))}
        </div>
        <span className="rb-remaining">{remaining} undecided {remaining === 1 ? 'account' : 'accounts'} left</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ dossier ══ */

function DossierView({ d, onBack, onReviewed, onNext, remaining }: {
  d: Dossier; onBack: () => void; onReviewed: () => void; onNext: () => void; remaining: number;
}) {
  const [openedAt] = useState(() => Date.now());
  const review = getReview(d.domain);
  const mi = d.machineInterpretation;
  const diag = mi.diagnostics;

  return (
    <article className="dossier">
      <button className="back" onClick={onBack}>← All accounts</button>

      <header className="dh">
        <div className="dh-main">
          <h1>{d.companyName ?? d.domain}</h1>
          <a className="dh-dom" href={`https://${d.domain}`} target="_blank" rel="noreferrer">{d.domain}</a>
        </div>
        <div className="dh-meta">
          <StateChip value={WORKFLOW_LABEL[workflowState(d, review)]} tone={review ? 'good' : 'known'} />
          <span className="dh-checked" title="Taken from the oldest retrieval behind this dossier, not from when it was assembled.">Evidence retrieved {fmtDate(d.oldestEvidenceAt ?? d.builtAt)}</span>
          {d.provenance !== 'real_observation' && <span className="chip chip-caution">{humanise(d.provenance)}</span>}
        </div>
      </header>

      <section className="summary">
        <div className="sum-lab">Commercial summary</div>
        <p>{d.commercialSummary}</p>
        <div className="sum-note">Assembled only from clauses backed by collected evidence. Every factual statement above appears as a quote below.</div>
      </section>

      <section className={`machine machine-${mi.state}`}>
        <div className="mc-top">
          <span className="mc-lab">Machine interpretation</span>
          <StateChip value={mi.state} tone={mi.state === 'suppression_candidate' ? 'caution' : mi.state === 'under_observed' ? 'unknown' : 'known'} />
        </div>
        <ul className="mc-reasons">{mi.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
        <div className="mc-disc">{mi.disclaimer}</div>
        <div className="mc-diag" title="Kept visible so evidence volume cannot quietly drive the interpretation.">
          {diag.observationCount} observations → <strong>{diag.distinctClaimCount} distinct</strong> from {diag.independentSourceCount} independent {diag.independentSourceCount === 1 ? 'source' : 'sources'}
          {' · '}coverage {diag.publicationDensity}
          {diag.unattributableDropped > 0 && <span className="mc-drop" title="Observations discarded because the quote could not be attributed to the partner motion — product marketing that merely contained a matching word.">{' · '}{diag.unattributableDropped} unattributable dropped</span>}
          {diag.volumeSensitive && <span className="mc-warn">volume-sensitive: much of this evidence is repetition</span>}
        </div>
      </section>

      {review && (
        <div className="prior-review">
          Human decision: <strong>{OUTCOME_LABEL[review.outcome]}</strong> ({review.confidence} confidence, {fmtDate(review.reviewedAt)})
          {review.rationale ? <> — “{review.rationale}”</> : null}
          <span className="dim"> · recorded separately from the machine interpretation above</span>
        </div>
      )}

      <div className="grid2">
        <section className="panel">
          <header className="panel-h"><h3>Category</h3><StateChip value={d.category.state} tone={categoryTone(d.category.state)} /></header>
          <div className="why">
            <div><span className="why-lab">Why it may matter</span>{d.category.whyItMatters}</div>
            <div><span className="why-lab why-lab-neg">Why it may not</span>{d.category.whyItMayNotMatter}</div>
            <div><span className="why-lab">Unknown</span>{d.category.unknown}</div>
          </div>
          {d.category.signals.length > 0 && (
            <ul className="ev-list">
              {d.category.signals.slice(0, 2).map((s, i) => (
                <li key={i} className="ev">
                  <blockquote className="ev-q">{s.quote}</blockquote>
                  <div className="ev-meta">
                    <a className="ev-src" href={s.url} target="_blank" rel="noreferrer">{shortUrl(s.url)}</a>
                    <span className="ev-dot">·</span><span className="ev-strength">{humanise(s.sourceType)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="listdata">
            <span className="why-lab">Known-competitor list</span>
            {d.category.knownCompetitorList.onList ? 'Listed' : 'Not listed'}
            <span className="dim"> · asserted business data, maintained {fmtDate(d.category.knownCompetitorList.lastReviewed)}. Reported beside the inference above, never merged into it.</span>
          </div>
        </section>

        <section className="panel">
          <header className="panel-h"><h3>Systems</h3></header>
          <div className="kv">
            <div className="kv-k">CRM</div>
            <div className="kv-v"><StateChip value={d.systems.crm.state} /></div>
            <div className="kv-n">{d.systems.crm.note}</div>
          </div>
          <div className="kv">
            <div className="kv-k">Partner platform</div>
            <div className="kv-v"><StateChip value={d.systems.prm.state} />{d.systems.prm.vendor ? <span className="kv-vendor">{d.systems.prm.vendor}</span> : null}</div>
            <div className="kv-n">{d.systems.prm.note}</div>
          </div>
          {d.systems.prm.evidence.length > 0 && <ul className="ev-list">{d.systems.prm.evidence.map((o) => <EvidenceItem key={o.id} o={o} />)}</ul>}
          <div className="kv">
            <div className="kv-k">People</div>
            <div className="kv-v"><StateChip value={d.people.state} /></div>
            <div className="kv-n">{d.people.note}</div>
          </div>
        </section>
      </div>

      <h2 className="sect">Constructs</h2>
      <div className="grid3">{d.constructs.map((c) => <ConstructCard key={c.construct} c={c} />)}</div>

      {d.partnerDirectory.isDirectory && (
        <>
          <h2 className="sect">Partner directory</h2>
          <section className="panel">
            <header className="panel-h">
              <h3>At least {d.partnerDirectory.lowerBound} partner organisations listed</h3>
              {d.partnerDirectory.certificationLanguage && <StateChip value="described as certified" tone="good" />}
            </header>
            <div className="kv-n">
              A lower bound, not a count — directories are usually filtered views, and this proves the
              relationships are published, not that they transact.
            </div>
            {d.partnerDirectory.sampleNames.length > 0 && (
              <div className="dirnames">
                {d.partnerDirectory.sampleNames.map((n) => <span key={n} className="dirname">{n}</span>)}
                {d.partnerDirectory.lowerBound > d.partnerDirectory.sampleNames.length && (
                  <span className="dirname dirname-more">+{d.partnerDirectory.lowerBound - d.partnerDirectory.sampleNames.length} more</span>
                )}
              </div>
            )}
            {d.partnerDirectory.observation && <ul className="ev-list"><EvidenceItem o={d.partnerDirectory.observation} /></ul>}
          </section>
        </>
      )}

      <h2 className="sect">Programmes</h2>
      {d.programmes.length === 0 ? (
        <>
          <p className="dim">No programme type was identified from the pages retrieved. This is not evidence that none exists.</p>
          {/* Surfaces render even with no programme: the workflow evidence exists and was
              previously asserted in the summary while being dropped from the file. */}
          {d.surfaces?.some((s) => s.state === 'confirmed') && (
            <section className="panel">
              <header className="panel-h"><h3>Observed partner workflows</h3></header>
              <SurfaceGrid surfaces={d.surfaces} />
              <ul className="ev-list">
                {d.surfaces.filter((s) => s.state === 'confirmed').flatMap((s) => s.evidence).slice(0, 3).map((o) => <EvidenceItem key={o.id} o={o} />)}
              </ul>
            </section>
          )}
        </>
      ) : (
        <div className="progs">
          {d.programmes.map((p) => (
            <section className="panel" key={p.kind}>
              <header className="panel-h">
                <h3>{humanise(p.kind)}{p.publishedName ? <span className="prog-name">“{p.publishedName}”</span> : null}</h3>
              </header>
              {p.surfaces.length > 0 && <SurfaceGrid surfaces={p.surfaces} />}
              <ul className="ev-list">{p.evidence.slice(0, 3).map((o) => <EvidenceItem key={o.id} o={o} />)}</ul>
            </section>
          ))}
        </div>
      )}

      {d.contradictions.length > 0 && (
        <>
          <h2 className="sect">Contradictions</h2>
          <div className="contras">{d.contradictions.map((c, i) => <ContradictionCard key={i} c={c} />)}</div>
        </>
      )}

      <h2 className="sect">What to verify next</h2>
      <ResearchList tasks={d.researchTasks} />

      {d.temporal.state !== 'first_observation' && (
        <>
          <h2 className="sect">Timeline</h2>
          <div className="panel">
            <header className="panel-h"><h3>Temporal</h3><StateChip value={d.temporal.state} tone={d.temporal.state === 'verified_change' ? 'good' : 'unknown'} /></header>
            <div className="kv-n">{d.temporal.note}</div>
            {d.temporal.baselineAt && <div className="srcq">Baseline {fmtDate(d.temporal.baselineAt)} · last checked {fmtDate(d.temporal.lastCheckedAt ?? d.temporal.baselineAt)}</div>}
          </div>
        </>
      )}

      <h2 className="sect">Retrieval</h2>
      <div className="panel">
        <div className="kv-n">
          What was fetched to build this dossier. A failure here is never evidence about the company —
          it is the difference between “we looked and found nothing” and “we could not look”.
        </div>
        <div className="health-grid">
          {(() => {
            const t: Record<string, number> = {};
            for (const h of d.sourceHealth) t[h.health] = (t[h.health] ?? 0) + 1;
            return Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <span key={k} className={`health-pill health-${k}`}>{v} {humanise(k).toLowerCase()}</span>
            ));
          })()}
        </div>
        {(() => {
          const partnerPaths = d.sourceHealth.filter((h) => /partner|reseller|agenc|partenaires|channel/i.test(h.url));
          const hit = partnerPaths.filter((h) => h.health === 'success').length;
          if (!partnerPaths.length) return null;
          return (
            <div className="srcq">
              {partnerPaths.length} conventional partner {partnerPaths.length === 1 ? 'path' : 'paths'} checked · {hit} returned a partner page
            </div>
          );
        })()}
      </div>

      <h2 className="sect">Your decision</h2>
      <ReviewBar d={d} onDone={onReviewed} onNext={onNext} openedAt={openedAt} remaining={remaining} />
    </article>
  );
}

/* ══════════════════════════════════════════════════════════════════ views ══ */

type Nav = 'overview' | 'accounts' | 'review' | 'watching' | 'changes' | 'health';

function Overview({ dossiers, reviews, go }: { dossiers: Dossier[]; reviews: Record<string, ReviewRecord>; go: (n: Nav, w?: WorkflowState) => void }) {
  const counts = useMemo(() => {
    const c: Record<WorkflowState, number> = { ready_for_review: 0, research_needed: 0, under_observed: 0, suppression_flagged: 0, reviewed: 0, watching: 0, suppressed: 0 };
    for (const d of dossiers) c[workflowState(d, reviews[d.domain] ?? null)]++;
    return c;
  }, [dossiers, reviews]);

  const sourceIssues = dossiers.filter((d) => d.sourceHealth.some((h) => h.health === 'blocked' || h.health === 'timeout' || h.health === 'parse_error')).length;
  const changes = dossiers.filter((d) => d.temporal.state === 'verified_change').length;

  return (
    <div>
      <h1 className="page-h">Overview</h1>
      <p className="page-sub">System state. These are counts of work, not predictions of revenue.</p>
      <div className="stats">
        {(Object.keys(counts) as WorkflowState[]).map((k) => (
          <button key={k} className="stat" onClick={() => go(k === 'watching' ? 'watching' : 'accounts', k)}>
            <span className="stat-n">{counts[k]}</span>
            <span className="stat-l">{WORKFLOW_LABEL[k]}</span>
          </button>
        ))}
        <button className="stat" onClick={() => go('changes')}>
          <span className="stat-n">{changes}</span><span className="stat-l">Verified changes</span>
        </button>
        <button className="stat" onClick={() => go('health')}>
          <span className="stat-n">{sourceIssues}</span><span className="stat-l">Accounts with source issues</span>
        </button>
      </div>
      <div className="notice">
        This product does not rank accounts. The evidence supports compressing research, not ordering prospects —
        an earlier scoring model promoted competitors above genuine targets, so ordered output was removed rather than repaired.
      </div>
    </div>
  );
}

function AccountsTable({ dossiers, reviews, onOpen, filter }: {
  dossiers: Dossier[]; reviews: Record<string, ReviewRecord>; onOpen: (d: Dossier) => void; filter?: (d: Dossier, r: ReviewRecord | null) => boolean;
}) {
  const [q, setQ] = useState('');
  const rows = dossiers
    .filter((d) => (filter ? filter(d, reviews[d.domain] ?? null) : true))
    .filter((d) => !q || (d.companyName ?? d.domain).toLowerCase().includes(q.toLowerCase()) || d.domain.includes(q.toLowerCase()));

  return (
    <>
      <input className="search" placeholder="Filter by name or domain…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>Company</th><th>Category</th><th>Partner motion</th><th>Ownership</th>
              <th>Surface</th><th>Directory</th><th>Evidence</th><th>CRM</th><th>Platform</th><th>State</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const r = reviews[d.domain] ?? null;
              const own = d.constructs.find((c) => c.construct === 'operational_ownership');
              const surf = d.constructs.find((c) => c.construct === 'operational_surface');
              const motions = [...new Set(d.programmes.map((p) => p.kind))].slice(0, 2).map(humanise).join(', ');
              return (
                <tr key={d.domain} onClick={() => onOpen(d)} tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') onOpen(d); }}>
                  <td className="c-name"><strong>{d.companyName ?? d.domain}</strong><span className="c-dom">{d.domain}</span></td>
                  <td><StateChip value={d.category.state} tone={categoryTone(d.category.state)} /></td>
                  <td>{motions || <span className="dim">Not identified</span>}</td>
                  <td><StateChip value={own?.state ?? 'unknown'} /></td>
                  <td><StateChip value={surf?.state ?? 'unknown'} /></td>
                  <td>{d.partnerDirectory.isDirectory
                    ? <span className="dircount" title="Lower bound on partner organisations publicly listed. Not a partner count.">≥{d.partnerDirectory.lowerBound}</span>
                    : <StateChip value="unknown" tone="unknown" />}</td>
                  <td><StateChip value={d.evidenceCoverage} tone={d.evidenceCoverage === 'none' || d.evidenceCoverage === 'sparse' ? 'unknown' : 'known'} /></td>
                  <td><StateChip value={d.systems.crm.state} /></td>
                  <td><StateChip value={d.systems.prm.state} /></td>
                  <td><StateChip value={WORKFLOW_LABEL[workflowState(d, r)]} tone={r ? 'good' : 'known'} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && <p className="dim empty">Nothing here.</p>}
      </div>
    </>
  );
}

function DataHealth({ dossiers }: { dossiers: Dossier[] }) {
  const tally: Record<string, number> = {};
  let total = 0;
  for (const d of dossiers) for (const h of d.sourceHealth) { tally[h.health] = (tally[h.health] ?? 0) + 1; total++; }
  const blocked = dossiers.filter((d) => d.sourceHealth.every((h) => h.health !== 'success'));
  const sparse = dossiers.filter((d) => d.evidenceCoverage === 'sparse' || d.evidenceCoverage === 'none');

  return (
    <div>
      <h1 className="page-h">Data health</h1>
      <p className="page-sub">This product is only as trustworthy as its retrieval. A technical failure is never commercial evidence.</p>
      <div className="stats">
        {Object.entries(tally).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
          <div key={k} className="stat stat-static">
            <span className="stat-n">{v}</span>
            <span className="stat-l">{humanise(k)}</span>
            <span className="stat-p">{Math.round((v / Math.max(1, total)) * 100)}% of fetches</span>
          </div>
        ))}
      </div>
      <h2 className="sect">Accounts with no readable identity surface</h2>
      {blocked.length === 0 ? <p className="dim">None.</p> : (
        <ul className="plainlist">
          {blocked.map((d) => <li key={d.domain}><strong>{d.companyName ?? d.domain}</strong> — {d.sourceHealth.map((h) => h.health).join(', ')}. Category is unknown for this account, which is a retrieval limit, not a finding about the company.</li>)}
        </ul>
      )}
      <h2 className="sect">Sparse accounts</h2>
      <p className="dim">Sparse means the company publishes little. It is not a fit signal, and these accounts are not deprioritised.</p>
      <ul className="plainlist">{sparse.map((d) => <li key={d.domain}>{d.companyName ?? d.domain}</li>)}</ul>
      <h2 className="sect">Known measurement limits</h2>
      <ul className="plainlist">
        <li><strong>CRM detection: 33% recall</strong> against companies that provably run a supported CRM. Salesforce was never detected. Absence is always unknown.</li>
        <li><strong>Public person evidence: 2 of 18 companies.</strong> Not viable for contact resolution; architecture leaves room for a licensed provider.</li>
        <li><strong>Category classifier: 57% recall on partner-tech vendors</strong>, with no genuine target ever wrongly excluded across two frozen holdouts. Advisory only — roughly two in five vendors still reach you unflagged.</li>
        <li><strong>Temporal: baseline only.</strong> Change detection has a measured 0% false-positive floor but needs elapsed calendar time before it can report anything.</li>
      </ul>
    </div>
  );
}

function Changes({ dossiers }: { dossiers: Dossier[] }) {
  const withChange = dossiers.filter((d) => d.temporal.changes.length > 0);
  return (
    <div>
      <h1 className="page-h">Changes</h1>
      <p className="page-sub">Only verified changes appear here. A first observation is never a change, and no timing claim is made without a second dated observation.</p>
      {withChange.length === 0 ? (
        <div className="notice">
          No verified changes yet. Every account is at its first observation, so there is nothing to compare against.
          This will stay empty until enough calendar time has passed — showing anything else here would be fabrication.
        </div>
      ) : (
        <ul className="plainlist">
          {withChange.map((d) => d.temporal.changes.map((c, i) => (
            <li key={d.domain + i}>
              <strong>{d.companyName ?? d.domain}</strong> — {c.what}: {c.previousState} → {c.newState}
              <div className="dim">Observed between {fmtDate(c.observedBetween[0])} and {fmtDate(c.observedBetween[1])} · {c.commercialInterpretation}</div>
            </li>
          )))}
        </ul>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════ shell ══ */

const NAV: { id: Nav; label: string; job: string }[] = [
  { id: 'overview', label: 'Overview', job: 'System state at a glance' },
  { id: 'accounts', label: 'Accounts', job: 'Every researched company' },
  { id: 'review', label: 'Review', job: 'Decide on what is ready' },
  { id: 'watching', label: 'Watching', job: 'Interesting, no reason to act yet' },
  { id: 'changes', label: 'Changes', job: 'Verified change only' },
  { id: 'health', label: 'Data health', job: 'Retrieval and coverage' },
];

function App() {
  const [nav, setNav] = useState<Nav>('overview');
  const [open, setOpen] = useState<Dossier | null>(null);
  const [tick, setTick] = useState(0);
  // Set when an Overview tile is clicked, so the tile is a real filter rather than a link to
  // the unfiltered table. Five of the six previously showed all accounts whatever you clicked.
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowState | null>(null);
  const reviews = useMemo(() => allReviews(), [tick]);
  const refresh = () => setTick((t) => t + 1);
  const goto = (n: Nav, w?: WorkflowState) => { setNav(n); setWorkflowFilter(w ?? null); setOpen(null); };

  if (DOSSIERS.length === 0) {
    return (
      <div className="shell">
        <main className="main">
          <h1 className="page-h">No dossiers</h1>
          <p className="page-sub">
            Run <code>npx tsx product/build-dossiers.ts product/validation-sample.v1.json</code> to collect real evidence.
            This build deliberately ships no sample companies — demo fiction must never reach a product surface.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="nav">
        <div className="brand">
          <span className="brand-n">Introw</span>
          <span className="brand-s">Partner intelligence for faster commercial research</span>
        </div>
        {NAV.map((n) => (
          <button key={n.id} className={`nav-i ${nav === n.id && !open ? 'is-on' : ''}`} onClick={() => goto(n.id)}>
            <span className="nav-l">{n.label}</span>
            <span className="nav-j">{n.job}</span>
          </button>
        ))}
        <div className="nav-foot">
          Evidence assistant. No ranking, no scores.<br />
          Every claim carries its source.
        </div>
      </aside>

      <main className="main">
        {open ? (
          <DossierView
            d={open} onBack={() => setOpen(null)} onReviewed={refresh}
            remaining={DOSSIERS.filter((x) => !reviews[x.domain]).length}
            onNext={() => {
              // Move to the next undecided account rather than dropping the reviewer back
              // to the table. Reviewing a queue should not cost a round trip per decision.
              const next = DOSSIERS.find((x) => x.domain !== open.domain && !reviews[x.domain]);
              setOpen(next ?? null);
              window.scrollTo({ top: 0 });
            }}
          />
        ) : nav === 'overview' ? (
          <Overview dossiers={DOSSIERS} reviews={reviews} go={goto} />
        ) : nav === 'accounts' ? (
          <>
            <h1 className="page-h">Accounts</h1>
            <p className="page-sub">
              {DOSSIERS.length} researched. Sorted alphabetically — deliberately not by any measure of quality.
              {workflowFilter && <> Showing <strong>{WORKFLOW_LABEL[workflowFilter]}</strong> only. <button className="clear-filter" onClick={() => setWorkflowFilter(null)}>Show all</button></>}
            </p>
            <AccountsTable
              dossiers={[...DOSSIERS].sort((a, b) => (a.companyName ?? a.domain).localeCompare(b.companyName ?? b.domain))}
              reviews={reviews} onOpen={setOpen}
              filter={workflowFilter ? (d, r) => workflowState(d, r) === workflowFilter : undefined}
            />
          </>
        ) : nav === 'review' ? (
          <>
            <h1 className="page-h">Review</h1>
            <p className="page-sub">Undecided accounts. Open one, read the evidence, decide. Keys: P promote · R research · W watch · X reject · S suppress.</p>
            <AccountsTable dossiers={DOSSIERS} reviews={reviews} onOpen={setOpen} filter={(_d, r) => !r} />
          </>
        ) : nav === 'watching' ? (
          <>
            <h1 className="page-h">Watching</h1>
            <p className="page-sub">Fit may be interesting, but no verified timing reason exists. Snapshots continue; you will only be told about a real change.</p>
            <AccountsTable dossiers={DOSSIERS} reviews={reviews} onOpen={setOpen} filter={(_d, r) => r?.outcome === 'watch'} />
          </>
        ) : nav === 'changes' ? (
          <Changes dossiers={DOSSIERS} />
        ) : (
          <DataHealth dossiers={DOSSIERS} />
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
