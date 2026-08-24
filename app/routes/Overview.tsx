import { useMemo } from 'react';
import {
  CATEGORY_LABEL, MACHINE_LABEL, MATERIALITY_LABEL, OWNERSHIP_LABEL, SURFACE_LABEL,
  humanise, workflowState,
  type IndexRow, type ReviewRecord, type SiteIndex, type WorkflowState,
} from '../data.js';
import { Chip, EmptyState, Info, PageHead, StateChip, fmtDate, type Tone } from '../components/ui.js';

const TILES: { key: WorkflowState | 'all' | 'changes'; label: string; note: string }[] = [
  { key: 'all', label: 'Accounts researched', note: 'Dossiers built from public evidence' },
  { key: 'ready_for_review', label: 'Ready for review', note: 'Enough evidence to merit inspection' },
  { key: 'research_needed', label: 'Research needed', note: 'One specific question is open' },
  { key: 'under_observed', label: 'Under-observed', note: 'Sparse public evidence — not low fit' },
  { key: 'watching', label: 'Watching', note: 'Monitored, no reason to act yet' },
  { key: 'reviewed', label: 'Reviewed', note: 'A human decision is recorded' },
];

export function Overview({ index, reviews, onOpen, onGo }: {
  index: SiteIndex;
  reviews: Record<string, ReviewRecord>;
  onOpen: (domain: string) => void;
  onGo: (route: string, workflow?: WorkflowState) => void;
}) {
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: index.accounts.length, changes: 0 };
    for (const a of index.accounts) {
      const w = workflowState(a.machineState, reviews[a.domain] ?? null);
      c[w] = (c[w] ?? 0) + 1;
    }
    return c;
  }, [index, reviews]);

  const ready = useMemo(
    () => index.accounts
      .filter((a) => !reviews[a.domain] && workflowState(a.machineState, null) === 'ready_for_review')
      // The copy below promises oldest-researched first. It previously promised it without
      // sorting, so the newest and thinnest account sat third on the front page.
      .sort((a, b) => a.retrievedAt.localeCompare(b.retrievedAt))
      .slice(0, 6),
    [index, reviews],
  );

  const flagged = useMemo(
    () => index.accounts.filter((a) => !reviews[a.domain] && a.machineState === 'suppression_candidate'),
    [index, reviews],
  );

  return (
    <>
      <PageHead title="Partner intelligence" sub="Evidence-backed company research for Introw." />

      <ul className="tiles">
        {TILES.map((t) => (
          <li key={t.key}>
            <button className="tile" onClick={() => onGo('accounts', t.key === 'all' ? undefined : (t.key as WorkflowState))}>
              <span className="tile-n display">{counts[t.key] ?? 0}</span>
              <span className="tile-l">{t.label}</span>
              <span className="tile-note">{t.note}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="note-bar">
        This product does not rank accounts. An earlier scoring model promoted Introw’s own competitors
        above genuine prospects, so ordered output was removed rather than repaired. The states above are
        workflow positions, not predictions.
        <button className="link-btn" onClick={() => onGo('methodology')}>How this works →</button>
      </div>

      <section className="block">
        <h2 className="sect display">Ready for review</h2>
        <p className="sect-sub">
          Dossiers with enough evidence to merit a human decision. Shown oldest-researched first — that
          is an operational order, not a priority order.
        </p>
        {ready.length === 0 ? (
          <EmptyState
            title="Nothing waiting"
            body="Every account with sufficient evidence has a recorded decision."
            note="Under-observed accounts are not shown here; they are listed on the Accounts page so a sparse company is never quietly dropped."
          />
        ) : (
          <ul className="ready-list">{ready.map((a) => <ReadyCard key={a.domain} a={a} onOpen={onOpen} />)}</ul>
        )}
        <button className="btn btn-ghost" onClick={() => onGo('accounts')}>See all {index.accounts.length} accounts →</button>
      </section>

      {flagged.length > 0 && (
        <section className="block">
          <h2 className="sect display">Flagged for suppression</h2>
          <p className="sect-sub">
            The machine believes these should not be prospected. Confirm before dismissing — the category
            classifier catches roughly 57% of partner-tech vendors, so this list is not exhaustive.
          </p>
          {/* Compact by design: for a suppression candidate the REASON is the whole story, and the
              construct grid is a row of "Unknown" that adds nothing. */}
          <ul className="suppress-list">
            {flagged.map((a) => (
              <li key={a.domain}>
                <button className="suppress" onClick={() => onOpen(a.domain)}>
                  <span className="suppress-main">
                    <span className="c-name">{a.companyName ?? a.domain}</span>
                    <span className="suppress-why">{CATEGORY_LABEL[a.category] ?? humanise(a.category)}</span>
                  </span>
                  <span className="suppress-chips">
                    {a.onCompetitorList
                      ? <Chip tone="blocker" icon="!">On competitor list</Chip>
                      : <Chip tone="blocker" icon="!">Inferred from positioning</Chip>}
                    <span className="suppress-go">Open →</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

const machineTone = (s: string): Tone =>
  s === 'suppression_candidate' ? 'blocker' : s === 'strong_evidence' ? 'verified' : s === 'under_observed' ? 'neutral' : 'uncertain';

const constructTone = (s: string): Tone =>
  s === 'unknown' ? 'neutral'
    : s === 'contradicted' || s === 'participant_only' ? 'blocker'
    : s === 'weak_proxy' || s === 'light' || s === 'mixed' || s === 'distributor_mediated' ? 'uncertain'
    : 'verified';

function ReadyCard({ a, onOpen }: { a: IndexRow; onOpen: (d: string) => void }) {
  return (
    <li>
      <article className="ready">
        <header className="ready-head">
          <div>
            <h3 className="display ready-name">{a.companyName ?? a.domain}</h3>
            <p className="ready-desc">
              {a.selfDescription ?? <span className="dim">No public self-description could be retrieved for {a.domain}.</span>}
            </p>
          </div>
          <StateChip label={MACHINE_LABEL[a.machineState] ?? humanise(a.machineState)} tone={machineTone(a.machineState)} />
        </header>

        <dl className="ready-grid">
          <div><dt>Partner motion</dt><dd>{a.programmes.length ? a.programmes.slice(0, 3).map(humanise).join(', ') : <span className="dim">Not identified</span>}</dd></div>
          <div><dt>Materiality</dt><dd><StateChip label={MATERIALITY_LABEL[a.materiality] ?? humanise(a.materiality)} tone={constructTone(a.materiality)} /></dd></div>
          <div><dt>Ownership</dt><dd><StateChip label={OWNERSHIP_LABEL[a.ownership] ?? humanise(a.ownership)} tone={constructTone(a.ownership)} /></dd></div>
          <div><dt>Surface</dt><dd><StateChip label={SURFACE_LABEL[a.surface] ?? humanise(a.surface)} tone={constructTone(a.surface)} /></dd></div>
          <div>
            <dt>Evidence<Info>Distinct claims after deduplication, and how many separate hosts they came from.</Info></dt>
            <dd className="mono">{a.distinctClaims} claims · {a.independentSources} {a.independentSources === 1 ? 'source' : 'sources'}</dd>
          </div>
          <div><dt>Category</dt><dd><Chip tone="neutral">{CATEGORY_LABEL[a.category] ?? humanise(a.category)}</Chip></dd></div>
        </dl>

        {a.topUnknown && (
          <p className="ready-unknown"><span className="lab">Open question</span>{a.topUnknown}</p>
        )}

        <footer className="ready-foot">
          <span className="dim small">Evidence retrieved {fmtDate(a.retrievedAt)}</span>
          <button className="btn" onClick={() => onOpen(a.domain)}>Review dossier →</button>
        </footer>
      </article>
    </li>
  );
}
