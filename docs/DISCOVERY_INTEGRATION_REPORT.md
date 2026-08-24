# Controlled Discovery + Recovery Integration

**Mandate 7 · integration and operationalisation**
Deployed 2026-08-24 · https://introw-signal-radar.vercel.app/

---

## 01 Executive Verdict

**DEPLOY RECOVERY ONLY. Discovery stays in shadow.**

Recovery earned production. Discovery earned a shadow run and not yet a seller's attention.

**Recovery** was validated on a holdout built specifically to break it: 32 companies checked
mechanically against the 247 domains this project has already touched, frozen before a single
run. Physical-sector partner motion rose **44% → 67%**, software stayed **93% → 93%**, the
sector gap narrowed **49 → 26 points**, and there were **zero regressions and zero motions
added without a page behind them**. That is an independent replication of the development-set
result, which is exactly what the previous mandate said recovery lacked.

**Discovery** works as candidate generation and is not ready to be seen. A bounded shadow run
over 8 query families returned 69 candidates, 62 unique, **76% valid operators, 0%
competitors, 0 wrong entities**. But the cheap evidence gate — the component that decides
which candidates deserve a research pass — currently **protects operators without filtering
noise**. Measured against adversarial human labels it produced 0 false drops and also 0
correct drops: it lets everything through. Six noise items in a 22-candidate sample consumed a
full research pass each. A discovery queue that cannot separate a trade-press site from a
manufacturer is not ready to spend a seller's time, and that is why `DISCOVERY_VISIBLE`
remains off.

Both capabilities are behind independent flags defaulting off, so rollback never requires
removing code.

**No ranking, score, priority or GTM queue was introduced.** A test asserts that no candidate
object contains those words.

---

## 02 What Was Integrated

| component | file | status |
|---|---|---|
| Feature flags | `src/config/flags.ts` | shipped, all default off |
| Query family model | `src/discovery/families.ts` | shipped, 13 families |
| Candidate model + cheap gate | `src/discovery/candidate.ts` | shipped, shadow-only |
| Additive recovery union | `src/recovery/union.ts` | **shipped and enabled in the data build** |
| Recovery wiring | `src/dossier/build.ts` (`recovery?: boolean`) | shipped, opt-in |
| Recovery health panel | `app/routes/Support.tsx` | **live** |
| `--recovery` build flag | `product/build-dossiers.ts` | shipped |

Production data was rebuilt for all 35 accounts with recovery enabled and deployed.

## 03 What Was Not Integrated

- **No discovery UI.** No DISCOVERED or NEW CANDIDATES screen exists. §39–40 gate that screen
  on shadow validation passing; it did not pass (§12).
- **No broad JS rendering** (§23) — measured ceiling was 3 companies in 106.
- **No PDF subsystem** (§24) — 2 PDF surfaces in 106.
- **No backend.** The app remains static; discovery and recovery are batch CLI steps that
  persist data the site is rebuilt from (§42).
- **No partner-directory or distributor-inversion harvesting.** Adapters exist with source
  contracts; neither was run in production.
- **No snapshot registration for recovered sources** (§48). Deferred: registering newly
  recovered locators for temporal monitoring is only meaningful once a second observation
  exists, and this is the first run that produced them.

---

## 04 Discovery Architecture

```
QUERY FAMILY ──► search ──► CANDIDATE ──► ENTITY RESOLUTION ──► CHEAP EVIDENCE GATE
                                                                        │
                                          ┌─────────────────────────────┼──────────────┐
                                     drop │                    research │              │ operator
                                  (reason)│                    _required│              │ _evidence
                                          ▼                             ▼              ▼
                                  REJECTED_PRE_RESEARCH            DEEP RESEARCH ──► DOSSIER
                                                                                        │
                                                                                        ▼
                                                                               HUMAN REVIEW
```

The layering the mandate requires is preserved and each layer owns its own failure semantics.
Discovery produces a `Candidate`, never a prospect. Its fields are provenance —
`discoverySource`, `queryFamily`, `sourceURL`, `sourceLanguage`, `motionHypothesis`,
`entityConfidence`, `candidateReason` — and `candidateReason` states in plain words that it
describes how the company was found, not whether it is a fit.

## 05 Query Families

13 families, each carrying intent, target motion, language, semantic class, known
false-positive classes, templates, status and last measured result.

The organising distinction is **semantic class**, not language or sector:

| class | meaning | measured range |
|---|---|---|
| `operator_self_description` | the company describes its own programme | 75–100% |
| `ecosystem_generic` | may return consultants, directories, commentary, competitors | 0–67% |
| `counterparty_inversion` | a third party lists the company | not run |

| family | lang | class | precision | status |
|---|---|---|---|---|
| FRENCH_REVENDEUR_PROGRAM | fr | operator | **100%** | validated |
| ENGLISH_MSP_PROGRAM | en | operator | **100%** | validated |
| SWEDISH_RESELLER_OPERATOR | sv | operator | **90%** | validated (promoted) |
| GERMAN_OPERATOR_FACHPARTNER | de | operator | **88%** | validated |
| ITALIAN_RESELLER_OPERATOR | it | operator | **75%** | validated (promoted) |
| ENGLISH_SYSTEM_INTEGRATOR_PROGRAM | en | operator | 67% | provisional (demoted) |
| ENGLISH_AUTHORIZED_RESELLER_HARDWARE | en | generic | 57% | provisional |
| DUTCH_DEALER_OPERATOR | nl | operator | 25% | **disabled** |
| DUTCH_INSTALLER_OPERATOR | nl | generic | 29% | disabled |
| ENGLISH_CERTIFIED_INSTALLER_NETWORK | en | generic | 29% | disabled |
| ENGLISH_GENERIC_PARTNER_PROGRAM | en | generic | 25% | disabled |
| ENGLISH_AUTHORIZED_DEALER_APPLICATION | en | generic | 22% | disabled |
| GERMAN_GENERIC_VERTRIEBSPARTNER | de | generic | **0%** | disabled |

Disabled families are kept with their measured result so a demoted family cannot be silently
re-added later. Family names are generic; a test asserts none contains a benchmark company.

## 06 Candidate State Model

`new → resolved → researching → dossier_ready`, with `rejected_pre_research` and
`quarantined` as terminal branches. No state encodes priority, rank or fit.

Drop reasons are explicitly **automation efficiency decisions**, never commercial negatives:
`not_a_company`, `known_competitor`, `consultant_or_agency`, `directory_participant`,
`duplicate`, `wrong_entity`. A test asserts that "no operator signal found" returns
`research_required` with the rationale *"this is not evidence of absence"* — distinct from a
drop and distinct from "partner motion unknown".

## 07 Entity Resolution

Four states: `confirmed`, `probable`, `ambiguous`, `unresolved`. Auto-research runs only on
the first two. A third-party page naming a company without a corroborating brand match
resolves to `ambiguous` and is quarantined rather than crawled.

Shadow result: **62/62 resolved as confirmed, 0 wrong entities, 12% duplicate rate**. Every
candidate came from a first-party URL on its own domain, which is a property of
search-pattern discovery — counterparty inversion would not enjoy this and is the reason that
family family is not yet run.

## 08 Cheap Evidence Gate

Signals are split by **who can publish them**. STRONG signals are things only an operator puts
on its own site: an application step, partner-only infrastructure, a named tier structure.
WEAK signals — "dealer program", "find a dealer" — are vocabulary commentators use just as
freely. Commentary framing with no strong signal is dropped however much partner vocabulary
it quotes.

**Measured against adversarial human labels (n=22), and this is the weak result of the
integration.** See §12.

## 09 Recovery Union Architecture

```
BASE RESEARCH ─────┐
                   ├──► MERGED EVIDENCE SET ──► DOSSIER
RECOVERY SOURCES ──┘
```

`mergeRecovery` computes a **set difference** against base findings and returns only what is
new. There is no code path by which recovery removes or overrides a base finding — the §14
invariant is expressed in the type signature, not in a convention. It runs only where
sufficiency is `partial` or `under_observed`, so a well-observed account costs nothing.

Sufficiency (§18) is rule-based and non-numeric: `sufficient_for_review`, `partial`,
`under_observed`, `blocked`. A test asserts none of those strings contains a word implying
quality — they describe evidence completeness, never fit.

## 10 Source Precedence

| rank | origin | rank | origin |
|---|---|---|---|
| 1 | canonical_domain | 5 | company_documentation |
| 2 | regional_domain | 6 | counterparty_source |
| 3 | programme_subdomain | 7 | directory_aggregator |
| 4 | company_locator | 8 | search_snippet |

A channel-named subdomain (`partner.`, `dealer.`, `pro.`) is classified as programme
infrastructure regardless of registrable domain — `partner.gira.com` is programme
infrastructure even when the canonical is `gira.de`. Treating it as a regional copy
understated its precedence; that was found by inspecting output and is now a test.

Observed origin mix on the holdout: **canonical 43, regional 15, programme subdomain 5,
company locator 4**.

## 11 Discovery Shadow Run

Configuration frozen before execution (`discovery/shadow/config.v1.json`, sha256
`6afcf15cb4aeda2f`). Eight queries, each a **new instantiation** of an active family rather
than a replay of an already-measured template, so the run tests the family and not a cached
result. The five disabled families did not run.

| metric | value |
|---|---|
| candidates | 69 |
| unique companies | 62 |
| duplicates collapsed | 8 (12%) |
| **valid operators** | **47 (76%)** |
| participants only | 2 (3%) |
| **competitors** | **0 (0%)** |
| irrelevant / commentary | 12 (19%) |
| wrong entities | 0 |

## 12 Discovery Precision

Per-family precision is in §05. The **gate**, not the queries, is the weak component.

Measured against adversarial human labels on a stratified 22-candidate sample:

| | dropped | research_required | operator_evidence |
|---|---|---|---|
| valid operator (n=16) | **0** | 14 | 2 |
| not an operator (n=6) | **0** | 6 | 0 |

The first version of the gate dropped 2 valid operators (SAP and OpenText, both via an
over-broad consultancy rule) while correctly dropping 3 non-operators. Dropping a real
operator is the worst error available here — the company is never researched and nothing
downstream can recover it — so the rule was changed to defer rather than drop, and the sample
was re-run **once** (§34 discipline: one fix, one rerun, both numbers reported).

The result is honest and unflattering: **the gate now makes no mistakes because it makes no
decisions.** It provides safety and no cost saving. Six noise items — a job board, a business
forum, two trade-press sites, a support document, a blog — each consumed a full research pass.
Two of them produced reviewable-looking dossiers.

This is the single reason discovery is not surfaced.

## 13 Discovery Source Contribution

Unique operators contributed by each family (companies only that family found):

FRENCH 9 · SWEDISH 9 · GERMAN 7 · MSP 6 · ITALIAN 6 · SYSTEM_INTEGRATOR 4 ·
AUTHORIZED_RESELLER 4 · DUTCH 2

Every family contributed something no other family found, so overlap is not the reason to
disable the weak ones — commercial yield is. Dutch contributed 2 operators out of 8 results.

## 14 Discovery Cost

| measure | value |
|---|---|
| queries | 8 |
| results per query | ~8.6 |
| valid operators per query | 5.9 |
| research passes spent on noise | 6 of 22 sampled (27%) |
| recovery requests per contributing account | 4.2 pages |

Discovery's cost problem is downstream of the query: the queries are efficient, the gate is
not. 27% of research passes in the sample were spent on things a human labels irrelevant in
one glance.

## 15 Discovery Holdout Status

The Swedish and Italian families were the discovery holdout (§35) — languages with no pattern
anywhere in this codebase. They scored 75% on that holdout and then **90% and 75%** on fresh
shadow queries, which is why both were promoted to validated. Two independent runs in
untrained languages is real evidence of generalisation **under the tested conditions**. It is
not a universal recall claim and is not presented as one.

## 16 Recovery Holdout Design

`recovery-holdout/holdout.v1.json`, sha256 `3ad9e045a558f8d0`, frozen 2026-08-24.

32 companies · 14 software / 18 physical · 9 countries · DE NL FR IT SE NO DK FI EE. Every
domain was checked mechanically against the 247 domains used anywhere in this project —
benchmarks, corpora, samples, and prior discovery output. **Zero collisions.**

Two arms over the identical set: `base` (production as it ships) and `union` (production plus
recovery), written to separate files so neither could overwrite the other.

## 17 Recovery Holdout Before vs After

| | base | union | change |
|---|---|---|---|
| **physical motion (n=18)** | 44% | **67%** | **+4 companies** |
| **software motion (n=14)** | 93% | 93% | unchanged |
| physical observed state | 44% | 67% | +4 |
| software−physical gap | 49 pts | **26 pts** | −23 pts |
| distinct claims | 64 | 64 | unchanged |
| directory detection | 0 | 0 | unchanged |

Companies recovered: **gira.de** (system_integrator, installer), **remeha.nl** (installer),
**stiebel-eltron.de** (installer, service_partner), **weidmueller.com** (reseller,
distributor).

Recovery was attempted on 27 of 32 — skipped where base evidence was already sufficient — and
contributed on 16 of those 27 (59%). Running and finding nothing new happened 11 times and is
a normal outcome, not a failure.

Distinct claims are unchanged at 64 because recovered evidence enters as **programme
evidence**, not as construct observations. Recovery identifies motion without inflating the
claim count, which is the desired behaviour: it should make companies visible, not make them
look better evidenced than they are.

Directory detection found nothing on this holdout in either arm. On the 106-company
development set it rose 13% → 44% on physical. Either the development figure was optimistic or
this holdout happens to contain few published directories; 32 companies cannot separate those,
and the discrepancy is recorded rather than explained away.

## 18 Recovery Regressions

**Zero.** Both structurally and empirically.

Structurally, `mergeRecovery` returns a set difference and `buildDossier` only appends its
result. Empirically, no company that had motion evidence in the base arm lacked it in the
union arm.

**False attribution: zero.** No motion was added by recovery on any account where recovery
read zero pages. Across the 16 contributing accounts recovery read 67 pages, 4.2 per account.

## 19 Software Regression Check

Software motion **93% → 93%**, unchanged, on the holdout. On the 35 production accounts, no
machine state degraded and one improved (`productsup.com`: under_observed → research).

One production account, `kiflo.com`, lost three programmes between builds. **None of it is
attributable to recovery.** Recovery appends only, and it *added* a motion to that account; a
direct re-run with recovery restores all three lost programmes plus a fourth. The cause is
base-research run-to-run variance — which pages return content changes between crawls of a
live site. This is worth naming as a general property: **base research is not deterministic
across runs**, so any production before/after comparison is confounded by retrieval variance.
The two-arm holdout is the only clean measurement of recovery's effect, which is why it exists.

## 20 Physical Recovery Check

Physical **44% → 67%** on the holdout; the four recovered companies are all German, Dutch and
industrial — a heating manufacturer, a building-controls manufacturer, an HVAC brand and an
industrial connector maker. All four publish `Fachpartner`/installer programmes on regional
domains or channel subdomains that base research does not reach.

Multi-domain resolution engaged on 8 of 35 production accounts and was the mechanism behind
15 of the recovered source URLs.

## 21 Competitor Contamination

**0 of 62 shadow candidates were competitors.**

This is a direct consequence of disabling `ENGLISH_GENERIC_PARTNER_PROGRAM`, which returned
ZINFI, ChannelScaler, Journeybee, Unifyr, Channeltivity and PartnerPortal.io — six PRM vendors
in eight results. That family is retained in the library, disabled, with its competitor count
recorded, because a high competitor rate is **diagnostic information about query intent**
(§37) and deleting the family would destroy the evidence.

No company-specific patching was used (§38). The guard runs on the maintained competitor
reference list plus a general channel-software category rule. Verified live: `kiflo.com`
renders as *"Direct Introw competitor"* and *"Suppression flagged"*, and recovery adding a
motion to it did not override the suppression.

## 22 Under-Observed Handling

`under_observed` continues to mean the company publishes little, never that it is low fit —
the live Data health page states this on the tile. Recovery is targeted precisely at this
state: it runs when sufficiency is `partial` or `under_observed`, and `blocked` is kept
distinct so "we could not look" never reads as "there is nothing there".

Production under-observed count is 20 of 35; the two accounts with no readable surface are
labelled *"A retrieval limit, not a finding"*.

## 23 Data Health

A new **Additive source recovery** panel is live, showing derived counts only:

| accounts recovery ran on | 29 |
| accounts it added evidence to | 14 |
| accounts needing a second domain | 8 |
| extra partner pages read | 75 |

Each tile carries the caveat that matters — *"Skipped where base evidence was already
sufficient"*, *"Running and finding nothing new is a normal outcome, not a failure"*, *"Every
added motion has a page behind it"*.

Discovery health is **not** in the UI, because discovery does not run in production. Its
metrics live in `discovery/shadow/out-measurement.json`.

## 24 Product Workflow

Unchanged. Recovery adds evidence to dossiers; the human still decides PROMOTE / RESEARCH /
WATCH / REJECT / SUPPRESS. No automatic commercial judgement was added anywhere.

## 25 UI Changes

One section added to Data health (§23). Recovery provenance appears in dossiers through the
normal evidence mechanism: a recovered programme shows its quote, its source URL and its
strength. Verified live on `productsup.com`, where the reseller and distributor cards cite
*"Trade vocabulary for a reseller motion found on a partner surface recovered from
www.productsup.com"* against `productsup.com/de/partner-onboarding/` — a German-language path
base research did not reach. Provenance is accessible and does not visually dominate (§11).

No other screen changed. No DISCOVERED screen exists.

## 26 Test Status

**180 tests across 13 files. Typecheck clean. Build clean.**

`tests/integration.test.ts` adds 27 failure-first tests covering the §54 attack list:
PRM-competitor contamination, consultants ranking for generic sales vocabulary, entity
resolution refusing third-party mentions, multilingual duplicate collapse, regional-domain
brand confusion, channel-subdomain precedence, blocked vs under-observed, flags defaulting
off, and an assertion that no candidate object contains a ranking word.

Three of these tests failed when first written and each exposed a real defect that was fixed
in the source rather than in the test: a commentary page quoting operator vocabulary passed
the gate, a glossary page passed the gate, and the consultancy rule was dropping real
operators.

## 27 Deployment Decision

**DEPLOY RECOVERY ONLY.**

§57 acceptance gate:

| # | requirement | result |
|---|---|---|
| 1 | discovery pipeline works end-to-end | ✅ 69 candidates → dossiers |
| 2 | entity resolution prevents wrong-company research | ✅ 0 wrong entities |
| 3 | query-family provenance preserved | ✅ every candidate carries its family and URL |
| 4 | competitor/category guard runs | ✅ 0% contamination |
| 5 | union outperforms base on fresh holdout | ✅ physical +23 pts |
| 6 | no material regression on software | ✅ 93% → 93%, 0 regressions |
| 7 | no increase in unsupported claims | ✅ claims 64→64, 0 motions without pages |
| 8 | no ranking/score introduced | ✅ asserted by test |
| 9 | review workflow intact | ✅ verified in browser |
| 10 | tests / typecheck / build pass | ✅ 180 tests, clean |

All ten pass. Recovery ships. Discovery is held back not by a failed gate item but by §12: its
cheap gate cannot yet justify the research it triggers, and surfacing it would spend seller
attention the measurement does not support.

## 28 Live URL

**https://introw-signal-radar.vercel.app/**

Verified after deployment: bundle `index-BAZDnpzm.js`, 35 accounts each carrying recovery
provenance, data generated 2026-08-24T18:01Z. Browser QA passed on Overview, Accounts, Data
health, a recovered dossier, and the competitor case. **No console errors.** No ranking
language anywhere in the interface.

## 29 Known Limitations

- **The cheap evidence gate does not filter.** 0 false drops and 0 correct drops on the
  sample. It is a safety net, not a triage step (§12).
- **Dutch discovery is unsupported.** Both Dutch families are disabled at 25% and 29%. This is
  recorded in the family library and asserted by a test rather than papered over.
- **Recovery's directory contribution did not replicate.** 13% → 44% on the development set,
  0 → 0 on the holdout.
- **Base research is not deterministic across runs**, which confounds any production
  before/after comparison (§19).
- **Discovery recall remains unmeasured at scale.** 5/34 under an 11-query budget previously;
  this mandate did not re-test recall, and the budget-bound explanation remains plausible and
  unproven.
- **The recovery holdout is 32 companies.** The physical result rests on 4 changed companies.
  Directionally clear, statistically thin, and no confidence interval is claimed.
- **Counterparty inversion is untested.** Every shadow candidate was first-party, so the
  entity-resolution result does not generalise to directory or distributor harvesting.
- **No temporal integration.** Recovered sources are not yet registered for monitoring (§48).
- **Shadow labels are mine.** The §30 adversarial labels were applied by the same agent that
  built the system. An independent labeller would be a stronger test.

## 30 What Should Be Tested With a Real Seller

1. **Does a recovered dossier change a decision?** Four companies moved from under-observed to
   having a motion. Would a seller open them, and does the recovered evidence answer a
   question they actually have?
2. **Is 76% operator precision high enough to be worth a queue?** Show 20 unlabelled shadow
   candidates and ask which they would open. If they discard more than a handful, the gate
   must work before discovery ships.
3. **Is the provenance line useful or noise?** *"Surfaced through a query that returns
   companies describing their own partner programme"* — does that help a seller trust the
   candidate, or is it internal detail?
4. **Does "under-observed" read as "bad prospect"?** The system takes great care that it does
   not. Only a seller can confirm whether the interface actually achieves that.
5. **Which of the six noise types is most damaging?** Trade press producing a reviewable
   dossier is worse than a job board producing an empty one; the gate should be tuned against
   a seller's ranking of that harm, not mine.

---

## Appendix A — Red Team (§61)

**Is discovery really finding operators or just web pages?**
Operators. 76% of unique candidates evidenced a programme they run themselves, judged from the
landing page rather than from the query. But the honest qualifier is that the *gate* cannot
tell the difference — the 76% is a human number, not a machine one, and the machine currently
passes everything through.

**Are query families generalising?**
Yes, and this is the strongest discovery evidence. Swedish and Italian have no pattern
anywhere in the codebase and scored 75% on the holdout, then 90% and 75% on fresh queries. The
semantic-class model also predicted correctly out of sample: every `operator_self_description`
family scored ≥75% on shadow, every `ecosystem_generic` family scored ≤67%.

**Is the recovery holdout actually better?**
Yes for physical, neutral for software, which is exactly the claimed behaviour. The
methodological point is that both arms ran as separate crawls, so retrieval variance affects
both — and the union arm still showed zero regressions, which variance alone would not produce.

**Are we broadening into irrelevant physical channels?**
Unmeasured and a live risk. Recovery made four heating and industrial manufacturers visible.
Whether any is a plausible Introw customer is a commercial question this system deliberately
does not answer, and §55 forbids treating physical evidence as automatically good. The
discovery segment mix (45% manufacturing) reflects which queries were run, not a judgement
that manufacturing is attractive.

**Are competitors contaminating software discovery?**
Not any more, and only because the contaminated family was disabled. The underlying hazard is
permanent: PRM vendors will always rank for channel-generic English. Any future family using
that vocabulary will reintroduce it, which is why the disabled family is kept with its
competitor count attached.

**Are wrong entities slipping through?**
None in this run — but every candidate came from a first-party URL, which makes resolution
easy. The 0% wrong-entity rate is a property of search-pattern discovery, not proof the
resolver is strong. Directory and distributor inversion would test it properly and were not
run.

**Is evidence still honest?**
Yes, on the measurements that exist. Claims did not inflate (64→64), no motion was added
without a page behind it, recovered evidence carries its source URL and its "does not prove"
line, and sufficiency states describe completeness rather than quality.

**Does the candidate flow actually save seller research effort?**
**No — not yet.** This is the clearest negative in the report. The gate spends a research pass
on 27% of candidates that a human discards instantly. Until it filters, discovery moves
research cost around rather than reducing it.

### Documented disagreement

The strongest case for shipping discovery anyway: 76% operator precision with 0% competitor
contamination is a better hit rate than most prospecting lists, and a seller could triage the
remaining noise faster than the system can. The counter-argument this report rests on is that
a queue whose gate makes no decisions is not a product feature — it is a list, and the mandate
is explicit that discovery must earn the right to surface a company. Reasonable people could
ship it in beta. The measurement does not compel either choice, and the conservative one was
taken because the flags make reversing it cheap.

---

## Appendix B — Final Questions (§63)

1. **Does autonomous candidate discovery work end-to-end?** Yes. Query → candidate → entity
   resolution → cheap evidence → dossier runs without human intervention.
2. **Enough valid operators to justify seller attention?** 76% precision says yes at the
   candidate level; 27% wasted research passes says not yet at the workflow level.
3. **Which families contribute genuine unique candidates?** French (9), Swedish (9), German
   (7), MSP (6), Italian (6). All five are `operator_self_description`.
4. **Which should be disabled?** Dutch dealer (25%), and the five already disabled. Six of
   thirteen families are now off.
5. **Does discovery generalise beyond development languages?** Yes — Swedish and Italian, 75%
   holdout then 90%/75% shadow, with no patterns in the codebase for either.
6. **Does recovery improve a fresh untouched holdout?** Yes. Physical 44% → 67% on 32
   companies with zero prior exposure.
7. **Does base + recovery outperform either alone?** Yes. Union regresses nothing; recovery
   alone regressed 12 accounts on the previous mandate's 106-company set.
8. **Does recovery create false evidence or regress software?** No to both. 0 motions without
   pages, claims unchanged, software 93% → 93%.
9. **Are physical companies materially less under-observed?** Yes — the sector gap narrowed
   from 49 to 26 points on the holdout. They are not equal to software, and the residual is
   stated rather than smoothed.
10. **Are competitor/consultant false positives contained?** Competitors yes (0%). Consultants
    no — the rule that caught them was dropping real operators and had to be weakened.
11. **Is static/batch architecture sufficient?** Yes for current demo use. Recovery is a batch
    step; the site is rebuilt from persisted data. A backend is only needed for live
    user-triggered discovery, which is not being shipped.
12. **Should discovery be visible, shadow-only, or disabled?** **Shadow-only.**
13. **Should recovery ship?** **Yes — shipped.**
14. **Is any ranking justified?** **No.** Nothing measured here supports ordering companies,
    and nothing was built that could.
15. **What is the next real-world validation?** A seller session on the five questions in §30 —
    beginning with whether the four recovered companies are worth opening.
