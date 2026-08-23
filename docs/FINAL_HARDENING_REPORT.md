# Final Adversarial Hardening Report

**Sprint question.** *After removing easy negatives, leaked labels and reviewer familiarity, is there still enough trustworthy public evidence to materially reduce the work required for an Introw seller to identify and evaluate strong partner-program prospects?*

**Answer: yes for the evidence, no for the ranking.**

A blind reviewer, given only the machine-collected evidence packets with company identity redacted, made the correct call on **6 of 6** hard negatives. The automated promotion logic, running on the *same evidence*, falsely promoted **5 of 6**. The information needed to reject Introw's direct competitors was present in what the instrument collected. The instrument's own scoring did not use it.

That gap is the finding. Collection works. Promotion does not.

---

## 1. Headline numbers

| Measurement | Result |
|---|---|
| Hard negatives falsely promoted (frozen set, n=13) | **5 / 13** — every one a PRM competitor |
| ‑ category competitors | 5 / 6 (83%) |
| ‑ supply-side marketplaces | 0 / 7 (0%) |
| Blind human review, same packets, hard negatives promoted | **0 / 6** |
| Out-of-sample: partner-tech vendors promoted | **3 / 6 (50%)** |
| Out-of-sample: genuine operators promoted | **2 / 6 (33%)** |
| CRM recall on a provably-positive control group | **2 / 6 (33%)** |
| Public person evidence, any state | 2 / 18 |
| Temporal change-detection false-positive floor | 0 / 40 (0%) |

The second and third rows are the ones that decide the product. **The model promotes Introw's competitors at a higher rate than it promotes real prospects.**

---

## 2. Workstream A — hard-negative challenge set

Benchmark `phase4/benchmark/hard-negatives.v1.json`, sha256 `276ea43132cf12ef`, frozen before evaluation. Phase 3 constructs run unchanged at git tag `phase3-frozen`, so this is a baseline and not a demonstration.

Two negative classes, chosen because each is hard for a *different* reason:

- **category_competitor** — PRM and partner-tech vendors. They run excellent partner programmes. They will never buy Introw.
- **supply_side_marketplace** — companies whose "partners" are restaurants, drivers, hosts or hotels. The word is identical; the commercial meaning is not.

### Result

```
kiflo.com          category_competitor   mat=confirmed     own=direct   surf=rich      => high_fit
allbound.com       category_competitor   mat=confirmed     own=direct   surf=rich      => high_fit
impartner.com      category_competitor   mat=strong_proxy  own=direct   surf=rich      => high_fit
partnerstack.com   category_competitor   mat=confirmed     own=direct   surf=moderate  => high_fit
channeltivity.com  category_competitor   mat=confirmed     own=direct   surf=rich      => high_fit
zinfi.com          category_competitor   mat=weak_proxy    own=direct   surf=rich      => not_promoted
expediapartner…    supply_side           mat=strong_proxy  own=direct   surf=light     => plausible
booking.com        supply_side           mat=weak_proxy    own=unknown  surf=moderate  => not_promoted
just-eat.co.uk     supply_side           mat=unknown       own=unknown  surf=light     => not_promoted
deliveroo.co.uk    supply_side           mat=unknown       own=direct   surf=unknown   => under_observed
bolt.eu            supply_side           mat=strong_proxy  own=unknown  surf=light     => under_observed
airbnb.com         supply_side           mat=unknown       own=unknown  surf=unknown   => under_observed
uber.com           supply_side           mat=unknown       own=unknown  surf=unknown   => under_observed
```

**Supply-side passed honestly.** Six of the seven had pages genuinely retrieved and were still not promoted, so this is a real pass rather than a retrieval accident. Only airbnb.com returned zero pages.

**Category competitors failed catastrophically**, and they failed on the *strongest* evidence states in the whole project. `mat=confirmed` fired on four of six — a state that until now had appeared almost nowhere.

### 2.1 Provenance audit

Every one of the 13 negative bases was audited for whether the label is defensible independent of the model.

| Basis | Verdict | Reasoning |
|---|---|---|
| category_competitor (6) | **VALID** | Introw does not sell PRM to PRM vendors. Independent of any measurement. |
| supply_side_marketplace (7) | **VALID** | The "partner" is inventory, not a route to market. Independent of measurement. |

No label here depends on a Phase 0–3 verdict, so none is circular. This is the cleanest label provenance in the project, which is why the failure it exposes cannot be argued away.

### 2.2 FALSE_PROMOTION_TAXONOMY

Three distinct mechanisms, established by teardown of the five promoted competitors. No company-name patches were written.

**FP-1 · CATEGORY COINCIDENCE** — *5 of 5 false promotions.*
The company's product **is** partner programme operations. Its partner surface is maximally rich because partner language is simultaneously its product copy and its go-to-market copy. On every dimension the constructs measure, a PRM vendor is not a weaker case than a real prospect — it is a **stronger** one. No re-weighting fixes this, because the constructs are working correctly and returning the right answer to the wrong question.

**FP-2 · VOICE CONFLATION** — *detectable in 4 of 6.*
"Grow **your** partner program" and "resell **our** platform" contain the same lexical evidence and opposite commercial meaning. The probes match content words and are blind to grammatical person. This is the discriminator the blind reviewer named unprompted, before being asked about it.

**FP-3 · DEFINITIONAL CONTENT** — *detectable in 1 of 6, plus corroboration.*
`kiflo.com/glossary/reseller` reads *"Reseller: a partner who purchases your product at a discount and resells."* That is a dictionary entry. It was scored as evidence that the company has resellers. Channel-software vendors publish these for search traffic; operators do not.

### 2.3 Per-construct boundary table

Where each construct stops being true, measured rather than asserted.

| Construct | Fires correctly on | Fires wrongly on | Boundary |
|---|---|---|---|
| Commercial materiality | operators paying partners for outcomes | vendors *describing* how partners get paid | cannot separate a company's own commission from a commission it documents for others |
| Operational ownership | first-person programme operation | any first-person voice near partner nouns | `direct` fired on 5/6 competitors — they do operate programmes; ownership is simply not the discriminating question |
| Operational surface | portals, tiers, deal registration | screenshots and feature lists of portal *software* | a product demo of a partner portal is indistinguishable from a partner portal |

Ownership deserves emphasis: it was **not wrong** about the competitors. They genuinely operate their own programmes directly. The construct answered accurately and the answer was irrelevant.

### 2.4 Interaction analysis

The three constructs are supposed to be independent. Against the competitor set they were not — all three saturate together, because a single underlying cause (this company publishes a great deal about partner programmes) drives all three.

### 2.5 Publication-bias check — the mechanism

Pooling both frozen sets (n=28):

| Observation count | Promoted |
|---|---|
| ≥ 9 | **9 / 10 (90%)** |
| 6–8 | 1 / 6 (17%) |
| 3–5 | 0 / 6 (0%) |
| 0–2 | 0 / 6 (0%) |

Mean observation count: **10.50** promoted vs **3.78** not promoted.

Of the ten companies clearing the obs ≥ 9 threshold, **nine are partner-tech vendors**.

So the causal chain is fully specified:

> constructs fire on partner-programme language → language volume determines observation count → observation count ≥ 9 determines promotion → partner-tech vendors maximise partner-programme language → **the promotion signal is, structurally, a partner-tech-vendor detector.**

This is not a bug to be patched. It is what the instrument measures.

---

## 3. Workstream B — genuinely blind review

19 evidence packets (`phase4/out/blind-packets.json`), company names and URLs redacted, answer key held separately. Reviewed in an isolated context with no access to prior benchmark labels, Phase 0–3 verdicts, the customer list, or any company-specific memory. The reviewer was instructed not to search the web and not to guess identities.

### Result

| | Machine | Blind human |
|---|---|---|
| Hard negatives promoted | **5 / 6** | **0 / 6** |
| Confident decisions | — | 11 high, 7 medium, 1 low |

The reviewer suppressed the competitors using reasoning the constructs do not encode:

> *"Every quote is definitional or advisory content about partner programmes in general… This is a channel glossary/blog, not a company describing its own partners."*

and identified the voice discriminator without prompting:

> *"second-person voice ('your channel', 'your resellers') should be treated as a disqualifier rather than a signal."*

### 3.1 Leakage audit — reported against interest

The packets were **not** perfectly blind, and the failure is worth stating plainly.

| Leak | Records | Effect |
|---|---|---|
| `partnerPlatformDetected: introw` | 4 (all known customers) | Reviewer inferred customer status directly. **These four were not blind.** |
| Unredacted brand token in a quote | 4 | Reviewer did not use it; reasoning was content-based. |
| `partnerPlatformDetected: impartner` | 1 (a competitor) | Used as a *second* disqualifier alongside an independent one. |

**Does the leak damage the headline?** No. Of the six hard negatives, **four had no leak at all** (kiflo, channeltivity, partnerstack, zinfi) and the reviewer rejected all four on content alone. The 0/6 result survives the audit, but any claim about the four *known customers* does not, and is not made here.

Fix owed before any future blind round: strip `partnerPlatformDetected` when the value is `introw`, or replace it with `a partner platform was detected`.

### 3.2 What the reviewer could not do

Every packet carried `crmEvidence: unknown` and `partnerCount: unknown` or a lower bound. Partner-team size, partner-sourced revenue share and partner adoption were `notObserved` in all 19. The reviewer's own words:

> *"The packets prove a programme exists; they never prove it has volume, which is what determines whether PRM software pays for itself."*

---

## 4. The repair attempt, and its honest failure

Having identified FP-2 and FP-3, I built `src/suitability/category.ts` — competitor detection by product self-description, grammatical voice and URL section shape. **No domain list**, per the mandate's prohibition on patching company names.

Then I froze a set the detector had never seen (`competitor-holdout.v1.json`, sha256 `6ef9bb5c45c7d7a8`, 15 companies: 6 partner-tech vendors, 3 adjacent, 6 genuine-operator controls) and ran it.

| | In-sample | Out-of-sample |
|---|---|---|
| Partner-tech vendors excluded | 3 / 6 | **1 / 6** |
| False positives on genuine operators | 0 | **0 / 6** |

**The repair does not generalise.** The 3/6 → 1/6 collapse is the signature of a rule written after seeing the answers. `ziftsolutions.com` — a PRM vendor with 11 observations — is still promoted to `high_fit` and still reads as `clear`.

Precision is perfect and recall is close to nothing. That is the expected shape when a detector is fitted to six examples, and it is why the holdout was frozen first.

### 4.1 The deeper result

Out-of-sample promotion rates, with the detector removed from the picture entirely:

- partner-tech vendors: **3 / 6 promoted (50%)**
- genuine operator controls: **2 / 6 promoted (33%)**

GitLab, Freshworks, Pipedrive and Datadog — all of which run substantial, real partner programmes — were **not** promoted. Magentrix, Mindmatrix and Zift Solutions were.

An instrument that ranks Introw's competitors above Introw's prospects is not miscalibrated. It is measuring the wrong quantity.

---

## 5. Workstream C — CRM sanity check

Introw integrates with HubSpot and Salesforce only, so **every known Introw customer provably runs one of the two.** That gives a positive control with no label leak and no hidden ground truth: any miss is a company we *know* uses a supported CRM and could not see.

New module `src/evidence/crm.ts`, strictly one-directional. Only artifacts count — `js.hs-scripts.com/1234567.js`, a Web-to-Lead endpoint, a `.my.salesforce.com` org domain. Prose mentions are ignored.

| Group | Result |
|---|---|
| Known customers detected as compatible | **2 / 6 (33%)** |
| Missed | parloa.com, axon.com, coder.com, archerirm.com |
| Control group (truth unknown) fired | 3 / 12 |

Both detections were HubSpot. **Salesforce was never detected on any of the 18 domains**, which is structural rather than accidental: HubSpot also sells a CMS and therefore emits assets from marketing sites; Salesforce is not a website technology and generally emits nothing.

This confirms Phase 0's 22% at a slightly higher figure and settles the question of whether that ceiling was a detector weakness. It was not.

**Verdict: CRM cannot be a qualification gate.** `unknown` is the majority state even where the truth is guaranteed. Per the standing constraint, no `NO_CRM` state exists, and a missing HubSpot fingerprint is never read as "not HubSpot".

---

## 6. Workstream D — positive people evidence

Licensed people data is unavailable, so this measures what survives on the public web alone.

| State | Count (n=18) |
|---|---|
| `unknown` | 16 |
| `named_role_unnamed` | 1 |
| `named_individual` | 1 |
| **TWO_PLUS satisfied** | **1 / 18** |

The single TWO_PLUS hit is `impartner.com` — a PRM vendor whose site is dense with named partner-professional testimonials. It is the publication-volume confound again, not a partner team we discovered.

**Verdict: public person evidence is not viable.** Phase 0 found roughly one named Tier-1 persona per ten companies *with* licensed data; without it the rate is effectively zero.

Per the standing constraint, `unknown` never means "no partner team", and team size below two is never a disqualifier.

### 6.1 A bug worth recording

The first run reported `axon.com` → `named_individual`, name **"Browse Partner"**, title **"Directory Become a Partner"**. The pattern `Director` had matched inside `Directory`, and site navigation was read as a person. This is the third instance of the same failure family in this project, after "Chief Partner"/"April" as company names in the Phase 2 event runner. Fixed, tested, and the result above is post-fix.

---

## 7. Workstream E — temporal continuity

The store holds **276 snapshots across 50 companies and 276 distinct surfaces — all retrieved on one day, none with a prior observation.** Change continuity is therefore unmeasurable, and will stay so until calendar time passes. This was anticipated; it is the cost of a detector started only at the Phase 3 baseline.

What *could* be tested today is the mechanism. Forty surfaces were re-fetched with caching forcibly disabled — without `force: true` the HTTP layer would have replayed the cache and manufactured a meaningless `no_change` for every row.

```
STABILITY: no_change=40
false-positive floor: 0/40 surfaces differed within hours (0%)
```

**Verdict: the change-detection mechanism is sound.** The normaliser strips per-request noise cleanly, so a future `semantic_change` will mean something. Source health across the store: 272 ok, 3 error, 1 blocked.

This is the one component of the project that passed its adversarial test without qualification. It also currently produces zero business value, and will produce none for weeks.

---

## 8. Adversarial council

Ten roles. Disagreements preserved rather than resolved.

**Channel-sales veteran** — "Records 04, 09 and 16 are callable today. A 'Partner Collective' with tier-escalating revenue share, a 'Partner Room' with a named Partner Success Manager, a 'Velocity Program' with deal-reg protection. I'd take that over a list of company names."

**Competitive-intelligence lead** — "You built a competitor-discovery tool. That's genuinely valuable and it is not what was commissioned."

**Statistician** — "n=13 and n=15. The 50%-vs-33% gap has confidence intervals that overlap heavily. What does *not* overlap is 5/6 versus 0/6 on the same evidence, and the obs≥9 → 90% relationship. Quote those; don't quote the point estimates."

**Data-quality auditor** — "Four packets leaked `introw`. You caught it after the review, not before. The finding survives; the process didn't."

**Introw seller** — "Six competitor records at the top of my queue and I stop trusting the queue. Ranking is worse than no ranking here."

**Sceptical engineer** — "Three extractor bugs found this sprint by tests and eyeballing, in code that had already shipped through three phases. Assume more remain."

**Product manager** — "The blind reviewer took a couple of minutes per record and beat the model 6–0. That is an argument for putting evidence in front of a human, not for more model."

**Defender of the thesis** — "Supply-side passed 0/7 with real retrieval. The taxonomy work is holding. One negative class failed, not the whole instrument." *(Recorded as a genuine dissent. It is the strongest case against the pessimistic reading, and I think the publication-volume result outweighs it — the same mechanism that failed on competitors is what promoted Zendesk and Talkdesk while missing GitLab.)*

**Ethicist** — "'Not a known customer' still isn't a negative, and four suppressions in the blind review rested on a leaked fingerprint. Keep those separate in anything a seller sees."

**The reviewer, quoted against the project** — "Fix the second-person-voice and PRM-vendor filters and this becomes a genuinely useful queue; ship it as-is and the reps will learn to distrust the high scores."

---

## 9. Sixteen executive questions

1. **Does the Radar find real partner programmes?** Yes — 22/22 unseen in Phase 1, and the evidence packets carry quotable specifics.
2. **Does it find *Introw* prospects?** No. It promotes competitors at 50% and operators at 33%.
3. **Is that fixable by tuning?** No. Promotion tracks publication volume; competitors maximise publication volume by construction.
4. **Did the post-hoc repair work?** No. 3/6 in-sample collapsed to 1/6 out-of-sample.
5. **Is the evidence itself trustworthy?** Yes — a blind reviewer using only the packets went 6/6 against the hardest negatives.
6. **Can a human beat the model on the same input?** Decisively: 0/6 vs 5/6 false promotions.
7. **Was the review truly blind?** For the hard negatives, yes (4 of 6 leak-free, all rejected on content). For the known customers, no — `introw` leaked in 4 packets.
8. **Can we detect CRM?** 33% against a control group that is 100% positive. Salesforce: never.
9. **Can CRM gate qualification?** No.
10. **Can we find partner people publicly?** No — 2/18, and the one TWO_PLUS is a measurement artifact.
11. **Does temporal change detection work?** The mechanism does — 0% false-positive floor. It has no elapsed time to observe.
12. **Can we detect "why now"?** Not yet, and not for weeks.
13. **Do easy negatives still pass?** Yes — 0/14 clean negatives falsely promoted in Phase 3; Bain, Sequoia and Deloitte handled correctly here.
14. **Is any hard-negative class handled?** Yes — supply-side marketplaces, 0/7 with genuine retrieval.
15. **What is the single highest-value component?** Evidence collection with `proves` / `doesNotProve` attached to every observation.
16. **What should be deleted?** The `high_fit` promotion state, as a ranked output.

---

## 10. Product decision

### **EVIDENCE ASSISTANT**

Not RESEARCH RADAR MVP — the ranking is measurably inverted on the hardest class, and shipping a ranked queue teaches sellers to distrust it. Not PUBLIC-DATA LIMIT — that verdict is refuted by the blind review: a human reading only the machine-collected packets got the hardest calls right, so the data is sufficient and the scoring is what fails.

**What ships**

1. Evidence dossiers per company: observed quotes, source URLs, and `proves` / `doesNotProve` on every line.
2. Explicit `notObserved` and `retrievalProblems` sections — the reviewer used these to separate "searched and found nothing" from "could not look", and that distinction changed decisions.
3. States, not scores: `evidence_found` / `insufficient_evidence` / `could_not_retrieve`.
4. A competitor-category flag surfaced as **`review_required`**, never as an automatic exclusion — 1/6 out-of-sample recall does not earn an automatic anything.
5. Human decides. Every time.

**What does not ship**

- `high_fit` as a ranked output.
- CRM as a qualification gate.
- Person-based qualification.
- Timing signals, until the temporal store has months rather than hours.

### GTM Queue: **no**

Not now, and not after review. A queue implies an ordering, and the ordering is the part that failed. What can go to sellers is a **research dossier on companies they are already considering** — which is where the measured value is: the reviewer produced three callable prospects with quotable hooks from redacted evidence alone.

Revisit only if a *prospectively frozen* holdout shows operators promoting above competitors. That has never yet been observed.

---

## 11. Corrections to earlier phases

- **Phase 3's "0/14 clean negatives falsely promoted" stands but was over-read.** It measured easy negatives. Against hard negatives the same constructs promote 5/6. The Phase 3 result was never wrong; it was quoted as evidence for something it did not test.
- **My own in-sample "6/6 with 0 false positives" was inflated.** It used an OR of two signals. Under the two-indicator rule inherited from the Phase 1 firm-type fix, the real in-sample figure is 3/6 — and out-of-sample, 1/6.

---

## 12. Status

**This sprint is complete and this project stops here.** No Phase 5 is proposed and no further validation phase should be inferred from anything above. The open items — a prospectively frozen holdout, a re-run blind review with the `introw` fingerprint stripped, and temporal observations with real elapsed time — are listed as what *would* be required, not as work now in progress.

**Frozen artifacts**

| Artifact | sha256 (16) |
|---|---|
| `phase0/benchmark/cohorts.v1.json` | `db30302202…` |
| `phase2/benchmark/suitability.v1.json` | `e4fe7f9cbb4b…` |
| `phase3/benchmark/controls.v1.json` | `2d0f0c8ab5df34be` |
| `phase4/benchmark/hard-negatives.v1.json` | `276ea43132cf12ef` |
| `phase4/benchmark/competitor-holdout.v1.json` | `6ef9bb5c45c7d7a8` |

57 tests passing. Constructs measured at git tag `phase3-frozen`, unchanged throughout.
