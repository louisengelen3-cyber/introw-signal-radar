import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FIXTURES, type Fixture } from './fixtures.js';
import type { Fact, PartnerCount } from '../src/domain/types.js';
import './styles.css';

/* ── evidence primitives ─────────────────────────────────────────────────── */

/**
 * The single most important component in the product. Every displayed claim carries
 * its evidence state, and `unknown` is rendered with the same visual weight as a
 * confirmed value rather than as a gap.
 */
function State({ state }: { state: Fact<unknown>['state'] }) {
  const label: Record<string, string> = {
    confirmed: 'Confirmed', strong_proxy: 'Strong proxy', weak_proxy: 'Weak proxy',
    contradicted: 'Contradicted', unknown: 'Unknown', blocked: 'Not inspected',
  };
  return <span className={`st st-${state}`}>{label[state]}</span>;
}

function Claim({ label, fact, render }: { label: string; fact: Fact<never>; render?: (v: never) => string }) {
  const known = fact.value !== null;
  return (
    <div className={`claim ${known ? '' : 'claim-unknown'}`}>
      <div className="claim-l">{label}</div>
      <div className="claim-v">
        {known ? (render ? render(fact.value as never) : String(fact.value)) : <span className="dim">Not established</span>}
      </div>
      <div className="claim-m">
        <State state={fact.state} />
        <span className="claim-method" title={fact.method}>{fact.method}</span>
      </div>
    </div>
  );
}

/** Count type is part of the value. A lower bound must never render like a census. */
function Count({ c }: { c: PartnerCount }) {
  if (c.value === null) {
    return (
      <div className="metric metric-unknown">
        <div className="metric-v dim">Not established</div>
        <div className="metric-l">Partner network</div>
        <div className="metric-n">No countable directory found — this is not a claim that the network is small</div>
      </div>
    );
  }
  const prefix = c.countType === 'approximate' ? '' : c.countType === 'lower_bound' ? '≥' : '';
  const note: Record<string, string> = {
    exact_public: 'stated by the company',
    directory_count: 'enumerated from the public directory — a lower bound on the real network',
    lower_bound: 'partial enumeration; pagination was not exhausted',
    approximate: 'published as an approximate figure',
    unknown: '',
  };
  return (
    <div className="metric">
      <div className="metric-v">{prefix}{c.value.toLocaleString('en-GB')}{c.countType === 'approximate' ? '+' : ''}</div>
      <div className="metric-l">{c.unit ?? 'partners'}</div>
      <div className="metric-n">{note[c.countType]}</div>
    </div>
  );
}

/* ── card ────────────────────────────────────────────────────────────────── */

const COMMERCIALITY_LABEL: Record<string, string> = {
  transacting: 'Transacting channel', mixed: 'Transacting + integration',
  integration_only: 'Integration ecosystem only', affiliate_only: 'Affiliate motion only',
  strategic_only: 'Strategic alliances only', unknown: 'Channel not established',
};

function AccountCard({ a, onOpen }: { a: Fixture; onOpen: () => void }) {
  const q = a.qualification;
  const suppressed = q.suppressed !== null;
  const people = a.organisation.people;
  const primary = people.find((p) => p.persona.startsWith('t1')) ?? people[0];
  const load = a.operationalLoad;

  return (
    <article className={`card ${suppressed ? 'card-suppressed' : ''}`}>
      <header className="card-h">
        <div>
          <h3>{a.identity.canonicalName}</h3>
          <p className="card-sub">{a.identity.industry} · {a.identity.country}</p>
        </div>
        <div className="card-badges">
          {suppressed
            ? <span className="badge badge-block">Suppressed</span>
            : q.timing === 'strong'
              ? <span className="badge badge-priority">Timing</span>
              : q.researchState === 'research_needed'
                ? <span className="badge badge-research">Research</span>
                : <span className="badge badge-watch">Watchlist</span>}
        </div>
      </header>

      <div className="card-body">
        {/* Programme — always first, because it is the one thing that gates inclusion */}
        <section className="blk">
          <h4>Programme</h4>
          <p className={`blk-lead ${q.commerciality === 'unknown' ? 'dim' : ''}`}>
            {COMMERCIALITY_LABEL[q.commerciality]}
          </p>
          {a.program.motions.value && (
            <p className="motions">{a.program.motions.value.map((m) => <span key={m} className="chip">{m.replace(/_/g, ' ')}</span>)}</p>
          )}
          <Count c={a.program.partnerCount} />
        </section>

        {/* Environment — unknown is the majority state and must not read as a defect */}
        <section className="blk">
          <h4>Environment</h4>
          <div className="env">
            <div>
              <span className="env-k">CRM</span>
              {a.environment.crm.value
                ? <span className="env-v">{a.environment.crm.value === 'hubspot' ? 'HubSpot' : 'Salesforce'} <State state={a.environment.crm.state} /></span>
                : <span className="env-v dim">Not established <State state="unknown" /></span>}
            </div>
            <div>
              <span className="env-k">Platform</span>
              {a.environment.prm.value
                ? <span className="env-v">{a.environment.prm.value} <State state={a.environment.prm.state} /></span>
                : <span className="env-v dim">No fingerprint found <State state="unknown" /></span>}
            </div>
          </div>
        </section>

        {/* Organisation — never an empty headcount box */}
        <section className="blk">
          <h4>Organisation</h4>
          {primary ? (
            <p className="person">
              <strong>{primary.name ?? 'Unnamed'}</strong> · {primary.rawTitle}
              {primary.roleCurrency === 'current_verified'
                ? <span className="st st-confirmed">Role verified</span>
                : <span className="st st-unknown">Role currency unknown</span>}
            </p>
          ) : (
            <p className="dim">No partner owner identified. Company-owned pages do not normally name this role.</p>
          )}
          <p className="team dim">
            Team size: {a.organisation.teamSize !== null
              ? <>{a.organisation.teamSize} <span className="st st-strong_proxy">{a.organisation.teamSizeState.replace(/_/g, ' ')}</span></>
              : 'unknown'}
          </p>
        </section>

        {/* Operational load appears only when both inputs are reliable */}
        {load.availability === 'available' ? (
          <section className="blk">
            <h4>Operational load</h4>
            <p className="blk-lead">{load.ratio}× <span className="dim">partners per operator</span></p>
            <p className="note">Derived. Both inputs independently verified.</p>
          </section>
        ) : null}

        {/* Why now — only ever from a dated change */}
        {a.signals.length > 0 && (
          <section className="blk">
            <h4>Why now</h4>
            {a.signals.map((s) => (
              <div key={s.id}>
                <p className="blk-lead">{s.headline}</p>
                <p className="note">
                  {String(s.previousValue)} → {String(s.currentValue)} ·
                  {s.effectiveAt ? ` changed ${s.effectiveAt}` : ' change date unknown'} ·
                  first observed {s.firstSeenAt.slice(0, 10)}
                </p>
              </div>
            ))}
          </section>
        )}

        {a.conflictNote && (
          <section className="blk blk-warn">
            <h4>Conflicting evidence</h4>
            <p className="note">{a.conflictNote}</p>
          </section>
        )}

        {suppressed && (
          <section className="blk blk-block">
            <h4>Suppressed from cold outbound</h4>
            <p className="note">{q.suppressed!.reason}</p>
          </section>
        )}

        {a.research.length > 0 && (
          <section className="blk blk-research">
            <h4>Research · {a.research.length}</h4>
            {a.research.map((r) => (
              <p key={r.id} className="note"><strong>{r.missingField.replace(/_/g, ' ')}</strong> — {r.reason}</p>
            ))}
          </section>
        )}
      </div>

      <footer className="card-f">
        <span className="fixture-note" title={a.proves}>{a.archetype}</span>
        <button type="button" onClick={onOpen}>Evidence →</button>
      </footer>
    </article>
  );
}

/* ── evidence drawer ─────────────────────────────────────────────────────── */

function Drawer({ a, onClose }: { a: Fixture; onClose: () => void }) {
  const facts: [string, Fact<never>][] = [
    ['Commerciality', a.program.commerciality as Fact<never>],
    ['Partner motions', a.program.motions as unknown as Fact<never>],
    ['Partner portal', a.program.portal as Fact<never>],
    ['Deal registration', a.program.dealRegistration as Fact<never>],
    ['CRM', a.environment.crm as Fact<never>],
    ['Partner platform', a.environment.prm as Fact<never>],
  ];
  return (
    <div className="drawer-wrap" role="dialog" aria-label={`Evidence for ${a.identity.canonicalName}`}>
      <button type="button" className="scrim" onClick={onClose} aria-label="Close" />
      <div className="drawer">
        <header className="drawer-h">
          <div>
            <h2>{a.identity.canonicalName}</h2>
            <p className="dim">{a.archetype}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <section>
          <h4>What this fixture proves</h4>
          <p className="note">{a.proves}</p>
        </section>

        <section>
          <h4>Facts and what established them</h4>
          {facts.map(([label, f]) => (
            <Claim key={label} label={label} fact={f} render={(v) => Array.isArray(v) ? (v as string[]).join(', ') : String(v)} />
          ))}
        </section>

        <section>
          <h4>Partner count</h4>
          <Count c={a.program.partnerCount} />
        </section>

        <section>
          <h4>Operational load</h4>
          {a.operationalLoad.availability === 'available'
            ? <p>{a.operationalLoad.ratio}× — {a.operationalLoad.numerator} / {a.operationalLoad.denominator}</p>
            : <p className="dim">Not calculated. {a.operationalLoad.unavailableReason}</p>}
          <p className="note">A derived metric inherits the weakest confidence of its inputs, so it is withheld rather than approximated.</p>
        </section>

        <section>
          <h4>Qualification</h4>
          <dl className="qual">
            {Object.entries(a.qualification).filter(([, v]) => typeof v === 'string').map(([k, v]) => (
              <div key={k}><dt>{k.replace(/([A-Z])/g, ' $1').toLowerCase()}</dt><dd>{String(v).replace(/_/g, ' ')}</dd></div>
            ))}
          </dl>
        </section>

        {a.research.length > 0 && (
          <section>
            <h4>Research tasks</h4>
            {a.research.map((r) => (
              <div key={r.id} className="task">
                <p><strong>{r.missingField.replace(/_/g, ' ')}</strong> <span className={`st st-${r.priority === 'high' ? 'weak_proxy' : 'unknown'}`}>{r.priority}</span></p>
                <p className="note">{r.reason}</p>
                <p className="note"><em>How:</em> {r.suggestedMethod}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

/* ── app ─────────────────────────────────────────────────────────────────── */

type Filter = 'all' | 'actionable' | 'research' | 'suppressed';

function App() {
  const [filter, setFilter] = useState<Filter>('all');
  const [open, setOpen] = useState<string | null>(null);

  const shown = useMemo(() => FIXTURES.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'suppressed') return a.qualification.suppressed !== null;
    if (filter === 'research') return a.qualification.suppressed === null && a.qualification.researchState === 'research_needed';
    return a.qualification.suppressed === null && a.qualification.channelReality === 'confirmed';
  }), [filter]);

  const counts = useMemo(() => ({
    channel: FIXTURES.filter((a) => a.qualification.channelReality === 'confirmed' && !a.qualification.suppressed).length,
    crmUnknown: FIXTURES.filter((a) => a.environment.crm.value === null).length,
    teamUnknown: FIXTURES.filter((a) => a.organisation.teamSizeState === 'unknown').length,
    loadAvailable: FIXTURES.filter((a) => a.operationalLoad.availability === 'available').length,
  }), []);

  const active = open ? FIXTURES.find((f) => f.identity.id === open) ?? null : null;

  return (
    <div className="app">
      <header className="top">
        <span className="wordmark">introw</span>
        <nav><span className="on">Radar</span><span>Accounts</span><span>Signals</span><span>Watchlist</span><span>Research</span></nav>
      </header>

      <main>
        <h1>Signal Radar</h1>
        <p className="lede">Fixture-driven UX contract. Every account below exists to prove the model can be
          rendered honestly in one specific state — most of them incomplete, because Phase 0 measured that the
          modal account is partly empty.</p>

        <div className="stats">
          <div><b>{counts.channel}</b><span>channel confirmed</span></div>
          <div><b>{counts.crmUnknown}/{FIXTURES.length}</b><span>CRM unknown</span></div>
          <div><b>{counts.teamUnknown}/{FIXTURES.length}</b><span>team size unknown</span></div>
          <div><b>{counts.loadAvailable}/{FIXTURES.length}</b><span>operational load computable</span></div>
        </div>

        <div className="filters">
          {(['all', 'actionable', 'research', 'suppressed'] as Filter[]).map((f) => (
            <button key={f} type="button" className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        <div className="grid">
          {shown.map((a) => <AccountCard key={a.identity.id} a={a} onOpen={() => setOpen(a.identity.id)} />)}
        </div>
      </main>

      {active && <Drawer a={active} onClose={() => setOpen(null)} />}
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
