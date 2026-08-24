import { useMemo } from 'react';
import {
  CATEGORY_LABEL, CRM_LABEL, MACHINE_LABEL, MATERIALITY_LABEL, OWNERSHIP_LABEL,
  PRM_LABEL, SURFACE_LABEL, WORKFLOW_LABEL, humanise, logEvent, workflowState,
  type IndexRow, type ReviewRecord, type WorkflowState,
} from '../data.js';
import { Chip, EmptyState, Info, StateChip, fmtDate, type Tone } from '../components/ui.js';

const categoryTone = (s: string): Tone =>
  s === 'direct_introw_competitor' || s === 'partner_tech_vendor' ? 'blocker'
    : s === 'supply_side_marketplace' || s === 'professional_services' || s === 'reseller_or_participant' ? 'uncertain'
    : 'neutral';

const constructTone = (s: string): Tone =>
  s === 'unknown' ? 'neutral'
    : s === 'contradicted' || s === 'participant_only' ? 'blocker'
    : s === 'weak_proxy' || s === 'light' || s === 'mixed' || s === 'distributor_mediated' ? 'uncertain'
    : 'verified';

const machineTone = (s: string): Tone =>
  s === 'suppression_candidate' ? 'blocker' : s === 'strong_evidence' ? 'verified' : s === 'under_observed' ? 'neutral' : 'uncertain';

/**
 * Ordering is operational and stated on screen. There is no hidden numeric fit value: the
 * options below are all things a reviewer can verify by eye, and none of them claims that one
 * account is a better prospect than another.
 */
type Order = 'needs_review' | 'alphabetical' | 'recent' | 'evidence';
const ORDER_LABEL: Record<Order, string> = {
  needs_review: 'Needs review first',
  alphabetical: 'Alphabetical',
  recent: 'Most recently researched',
  evidence: 'Most evidence collected',
};

export interface Filters {
  q: string;
  workflow: WorkflowState | 'all';
  category: string;
  coverage: string;
  crm: string;
  prm: string;
}

export const EMPTY_FILTERS: Filters = { q: '', workflow: 'all', category: 'all', coverage: 'all', crm: 'all', prm: 'all' };

export function AccountsTable({ rows, reviews, onOpen, filters, setFilters, order, setOrder, showFilters = true }: {
  rows: IndexRow[];
  reviews: Record<string, ReviewRecord>;
  onOpen: (domain: string) => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  order: Order;
  setOrder: (o: Order) => void;
  showFilters?: boolean;
}) {
  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    let out = rows.filter((r) => {
      if (q && !(r.companyName ?? r.domain).toLowerCase().includes(q) && !r.domain.includes(q)) return false;
      if (filters.workflow !== 'all' && workflowState(r.machineState, reviews[r.domain] ?? null) !== filters.workflow) return false;
      if (filters.category !== 'all' && r.category !== filters.category) return false;
      if (filters.coverage !== 'all' && r.coverage !== filters.coverage) return false;
      if (filters.crm !== 'all' && (filters.crm === 'known' ? r.crm === 'unknown' : r.crm !== 'unknown')) return false;
      if (filters.prm !== 'all' && (filters.prm === 'known' ? r.prm === 'unknown' : r.prm !== 'unknown')) return false;
      return true;
    });
    const needsReview = (r: IndexRow) => (reviews[r.domain] ? 1 : 0);
    if (order === 'needs_review') out = [...out].sort((a, b) => needsReview(a) - needsReview(b) || (a.companyName ?? a.domain).localeCompare(b.companyName ?? b.domain));
    if (order === 'alphabetical') out = [...out].sort((a, b) => (a.companyName ?? a.domain).localeCompare(b.companyName ?? b.domain));
    if (order === 'recent') out = [...out].sort((a, b) => b.retrievedAt.localeCompare(a.retrievedAt));
    if (order === 'evidence') out = [...out].sort((a, b) => b.distinctClaims - a.distinctClaims);
    return out;
  }, [rows, reviews, filters, order]);

  const set = (patch: Partial<Filters>) => { setFilters({ ...filters, ...patch }); logEvent('filter_used', patch); };
  const active = filters.workflow !== 'all' || filters.category !== 'all' || filters.coverage !== 'all' || filters.crm !== 'all' || filters.prm !== 'all';

  return (
    <>
      {showFilters && (
        <div className="filters">
          <label className="field field-search">
            <span className="sr-only">Search accounts</span>
            <input type="search" placeholder="Search company or domain…" value={filters.q}
              onChange={(e) => set({ q: e.target.value })} />
          </label>
          <Select label="Status" value={filters.workflow} onChange={(v) => set({ workflow: v as Filters['workflow'] })}
            options={[['all', 'Any status'], ...Object.entries(WORKFLOW_LABEL)]} />
          <Select label="Category" value={filters.category} onChange={(v) => set({ category: v })}
            options={[['all', 'Any category'], ...Object.entries(CATEGORY_LABEL)]} />
          <Select label="Evidence" value={filters.coverage} onChange={(v) => set({ coverage: v })}
            options={[['all', 'Any evidence'], ['rich', 'Rich'], ['moderate', 'Moderate'], ['sparse', 'Sparse'], ['none', 'None retrieved']]} />
          <Select label="CRM" value={filters.crm} onChange={(v) => set({ crm: v })}
            options={[['all', 'CRM any'], ['known', 'CRM identified'], ['unknown', 'CRM unknown']]} />
          <Select label="Platform" value={filters.prm} onChange={(v) => set({ prm: v })}
            options={[['all', 'Platform any'], ['known', 'Platform identified'], ['unknown', 'Platform unknown']]} />
          <Select label="Order" value={order} onChange={(v) => setOrder(v as Order)}
            options={Object.entries(ORDER_LABEL)} />
          {active && <button className="link-btn" onClick={() => setFilters({ ...EMPTY_FILTERS, q: filters.q })}>Clear filters</button>}
        </div>
      )}

      <p className="result-count" aria-live="polite">
        {filtered.length} of {rows.length} accounts · ordered by {ORDER_LABEL[order].toLowerCase()}
        <Info>Ordering is operational only. There is no fit score, and no ordering here claims that one account is a better prospect than another.</Info>
      </p>

      {filtered.length === 0 ? (
        <EmptyState title="No accounts match" body="Try clearing a filter or widening the search." />
      ) : (
        <>
          {/* Desktop: table. Narrow: the same rows as cards — see the media query. */}
          <div className="table-wrap">
            <table className="accounts">
              <caption className="sr-only">Researched accounts with their evidence states</caption>
              <thead>
                <tr>
                  <th scope="col">Company</th>
                  <th scope="col">Category</th>
                  <th scope="col">Partner motion</th>
                  <th scope="col">Materiality</th>
                  <th scope="col">Ownership</th>
                  <th scope="col">Surface</th>
                  <th scope="col">Evidence</th>
                  <th scope="col">Systems</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const rev = reviews[r.domain] ?? null;
                  return (
                    <tr key={r.domain} onClick={() => onOpen(r.domain)} tabIndex={0} role="link"
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(r.domain); } }}>
                      <td className="c-company">
                        <span className="c-name">{r.companyName ?? r.domain}</span>
                        <span className="c-domain mono">{r.domain}</span>
                        <span className="c-checked mono">checked {fmtDate(r.retrievedAt)}</span>
                      </td>
                      <td><StateChip label={CATEGORY_LABEL[r.category] ?? humanise(r.category)} tone={categoryTone(r.category)} /></td>
                      <td className="c-motion">{r.programmes.length ? r.programmes.slice(0, 2).map(humanise).join(', ') : <span className="dim">Not identified</span>}</td>
                      <td><StateChip label={MATERIALITY_LABEL[r.materiality] ?? humanise(r.materiality)} tone={constructTone(r.materiality)} /></td>
                      <td><StateChip label={OWNERSHIP_LABEL[r.ownership] ?? humanise(r.ownership)} tone={constructTone(r.ownership)} /></td>
                      <td><StateChip label={SURFACE_LABEL[r.surface] ?? humanise(r.surface)} tone={constructTone(r.surface)} /></td>
                      <td className="c-ev mono" title={`${r.distinctClaims} distinct claims from ${r.independentSources} independent source(s)${r.directoryLowerBound ? `; a directory lists at least ${r.directoryLowerBound} partner organisations` : ''}`}>
                        {r.distinctClaims}<span className="dim"> · {r.independentSources} src</span>
                        {r.directoryLowerBound ? <span className="c-dir" title="Partner organisations publicly listed. A lower bound, not a count."> ≥{r.directoryLowerBound}</span> : null}
                      </td>
                      {/* CRM and platform share a cell: both are unknown on most accounts, and
                          two columns of "Unknown" pushed the status column off screen. */}
                      {/* The chips sit in a wrapper, not directly on the cell: making a <td>
                          a flex container breaks table-cell alignment and its border. */}
                      <td>
                        <span className="c-systems">
                          {r.crm !== 'unknown' && <StateChip label={(CRM_LABEL[r.crm] ?? humanise(r.crm)).replace(' confirmed', '')} tone="verified" />}
                          {r.prm !== 'unknown' && <StateChip label={r.prmVendor ?? (PRM_LABEL[r.prm] ?? humanise(r.prm))} tone={r.prm === 'competitor_prm_confirmed' ? 'blocker' : 'verified'} />}
                          {r.crm === 'unknown' && r.prm === 'unknown' && <StateChip label="Unknown" tone="neutral" />}
                        </span>
                      </td>
                      <td><StateChip label={WORKFLOW_LABEL[workflowState(r.machineState, rev)]} tone={rev ? 'accent' : 'neutral'} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="account-cards">
            {filtered.map((r) => {
              const rev = reviews[r.domain] ?? null;
              return (
                <li key={r.domain}>
                  <button className="acard" onClick={() => onOpen(r.domain)}>
                    <span className="acard-top">
                      <span className="c-name">{r.companyName ?? r.domain}</span>
                      <StateChip label={WORKFLOW_LABEL[workflowState(r.machineState, rev)]} tone={rev ? 'accent' : 'neutral'} />
                    </span>
                    <span className="c-domain mono">{r.domain}</span>
                    <span className="acard-chips">
                      <StateChip label={CATEGORY_LABEL[r.category] ?? humanise(r.category)} tone={categoryTone(r.category)} />
                      <StateChip label={MACHINE_LABEL[r.machineState] ?? humanise(r.machineState)} tone={machineTone(r.machineState)} />
                      <Chip tone="neutral">{r.distinctClaims} claims</Chip>
                    </span>
                    {r.topUnknown && <span className="acard-unknown"><span className="lab">Unknown</span>{r.topUnknown}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}

function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: [string, string][];
}) {
  return (
    <label className="field">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
