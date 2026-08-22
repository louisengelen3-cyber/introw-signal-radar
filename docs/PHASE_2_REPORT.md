# Introw Signal Radar — Phase 2 Report

**Commercial qualification and industrial closure**
**Date:** 22 August 2026
**Frozen sets:** `phase2/benchmark/suitability.v1.json` (50 companies, 34 dev / 16 holdout, split before any rule was written) · Phase 1 industrial cohort (21 companies, unedited)
**Recommendation:** **NARROWED GO**

---

## 01 Executive verdict

**Yes — but for a narrower product than Phase 1 implied, and the narrowing comes from two measured findings rather than from caution.**

**Finding one: the operating model that separates an Introw account from a real-but-wrong channel is largely invisible on the vendor's own pages, and plainly visible from the counterparty side.** Across twelve public partner pages at NetApp, Sophos, Cisco, Nutanix and Forcepoint — companies whose channels are unambiguously distributor-led — the words `two-tier`, `through a distributor`, `authorised distributor`, `rebate`, `MDF` and `co-op` appear **zero times**. Those pages are reseller-recruitment marketing. The operating model lives behind the partner portal.

It is, however, published by the distributors themselves. Measured against the frozen benchmark:

| | distributor-carried |
|---|---|
| Known Introw customers | **1 of 16 (6%)** |
| Hypothesised poor-fit programmes | **10 of 14 (71%)** |

That is the strongest structural discriminator Phase 2 found, and it inverts where the evidence is looked for.

**Finding two: the industrial gap is not fixable plumbing.** Entity resolution v2 and locale-aware probing were built and measured against the same frozen 21 companies. Identity resolution improved materially. Channel classification did not move at all: **1 of 21 before, 1 of 21 after.** The residual is not blocked retrieval (0 of 21) and not identity (1 of 21) — it is **19 of 21 sites that are perfectly retrievable and simply publish no transacting channel**. Phase 1's "mostly fixable plumbing" hypothesis is refuted by its own follow-up.

**Holdout did not collapse.** On 16 companies whose labels were not inspected during tuning: **0 of 4 known customers demoted**, and **4 of 5 hypothesised poor-fit programmes demoted or routed to research (80%)** — better than the 44% on dev.

---

## 02 Industrial — before vs after, same frozen companies

The benchmark is the list of **names** a Belgian wholesaler published; the domain was always a derived artifact, so Phase 2 re-resolved those names. The company set was not edited.

### Identity resolution v2 — a real improvement

```
confirmed 11 · probable 9 · dead_domain 1 · unresolved 0
```

Five domains corrected, one refused:

| company | v1 | v2 | why |
|---|---|---|---|
| Bata | `bata.com` | `bata.de` | v1 resolved an electrical brand to a footwear company; the multilingual conflict check caught *"magasin de chaussures"* |
| BOVER | `bover.de` | `bover.pl` | v1's domain was a placeholder |
| DELTA LIGHT | `deltalight.com` | `deltalight.de` | context corroboration preferred the site that names the company |
| KDS | `kds.eu` | `kds.be` | as above |
| PROTAPE | `protape.ch` | `protape.it` | v1's domain was a redirect stub |
| TREND NETWORKS | `trendnetworks.net` | *refused* | `dead_domain` — v1 would have guessed |

Also recovered by the new candidate generation: `PEPPERL & FUCHS → pepperl-fuchs.com`, `LEINE & LINDE → leinelinde.com`, `LAPP CABLE → lapp.*`. Ampersand and hyphenated industrial brands were previously unresolvable.

### Channel classification — no movement

| | before | after |
|---|---|---|
| transacting / mixed | **1/21 (5%)** | **1/21 (5%)** |
| surfaced as candidate incl. research | 2/21 | 2/21 |

Locale-aware targeted probing ran **30 probes on 14 companies and found zero partner paths**, while correctly rejecting **30 soft-404 responses** (Ecodora answers every unknown path with a 200 at `/ita/404-error-page`; Circutor serves its homepage).

## 03 Industrial root cause — quantified

| cause | share |
|---|---|
| Genuine non-publication — site retrieved, no transacting channel published | **19/21 (90%)** |
| Identity unresolved after v2 | 1/21 (5%) |
| Technical blocking | **0/21 (0%)** |
| Locale/crawling failure | 0 companies where probing found a surface the crawl had missed |

**Verdict: INDUSTRIAL PUBLIC-DATA LIMITED.**

There is a commercial reading that makes this coherent rather than merely disappointing. These companies came from a Belgian *wholesaler's* brand list. A brand carried by a wholesaler frequently has no direct partner programme **because the wholesaler is the channel**. For many of them, "no transacting programme of their own" is not an observability failure — it is true, and they are not Introw accounts.

**Further industrial investment is not justified on this evidence.** The bounded attempt was made, measured, and did not move the number. What would change the verdict is a different *seed* — trade associations, certified-installer registries, manufacturer dealer locators — not more crawler engineering.

## 04 Distributor inversion audit

Phase 1 called distributor inversion "the discovery backbone" on the strength of the claim *"if a distributor sells your product, you operate a transacting channel."* Phase 2 treats that as the hypothesis it is, and it does not survive intact.

| cohort | on a distributor's carried-brands list |
|---|---|
| A · known Introw customers | 1 / 16 |
| B · plausible targets | 13 / 20 |
| C · hypothesised poor fit | 10 / 14 |

Two things follow.

**Cohort B is contaminated by construction.** It was seeded from Phase 1's distributor-inversion output, so it inherits the distributor property. Its 13/20 rate is not evidence about plausible targets; it is evidence about where I sampled. Stated plainly because it weakens my own Phase 1 cohort design.

**Distributor inversion is a SEED SOURCE, not the backbone.** It reliably produces real B2B companies with a commercial relationship, in local languages, without touching a funding or ATS list — that part of Phase 1 stands. But the population it produces is *disproportionately the wrong side of the relationship*: distributed vendors whose reseller relationships are mediated. It generates candidates; it does not qualify them.

## 05 Operator resolution

Across all 50 benchmark companies:

```
channel_operator 40 · unknown 6 · both 2 · distributed_vendor 2 · channel_participant 0
```

**The participant detector was silently dead until the tests caught it.** Its patterns were anchored on a lowercase `we are` with no case-insensitive flag, so it never fired once across fifty companies. A regression test exposed it; it now works, and was field-tested against real resellers:

```
softcat.com        dir=both              participatesIn=Microsoft   ← fires correctly
computacenter.com  dir=channel_operator  participatesIn=none        ← miss
bechtle.com        dir=unknown           participatesIn=none        ← miss
insight.com        dir=unknown           participatesIn=none        ← miss
```

**Field recall is 1 in 4 and owner attribution is noisy** — the first field run returned "Platinum" and "Microsoft Solution" as vendor names, since fixed by excluding tier words. The detector is real but not production-grade, and the benchmark contains almost no participants by construction, so it has thin validation. That is the least-supported component in Phase 2.

The clearest win is the state the mandate asked for by name: **`distributed_vendor`**. Fluke — a manufacturer sold through wholesalers — resolves to `distributed_vendor → research_required`, not to a qualified operator. That is the Phase 1 overstatement corrected in code.

## 06 Introw suitability thesis

Reconstructed from the supplied material only (`src/suitability/capability.ts` cites every entry), then measured.

**What appears to make a transacting programme suitable**

- The company **runs the programme itself** — first-person invitation on its own surfaces.
- The **operational objects Introw provides are already visible**: deal registration, partner onboarding, simple named tiers, a partner portal, enablement. Their presence means the work is already being done, manually or on a platform.
- **No distribution tier mediating the reseller relationship**, or distribution alongside a substantial direct programme.

**What appears to make it unsuitable**

- **Several independent distributors carrying the company.** Onboarding, credit and often registration sit with the distributor rather than the vendor.
- **Enterprise incentive machinery** — rebate accrual, co-op claims, proof-of-performance — beyond the commission and SPIFF Introw automates.
- **Federated governance** — separate programmes per region or business unit rather than one partner function.
- **Participation rather than operation** — the channel evidence belongs to another vendor.

**What is explicitly NOT evidence:** company size, employee count, revenue, "enterprise". Factorial has 1,000+ employees and 100+ partner managers and is a customer; Payflip is tiny and is a customer. The red team confirms the model does not use size — Factorial and Axon both land `plausible`.

**Separating evidence from hypothesis.** The distribution discriminator is *measured* (1/16 vs 10/14). The incentive-complexity and federated-governance dimensions are *hypotheses that failed to fire*: they are defined, implemented and tested, and they almost never match, because the language is not published. They should not be presented as working detectors.

## 07 Suitability benchmark

50 companies, frozen before any rule was written, sha256 `e4fe7f9cbb4b…`. Split deterministically — sorted by domain, every third company to holdout — giving 34 dev / 16 holdout.

- **Cohort A · 16 known Introw customers.** Ground truth: that they are customers. Leakage stated: their current partner infrastructure may *be* Introw, so artifact presence is treated as corroboration rather than as a discriminator.
- **Cohort B · 20 plausible targets.** No ground truth. Now known to be contaminated by distributor-seeding (§04).
- **Cohort C · 14 hypothesised poor fit.** Each entry carries a *structural* hypothesis, never "because it is large".

## 08 Suitability performance

**Development (n=34)**

| cohort | n | strong | plausible | weak | incompatible | research | unknown |
|---|---|---|---|---|---|---|---|
| A · customers | 12 | 1 | 7 | **0** | **0** | 1 | 3 |
| B · plausible | 13 | 0 | 4 | 1 | 0 | 6 | 2 |
| C · poor fit | 9 | 0 | 2 | 2 | 0 | 2 | 3 |

**Holdout (n=16), run once, labels not inspected during tuning**

| cohort | n | strong | plausible | weak | incompatible | research | unknown |
|---|---|---|---|---|---|---|---|
| A · customers | 4 | 0 | 4 | **0** | **0** | 0 | 0 |
| B · plausible | 7 | 0 | 4 | 1 | 0 | 1 | 1 |
| C · poor fit | 5 | 0 | 0 | **2** | 0 | **2** | 1 |

- Customers demoted to weak/incompatible: **0/12 dev, 0/4 holdout.**
- Poor-fit demoted or routed to research: **44% dev, 80% holdout.**

Holdout performance did not collapse; on the discriminating measure it improved. That is weak evidence against overfitting — weak because the holdout is 16 companies.

**Where it fails.** The `unknown` rate is high (3/12 customers on dev) and is driven by the *channel* classifier, not the suitability layer: Ringover, Xelix and Zenity never establish a transacting channel, so suitability is correctly never asked. **`strong` fires almost never** — once in fifty. The model discriminates by demoting, not by promoting, and a product built on it would surface a lot of `plausible`.

## 09 Known-customer reconstruction

Of Introw's own customers, what is publicly visible?

- **All reachable Cohort A companies that establish a channel resolve to `channel_operator`.** None is demoted.
- **Platform fingerprints found:** Introw at Axon, Coder, Cubbit, Epiphan, Quatt, Cumulocity; **Allbound** at ExtraHop and Semperis; **Impartner** at Nokia and Proofpoint.
- **The model would retain them**, but mostly as `plausible` rather than `strong` — only Epiphan reached `strong`.
- **Where it fails on customers:** Cubbit, a real customer carried by Exclusive Networks, is routed to `research_required` by the distribution signal. That is the confound in action, and it is the designed behaviour — routed to a human, not rejected.

## 10 Enterprise non-fit analysis

Using structure, not reputation:

- **Nokia** → `weak`. Carried by two distributors; Impartner enterprise PRM detected. The demotion is on mediated channel depth.
- **Huawei** → `weak`. Carried by two distributors.
- **Nutanix, Forcepoint, Corelight, Anomali** → `weak`. Multi-distributor mediated channel.
- **Microsoft** → `research_required` as a `distributed_vendor` — "buy through a partner" language, no first-person invitation on the pages retrieved. The right outcome; arguably the wrong reason, since Microsoft obviously operates programmes.
- **SAP** → `unknown`, because the *channel classifier* never established a transacting channel. **This is a classifier miss producing a convenient outcome.** Reported as a failure, not a success.
- **Sophos and NetApp** → `plausible`. Both are distributor-led in reality but publish a substantial direct programme with four operational objects, so the interaction rule keeps them addressable. Whether that is commercially right is unproven.

## 11 PRM intelligence

| | |
|---|---|
| Vendors with a defined fingerprint | 15 |
| **Observed in our own measurements** | **4** — Introw, Allbound, Impartner, PartnerPage.io |
| Detection method | CNAME on a partner-named host, with a wildcard control probe |
| Detections across 50 benchmark companies | 10 |
| False positives | 0 |
| Coverage | ~20% — most vendors serve tenants from the customer's own domain |

Two rules are enforced in code and tested:

> **FOUND is strong evidence. NOT FOUND is UNKNOWN — never "no PRM".**
> **Salesforce Experience Cloud is not a PRM.** Treating it as decisive produced a false transacting verdict in Phase 1; it is now `ambiguous` and cannot carry a verdict.

**A DNS defect worth recording.** Under concurrency the `dig` calls were timing out, the failures were caught, and the empty result was read by the caller as *"no record exists"* — silently losing the highest-precision detector in the system on companies that plainly have the record. Lookups now return `null` on failure, distinct from `[]`, and failures are counted and reported.

## 12 Competitive displacement

Competitor PRM users are a **detectable segment**, and that is all the evidence supports.

Detected: Allbound at ExtraHop and Semperis; Impartner at Nokia and Proofpoint. Both readings are returned together and neither is a verdict:

- **Maturity:** the company has bought into the category, sized a budget and staffed someone to run it.
- **Switching cost:** an incumbent contract, migrated data, and internal credibility attached to the current choice.

**Nothing here is buying intent.** Dissatisfaction, renewal timing and readiness to switch are not observable. An existing competitor platform is *structural context*, not Why Now. A migration would be timing — and §13 shows we cannot currently detect one.

## 13 Timing feasibility

| test | verdict | measurement |
|---|---|---|
| **A · PRM / portal change** | **UNRESOLVED** | 1 of 3 partner hosts had captures in ≥2 Common Crawl collections. Partner portals are login-walled, so they are not crawled. A CNAME target change — the actual migration — is not recorded anywhere public and needs our own DNS snapshots over time. |
| **B · Programme launch / relaunch** | **CONTEXT ONLY** | 4 of 4 produced an earliest-capture date; **0 produced a date the company published**. Earliest capture is when a crawler first saw the page. Rendering that as "launched" is the exact fabrication the evidence model forbids. |
| **C · M&A / carve-out / MBO** | **UNRESOLVED** | SEC EDGAR full-text and Wikidata respond; GDELT rate-limited; Companies House needs a key. Three problems remain untested: linking an event to the right legal entity, linking that entity to the partner programme, and establishing the effective date rather than the announcement date. |
| **D · Partner-directory growth** | **BUILD LATER** | 4 of 4 comparable across collections, moving plausibly (Egnyte 14→29, Niko 30→38, Loxone 92→108). But these are *URL counts*, which move with crawl depth as well as with the directory. A defensible growth claim needs the same page parsed at two dates by the same counter. |

**The thesis's highest-conviction trigger remains unproven after two phases.** Carve-out/MBO has now been tested rather than assumed, and it is still UNRESOLVED. It should stop being described as Tier 1.

## 14 Revised architecture

```
DISCOVERY            distributor inversion · DNS/CT · site crawl · Common Crawl
    ↓                        seed only — never qualification
ENTITY RESOLUTION    confirmed · probable · ambiguous · wrong_entity · dead_domain · unresolved
    ↓                        identity confidence independent of channel confidence
CHANNEL CLASSIFICATION   transacting · mixed · integration_only · affiliate_only · strategic_only · unknown
    ↓                        "does a transacting channel exist"
OPERATOR RESOLUTION      channel_operator · participant · distributed_vendor · both · unknown
    ↓                        "whose programme is this"
INTROW SUITABILITY       strong · plausible · weak · incompatible · research_required · unknown
    ↓                        "is this operating model appropriate"
TIMING                   separate layer; requires a dated change, not a state
    ↓
RESEARCH → COMMERCIAL REVIEW → GTM READY          (not built)
```

Each layer keeps its own evidence and its own uncertainty. **No layer may answer another layer's question** — the SAP case is the proof: a real transacting channel that is the wrong operating model, where corrupting the classifier to say "not transacting" would have been false.

## 15 Revised domain model

Added in `src/domain/types.ts`:

- `ChannelDirection` and `ChannelRelationshipRecord` — a relationship has a source, a target, a type and a direction, so distributor evidence stays *evidence about a relationship* rather than becoming a company-level conclusion.
- `ProgramOwnership` — one company may own several programmes and participate in others; attaching everything to the company loses the difference between "has partners" and "runs a programme Introw could serve".
- `IntrowSuitability` — state, rule, rationale, positive and negative evidence, unknowns, blockers, research needed. **No score.**
- `SuppressionState` — always explicit, always states its reason, and scoped to cold outbound so the account stays visible.

## 16 UX contract

Fourteen fixtures became seventeen, adding the three Phase 2 states. Verified in the browser. The card now leads with the two separate questions:

```
COMPANY
CHANNEL          Transacting channel · RUNS THE PROGRAMME
INTROW SUITABILITY   Weak fit
                 "Three independent distributors carry this company, alongside rebate
                  and co-op fund language and a partner academy… This is a demotion on
                  structure — a company one tenth the size with the same structure
                  would read the same."
                 · carried by 3 distributors
                 · rebate and co-op fund programme
                 + deal registration present
PROGRAMME · ENVIRONMENT · ORGANISATION · WHY NOW · RESEARCH
```

The header reports its own sparseness: 10 of 17 channel confirmed, 11 confirmed operators, 12 of 17 suitability established, 10 of 17 CRM unknown, 14 of 17 team size unknown, **1 of 17 with a computable operational load**. The sparse-account principle is not regressed.

## 17 Data health

| dimension | coverage across the 50-company benchmark |
|---|---|
| Identity resolved (confirmed or probable) | 20/21 on the industrial cohort |
| Channel classification established | 38/50 |
| Operator direction established | 44/50 |
| Suitability established (not unknown) | 38/50 |
| CRM | ~22% (unchanged from Phase 0; not invested in) |
| PRM / platform fingerprint | 10/50 · 0 false positives |
| Partner count usable (exact or enumerated) | ~2% |
| People | 0 — no licensed provider |
| Timing | 0 detectors approved for BUILD |

## 18 Remaining blind spots

1. **The operating model is mostly unpublished.** The negative dimensions — incentive complexity, federated governance, enterprise infrastructure — are implemented, tested and almost never fire, because the language is behind the partner portal. Only the counterparty distribution signal works.
2. **The distribution signal is partly a segment proxy.** It fires on 17% of SaaS-ish companies and 74% of hardware/security/industrial. It still discriminates *within* distributor-carried companies, but it is not a clean structural measure and must never become a hard rule.
3. **Participant detection has thin field validation** — 1 in 4 on a small real test.
4. **`strong` almost never fires.** The model demotes; it does not promote.
5. **No timing detector is approved for BUILD.** The product can say why an account is interesting and cannot yet say why now.
6. **No people data, no partner count, no operational load** at meaningful coverage. Unchanged.
7. **The industrial segment is not served** by this architecture, and the bounded attempt to fix it did not move the number.
8. **The benchmark is 50 companies.** Every percentage in this report has a wide interval.

## 19 Phase 3 recommendation

**Do not build scoring or the GTM Queue yet.** Against the mandate's own eight criteria: candidate generation ✓, operator determination ✓, false-positive suppression ✓, defensible suitability model **partially** — one measured discriminator and several that do not fire. Unknown never becomes negative ✓. Not merely rediscovering famous ecosystems ✓ — those are exactly what gets demoted. Would save an AE time — **plausibly, for software and IT only**. Generalises beyond the tuning set ✓ on a 16-company holdout.

**What Phase 3 should build, in order:**

1. **A distribution index as a first-class source.** It is the only measured suitability discriminator. Broaden beyond three distributors, and treat the vendor–distributor relationship as the primary evidence object.
2. **Our own dated snapshots** of partner surfaces and partner-host CNAMEs. Every timing verdict failed for the same reason: no second observation. This is the single highest-value unlock and it only needs time to start accruing.
3. **A different industrial seed** — trade associations, certified-installer registries, manufacturer dealer locators — or an explicit decision to scope the product to software and IT.
4. **Programme-level modelling in practice**, not just in the schema. One company, several programmes, one of which may be addressable.
5. **Commercial review as a human surface**, before any queue. The model produces a lot of `plausible` and `research_required`; that is a review workflow, not a ranked list.

**Not recommended:** scoring, ranking weights, mass discovery, production UI, CRM detection investment, partner-count engineering.

---

*Measured, not asserted. The suitability benchmark was split before any rule was written and the holdout was run once. Two of my own prior conclusions are corrected here: Phase 1's distributor-inversion claim, and Phase 1's expectation that industrial discovery was mostly fixable plumbing.*
