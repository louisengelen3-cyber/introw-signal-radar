import { StrictMode, useCallback, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  allReviews, loadIndex, type ReviewRecord, type SiteIndex, type WorkflowState,
} from './data.js';
import { ErrorState, Loading } from './components/ui.js';
import { Overview } from './routes/Overview.js';
import { AccountsTable, EMPTY_FILTERS, type Filters } from './routes/Accounts.js';
import { DossierView } from './routes/Dossier.js';
import { Changes, DataHealth, Methodology, Watching } from './routes/Support.js';
import { PageHead } from './components/ui.js';
import './theme.css';
import './app.css';

/* ── routing ──────────────────────────────────────────────────────────────
 * Hash routes, so the deployment is a plain static site with no server rewrite rules and
 * every screen is linkable — which matters for a demo.
 */

type Route =
  | { name: 'overview' } | { name: 'accounts' } | { name: 'review' }
  | { name: 'watching' } | { name: 'changes' } | { name: 'health' }
  | { name: 'methodology' } | { name: 'account'; domain: string };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [head, tail] = h.split('/');
  if (head === 'account' && tail) return { name: 'account', domain: decodeURIComponent(tail) };
  const known = ['overview', 'accounts', 'review', 'watching', 'changes', 'health', 'methodology'] as const;
  const hit = known.find((k) => k === head);
  return hit ? { name: hit } : { name: 'overview' };
}

const NAV: { id: Route['name']; label: string; job: string }[] = [
  { id: 'overview', label: 'Overview', job: 'What needs attention' },
  { id: 'accounts', label: 'Accounts', job: 'Every researched company' },
  { id: 'review', label: 'Review', job: 'Decide on what is ready' },
  { id: 'watching', label: 'Watching', job: 'Monitored, not yet actionable' },
  { id: 'changes', label: 'Changes', job: 'Verified change only' },
  { id: 'health', label: 'Data health', job: 'Retrieval and coverage' },
];

function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [index, setIndex] = useState<SiteIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [order, setOrder] = useState<'needs_review' | 'alphabetical' | 'recent' | 'evidence'>('needs_review');
  const [navOpen, setNavOpen] = useState(false);

  const reviews: Record<string, ReviewRecord> = useMemo(() => allReviews(), [tick]);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const h = () => { setRoute(parseHash()); setNavOpen(false); window.scrollTo({ top: 0 }); };
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);

  const load = useCallback(() => {
    setError(null);
    loadIndex().then(setIndex).catch((e) => setError(String(e.message ?? e)));
  }, []);
  useEffect(load, [load]);

  const go = useCallback((name: string, workflow?: WorkflowState) => {
    if (workflow) setFilters({ ...EMPTY_FILTERS, workflow });
    else if (name === 'accounts') setFilters(EMPTY_FILTERS);
    window.location.hash = `/${name}`;
  }, []);

  const open = useCallback((domain: string) => { window.location.hash = `/account/${encodeURIComponent(domain)}`; }, []);

  const undecided = useMemo(
    () => (index?.accounts ?? []).filter((a) => !reviews[a.domain]),
    [index, reviews],
  );

  const nextUndecided = useCallback((current: string) => {
    const next = undecided.find((a) => a.domain !== current);
    if (next) open(next.domain); else go('accounts');
  }, [undecided, open, go]);

  const body = (() => {
    if (error) return <ErrorState error={error} retry={load} />;
    if (!index) return <Loading what="accounts" />;

    switch (route.name) {
      case 'overview':
        return <Overview index={index} reviews={reviews} onOpen={open} onGo={go} />;
      case 'accounts':
        return (
          <>
            <PageHead title="Accounts" sub={`${index.accounts.length} companies researched from public evidence.`} />
            <AccountsTable rows={index.accounts} reviews={reviews} onOpen={open}
              filters={filters} setFilters={setFilters} order={order} setOrder={setOrder} />
          </>
        );
      case 'review':
        return (
          <>
            <PageHead title="Review"
              sub="Accounts without a recorded decision. Open one, read the evidence, decide. Keys: P promote · R research · W watch · X reject · S suppress." />
            <AccountsTable rows={undecided} reviews={reviews} onOpen={open}
              filters={filters} setFilters={setFilters} order={order} setOrder={setOrder} />
          </>
        );
      case 'watching':
        return <Watching index={index} reviews={reviews} onOpen={open} />;
      case 'changes':
        return <Changes index={index} />;
      case 'health':
        return <DataHealth index={index} />;
      case 'methodology':
        return <Methodology />;
      case 'account':
        return (
          <DossierView
            domain={route.domain}
            onBack={() => go('accounts')}
            onNext={() => nextUndecided(route.domain)}
            remaining={undecided.length}
            onReviewed={refresh}
          />
        );
    }
  })();

  const current = route.name === 'account' ? 'accounts' : route.name;

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>

      <header className="topbar">
        <a className="brand" href="#/overview">
          <span className="brand-mark display">introw</span>
          <span className="brand-sub">Signal Radar</span>
        </a>

        <button className="nav-toggle" aria-expanded={navOpen} aria-controls="mainnav"
          onClick={() => setNavOpen((v) => !v)}>
          {navOpen ? 'Close' : 'Menu'}
        </button>

        <nav id="mainnav" className={`nav ${navOpen ? 'open' : ''}`} aria-label="Main">
          {NAV.map((n) => (
            <a key={n.id} href={`#/${n.id}`} className={`nav-i ${current === n.id ? 'on' : ''}`}
              aria-current={current === n.id ? 'page' : undefined} title={n.job}>
              {n.label}
            </a>
          ))}
        </nav>

        <a className="nav-secondary" href="#/methodology" aria-current={current === 'methodology' ? 'page' : undefined}>
          How this works
        </a>
      </header>

      <main id="main" className="main">{body}</main>

      <footer className="sitefoot">
        <p>
          Evidence assistant — no scores, no ranking, no predicted intent. Every claim carries its source.
          {index && <> · {index.count} dossiers · monitoring since {index.monitoringSince}</>}
        </p>
        <p className="dim">
          Decisions are stored in this browser only. Public evidence has known limits — see{' '}
          <a href="#/health">Data health</a> and <a href="#/methodology">How this works</a>.
        </p>
      </footer>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
