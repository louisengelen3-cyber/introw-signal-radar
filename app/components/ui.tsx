import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { logEvent } from '../data.js';
import type { Observation } from '../../src/dossier/types.js';

/* ══════════════════════════════════════════════════════════════════ chips ══
 * Tone marks KIND, never quality. There is no red-to-green scale, and `neutral` is the
 * default rather than a downgrade — an unknown state is a result, not a gap.
 */

export type Tone = 'verified' | 'uncertain' | 'neutral' | 'blocker' | 'accent';

export function Chip({ tone = 'neutral', children, title, icon }: {
  tone?: Tone; children: ReactNode; title?: string; icon?: string;
}) {
  return (
    <span className={`chip chip-${tone}`} title={title}>
      {icon && <span className="chip-icon" aria-hidden="true">{icon}</span>}
      {children}
    </span>
  );
}

/** Meaning is never carried by colour alone — every state chip also carries a glyph. */
export const TONE_ICON: Record<Tone, string> = {
  verified: '✓', uncertain: '~', neutral: '·', blocker: '!', accent: '›',
};

export function StateChip({ label, tone, title }: { label: string; tone: Tone; title?: string }) {
  return <Chip tone={tone} icon={TONE_ICON[tone]} title={title}>{label}</Chip>;
}

/* ═══════════════════════════════════════════════════════════════ evidence ══ */

export function shortUrl(u: string): string {
  try {
    const x = new URL(u);
    const p = x.pathname === '/' ? '' : x.pathname;
    return (x.hostname.replace(/^www\./, '') + p).slice(0, 58);
  } catch { return u.slice(0, 58); }
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return 'unknown';
  try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

/**
 * One observation. The quote leads, the source is always one click away, and what it does
 * NOT prove is always available — both blind reviewers in validation named that pairing as
 * the format's most useful feature.
 */
export function EvidenceItem({ o, domain }: { o: Observation; domain?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const isDns = o.sourceUrl.startsWith('dns:');
  return (
    <li className="ev">
      <blockquote className="ev-quote">{o.quote}</blockquote>
      <div className="ev-meta">
        {isDns
          ? <span className="ev-src">{o.sourceUrl}</span>
          : <a className="ev-src" href={o.sourceUrl} target="_blank" rel="noreferrer">{shortUrl(o.sourceUrl)} ↗</a>}
        <span className="ev-sep" aria-hidden="true">·</span>
        <span>{o.strength.replace(/_/g, ' ')}</span>
        {o.duplicateCount && o.duplicateCount > 1 ? (
          <>
            <span className="ev-sep" aria-hidden="true">·</span>
            <span className="ev-dup" title="The same claim appeared this many times. Repetition is not additional evidence.">
              seen {o.duplicateCount}×
            </span>
          </>
        ) : null}
        <button
          className="ev-toggle" aria-expanded={open} aria-controls={id}
          onClick={() => { setOpen((v) => !v); if (!open) logEvent('evidence_expanded', { domain }); }}
        >
          {open ? 'Hide' : 'What this proves'}
        </button>
      </div>
      {open && (
        <dl className="ev-claims" id={id}>
          <dt>Proves</dt><dd>{o.proves}</dd>
          <dt className="neg">Does not prove</dt><dd>{o.doesNotProve}</dd>
          <dt>Retrieved</dt><dd>{fmtDate(o.retrievedAt)}</dd>
        </dl>
      )}
    </li>
  );
}

export function EvidenceList({ items, domain, limit }: { items: Observation[]; domain?: string; limit?: number }) {
  const [all, setAll] = useState(false);
  if (!items.length) return null;
  const shown = all || !limit ? items : items.slice(0, limit);
  return (
    <>
      <ul className="ev-list">{shown.map((o) => <EvidenceItem key={o.id} o={o} domain={domain} />)}</ul>
      {limit && items.length > limit && (
        <button className="link-btn" onClick={() => setAll((v) => !v)}>
          {all ? 'Show less' : `Show ${items.length - limit} more`}
        </button>
      )}
    </>
  );
}

/* ═════════════════════════════════════════════════════════════════ layout ══ */

export function Panel({ title, aside, children, tone }: {
  title?: string; aside?: ReactNode; children: ReactNode; tone?: 'plain' | 'soft';
}) {
  return (
    <section className={`panel ${tone === 'soft' ? 'panel-soft' : ''}`}>
      {(title || aside) && (
        <header className="panel-head">
          {title && <h3>{title}</h3>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHead({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1 className="display page-title">{title}</h1>
        {sub && <p className="page-sub">{sub}</p>}
      </div>
      {children}
    </header>
  );
}

/* ═════════════════════════════════════════════════════ status components ══ */

export function Loading({ what }: { what: string }) {
  return (
    <div className="status" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>Loading {what}…</span>
    </div>
  );
}

export function ErrorState({ error, retry }: { error: string; retry?: () => void }) {
  return (
    <div className="status status-error" role="alert">
      <strong>Something failed to load.</strong>
      <p>{error}</p>
      <p className="status-note">
        This is a retrieval failure on our side. It is not information about any company.
      </p>
      {retry && <button className="btn" onClick={retry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, body, note }: { title: string; body: string; note?: string }) {
  return (
    <div className="status status-empty">
      <strong>{title}</strong>
      <p>{body}</p>
      {note && <p className="status-note">{note}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ tooltip ══ */

/** A short explanation attached to a label. Keyboard reachable, not hover-only. */
export function Info({ children }: { children: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h);
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [open]);
  return (
    <span className="info" ref={ref}>
      <button className="info-btn" aria-expanded={open} aria-label="What does this mean?" onClick={() => setOpen((v) => !v)}>i</button>
      {open && <span className="info-pop" role="note">{children}</span>}
    </span>
  );
}
