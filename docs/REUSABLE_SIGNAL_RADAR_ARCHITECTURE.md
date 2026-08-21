# Reusable Signal Radar — Architecture, Evidence and Operations Handoff

**Status:** documentation only. Nothing in this file changes the running BOND
application. It describes the repository as it actually exists at commit
`2714754` (tag lineage ending at `v7-verified-queue`), inspected file by file.

**Audience:** a Claude Code session with no access to the conversation that
built this. Read this document first, then inspect the repository, then stop and
plan. Do not start building a second radar from memory of what this one does.

**The single most important instruction in this document:** the BOND
implementation is a *reference implementation*, not a template and not a
universal truth. Its architecture is largely reusable. Its conclusions,
personas, weights, signals, verified facts and queue are not. Section 3 and
Section 20 exist to keep those apart.

Throughout, two labels are used and never blurred:

- **CURRENT IMPLEMENTATION** — what the code does today. Verifiable by reading
  the cited file.
- **RECOMMENDED FUTURE ARCHITECTURE** — a proposal. Not built. Not implied to
  exist.

---

## Table of contents

1. [Executive architecture overview](#1-executive-architecture-overview)
2. [Actual repository map](#2-actual-repository-map)
3. [Reusable vs company-specific matrix](#3-reusable-vs-company-specific-matrix)
4. [Data model](#4-data-model)
5. [Verified facts architecture](#5-verified-facts-architecture)
6. [Source trust model](#6-source-trust-model)
7. [Signal architecture](#7-signal-architecture)
8. [Person discovery](#8-person-discovery)
9. [Targeting Thesis architecture](#9-targeting-thesis-architecture)
10. [Scoring architecture](#10-scoring-architecture)
11. [Commercial review layer](#11-commercial-review-layer)
12. [Final GTM Queue](#12-final-gtm-queue)
13. [Product environment module](#13-product-environment-module)
14. [First-party language](#14-first-party-language--in-their-words)
15. [Failure modes learned](#15-failure-modes-learned)
16. [Test architecture](#16-test-architecture)
17. [UI / UX architecture](#17-ui--ux-architecture)
18. [Deployment architecture](#18-deployment-architecture)
19. [New-company bootstrap process](#19-new-company-bootstrap-process)
20. [Clean-room / contamination checklist](#20-clean-room--contamination-checklist)
21. [Ideal future template architecture](#21-ideal-future-template-architecture)
22. [Exact execution / command map](#22-exact-execution--command-map)
23. [Configuration, environment, secrets](#23-configuration-environment-secrets)
24. [Source adapter catalogue](#24-source-adapter-catalogue)
25. [Data lineage / reproducibility](#25-data-lineage--reproducibility)
26. [Identity resolution / deduplication](#26-identity-resolution--deduplication)
27. [Manual verification workflow](#27-manual-verification-workflow)
28. [Freshness / staleness policy](#28-freshness--staleness-policy)
29. [Failure / recovery runbook](#29-failure--recovery-runbook)
30. [Performance / scale characteristics](#30-performance--scale-characteristics)
31. [Versioning / instance isolation](#31-versioning--instance-isolation)
32. [Security / privacy / data boundaries](#32-security--privacy--data-boundaries)
33. [Architectural invariants](#33-architectural-invariants)
34. [Known architectural debt](#34-known-architectural-debt--limitations)
35. [What not to abstract yet](#35-what-not-to-abstract-yet)
36. [Radar #2 learning loop](#36-radar-2-learning-loop)
37. [Final self-audit](#37-final-self-audit)
38. [Starting a new Signal Radar from this architecture](#starting-a-new-signal-radar-from-this-architecture)

---

## 1. Executive architecture overview

### What a Signal Radar actually is

A Signal Radar is a **research and qualification instrument**, not a lead list
and not a scoring product. It answers one question end to end:

> Given only public information, which specific people inside which specific
> companies are plausibly worth a conversation about this product *right now*,
> and can every claim we would make about them be traced back to a source?

Three things follow from that framing, and they are the architectural spine of
the whole system:

1. **Discovery is allowed to be wrong.** Its job is recall, not precision. A
   noisy candidate universe is a feature; a noisy *queue* is a defect.
2. **The model decides what surfaces for review. A human decides what ships.**
   These are different authorities and they are stored in different files.
3. **Evidence quality is a first-class field, not a footnote.** Every displayed
   claim carries what established it, when, and how strongly.

The commercial value is not the ranking. It is that a seller can open one
account and, in sixty seconds, know what is observed, what is inferred, what is
unknown, and what would embarrass them if it were wrong.

### The conceptual flow, and where the implementation actually differs

The requested conceptual flow, annotated with what the repository really does:

```text
PUBLIC SOURCES              ← src/discovery/registry.ts (37 registered, 7 enabled)
   ↓
COMPANY DISCOVERY           ← scripts/discover.ts  (YC + Getro boards)
   ↓
PERSON DISCOVERY            ← ** NOT A SEPARATE STAGE **  (see below)
   ↓
SIGNAL DETECTION            ← scripts/enrich.ts → src/data/deriveSignals.ts
   ↓
ENVIRONMENT EVIDENCE        ← src/enrichment/stackExtraction.ts
   ↓
RAW PROSPECT UNIVERSE       ← data/verified/prospects.json  (648 prospects)
   ↓
SCORING / RANKING           ← src/scoring/*  (pure functions, re-derived at load)
   ↓
COMMERCIAL REVIEW           ← scripts/build-commercial-review.ts (HAND-AUTHORED)
   ↓
VERIFIED FACTS              ← data/verified/verified-facts.json (** read BEFORE review, not after **)
   ↓
FINAL GTM QUEUE             ← data/verified/gtm-queue-v8.json (6 accounts)
   ↓
ACCOUNT RESEARCH BRIEF      ← src/components/AccountDrawer.tsx
   ↓
OUTREACH                    ← ** NOT IMPLEMENTED **  (no sending, no CRM, no tracking)
```

Four honest deviations from the conceptual diagram:

**A. Person discovery is not an independent stage.** People arrive as
`PersonCandidate[]` attached to a discovered company (`src/discovery/types.ts`),
sourced from the same company-discovery crawl. There is no person-first source.
This single design decision produced the largest failure in the project — see
§8 and §15.2.

**B. Verified facts are an *input* to the review, not a correction applied
after it.** `scripts/build-commercial-review.ts:29` reads
`verified-facts.json` at the top of the run and consults it while assembling
each record (line ~538 onward). The conceptual "correct afterwards" ordering is
not what the code does. The effect is the same — verified beats raw — but a
future implementation should know the mechanism is *precedence at assembly
time*, not a patch pass.

**C. The commercial review is hand-authored TypeScript, not a derived
artifact.** `scripts/build-commercial-review.ts` contains a ~480-line
`AUTHORED` array of literal records. The script's job is to *merge* human
judgment with machine facts (job counts, model diagnostics, ATS trust) and emit
JSON. There is no automated path from prospect to queue record.

**D. There is no outreach layer at all.** No email, no sequencing, no CRM
write-back, no reply tracking. `src/data/firstParty.ts` defines the *contract*
for importing relationship data that does not exist yet.

### Layer contracts

For each layer: purpose, input, output, authority, and — most importantly —
what it does **not** prove.

| Layer | Purpose | Input | Output | Authority | Does NOT prove |
| --- | --- | --- | --- | --- | --- |
| **Source registry** | Declare which channels exist and whether an adapter is built | none (static) | `SOURCE_REGISTRY` | Declares intent + implementation status. `enabled:false` is honest, not aspirational | That a listed source is appropriate for any given radar |
| **Company discovery** | Recall. Find candidate companies cheaply | Registry, sitemaps, JSON mirrors | `raw-candidates.json`, `discovered-companies.json` | Discovery-only. Being found by a prestigious VC board scores **zero** | That the company is a fit, is real, or is correctly identified |
| **Person discovery** | Attach candidate people to companies | Company pages / YC profiles | `PersonCandidate[]` on each candidate | Discovery-only | That the person still holds the role, or that the title means what it says |
| **Signal detection** | Turn jobs/funding/events into dated triggers | Jobs, funding, company facts | `Signal[]` on the company | Observation with a date | Pain. Intent. Urgency. Budget |
| **Environment evidence** | Record what tooling can be observed | Job bodies, company pages | `EnvironmentEvidence[]` | Observation with an internal-use classification | Internal use, unless `internalUse` says so at usable confidence |
| **Raw prospect universe** | The auditable candidate set | All the above | `prospects.json` (648) | Complete record of what was seen | Anything commercial |
| **Scoring / ranking** | Order candidates for *review* | Person + company facts + `now` | `ProspectScore`, `Priority` | Deterministic heuristic. A research prioritiser | Commercial truth. Conversion. Fit |
| **Commercial review** | Decide what a seller can honestly say | Prospects + verified facts + human judgment | `commercial-review-v8.json` (10 records) | **Highest authority for presentation** | That the account will buy |
| **Verified facts** | Human corrections that outrank stale/absent discovery | Manual verification | `verified-facts.json` | Wins over raw discovery for presentation | That the raw observation was fabricated — raw is preserved |
| **GTM Queue** | The accounts worth someone's time now | Reviewed records passing all gates | `gtm-queue-v8.json` (6) | The shipped commercial output | A proven opportunity |
| **Account brief** | Make the evidence inspectable in 60s | Queue entry | Rendered drawer | Presentation | — |

### The distinctions that must survive into any future radar

These are architectural principles. They are enforced in code and tests in this
repository, and they are **not** BOND-specific copy.

```text
MODEL DISCOVERY            ≠  VERIFIED FACT
MODEL SCORE                ≠  COMMERCIAL QUALIFICATION
PUBLIC SIGNAL              ≠  PAIN
PUBLIC SIGNAL              ≠  BUYING INTENT
PUBLIC TOOL MENTION        ≠  CONFIRMED INTERNAL USAGE
QUEUE INCLUSION            ≠  PROVEN OPPORTUNITY
ABSENCE OF PUBLIC EVIDENCE ≠  EVIDENCE OF ABSENCE
SOURCE INABILITY           ≠  NEGATIVE EVIDENCE
EVENT DATE                 ≠  RETRIEVAL DATE
TITLE                      ≠  REMIT
VACANCY                    ≠  EMPTY SEAT
VACANCY                    ≠  BACKFILL
```

Where each is enforced today:

| Principle | Enforced by |
| --- | --- |
| Model score ≠ commercial truth | `src/review/commercial.ts` `compareQueueRecords` ignores scores entirely; `modelDiagnostics` is a separate optional field rendered last in the drawer |
| Absence ≠ absence of the thing | `src/scoring/eligibility.ts` — `contradicted` requires *positive* contrary evidence; `tests/phase8Queue.test.ts` "never phrases an unknown as an absence" |
| Tool mention ≠ internal use | `src/enrichment/stackExtraction.ts` conservative classification; `src/scoring/environmentFit.ts` `isScorable` refuses `proxy_only` and `low_proxy` |
| Vacancy ≠ hire | `cos_possible_hire` scores 12, not 40 (`src/scoring/timing.ts`); `new_cos` requires manual confirmation |
| Signal ≠ intent | The dimension is deliberately named **Timing**, not Intent (`src/scoring/timing.ts` header) |
| Raw preserved under correction | ATS contamination *quarantines*, never deletes (`src/enrichment/atsTrust.ts`) |

---

## 2. Actual repository map

Top level (tracked files only; `node_modules`, `dist`, `.cache`, `.vercel`,
`.env*` and `public/data` are gitignored):

```text
bond-signal-radar/
├── index.html                 Vite entry. Sets <meta name="robots" content="noindex, nofollow">
├── package.json               Scripts + deps. NO "engines" field (see §22)
├── vite.config.ts             react + tailwind plugins, base: './'
├── vitest.config.ts           environment: 'node'; jsdom opted into per-file
├── vercel.json                framework vite, build npm run build, X-Robots-Tag header
├── .vercelignore              excludes node_modules, dist, .cache, .git, .vercel, docs
├── .gitignore                 excludes public/data, .cache/, .vercel, .env*
├── tsconfig.json / .app / .node / .components      four-project build
├── src/                       80 tracked files
├── scripts/                   22 tracked files
├── tests/                     30 tracked files (618 tests)
├── data/                      26 tracked files
├── docs/                      5 tracked files
├── public/louis-engelen.png   creator portrait (public/data/ is generated)
└── *.md                       9 phase reports + README
```

### `src/` — application and engine

| Path | Purpose | Reusable? | Reset for new company? |
| --- | --- | --- | --- |
| `src/types/radar.ts` | **The core data model.** Every entity type, every enum. ~700 lines | **Engine.** Structure is generic | Enum *members* are BOND-specific (`SignalType`, `PainTheme`, `PersonaType`) |
| `src/scoring/` (15 files) | Pure scoring functions. `index.ts` orchestrates `scoreProspect(person, company, now)` | **Mechanism generic, every weight BOND-specific** | Weights, persona bands, signal values — all |
| `src/scoring/personas.ts` | Title → persona classification, ~340 lines of regex | Mechanism generic | Every pattern list |
| `src/discovery/` | Source registry, candidate types, dedupe, cheap screen, source health | **Highly reusable.** `dedupe.ts` is fully generic | Registry contents; `passesCheapScreen` heuristics |
| `src/discovery/sources/` | `ycombinator.ts`, `getroBoard.ts` — the only two implemented crawlers | Adapters reusable if the source suits the new radar | Choice of sources |
| `src/data/ats/` (12 files) | ATS detection, resolution, dispatch, 7 provider adapters, normalisation | **Fully reusable.** Nothing BOND-specific | Nothing |
| `src/data/deriveSignals.ts` | Jobs + facts → `Signal[]` | Mechanism generic | Which signals exist |
| `src/data/loadRadar.ts` | Fetches `prospects.json`, **re-derives every score at load** | **Fully reusable** | Nothing |
| `src/data/loadQueueV8.ts` | Fetches the queue; missing file degrades gracefully to discovery views | **Fully reusable** | Nothing |
| `src/data/firstParty.ts` | Contract for authorised first-party relationship import. **Not wired to anything** | **Fully reusable** | Nothing |
| `src/enrichment/atsTrust.ts` | Board trust + per-job ownership + quarantine | **Fully reusable and high value** | Nothing |
| `src/enrichment/stackExtraction.ts` | Tool detection + internal-use classification from text | **Mechanism reusable**; `TOOL_DEFINITIONS` is product-specific | The tool list and `bondRelevant` flags |
| `src/enrichment/companyPages.ts` | Company page fetch/parse | Reusable | Nothing |
| `src/enrichment/buildProspect.ts` | Assembles a scored prospect | Reusable structure | Nothing |
| `src/review/commercial.ts` | Phase-8 review types, `compareQueueRecords`, `queueBlockers` | **Fully reusable. The single most valuable file to copy** | Nothing structural |
| `src/review/types.ts` | Earlier (Phase 7) review + shortlist types | Reusable | Nothing |
| `src/review/validate.ts` | Review-layer validation | Reusable | Nothing |
| `src/validation/` | Dataset schema validation + per-prospect data quality | **Fully reusable** | Field-specific rules |
| `src/components/` (21 files) | The entire UI | **Interaction patterns reusable; all copy company-specific** | Every label and description |
| `src/content/targetingThesis.ts` | The whole thesis as structured data (~450 lines) | **Structure reusable; content 100% BOND** | **Delete entirely** |
| `src/config/creator.ts` | Portrait, name, blurb | Reusable shape | **Personal — reset** |
| `src/utils/` | dates, filtering, sorting, format | **Fully reusable** | Filter *options* |

### `scripts/` — the operational pipeline

| Script | npm alias | Reads | Writes | Idempotent? | Mutates raw? |
| --- | --- | --- | --- | --- | --- |
| `discover.ts` | `discover` | registry, live sitemaps | `data/discovery/{raw-candidates,discovered-companies,source-registry,source-state}.json` | Yes (network-dependent) | **Yes — overwrites raw** |
| `enrich.ts` | `enrich` | discovered companies, live ATS | `data/verified/{companies,people,prospects,metadata,manual-enrichment}.json` | Yes | **Yes — rewrites the universe** |
| `refresh-data.ts` | `refresh-data` | seeds | same four verified files | Yes | **Yes** |
| `audit-ats.ts` | `audit-ats` | `prospects.json`, live boards | `prospects.json`, `ats-audit.json` | **Yes — clears stale quarantine flags first** | Modifies in place (quarantine only, never deletes) |
| `ingest-funding.ts` | `ingest-funding` | hardcoded verified events | `prospects.json` | Yes | Adds funding events |
| `refresh-phase8.ts` | `refresh-phase8` | `prospects.json` | `prospects.json` | Yes | Re-derives from same pure functions |
| `build-commercial-review.ts` | `build-review-v8` | `prospects.json`, **`verified-facts.json`**, `AUTHORED` array | `commercial-review-v8.json`, `gtm-queue-v8.json` | Yes | No — read-only on raw |
| `validate-queue.ts` | `validate-queue` | review + queue + prospects | nothing | Yes | No |
| `validate-data.ts` | `validate-data` | prospects, review, shortlist | nothing | Yes | No |
| `export-queue.ts` | `export-queue` | `gtm-queue-v8.json` | `gtm-queue-export.json` | Yes | No |
| `sync-data.ts` | `sync-data` | `data/verified/` (falls back to `data/fixtures/`) | `public/data/` | Yes | No |
| `research-pool.ts`, `build-review.ts`, `audit-alpha.ts`, `report-*.ts` | `review`, `audit`, `report-alpha` | various | review/shortlist/report files | Yes | No |
| `generate-seed.ts` | `seed` | `scripts/fixtures/demo-universe.ts` | `data/fixtures/*` | Yes | Fixtures only |
| `fix-hive-record.ts` | — | — | — | **One-off historical repair. Do not copy** | — |

### `data/` — three tiers, deliberately separate

```text
data/
├── fixtures/       Invented demo universe. Never overwritten by a real run.
│                   Used as fallback so the app boots before any discovery.
├── discovery/      RAW. raw-candidates (700KB), discovered-companies (698KB),
│                   source-registry, source-state, pool-research.
└── verified/       The served dataset AND the review layer:
    ├── prospects.json          9.2 MB · 648 prospects · datasetMode "real_alpha"
    ├── companies.json          2.5 MB
    ├── people.json             751 KB
    ├── metadata.json           counts + generatedAt + datasetMode
    ├── verified-facts.json     3 KB  ← human corrections (§5)
    ├── commercial-review-v8.json  64 KB · 10 reviewed records
    ├── gtm-queue-v8.json       46 KB · 6 queued accounts
    ├── gtm-queue-export.json   66 KB · flat machine-readable export
    ├── ats-audit.json          board trust audit output
    ├── persona-audit.json      persona reclassification audit
    ├── shortlist.json / commercial-review.json / top10-review.json
    │                           Phase 7 predecessors, retained for audit
    └── manual-enrichment.json  human-validated enrichment layer
```

**Note the naming trap:** `data/verified/` holds the *real dataset* (as opposed
to fixtures). It does **not** mean every fact in it is human-verified. Only
`verified-facts.json` carries that meaning. A future radar should rename these
(`data/live/` + `data/human-verified/`) — see §21.

### `tests/` — 30 files, 618 tests

Split by concern in §16. Note `tests/helpers.ts` and the four `.tsx` suites
which carry a `@vitest-environment jsdom` docblock (Vitest 4 removed
`environmentMatchGlobs`).

### `docs/`

| File | Note |
| --- | --- |
| `BOND_SIGNAL_RADAR_SPEC.md` | The original build spec. Section numbers (§7, §87, §90…) referenced throughout the code comments |
| `TARGETING_THESIS.md` | The thesis in markdown |
| `BOND_Targeting_Thesis_Source_of_Truth.docx` | Human-authored source document |
| `BOND_REVIEW_EXPORT.md` | Human-readable queue export |
| `Scanner voor BondApp.pdf` | Reference material |
| `REUSABLE_SIGNAL_RADAR_ARCHITECTURE.md` | **This file** |

`docs/` is excluded from the Vercel upload via `.vercelignore` — it is private
working material, not shipped.

### Root reports (tracked, not shipped)

`README.md`, `PHASE_8_COMMERCIAL_TRUTH_REPORT.md`, `POST_ALPHA_FINDINGS.md`,
`REAL_DATA_ALPHA_REPORT.md`, `SHORTLIST_REPORT.md`, `SOURCE_BIAS_REPORT.md`,
`USER_FIT_AUDIT.md`, `SLACK_QUALIFICATION_REPORT.md`,
`FEATURE_VARIANCE_REPORT.md`, `COMMERCIAL_GTM_REPORT.md`,
`CLAUDE_CODE_BUILD_PROMPT.txt`.

These are the **best evidence of what actually went wrong** and are the primary
source for §15. A future agent should read `POST_ALPHA_FINDINGS.md` and
`PHASE_8_COMMERCIAL_TRUTH_REPORT.md` in full before designing Radar #2's
discovery layer.

---

## 3. Reusable vs company-specific matrix

### A. REUSABLE ENGINE — copy structure, keep behaviour

| Mechanism | Files | Why it generalises |
| --- | --- | --- |
| **Source provenance** | `Source` type in `types/radar.ts`; `ReviewSource` in `review/commercial.ts` | Every claim carries `url`, `retrievedAt`, `authority`, and `establishes` (what this source proves — not what we wish it proved) |
| **Source authority tiers** | `SourceAuthority` = primary / high_quality_secondary / discovery_only | A discovery-only source may surface a candidate but never carries a score-driving claim |
| **Evidence classification** | `EvidenceType` (observed/inferred/hypothesis), `EvidenceStrength`, `InternalUseStatus`, `VerificationState` | Universal epistemics |
| **Verified-facts precedence** | `verified-facts.json` + read at `build-commercial-review.ts:29` | Any radar hits stale public data |
| **Commercial review layer** | `src/review/commercial.ts` — types, `compareQueueRecords`, `queueBlockers` | The separation of model output from shippable judgment is the core idea |
| **Queue blockers** | `queueBlockers()` | Release gate as code, not as discipline |
| **ATS trust + job ownership** | `src/enrichment/atsTrust.ts` | Any radar using ATS data will hit marketplaces and identifier collisions |
| **ATS adapters** | `src/data/ats/*` (7 providers) | Vendor APIs, nothing product-specific |
| **Identity resolution** | `src/discovery/dedupe.ts` — `canonicalDomain`, `companyKey`, `personKey` | Fully generic |
| **Score re-derivation at load** | `hydrateDataset()` in `loadRadar.ts` | Stored scores are a snapshot; deriving again means staleness surfaces immediately |
| **Graceful degradation** | `loadQueue()` returns `null` on any failure | A missing review layer hides the queue rather than erroring |
| **Validation as a gate** | `validate-data.ts`, `validate-queue.ts`, both `process.exitCode = 1` | Errors block, warnings inform |
| **Account drawer as research brief** | `AccountDrawer.tsx` section ordering + `EvidenceClassChip` | The interaction pattern is the product |
| **Responsive card/table swap** | `md:hidden` cards + `hidden md:block` tables in `QueueTable`, `ProspectTable`, `ProspectCards` | Generic |
| **Test architecture** | Data-integrity tests that run against the *shipped dataset*, not fixtures | Catches drift between code and data |
| **Deployment flow** | Static Vite + `prebuild` data sync + git-linked Vercel | No backend, no runtime dependency on a developer machine |
| **Data lineage** | `sourceIds` on evidence/signals; `sources[]` on companies and review records | Every displayed fact resolvable to a URL |
| **Confidence + caveat handling** | `caveats[]`, `openQuestions[]`, `VerificationState` per dimension | Uncertainty is displayed, not hidden |

### B. COMPANY-SPECIFIC CONFIGURATION AND LOGIC — rebuild from zero

| Thing | Where it lives | Why it cannot transfer |
| --- | --- | --- |
| Target product definition | `src/content/targetingThesis.ts` `BOND_BASIS` | Different product, different everything |
| ICP | `TARGETING_THESIS.md` §02, §03 | — |
| Personas + hierarchy | `PersonaType` enum, `personas.ts` patterns, `PERSONA_TIERS` | "Chief of Staff is Tier 1" is a BOND conclusion |
| Anti-personas | `ANTI_PERSONA_PATTERNS` in `personas.ts` | — |
| Geography assumptions | `Region` type, `GEOGRAPHY` in thesis content | — |
| Size assumptions | `EmployeeBand`; the deliberate *absence* of a size gate | BOND concluded size is context, not a gate. Another product may legitimately have a hard size ICP |
| Trigger hierarchy | `SignalType` enum, `selectKeySignal()`, `WHY_NOW` tiers | `cos_hiring` is meaningless for most products |
| Signal interpretation | `whyNow.ts`, `whyThisPerson.ts` | Generated commercial language |
| Product-environment requirements | `TOOL_DEFINITIONS`, `bondRelevant` flags, the whole Slack eligibility gate | Slack matters to BOND. It may be irrelevant elsewhere |
| Observability assumptions | `SIGNAL_MATRIX`, `PERSON_MATRIX` in thesis content | — |
| Scoring weights | `USER_FIT_MAX`, `ENVIRONMENT_MAX`, `TIMING_MAX`, `BASE_FIT_WEIGHTS`, `QUEUE_SCORE_WEIGHTS`, every threshold in `priority.ts` | Never inherit without justification |
| Qualification logic | `eligibility.ts` Slack gate | — |
| Routing logic | `channel.ts`, `RelationshipState` ordering | — |
| First-party language | `firstPartyLanguage` values in `AUTHORED` | Quotes belong to specific companies |
| Outreach logic | `suggestedWayIn` in every authored record | — |
| Targeting Thesis | `src/content/targetingThesis.ts` + `docs/TARGETING_THESIS.md` | — |

### C. MUST BE DELETED / RESET / REBUILT

Found by inspection, not assumption. This list is **not** exhaustive — run the
§20 checklist.

**Data files — delete all contents, keep the shapes:**

- `data/verified/verified-facts.json` — insify.com, abacum.ai, mytos.bio, overview.ai facts
- `data/verified/commercial-review-v8.json` — 10 BOND-reviewed accounts
- `data/verified/gtm-queue-v8.json` — Insify, Abacum, Encord, Ashby, Overview, Mytos
- `data/verified/gtm-queue-export.json`
- `data/verified/{prospects,companies,people,metadata}.json` — 648 BOND prospects
- `data/verified/{shortlist,commercial-review,top10-review,persona-audit,ats-audit,manual-enrichment}.json`
- `data/discovery/*` — the raw YC/Getro universe
- `data/fixtures/*` — invented BOND-shaped demo universe

**Code carrying BOND judgment:**

- `scripts/build-commercial-review.ts` — the entire `AUTHORED` array (lines 53–531) **plus** the hardcoded `REVIEWED_AT = '2026-08-20'` and the stopping-rule prose
- `scripts/ingest-funding.ts` — hardcoded verified funding events for BOND targets
- `scripts/fix-hive-record.ts` — a one-off repair for one BOND company
- `src/content/targetingThesis.ts` — entire file
- `src/config/creator.ts` — personal attribution
- `src/scoring/personas.ts` — all pattern lists (keep the precedence *mechanism*)
- `src/scoring/eligibility.ts` — the Slack gate as a concept
- `src/enrichment/stackExtraction.ts` — `TOOL_DEFINITIONS` and `bondRelevant`
- `src/types/radar.ts` — `SignalType`, `PainTheme`, `PersonaType`, `RelationshipState` members (`public_bond_engagement` is literally BOND-named)
- `src/data/firstParty.ts` — comments reference BOND; the contract itself is generic

**Tests that assert BOND conclusions — must be deleted, not adapted:**

- `tests/finalQueue.test.ts` (50) — names Insify, Abacum, Encord, Ashby, Overview, Mytos and their specific facts
- `tests/phase8Queue.test.ts` (30) — **mixed.** Generic invariants + BOND-specific assertions. Split carefully
- `tests/phase8Persona.test.ts` (5) — BOND persona conclusions
- `tests/targetingThesis.test.tsx` (36) — BOND thesis content
- `tests/detailDiscoverability.test.tsx`, `tests/presentation.test.tsx`, `tests/mobilePresentation.test.tsx` — mixed: generic interaction assertions plus BOND copy
- `tests/copy.test.ts`, `tests/userFit.test.ts`, `tests/timing.test.ts`, `tests/environmentFit.test.ts`, `tests/eligibility.test.ts` — assert BOND weights and thresholds

**Deployment identity:**

- `.vercel/project.json` — `projectId prj_Cvu3qISFf8rZfyTDVEqkGSvakeO5`, `orgId team_qHso1YtA1IMm3sYTEOcGLVih` (gitignored, but present locally)
- GitHub remote `louisengelen3-cyber/bond-signal-radar`
- Production URL `bond-signal-radar.vercel.app`
- All 13 release tags
- `public/louis-engelen.png`
- `index.html` `<title>` and `<meta name="description">`
- `package.json` `name` and `description`

---

## 4. Data model

All types live in `src/types/radar.ts` (raw layer) and
`src/review/commercial.ts` (commercial layer). This split is deliberate and
worth preserving: **the raw model has no opinion about what ships.**

### Core entities

#### `Company` — `src/types/radar.ts`

| Field group | Fields | Notes |
| --- | --- | --- |
| Identity | `id`, `name`, `domain`, `description` | `id` is derived from the canonical domain (dots → dashes) |
| Location | `city`, `country`, `region`, `locations[]`, `distributed`, `locationSourceId` | `locations` is **advertised job locations**, not offices (see §15.11) |
| Size | `employeeCount`, `employeeBand`, `employeeCountAsOf`, `employeeSourceId`, `headcount?: HeadcountEstimate` | Two representations coexist: the legacy scalar and the provenance-carrying estimate |
| Hiring | `careersUrl`, `ats?: AtsConfig`, `atsTrust?: AtsTrust`, `jobs: JobOpening[]` | |
| Evidence | `environmentEvidence[]`, `fundingEvents[]`, `signals[]`, `sources[]` | |
| Relationship | `relationship?: Relationship` | Account-level first-party state |
| Lifecycle | `firstSeenAt`, `lastCheckedAt`, `isDemoFixture?` | |

**Created by:** `scripts/enrich.ts`. **Consumed by:** all of `src/scoring`, the
review builder, the UI. **Authoritative for:** what was observed about the
company at `lastCheckedAt`. **Not authoritative for:** anything commercial.

#### `Person` — `src/types/radar.ts`

`id`, `name?` (**optional — never invented**), `title`, `personaType`,
`founderStatus?`, `companyId`, `sourceIds[]`, three evidence arrays
(`scopeEvidence`, `burdenEvidence`, `leadershipEvidence`), `painEvidence?`,
`relationship?`, `suggestedAngle?`, `firstSeenAt`, `lastCheckedAt`.

Two design decisions to carry forward:

1. **`name` is optional.** A verified role with an unverified individual is a
   legitimate record. `USER_FIT_CAPS.unnamedPerson = 65` caps the score rather
   than inventing a person.
2. **`founderStatus` is an attribute, never a remit.** A co-founder who runs
   engineering is an engineering executive who also founded the company. Both
   facts are true; neither overwrites the other. This was a real bug fix (§15.3).

#### `Signal` — `src/types/radar.ts`

`id`, `type: SignalType`, **`eventDate?`**, **`detectedAt`**, `expiresAt?`,
`closedAt?`, `sourceIds[]`, `metadata?`, **`quarantined?`**.

The `eventDate` / `detectedAt` split is the architectural heart of the recency
model. They are never interchangeable (§25).

`quarantined` is set by the ATS audit when the underlying job failed the
ownership check. The signal stays in the record for audit and contributes zero
to Timing.

#### `Source` — `src/types/radar.ts`

`id`, `label`, `url`, `publisher?`, `publishedAt?`, **`retrievedAt`** (required),
`authority: SourceAuthority`, `unavailable?`, `unavailableSince?`.

`unavailable` is how the system records *a source we used has since
disappeared* without deleting the claim it supported.

#### `EnvironmentEvidence` — `src/types/radar.ts`

`tool?`, `category: EnvironmentCategory`, `sourceId`, `observedAt`,
`evidenceType: StackEvidenceType` (11 members: job_description, handbook,
security_page, company_statement, engineering_blog, documentation, case_study,
integration_page, marketplace_listing, tech_database, mx_record),
`confidence: EvidenceStrength` (high / medium / low_proxy),
`internalUse: InternalUseStatus` (internal / implied / proxy_only /
contradicted / unknown), `bondRelevant: boolean`, `quote?`.

**The two-axis design is the key reusable idea:** *how strong is the evidence*
and *what does it establish* are separate questions. An integrations page can be
a perfectly reliable observation (`confidence: high`) that establishes nothing
about internal use (`internalUse: proxy_only`).

#### `HeadcountEstimate` and `FundingEvent`

Both carry `sourceTier` / `confidence` and, critically, keep **conflicts rather
than resolving them**: `HeadcountEstimate.readings[]` retains every credible
value; `FundingEvent.conflictNote` records disagreement. The system displays a
range and refuses to quote a derived ratio rather than picking whichever number
produces a nicer ICP fit.

#### `ProspectScore` and `Prospect`

`Prospect` = `{ id, person, company, eligibility, score, priority, route,
keySignal, whyThisPerson?, whyNow?, landPersona, suggestedExpansion?,
dataQuality }`.

**No stored score is ever trusted.** `hydrateDataset()` recomputes the entire
`ProspectScore` from `(person, company, now)` at page load.

### Commercial layer — `src/review/commercial.ts`

#### `CommercialReviewRecord`

The record a seller actually reads. ~45 fields. Field groups:

| Group | Fields |
| --- | --- |
| Identity | `accountId`, `companyName`, `domain`, `aliases?`, `companyIdentityStatus`, `identityConflict?` |
| Verdict | `accountVerdict`, `motion`, `reviewedAt` |
| Person | `primaryPersonName?`, `primaryPersonTitle?`, `primaryPersonPersona?`, `primaryPersonIsFounder?`, `primaryPersonProspectId?`, `roleCurrencyStatus`, `roleCurrencySourceUrl?`, **`roleCurrencyVerifiedBy?`** |
| Narrative | `whyThisAccount?`, `whyThisPerson?`, `whyNow?`, `suggestedWayIn?`, `wayInSourceUrls?` |
| Quote | `firstPartyLanguage?` (§14) |
| Evidence | `triggers[]`, `headcount?`, `hiring?`, `fundingContext?`, `atsTrust?`, `productEnvironment` |
| Honesty | `secondaryContacts[]`, `caveats[]`, `openQuestions[]`, `sources[]` |
| Provenance | **`discoveryOrigin?: 'discovered' \| 'not_discovered'`** |
| Diagnostics | `modelDiagnostics?` — optional, rendered last |

Two fields deserve special attention as reusable inventions:

- **`roleCurrencyVerifiedBy`** — how a role was verified when no linkable URL
  exists. Recording *"manual_public_announcement"* honestly beats inventing a
  URL that does not support the claim. `validate-queue.ts` accepts either a URL
  or this field, and warns when only the latter is present.
- **`discoveryOrigin`** — marks an account added at the verified layer that was
  never in the discovered universe (Insify). Without it, a hand-added account
  would silently imply the pipeline found it.

#### `VerificationState` — the confidence vocabulary

`verified | supported | uncertain | conflicting | unknown`, applied
**per dimension** (identity, role currency, headcount) and never collapsed into
a single percentage. This is one of the most transferable ideas in the system.

#### `AccountVerdict` and the queue gate

`hot | promising | watch | diagnostic_false_positive | exclude | needs_research`.

`QUEUE_VERDICTS = ['hot', 'promising']`. Everything else is retained in
`notInQueue[]` with a reason — rejected candidates stay auditable.

`diagnostic_false_positive` is a valuable category: an account the model ranked
highly that a human determined was a *model artifact*. Keeping these visible is
how the model gets criticised rather than quietly patched.

### Precedence — exactly as implemented

The conceptual rule is:

```text
raw discovery  <  verified correction  <  commercial presentation
```

The actual implementation, in `scripts/build-commercial-review.ts`:

```ts
// line 22 — raw
const ds = JSON.parse(readFileSync(verified('prospects.json'), 'utf8'))
// line 29 — human corrections
const facts = JSON.parse(readFileSync(verified('verified-facts.json'), 'utf8'))

// ~line 537, per account
const discovered = companyOf(authored.domain)          // raw
const verifiedAccount = facts.accounts?.[authored.domain]  // verified
if (!discovered && !verifiedAccount) continue          // neither → skip

const company = discovered ?? { /* synthesised from verifiedAccount */ }

// verified counts win where they exist
const openRoles = verifiedAccount?.openRoles ?? open.length
const locations = verifiedAccount?.openRoleLocations ?? discoveredLocations

// and the AUTHORED literal wins over both for every narrative field
productEnvironment: authored.productEnvironment ?? { /* derived from raw */ }
```

So precedence is implemented as a **three-level coalesce at assembly time**:

1. `authored.*` (human commercial judgment) — highest
2. `verifiedAccount.*` (human factual correction)
3. `discovered.*` (raw pipeline observation) — lowest

`prospects.json` is **never written** by the review builder. Raw survives.

**Honest limitation:** precedence is enforced by the *shape of this one script*,
not by a precedence engine. Nothing prevents a future author from writing the
coalesce backwards. See §5 and §34.

---

## 5. Verified facts architecture

### Why this layer exists

Public data is stale, incomplete, and occasionally about a different company.
The choice a radar faces is:

- **(a)** Correct the raw record → loses the audit trail, and the next pipeline
  run silently reverts the fix.
- **(b)** Present the stale fact → ships a claim that is wrong.
- **(c)** Keep both, and let the human correction win *at presentation time*.

This repository chose (c).

Real failures that forced it, all documented in
`PHASE_8_COMMERCIAL_TRUTH_REPORT.md`:

| Failure | The stale fact | The verified fact |
| --- | --- | --- |
| Stale headcount | Discovery stored 40 employees for Overview | `50+`, from Overview's own company page |
| Derived-ratio contamination | "40 roles / 40 employees = 100% hiring pressure" | Ratio withdrawn; the denominator was wrong |
| Advertised locations ≠ footprint | Job locations read as offices | 30 cities / 10 countries, company-stated |
| Departure not detected | Mytos team page listed Celso Milne as Chief of Staff | Left April 2026; now CoS at Anima |
| Vacancy misread as backfill | CoS vacancy open at Mytos | Vacancy published 2025-12-03, **predates** the April 2026 departure by ~4 months — cannot be a backfill |
| Account outside the universe | Insify was never discovered | Added verified-layer-only, flagged `discoveryOrigin: not_discovered` |
| Unscrapeable verification | LinkedIn cannot be read by this runtime | Role verified manually; provenance recorded, **no URL invented** |

### Where verified facts live

`data/verified/verified-facts.json` — 3 KB, hand-edited. Structure:

```jsonc
{
  "_notice": "Human-verified commercial facts. This layer wins over raw discovery
              for GTM Queue presentation...",
  "verifiedAt": "2026-08-20",
  "method": "Manual verification performed outside the automated pipeline,
             including public profile and announcement checks this runtime cannot reach.",

  "accounts": {
    "insify.com": {
      "_reason": "Not part of the 300-company discovery universe...",
      "discoveryOrigin": "not_discovered",
      "name": "Insify", "description": "...", "city": "Amsterdam",
      "openRoles": 15, "openRoleLocations": 1,
      "atsProvider": "lever", "atsIdentifier": "insify",
      "atsTrust": { "state": "verified_internal", "note": "..." }
    }
  },

  "people": {
    "insify.com::Niels van Zijl": {
      "title": "Chief of Staff",
      "roleCurrency": "verified",
      "verifiedBy": "manual_public_announcement",
      "note": "Insify publicly announced him as \"Chief of Staff to our CEO...\""
    },
    "mytos.bio::Celso Milne": {
      "title": "Chief of Staff, Anima",
      "formerTitle": "Chief of Staff, Mytos",
      "departedFrom": "mytos.bio",
      "tenure": "2024-07 to 2026-04",
      "roleCurrency": "verified",
      "verifiedBy": "manual_public_profile"
    }
  },

  "corrections": {
    "overview.ai": {
      "headcount": { "min": 50, "display": "50+ team members", "confidence": "verified" },
      "footprint": { "cities": 30, "countries": 10, "note": "distributed by design" },
      "supersedes": "Stored discovery headcount of 40 and the derived
                     40-roles-per-40-employees ratio, both of which were wrong.",
      "source": "https://www.overview.ai/company"
    }
  }
}
```

### The three sections, and why they are separate

| Section | Key format | Overrides |
| --- | --- | --- |
| `accounts` | canonical domain | Company-level facts; can create an account with no discovery record at all |
| `people` | `domain::Full Name` | Role, currency, tenure, departure |
| `corrections` | canonical domain | Specific stale values, **with an explicit `supersedes` string naming what was wrong** |

`supersedes` is the reusable invention here. It records not just the new value
but *what it replaces and why*, which is what makes the correction auditable
rather than a silent overwrite.

### What verified facts CAN override

- Headcount, and any ratio derived from it
- Open role counts and location counts
- Company footprint claims
- A person's title, current employer, tenure, departure
- Role currency status
- ATS trust state
- The existence of an account (may add one absent from discovery)

### What verified facts CANNOT do

- **Delete a raw observation.** `prospects.json` is never written by the review
  builder. Contaminated jobs are *quarantined*, not removed.
- **Silently rewrite history.** Every correction requires `supersedes` or a
  `note` explaining the conflict.
- **Manufacture a source URL.** Where none is reachable, `verifiedBy` records
  the method instead.
- **Suppress the conflict.** Where sources genuinely disagree (Overview's
  funding), the correct outcome is *no claim*, not a chosen claim.

### How provenance and uncertainty are retained

- `verifiedAt` + `method` at file level
- `verifiedBy` per person (`manual_public_announcement`,
  `manual_public_profile`, `manual_public_profile_and_post`)
- `source` URL per correction where one exists
- `_reason` where an account was added outside the pipeline
- The resulting review record carries `caveats[]` restating the correction in
  the UI — e.g. *"Insify was not part of the 300-company discovery universe. It
  was added at the verified layer only, and carries no model diagnostics as a
  result."*

### Is this fully enforced, or partly procedural?

**Partly procedural. Be honest about this.**

| Aspect | Enforcement |
| --- | --- |
| Raw is not overwritten | **Structural** — the review builder has no write path to `prospects.json` |
| Quarantine, not deletion | **Structural** — `atsTrust.ts` sets flags |
| Verified wins at assembly | **Procedural** — a coalesce order in one script |
| Every correction has `supersedes` | **Procedural** — no schema validates this |
| Verified facts match the corrections in the queue | **Tested** — `tests/finalQueue.test.ts` "verified-fact persistence" asserts the JSON and the queue agree |
| A verified role has a source or stated provenance | **Structural** — `validate-queue.ts` errors otherwise |

**RECOMMENDED FUTURE ARCHITECTURE:** give `verified-facts.json` a real schema
and a validator (`validate-verified-facts`), require `supersedes` on every
correction, and make precedence a function
(`resolveFact(field, raw, verified, authored)`) rather than an inline `??`
chain. Not built.

---

## 6. Source trust model

### The authority hierarchy — `SourceAuthority`

| Tier | Meaning | May carry a score-driving claim? |
| --- | --- | --- |
| `primary` | Company-controlled, or the company's own ATS API | Yes |
| `high_quality_secondary` | Reputable reporting | Yes, with the tier recorded |
| `discovery_only` | Portfolio pages, aggregators, unofficial mirrors | **No.** Surfaces a candidate; never supports a claim |

Comment in `src/discovery/registry.ts`: *"Being backed by a prestigious investor
contributes exactly zero points to any score — a portfolio page is a way to find
a company, never a reason to rank it higher."*

### Funding source tiers — `FundingSourceTier`

`company_official > investor_official > reporting > aggregator`

*"Anything weaker may corroborate but must not be the sole support."* Applied
in practice: Ashby's Series D rests on reporting only, no company-hosted
announcement was found, so it is marked `reporting` and its relevance is `low`
regardless.

### How each source class is treated

| Class | Registry entry | Treatment |
| --- | --- | --- |
| Company-controlled pages | `company-team-pages`, `company-handbook` — enabled, `manual`, `primary` | Highest trust for role currency and internal tooling |
| Company newsroom / blog | `company-announcement` — enabled, `manual`, `primary` | Tier 1 for funding and leadership events |
| Company ATS | `ats-{greenhouse,lever,ashby,personio}` — enabled, `ats_api`, `primary` | Primary for jobs — **but only after identity and ownership are resolved** (§26) |
| Founder / executive first-person posts | Not a registered source | Used manually; recorded as `firstPartyLanguage` with `speaker: 'person'` |
| LinkedIn | `excluded-linkedin` — **`not_permitted_yet`**, *"Excluded outright. Terms do not permit this use."* | Never scraped. Facts from it enter via manual verification with `verifiedBy`, never a fabricated URL |
| YC / accelerator profiles | `yc-companies` registered but `enabled: false`; an unofficial JSON mirror is used as `discovery_only`, then the **official profile page** is the primary record | Mirror discovers; official page substantiates |
| Third-party databases | `proxy-tech-database` — `not_permitted_yet`, *"Not authoritative for product eligibility. Proxy-grade only."* | Never confirms |
| Search results | `excluded-google-site-search` — `not_permitted_yet` | Explicitly not evidence |
| Inferred evidence | `EvidenceType: 'inferred'` | Stored, displayed, separated from `observed` |
| Cached source evidence | `.cache/http` (196 MB, gitignored) | A retrieval cache, never a source of truth |

**The `not_permitted_yet` category is itself a reusable idea.** Eight sources are
registered specifically so the decision *not* to use them is visible and
reviewable, rather than absent.

### OBSERVED / INTERPRETATION / HYPOTHESIS

All three exist and are kept apart at three levels:

1. **Type level** — `EvidenceType = 'observed' | 'inferred' | 'hypothesis'`
2. **Presentation level** — the drawer renders `ReviewedTrigger` under literal
   `OBSERVED` / `INTERPRETATION` headings with the note *"What was observed is
   kept separate from what it might mean. The interpretation is ours, not the
   company's."*
3. **Prose level** — `whyNow` strings are written in the form
   `OBSERVED: … INTERPRETATION: … It is not evidence of X.`

The thesis page adds a fourth axis for claims about the target company itself:
`EvidenceClass = 'bond' | 'alpha' | 'hypothesis' | 'rejected'` — supported by
first-party company material / observed in our own run / working hypothesis /
tried and rejected. Keeping *rejected* visible is deliberate.

### Exact quotes

Rules, enforced by review discipline and by tests:

- A quote is reproduced **verbatim or not at all**. Never paraphrase and then
  add quotation marks.
- Every quote carries `attribution` and either `sourceUrl` **or** `provenance`.
- `speaker: 'company' | 'person'` distinguishes an official company statement
  from an individual's own words.
- `tests/finalQueue.test.ts` asserts a confirmed environment claim's note
  contains an actual `"` character — a claim cannot be "confirmed" on the
  strength of a summary.

### Absence of evidence

**Structural rule:** `contradicted` requires *positive contrary evidence*.
Everything else — including nothing at all — is `unknown`.

From `src/scoring/eligibility.ts`:

> "Contradiction is deliberately hard to reach. It requires an explicit
> high-confidence statement that the company does not use Slack, has migrated
> away from it, or has replaced it... The mere presence of Microsoft Teams or
> any other tool is **not** a contradiction — a company can run both."

Rendered as: *"No reliable public evidence found. That is a gap in what we can
see, not a finding about their tooling — a question to verify on the first
call."*

Never: *"Does not use Slack."*

Tested by `tests/phase8Queue.test.ts` ("never phrases an unknown as an
absence"), `tests/finalQueue.test.ts` ("never renders unknown tooling as
absence"), and `tests/detailDiscoverability.test.tsx` ("never turns unknown
Slack into absent Slack").

### Product environment: the three display states

| State | Chip label | Colour | Requires |
| --- | --- | --- | --- |
| `confirmed` | "Confirmed internal use" | sage (positive) | A verbatim quote **and** a source URL |
| `proxy` | "Proxy evidence" | amber (caution) | Correlating observation, explicitly labelled as not establishing use |
| `unknown` | "No reliable evidence" | dashed grey outline (neutral) | Nothing. **Must not read as negative** |
| `contradicted` | "Conflicting evidence" | neutral chip | Positive contrary evidence |

Implemented in `EvidenceClassChip` (`src/components/AccountDrawer.tsx`). The
dashed outline for `unknown` is a deliberate visual choice: it is neither the
positive treatment nor a red/negative treatment.

**Escalation is one-directional and manual.** Proxy is never promoted to
confirmed programmatically. During the final evidence pass, four claims were
*demoted* (Ashby Slack, Encord CRM/Linear, Overview HubSpot, Abacum Google
Workspace) and none promoted, because a product integration, a customer list and
a "nice to have" are not evidence of internal use.

---

## 7. Signal architecture

### The generic pipeline

```text
DETECTION           src/data/deriveSignals.ts — pattern-match jobs/events
   ↓
CLASSIFICATION      SignalType assigned; metadata.nature = 'vacancy' | 'hire'
   ↓
EVENT DATE          Signal.eventDate   — when the thing happened
   ↓
RETRIEVAL DATE      Signal.detectedAt  — when we noticed. NEVER the same field
   ↓
SOURCE QUALITY      Signal.sourceIds → Source.authority
   ↓
OWNERSHIP           Signal.quarantined ← ATS audit. Unverified employer = no Timing
   ↓
RECENCY             expiresAt / closedAt; per-signal lifetimes
   ↓
ACCOUNT RELEVANCE   src/scoring/timing.ts — MAX per category, never additive
   ↓
PERSON RELEVANCE    selectKeySignal() picks the display signal
   ↓
COMMERCIAL INTERP.  ReviewedTrigger.strength + confidence, HUMAN-ASSIGNED
   ↓
QUEUE USE           Only if ownershipVerified and the record clears queueBlockers()
```

Steps 1–9 are generic mechanism. Step 10 is human judgment. **Nothing promotes
itself into the queue.**

### Generic mechanics worth copying

| Mechanic | Why |
| --- | --- |
| `eventDate` vs `detectedAt` as separate fields | Prevents "we just found it" reading as "it just happened" |
| Category MAX, not sum | Two Chief of Staff vacancies are still one signal. Prevents volume from masquerading as intensity |
| `expiresAt` / `closedAt` — signals expire, they are not deleted | Historical context survives |
| `quarantined` flag | An untrustworthy signal is neutralised without being erased |
| An `intersection` bonus (10 pts) for two *independent* categories | Corroboration across independent evidence is worth more than depth in one |
| Vacancy lifecycle as an explicit state machine | See below |
| `ReviewedTrigger.strength` assigned by a human, not derived | Specificity is a judgment call |

The vacancy state machine (`CosVacancyState`) is the strongest generic pattern:

```text
open vacancy → vacancy disappears → possible_hire → (confirming evidence) → confirmed hire
```

A disappeared vacancy is a **research trigger**, not evidence anyone was hired.
`cos_possible_hire` scores 12 (weak band); the confirmed state requires manual
enrichment naming the person, position, date and confirming source.

### BOND-SPECIFIC signal definitions — do not inherit

`SignalType` today: `cos_hiring`, `new_cos`, `cos_possible_hire`,
`ops_ceo_office`, `recent_funding`, `hiring_surge`, `leadership_expansion`.

Five of seven are about *executive-office staffing*, which is meaningful for an
AI Chief of Staff product and probably meaningless for anything else. The
weights (CoS/CEO-office 40 of 100 Timing points) encode a BOND conclusion.

A new radar must derive its own signal vocabulary from its own product thesis.

### The inference jumps this architecture refuses to make

Every one of these was a live risk in this project.

| Tempting inference | Why it is wrong | Prevented by |
| --- | --- | --- |
| funding → pain | Money is not disorganisation | Funding capped at 20/100 Timing; `tests/phase8Queue.test.ts` "never lets funding alone produce a hot verdict" |
| funding → intent | A round is a public event, not a budget decision | The dimension is named Timing, not Intent |
| hiring → pain | Growth is normal | Hiring pressure is a *ratio*, and is withheld when headcount is unreliable |
| vacancy → overload | A role can be new, strategic or speculative | Interpretation is written by a human and states what it is not |
| vacancy → buying intent | — | `whyNow` prose explicitly disclaims it |
| **vacancy → backfill** | Mytos: the vacancy predated the departure by 4 months | `tests/finalQueue.test.ts` "Mytos: the vacancy is not a backfill" forbids the affirmative claim |
| vacancy → empty seat | A company can advertise a role it already filled, or add a second | Vacancy state machine |
| distributed company → coordination pain | Many distributed companies coordinate well | Organisational coordination is capped at 20 and headcount is explicitly *not* an input |
| tool mention → internal usage | An integrations page proves the opposite direction | `isScorable()` refuses `proxy_only` / `low_proxy` |
| old signal → current urgency | — | `ageDays` computed and displayed; stale funding marked `relevance: 'low'` |
| executive-office hiring → founder constraint | — | Interpretation prose |
| new executive → proven product need | — | Verdict is human |

Two further guards worth copying:

- **`tests/phase8Queue.test.ts` — "never makes raw vacancy volume the leading
  reason to call."** Volume is a weak signal that looks strong.
- **Recency ≠ relevance.** Instacart had the *freshest* Chief of Staff signal
  in the entire dataset (opened 6 Aug 2026) and was classified
  `diagnostic_false_positive`: the role was scoped to a business unit inside a
  ~3,000-person company.

---

## 8. Person discovery

### The structural lesson — read this before designing Radar #2

> **Company discovery can be strong while person discovery is biased to the
> point of uselessness — and the scoring model will not tell you.**

The measured outcome in this repository, from
`PHASE_8_COMMERCIAL_TRUTH_REPORT.md` §6:

- **All 648 discovered people are founders.**
- **425 of them carry the bare title "Founder"** with no stated remit.
- **There is not one Chief of Staff or COO in the discovered person data.**
- Persona reclassification moved **78 of 648 (12%)** out of `founder_ceo`, 68 to
  `other_executive` and 10 to `coo_ops`.
- The two non-founder people who reached the final queue — Katie Noonan (Ashby)
  and Russell Nibbelink (Overview) — **came from manual research, not the
  pipeline.**

The mechanism: person discovery was never a separate stage. People arrive as
`PersonCandidate[]` attached to companies discovered from **YC founder lists**.
A YC company page lists founders. So the pipeline found founders.

The consequence is severe and subtle: **the Targeting Thesis names Chief of
Staff as a Tier 1 persona, and the discovery layer is structurally incapable of
observing that persona.** The model scored happily throughout. Nothing failed.
The system simply could not see its own best target.

`docs/TARGETING_THESIS.md` §11 states this as a named failure mode
("Person-discovery bias — expanded"), and lesson 9 of the thesis is *"Person not
discovered ≠ relevant operator does not exist."*

### The rule this produces

**Define target personas BEFORE selecting person-discovery sources, then prove
each source can observe each persona.**

**RECOMMENDED FUTURE ARCHITECTURE — the observability test.** Not implemented
here; do it manually in Radar #2 before large-scale discovery:

1. List the personas the thesis claims matter, in priority order.
2. For each candidate source, hand-collect 20 people.
3. Classify each by the persona classifier.
4. Build the matrix: **rows = personas, columns = sources, cells = count.**
5. **Any Tier 1 persona with a zero row is a blocking finding.** Either add a
   source that can see it, or downgrade the persona in the thesis and say why.
6. Record the matrix in the thesis as a signal-observability plan.

Had this been run here, it would have returned a zero row for Chief of Staff on
day one.

### Person discovery as currently implemented

| Aspect | Implementation |
| --- | --- |
| Sources | YC company profile pages; Getro board company pages. Registry: `company-team-pages` (enabled, manual) |
| Shape | `PersonCandidate { name?, title, personaType?, sourceUrl, bio? }` |
| Title normalisation | `normalizeTitle()` in `personas.ts`, then ordered pattern matching |
| Persona precedence | CoS → CEO-office → EA → CEO (founder_ceo if founder) → **functional remit** → COO → bare founder → anti-persona → strategy/ops → other C-suite |
| Current vs historical role | **Not modelled at the person level.** `roleCurrencyStatus` exists only in the commercial layer. `verified-facts.json` carries `formerTitle` / `departedFrom` / `tenure` |
| Company association | `Person.companyId`; `personKey = companyId::normalisedName` |
| Confidence | `USER_FIT_CAPS.unnamedPerson = 65`, `noScopeEvidence = 75` |
| Manual correction | `verified-facts.json` `people` section |
| Secondary contacts | `SecondaryContact[]` on the review record, each with `roleVerified` and a note |
| Missing person | `Person.name` optional; the record survives with a capped score. **Never invented** |

The persona precedence chain is the most reusable part. The rule *a named
functional remit outranks founder status* fixed a real inflation bug (§15.3) and
generalises to any radar that distinguishes company-wide from functional scope.

**Do not inherit "Chief of Staff is Tier 1."** That is a BOND conclusion about a
BOND product.

---

## 9. Targeting Thesis architecture

### What a Targeting Thesis is for

It is the **falsifiable statement of who to target and why**, written before the
ranking is trusted, and structured so that every claim declares what kind of
claim it is.

It is not marketing. Its function is to make targeting decisions *criticisable*.
Without it, a scoring model is an opinion with arithmetic.

### CURRENT IMPLEMENTATION

- Content: `src/content/targetingThesis.ts` — ~450 lines of typed, structured
  data (not prose blobs), exported as ~25 named constants
- Rendering: `src/components/TargetingThesis.tsx` — one tab in the app
- Mirror: `docs/TARGETING_THESIS.md`
- Origin: `docs/BOND_Targeting_Thesis_Source_of_Truth.docx` (human-authored)
- Tests: `tests/targetingThesis.test.tsx` (36)

Sections present today: hero framing · evidence classes · what the product is
(first-party sourced) · lessons from the Alpha · the surviving thesis · company
size and scale · person and pain · entry point and motion · why-now signal
hierarchy · **signal value × observability matrix** · product qualification vs
ranking · geography · targeting logic · where this can fail · lower-confidence
patterns · what would validate or falsify it.

### The reusable structure

| Element | Why it generalises |
| --- | --- |
| `EvidenceClass` on every claim: `bond` (first-party sourced) / `alpha` (observed in our own run) / `hypothesis` / `rejected` | Forces the author to declare epistemic status |
| Keeping `rejected` visible | Records what was tried and abandoned. Prevents rediscovering dead ends |
| `SIGNAL_MATRIX` / `PERSON_MATRIX` — value × **observability**, as separate columns | The single most valuable structural idea (below) |
| `FAILURE_MODES` as structured data | Failure modes are part of the thesis, not an appendix |
| `LOWER_CONFIDENCE` section | Explicitly marks weaker patterns as weaker |
| `VALIDATION` — what would falsify this | Makes the thesis a hypothesis rather than a position |
| An explicit disclosure block | *"not presented as BOND's internally validated ICP"* |
| Structured data, not prose | The thesis is testable — `tests/targetingThesis.test.tsx` asserts claims and their sourcing |

### Theoretically important ≠ publicly observable

This distinction earns its own section because it is where targeting models
quietly break.

A signal can be **commercially decisive and completely invisible**. If the two
are not tracked separately, an unobservable signal silently becomes a zero, and
the zero reads as "this doesn't matter."

`SignalObservability` carries `commercial value (hypothesis)` and
`current detectability` as two independent `Level` fields — including
`Incomplete`, which is neither high nor low but *"we cannot currently see
this."*

The BOND example: direct evidence of executive coordination pain would be the
highest-value signal available. It is almost entirely unobservable from public
sources at scale. Marking it high-value/low-detectability is honest. Dropping it
because it scored zero would have been a silent lie about the model.

### Using first-party material from the target company

The rule applied here (and worth copying verbatim):

- Product claims about the target company must come from **the company's own
  published material**, cited, and tagged `EvidenceClass.bond`.
- `BOND_SOURCES` lists exactly the first-party URLs used.
- Only four product claims are made at all: what the system connects to; which
  personas it serves; that it does not replace a human in the role; and what
  that implies for targeting.
- **Deliberate omissions are stated:** *"Pricing, seat model and enterprise
  contract terms are deliberately not shown anywhere in this product. They are
  time-sensitive and were not verified as current at implementation time."*

First-party material must also be allowed to **challenge** the thesis. A real
example: a draft claim said a live Chief-of-Staff search is not an opening to
pitch the product as a substitute for the hire. The company's own material says
some founders use AI to cover parts of the function *before* a hire is
justified. The claim was weakened before shipping. The thesis serves the
evidence, not the other way round.

### Build the thesis BEFORE final ranking

Because the thesis determines:

1. which personas matter → which person-discovery sources are required
2. which signals matter → which adapters are required
3. which product environment matters → which extraction rules are required
4. what "qualified" means → what blocks the queue

Building the ranking first means the thesis rationalises whatever the available
sources happened to surface. That is exactly how a dataset of 648 founders comes
to be described as a Chief-of-Staff targeting model.

---

## 10. Scoring architecture

### CURRENT IMPLEMENTATION

Entry point: `scoreProspect(person, company, now)` in `src/scoring/index.ts`.
Pure and deterministic. Order mirrors the GTM flow:

```text
1. resolveRelationship(person, company)     → routing input, never a score
2. evaluateEligibility(company)             → a GATE, evaluated before scoring
3. calculateUserFit(person, company)        → 0–100
4. calculateEnvironmentFit(company)         → 0–100
5. calculateTiming(company, now)            → 0–100
6. calculateBaseFit / calculateQueueScore   → composites
7. assessDataQuality(...)                   → high | medium | low
8. derivePriority(...)                      → the user-facing band
9. deriveChannel(...)                       → route, AFTER priority, affects nothing
```

**Every stored score is ignored at runtime.** `hydrateDataset()` recomputes from
facts + the current clock.

### Weights — every number below is a BOND-SPECIFIC ASSUMPTION

**User Fit — 100 points** (`USER_FIT_MAX`)

| Component | Max |
| --- | --- |
| Persona relevance | 35 |
| Cross-functional scope | 30 |
| Information burden | 20 |
| Leadership centrality | 15 |

Persona bands: founder_ceo 35 · chief_of_staff 35 · ceo 30 · coo_ops 27 ·
strategy_ops 24 · other_executive 20 · executive_assistant 15 ·
high_performer 10 · unknown 0.

Caps (`USER_FIT_CAPS`): unnamed person ≤ 65 · no scope evidence ≤ 75. The cap is
displayed and explained, and `cappedBy` plus `uncappedTotal` are retained so the
cap is auditable.

**Environment Fit — 100 points** (`ENVIRONMENT_MAX`)

Core communication 30 · context fragmentation 35 · meeting/commitment surface 15
· organisational coordination 20. **Headcount is deliberately not an input.**
Only `internalUse ∈ {internal, implied}` at `high|medium` confidence scores.

**Timing — 100 points** (`TIMING_MAX`)

CoS/CEO-office 40 (MAX, not additive) · funding 20 · hiring pressure 20 ·
leadership/expansion 10 · intersection 10.

**Composites**

```ts
BASE_FIT_WEIGHTS    = { userFit: 0.6,  environmentFit: 0.4 }
QUEUE_SCORE_WEIGHTS = { userFit: 0.45, environmentFit: 0.3, timing: 0.25 }
```

**Priority** (`derivePriority`) — `call_now | high_fit | triggered | watch | skip`

```text
eligibility === 'ineligible'                                        → skip
uf ≥ 80 && env ≥ 70 && timing ≥ 55 && conf ≠ low && eligible        → call_now
uf ≥ 80 && env ≥ 70                                                  → high_fit
timing ≥ 55 && baseFit ≥ 55                                          → triggered
baseFit ≥ 60                                                         → watch
otherwise                                                            → skip
```

### Generic mechanism vs BOND-specific assumption

| Element | Classification |
| --- | --- |
| Pure functions, no side effects, `now` injected | **GENERIC** |
| Re-derivation at load time | **GENERIC** |
| Multi-dimensional score never collapsed to one number | **GENERIC** |
| Confidence caps instead of invented data | **GENERIC** |
| `uncappedTotal` + `cappedBy` retained for audit | **GENERIC** |
| MAX-per-category rather than additive | **GENERIC** |
| Eligibility as a pre-scoring gate | **GENERIC pattern**, BOND-specific content |
| Routing computed after priority, affecting nothing | **GENERIC** |
| Timing as accelerator, not prerequisite | **GENERIC and important** — the V1 model buried excellent evergreen prospects that had no trigger |
| Every numeric weight and threshold | **BOND-SPECIFIC** |
| Persona bands | **BOND-SPECIFIC** |
| The Slack gate | **BOND-SPECIFIC** |
| `Priority` band names and meanings | **BOND-SPECIFIC** |

### MODEL SCORE ≠ FINAL GTM QUEUE

The queue does not read scores at all.

- `compareQueueRecords()` orders by verdict → trigger strength → trigger recency
  → persona rank → name. **No score appears in the comparator.**
- The shipped queue does not even use the comparator: `build-commercial-review.ts`
  sorts by `curatedOrder`, the position in the hand-authored array.
- `modelDiagnostics` is optional and rendered last in the drawer, under a note
  saying these numbers rank candidates for review and are not estimates of
  anything about the account.
- Insify has **no** `modelDiagnostics` at all — it was never scored, because it
  was never discovered.

Comment in `commercial.ts`: *"Model scores are not used — a 58-versus-53
difference carries no commercial meaning."*

### Is queue selection deterministic, manual, or hybrid?

**Hybrid, and the split is precise:**

| Step | Authority |
| --- | --- |
| Which accounts get reviewed at all | Model ranking + human named accounts |
| The verdict on each | **Human** |
| Whether a verdict is queue-eligible | **Deterministic** — `QUEUE_VERDICTS` |
| Whether a record clears the gate | **Deterministic** — `queueBlockers()` |
| Final ordering | **Human** — `curatedOrder` |
| Validation | **Deterministic** — `validate-queue.ts` |

So: humans decide *what* and *in what order*; code decides *whether it is
allowed to ship*. A human cannot wave through an account with an unresolved
identity, no why-now, no way-in, or a leading trigger resting on unverified job
ownership.

**A future company must not inherit these weights automatically.** They encode
one product's hypotheses, none of which have been validated against conversion
data.

---

## 11. Commercial review layer

### Why it exists between ranking and queue

The Alpha produced a ranked list whose top entry was **Weekday** — an AI
recruiting company whose ATS board carried other companies' vacancies. The model
was working exactly as designed. The output was commercially indefensible.

No amount of weight-tuning fixes that, because the failure is not in the
arithmetic. It is that *nobody asked whether the claim was true.*

The commercial review is where somebody asks.

Its second function is discipline: **the model is not tuned to hide its
mistakes.** `README.md` records that the V4 model is frozen and every post-Alpha
issue is documented rather than tuned away. `diagnostic_false_positive` exists so
model artifacts stay visible.

### The review architecture

`scripts/build-commercial-review.ts` merges three inputs per account:

1. `AUTHORED` — the human record (verdict, narrative, triggers, environment,
   caveats, open questions, sources)
2. `verified-facts.json` — human factual corrections
3. `prospects.json` — machine facts (job counts, locations, ATS trust,
   environment evidence, model diagnostics)

Output: `commercial-review-v8.json` (all reviewed records) and
`gtm-queue-v8.json` (those that pass).

Current state: **10 reviewed** → hot 3, promising 3, watch 1,
diagnostic_false_positive 1, exclude 2 → **6 queued.**

### The commercial questions each record answers

| Question | Field |
| --- | --- |
| Who? | `primaryPersonName`, `primaryPersonTitle`, `roleCurrencyStatus` + source/provenance |
| Why this account? | `whyThisAccount` |
| Why this person? | `whyThisPerson` |
| Why now? | `whyNow` — written as `OBSERVED: … INTERPRETATION: …` |
| What is observed? | `triggers[]` with `eventDate`, `observedAt`, `ageDays`, `confidence`, `ownershipVerified`, `sourceUrls` |
| What is interpretation? | The INTERPRETATION clause, always labelled |
| What is hypothesis? | `motion`, `openQuestions[]` |
| What environment evidence? | `productEnvironment` with per-tool state |
| What is unknown? | `openQuestions[]`, `unknown` states, `VerificationState` per dimension |
| What would we say? | `suggestedWayIn` + `wayInSourceUrls` |
| What could embarrass us? | `caveats[]` — **mandatory**: `tests/phase8Queue.test.ts` requires at least one caveat or open question per queued account |

### Promotion, demotion, rejection, retention

All four are expressed as a **verdict change on the review record**. The raw
prospect is untouched in every case.

| Action | Mechanism | Real example |
| --- | --- | --- |
| **Promoted** | verdict → `hot`/`promising` | Overview restored after Phase 7 removed it on reasoning that was wrong on its facts |
| **Demoted** | verdict → `watch` | Canary Technologies (trigger is a growth award); Topline Pro (Series B twelve months old) |
| **Rejected** | verdict → `exclude` | Weekday (marketplace contamination); Tilt (identity collision) |
| **Retained with caveats** | stays queued, `caveats[]` states the limitation | Mytos — queued as the weakest account, with the vacancy-timing caveat stated in full |
| **Diagnostic** | `diagnostic_false_positive` | Checkr, Instacart — real signals, divisional roles at scale |

### Rejected candidates stay auditable

`gtm-queue-v8.json` carries two arrays beyond `entries`:

- `notInQueue[]` — every reviewed account that did not qualify, with
  `companyName`, `domain`, `verdict`, `motion`, `reason` (currently 4)
- `blockedFromQueue[]` — accounts with a queue-eligible *verdict* that failed a
  hard blocker, with the blocker list (currently 0)

`tests/phase8Queue.test.ts` asserts *"keeps diagnostics and exclusions visible
rather than deleting them."*

The distinction matters: `notInQueue` is *"a human said no"*;
`blockedFromQueue` is *"a human said yes and the gate said no."* The second is
a much louder signal and deserves to be separately visible.

---

## 12. Final GTM Queue

### Architecture

**Source:** `data/verified/gtm-queue-v8.json`, produced by
`build-commercial-review.ts`, copied to `public/data/` by `sync-data`, fetched
by `loadQueue()` at runtime.

**Shape:** `{ _notice, generatedAt, reviewedAt, rankingBasis, size, entries[],
blockedFromQueue[], notInQueue[] }`. Each entry is a full
`CommercialReviewRecord` plus `rank`.

**Account-first:** one row per company. `tests/phase8Queue.test.ts` asserts
*"gives every queue account exactly one row and one primary person."* The
primary person is the recommended entry point, not the only relevant human —
others appear as `secondaryContacts[]`, and the primary is never repeated there.

**Ordering:** curated. The authoring order *is* the ranking, applied on person
relevance, then signal quality, then recency, then evidence and route quality.
`rankingBasis` states this in the file. `compareQueueRecords()` exists and is
tested as a deterministic fallback, but is not what produced the shipped order —
`tests/phase8Queue.test.ts` asserts the queue *"is curated, not
comparator-ordered."*

### Row fields (desktop table)

`#` · Account (name, domain, headcount display) · Primary person (name, role
verification mark, title) · Verdict chip · Key signal + strength · Why now
(truncated) · Recency (`2mo ago` / `Undated` + an explanation of what undated
means) · "View details →".

### Drawer section order — deliberate

```text
Header (company · headcount · N open roles across N advertised locations)
Verdict + motion + Identity/Role verification chips
Primary contact + Suggested way in + hook provenance
Why this account
Why this person
Why now                          ← OBSERVED / INTERPRETATION
In their words                   ← optional; only when it exists
Product environment              ← moved ABOVE signals in the final pass
Signals and evidence             ← OBSERVED / INTERPRETATION per trigger
Funding
Hiring context                   ← includes ATS board trust
Headcount                        ← with confidence
Secondary contacts
Caveats                          ← what could be wrong
Open questions                   ← what we do not know
Sources                          ← label · what it establishes · publisher · retrievedAt · authority
Model diagnostics                ← LAST, explicitly labelled as diagnostics
```

The ordering encodes a claim: **the case comes before the evidence, the evidence
before the caveats, and the model's opinion last.**

### The release gate

A record reaches the queue only if **all** hold (`queueBlockers()` in
`src/review/commercial.ts`):

1. `accountVerdict ∈ {hot, promising}`
2. `companyIdentityStatus` is not `conflicting` or `unknown`
3. no `identityConflict`
4. a `primaryPersonName` exists
5. a `whyNow` exists
6. a `suggestedWayIn` exists
7. `atsTrust.state !== 'identifier_collision'`
8. the leading trigger (strong or medium) has `ownershipVerified === true`

Plus `validate-queue.ts` errors on: duplicate account rows · a verified role
with neither URL nor stated provenance · no sources · a way-in without source
provenance · a way-in citing a URL the record does not carry · a scoring trigger
with unverified ownership · a trigger with no source · a primary person
belonging to a different company record.

### Size is not an invariant

> **It is better to ship five defensible accounts than six where the sixth
> exists only to fill a slot.**

Enforced procedurally through an explicit **stopping rule**, recorded in the
output file itself:

> *"Reviewed the named accounts, then 19 further candidates from the broader
> pool. Those 19 produced no additional hot or promising accounts, satisfying
> the stop condition of fewer than two qualifying accounts in the next ~20
> reviewed. The queue is therefore smaller than 15 by evidence, not by design."*

Two things make this work, and both are reusable:

1. **A stated stop condition** — "fewer than two qualifying accounts in the next
   ~20 reviewed" — decided in advance.
2. **The stopping rule ships inside the data file**, so a reader can see why the
   queue is the size it is.

Nothing in the code enforces a queue size. Nothing should.

### Which uncertainties block, and which may remain

| Must be resolved before inclusion | May remain if disclosed |
| --- | --- |
| Company identity | Product environment / tooling (`unknown` → a call question) |
| Who the employer of a scoring trigger is | Headcount precision (a range is fine) |
| Primary person's identity | Funding (absent ≠ none) |
| Primary person's role currency (verified *or* explicit provenance) | The person's exact current remit |
| A stated why-now | Why a vacancy has been open a long time |
| A stated way-in with source provenance | Whether a signal indicates internal difficulty |

The principle: **an unknown that changes who you are talking to blocks; an
unknown that becomes a question on the call does not.**

An account with an unknown Slack state is still worth calling. An account whose
identity is unresolved is not.

---

## 13. Product environment module

### What it is for

Public evidence about the tools and workflows around an organisation can improve
qualification in two ways: it indicates whether the product can operate there at
all, and it gives the first conversation a concrete question.

It is **not** a ranking input in the final queue, and it must never be.

### CURRENT IMPLEMENTATION — two layers with different vocabularies

This is one of the messier parts of the codebase and a future radar should
unify it (§21).

**Layer 1 — raw** (`src/types/radar.ts`, `src/enrichment/stackExtraction.ts`)

`EnvironmentEvidence` with the two-axis model: `confidence` (high / medium /
low_proxy) × `internalUse` (internal / implied / proxy_only / contradicted /
unknown), plus `evidenceType` (11 kinds) and an optional verbatim `quote`.

**Layer 2 — commercial** (`src/review/commercial.ts`)

```ts
productEnvironment: {
  slack: 'confirmed' | 'unknown' | 'contradicted'
  slackNote: string
  tools: Array<{ tool, category, state, note?, sourceUrl? }>
}
```

The mapping applied when deriving from raw:
`internal → confirmed`, `proxy_only → proxy`, everything else → `unknown`.

The two layers exist because the raw model needed nuance for scoring and the
commercial layer needed three legible display states.

### Display states

| State | Renders as | Requires |
| --- | --- | --- |
| `confirmed` | "Confirmed internal use", sage | Verbatim quote **and** source URL — asserted by `tests/finalQueue.test.ts` |
| `proxy` | "Proxy evidence", amber | Correlating observation; note must say what it does *not* establish |
| `unknown` | "No reliable evidence", **dashed neutral outline** | Nothing. Must read as a question, never a finding |
| `contradicted` | "Conflicting evidence", neutral | Positive contrary evidence only |

Section preamble in the drawer: *"What can and cannot be established about the
tools around this organisation. Nothing here is a statement about what they do
not use."*

### The evidence rules — every one learned the hard way

| Rule | Real case |
| --- | --- |
| **JOB REQUIREMENT ≠ INTERNAL USAGE** | Encord's CRM/Linear mentions were in "or similar" alternatives lists → demoted to `unknown` |
| **INTEGRATION KNOWLEDGE ≠ INTERNAL STACK** | Abacum's Google Workspace appeared as an SSO provider *their product* integrates with → `unknown` |
| **SHIPPING AN INTEGRATION ≠ USING THE TOOL** | Ashby ships Slack integrations as a product feature. Its Slack state was `confirmed` on a non-quote; corrected to `unknown` |
| **TOOL MENTION ≠ COMPANY-WIDE ADOPTION** | A "nice to have" HubSpot line in an Overview job ad → `unknown` |
| **EMPLOYEE MENTION ≠ STANDARD WORKFLOW** | Abacum's "a Slack thread" appears in a job posting describing working there → `proxy`, never confirmed |
| **NEVER UPGRADE PROXY TO CONFIRMED** | Mytos/Notion reads like internal use but stayed `proxy`, and this was flagged rather than silently upgraded |

`src/discovery/registry.ts` registers four proxy sources
(`proxy-mx-records`, `proxy-slack-marketplace`, `proxy-dns-attribution`,
`proxy-tech-database`) as `not_permitted_yet`, with notes such as *"Proves the
company built a Slack app, not that it uses Slack internally."*

### Environment relevance is company-specific

Slack matters to BOND because BOND connects to the tools a company already runs.
For a different product the relevant environment might be a CRM, a data
warehouse, a CI system, an EHR, or nothing at all.

**How a new radar should define its environment categories:**

1. From the target product's own material, list what it must connect to or
   coexist with.
2. For each, decide whether it is a **gate** (product cannot operate without it),
   a **qualifier** (changes the conversation), or **context** (interesting only).
3. Decide which are observable from public sources at all.
4. Only then write tool patterns and category mappings.
5. **Do not copy `TOOL_DEFINITIONS` or the `bondRelevant` flag.**

BOND made Slack a *gate* (`ProductEligibility`), which withholds `call_now` while
unknown. That is a strong choice, correct for a product whose value depends on
connected communication. It would be wrong for most products.

Note the final architecture *reduced* Slack's role: Phase 8 removed it as a
ranking variable and as a queue blocker entirely (`§6` of the phase brief), while
keeping the eligibility gate in the discovery-layer model. An unknown environment
now blocks nothing in the queue.

### One rendering defect worth knowing about

Because `slack` has a dedicated field **and** can appear in `tools`, one account
rendered Slack twice under two different evidence classes (`unknown` standalone
row + `proxy` tools entry, from the same job posting). Fixed in
`AccountDrawer.tsx` with a `slackInTools` guard that suppresses the standalone
row when the richer tools entry exists, and pinned by
`tests/detailDiscoverability.test.tsx`.

**Lesson for the reusable design:** do not special-case one tool with its own
top-level field. A future radar should model the environment as a single list of
`{ tool, category, state, evidence }` and derive any gate from that list. See §21.

---

## 14. First-party language / "In their words"

### Why it is valuable

The company's or person's own words about their situation are the strongest
available evidence of relevance, because they are not our inference. A seller
opening with the company's own framing is on much safer ground than one opening
with an interpretation.

They are also the easiest thing in the entire system to abuse: a quote can make
a weak case *feel* strong without adding a single fact.

### CURRENT IMPLEMENTATION

```ts
firstPartyLanguage?: {
  quote: string                       // VERBATIM. Never a paraphrase in quotes
  attribution: string                 // who said it, and in what context
  speaker: 'company' | 'person'
  whyItMatters: string                // why it is relevant — and what it is NOT
  sourceUrl?: string
  provenance?: string                 // when no clickable source exists
}
```

Rendered between "Why now" and "Product environment", as a bordered pull-quote
with attribution, a "Why it matters" line, and either a source link or a
provenance line.

### The rules

| Rule | Enforcement |
| --- | --- |
| Exact quote only, if verified | Review discipline; `tests/finalQueue.test.ts` asserts exact expected strings |
| Otherwise paraphrase **outside** quotation marks | Discipline |
| Short excerpts | `tests/finalQueue.test.ts` "quotes Claire once and only once" bounds the excerpt and forbids other sentences from the same post |
| Attribution required | Tested per account |
| Provenance or URL required | `tests/finalQueue.test.ts` "states provenance whenever a quote has no clickable source" |
| Never invent a URL | Insify's quote carries `provenance: "Public company announcement · manually verified"` and **no URL** |
| Company vs person language distinguished | `speaker` field; rendered as "Company language" or "First-person language" |
| Current vs historical | Handled by attribution context |
| **Optional — never forced for symmetry** | `tests/finalQueue.test.ts` "treats quotes as optional" asserts `withQuote.length < queue.entries.length` and that two named accounts have none |

### Illumination, not manufactured pain

The `whyItMatters` field must explain **relevance** and explicitly state what
the quote is *not* evidence of. From the shipped Insify record:

> "Insify describes the role in language close to the executive-context problem
> BOND addresses. Strong first-party language for BOND relevance — it is the
> company's own framing of the remit, not our reading of it, **and it is not
> evidence of any difficulty.**"

`tests/finalQueue.test.ts` "never turns Insify's language into a pain or intent
claim" forbids the strings *has a BOND problem*, *needs BOND*, *proves
coordination pain*, *textbook BOND*, *overwhelmed*, *buying intent*.

**Shipped state: 4 of 6 accounts carry a quote. Two carry none, because none
exists that materially helps.** Asymmetry is the correct outcome; a forced sixth
quote would be a worse product.

---

## 15. Failure modes learned

Every failure below **actually occurred**. Sources: the phase reports, the test
suite, and the code comments that document the fix. Failures that did not occur
are excluded.

### 15.1 ATS marketplace contamination — Weekday

- **What happened:** Weekday, an AI recruiting company, ranked **first** in All
  Prospects. Its ATS board carried 60 postings; 58 described vacancies it was
  filling *for client companies*.
- **Why:** The board genuinely belonged to Weekday. Nothing about the ATS
  identifier was wrong. The pipeline assumed a company's own board carries its
  own jobs.
- **Detected by:** Commercial review reading the actual postings.
- **Commercial risk:** The top-ranked account in the entire system was a company
  whose hiring signal described *other people's* hiring.
- **Fixed by:** `src/enrichment/atsTrust.ts` — `isRecruitingBusiness()` sets a
  `strict` mode; `assessJobOwnership()` classifies each posting from its body;
  58 quarantined, 2 genuine internal roles kept. Timing fell 70 → 46.
- **Now prevented by:** `queueBlockers()` refuses any record whose leading
  trigger lacks `ownershipVerified`; `validate-queue.ts` errors on it;
  `tests/phase8Ats.test.ts`.
- **Generic.** Any radar using ATS data will meet this.

### 15.2 The ATS detector was wrong in both directions

- **What happened:** The first detector keyed on `/\brecruit(ing|ment)?\b/`.
  That pattern **misses "recruiter"** (word boundary), so Weekday — the actual
  marketplace — was not flagged. It **matches "recruiting platform"**, so
  **Ashby, a software vendor, was falsely flagged** and would have lost 58 real
  jobs.
- **Why:** The rule confused *selling recruiting software* with *selling
  recruiting labour*.
- **Detected by:** Reviewing the audit output rather than trusting it.
- **Risk:** Simultaneously admitting a contaminated account and destroying a
  legitimate one.
- **Fixed by:** Separating agency/service language (`\brecruiters?\b`,
  `\bstaffing\b`, `\bexecutive search\b`, `talent marketplace`…) from
  software-vendor language. The reasoning is preserved in a code comment.
- **Lesson (generic):** **a classifier that has never been checked in both
  directions has not been tested.** Always verify one true positive *and* one
  true negative on real data.

### 15.3 ATS identifier collision — Tilt

- **What happened:** The Ashby board `tilt` belongs to TILT, a UK live-shopping
  fashion platform. The stored company was tilt.io / Agora Indexing
  Technologies, formerly Delphia. Every job attributed to the wrong company.
- **Why:** Identifiers are slugs. Slugs collide. `identifierCandidates()`
  generates plausible guesses from domain and name, and a 200 response was
  treated as confirmation of identity rather than merely of existence.
- **Detected by:** Commercial review reading the postings.
- **Risk:** An entire account's evidence belonging to a different company.
- **Fixed by:** `AtsTrust.state = 'identifier_collision'`; Timing 42 → 0;
  account excluded; **aliases stored explicitly** (`aliases[]`) rather than
  merging or splitting on name similarity.
- **Now prevented by:** `queueBlockers()` blocks on collision;
  `companyIdentityStatus` must not be `conflicting`/`unknown`.
- **Generic, and the most dangerous failure in the catalogue** — it is silent.

### 15.4 The ATS audit was not idempotent

- **What happened:** The audit set `quarantined` flags but never cleared stale
  ones. Re-running dropped Ashby from 58 to 20 open jobs.
- **Why:** Additive mutation of a shared dataset.
- **Detected by:** Re-running and comparing counts.
- **Fixed by:** `delete s.quarantined` before re-applying.
- **Lesson (generic):** **any script that mutates a shared dataset in place must
  be idempotent, and must be tested by running it twice.**

### 15.5 Founder-biased person discovery

- **What happened:** All 648 discovered people are founders; 425 carry the bare
  title "Founder"; zero Chiefs of Staff or COOs — while the thesis names Chief
  of Staff as a Tier 1 persona.
- **Why:** Person discovery was never a separate stage. People came attached to
  companies discovered from YC founder lists.
- **Detected by:** The persona audit during Phase 8.
- **Risk:** The system is structurally blind to its best target, and the model
  gives no indication of it.
- **Fixed by:** **Not fixed.** Documented as the single biggest systemic
  weakness. Non-founder queue members came from manual research.
- **Generic lesson:** §8's persona × source observability matrix.

### 15.6 Founder persona inflation

- **What happened:** "Co-Founder & VP of Engineering" and "Co-Founder & CTO"
  classified as `founder_ceo` — the joint-highest persona band (35 points). A
  co-founder CTO ranked in the top five by environment evidence.
- **Why:** Founder status was treated as a remit rather than an attribute.
- **Detected by:** Persona audit — **78 of 648 (12%)** reclassified.
- **Risk:** Systematically ranking functional executives as company-wide
  operators.
- **Fixed by:** `FUNCTIONAL_REMIT_PATTERNS` + precedence in `classifyPersona()`:
  a named functional remit outranks bare founder status; `founderStatus` becomes
  a separate boolean attribute.
- **Now prevented by:** `tests/phase8Persona.test.ts`, `tests/personas.test.ts`.
- **Mechanism generic; the patterns are BOND-specific.**

### 15.7 Support roles classified as the executive they support

- **What happened:** "Chief of Staff to CEO", "EA to CEO", "Founder's Associate"
  risked classifying as CEO/founder.
- **Fixed by:** CoS and CEO-office patterns resolve *before* founder/CEO
  patterns in `classifyPersona()`.
- **Now prevented by:** explicit tests.
- **Generic pattern**, BOND-specific persona names.

### 15.8 Stale headcount and a contaminated derived ratio — Overview

- **What happened:** Discovery stored 40 employees. Overview's own page says
  50+. The stored figure produced "40 open roles / 40 employees" — a 100%
  hiring-pressure reading.
- **Why:** A single integer copied from an accelerator profile, with no
  observation date and no confidence.
- **Risk:** A fabricated extreme-urgency signal presented as fact.
- **Fixed by:** `HeadcountEstimate` with `confidence`, `observedAt`, `basis` and
  `readings[]`; the correction recorded in `verified-facts.json` with an
  explicit `supersedes`; the ratio **withdrawn**, not recomputed.
- **Now prevented by:** `tests/phase8Queue.test.ts` "quotes a hiring ratio only
  when headcount is defensible"; `tests/finalQueue.test.ts` "never revives the
  40-employee framing or the 1:1 ratio".
- **Generic.** *A derived metric inherits the weakest confidence of its inputs.*

### 15.9 Conflicting headcount resolved by preference

- **What happened:** TRM Labs — reporting said 150+ (Nov 2022), a database bands
  it 251–500, the stored record said 400.
- **Fixed by:** Displayed as **~250–500 (sources conflict)**; no ratio quoted.
- **Now prevented by:** `tests/phase8Queue.test.ts` "keeps conflicting headcount
  as a range rather than a point value".
- **Generic, and the rule is:** never resolve a conflict by picking whichever
  number produces a nicer ICP fit.

### 15.10 Advertised job locations mistaken for company footprint

- **What happened:** The UI showed "40 open roles across 15 locations" beside
  Overview's verified 30-cities figure. Those 15 were **ATS advertising
  locations**, not offices.
- **Detected by:** Visual QA — the two numbers contradicted each other on screen.
- **Risk:** Two conflicting scale claims in one brief.
- **Fixed by:** Renamed to "advertised locations" everywhere.
- **Generic.** *A field's name must state its provenance when its provenance is
  not obvious.*

### 15.11 Departure not detected; vacancy assumed to be a backfill — Mytos

- **What happened:** Mytos's team page listed Celso Milne as Chief of Staff. He
  left in April 2026 for Anima. A Chief of Staff vacancy was open. The natural
  reading — "the vacancy is a backfill" — is **false**: the vacancy was
  published **2025-12-03**, about four months *before* the departure.
- **Why:** Company team pages go stale. LinkedIn cannot be read by this runtime.
  And two adjacent facts invite a causal story.
- **Detected by:** Manual verification supplying the departure date, then
  checking it against the vacancy date.
- **Risk:** Opening a conversation with a confidently wrong causal claim.
- **Fixed by:** `verified-facts.json` records the departure and the correction
  with the reasoning; the account is queued **last** with the caveat stated.
- **Now prevented by:** `tests/finalQueue.test.ts` "Mytos: the vacancy is not a
  backfill" forbids the affirmative claim while requiring the negative one.
- **Generic.** *Two adjacent facts are not a causal chain. Check the dates.*

### 15.12 Stale funding vocabulary hid a $60M round — Encord

- **What happened:** The dataset's funding knowledge stopped at Series B; Encord
  had announced a $60M Series C.
- **Compounding error:** During review it was claimed no official announcement
  existed — the wrong URL had been tried. The official post exists.
- **Fixed by:** `ingest-funding.ts` with `FundingSourceTier`; the Series C
  ingested from the company-official source.
- **Generic lesson:** *"I could not find it" is a statement about the search, not
  about the world.* Record the search as inconclusive, not the fact as absent.

### 15.13 Historical trigger presented as current

- **What happened:** Insify's Chief of Staff vacancy now reads "no longer
  accepting applications" — the seat is filled.
- **Fixed by:** Retained as **historical context only**, explicitly not a
  current trigger, stated in `caveats[]`.
- **Generic.** Signals expire; they are not deleted.

### 15.14 Inferred causal relationship presented as fact

- **What happened:** Encord's review carried reasoning about a current two-CEO
  structure that was not supported; titles were also out of date (Eric Landau is
  Co-Founder & CEO; Ulrik is President & Co-Founder).
- **Fixed by:** Causal language removed; historical structure kept as history.
- **Now prevented by:** `tests/finalQueue.test.ts` "Encord: causal language
  removed" and "current titles, co-CEO structure kept historical".

### 15.15 Ownership overclaim in commercial prose

- **What happened:** A draft claimed an Overview contact "owns coordination" —
  stronger than the evidence supported.
- **Fixed by:** Weakened; pinned by "Overview: no ownership overclaim".
- **Generic.** *Verbs are claims.* "Owns", "runs", "manages" assert
  organisational fact.

### 15.16 Source-observability bias

- **What happened:** Recruiting/HR-adjacent companies are **3.2%** of the
  dataset but **62.5% of the Triggered band** — ~20× over-representation. Only
  **23%** of prospects sit on a verified ATS board. Region mix is 79% US, 4%
  Europe/UK.
- **Why:** Timing is built from ATS data; companies that sell recruiting
  software run large, well-structured, highly visible boards. They surface more
  signal per unit of actual fit.
- **Detected by:** `SOURCE_BIAS_REPORT.md`.
- **Risk:** Ranking measures *observability*, not fit — and reads as fit.
- **Fixed by:** **Not fixed.** Documented, quantified, and stated in the thesis
  as a named failure mode. For the other 77%, absence of Timing means "we could
  not look".
- **Generic.** Every radar should compute this ratio for its own sources.

### 15.17 Model diagnostics mistaken for a commercial verdict

- **What happened:** The frozen model produced **zero** `call_now` prospects.
  Leading the UI with two model zeros misrepresented the work as having found
  nothing, while six reviewed accounts existed.
- **Fixed by:** The KPI row on the queue view was replaced with a derived
  **funnel** (648 → 173 → 10 → 6), counts computed from exactly the data each
  view renders; model states moved to the discovery surface they describe;
  `modelDiagnostics` rendered last in the drawer.
- **Now prevented by:** `tests/phase8Views.test.ts`; funnel counts are props
  from `App.tsx`, never hard-coded.
- **Generic.** *A headline metric that contradicts the shipped output is a
  defect, not a nuance.*

### 15.18 UI offered legacy model states as actionable filters

- **What happened:** "High fit" and "Call now" were selectable filters. With
  zero `call_now`, a user could filter to an empty page and conclude the system
  found nothing.
- **Fixed by:** Removed as filters, preserved as diagnostics.

### 15.19 Mobile horizontal overflow — and a misdiagnosis

- **What happened:** The page scrolled sideways at 390px.
- **The misdiagnosis matters more than the bug:** an iframe harness reported
  ~695px of overflow. That figure **persisted even under
  `overflow-x: hidden !important`**, which is impossible for genuine document
  overflow. The harness was measuring a cross-origin `about:blank`
  (`contentDocument` was `null`). Real overflow was **13px**, from the tab row.
- **Fixed by:** Scrollable tab strip; `overflow-x: clip` on the root —
  **`clip`, not `hidden`**, because `hidden` makes the root a scroll container
  and breaks `position: sticky`.
- **Lesson (generic):** *a measurement that survives a condition that should
  make it impossible is a broken instrument, not a finding.*

### 15.20 Deployment blocked by git author identity

- **What happened:** Vercel refused the deployment: the commit email
  `louisengelen@mac.home` could not be matched to a GitHub account.
- **Fixed by:** Setting the verified GitHub email **repo-locally** (not
  globally), then an empty commit to re-trigger. Deployed in 17 seconds.
- **Generic.** Verify `git config user.email` matches a verified GitHub identity
  **before** the first deploy. See §18.

### 15.21 Build context unnecessarily large

- **What happened:** An early upload was ~44 MB, including `.cache` (196 MB on
  disk), `node_modules`, `dist` and `docs`.
- **Fixed by:** `.vercelignore`.
- **Generic.**

### 15.22 Generated public data absent from git

- **What happened:** `public/data/` is gitignored, so a clean clone has no data.
- **Why it is not a bug:** `prebuild` runs `sync-data`, regenerating it on every
  build. Verified by cloning to a temp directory and running a full install and
  build.
- **Generic, but only if the prebuild hook exists.** Without it this is a
  guaranteed production outage.

### 15.23 A stale claim shipped inside the UI after being "removed"

- **What happened:** The demo banner still rendered for `real_alpha` after being
  reported as removed.
- **Detected by:** Visual QA.
- **Generic.** *Confirm removals by looking at the rendered page.*

### 15.24 Tests that matched the system's own corrections

- **What happened:** A forbidden-claim test failed on `caveats[]`, because
  caveats **quote the removed claim in order to document the correction**.
- **Fixed by:** Scoping forbidden-claim tests to an `asserted()` projection —
  the fields that assert something to a seller (`whyThisAccount`,
  `whyThisPerson`, `whyNow`, `suggestedWayIn`, `triggers`, `hiring`,
  `headcount`) — excluding caveats; and forbidding the *affirmative* claim
  rather than the words.
- **Generic and subtle.** A correction record legitimately contains the text of
  the thing it corrects. Forbidden-claim tests must target assertions, not
  vocabulary.

### 15.25 Product environment rendered the same tool twice

Covered in §13. Same evidence, two states, one drawer.

### 15.26 Duplicate React keys and a plural bug

`sources.map` keyed on `s.url` while one account cites the same URL twice;
`"1 advertised locations"`. Both found in visual QA, both fixed and tested.
**Generic lesson: visual QA finds a class of defect that no assertion suite is
looking for.**

---

## 16. Test architecture

**618 tests across 30 files.** Runner: Vitest 4, `environment: 'node'` by
default; the four `.tsx` suites opt into jsdom with a
`// @vitest-environment jsdom` docblock (Vitest 4 removed
`environmentMatchGlobs`).

### The categories, and what they actually test

| Category | Files | Runs against | Reusable? |
| --- | --- | --- | --- |
| **Schema / data integrity** | `validation.test.ts` (38) | Shipped dataset | **Unchanged** |
| **Identity resolution** | `discovery.test.ts` (18) — `canonicalDomain`, `companyKey`, `personKey`, dedupe | Pure functions | **Unchanged** |
| **ATS detection + resolution** | `ats.test.ts` (12), `alphaAdapters.test.ts` (20) | Pure + fixtures | **Unchanged** |
| **ATS ownership / trust** | `phase8Ats.test.ts` (7) | Pure | **Unchanged** |
| **Signal classification + lifecycle** | `signals.test.ts` (11), `deriveSignals.test.ts` (9), `cosStateChange.test.ts` (11) | Pure | With config |
| **Persona classification** | `personas.test.ts` (11), `phase8Persona.test.ts` (5) | Pure | Mechanism reusable; **assertions BOND-specific** |
| **Scoring** | `userFit` (26), `environmentFit` (25), `timing` (20), `priority` (11), `eligibility` (16) | Pure | **Assertions are BOND weights — reset** |
| **Evidence classification** | `stackExtraction.test.ts` (12), `painEvidence.test.ts` (19) | Pure | Mechanism reusable |
| **Routing** | `relationshipChannel.test.ts` (19) | Pure | With config |
| **Commercial-layer non-interference** | `commercialReview.test.ts` (8) | Types + data | **Unchanged — high value** |
| **Queue admission + forbidden claims** | `phase8Queue.test.ts` (30) | **Shipped queue JSON** | **Mixed — split carefully** |
| **Final queue facts** | `finalQueue.test.ts` (50) | **Shipped queue JSON** | **BOND-specific — delete** |
| **Views** | `phase8Views.test.ts` (12) | Data | With config |
| **UI discoverability + drawer** | `detailDiscoverability.test.tsx` (30) | Rendered DOM | Mixed |
| **Presentation + creator** | `presentation.test.tsx` (27) | Rendered DOM | Mixed |
| **Responsive** | `mobilePresentation.test.tsx` (13) | Rendered DOM | **Mostly unchanged** |
| **Thesis** | `targetingThesis.test.tsx` (36) | Content + DOM | **BOND-specific — delete** |
| **Filtering / sorting / dates / copy** | `filtering` (17), `dates` (7), `copy` (16) | Pure | Mixed |

### The most valuable and most transferable patterns

**1. Tests that run against the shipped data, not fixtures.**
`phase8Queue.test.ts` and `finalQueue.test.ts` load the actual
`gtm-queue-v8.json`. This catches drift between code and data — a class of bug
unit tests cannot see.

**2. Forbidden-claim tests.** Assert that certain *claims* never appear in the
fields that assert something to a seller:

```ts
const asserted = (e) => JSON.stringify({
  whyThisAccount: e.whyThisAccount, whyThisPerson: e.whyThisPerson,
  whyNow: e.whyNow, suggestedWayIn: e.suggestedWayIn,
  triggers: e.triggers, hiring: e.hiring, headcount: e.headcount,
})   // caveats deliberately excluded — see §15.24
```

**3. Invariant tests that outlive any specific conclusion.** These should be
copied to Radar #2 essentially unchanged:

- "never phrases an unknown as an absence"
- "never renders unknown tooling as absence"
- "never invents familiarity in a suggested way in"
- "never makes raw vacancy volume the leading reason to call"
- "keeps diagnostics and exclusions visible rather than deleting them"
- "backs every claimed role verification with a source or stated provenance"
- "states at least one caveat or open question per queued account"
- "never lists the primary person again as their own secondary contact"
- "gives every way-in hook source provenance"
- "treats quotes as optional — not every account has one"
- "backs every confirmed tool with a quote and a source"
- "shows Slack once, not under two evidence classes"
- "ships with no fabricated first-party data"

**4. Source-file assertions.** Some tests read the component source and assert a
structural property (`object-cover` on the portrait; the null-portrait branch
exists). Unusual, but effective for properties that are hard to assert from
rendered output.

**5. Ordering tests on rendered headings.** The drawer's section order is
asserted from `getAllByRole('heading')`, so a reorder that breaks the intended
narrative fails.

### What a future instance should test that this one does not

**RECOMMENDED — not implemented here:**

- **Raw universe immutability** — assert `prospects.json` is byte-identical
  before and after a review build.
- **Company-instance isolation** — assert no file contains another company's
  name, domain or account id (a mechanised §20).
- **Verified-facts schema** — assert every correction carries `supersedes` and
  every person entry carries `verifiedBy` or a source.
- **Persona × source observability** — assert every Tier 1 persona is observable
  by at least one enabled source.
- **Idempotence** — run each mutating script twice, assert identical output.
- **Accessibility** — beyond the current focus-restore and dialog-role
  assertions.
- **Clean-clone build** — currently a manual step (§18).

### Classification for reuse

| Bucket | Which |
| --- | --- |
| **Reusable unchanged** | validation, discovery/dedupe, ats, phase8Ats, dates, commercialReview, the invariant tests above, most of mobilePresentation |
| **Reusable with config** | signals, deriveSignals, cosStateChange, relationshipChannel, filtering, phase8Views, the generic half of phase8Queue |
| **Must be reset** | all scoring-weight suites, personas, phase8Persona, finalQueue, targetingThesis, the copy/content halves of the `.tsx` suites |

**Why the distinction matters:** a scoring test that asserts
`scorePersonaRelevance('chief_of_staff') === 35` is not a test of correctness. It
is a **pinned BOND conclusion**. Carrying it into Radar #2 would silently import
BOND's ICP as a passing test.

---

## 17. UI / UX architecture

### The four views

| View | Question it answers | Default |
| --- | --- | --- |
| **GTM Queue** | "Who should I contact now, and what do I say?" | **Yes**, when a queue exists |
| **All prospects** | "What did the model surface, and how does it score?" | Fallback |
| **New signals** | "What changed in the last 30 days?" | — |
| **Targeting Thesis** | "Why these people at all?" | — |

`App.tsx` initialises to `all_prospects`, then switches to `gtm_queue` once
`loadQueue()` returns a non-empty file (one-time, guarded by `viewInitialised`).

**Why the queue is the landing view.** The frozen model returns zero `call_now`.
Opening on the raw table would misrepresent the work as having found nothing,
while six reviewed, defensible accounts exist. The model's honest zeros remain
visible on the discovery surface they describe. This is a direct
consequence of failure 15.17.

### The funnel

Replaces the KPI row on the queue view: **648 Discovered → 173 New signals → 10
Reviewed → 6 GTM Queue**, with the queue stage highlighted.

Counts are **props computed in `App.tsx` from exactly the data each view
renders** — `prospects.length`, `newSignalCount`, `queue.entries.length +
queue.notInQueue.length`, `queue.entries.length`. Nothing is hard-coded, so a
headline number cannot drift from what a click actually shows.

### Components

| Component | Role |
| --- | --- |
| `Header` | Title, one-line purpose, dataset metadata, Methodology trigger |
| `CreatorCard` | Attribution byline, directly under the header |
| `Funnel` + `ViewNote` | Funnel; one-line provenance note per view |
| `RadarTabs` | Scrollable tab strip (`overflow-x-auto` below `md`) |
| `KpiCards` | Model heuristics — **discovery view only** |
| `QueueTable` + `QueueCards` | Account-first table (`hidden md:block`) / cards (`md:hidden`) |
| `ProspectTable` + `ProspectCards` | Same pattern for discovery |
| `Filters` | Collapsible below `md` |
| `AccountDrawer` | The research brief (§12) |
| `ProspectDrawer` | Model-side detail incl. `ScoreBreakdown` |
| `TargetingThesis` | The thesis page |
| `Methodology` | Modal: what is observed, inferred, hypothetical, and what would falsify it |
| `Badges`, `SourceList`, `ViewDetails`, `Footer`, `DemoBanner` | Shared primitives |

### Evidence presentation primitives — the reusable core

| Primitive | Behaviour |
| --- | --- |
| `EvidenceClassChip` | confirmed = sage · proxy = amber · unknown = **dashed neutral** · contradicted = neutral |
| `RoleMark` | Role-currency verification mark next to a name |
| `VerdictChip` | Commercial verdict |
| OBSERVED / INTERPRETATION | Literal headings on every trigger |
| Sources list | label · **what it establishes** · publisher · retrieved date · authority |
| Caveats / Open questions | Own sections, above sources |
| Model diagnostics | Last, explicitly labelled |
| Recency | Relative age **plus** an explanation when undated |

The recurring principle: **uncertainty gets its own visual language, and that
language is neutral rather than negative.**

### Desktop vs mobile

Single breakpoint: `md`. Below it, tables are replaced by cards carrying the
same data and the same `onSelect`; the tab row scrolls horizontally; filters
collapse behind a toggle. Above it, nothing changed from the desktop design.

`src/index.css` sets `overflow-x: clip` on the root — **`clip`, not `hidden`**,
with the reason in a comment: `hidden` would make the root a scroll container
and break `position: sticky` and programmatic scrolling. Wide tables scroll
inside their own `overflow-x-auto` container.

### Accessibility

- Drawers are `role="dialog"`, focus the close button on open, and **restore
  focus to the element that opened them** on close.
- Escape closes.
- Body scroll is locked while any overlay is open.
- Rows are keyboard-activatable; nested links call `stopRowActivation`.
- Single `h1` per page (the thesis hero was demoted to `h2` to fix a duplicate).
- Portrait has descriptive alt text; a monogram fallback prevents a broken image.

### Reusable interaction patterns vs BOND content

**Reusable:** the four-view split; queue-first default; funnel from live counts;
card/table swap; drawer-as-brief with a fixed section order; evidence chips;
observed/interpretation separation; caveats and open questions as first-class
sections; model diagnostics last; per-view provenance notes; methodology modal.

**BOND-specific:** every string. Tab labels, view descriptions, the funnel stage
names, `PRIORITY_LABELS`, `PRIORITY_MEANING`, persona labels, the entire thesis,
the creator card, page title and meta description.

---

## 18. Deployment architecture

### CURRENT IMPLEMENTATION

| Element | Value |
| --- | --- |
| Repo | GitHub `louisengelen3-cyber/bond-signal-radar`, **private** |
| Host | Vercel, team `heyantwerp`, project `bond-signal-radar` |
| Project id | `prj_Cvu3qISFf8rZfyTDVEqkGSvakeO5` (in gitignored `.vercel/project.json`) |
| Framework | Vite (`vercel.json`) |
| Build | `npm run build` → `prebuild` (`sync-data`) → `tsc -b && vite build` |
| Output | `dist/` (~13 MB, dominated by JSON) |
| Node | Project setting **24.x**; `package.json` has **no `engines` field** |
| Trigger | Push to `main` auto-deploys to production |
| Indexing | `noindex, nofollow` via both `<meta>` and `X-Robots-Tag` |
| Runtime | **Static. No backend, no env vars, no secrets** |

### Data generation at build time

`public/data/` is gitignored. `prebuild` runs `sync-data`, which copies
`data/verified/` (or `data/fixtures/` when no real dataset exists) into
`public/data/`. A clean clone therefore builds correctly with no manual step.

**This is load-bearing.** Without the `prebuild` hook, a clean clone would build
an app that fetches JSON that does not exist. Verified by cloning to a temp
directory and running a full install and build before release.

### The deployment identity problem

**What happened:** Vercel rejected the deployment — *"the commit email
`louisengelen@mac.home` could not be matched to a GitHub account."* Vercel
attributes each git-linked deployment to a GitHub user via the commit author
email. A default `user@hostname` matches nobody.

**How it was fixed:** the verified GitHub email was set **repo-locally**
(`git config user.email`, not `--global`), then an empty commit re-triggered the
deploy. It succeeded in 17 seconds.

**How to prevent it in any future repository — before the first deploy:**

```bash
git config user.email          # must be a VERIFIED email on the GitHub account
git log -1 --format='%ae'      # what Vercel will actually read
```

If it is a `.local`/`.home` hostname address, fix it repo-locally first. Do not
change the developer's global git configuration without being asked.

### Proving the deployment is independent of the developer's machine

Run all of these against the **production URL**, never localhost:

```bash
# 1. Served, not local
curl -s -o /dev/null -w '%{http_code}\n' https://<production-url>/

# 2. The deployed bundle contains the change
js=$(curl -s https://<production-url>/ | grep -o '/assets/index-[A-Za-z0-9_-]*\.js' | head -1)
curl -s "https://<production-url>$js" > /tmp/prod.js
grep -c "<a distinctive new string>" /tmp/prod.js

# 3. Runtime data is served from the same origin
curl -s https://<production-url>/data/gtm-queue-v8.json | head -c 200

# 4. Indexing headers
curl -sI https://<production-url>/ | grep -i x-robots-tag

# 5. Clean-clone build — no local state at all
git clone <repo> /tmp/clean && cd /tmp/clean && npm install && npm run build
```

Additional checks: no service worker is registered (this app has none); no
`localhost` string in the built bundle; open the URL in a private window on a
different network.

**A trap worth recording.** During verification, a polling loop reported
"waiting…" for five minutes while comparing the *local* bundle hash to the
*live* one. The deploy had already succeeded — the hashes differed for build-
environment reasons, and the CDN briefly served a stale bundle on the alias.
**Verify by content, not by hash**, and check both the deployment URL and the
production alias.

### Rollback

Every release is an annotated tag.

**Fastest — Vercel dashboard:** Deployments → select the deployment → *Promote
to Production*. No rebuild; Vercel retains previous build output.

**From git:**

```bash
git checkout <tag>
git log -1
git push --force-with-lease origin <tag>^{commit}:main
```

**Inspect a release locally without touching the remote:**

```bash
git checkout <tag> && npm install && npm run build && npx vite preview
```

### Release verification gate

All must pass before tagging:

```bash
npm test                # 618 tests
npm run validate-data   # dataset integrity, exits non-zero on error
npm run validate-queue  # queue admission rules, exits non-zero on error
npx tsc -b              # typecheck, all four projects
npm run build           # production build
```

Then desktop and mobile visual QA against the rendered production page (§15.10,
§15.23 and §15.26 were all found this way and by nothing else).

Release tags, newest first: `v7-verified-queue`, `v6.1-presentation`,
`v6-bond-share-ready`, `v6-targeting-thesis`, `v5-commercial-truth`,
`phase8-start`, `v4-commercial-ready`, `v4-shortlist-verified`,
`v4-post-alpha-ship`, `v4-real-data-alpha`, `v3-gtm-architecture`,
`v2-person-first`, `v1-company-centric`.

---

## 19. New-company bootstrap process

A phase playbook for Radar #2. Sequence improved over the requested one in three
places, marked **[revised]**.

> **HARD STOP after Phase 5.** No large-scale discovery until the Targeting
> Thesis, persona model and signal-observability plan are approved by a human.

### PHASE 0 — Isolate the instance

- **Input:** this document; the BOND repository as read-only reference.
- **Action:** create a **new repository**. Copy only engine files (§3A). Copy no
  data, no thesis, no reviews, no queue, no tags, no `.vercel/`. Reset
  `package.json` name/description and `index.html` title/description.
- **Output:** an empty instance that builds and serves fixtures.
- **Release gate:** `npm install && npm test && npm run build` pass; §20
  checklist passes on an empty repo.
- **Common failure:** developing Radar #2 inside the BOND repository "just to
  start".
- **DO NOT CONTINUE IF:** any BOND data file, account id or the BOND production
  URL is present.

### PHASE 1 — Understand the target product

- **Input:** the company's own public material only.
- **Action:** what does it do, what must it connect to, who uses it, who buys
  it, what has to be true inside a company for it to be worth paying for. Record
  every claim with a URL.
- **Output:** a sourced product brief (the future `BOND_BASIS` equivalent).
- **Gate:** every product claim has a first-party source.
- **Failure:** inferring the product from its marketing headline.
- **DO NOT CONTINUE IF:** you cannot state the problem it solves in one sentence
  citing the company's own words.

### PHASE 2 — Collect first-party material

- **Action:** company site, docs, blog, careers page, founder/exec public
  writing. Store URLs and retrieval dates. **Do not use search-engine snippets
  as evidence.**
- **Output:** a source list with `authority` per source.
- **Gate:** enough first-party material to make and *challenge* thesis claims.
- **Failure:** collecting only material that supports the intended thesis.

### PHASE 3 — Build the Targeting Thesis

- **Action:** write it as structured data with an evidence class on every claim.
  Include: what the product is (first-party sourced) · ICP · why-now hypotheses
  · qualification criteria · what would falsify it · deliberate omissions.
- **Output:** `src/content/targetingThesis.ts` equivalent + a markdown mirror.
- **Gate:** every claim is `sourced | observed | hypothesis | rejected`. Nothing
  unmarked.
- **Failure:** writing the thesis to justify sources you already have.

### PHASE 4 — Define personas

- **Action:** primary, secondary, **anti-personas**, and the precedence rules
  between them. Define what beats what (the "functional remit beats founder
  status" analogue). Decide how founder/owner status is represented — as an
  attribute, not a remit.
- **Output:** persona taxonomy + a classifier with ordered patterns.
- **Gate:** every persona has a written definition distinguishing it from its
  neighbours.
- **Failure:** copying BOND's `PersonaType` enum.

### PHASE 5 — Signal + observability plan **[revised: merged and made blocking]**

- **Action:** list candidate signals. For each: commercial value (hypothesis)
  **and** public detectability, as two independent ratings. Then build the
  **persona × source observability matrix** (§8): hand-collect 20 people per
  candidate source and classify them.
- **Output:** signal matrix + persona/source matrix.
- **Gate:** **every Tier 1 persona is observable by at least one candidate
  source.** A zero row is a blocking finding.
- **Failure:** **this is exactly where the BOND radar failed.** It named Chief
  of Staff Tier 1 and used sources that only ever surface founders.
- **DO NOT CONTINUE IF:** a Tier 1 persona has no source that can observe it and
  the thesis has not been amended to say so.

> ### ⛔ HUMAN APPROVAL REQUIRED HERE
> Present the Targeting Thesis, persona model and signal-observability plan.
> **Do not begin large-scale discovery before approval.** Everything downstream
> inherits these three artifacts; discovering 600 of the wrong people is cheap
> to start and expensive to unwind.

### PHASE 6 — Define the relevant product environment

- **Action:** from the product brief, list what the product must connect to or
  coexist with. Classify each as **gate / qualifier / context**. Decide which
  are publicly observable. Write tool patterns and internal-use classification
  rules.
- **Output:** environment category definitions + extraction rules.
- **Gate:** every category traces to a product requirement, not to what is easy
  to detect.
- **Failure:** copying `TOOL_DEFINITIONS`; making something a gate because BOND
  made Slack a gate.

### PHASE 7 — Configure discovery sources

- **Action:** populate the source registry. Record `enabled: false` +
  `not_implemented` honestly. Register deliberately excluded sources as
  `not_permitted_yet` **with the reason**.
- **Output:** the registry.
- **Gate:** every enabled source has a working adapter verified against the live
  source; every disabled one says why.
- **Failure:** registering a source as enabled before its adapter is verified.

### PHASE 8 — Company discovery

- **Action:** run discovery. Dedupe on canonical domain. Apply a cheap screen.
- **Output:** raw candidates + screened companies.
- **Gate:** raw output written to `data/discovery/` and never modified
  afterwards.
- **Failure:** letting a screen quietly encode ICP assumptions not in the thesis.

### PHASE 9 — Person discovery

- **Action:** run it as a **separate stage** with sources chosen in Phase 5.
- **Output:** people with titles, sources and persona classifications.
- **Gate:** **re-run the persona × source matrix on the real output.** Compare
  with Phase 5's sample.
- **Failure:** the founder-bias failure. Check the actual distribution; do not
  assume the sample generalised.
- **DO NOT CONTINUE IF:** the real distribution has a zero row for a Tier 1
  persona.

### PHASE 10 — Signal detection and enrichment

- **Action:** resolve ATS boards; fetch postings **with bodies**; extract
  environment evidence; derive signals with `eventDate` and `detectedAt`.
- **Output:** the raw prospect universe.
- **Gate:** every signal has a source and a date; no signal without provenance.
- **Failure:** persisting jobs without descriptions — the BOND repo cannot audit
  ownership offline because of this (§34).

### PHASE 11 — Audit source quality and identity **[revised: before scoring]**

- **Action:** run the ATS ownership audit. Check identifier collisions. Compute
  the source-bias ratio (which company types are over-represented in the
  triggered band). Verify the classifier in **both directions** on real data.
- **Output:** trust states, quarantine flags, a bias report.
- **Gate:** every board is `verified_internal` or explicitly flagged; the audit
  is **idempotent** (run it twice, compare).
- **Failure:** all of §15.1–15.4.
- **DO NOT CONTINUE IF:** boards are unaudited. Scoring contaminated data
  produces a confidently wrong ranking.

### PHASE 12 — Score and rank

- **Action:** score with the new weights. Treat output as a **research
  prioritiser**.
- **Output:** ranked prospects.
- **Gate:** scoring is pure and deterministic; re-derived at load; no stored
  score is trusted.
- **Failure:** tuning weights until the desired accounts win.

### PHASE 13 — Commercial review

- **Action:** for each candidate answer the §11 questions. Assign a verdict.
  Write caveats and open questions. Record sources with what each *establishes*.
- **Output:** review records.
- **Gate:** every record has a why-now, a way-in with source provenance, and at
  least one caveat or open question.
- **Failure:** reviewing only the top of the model's ranking.

### PHASE 14 — Manual verification

- **Action:** verify anything release-critical automation cannot establish.
  Record in the verified-facts file with `verifiedBy` and, where a value is
  corrected, `supersedes`.
- **Output:** verified facts.
- **Gate:** **no invented URLs.** Where no linkable source exists, state the
  provenance.
- **Failure:** rejecting a human-verified fact because the runtime cannot
  reproduce it. *Unable to scrape ≠ fact unknown.*

### PHASE 15 — Construct the queue

- **Action:** run the builder. Apply verdict filter and blockers. Order by
  commercial judgment.
- **Output:** the queue + `notInQueue` + `blockedFromQueue`.
- **Gate:** `validate-queue` returns zero errors. **Apply the stopping rule and
  record it in the file.**
- **Failure:** padding to a target number.
- **DO NOT CONTINUE IF:** any account is in the queue only to reach a count.

### PHASE 16 — Adversarial factual review

- **Action:** try to **refute** every material claim. For each: what would make
  this wrong? Check dates against each other (the Mytos backfill error was
  caught exactly this way). Check verbs for overclaim.
- **Output:** corrections, weakened claims, possibly removals.
- **Gate:** every surviving claim has been attacked at least once.
- **Failure:** reviewing your own work in the same frame that produced it.

### PHASE 17 — UI QA **[revised: desktop AND mobile, on the rendered page]**

- **Action:** open **every** queue drawer at desktop and at 390px. Check section
  order, evidence chips, plurals, duplicate rendering, horizontal overflow, and
  whether any two numbers on screen contradict each other.
- **Gate:** zero horizontal overflow; no `unknown` rendered as absence; no
  duplicated evidence.
- **Failure:** trusting the test suite. §15.10, §15.23, §15.25 and §15.26 were
  all found only by looking.
- **Instrument warning:** if a measurement survives a condition that should make
  it impossible, the instrument is broken (§15.19).

### PHASE 18 — Clean-clone validation

- **Action:** clone to a temp directory, `npm install`, `npm run build`.
- **Gate:** builds with no manual step and no local state.
- **Failure:** the generated-data gap (§15.22).

### PHASE 19 — Deploy

- **Action:** check `git log -1 --format='%ae'` against a verified GitHub email
  **first**. Create the Vercel project. Set `noindex`. Add `.vercelignore`.
  Push.
- **Gate:** deployment succeeds and is attributed correctly.
- **Failure:** §15.20.

### PHASE 20 — Production smoke test

- **Action:** the §18 independence checks, against the production URL, in a
  private window.
- **Gate:** all pass. **Verify by content, not by bundle hash.**

### PHASE 21 — Outreach

- **Note:** **not implemented in this architecture.** The queue is the
  deliverable. Outreach happens outside the system, and any outcome data coming
  back is authorised first-party data that must enter through a separate,
  clearly marked ingestion path (§32).

---

## 20. Clean-room / contamination checklist

Complete **before** running Radar #2 discovery. Each item is mechanically
checkable.

### Data

- [ ] No BOND company names anywhere: `grep -ril "insify\|abacum\|encord\|ashby\|overview\.ai\|mytos\|weekday\|tilt\.io\|trm labs\|checkr\|instacart\|canary\|topline" .`
- [ ] No BOND queue accounts — `data/verified/gtm-queue-v8.json` absent or empty
- [ ] No BOND quotes — `grep -ri "the whole picture\|blueprint for this role\|30 cities across 10 countries\|room you're given"`
- [ ] No BOND first-party content — `BOND_SOURCES`, `BOND_BASIS` gone
- [ ] No BOND verified facts — `verified-facts.json` reset to an empty skeleton
- [ ] No BOND commercial reviews — `commercial-review-v8.json`, `commercial-review.json`, `shortlist.json`, `top10-review.json`, `persona-audit.json`, `ats-audit.json` absent
- [ ] No BOND prospect universe — `prospects.json`, `companies.json`, `people.json`, `metadata.json` absent or regenerated
- [ ] No BOND raw discovery — `data/discovery/*` cleared
- [ ] No BOND fixtures — `data/fixtures/*` and `scripts/fixtures/demo-universe.ts` rebuilt
- [ ] **No BOND account IDs reused** — account ids are domain-derived; grep for BOND domains
- [ ] No BOND source caches treated as new evidence — `.cache/` deleted

### Thesis and targeting logic

- [ ] No BOND Targeting Thesis claims — `src/content/targetingThesis.ts` rewritten from zero
- [ ] `docs/TARGETING_THESIS.md` and the source `.docx` removed
- [ ] No BOND personas assumed — `PersonaType` members redefined
- [ ] No BOND persona hierarchy — `scorePersonaRelevance` bands redefined; "Chief of Staff = Tier 1" gone
- [ ] No BOND anti-personas — `ANTI_PERSONA_PATTERNS` rewritten
- [ ] No BOND signal weights — `TIMING_MAX`, `USER_FIT_MAX`, `ENVIRONMENT_MAX`, `BASE_FIT_WEIGHTS`, `QUEUE_SCORE_WEIGHTS` re-derived
- [ ] No BOND trigger hierarchy — `SignalType` members redefined; `cos_*` gone
- [ ] No BOND qualification thresholds — every number in `derivePriority` re-derived
- [ ] No BOND routing assumptions — `RelationshipState` ordering reviewed; **`public_bond_engagement` renamed**
- [ ] No BOND environment assumptions — `TOOL_DEFINITIONS`, `bondRelevant`, and the Slack eligibility gate reconsidered from the new product
- [ ] No BOND pain themes — `PainTheme` members redefined
- [ ] `EnvironmentEvidence.bondRelevant` renamed to a product-neutral name

### Tests

- [ ] No BOND-specific forbidden-claim tests carried over incorrectly — a test forbidding *"is a backfill"* is BOND-specific; a test forbidding *unknown rendered as absence* is generic
- [ ] `tests/finalQueue.test.ts` deleted
- [ ] `tests/targetingThesis.test.tsx` deleted
- [ ] `tests/phase8Persona.test.ts` deleted
- [ ] `tests/phase8Queue.test.ts` **split**: generic invariants kept, BOND assertions deleted
- [ ] Scoring suites reset to the new weights
- [ ] `.tsx` suites stripped of BOND copy assertions

### Deployment and identity

- [ ] No BOND production URL in code, docs, or tests
- [ ] No BOND deployment/project id — `.vercel/` deleted (`prj_Cvu3q…`, `team_qHso1…`)
- [ ] New GitHub repository, not a fork of the BOND one
- [ ] No BOND release tags
- [ ] `package.json` name and description reset
- [ ] `index.html` title and meta description reset
- [ ] `public/louis-engelen.png` removed unless the same person built it
- [ ] `src/config/creator.ts` reset
- [ ] Root phase reports (`PHASE_8_*`, `POST_ALPHA_*`, `SHORTLIST_*`, …) removed or clearly archived as *reference from a different company*
- [ ] `README.md` rewritten
- [ ] `docs/BOND_SIGNAL_RADAR_SPEC.md` removed — **note:** code comments reference its section numbers (§7, §87, §90…). Either keep it as an archived reference or renumber the comments. Do not leave dangling references.

### Final mechanical sweep

```bash
grep -ril "bond" --exclude-dir=node_modules --exclude-dir=.git . | grep -v REUSABLE_SIGNAL_RADAR_ARCHITECTURE
```

Every remaining hit must be either intentional (this architecture document) or
removed. **Expect hits in code comments and type names** — `bondRelevant`,
`public_bond_engagement`, `BOND_BASIS`, `bond-crm`, `bond-product`, and dozens
of explanatory comments.

---

## 21. Ideal future template architecture

**RECOMMENDED FUTURE ARCHITECTURE — nothing below is built. Do not perform this
refactor now.**

### Proposed structure

```text
/engine                  Company-agnostic mechanism
  /discovery             registry types, dedupe, identity resolution, source health
  /adapters/ats          7 ATS providers, detect/resolve/dispatch/normalize
  /adapters/boards       Getro, YC-style crawlers
  /evidence              Evidence/Source/provenance types, classification vocabulary
  /trust                 ATS ownership, quarantine, identity collision
  /review                Review record types, queue blockers, comparator
  /validation            Schema + integrity validation
  /precedence            raw → verified → authored resolution (NEW — see §5)

/company-config          One directory per radar instance
  product-brief.ts       First-party sourced product claims
  personas.ts            Taxonomy + classifier patterns + precedence
  signals.ts             Signal types, lifetimes, weights
  environment.ts         Categories, tool patterns, gate/qualifier/context
  scoring.ts             All weights and thresholds
  routing.ts             Relationship states and channel rules
  thesis.ts              The Targeting Thesis as structured data

/data
  /raw                   Discovery output. WRITE ONCE per run, never edited
  /derived               Scored universe
  /human-verified        verified-facts.json  (renamed from data/verified)
  /review                Commercial review records
  /queue                 The shipped queue + export

/ui
  /primitives            EvidenceChip, VerdictChip, SourceList, OBSERVED/INTERPRETATION
  /views                 Queue, Prospects, Signals, Thesis
  /brief                 The account drawer

/tests
  /generic               Invariants that hold for every radar
  /company               Assertions about this instance's data and conclusions

/deployment              vercel.json, .vercelignore, release checklist
```

### Per-module assessment

| Module | Generic? | Current files | Difficulty | Risk | Benefit |
| --- | --- | --- | --- | --- | --- |
| `engine/adapters/ats` | **Fully** | `src/data/ats/*` (12) | **Low** | **Low** | High — most self-contained, most reusable |
| `engine/trust` | **Fully** | `src/enrichment/atsTrust.ts` | **Low** | **Low** | High — prevents the worst failure class |
| `engine/discovery` (dedupe/identity) | **Fully** | `src/discovery/dedupe.ts`, `sourceHealth.ts` | **Low** | **Low** | High |
| `engine/validation` | Mostly | `src/validation/*`, `src/review/validate.ts` | Low | Low | High |
| `engine/review` | **Fully** | `src/review/commercial.ts` | **Low** | **Low** | **Highest — the core idea** |
| `engine/evidence` | Structure yes, enums no | Parts of `src/types/radar.ts` | **Medium** | **Medium** | High — but requires splitting a 700-line type file whose enums are company-specific |
| `engine/precedence` | N/A — **new** | inline `??` in `build-commercial-review.ts` | Medium | Medium | High — makes §5 structural instead of procedural |
| `company-config/*` | By definition not | Scattered across `src/scoring`, `src/content`, `src/enrichment` | **High** | **High** | High — but this is the extraction that proves the abstraction, and one instance is not enough evidence |
| `ui/primitives` | Mostly | `AccountDrawer.tsx` internals, `Badges.tsx` | Medium | Low | Medium |
| `ui/views` | Patterns yes, copy no | `src/components/*` | High | Medium | Medium |
| `data/*` rename | N/A | `data/verified` → `data/derived` + `data/human-verified` | **Low** | **Low** | **High — removes a genuinely misleading name** |
| `tests/generic` vs `tests/company` | Yes | `tests/*` | Medium | **Medium** | High — but requires splitting mixed files carefully |

### Highest-value, lowest-risk moves (if a refactor is ever authorised)

1. **Rename `data/verified/`.** It holds the *live* dataset, not verified facts.
   This name has already caused confusion. Pure rename.
2. **Extract `engine/adapters/ats` and `engine/trust`.** Zero company coupling.
3. **Extract `engine/review`.** `src/review/commercial.ts` is already generic.
4. **Split the tests** into generic invariants and company assertions.
5. **Make precedence a function.** Replace the inline coalesce chain.

Everything else should wait for Radar #2.

### What looks generic but cannot yet be proven generic

Expanded in §35. In short: **one implementation is one data point.** The
temptation after building a system that works is to extract a framework from it.
With `n = 1`, the extraction will encode this instance's accidents as the
framework's assumptions.

---

## 22. Exact execution / command map

### Prerequisites

| Requirement | Value |
| --- | --- |
| Node | **24.x** (Vercel project setting). Local: v24.18.1. **`package.json` has no `engines` field — this is a gap** |
| Package manager | npm (`package-lock.json` is committed) |
| TypeScript | 7.x, four-project build (`tsconfig.json` → app / node / components) |
| Network | Required for `discover`, `enrich`, `audit-ats`. Everything else is offline |

### Install and run

```bash
npm install
npm run dev        # predev → sync-data, then vite
npm run build      # prebuild → sync-data, then tsc -b && vite build
npm run preview    # serve dist/
npm test           # vitest run — 618 tests
npm run typecheck  # tsc -b
```

### Full command reference

Legend — **RAW**: can alter `data/discovery/` · **UNIVERSE**: can alter
`data/verified/prospects.json` and siblings · **COMMERCIAL**: can alter review /
queue files.

| Command | Reads | Writes | Repeatable? | RAW | UNIVERSE | COMMERCIAL |
| --- | --- | --- | --- | --- | --- | --- |
| `npm run seed` | `scripts/fixtures/demo-universe.ts` | `data/fixtures/*` | Yes | No | No (fixtures only) | No |
| `npm run discover` | registry, live sitemaps/JSON | `data/discovery/{raw-candidates,discovered-companies,source-registry,source-state}.json` | Yes | **YES — overwrites** | No | No |
| `npm run enrich` | discovered companies, **live ATS** | `data/verified/{companies,people,prospects,metadata,manual-enrichment}.json` | Yes | No | **YES — rewrites** | No |
| `npm run refresh-data` | seeds | same four | Yes | No | **YES** | No |
| `npm run refresh-data -- --offline` | seeds | same four | Yes | No | **YES** | No |
| `npm run audit-ats` | `prospects.json`, **live boards** | `prospects.json`, `ats-audit.json` | **Yes — clears stale flags first** | No | **YES** (quarantine flags only; never deletes) | No |
| `npm run ingest-funding` | hardcoded events | `prospects.json` | Yes | No | **YES** (adds funding) | No |
| `npm run refresh-phase8` | `prospects.json` | `prospects.json` | Yes | No | **YES** (re-derives) | No |
| `npm run build-review-v8` | `prospects.json`, `verified-facts.json`, `AUTHORED` | `commercial-review-v8.json`, `gtm-queue-v8.json` | Yes | No | **No — read-only on raw** | **YES** |
| `npm run validate-data` | prospects, review, shortlist | — | Yes | No | No | No |
| `npm run validate-queue` | review, queue, prospects | — | Yes | No | No | No |
| `npm run export-queue` | `gtm-queue-v8.json` | `gtm-queue-export.json` | Yes | No | No | **YES** (export only) |
| `npm run sync-data` | `data/verified/` or `data/fixtures/` | `public/data/` | Yes | No | No | No |
| `npm run review` | pool + prospects | `commercial-review.json`, `shortlist.json`, reports | Yes | No | No | **YES** (Phase 7 layer) |
| `npm run audit` | prospects | audit reports | Yes | No | No | No |
| `npm run report-alpha` | prospects | `REAL_DATA_ALPHA_REPORT.md` | Yes | No | No | No |
| `npm run import-funding -- file.csv` | a CSV | `manual-enrichment.json` | Yes | No | Enrichment | No |
| `npm run phase8` | — | **runs 7 steps in sequence** | Yes | No | **YES** | **YES** |

`npm run phase8` expands to:

```text
audit-ats → ingest-funding → refresh-phase8 → build-review-v8
          → validate-queue → export-queue → sync-data
```

### Correct order of operations

**Full rebuild from nothing (destructive):**

```text
1. npm install
2. npm run discover          # RAW — overwrites discovery output
3. npm run enrich            # UNIVERSE — rebuilds all 648 prospects
4. npm run audit-ats         # ownership audit, BEFORE trusting any job signal
5. npm run ingest-funding    # verified funding events
6. npm run refresh-phase8    # re-derive after rule corrections
7. npm run validate-data     # must be 0 errors
8. (manual) update data/verified/verified-facts.json
9. (manual) update the AUTHORED array in scripts/build-commercial-review.ts
10. npm run build-review-v8  # COMMERCIAL — rebuilds review + queue
11. npm run validate-queue   # must be 0 errors
12. npm run export-queue
13. npm run sync-data
14. npm test && npx tsc -b && npm run build
```

**Commercial-layer-only change (safe, non-destructive — the common case):**

```text
1. edit verified-facts.json and/or the AUTHORED array
2. npm run build-review-v8
3. npm run export-queue
4. npm run sync-data
5. npm test && npx tsc -b && npm run build
6. npm run validate-data && npm run validate-queue
```

Steps 2–4 **never touch `prospects.json`**. This is the loop used for every
change in the final phases.

### Workflows with no single canonical command — stated explicitly

- **Manual verification.** There is no `npm run verify`. Editing
  `verified-facts.json` is a hand edit with no schema validation.
- **Authoring a commercial review.** There is no CLI. Records are written by
  hand into `AUTHORED` in `scripts/build-commercial-review.ts`.
- **Adding a new account to the queue.** Requires editing TypeScript, not data.
- **Visual QA.** Manual, browser-driven. Not scripted.
- **Clean-clone validation.** Manual (§18).
- **Rollback.** Manual, via Vercel dashboard or a git tag push.
- **Discovery for a new company set.** `discover` is wired to the sources in the
  registry; pointing it elsewhere means writing an adapter.

**RECOMMENDED:** a future instance should add `validate-verified-facts`,
`verify-clean-clone`, and a `review:new-account` scaffold.

---

## 23. Configuration, environment, secrets

### The headline fact

**This application has no runtime configuration and no secrets.** It is a static
site that fetches JSON from its own origin. There are no API keys, no
authentication, no server.

### Configuration inventory

| Name | Purpose | Required | Used by | Default | Class |
| --- | --- | --- | --- | --- | --- |
| `import.meta.env.BASE_URL` | Prefix for data fetches | Yes | `loadRadar.ts`, `loadQueueV8.ts` | `'./'` via `vite.config.ts` `base` | **PUBLIC** |
| `vercel.json` | framework, build, output, `X-Robots-Tag` | Yes | Vercel | — | **PUBLIC** (committed) |
| `.vercelignore` | Upload exclusions | Yes | Vercel CLI | — | **PUBLIC** (committed) |
| `tsconfig*.json` | Four-project build | Yes | tsc | — | **PUBLIC** |
| `vite.config.ts` / `vitest.config.ts` | Build and test | Yes | Vite/Vitest | — | **PUBLIC** |
| `.vercel/project.json` | `projectId`, `orgId`, project settings | Local only | Vercel CLI | — | **LOCAL — gitignored** |
| `.env.local` | Contains `VERCEL_OIDC_TOKEN`, written by the Vercel CLI | No | Vercel CLI | — | **SECRET — gitignored** |
| `.cache/http` | HTTP cache for discovery (196 MB) | No | discovery/enrichment | — | **LOCAL — gitignored** |
| `git config user.email` | Deployment attribution | **Yes for deploys** | Vercel via GitHub | — | **LOCAL** |
| GitHub repo visibility | Private | Yes | — | — | **PUBLIC CONFIG decision** |
| Chrome + browser automation | Visual QA only | No | Manual QA | — | **LOCAL TOOLING** |

### Must never be committed

Currently enforced by `.gitignore`:

```text
node_modules
dist
.DS_Store
*.tsbuildinfo
public/data          # generated — regenerated by prebuild
.cache/              # HTTP cache
.vercel              # project ids and CLI state
.env*                # includes .env.local with VERCEL_OIDC_TOKEN
```

**Verified:** `git ls-files` shows no `.env`, no `.vercel`, no credential file.
The only `public/` file tracked is `louis-engelen.png`.

Also never commit: browser session/profile data, personal notes containing
non-public information about targets, raw exports of any authorised first-party
CRM data, API keys for any future paid data source.

### If a future radar adds authenticated sources

The architecture supports it (`src/discovery/types.ts` has
`crawlStrategy: 'first_party_import'`), but nothing is implemented. Any such
addition must: keep keys in environment variables, never in source; never commit
`.env`; keep first-party data in a separate ingestion path (§32); and record the
source in the registry with its authority and terms status.

---

## 24. Source adapter catalogue

**Only adapters that actually exist are listed.**

### Registry overview

`src/discovery/registry.ts` — **37 registered sources, 7 enabled.**

| Status | Count | Meaning |
| --- | --- | --- |
| `enabled: true` | **7** | Adapter exists and was verified against the live source |
| `not_implemented` | 19 | Recognised as useful, no adapter. Honest, not aspirational |
| `not_permitted_yet` | 8 | **Deliberately excluded**, with the reason recorded |
| `first_party_import` | 2 | Would require the target company to grant access |
| `manual` (disabled) | 1 | — |

### The 7 enabled sources

| id | Type | Strategy | Authority | Purposes |
| --- | --- | --- | --- | --- |
| `ats-greenhouse` | ats | `ats_api` | primary | jobs, environment_evidence, leadership_events |
| `ats-lever` | ats | `ats_api` | primary | jobs, environment_evidence, leadership_events |
| `ats-ashby` | ats | `ats_api` | primary | jobs, environment_evidence, leadership_events |
| `ats-personio` | ats | `ats_api` | primary | jobs, environment_evidence |
| `company-team-pages` | company_site | manual | primary | person_discovery, company_metadata |
| `company-announcement` | company_site | manual | primary | funding, leadership_events |
| `company-handbook` | company_site | manual | primary | environment_evidence |

### ATS adapters — `src/data/ats/`

**Seven providers have code** (`dispatch.ts`): greenhouse, lever, ashby,
personio, recruitee, workable, smartrecruiters. Four are enabled in the
registry. *Having an adapter is not the same as having enabled it.*

| Provider | File | Tenant format |
| --- | --- | --- |
| Greenhouse | `greenhouse.ts` | `boards.greenhouse.io/{id}`, `job-boards.greenhouse.io/{id}`, `boards-api.greenhouse.io/v1/boards/{id}` |
| Lever | `lever.ts` | `jobs.lever.co/{id}`, `api.lever.co/v0/postings/{id}` |
| Ashby | `ashby.ts` | `jobs.ashbyhq.com/{id}`, `api.ashbyhq.com/posting-api/job-board/{id}` |
| Personio | `personio.ts` | `{id}.jobs.personio.de` / `.com` |
| Recruitee | `recruitee.ts` | `{id}.recruitee.com` |
| Workable | `workable.ts` | `apply.workable.com/{id}`, `{id}.workable.com` |
| SmartRecruiters | `smartrecruiters.ts` | `jobs.smartrecruiters.com/{id}`, `careers.smartrecruiters.com/{id}` |

Shared: `detect.ts` (URL → provider + identifier, **conservative — never guesses
from a company name**), `resolve.ts` (candidate generation + **live
verification**), `dispatch.ts`, `normalize.ts`, `http.ts` (timeouts, retries,
caching).

**Discovers:** job openings. **Extracts:** id, title, location, department, url,
publishedAt, and **description where the vendor provides one**.
**Signals it can detect:** role-type vacancies, hiring volume, hiring pressure,
location spread, and — via description text — environment evidence.
**Cannot reliably detect:** whether the seat is actually empty · whether a
posting is a backfill · who the employer is *without reading the body* ·
company offices (locations are advertised job locations) · anything about
non-advertising companies.

**Identity resolution:** slug from careers URL (preferred) or generated from
domain/name, verified against the live endpoint. A 404 means *the guess was
wrong*, not *no jobs* → `AtsResolution: 'unknown'`, never `'none'`.

**Contamination risks:** identifier collision (§15.3) · marketplace/client jobs
(§15.1) · stale postings. Mitigated by `src/enrichment/atsTrust.ts`.

**Freshness:** live at fetch time. Job **descriptions are not persisted**, so the
ownership audit must re-read boards live.

**Reusable:** yes, entirely. No product-specific assumptions.

### `src/discovery/sources/ycombinator.ts`

**Discovers:** companies + founders. **Extracts:** name, domain, description,
location, batch, team size, careers URL, **people (name, title, bio)**.
**Method:** an unofficial JSON mirror enumerates slugs cheaply
(`discovery_only`), then the **official company profile page** is fetched as the
primary record for any score-driving fact.
**Cannot reliably detect:** non-founder personas · current employment · anything
about non-YC companies.
**Contamination risk:** **founder bias — this adapter is the direct cause of
failure 15.5.** A YC page lists founders, so the person universe is founders.
**Freshness:** profile pages update irregularly; team size is often stale
(§15.8).
**Reusable:** yes — *if and only if* YC companies are a sensible universe for
the new radar and founder-only person data is acceptable.

### `src/discovery/sources/getroBoard.ts`

**Discovers:** companies from Getro-powered VC portfolio job boards.
**Method:** the board's own sitemap lists every `/companies/{slug}` page;
each page is server-rendered with `__NEXT_DATA__`.
**Extracts:** name, domain, description, location, slug, jobs URL.
**Signals:** none directly — it is a **discovery channel only**. VC backing
contributes **zero** points to any score.
**Cannot detect:** people · internal tooling · anything authoritative.
**Contamination risk:** venture-backed, US-skewed, English-language bias
(79% US / 4% Europe).
**Freshness:** boards lag portfolio changes.
**Reusable:** yes, for any radar targeting venture-backed companies.
**Limitation found and documented:** most European VC boards (Balderton,
Creandum, Atomico, Northzone, Cherry) run on Consider.co with obfuscated
endpoints; reading them would mean defeating an anti-bot layer. **Decision:
skipped and documented rather than half-built.** Point Nine is the only
Getro-based European board that enumerates cleanly.

### Company pages — `src/enrichment/companyPages.ts`

**Discovers:** environment evidence, team/leadership info, company statements.
**Method:** direct fetch of company-controlled URLs, manually targeted.
**Authority:** primary — the highest available for role currency and tooling.
**Cannot detect:** anything the company does not publish.
**Contamination risk:** **team pages go stale** (§15.11).
**Reusable:** yes.

### Manual verification — the most important "adapter"

**Not code.** A human checks a public source this runtime cannot reach, records
the fact in `verified-facts.json` with `verifiedBy`, and — where a value is
being replaced — `supersedes`.

**Why it exists:** LinkedIn is registered `not_permitted_yet` — *"Excluded
outright. Terms do not permit this use."* Facts visible there enter only through
manual verification, **never through a fabricated URL**.

**This is a first-class part of the architecture, not a workaround.** See §27.

### Registered but excluded — `not_permitted_yet`

| id | Reason (verbatim from the registry) |
| --- | --- |
| `excluded-linkedin` | "Excluded outright. Terms do not permit this use." |
| `excluded-x-followers` | "Not validated as a signal; excluded from core production sources." |
| `excluded-product-hunt` | "Commercial ingestion requires licensing review." |
| `excluded-google-site-search` | — |
| `proxy-mx-records` | "Proxy-grade only. Can never satisfy the Slack eligibility gate." |
| `proxy-slack-marketplace` | "Proves the company built a Slack app, not that it uses Slack internally." |
| `proxy-dns-attribution` | "Requires a validated methodology before any use." |
| `proxy-tech-database` | "Not authoritative for product eligibility. Proxy-grade only." |

### Registered first-party sources — not implemented

| id | Note |
| --- | --- |
| `bond-crm` | "Would materially improve the relationship layer. Requires BOND to grant access; currently stood in for by manual enrichment." |
| `bond-product` | "Would let existing users and trials be routed to inbound follow-up automatically." |

### HAVING AN ADAPTER ≠ THAT SOURCE IS APPROPRIATE

The ATS adapters are excellent code and were the right choice for BOND, because
executive-office hiring is a meaningful signal for an AI Chief of Staff product.

For a different product they may be actively misleading. ATS data over-samples
companies that hire publicly in English and — measurably here — companies that
sell recruiting software (3.2% of the dataset, 62.5% of the triggered band).

**Choose sources from the thesis. Never build the thesis around the adapters you
happen to have.**

---

## 25. Data lineage / reproducibility

### The date vocabulary — never interchangeable

| Date | Field | Means |
| --- | --- | --- |
| **Event date** | `Signal.eventDate`, `FundingEvent.announcedAt`, `ReviewedTrigger.eventDate`, `JobOpening.publishedAt` | When the thing happened in the world |
| **Observed / retrieved** | `Source.retrievedAt`, `Signal.detectedAt`, `EnvironmentEvidence.observedAt`, `ReviewedTrigger.observedAt`, `Company.lastCheckedAt`, `JobOpening.lastSeenAt` | When we looked |
| **Verified** | `verified-facts.json` `verifiedAt`, `Verification.triggerCheckedAt` | When a human confirmed it |
| **Last rechecked** | `Company.lastCheckedAt`, `JobOpening.lastSeenAt` | Last pipeline touch |
| **Published** | `Source.publishedAt`, `PainEvidence.publishedAt` | When the source was published |

`ageDays` on a trigger is computed from **`eventDate`**, not from `detectedAt`.
Where no event date exists, the UI says **"Undated — currently published, but
the evidence carries no date"** rather than substituting the retrieval date.

### The identifier chain

```text
Source.id      → referenced by Evidence.sourceIds, Signal.sourceIds,
                 EnvironmentEvidence.sourceId, FundingEvent.sourceId,
                 HeadcountEstimate.sourceIds
Company.id     = canonical domain with dots → dashes
Person.id      → Person.companyId → Company.id
Prospect.id    = `${company.id}--${person.id}`
Signal.id      → Signal.sourceIds → Company.sources[]
Review.accountId = Company.id
Review.primaryPersonProspectId = Prospect.id
                 (validated: must start with accountId)
```

Two integrity rules are enforced in code:

- `isSourced()` in `userFit.ts` — evidence only scores when at least one of its
  `sourceIds` actually resolves in `company.sources`. A dangling source id
  silently drops the evidence rather than scoring an unsourced claim.
- `validate-queue.ts` — a way-in may not cite a URL the record does not carry.

### Superseded facts

- `HeadcountEstimate.readings[]` — every credible value retained
- `FundingEvent.conflictNote` — disagreement retained
- `verified-facts.json` `corrections.*.supersedes` — a prose statement of what
  was replaced and why
- `Signal.quarantined` + `quarantineReason` — neutralised, not deleted
- `Signal.closedAt` / `expiresAt` — expired, not deleted
- `Source.unavailable` + `unavailableSince` — a source that has since vanished
- `CommercialReviewRecord.caveats[]` — the correction restated in the UI

### A complete real lineage — Overview's scale claim

Chosen because it exercises discovery, scoring, a wrong derived metric, human
verification, correction, and rendering.

**1. Public source.**
`https://www.overview.ai/company`, company-controlled, `authority: 'primary'`.
Also: Overview's ATS board (job postings).

**2. Retrieval.**
Discovery/enrichment fetched the company record and ATS board. Stored as a
`Source` with `retrievedAt`, and job records with `lastSeenAt`.

**3. Raw record.**
`Company.employeeCount = 40` (from an accelerator-profile-grade origin, no
observation date, no confidence). `Company.jobs[]` ≈ 40 open roles across
~15 distinct advertised `location` values.

**4. Signal.**
`deriveSignals` produced a `hiring_surge` signal. `scoreHiringPressure` computed
open ÷ headcount = 40/40 = **100%** — far above the ≥20% band.

**5. Model / score.**
Timing rose on a hiring-pressure component built on a wrong denominator. The
account surfaced for review.

**6. Verified correction.**
A human read Overview's own company page: **50+ team members, 30 cities, 10
countries.** Recorded in `verified-facts.json`:

```jsonc
"overview.ai": {
  "headcount": { "min": 50, "display": "50+ team members", "confidence": "verified" },
  "footprint": { "cities": 30, "countries": 10, "note": "distributed by design" },
  "supersedes": "Stored discovery headcount of 40 and the derived
                 40-roles-per-40-employees ratio, both of which were wrong.",
  "source": "https://www.overview.ai/company"
}
```

**7. Commercial review.**
`build-commercial-review.ts` reads the correction. `headcount.confidence` is
`verified` with `min: 50`, `display: "50+ team members"`. The **hiring ratio is
withheld** (`quoteRatio: false` / `ratioBasis` without a ratio) because the
denominator that produced it was wrong. `whyThisAccount` uses the company's own
30-cities/10-countries language, not the ATS location count.

**8. UI.**
The drawer header reads *"N open roles across N **advertised locations**"* —
renamed after visual QA caught it contradicting the verified 30-cities figure
(§15.10). Headcount shows **50+ · verified** with its basis. The 30-cities
language appears as `firstPartyLanguage` with `speaker: 'company'` and
`sourceUrl: https://www.overview.ai/company`.

**9. Tests.**
`tests/finalQueue.test.ts` → "Overview: corrected scale" and "never revives the
40-employee framing or the 1:1 ratio". `tests/phase8Queue.test.ts` → "quotes a
hiring ratio only when headcount is defensible".

**10. Raw is untouched.**
`data/verified/prospects.json` still contains `employeeCount: 40` and the
original job records. The correction lives in a different file and wins at
presentation. **The wrong number remains auditable, which is how the failure
stayed diagnosable.**

### Answering "where did this fact come from?" in practice

1. Open the queue entry (or `gtm-queue-export.json`).
2. The claim will sit in a field with a companion source: `triggers[].sourceUrls`,
   `sources[]` (each with `establishes`), `roleCurrencySourceUrl` **or**
   `roleCurrencyVerifiedBy`, `firstPartyLanguage.sourceUrl` **or**
   `provenance`, `fundingContext.sourceUrl` + `sourceTier`,
   `headcount.basis` + `confidence`, `productEnvironment.tools[].sourceUrl`.
3. If the value came from a human, `verified-facts.json` holds `verifiedBy` and
   `supersedes`.
4. If it disagrees with raw, `prospects.json` still holds the raw value.
5. `caveats[]` states any known limitation in the UI itself.

---

## 26. Identity resolution / deduplication

Identity is the highest-consequence, lowest-visibility part of the system. When
it fails, everything downstream is confidently about the wrong entity.

### The keys

| Key | Definition | File |
| --- | --- | --- |
| **Canonical domain** | lowercase, strip scheme, strip path, strip `www.` | `canonicalDomain()` in `dedupe.ts` |
| **Company key** | canonical domain, **falling back to** `name:{normalisedName}` | `companyKey()` |
| **Normalised name** | NFKD, strip diacritics, `&`→`and`, strip legal suffixes (`inc llc ltd limited gmbh bv nv ab oy sa sas plc corp co`), strip non-alphanumerics | `normalizeCompanyName()` |
| **Company id** | canonical domain, dots → dashes | assigned at enrichment |
| **ATS tenant key** | `{provider, identifier}`, **verified against the live endpoint** | `AtsConfig`, `resolve.ts` |
| **Person key** | `{companyId}::{normalisedPersonName}`, or `{companyId}::persona:{personaType}` when unnamed | `personKey()` |
| **Prospect id** | `${company.id}--${person.id}` | `scoreProspect()` |
| **Source id** | assigned per source, referenced by every evidence array | `Source.id` |
| **Verified-facts person key** | `{domain}::{Full Name}` — note: **full name, not normalised** | `verified-facts.json` |

**Inconsistency worth fixing in a future instance:** the pipeline person key
uses a normalised name; the verified-facts key uses the display name. They
happen to align today. A future radar should use one normalisation everywhere.

### When domain is authoritative — and when it is not

**Authoritative for:** merging discovery candidates; the company id; joining
verified facts; joining any future first-party import.

**NOT authoritative when:**

- **A company has renamed or rebranded** while keeping a domain, or moved
  domains while keeping a name. Handled by an explicit `aliases[]` array on the
  review record: *"Former names, DBAs and other identifiers, kept explicit."*
  This was adopted after the Tilt collision — the record was tilt.io / Agora
  Indexing Technologies, **formerly Delphia**. Aliases are stored, **never
  merged or split on name similarity**.
- **No domain is known.** Falls back to `name:` — a weaker key that can
  false-merge two similarly-named companies.
- **An ATS slug resembles a domain label.** The single most dangerous case: a
  200 response proves the *board exists*, not that it is **this company's**
  board (§15.3).

### Conflict resolution and precedence

| Conflict | Resolution |
| --- | --- |
| Two candidates, same domain | `dedupeCompanies()` merges. Fills gaps **without overwriting known values**; unions categories and people; appends `rawMetadata.alsoSeenIn` so **provenance is retained, never overwritten** |
| Two people, same normalised name, same company | One record via `personKey` |
| Two *unnamed* people with the same persona | One record — `::persona:{type}` prevents two guesses both persisting |
| Company identity unresolved | `companyIdentityStatus: 'unknown'` → **blocks the queue** |
| Company identity contested | `'conflicting'` + `identityConflict` → **blocks the queue** |
| ATS slug resolves to another company | `atsTrust.state = 'identifier_collision'` → **blocks the queue**; all job evidence discarded from Timing |
| Board carries client vacancies | `'mixed_or_marketplace'`; per-job ownership assessed; unresolved jobs **quarantined, not deleted** |
| Person attributed to another company | `validate-queue.ts` **error** if `primaryPersonProspectId` does not start with `accountId` |
| Person not in the discovered roster | **Warning**, not an error — legitimately means "verified by research only" |

### The specific cases requested

| Case | Handling |
| --- | --- |
| **Same company, multiple names** | `aliases[]` on the review record. Never auto-merged |
| **Same domain, changed branding** | Domain remains the key; `aliases[]` records old names |
| **Same ATS vendor, different tenant** | Key is `{provider, identifier}`. `identifierCandidates()` generates candidates; **every one is verified live** |
| **Same person name at different companies** | Person key is company-scoped — no cross-company collision possible |
| **Former employee** | `verified-facts.json` `people.*` with `formerTitle`, `departedFrom`, `tenure`. The raw record still shows them; the queue does not |
| **Current employee** | `roleCurrency: 'verified'` + `verifiedBy` or a company-controlled URL |
| **Historical title** | Kept as history and **labelled as history** — Encord's co-CEO structure |
| **Current title** | `primaryPersonTitle` + `roleCurrencyStatus` |
| **Duplicate locations** | Deduplicated via `new Set()` over job locations; labelled **"advertised locations"** |
| **Marketplace / client vacancies** | `assessJobOwnership()` → `client` → quarantined |
| **Company jobs vs customer jobs** | Requires the **posting body**. `isRecruitingBusiness()` triggers `strict` mode where absence of internal language is not enough to call a job internal |
| **ATS contamination** | Board-level `AtsTrust` + job-level ownership + quarantine, all retained for audit |

### The rule that generalises

> **Resolve company identity before trusting any evidence attributed to it.**

The ATS collision is the archetype: every downstream layer worked perfectly on
data about a different company. Identity resolution is not a data-cleaning
chore. It is a correctness precondition.

---

## 27. Manual verification workflow

### When manual verification is required

1. The fact is **release-critical** — it would appear in the queue and be said
   out loud to a person.
2. Automation **cannot** establish it — the source is unreachable (LinkedIn),
   permission-restricted, or not machine-readable.
3. Automated evidence is **stale or contradicted** — a team page listing someone
   who has left.
4. Sources **conflict** and the conflict is material.
5. An account is being added **outside the discovered universe**.

### What counts as sufficient evidence

| Claim | Sufficient |
| --- | --- |
| A person's current role | The company's own page **or** a public announcement by the company **or** the person's own public statement of the role |
| A departure | The person's own public profile/statement, or the new employer's material |
| Headcount | A company-stated figure with a date |
| Funding | Company-official > investor-official > reputable reporting. **Never an undated aggregator entry** |
| Footprint | A company statement |
| A quote | The verbatim text, read directly |

**Explicitly not sufficient:** search-engine snippets · inference from adjacent
facts · a single undated database row · "it is widely known".

### What must be captured

From the shipped `verified-facts.json`:

```jsonc
"mytos.bio::Celso Milne": {
  "title": "Chief of Staff, Anima",
  "formerTitle": "Chief of Staff, Mytos",
  "departedFrom": "mytos.bio",
  "tenure": "2024-07 to 2026-04",
  "roleCurrency": "verified",
  "verifiedBy": "manual_public_profile",
  "note": "Left the Mytos Chief of Staff role in April 2026 and is now Chief of Staff at Anima."
}
```

Required: the claim · the status · **how it was verified** (`verifiedBy`) · a
note in plain language · a `source` URL where one exists · `supersedes` where a
stored value is replaced. File level: `verifiedAt` and `method`.

### How it enters and what it affects

1. Hand-edit `data/verified/verified-facts.json`.
2. `npm run build-review-v8` reads it and applies precedence.
3. `npm run validate-queue` checks a verified role has a URL **or** stated
   provenance.
4. Tests assert the correction is reflected in the queue
   (`tests/finalQueue.test.ts` "verified-fact persistence").

Affects: the commercial record, the queue, the drawer. **Does not affect:**
`prospects.json`, model scores, raw discovery, or `data/discovery/`.

### Statuses — what exists vs what is recommended

**CURRENT IMPLEMENTATION** — `VerificationState` in `src/review/commercial.ts`,
applied per dimension:

| State | Meaning |
| --- | --- |
| `verified` | Confirmed against an acceptable source |
| `supported` | Credible evidence, not conclusive |
| `uncertain` | Weak or indirect |
| `conflicting` | Credible sources disagree |
| `unknown` | Not established. **Never "absent"** |

Also implemented: `verified-facts.json` `roleCurrency: "verified"` +
`verifiedBy`; `RoleCurrency` (`verified_on_company_site | unknown`) in the
Phase 7 layer; `VerificationStatus` (`ready_to_show | show_with_caveat |
removed`) in the Phase 7 layer.

**RECOMMENDED FUTURE ARCHITECTURE — not implemented.** A single explicit
lifecycle:

| Recommended status | Meaning |
| --- | --- |
| `VERIFIED_CURRENT` | Confirmed true as of `verifiedAt` |
| `VERIFIED_HISTORICAL` | Confirmed true in a stated past window |
| `NEEDS_MANUAL_CHECK` | Automation cannot establish it; release-critical |
| `CONFLICTING` | Sources disagree; conflict retained |
| `UNKNOWN` | Not established |

Today the current/historical distinction is carried informally by field names
(`formerTitle`, `departedFrom`, `tenure`) rather than by a status enum. **Label
this as a recommendation, not as current behaviour.**

### Two rules that must survive

> **UNABLE TO SCRAPE ≠ FACT UNKNOWN.**

A runtime limitation is a fact about the runtime. When a human has verified
something on a source this environment cannot reach, the correct behaviour is to
**record the fact with its provenance** — not to reject it because it cannot be
reproduced, and not to invent a URL so it looks machine-sourced. This is exactly
why `roleCurrencyVerifiedBy` exists alongside `roleCurrencySourceUrl`.

> **MANUAL VERIFICATION ≠ PERMISSION TO DELETE CONFLICTING RAW EVIDENCE.**

The Overview headcount correction did not edit `prospects.json`. The wrong
figure is still there, which is why the failure remained diagnosable. Verified
facts win at **presentation**; raw survives for **audit**.

### When re-verification is required

**No automated re-verification exists.** This is architectural debt (§28, §34).

Procedurally, re-verify before any outreach round; when a signal's `ageDays`
exceeds its category's useful life; before a new release; and immediately if any
source becomes `unavailable`.

---

## 28. Freshness / staleness policy

### What exists today

**Signal-level lifetimes are implemented** (`src/scoring/signals.ts`,
`timing.ts`):

| Signal | Active while |
| --- | --- |
| New CoS | ≤ 90 days after the start date |
| CoS / CEO-office vacancy | the linked posting is still open |
| Recent funding | ≤ 180 days after the announcement (score bands at 30/90/180) |
| Leadership / expansion | ≤ 120 days after the event |
| Hiring surge | current job data still meets the threshold |

**Age is displayed, not just computed:** `ReviewedTrigger.ageDays`; the queue's
recency column; `fundingContext.relevance` degraded to `low` when stale.

**Timestamps exist on nearly every fact:** `retrievedAt`, `observedAt`,
`detectedAt`, `lastCheckedAt`, `lastSeenAt`, `employeeCountAsOf`, `verifiedAt`.

### Per-field assessment

| Field | Goes stale when | Current handling | Ideal recheck | Old evidence still useful? |
| --- | --- | --- | --- | --- |
| **Employee title** | The person changes role | `roleCurrencyStatus` + manual verification. **No automated recheck** | Before every outreach round | Yes — as history, labelled |
| **Current employer** | The person leaves | `verified-facts.json` `departedFrom`. **Detected only manually** | Before every outreach round | Yes — as history |
| **Open vacancy** | Filled or withdrawn | ATS re-read shows it gone → `cos_possible_hire`, **not** a hire | Weekly while a trigger is live | Yes — the Mytos vacancy *date* was decisive |
| **Closed vacancy** | — | `closedAt`; retained as historical context | — | Yes |
| **Headcount** | Continuously | `observedAt` + `confidence` + `readings[]`. **No decay function** | Quarterly | Yes — as a trend |
| **Funding event** | Ages, never invalid | `ageDays`; `relevance` degrades; 180-day scoring window | On announcement | **Always** — funding is history |
| **Office footprint** | Slowly | Company-stated only, via verified facts | Annually | Yes |
| **Advertised job location** | Every posting change | Recomputed each ATS read; labelled "advertised locations" | Each run | Marginally |
| **Product/tool usage** | Migrations | `observedAt` on each evidence record. **No decay** | Before outreach | Yes, with the date shown |
| **Founder/exec quote** | Rarely | `attribution` carries context | On use | **Yes — quotes are historical by nature** |
| **Company description** | Pivots | Refreshed on discovery re-run | Each run | Yes |
| **Team page** | **Constantly, and silently** | **This is the known gap** (§15.11) | Before every outreach round | Yes — as history |
| **ATS listing** | Live | Fetched live | Each run | Yes, via `closedAt` |

### ARCHITECTURAL DEBT — stated plainly

The following have **no explicit freshness policy** in the current
implementation:

1. **No automated re-verification of any kind.** Nothing re-checks a verified
   fact. `verifiedAt` is recorded and never acted upon.
2. **No staleness decay on headcount or environment evidence.** A three-year-old
   tool observation is treated exactly like yesterday's.
3. **No recheck scheduling.** No "verify before outreach" gate exists in code.
4. **No departure detection.** Only manual verification catches a departure. For
   a system whose primary contact is a named individual, this is the most
   commercially dangerous gap in the list.
5. **No source liveness monitoring.** `Source.unavailable` exists as a field;
   nothing populates it on a schedule.
6. **`verifiedAt` has no expiry semantics.** A fact verified once is verified
   forever as far as the code is concerned.

**RECOMMENDED FUTURE ARCHITECTURE** (not built): per-field `maxAgeDays`; a
`verificationExpiresAt` derived from `verifiedAt` + field policy; a `staleness`
report before each outreach round; a pre-outreach gate that refuses to export
any account whose primary contact's role has not been verified within N days.

---

## 29. Failure / recovery runbook

For each: symptom → likely cause → diagnose → **what not to do** → safe fix →
rollback → what must not be overwritten.

### 1. A source endpoint breaks

- **Symptom:** discovery/enrichment logs a failed feed; counts drop.
- **Cause:** vendor API change, rate limiting, network.
- **Diagnose:** `data/discovery/source-state.json`; retry the URL manually.
- **Do not:** treat missing data as absent signal, or delete the previously
  stored jobs.
- **Fix:** the pipeline already logs and skips, preserving stored jobs. Mark the
  `Source` as `unavailable` with `unavailableSince`. Fix the adapter.
- **Rollback:** `git checkout data/verified/prospects.json`.
- **Never overwrite:** the previously stored jobs and signals.

### 2. An ATS board returns another company

- **Symptom:** job titles/locations do not match the company.
- **Cause:** identifier collision (§15.3).
- **Diagnose:** compare the board's company name against the record; check
  `aliases[]`.
- **Do not:** "fix" it by changing the company's name to match the board.
- **Fix:** set `atsTrust.state = 'identifier_collision'`;
  `companyIdentityStatus = 'conflicting'` with an `identityConflict` string. The
  queue blocks automatically. Store aliases explicitly.
- **Never overwrite:** the stored jobs — they are the evidence of the collision.

### 3. Data generation partially fails

- **Symptom:** `enrich`/`refresh-data` exits mid-run; files are inconsistent.
- **Do not:** run `sync-data` or `build`. That publishes a half-written dataset.
- **Diagnose:** `npm run validate-data`.
- **Fix:** `git checkout data/verified/` to the last good state, then re-run.
- **Rollback:** the data files are committed — git is the backup.

### 4. Discovery or enrichment partially fails

- **Symptom:** far fewer companies/prospects than the last run.
- **Do not:** commit the shrunken dataset.
- **Diagnose:** compare `metadata.json` counts against the previous commit.
- **Fix:** re-run when the source recovers; the HTTP cache in `.cache/` makes a
  re-run cheap.

### 5. Validation fails

- **Symptom:** `validate-data` or `validate-queue` exits non-zero.
- **Do not:** relax the validation rule. **Do not** delete the failing record to
  make the gate pass.
- **Diagnose:** each error names the record and the field.
- **Fix:** fix the fact, the classification, or the rule — in that order of
  preference. Errors block; warnings inform.

### 6. Verified facts conflict with each other

- **Symptom:** two entries assert incompatible things.
- **Do not:** pick the more convenient one.
- **Fix:** record `conflicting` and, if the conflict is material to the queue,
  block the account. Overview's funding is the precedent: genuine conflict →
  **no funding claim used at all**.

### 7. Model and verified fact disagree

- **Symptom:** the model ranks on a fact the human corrected.
- **Diagnose:** compare `prospects.json` against `verified-facts.json`.
- **This is expected and correct.** Verified wins at presentation; the model's
  view is retained as `modelDiagnostics`.
- **Do not:** edit `prospects.json` to match. That destroys the audit trail and
  the next pipeline run reverts it anyway.
- **Fix:** ensure the review record uses the verified value, and state the
  correction in `caveats[]`.

### 8. Build succeeds but production data is missing

- **Symptom:** the app loads and shows "Signal data couldn't be loaded", or the
  queue tab is absent.
- **Cause:** `sync-data` did not run, or `data/verified/` is absent.
- **Diagnose:** `curl https://<url>/data/prospects.json`.
- **Fix:** confirm `prebuild` is present in `package.json`. Note `loadQueue()`
  degrades gracefully — a missing **queue** hides the tab rather than erroring,
  so a missing queue is quieter than a missing dataset.
- **Never:** commit `public/data/` to work around it.

### 9. Vercel deployment fails

- **Symptom:** the build fails on Vercel but passes locally.
- **Diagnose:** the build logs. Most common: a file needed at build time is
  gitignored or `.vercelignore`d.
- **Do not:** disable the prebuild hook.
- **Fix:** reproduce with a clean clone (§18) — this reproduces it every time.

### 10. Git identity blocks deployment

- **Symptom:** *"the commit email … could not be matched to a GitHub account."*
- **Fix:** `git config user.email <verified-github-email>` **repo-locally**,
  then an empty commit to re-trigger.
- **Do not:** change the developer's global git configuration without being
  asked.

### 11. A production deploy is bad

- **Fix:** Vercel dashboard → previous deployment → *Promote to Production*. No
  rebuild.
- **From git:** `git push --force-with-lease origin <tag>^{commit}:main`.
- **Do not:** delete the bad deployment — it is the record of what shipped.

### 12. A public source disappears after being used

- **Symptom:** a cited URL 404s.
- **Do not:** delete the claim, and do not silently swap in a different URL.
- **Fix:** mark the `Source` `unavailable` with `unavailableSince`. If the claim
  is release-critical, re-verify from another source or move it to
  `caveats[]`/`openQuestions[]`.
- **The claim stays traceable to what supported it at the time.**

### 13. A queue fact is found wrong BEFORE outreach

- **Fix:** correct via `verified-facts.json` (with `supersedes`) and/or the
  `AUTHORED` record; re-run `build-review-v8` → `validate-queue` → tests.
- **If the correction removes the reason to call, remove the account.** Queue
  size is not an invariant.
- **Never overwrite:** the raw record.

### 14. A queue fact is found wrong AFTER outreach

- **Fix:** correct it in the system immediately; record what was said and to
  whom outside the system (there is no CRM here); add a `caveat` documenting the
  error so it is not repeated.
- **Do not:** quietly edit the queue so the record no longer shows what was
  claimed. The correction is the valuable artifact.

### 15. A source changes meaning

- **Example:** an ATS field that meant "office" starts meaning "advertised
  location", or a board starts including client vacancies.
- **Symptom:** a metric shifts with no corresponding real-world change.
- **Fix:** update the extraction **and the field's display name** (§15.10), and
  re-audit historical records built on the old meaning.

### 16. A company changes name

- **Fix:** keep the domain-based id; add the old name to `aliases[]`. **Do not**
  create a second record and do not merge on name similarity.

### 17. A person leaves

- **Symptom:** usually invisible — team pages go stale (§15.11).
- **Fix:** record in `verified-facts.json` with `formerTitle`, `departedFrom`,
  `tenure`, `verifiedBy`. Choose a new primary contact or drop the account.
  **Re-check whether any signal was interpreted in light of that person** — the
  Mytos vacancy/backfill error is exactly this.
- **Never overwrite:** the raw person record.

---

## 30. Performance / scale characteristics

### Current measured scale

| Metric | Value |
| --- | --- |
| Prospects | **648** |
| Distinct companies | **300** |
| Companies with a verified ATS board | ~149 (**23%** of prospects sit on one) |
| Job records | **10,578** |
| Source records | **2,778** |
| Signal records | 363 (as stored per prospect) |
| Commercially reviewed accounts | **10** |
| GTM Queue | **6** |
| Registered sources / enabled | 37 / 7 |
| Tests | 618 across 30 files |

### File sizes

| File | Size | Notes |
| --- | --- | --- |
| `data/verified/prospects.json` | **9.2 MB** | **Fetched in full by the browser on every page load** |
| `data/verified/companies.json` | 2.5 MB | Not fetched by the app |
| `data/verified/people.json` | 751 KB | Not fetched by the app |
| `data/verified/gtm-queue-v8.json` | 46 KB | Fetched |
| `data/verified/commercial-review-v8.json` | 64 KB | Fetched |
| `data/verified/gtm-queue-export.json` | 66 KB | Not fetched |
| `data/verified/verified-facts.json` | 3 KB | Build-time only |
| `data/discovery/raw-candidates.json` | 700 KB | Build-time only |
| `data/discovery/discovered-companies.json` | 698 KB | Build-time only |
| `.cache/http` | **196 MB** | Local only, gitignored |
| `dist/` | **~13 MB** | Dominated by copied JSON |
| `dist/assets/index-*.js` | ~341 KB | The actual application |
| `dist/assets/index-*.css` | ~32 KB | — |

### Cost profile

| Step | Cost |
| --- | --- |
| `discover` | Network-bound. Sitemaps + per-company pages. Cached in `.cache/http` |
| `enrich` | **Most expensive.** ATS resolution *probes speculatively* across providers per company, then fetches postings with bodies |
| `audit-ats` | Expensive — **re-reads every verified board live**, because descriptions are not persisted |
| `refresh-phase8` | Cheap — pure re-derivation |
| `build-review-v8` | Trivial — reads two files, writes two |
| `validate-*` | Trivial |
| `sync-data` | Trivial — file copies |
| `vite build` | ~300 ms |
| Manual/browser steps | **The real bottleneck.** Commercial review, manual verification and visual QA are human-time-bound |

### Client-side implications

The browser fetches **9.2 MB of JSON**, parses it, and runs `scoreProspect()`
over 648 prospects on every load. At this size it is fine — the scoring
functions are simple and synchronous, and re-derivation is what keeps stale
signals from being displayed.

Caching: static assets are content-hashed and cached by the CDN; the JSON files
are **not** content-hashed, so they follow default caching. There is no service
worker and no client-side persistence.

### Projections — ARCHITECTURAL ANALYSIS, NOT CURRENT BEHAVIOUR

Nothing below has been measured or optimised. It is reasoning about where the
current design would break.

**~1,000 prospects (~1.5× today)**

Probably fine unchanged. `prospects.json` ≈ 14 MB — noticeably slow on mobile
networks but workable. Load-time re-derivation still cheap. The human bottleneck
is unchanged: commercial review does not scale with the universe, only with the
number of accounts reviewed.

**~10,000 prospects (~15×)**

Client-side loading of the full universe stops being reasonable — ≈ 140 MB. What
would likely need reconsidering:

- Ship only the queue and a paginated/index-based prospect list to the browser
- Move scoring to build time, with a small derived index for the UI (**at the
  cost of the load-time re-derivation property**, which would need replacing
  with an explicit freshness indicator)
- Split JSON per company or per page
- `audit-ats` re-reading every board live becomes hours; job descriptions would
  need persisting (which is also the §34 debt fix)
- Discovery's speculative ATS probing becomes rate-limit-relevant

**~100,000 prospects (~150×)**

The file-based architecture is no longer appropriate. This is a database
problem: incremental discovery rather than full re-runs; a queryable store; a
job queue for enrichment; per-record freshness tracking with scheduled
re-verification; and the commercial review layer would need to become a
multi-user workflow with its own persistence rather than a hand-authored
TypeScript array.

**The important point:** the human review layer does not scale with the
universe, and that is by design. The queue is 6 accounts whether the universe is
648 or 648,000. Scaling discovery without scaling review capacity produces a
larger haystack, not more queue.

---

## 31. Versioning / instance isolation

### Why BOND production must never become Radar #2's development environment

1. **Contamination is silent.** A leftover verified fact, persona pattern or
   test assertion carries a BOND conclusion into another company's radar with no
   visible symptom.
2. **The production URL is shared.** A partially-rebuilt radar deployed to the
   BOND alias shows a BOND recipient the wrong company's data.
3. **Git history is the audit trail.** Rewriting this repository for another
   company destroys the record of how the BOND queue was reached.
4. **Tests assert BOND facts.** They would either fail (blocking work) or be
   deleted (destroying BOND's release gate).
5. **`data/verified/` is a shared namespace.** One `npm run enrich` overwrites
   the 648-prospect universe.

### What each instance must own

Repository (or an explicitly isolated instance) · company configuration ·
Targeting Thesis · raw discovery data · derived universe · verified facts ·
commercial reviews · queue · company-specific tests · Vercel project ·
production URL · release tags · documentation.

### Recommended naming conventions

| Artifact | Convention | BOND example |
| --- | --- | --- |
| Repository | `{company}-signal-radar` | `bond-signal-radar` |
| Vercel project | `{company}-signal-radar` | `bond-signal-radar` |
| Production URL | `{company}-signal-radar.vercel.app` | `bond-signal-radar.vercel.app` |
| Release tags | `v{n}-{phase-slug}` | `v7-verified-queue` |
| Company config | `src/company/{company}/` | (would be `src/company/bond/`) |
| Verified facts | `data/human-verified/verified-facts.json` | `data/verified/verified-facts.json` |
| Commercial reviews | `data/review/commercial-review.json` | `data/verified/commercial-review-v8.json` |
| Queue | `data/queue/gtm-queue.json` | `data/verified/gtm-queue-v8.json` |
| Docs | `docs/{COMPANY}_TARGETING_THESIS.md` | `docs/TARGETING_THESIS.md` |

Two naming lessons from this instance, worth fixing next time:

- **Drop the version suffixes.** `commercial-review-v8.json`,
  `gtm-queue-v8.json`, `loadQueueV8.ts` — the `v8` is phase archaeology now
  frozen into filenames. Use git tags for versions and stable names for files.
- **`data/verified/` does not mean "human-verified."** It means "the real
  dataset". This has already caused confusion. Rename.

### Avoiding cross-company contamination

1. Separate repositories. Not branches, not directories in one repo.
2. Separate Vercel projects, separate URLs.
3. Run the §20 checklist before Radar #2's first discovery run, and again
   before its first deploy.
4. Add an automated isolation test (§16 recommendation): assert no file
   contains another company's name, domain or account ids.
5. **Never copy a data file between instances.** Copy code; regenerate data.
6. Clear `.cache/` — a cached HTTP response from BOND's run is not evidence
   about another company.
7. Keep this architecture document as the only deliberate cross-instance
   artifact, and keep its BOND examples clearly labelled as examples.

---

## 32. Security / privacy / data boundaries

### What this architecture is intended to use

**Public professional and company information only.** Verified by inspection:
company websites, public ATS APIs, public funding announcements, public
accelerator and portfolio pages, public professional profiles read manually.

No authentication is used against any source. No private endpoint is accessed.
No anti-bot system is bypassed — when European VC boards proved to require
defeating an anti-bot layer, the decision was to **skip and document**, not to
work around it.

### Should be stored

- Company facts and public identifiers
- Public job postings and their content
- Public funding announcements
- A person's **name, title, employer** and a public source establishing them
- Verbatim public quotes with attribution and provenance
- Source URLs and retrieval timestamps
- Evidence classification and confidence

### Should NOT be stored

- Personal contact details — **no email addresses, no phone numbers** in any
  data file. Verified: the person records carry name, title, sources, evidence
- Non-public biographical information
- Anything from a source whose terms forbid this use — **LinkedIn is registered
  `not_permitted_yet` and never scraped**
- Inferences about individuals' personal circumstances
- Credentials, tokens or API keys of any kind
- Private CRM, product-usage or customer data, unless explicitly authorised

### Manually verified public profile handling

The rule applied here: **a human may read a public profile that automation is
not permitted to scrape, and record the professional fact** — role, employer,
tenure — **with provenance.** What is recorded is the fact and how it was
verified (`verifiedBy: "manual_public_profile"`), **not** a copy of the profile,
and **not** a fabricated URL implying machine access.

### Credentials and tokens

- No credentials in source data. None found.
- No tokens in the repository. `.env*` and `.vercel` are gitignored;
  `git ls-files` confirms neither is tracked.
- The application has no runtime secrets at all — it is a static site.

### Relationship unknown ≠ relationship absent

`RelationshipState` has **both** `none` (checked, and absent) and `unknown` (not
checked). `RouteDecision.relationshipUnchecked` marks the difference so an
unchecked relationship routes to cold outbound **while flagged**, and absence is
never implied.

Currently BOND relationship data is 100% `unknown` across all 648 prospects, and
**nothing is fabricated** — `tests/phase8Queue.test.ts` asserts "ships with no
fabricated first-party data".

### Public inference must stay separate from first-party data

`src/data/firstParty.ts` defines the contract for authorised first-party import
and encodes the governing rule:

> "first-party data changes ROUTING, never attractiveness. Knowing someone is
> already a customer tells you how to approach them, not that they are a better
> prospect."

**Conceptual guidance for a future radar** (do not build this now): if a target
company supplies authorised private CRM, product-usage, relationship, sales or
customer data, it must enter through a **clearly separated authorised
first-party ingestion layer**, with:

- its own source registry entries (`crawlStrategy: 'first_party_import'`, as
  `bond-crm` and `bond-product` already are)
- `RelationshipProvenance` recorded per record (`first_party_crm`,
  `first_party_product`, `manual_verified`, `public_observation`) — this field
  already exists
- a hard boundary: first-party data influences **routing and exclusion**, never
  fit scoring, unless a validation exercise explicitly establishes otherwise
- separate storage, never merged into `data/discovery/`
- an explicit record of the authorisation

**Do not silently mix authorised private data into public discovery.** The
value of the public layer is that its provenance is uniform and auditable.

---

## 33. Architectural invariants

Contracts, not style guidance. A future implementation that breaks one of these
is a different and worse system.

1. **Raw discovery remains auditable.** The raw universe is never edited by
   downstream layers.
2. **Verified facts do not erase raw evidence.** Correction happens at
   presentation; the superseded value survives.
3. **Commercial review may change presentation and decisions without rewriting
   discovery history.**
4. **Observation and interpretation remain separate** — in the type system, in
   the data, and on screen.
5. **Unknown is never rendered as absent.** Neutral visual language, phrased as
   a question.
6. **Proxy evidence is never rendered as confirmed**, and is never
   programmatically promoted.
7. **Current and historical claims remain distinguishable.**
8. **Event date and retrieval date are not interchangeable.** Age is computed
   from the event; undated is stated as undated.
9. **Model score is not commercial truth.** It ranks candidates for review.
10. **Queue membership requires explicit commercial review.** Nothing promotes
    itself.
11. **A release-critical unresolved premise can block queue inclusion**, and the
    blocker is code, not discipline.
12. **New instances never inherit another company's verified facts.**
13. **New instances never inherit another company's Targeting Thesis as truth.**
14. **New instances never inherit another company's scoring weights without
    explicit justification.**
15. **Every material queue claim is traceable to evidence** — a URL, or a stated
    verification provenance.
16. **No fixed queue size is required.** A stated stopping rule, not a target.
17. **Public signal is never automatically equated with pain.**
18. **Public signal is never automatically equated with buying intent.**
19. **A job vacancy does not prove the seat is empty.**
20. **A job vacancy does not prove a backfill.** Check the dates.
21. **Tool mention does not prove internal use.**
22. **Person discovery must be tested against the personas the thesis claims
    matter.** A Tier 1 persona with zero discovered examples is a blocking
    finding.
23. **Source inability is not negative evidence.** "We could not look" ≠
    "nothing is there".
24. **First-party quotes are optional.** Never forced for symmetry.
25. **A weaker candidate is never promoted to fill a showcase slot.**
26. **Company identity is resolved before its evidence is trusted.**
27. **Verified commercial output never conceals material uncertainty.** Every
    queued account carries at least one caveat or open question.

Two additions earned by this project's failures:

28. **A classifier is not tested until it has been checked in both directions**
    on real data (§15.2).
29. **Any script that mutates a shared dataset in place must be idempotent**, and
    must be verified by running it twice (§15.4).

---

## 34. Known architectural debt / limitations

Only real limitations of the current system.

### 1. Person discovery finds only founders

- **Impact:** the highest-value persona in the thesis is undiscoverable. Two of
  six queue members came from manual research.
- **Risk at Radar #2:** **critical** if the same source pattern is repeated.
- **Fix before Radar #2? YES** — not by fixing this code, but by running the
  persona × source observability test (§8) before discovery.
- **Fix before scaling? YES.**

### 2. Manual verification dependency

- **Impact:** the queue's most important facts are hand-verified with no tooling
  and no schema validation.
- **Risk at Radar #2:** high — it is the throughput bottleneck.
- **Fix before Radar #2? NO** (it works, and human judgment is load-bearing).
- **Fix before scaling? YES** — schema validation and re-verification scheduling.

### 3. No automated re-verification

- **Impact:** `verifiedAt` is recorded and never acted on. A departure is
  invisible until someone looks.
- **Risk at Radar #2:** high — contacting someone who left is the most visible
  possible failure.
- **Fix before Radar #2? NO** (procedural: re-verify before each outreach round).
- **Fix before scaling? YES.**

### 4. Job descriptions are not persisted

- **Impact:** the ownership audit must re-read every board live. Slow, and
  historical ownership cannot be re-audited at all.
- **Risk at Radar #2:** medium.
- **Fix before Radar #2? Recommended** — cheap to do at ingestion, expensive to
  retrofit.
- **Fix before scaling? YES.**

### 5. Client-side JSON scale

- **Impact:** 9.2 MB fetched per page load.
- **Risk at Radar #2:** low at similar scale.
- **Fix before Radar #2? NO. Fix before scaling? YES** (§30).

### 6. Public-source observability limits and measured bias

- **Impact:** recruiting-adjacent companies are 3.2% of the dataset and 62.5% of
  the triggered band; only 23% of prospects sit on a verified ATS board; 79% US.
  Ranking partly measures observability.
- **Risk at Radar #2:** high, and **source-specific** — recompute for the new
  sources.
- **Fix before Radar #2? NO, but MEASURE and publish the ratio.**
- **Fix before scaling? YES.**

### 7. Source adapter fragility

- **Impact:** two crawlers, one dependent on an unofficial JSON mirror. European
  coverage blocked by anti-bot layers and documented rather than half-built.
- **Risk at Radar #2:** medium — depends entirely on the new target's geography.
- **Fix before Radar #2? Only if the new ICP needs unsupported regions.**

### 8. Scoring is coupled to BOND assumptions

- **Impact:** every weight, band and threshold encodes BOND hypotheses, **none
  validated against conversion data**.
- **Risk at Radar #2:** **critical if inherited silently.**
- **Fix before Radar #2? YES** — re-derive from the new thesis.

### 9. Company-specific logic embedded in UI and tests

- **Impact:** thesis content, copy, personas and forbidden-claim tests are
  interleaved with generic mechanism.
- **Risk at Radar #2:** high — this is the main contamination vector.
- **Fix before Radar #2? YES**, via the §20 checklist. A structural fix (§21)
  can wait.

### 10. Manual queue review does not scale

- **Impact:** 10 accounts reviewed to produce 6. Every record is hand-authored
  TypeScript.
- **Risk at Radar #2:** medium — acceptable for a showcase queue, blocking for
  operational GTM.
- **Fix before Radar #2? NO. Fix before scaling? YES.**

### 11. No first-party data, no relationship data, no CRM, no product usage

- **Impact:** every account is cold. No hypothesis has been validated against a
  conversion outcome. The system produces *plausible* targets, not *measured*
  ones.
- **Risk at Radar #2:** identical.
- **Fix before Radar #2? NO** — it depends on the target company granting access.
- **Fix before scaling? YES.** This is the highest-value upgrade available to
  the entire architecture.

### 12. Precedence is procedural, not structural

- **Impact:** verified-beats-raw is a coalesce order in one script (§5).
- **Risk at Radar #2:** medium — easy to get backwards in a rewrite.
- **Fix before Radar #2? Recommended** — a `resolveFact()` function is small.

### 13. Two vocabularies for product environment

- **Impact:** raw uses `internalUse` × `confidence`; commercial uses
  `confirmed`/`proxy`/`unknown`. Slack additionally has a dedicated field, which
  caused a double-render bug (§13).
- **Fix before Radar #2? Recommended** — model the environment as one list.

### 14. Naming debt

`data/verified/` (means "real", not "human-verified") · `v8` suffixes ·
`bondRelevant` on a generic type · `public_bond_engagement` in a shared enum ·
code comments referencing spec section numbers in a document that may not travel.

- **Fix before Radar #2? YES** — these are cheap renames that prevent real
  confusion.

### 15. No test for raw-universe immutability or instance isolation

- **Impact:** the two most important architectural invariants are unenforced.
- **Fix before Radar #2? YES** — both are a few lines (§16).

---

## 35. What not to abstract yet

**We have one mature reference implementation.** `n = 1`. Everything below looks
generic and cannot yet be proven generic. Extracting it now would encode this
instance's accidents as the framework's assumptions.

For each: why it looks generic · why we cannot know · what Radar #2 should
teach us.

### Scoring weights and the three-dimension model

- **Looks generic:** "user fit × environment fit × timing" reads like a
  universal GTM decomposition, and the code is cleanly parameterised.
- **Cannot know:** the three dimensions were chosen because BOND is sold *to a
  person*, used *inside an environment*, and *accelerated by an event*. A
  product sold to a department, procured centrally, or bought on a renewal cycle
  may need entirely different axes. The 0.45/0.30/0.25 split is a guess that has
  never been validated against a conversion.
- **Radar #2 teaches:** whether the *three-axis shape* survives, or only the
  idea of multiple un-collapsed dimensions.

### Signal taxonomy

- **Looks generic:** hiring, funding, leadership change, expansion are universal
  business events.
- **Cannot know:** five of seven BOND signals are executive-office staffing.
  Whether "detectable public events" cluster the same way for a product with a
  different buyer is unknown.
- **Radar #2 teaches:** which signal *categories* recur, and whether the MAX-per-
  category rule and the intersection bonus generalise.

### Persona ranking and the precedence chain

- **Looks generic:** "a named functional remit outranks founder status" feels
  like a universal rule about titles.
- **Cannot know:** it is a rule about *company-wide vs functional scope*, which
  matters because BOND targets company-wide coordination. A product sold to a
  functional owner would want the **opposite** precedence.
- **Radar #2 teaches:** whether *precedence between overlapping titles* is the
  reusable idea, with the direction as configuration.

### Environment categories

- **Looks generic:** communication / email / knowledge / PM / meetings / CRM is
  a reasonable taxonomy of work tooling.
- **Cannot know:** it is a taxonomy of *what BOND connects to*. `bondRelevant`
  is literally a per-product flag on a supposedly generic type.
- **Radar #2 teaches:** whether categories should be configuration or fully
  per-instance, and whether the gate/qualifier/context distinction holds.

### Queue record fields

- **Looks generic:** why this account / why this person / why now / way in /
  caveats / open questions / sources is a strong universal brief.
- **Cannot know:** `productEnvironment`, `atsTrust` and `hiring` are visibly
  BOND-shaped. `motion` encodes a BOND-specific commercial model
  (`core_initial` / `enterprise`).
- **Radar #2 teaches:** which fields are the invariant core and which are
  instance-specific extensions.

### Thesis structure

- **Looks generic:** evidence classes, failure modes, observability matrix and
  falsification criteria are excellent structure.
- **Cannot know:** it was shaped by *this* thesis's arguments — nine lessons,
  persona tiers, a specific geography section.
- **Radar #2 teaches:** which sections are load-bearing and which were
  BOND-specific arguments.

### Source hierarchy

- **Looks generic:** company-official > investor-official > reporting >
  aggregator is close to universally right.
- **Cannot know:** this is the *most likely* item on the list to be genuinely
  generic — but it has been exercised against exactly one domain (venture-backed
  software). Regulated industries, public companies and non-Western markets have
  different authority structures.
- **Radar #2 teaches:** whether the tiers survive a different source ecosystem.

### Commercial review dimensions

- **Looks generic:** identity, role currency, trigger ownership, environment,
  headcount confidence.
- **Cannot know:** these are precisely the five things that went wrong *here*.
  Another radar will have its own five. The dimensions are a **scar tissue map
  of BOND's failures**, which is exactly why they are valuable — and exactly why
  they may not transfer.
- **Radar #2 teaches:** whether *"review dimensions derive from observed failure
  modes"* is the reusable meta-rule, rather than the specific dimensions.

### The `AtsTrust` state machine

- **Looks generic:** `verified_internal` / `mixed_or_marketplace` /
  `identifier_collision` / `unknown` is a clean model.
- **Cannot know:** it is a model of ATS failure specifically. If Radar #2 uses
  different sources, the analogous states will differ.
- **Radar #2 teaches:** whether *"source trust is a state machine per source
  type"* generalises.

### The rule

> **Wait for the second implementation before extracting the framework.**

Copy the engine files as files. Rebuild the company-specific parts from zero.
Then, and only then, compare (§36) and abstract what actually recurred.

---

## 36. Radar #2 learning loop

Run this comparison **after** Radar #2 ships. Not before.

### Classification framework

Classify every subsystem into exactly one bucket:

| Bucket | Meaning | Action |
| --- | --- | --- |
| **GENERIC — SAME IN BOTH** | Identical implementation, no changes | **Extract to `/engine`** |
| **CONFIGURABLE — SAME MECHANISM, DIFFERENT CONFIG** | Same code, different data | **Extract with a config interface** |
| **COMPANY-SPECIFIC — FUNDAMENTALLY DIFFERENT** | Different logic, not just values | **Keep per-instance. Do not abstract** |
| **ACCIDENTAL BOND COUPLING** | Looked generic; turned out to encode BOND | **Document as a trap** |
| **NEW REQUIREMENT** | Radar #2 needed something BOND never did | **Evaluate whether to backport** |

### The comparison table to fill in

| Subsystem | Bucket | Evidence | Action |
| --- | --- | --- | --- |
| ATS adapters | | | |
| ATS trust / ownership | | | |
| Identity resolution / dedupe | | | |
| Source registry structure | | | |
| Source authority tiers | | | |
| Evidence type system | | | |
| Environment two-axis model | | | |
| Environment categories | | | |
| Verified-facts architecture | | | |
| Precedence rules | | | |
| Scoring dimensions | | | |
| Scoring weights | | | |
| Persona classification mechanism | | | |
| Persona taxonomy | | | |
| Signal types | | | |
| Signal lifetimes | | | |
| Timing MAX-per-category | | | |
| Commercial review record shape | | | |
| Review dimensions | | | |
| Queue blockers | | | |
| Queue ordering | | | |
| Stopping rule | | | |
| Drawer section order | | | |
| Evidence chips | | | |
| Card/table responsive swap | | | |
| Validation rules | | | |
| Generic invariant tests | | | |
| Deployment flow | | | |
| First-party contract | | | |

### Questions to answer honestly

1. Which files were copied **unchanged**? Those are genuinely generic.
2. Which were copied and then edited only in their **data**? Configurable.
3. Which were **rewritten**? Company-specific — do not abstract.
4. Which **looked** generic but needed rewriting? **Accidental coupling — the
   most valuable finding.**
5. What did Radar #2 need that BOND never did?
6. Which BOND failure modes **recurred**? Those deserve structural prevention,
   not just tests.
7. Which BOND failure modes **did not occur**? Possibly BOND-specific, possibly
   just not triggered yet.
8. Was the persona × source observability test run, and did it catch anything?
9. How much of the total time was human review? That is the real scaling
   constraint.

### Only after this

**Only after this comparison should a genuine reusable template or refactor be
attempted.** With two implementations, the extraction is evidence-based. With
one, it is a guess dressed as architecture.

State this explicitly to whoever asks for the template earlier.

---

## 37. Final self-audit

Each question answered explicitly.

**1. Could a fresh Claude Code session understand the system without the
conversation history?**
Yes. Every claim cites a file path or a committed report. The pipeline, data
model, precedence rules, commands and deployment are documented from
inspection. Judgment calls that lived only in conversation (the stopping rule,
the demotion of four environment claims, the queue ordering rationale) are
recorded here.

**2. Does it describe the ACTUAL implementation rather than an idealised
version?**
Yes, and it says so where they diverge: person discovery is not a separate
stage (§1); verified facts are read *before* the review, not applied after
(§1, §5); the commercial review is hand-authored TypeScript (§1, §11); there is
no outreach layer (§1); precedence is procedural (§5); statuses like
`VERIFIED_CURRENT` are labelled as recommendations (§27).

**3. Is every recommendation clearly separated from current implementation?**
Yes — the **RECOMMENDED FUTURE ARCHITECTURE** label is used in §5, §8, §16,
§21, §22, §27, §28, §32, and §21 opens by stating nothing in it is built.

**4. Is every BOND-specific assumption clearly marked?**
Yes. §3 is the matrix; §10 marks every weight; §7 separates generic mechanics
from BOND signal definitions; §13 states environment relevance is
product-specific; §8 says explicitly not to inherit "Chief of Staff is Tier 1".

**5. Is every reusable mechanism identified?**
§3A lists 18. §24 catalogues the adapters. §16 classifies the tests. To the
limit of one implementation's evidence — §35 states which of these cannot yet
be *proven* generic.

**6. Have all known real failure modes been documented?**
26 documented in §15, each traced to a report, a test or a code comment.
Failures that did not occur are excluded — no invented history.

**7. Is raw discovery clearly separated from verified/commercial truth?**
Yes. §1 layer table, §4 precedence, §5 the whole section, §25 the Overview
lineage showing the wrong headcount still in the raw file.

**8. Is model scoring clearly separated from commercial qualification?**
Yes. §10 ("MODEL SCORE ≠ FINAL GTM QUEUE" — the comparator does not read
scores), §11, and the drawer ordering in §12.

**9. Are identity resolution and source contamination documented sufficiently?**
Yes — §26 gives every key, precedence rule and the requested cases; §15.1–15.4
document the four real contamination failures; §24 lists per-adapter
contamination risks.

**10. Is every material queue fact conceptually traceable from source to UI?**
Yes — §25 gives the identifier chain, the date vocabulary, a step-by-step
lineage for Overview's scale claim across ten layers, and a practical procedure.

**11. Are event, retrieval and verification dates clearly distinguished?**
Yes — §25's table, and the note that `ageDays` derives from `eventDate` and
undated evidence is labelled undated rather than backfilled from retrieval.

**12. Is manual verification documented as a first-class workflow?**
Yes — §27, including "UNABLE TO SCRAPE ≠ FACT UNKNOWN" and "MANUAL VERIFICATION
≠ PERMISSION TO DELETE CONFLICTING RAW EVIDENCE", and §24 listing it as an
adapter.

**13. Are freshness/staleness limitations documented?**
Yes — §28, with a per-field table and six items explicitly labelled
**ARCHITECTURAL DEBT**, including the absence of any automated re-verification
or departure detection.

**14. Could someone operate the repository from the command map without
guessing?**
Yes — §22 gives every command with reads/writes/repeatability and mutation
class, both orders of operations, and explicitly names the six workflows that
have **no** canonical command.

**15. Could someone deploy a clean isolated copy without relying on this Mac?**
Yes — §18 covers the build, the prebuild data generation, the git-identity
blocker and its fix, five independence checks against the production URL, and
the clean-clone procedure.

**16. Could someone build Radar #2 from this document without touching BOND
production?**
Yes — §19's 22 phases start with repository isolation, §20 is the contamination
checklist, §31 explains why BOND production must never be the development
environment.

**17. Does the future-Claude prompt force approval BEFORE large-scale
discovery?**
Yes — the hard stop is in §19 (after Phase 5) and repeated as a blocking
instruction in the start prompt below.

**18. Does the clean-room checklist adequately prevent BOND contamination?**
It is thorough — data, thesis, personas, weights, signals, environment, tests,
deployment identity, plus a final `grep -ril "bond"` sweep and a warning that
hits will appear in type names and comments. It is a **checklist, not a proof**;
§16 recommends automating it as an isolation test, which is not built.

**19. Does the document avoid prematurely claiming the current system is a
universal template?**
Yes, deliberately and repeatedly — §35 exists for this, §21 forbids the refactor
now, §36 defers abstraction until after Radar #2, and the header states the BOND
implementation is a reference implementation, not a universal truth.

**20. Did this task modify anything except
`docs/REUSABLE_SIGNAL_RADAR_ARCHITECTURE.md`?**

**NO — only `docs/REUSABLE_SIGNAL_RADAR_ARCHITECTURE.md` was created.** Verified
by `git status` and `git diff --stat` before committing. No application, data,
test, script, configuration or deployment file was touched, and nothing was
deployed.

---

## STARTING A NEW SIGNAL RADAR FROM THIS ARCHITECTURE

*Paste the block below into a fresh Claude Code session.*

---

You are building a **GTM Signal Radar** for a new target company. A complete
reference implementation exists for a different company (BOND) and its
architecture is documented in
`docs/REUSABLE_SIGNAL_RADAR_ARCHITECTURE.md`.

**Step 1 — Read before doing anything else.**
Read `docs/REUSABLE_SIGNAL_RADAR_ARCHITECTURE.md` in full. Then read
`POST_ALPHA_FINDINGS.md` and `PHASE_8_COMMERCIAL_TRUTH_REPORT.md` — they record
what actually went wrong and are the most useful pages in the repository. Then
inspect the repository yourself. Do not rely on the document alone for anything
you can verify in code.

**Step 2 — Treat BOND as a reference implementation, not a universal truth.**
Its evidence architecture, provenance model, identity resolution, ATS trust
layer, review/queue separation and test patterns are reusable. Its personas,
scoring weights, signal definitions, product-environment assumptions, verified
facts, commercial reviews, queue and Targeting Thesis are **conclusions about
one product** and are not transferable.

**Step 3 — Before you change any code, produce a written classification.**
List every file and subsystem you intend to reuse and classify each as
**GENERIC**, **CONFIGURABLE**, or **COMPANY-SPECIFIC**, with a one-line
justification. Show me this before writing code. If you cannot justify a
classification, treat it as company-specific.

**Step 4 — Create an isolated instance.**
A new repository. Copy engine code only. Copy **no data**: no prospects, no
companies, no people, no verified facts, no commercial reviews, no queue, no
fixtures, no `.cache/`, no `.vercel/`. New deployment project, new URL, new
tags. Run the clean-room checklist in §20 and report the result, including the
final `grep -ril "bond"` sweep.

**Step 5 — Research the new target company from its own material.**
Public, first-party sources. Cite every product claim with a URL. Do not use
search-engine snippets as evidence. Do not infer the product from its marketing
headline. Let the company's own material **challenge** your emerging thesis, not
just support it.

**Step 6 — Rebuild the company-specific layers from zero.**
- The Targeting Thesis — from zero, with an evidence class on every claim and an
  explicit statement of what would falsify it.
- Personas — from zero: primary, secondary, anti-personas, and the precedence
  rules between them.
- Signal relevance — from zero: which public events plausibly matter for **this**
  product.
- Observability — from zero: for each signal and persona, rate commercial value
  and public detectability **separately**. A high-value signal that public
  sources cannot observe must be marked low-observability, never silently
  dropped.
- Product-environment relevance — from zero: what this product must connect to
  or coexist with, and whether each is a gate, a qualifier, or context.

**Step 7 — Never inherit these.**
- BOND verified facts.
- BOND commercial reviews.
- BOND queue membership or ordering.
- BOND scoring weights, thresholds or persona bands — **without explicit written
  justification for each, derived from the new thesis.**
- BOND signal types, environment categories, or pain themes.
- BOND-specific tests. A test asserting `scorePersonaRelevance('chief_of_staff')
  === 35` is a pinned BOND conclusion, not a correctness test.

**Step 8 — Preserve these invariants.**
- Provenance on every claim: source URL, retrieval date, authority, and what the
  source actually establishes.
- Raw discovery separate from verified facts separate from commercial
  presentation. Verified facts correct presentation; they never erase raw
  evidence.
- **Unknown ≠ absent.** Render unknown neutrally, phrased as a question to ask.
- **Proxy evidence ≠ confirmed.** Never promote proxy to confirmed.
- **Observation ≠ interpretation.** Keep them separate in the data and on screen.
- **Event date ≠ retrieval date.**
- Model score ≠ commercial qualification. Queue membership requires explicit
  human review, and a release gate in code.
- Queue size is not a target. State a stopping rule; never pad.
- First-party quotes are optional. Never force one for symmetry.
- No invented URLs, ever. Where a fact was verified by a human on a source this
  runtime cannot reach, record the fact and the verification method.

**Step 9 — STOP FOR APPROVAL.**
After you have produced (a) the new Targeting Thesis, (b) the persona model, and
(c) the signal-observability plan — including the **persona × source
observability matrix** described in §8 — **stop and present them to me.**

**Do not begin large-scale discovery before I approve those three artifacts.**

This is not a formality. In the reference implementation, discovery ran before
this check and produced 648 people who were **all founders**, with **zero**
examples of the persona the thesis named as most important. The model never
flagged it. Everything downstream inherits these three artifacts, so getting
them wrong is expensive to unwind and invisible while it is happening.

**Step 10 — After approval, follow the phase playbook in §19**, honouring each
phase's release gate and its "DO NOT CONTINUE IF" condition. Audit source
ownership and identity **before** scoring, not after. Verify any classifier in
both directions on real data. Run visual QA on the rendered page at desktop and
mobile — several real defects in the reference implementation were found only by
looking.

**Finally:** do not attempt to extract a reusable template or refactor the
reference implementation into one. There is currently one mature instance.
Build the second, then run the comparison in §36. Only then is an abstraction
evidence-based rather than a guess.

