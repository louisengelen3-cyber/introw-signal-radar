# Introw Signal Radar

**Partner intelligence for faster commercial research.**

An evidence-first research assistant. It reads a company's public surfaces, structures what
it finds into an auditable dossier, and shows what is known, unknown and contradictory. A
human makes the commercial decision.

**Live:** https://introw-signal-radar.vercel.app/

## What it is — and is not

It **is** a research compressor: it turns "research this company" into "verify this evidence",
with every claim carrying the quote and URL it came from.

It is **not** a lead-ranking engine, an intent model, a fit score, or a queue of who to call
next. An earlier version of this system scored and ranked accounts; tested against hard
negatives it promoted five of six PRM competitors — Introw's direct rivals — to its top state,
because promotion tracked how much partner content a company published. Scoring was removed
rather than repaired. See `docs/FINAL_HARDENING_REPORT.md`.

There is deliberately no numeric field in the data model that could be sorted into a
leaderboard, and a test in `tests/invariants.test.ts` fails if one is introduced.

## Running locally

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 97 tests
npm run typecheck
npm run build        # typecheck + production build into dist/
```

## Regenerating data

Dossiers are real observations, not fixtures. Rebuilding them makes live HTTP requests.

```bash
npx tsx product/build-dossiers.ts product/validation-sample.v1.json   # research a company list
npx tsx product/build-dossiers.ts example.com                         # or a single domain
npx tsx product/build-dossiers.ts --jobs example.com                  # + read the company's vacancies
npm run data:site                                                     # split into public/data/
npm run audit:bias                                                    # publication-bias diagnostic
```

`product/build-site-data.ts` writes `public/data/index.json` (a light row per account, used by
the list screens) and `public/data/dossiers/<domain>.json` (fetched only when an account is
opened).

## Layout

```
src/evidence/     collection: partner surfaces, positioning, CRM artifacts, PRM fingerprints
src/category/     what a company SELLS, read only from identity surfaces
src/dossier/      the dossier model, dedup, attribution, surfaces, programmes, directory
src/pipeline/     per-company orchestration
src/temporal/     snapshots and change detection
src/jobs/         job-posting enrichment: ATS ownership, semantic CRM levels, operational facts
app/              the web application (routes, components, design tokens)
product/          data builders, holdout runners, audits
tests/            unit tests plus executable product invariants
docs/             validation reports
```

## Known limitations

These are measured, not estimated, and the app publishes them on its own Data health page.

| | |
|---|---|
| Category classifier | Caught 8 of 14 partner-tech vendors across two frozen holdouts. Advisory only — a meaningful share reach a seller unflagged. |
| CRM detection | Found 2 of 6 companies that provably run a supported CRM. Salesforce was never detected once. |
| Public person evidence | 2 of 18 companies. Not viable; the pipeline does not attempt it. |
| Temporal | Baseline only. Change detection has a 0% false-positive floor but needs elapsed calendar time. |
| Client-side rendering | A partner page that renders in JavaScript reads as empty. |
| Job enrichment | A supported ATS board was attributable for 13 of 59 companies (22%). Where a board was readable, CRM evidence was established for 4 of 13. |
| Fundamental | The system reads partner web *pages*, not partner *programmes*. A dormant programme keeps its marketing page. |

Human review decisions are stored in `localStorage` only. There is no backend and no CRM
write-back.

## Reports

- `docs/PRODUCT_VALIDATION_REPORT.md` — what was measured, what may and may not be claimed
- `docs/FINAL_HARDENING_REPORT.md` — why ranking was abandoned
- `docs/DEPLOYMENT_AND_DEMO.md` — deployment and the recommended demo path
