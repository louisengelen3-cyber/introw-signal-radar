import { useMemo } from 'react';
import { type IndexRow, type ReviewRecord, type SiteIndex } from '../data.js';
import { Chip, EmptyState, PageHead, Panel, fmtDate, type Tone } from '../components/ui.js';

/* ══════════════════════════════════════════════════════════════ changes ══ */

export function Changes({ index }: { index: SiteIndex }) {
  return (
    <>
      <PageHead
        title="Changes"
        sub="Only verified changes appear here. A first observation is never a change, and no timing claim is made without a second dated observation."
      />
      <EmptyState
        title="No verified changes yet"
        body={`Temporal monitoring began on ${fmtDate(index.monitoringSince)}. Every account is at its first observation, so there is nothing to compare against.`}
        note="This page will stay empty until enough calendar time has passed. Showing anything else here would be fabrication — there is deliberately no 'Why Now' in this product."
      />
      <Panel title="How change detection works" tone="soft">
        <p>
          Each partner surface is hashed after normalisation that strips timestamps, build hashes and
          cache-busting parameters, so a layout change is not reported as a programme change.
        </p>
        <p>
          The mechanism was tested by re-fetching 40 surfaces with caching forcibly disabled:{' '}
          <strong>0 of 40 differed</strong> — consistent with a false-positive rate under roughly 7%,
          which is the tightest bound 40 trials can support. When a change is eventually reported it
          will carry the previous state, the new state, the interval between observations, the source,
          and a clearly separated reading of why it may matter.
        </p>
      </Panel>
    </>
  );
}

/* ═════════════════════════════════════════════════════════════ watching ══ */

export function Watching({ index, reviews, onOpen }: {
  index: SiteIndex; reviews: Record<string, ReviewRecord>; onOpen: (d: string) => void;
}) {
  const watched = index.accounts.filter((a) => reviews[a.domain]?.outcome === 'watch');
  return (
    <>
      <PageHead
        title="Watching"
        sub="Interesting accounts with no verified reason to act yet. Monitoring continues; you will only be told about a real, dated change."
      />
      {watched.length === 0 ? (
        <EmptyState
          title="Nothing on watch"
          body="Mark an account Watch from its dossier when the fit is interesting but there is no current reason to act."
        />
      ) : (
        <ul className="ready-list">
          {watched.map((a) => (
            <li key={a.domain}>
              <article className="ready">
                <header className="ready-head">
                  <div>
                    <h3 className="display ready-name">{a.companyName ?? a.domain}</h3>
                    <p className="ready-desc">{a.selfDescription ?? <span className="dim">No public self-description retrieved.</span>}</p>
                  </div>
                  <Chip tone="accent">Watching</Chip>
                </header>
                {reviews[a.domain]?.rationale && <p className="ready-unknown"><span className="lab">Your note</span>{reviews[a.domain]!.rationale}</p>}
                <footer className="ready-foot">
                  <span className="dim small">Watched since {fmtDate(reviews[a.domain]!.reviewedAt)}</span>
                  <button className="btn" onClick={() => onOpen(a.domain)}>Open dossier →</button>
                </footer>
              </article>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════ data health ══ */

export function DataHealth({ index }: { index: SiteIndex }) {
  const stats = useMemo(() => {
    const a = index.accounts;
    const cover = (f: (r: IndexRow) => boolean) => a.filter(f).length;
    const ok = a.reduce((n, r) => n + r.sourceHealthOk, 0);
    const total = a.reduce((n, r) => n + r.sourceHealthTotal, 0);
    return {
      dossiers: a.length,
      claims: a.reduce((n, r) => n + r.distinctClaims, 0),
      fetchOk: ok,
      fetchTotal: total,
      noSurface: cover((r) => r.sourceHealthOk === 0),
      underObserved: cover((r) => r.coverage === 'sparse' || r.coverage === 'none'),
      categoryKnown: cover((r) => r.category !== 'unknown'),
      crmKnown: cover((r) => r.crm !== 'unknown'),
      prmKnown: cover((r) => r.prm !== 'unknown'),
      peopleKnown: cover((r) => r.people !== 'unknown'),
      directories: cover((r) => r.directoryLowerBound !== null),
      contradictions: a.reduce((n, r) => n + r.contradictions, 0),
      recoveryRan: cover((r) => r.recovery?.ran === true),
      recoveryAdded: cover((r) => (r.recovery?.added ?? 0) > 0),
      recoveryPages: a.reduce((n, r) => n + (r.recovery?.pagesRead ?? 0), 0),
      multiDomain: cover((r) => (r.recovery?.domainsSearched ?? 0) > 1),
    };
  }, [index]);

  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const status = (p: number): [string, Tone] =>
    p >= 80 ? ['Healthy', 'verified'] : p >= 40 ? ['Degraded', 'uncertain'] : ['Sparse', 'neutral'];

  const coverageRows: [string, number, number, string][] = [
    ['Category classification', stats.categoryKnown, stats.dossiers, 'Inferred from the company’s own positioning. The rule caught 8 of 14 partner-tech vendors across two frozen holdouts.'],
    ['CRM evidence', stats.crmKnown, stats.dossiers, 'Measured at 33% recall against companies that provably run a supported CRM. Salesforce was never detected once.'],
    ['Partner platform', stats.prmKnown, stats.dossiers, 'DNS fingerprints plus platform names appearing on partner pages. Absence is always unknown.'],
    ['People evidence', stats.peopleKnown, stats.dossiers, 'Not attempted. Public person discovery was measured at 2 of 18 companies and is not viable, so no crawler was built. The panel is kept so a licensed provider can fill it later.'],
    ['Partner directory', stats.directories, stats.dossiers, 'A published list of partner organisations. Counted as a lower bound, never as a partner count.'],
  ];

  return (
    <>
      <PageHead
        title="Data health"
        sub="This product is only as trustworthy as its retrieval. A technical failure is never converted into commercial evidence."
      />

      <ul className="tiles tiles-static">
        <li><div className="tile tile-plain"><span className="tile-n display">{stats.dossiers}</span><span className="tile-l">Dossiers</span></div></li>
        <li><div className="tile tile-plain"><span className="tile-n display">{stats.claims}</span><span className="tile-l">Distinct evidence claims</span></div></li>
        <li><div className="tile tile-plain"><span className="tile-n display">{stats.fetchOk}</span><span className="tile-l">Pages returning content</span><span className="tile-note">of {stats.fetchTotal} fetched — most of the remainder are conventional partner paths we probe on every account and which are expected to 404</span></div></li>
        <li><div className="tile tile-plain"><span className="tile-n display">{stats.noSurface}</span><span className="tile-l">Accounts with no readable surface</span><span className="tile-note">A retrieval limit, not a finding</span></div></li>
        <li><div className="tile tile-plain"><span className="tile-n display">{stats.underObserved}</span><span className="tile-l">Under-observed</span><span className="tile-note">Publishes little — not low fit</span></div></li>
        <li><div className="tile tile-plain"><span className="tile-n display">{stats.contradictions}</span><span className="tile-l">Open contradictions</span></div></li>
      </ul>

      <h2 className="sect display">Additive source recovery</h2>
      <p className="lede">
        Recovery reads partner surfaces on a company’s regional domains and programme
        subdomains that the base research pass does not reach. It runs only where base
        evidence was thin, and it can only add — it never replaces or overrides a base
        finding. On a frozen 32-company holdout it identified a partner motion on four
        physical-sector companies that base research alone left under-observed, changed
        nothing on software, and regressed nothing.
      </p>
      <ul className="tiles tiles-static">
        <li><div className="tile tile-plain"><span className="tile-n display">{stats.recoveryRan}</span><span className="tile-l">Accounts recovery ran on</span><span className="tile-note">Skipped where base evidence was already sufficient</span></div></li>
        <li><div className="tile tile-plain"><span className="tile-n display">{stats.recoveryAdded}</span><span className="tile-l">Accounts it added evidence to</span><span className="tile-note">Running and finding nothing new is a normal outcome, not a failure</span></div></li>
        <li><div className="tile tile-plain"><span className="tile-n display">{stats.multiDomain}</span><span className="tile-l">Accounts needing a second domain</span><span className="tile-note">Programme published on a country or partner domain, not the canonical one</span></div></li>
        <li><div className="tile tile-plain"><span className="tile-n display">{stats.recoveryPages}</span><span className="tile-l">Extra partner pages read</span><span className="tile-note">Every added motion has a page behind it</span></div></li>
      </ul>

      <h2 className="sect display">Field coverage</h2>
      <div className="table-wrap">
        <table className="accounts health-table">
          <thead>
            <tr><th scope="col">Field</th><th scope="col">Coverage</th><th scope="col">Status</th><th scope="col">What the number means</th></tr>
          </thead>
          <tbody>
            {coverageRows.map(([label, n, d, note]) => {
              const p = pct(n, d);
              const [s, tone] = label === 'People evidence' ? ['Not attempted', 'neutral' as Tone] : status(p);
              return (
                <tr key={label}>
                  <td className="c-name">{label}</td>
                  <td className="mono">{n}/{d} · {p}%</td>
                  <td><Chip tone={tone}>{s}</Chip></td>
                  <td className="health-note">{note}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 className="sect display">Known measurement limits</h2>
      <Panel tone="soft">
        <ul className="limits">
          <li><strong>Category classifier — caught 8 of 14 partner-tech vendors</strong> across two frozen holdouts. On that sample size the true recall plausibly sits anywhere from about 30% to 80%, so treat it as advisory: a meaningful share of vendors still reach you unflagged. Its disqualifying rules have not wrongly excluded a genuine target in 13 cases, which bounds that error near 21% rather than proving it zero.</li>
          <li><strong>CRM detection — found 2 of 6</strong> companies that provably run a supported CRM, and Salesforce was never detected once. Unknown never means “no CRM”.</li>
          <li><strong>Public person evidence — 2 of 18 companies.</strong> Not viable for contact resolution. The architecture accepts a licensed provider later.</li>
          <li><strong>Temporal — baseline only.</strong> Change detection has a measured 0% false-positive floor but needs elapsed calendar time before it can report anything.</li>
          <li><strong>Client-side rendering is invisible.</strong> A partner page that returns HTTP 200 and renders its content in JavaScript reads as empty to this pipeline.</li>
        </ul>
      </Panel>
    </>
  );
}

/* ══════════════════════════════════════════════════════════ methodology ══ */

export function Methodology() {
  return (
    <>
      <PageHead
        title="How this works"
        sub="What the system does, what it refuses to do, and why."
      />
      <div className="prose">
        <Panel title="What it is" tone="soft">
          <p>
            An evidence-first research assistant. It reads a company’s public surfaces, structures what it
            finds into an auditable dossier, and shows what is known, unknown and contradictory. A human
            makes the commercial decision.
          </p>
        </Panel>

        <Panel title="Why there is no score">
          <p>
            An earlier version of this system scored and ranked accounts. Tested against a set of hard
            negatives, it promoted <strong>five of six PRM competitors</strong> — Introw’s direct rivals — to
            its highest state. The cause was structural: promotion tracked how much partner content a
            company published, and a partner-management vendor publishes more of it than anyone.
          </p>
          <p>
            A blind reviewer given the same evidence packets, with company names removed, rejected all six.
            The information needed was in the evidence; the scoring simply did not use it. So the scoring was
            removed rather than repaired, and the evidence was kept.
          </p>
        </Panel>

        <Panel title="What “unknown” means">
          <p>
            Unknown is a result, not a gap, and it is rendered with the same weight as a confirmed value.
            The system never converts <em>not found</em> into <em>not there</em>:
          </p>
          <ul>
            <li>No CRM fingerprint means the CRM is unknown — never that the company has no CRM, and never that it is not HubSpot.</li>
            <li>No partner-role person found means people evidence is unknown — never that no partner team exists.</li>
            <li>“Not observed” on a workflow means we read surfaces where it usually appears and did not see it. Deal registration normally sits behind a partner login and is invisible by design.</li>
            <li>A blocked or failed fetch is a retrieval failure and is never shown as commercial evidence.</li>
          </ul>
        </Panel>

        <Panel title="Sparse is not weak">
          <p>
            Evidence coverage describes how much a company publishes. It is deliberately never converted
            into fit. An excellent prospect that publishes one partner page will read <em>under-observed</em>,
            which means “go and look”, not “skip this”.
          </p>
        </Panel>

        <Panel title="Why there is no “Why Now”">
          <p>
            Timing requires two dated observations of the same surface. Monitoring began at the baseline and
            every account is still at its first observation, so no timing claim is available for anyone yet.
            Fabricating one would be the easiest way to lose a seller’s trust permanently.
          </p>
          <p>
            An existing competitor platform indicates programme maturity. It does <strong>not</strong> indicate
            dissatisfaction, contract timing, or any intent to switch, and the product says so wherever it appears.
          </p>
        </Panel>

        <Panel title="What it cannot tell you">
          <p>
            The honest limit, stated by a channel expert during red-team review: this system reads partner
            web <em>pages</em>, not partner <em>programmes</em>. A company that launched a programme, recruited
            nine agencies and quietly stopped staffing it has the same page today as one running a large,
            active channel. The discriminating facts — partner-sourced revenue, active-versus-registered
            partners, deal-registration volume — all sit behind the partner login.
          </p>
          <p>
            Everything here is a function of what a company has published. None of it is a function of what
            a company is currently doing.
          </p>
        </Panel>

        <Panel title="Provenance of every claim" tone="soft">
          <p>
            Each observation carries a verbatim quote, the URL it came from, when it was retrieved, what it
            proves and — always — what it does not prove. Repeated copies of the same sentence are collapsed
            to one claim, so a company cannot look better simply by repeating itself.
          </p>
        </Panel>
      </div>
    </>
  );
}
