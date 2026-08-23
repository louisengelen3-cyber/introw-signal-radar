# Introw Signal Radar — Phase 3 Report

**Positive prospect identification, method audit and temporal foundation**
**Date:** 23 August 2026
**Frozen sets:** `phase3/benchmark/controls.v1.json` (14 clean negatives, 15 matched unlabelled) · `phase3/benchmark/customer-split.json` (13 discovery / 6 holdout) · temporal baseline `2026-08-23T07:36:46Z`
**Recommendation:** **RESEARCH-RADAR GO**, with autonomous promotion as a working but conservative subset

---

## 01 Executive verdict

Phase 3 asked whether positive, publicly observable structure can promote good programmes rather than merely demote bad ones. It can — **7 of 19 known customers positively promoted against 0 of 14 clean negatives falsely promoted**, up from Phase 2's single `strong` in fifty.

But the more consequential findings are two corrections to my own prior work.

**The classifier was biased against Introw's own ICP, and it is now measured.** Across the 22 known customers: those the Phase 2 classifier caught averaged **1.53** formal channel artefacts; those it missed averaged **0.14**. The Phase 2 lexicon encoded *mature, formalised* channel vocabulary, and Introw's customers frequently do not use it. All four channel-classification misses publish their partner motion in plain business English that any human would recognise.

**Phase 2's headline distribution result does not survive its own label audit.** Thirteen of fourteen Cohort C negative rationales *cite distribution structure*, so measuring distributor-carriage against those labels partly measured my own priors. Re-tested against controls whose negative basis is independent: customers 1/19 carried, clean negatives **0/14**, matched unlabelled 2/15. The signal separates nothing. It is withdrawn from demotion and demoted to a research trigger.

**And a human reviewing the evidence outperforms the automatic threshold.** On a bounded sample, six of six records were decidable from the review record alone with zero extra sources opened — and all four known customers in that band were promotable while the machine had promoted none. Evidence capture works; automatic promotion is conservative.

---

## 02 Customer-miss teardown

Every publicly identifiable Introw customer, run through the pipeline, with the layer that stopped it recorded.

| stopped at | n | companies |
|---|---|---|
| Reached suitability | 15 | Factorial, Quatt, Cumulocity, Cubbit, Sedai, Epiphan, SafeBreach, Coder, ShareGate, Archer, Axon, Aikido, Parloa, ReversingLabs, Storyblok |
| **Channel classification** | **4** | **Ringover, Zenity, Xelix, Payflip** |
| Retrieval (bot-blocked) | 2 | WeGive, Personio |
| Identity (domain does not resolve) | 1 | Tensis |

### Would a careful human have recognised the partner motion?

Yes, in all four cases, from the same public pages the system retrieved:

| customer | what the page actually says |
|---|---|
| **Ringover** | *"helps technology consultants collaborate with us via **co-marketing and co-selling**… **grow their own consulting business' recurring revenue streams**"* |
| **Xelix** | *"We help outsourcing firms **win new deals** and retain existing clients by **introducing our innovative F&A solution into their delivery projects**"* — plus a partner enquiry form with a 24-hour response commitment |
| **Zenity** | *"**Value-Added Resellers (VARs)** — Our VAR partners **expand Zenity's reach**"*, *"**Become a Partner**"* |
| **Payflip** | Four named partner types (payroll, HR, accountancy, benefit) and *"**Do you have a new lead for Payflip? Fill in the form below**"* — lead registration in its simplest possible form |

### Failure classes

1. **Vocabulary mismatch (4 of 7 misses).** The evidence is published, retrievable and unambiguous. The lexicon required formal channel jargon; the companies use ordinary business English. **Fixable, and fixed.**
2. **Bot protection (2).** WeGive and Personio refuse retrieval. Not fixable from public data.
3. **Entity resolution (1).** Tensis: the domain I mapped in Phase 0 does not resolve. Fixable by better resolution or by a human.

**Roughly 4 of 7 misses were fixable detector logic, not source scarcity.**

## 03 Mature-channel bias test — SUPPORTED

Maturity artefacts were counted independently of the fit verdict, so the test is not circular.

| group | n | mean maturity artefacts |
|---|---|---|
| Caught by the classifier | 15 | **1.53** |
| Missed | 7 | **0.14** |

An order-of-magnitude difference. The architecture was strongest exactly where Introw is weakest commercially: formalised, mature channel programmes. The four missed customers are the young, informal programmes the thesis describes as the core ICP.

**This is the single most important finding in Phase 3**, because it means the earlier precision numbers were partly bought by systematically not seeing the right companies.

## 04 Bottom-up customer pattern discovery

Nineteen customers with retrievable partner pages, read with probes grouped by *commercial question* rather than by the existing feature list. Frequency of what they actually say:

```
recruits partners in the first person   13/19    ← highest-frequency positive observation
names the partner types it manages      12/19
certification or training               11/19
partner sells or resells                10/19
partner grows their own revenue          8/19
partner portal                           8/19
commission mechanics                     7/19
FORMAL DEAL REGISTRATION                 6/19    ← Phase 2's "decisive" artifact
partner tiers                            4/19
```

**Formal deal registration — which Phase 2 treated as decisive on its own — appears on under a third of customers.** First-person recruitment appears on more than twice as many.

## 05 Frozen positive hypotheses

Three constructs, measured **separately** and deliberately never summed. `src/suitability/positive.ts` carries the full definitions, each probe stating what it proves and what it does not.

**A · Commercial materiality** — are partners visibly involved in acquiring customers or revenue? Strong probes: partner resells or co-sells · partner grows its own revenue · partner sources deals or leads. Weak: extends reach · implements.

**B · Operational ownership** — does the company operate the motion itself? Strong probes: first-person recruitment · names the partner types it manages · operates its own intake. Weak: provides partner resources.

**C · Operational surface** — is there enough machinery for PRM software to act on? Strong: deal registration · partner portal. Weak: tiers · certification · commission · directory · multiple tracks.

**Promotion requires positive evidence on all three.** "No negatives found" is explicitly not a promotion; every `high_fit` carries named supporting observations with quotes and sources.

## 06 Label provenance audit

| cohort | leakage risk | why |
|---|---|---|
| A · customers | **none** (16/16) | Labels come from Introw's own case studies and CNAME fingerprints — nothing we detect |
| B · plausible | **high** (20/20) | Sampled from Phase 1 distributor-inversion output; inherits the distributor property by construction |
| C · poor fit | **high (13/14)** | **13 of 14 negative rationales cite distribution structure in their own text** |

Only one Phase 2 negative (Deloitte, labelled on participation) is independent of the feature under test.

## 07 Clean control construction

Fourteen clean negatives, admissible only if the negative rationale is independent of distribution, complexity and size:

- **participant_only** (4) — Softcat, Computacenter, Bechtle, Insight: IT resellers that join vendors' programmes
- **professional_services_partner** (5) — Deloitte, Freshfields, Bain, Sequoia, Index
- **integration_only** (3) — Linear, Sentry, PostHog
- **affiliate_only** (2) — Semrush, Kinsta

Fifteen **matched unlabelled prospects**, matched to a customer on category, segment, geography and stage — carrying **no fit label**, because a non-customer is not a negative.

## 08 Matched-control design

Each match pairs a customer with a comparable company on product category and market shape, **not** on the features under test: Aircall↔Ringover, Personio↔Factorial, Silverfin↔Payflip, Nedap↔Quatt, Wiz↔Zenity, Snyk↔Aikido, Contentful↔Storyblok, Basware↔Xelix, Wasabi↔Cubbit, Vectra↔SafeBreach, and four Benelux/industrial matches.

## 09 Distribution confounding test

Absolute counts. n is small and a percentage would overstate it.

| population | n | distributor-carried |
|---|---|---|
| Known customers | 19 | **1** |
| Clean negatives | 14 | **0** |
| Matched unlabelled | 15 | 2 |

Within segment:

- **software** — customers 1/12 carried · matched unlabelled 0/9
- **security** — customers 0/4 · matched unlabelled 1/3
- **hardware** — customers 0/3 · matched unlabelled 1/3

And once ownership is known, carriage adds nothing: of 3 carried companies, 2 have direct/mixed ownership and 0 are promoted; of 45 not carried, 27 have direct/mixed ownership and 10 are promoted.

## 10 Distribution verdict — **UNRESOLVED**, and the Phase 2 claim is withdrawn

Phase 2's 1/16-vs-10/14 result came from a cohort whose labels cite distribution in 13 of 14 rationales. Against independent controls the signal separates nothing.

Stated precisely: **this design cannot settle the question either way.** My clean negatives are professional-services firms, IT resellers and integration-only SaaS — none of which appear on IT-distributor brand lists, so there is no overlap to test against. Only 3 of 48 companies here are carried at all.

Settling it needs a specific future experiment: clean negatives that **are** distributor-carried — companies with a real transacting channel, judged poor-fit for reasons unrelated to distribution.

**In code:** the multi-distributor demotion is withdrawn. It now emits `research_required` with a named research task, not `weak`.

## 11 Positive fit constructs, measured separately

| population | materiality confirmed/strong | ownership direct/mixed | surface rich/moderate |
|---|---|---|---|
| Customers (discovery, n=13) | 6 | **12** | 7 |
| Customers (holdout, n=6) | 3 | **6** | 5 |
| Clean negatives (n=14) | 2 | **3** | **0** |
| Matched unlabelled (n=15) | 3 | 8 | 6 |

**Operational ownership is the strongest single discriminator: 18 of 19 customers, 3 of 14 clean negatives.** Operational surface is next: 12 of 19 customers, **0 of 14** negatives. Materiality is the weakest — 9 of 19 customers — but it is what recovers the missed customers, so it earns its place.

## 12 Positive promotion performance

| population | n | high_fit | plausible | under_observed | not_promoted |
|---|---|---|---|---|---|
| Known customers (discovery) | 13 | **5** | 1 | 4 | 3 |
| Known customers (holdout) | 6 | **2** | 1 | 0 | 3 |
| Clean structural negatives | 14 | **0** | 0 | 8 | 6 |
| Matched unlabelled prospects | 15 | 3 | 0 | 5 | 7 |

**7 of 19 known customers positively promoted. 0 of 14 clean negatives falsely promoted.** Phase 2: `strong` fired 1 time in 50.

The three promoted unlabelled prospects — Aircall, Basware, Wiz — are discovery candidates. They are neither correct nor incorrect; that is what an unlabelled population means.

## 13 Holdout performance

Run once, on six customers whose pages did not inform hypothesis generation: **2 promoted to high_fit, 1 plausible, 3 not promoted.** Directionally consistent with discovery (5 of 13). With n=6 this shows the model did not collapse — nothing stronger.

## 14 Customer-miss recovery

| customer | Phase 2 | Phase 3 materiality | ownership | promotion |
|---|---|---|---|---|
| Ringover | channel not established | **confirmed** | direct | plausible |
| Xelix | channel not established | **confirmed** | direct | plausible |
| Zenity | channel not established | weak proxy | direct | under-observed |
| Payflip | channel not established | weak proxy | direct | under-observed |

**All four moved from invisible to visible with named positive evidence.** None reached automatic `high_fit`, because all four publish no formal artefacts and score `surface: unknown`. In the review prototype a human promoted all four from the record alone.

That is the honest shape of the recovery: **evidence capture recovered them completely; automatic promotion recovered them partially.**

## 15 Observability bias

Tracked separately from fit and never rewarded:

| evidence density | n | high_fit | under_observed |
|---|---|---|---|
| rich | 7 | 6 | 0 |
| moderate | 16 | 4 | 0 |
| sparse | 21 | 0 | 17 |
| none | 4 | 0 | 0 |

**Promotion correlates strongly with publication density — 6 of 7 rich-density companies are promoted, 0 of 21 sparse ones.** This is a real limitation and it points the same way as the maturity bias: the system rewards companies that publish.

The mitigation is structural rather than statistical. Sparse accounts route to `under_observed` with an explicit note — *"a sparse account may be a strong fit that publishes little"* — never to a demotion. Seventeen of twenty-one sparse accounts land there.

## 16 Programme-level findings

The schema supports `ProgramOwnership` and per-programme motions, and the operator resolver attributes evidence to the surface that carries it. In practice public evidence rarely separates programmes cleanly enough to justify per-programme verdicts — Ringover publishes distinct Staffing Agency, HubSpot and technology tracks, but on one page with shared language. Architecture allows it; the evidence does not yet require it.

## 17 Event source feasibility

| role | verdict | measurement |
|---|---|---|
| **Person enrichment** | **SUPPORTED** | 34 partner titles extracted across 5 organiser sources, **25 of them Tier-1** partner leadership |
| Discovery seed | **UNRESOLVED** | Only 28 company names survived filtering, and the extractor still returns person names as companies. Event pages publish titles far more reliably than employers. |
| Priority accelerator | UNRESOLVED | Would need attendee lists matched to an account list; attendee lists are private, only speakers and sponsors are published |
| Context | Always supported | Attendance evidences a partner function that exists and travels |

**A correction:** my first run reported `discovery_seed: SUPPORTED` on a count of 72 companies. Inspection showed the extractor was returning title fragments — "Chief Partner", "Strategic Alliances", "April". A second bug used a stateful `/g` regex inside `.test()`. Both are fixed and the verdict is now UNRESOLVED. The earlier number should not be cited.

## 18 People-provider strategy

No credentials, so a bake-off design rather than a bake-off. Gold set: 20–30 companies where the correct current partner-owning person can be established manually — drawn from the customers whose case studies name a person, plus matched controls.

Metrics: target-person recall · current-title precision · current-company precision · duplicate rate · role freshness · geography coverage · cost per resolved company · API usability · licensing fit. Candidates: People Data Labs, Proxycurl, Apollo, Cognism.

**Status: unresolved and it will block a GTM queue.** Public people coverage is unchanged from Phase 0 — roughly one named Tier-1 persona across ten companies from company-owned pages. The event corpus adds Tier-1 people but person-first, not for a named account.

## 19 The 2+ partner-manager rule

Preserved as **commercially important evidence**, not operationalised as a gate. No compliant, reliable source for exact team headcount exists in this project, and `unknown` remains neutral: **no people found is not team < 2.**

When a provider exists, the rule should be tested rather than assumed — including whether it holds across the published customer set, since the thesis itself notes the ICP drifted upward and the case studies span several generations of it.

## 20 Snapshot system

**Running. Baseline `2026-08-23T07:36:46Z`. 276 snapshots across 50 companies, all first observations.**

Covered: partner-host DNS/CNAME · platform fingerprints · partner URL inventory · partner surface content. Cadence set by volatility, documented with reasons — DNS weekly (a CNAME change is the cleanest migration signal and is cheap), surfaces biweekly, inventory monthly.

Change detection separates **raw change** (a copy edit, a rotating widget) from **semantic change** (a structural marker appearing or disappearing). Volatile noise — timestamps, build hashes, cache-busting parameters — is normalised out before hashing.

## 21 Temporal observations

**No semantic change was detected, because none could be: every observation is a first observation.** All 276 are `first_observation`, four are `unobservable` (blocked retrieval).

No Why Now is claimed anywhere. The UI states it plainly: *"No verified recent trigger. Temporal baseline started 23 Aug 2026 — change claims require a second dated observation."*

**The success here is that history is now accumulating.** Every timing verdict in Phase 2 failed for want of a second dated observation; from today there will be one.

## 22 Commercial review prototype

A review record carries positive evidence with quotes and sources, negative evidence, unknowns, programme ownership, channel class, PRM, evidence density, research tasks, a machine suggestion, and a **customer-miss risk flag** raised when an account matches the profile the model historically lost.

Across 48 records: PROMOTE 6 · KEEP_PLAUSIBLE 2 · RESEARCH 15 · DEMOTE 14 · SUPPRESS 11. Seven records carry a customer-miss risk flag.

## 23 Review-time measurement

Measured by actually reviewing, not simulated.

**Six of six records decidable from the record alone. Zero additional sources opened.** Median sources a reviewer must open to verify the machine's claims: **1**.

| account | machine | human | extra sources |
|---|---|---|---|
| payflip.be | RESEARCH | **PROMOTE** | 0 |
| ringover.com | KEEP_PLAUSIBLE | **PROMOTE** | 0 |
| zenity.io | RESEARCH | **PROMOTE** | 0 |
| xelix.com | KEEP_PLAUSIBLE | **PROMOTE** | 0 |
| sequoiacap.com | RESEARCH | DEMOTE | 0 |
| sentry.io | RESEARCH | DEMOTE | 0 |

**All four known customers in the band were promotable and the machine had promoted none.** The cost was reading four to six quoted observations — well under a minute per account.

Caveats: n=6, drawn from the easier half of the band; 11 of the 17 band records carry no positive evidence at all and would need research from scratch; and I am not an Introw AE.

## 24 Remaining blind spots

1. **Promotion tracks publication.** 6 of 7 rich-density companies promoted, 0 of 21 sparse. Mitigated by routing to `under_observed`, not solved.
2. **Automatic promotion is conservative** — it misses exactly the informal programmes that are Introw's ICP. A human recovers them; the machine does not.
3. **Materiality has weak recall** — 9 of 19 customers. It is the construct that recovers misses and the one least often observable.
4. **Distribution is unresolved and untestable with these controls.**
5. **No people data.** Unchanged, and it blocks a GTM queue.
6. **No timing yet.** History starts today; nothing can be claimed for weeks.
7. **Two bot-blocked customers and one dead domain** remain permanently invisible.
8. **n is small throughout** — 19 customers, 14 clean negatives, 6 holdout.
9. **Industrial remains not served**, frozen from Phase 2 and not revisited.

## 25 What should be built next

1. **Human-in-the-loop review as the product surface.** The measurement supports it directly: evidence capture is better than the automatic threshold, and a reviewer resolves a record in under a minute.
2. **Keep the snapshot loop running.** It is the only route to Why Now and it costs nothing but time.
3. **Broaden the positive probes against more customer language**, particularly materiality, which is the weakest construct and the one that recovers misses.
4. **A people-provider bake-off** as soon as credentials exist. It is the binding constraint on a queue.
5. **The distribution experiment done properly** — clean negatives that are themselves distributor-carried.

## 26 What should NOT be built next

Production scoring · a 0–100 score · a `PartnerLedScore` · the final GTM Queue · polished production UI · mass discovery · broad industrial crawling · CRM detection investment · partner-count engineering · any Why Now before a second dated observation exists · the 2+ manager rule as an automatic gate.

---

## Answers to the fifteen Phase 3 questions

1. **Why did customers fail?** Vocabulary mismatch (4 of 7), bot protection (2), entity resolution (1). The evidence was published and retrievable in all four vocabulary cases.
2. **Is the system biased toward mature channel language?** Yes — caught 1.53 artefacts, missed 0.14.
3. **What do customers positively share?** First-person recruitment (13/19), named partner types (12/19), partner resells (10/19), partner grows own revenue (8/19).
4. **Which survive matched controls?** Ownership (18/19 customers vs 3/14 negatives) and surface (12/19 vs 0/14) hold strongly. Materiality holds weakly (9/19 vs 2/14).
5. **Is distributor-carried independently useful?** **No — unresolved.** It separates nothing against independent controls.
6. **Are the poor-fit labels independent?** **No.** 13 of 14 cite distribution.
7. **Can positive evidence promote more?** Yes — 7 of 19 customers, against 1 of 50 in Phase 2.
8. **How many clean negatives falsely promoted?** **0 of 14.**
9. **Does "partner-led" survive as one concept?** **Partially.** Ownership and surface discriminate; materiality is weaker but recovers misses. Keep the three dimensions separate — the combined name would hide that they behave differently.
10. **What stays under-observed?** Sparse publishers (21 of 48), bot-blocked companies, and the industrial segment.
11. **Can events improve discovery?** **Person enrichment yes** (25 Tier-1 titles). **Company discovery unresolved.**
12. **Is the 2+ manager rule measurable?** Not yet. Needs a licensed provider, and should then be tested rather than assumed.
13. **What people capability does a queue need?** A licensed provider passing a gold-set bake-off on current-role precision and recall. Nothing public reaches it.
14. **Is a production prospect Radar justified?** Not autonomous. The automatic threshold under-promotes the core ICP.
15. **Is a human-in-the-loop research Radar the right product?** **Yes, on this evidence.**

## Verdict: RESEARCH-RADAR GO

The system reliably captures the right evidence, quotes it, attributes it, and separates what it proves from what it does not. It demotes clean negatives without error (0 of 14 falsely promoted) and it now promotes a real subset of customer-like programmes (7 of 19). A reviewer using the record decides in under a minute and outperforms the automatic threshold.

What it cannot yet do is promote autonomously without systematically under-serving the young, informal programmes that are Introw's stated ICP — the very bias Phase 3 measured and only partly corrected.

**Build the human-in-the-loop research Radar. Keep the snapshots accruing. Do not productionise autonomous promotion yet.**

---

*Two of my own prior conclusions are corrected here: Phase 2's distribution discriminator is withdrawn as label leakage, and the Phase 1/2 classifier is shown to have been biased against the customers it most needed to find. One Phase 3 result was also corrected mid-flight: an event-source verdict produced by a broken extractor.*
