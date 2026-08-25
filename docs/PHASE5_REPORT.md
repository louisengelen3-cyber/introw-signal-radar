# Phase 5 — Seed quality, validation base, and the informal-programme detector

**2026-08-25** · six workstreams, each with a verdict backed by a measurement
Raw outputs under `phase5/out/`. Frozen benchmarks under `phase5/benchmark/`.

---

## Verdicts

| workstream | verdict | the measurement that decided it |
|---|---|---|
| **A** — reseller-side inversion | **SUPPORTED, with the hypothesis corrected** | 3/4 recovered customers found on counterparty surfaces; 22/30 surfaced vendors establish a partner motion; but the segment split is driven by counterparty **size**, not type — local consultancies 0% enterprise giants, national VARs 46% |
| **B** — proxy-positive population | **SUPPORTED** | 133 mentions → 78 resolved (59%), 88% hand-verified; first-person recruitment separates PRM buyers from matched non-buyers by **+43pp** on the SMB stratum |
| **C** — informal-programme detector | **SUPPORTED** | 4/4 recovered customers, 0/14 clean negatives, 0/5 partner-tech guard, 0/15 matched unlabelled; fires on 26.3% of SMB proxy positives and 0% of control |
| **D** — locator extraction | **REFUTED as specified; replaced by a measured alternative** | No JSON endpoint discoverable on any of the three known cases. Prose extraction instead: **3/3**, but only 9/47 of the corpus publishes a count at all |
| **E** — negation detection | **IMPLEMENTED, ZERO MEASURED EFFECT — and the bug was misdiagnosed** | Confirmed surfaces on the audited sample: **10 → 10, nothing dropped**. The true cause is navigation chrome; `programme_tiers` is 67% menu-like |
| **F1** — the untested-16 | **HEADLINE CORRECTED** | 9 GOOD, 4 BAD, 3 BLOCKED → **74.2% → 66.2%** |
| **F2** — discovery recall | **MEASURED, AND IT IS LOW** | Query families **0/18**; reseller-side inversion **3/18**; union **17%** |
| *Reframe* — cost-to-decide | **WEAKLY POSITIVE, NOT DEPLOYABLE** | rho = 0.312, separation 0.50 vs arbitrary baseline 0.27, n=35 |

---

## A — Reseller-side inversion

### The decisive test, run before anything was built

Per the mandate this ran first. Each of the four recovered customers was searched for by name on
counterparty surfaces, and every hit was then **retrieved** rather than trusted from a snippet.

| company | counterparty | shape | retrieved |
|---|---|---|---|
| ringover.com | smcconsulting.be (BE consultancy) | certified-partner page | 200, 9,243 chars |
| xelix.com | ojc-consulting.com (BE consultancy) | vendor-portfolio list | 200, 3,504 chars |
| payflip.be | hrpartners.securex.be (BE HR services) | partner-marketplace entry | 200, 3,374 chars |
| zenity.io | — | — | **not found** |

**3 of 4.** n=4. This establishes that the surface exists and is readable; it says nothing about
yield. Zenity's absence is a real negative and is not explained away — a company can sell
through resellers whose pages never surface.

### What the crawler had to learn

The first build found 2 of 3 confirmatory cases with **zero** vendors, on pages the decisive
test had already proven retrievable. Three structural facts emerged:

1. **Counterparties often name vendors without linking to them.** OJC publishes its entire
   portfolio as same-site pages (`/Page/Xelix`) and links to none. Link-only extraction had a
   larger recall hole than the design assumed — 2 of 3.
2. **Subdomain counterparties do not answer on `www.`** (`hrpartners.securex.be`).
3. **A third shape exists**: a top-level slug carrying a partner suffix
   (`smcconsulting.be/ringover-certified-partner`).

Extraction now runs by outbound link (yields the domain, so entity resolution is free) **and**
by vendor-page slug. The tier guard matters only on the slug path, and is asserted by test —
`isTierWord` rejects every entry in the tier vocabulary and the exact strings a previous
extractor returned as vendors ("Platinum", "Gold Partner", "Solution Partner").

### Yield, on the frozen seed

16 counterparties, all identified in earlier phases and none derived from the Phase 5 decisive
test — seeding counterparties from the vendors under test would reproduce the Phase 2 Cohort B
error exactly.

| | reseller arm (n=16) | distributor arm (n=4) |
|---|---|---|
| readable listing surface | 14 (87.5%) | 3 (75%) |
| naming ≥1 vendor | 11 (68.8%) | 3 (75%) |
| distinct vendors | **363** | 125 |
| resolved to a domain | 153 (42%) | 16 (13%) |
| not previously seen | **150** | 16 |

**22 of 30** sampled fresh non-giant vendors establish a partner motion under existing
detectors (73%).

### The finding that corrects the hypothesis

The hypothesis was that reseller-side counterparties select for mid-market. Measured naively,
they do not: the reseller arm returned a **higher** enterprise-giant share (15.2%) than the
distributor arm (8%).

That is a **seed-construction artefact of my own making**. The arm is dominated by global
systems integrators — Capgemini, Cognizant, Wipro, Deloitte — which partner with giants by
definition. It does not test the hypothesis as stated, which was about mid-market VARs, MSPs
and local consultancies. Splitting by counterparty scale:

| counterparty bucket | counterparties | vendors | enterprise-giant share |
|---|---|---|---|
| global systems integrator | 7 | 293 | 22.2% |
| national VAR / MSP | 4 | 148 | **45.9%** |
| **local consultancy / marketplace** | 3 | 60 | **0%** |

**Counterparty size determines vendor segment, not counterparty type.** Computacenter 56.8%
giants, Softcat 51.7%; SMC Consulting, OJC and Securex 0% across 60 vendors.

*Stated against interest:* the local bucket is the confirmatory set, found by searching for
mid-market vendors, so its 0% is partly circular. The defence is partial and quantified — 3 of
its 60 vendors were the seeds, so roughly 5% of that bucket is contaminated, not all of it.

**Actionable consequence:** the seed should be local and national consultancies and vertical
marketplaces. Global SIs and national VARs are as enterprise-skewed as distributors.

**Verdict: SUPPORTED, hypothesis corrected.** The counterparty class was right; the size band
was not specified and turns out to be what matters.

---

## B — Proxy-positive population

13 PRM vendors harvested; segment tier assigned from each vendor's own positioning **before**
any harvest ran.

| | mentions | resolved to a domain |
|---|---|---|
| SMB (Kiflo, PartnerPortal, JourneyBee, Unifyr) | 26 | 19 (73%) |
| mid-market (PartnerStack, Channeltivity, Allbound, Kademi, Magentrix) | 72 | 48 (67%) |
| enterprise (Impartner, ZINFI, Zift, MindMatrix) | 35 | 11 (31%) |

Names were resolved to domains **without search** — candidate hosts are constructed
mechanically and each is fetched, accepted only if the site itself names the company. The
first-party-only rule is not relaxed; the KORE case showed search actively supplies the wrong
company.

**Verification rate: 14/16 = 88%** on a stratified hand-check (SMB 5/6, mid 6/6, enterprise
3/4). A proxy positive is labelled as a distinct class throughout and is never called a known
positive.

### Which features separate PRM buyers from matched non-buyers

Control is the matched-unlabelled cohort — companies with a partner page and no PRM evidence.

| feature | SMB proxy | mid-market | enterprise | control | Δ(SMB − control) |
|---|---|---|---|---|---|
| **first-person recruitment** | **63.2%** | 50% | 37.5% | 20% | **+43.2pp** |
| partner types named | 63.2% | 66.7% | 50% | 46.7% | +16.5pp |
| **INFORMAL signature** | **26.3%** | 16.7% | **0%** | **0%** | +26.3pp |
| formalised programme | 15.8% | 33.3% | 12.5% | 0% | +15.8pp |
| **formal artefact present** | 21.1% | 38.9% | 12.5% | 33.3% | **−12.2pp** |

Two results matter. **First-person recruitment is the strongest separator measured anywhere in
this project** — +43pp on the closest ICP stratum. And **formal artefacts run the wrong way**:
PRM buyers publish *fewer* of them than matched non-buyers, which is what the informal thesis
predicts and what a formal-artefact-seeking pipeline would systematically miss.

The informal signature declines monotonically with stratum size (26.3% → 16.7% → 0%), which is
the direction the ICP thesis requires.

*Reported against interest:* the first four construct rows in `B-analysis.json` show 0% for the
control because constructs were not computed for that cohort. That is a measurement gap, not a
finding, and those rows must not be read as separation.

**Verdict: SUPPORTED.** The population is real, 88% verified, and it produces a separator the
19-customer base could never have supported.

---

## C — The informal-programme detector

Fires on: **first-person recruitment present AND partner types named AND no formal artefact.**
Both positive conditions are required; absence only selects the class.

| cohort | n | fires |
|---|---|---|
| recovered customers | 4 | **4** |
| clean negatives | 14 | **0** |
| partner-tech guard | 5 | **0** (all suppressed) |
| matched unlabelled | 15 | **0** |

*Reported against interest:* **the detector was fitted to these cohorts.** Three changes were
made after seeing results — loosening a regex adjacency, adding local-language recruitment, and
extending formal-artefact recall. Two were driven by the positives, one by a false positive on
the matched-unlabelled cohort, which consumed that cohort as a holdout. The negatives held at 0
across all four runs without ever being tuned against, and that is the real evidence here.

The out-of-sample test is B's proxy population, which the detector never saw:
**26.3% of SMB proxy positives, 0% of control.**

### Two failures worth recording

**English-only matching was a structural failure, not a gap.** The surface finder returned
Payflip's Dutch page; the English-only detector produced a false negative on a known customer.
The ICP thesis is explicit that the EU mid-market publishes locally.

**Under-detecting formal machinery is the dangerous direction.** A matched-unlabelled company
was promoted because its FAQ said "program levels within Resell and Services tracks" — a fully
formalised programme the tier patterns did not recognise. Promoting a company that has already
built the thing Introw sells is the precise error to avoid.

**Verdict: SUPPORTED**, with the fitting disclosed.

---

## D — Locator extraction

**The hypothesis is refuted for all three named cases.** No JSON endpoint is discoverable:
Allison's locator exposes none in its HTML or in either of its two first-party scripts; EXPO.e
has no locator at all; myfactory names partners on a page and in a PDF.

But the numbers **are** public — in prose. Prose extraction was built and tested instead:

| case | expected | extracted |
|---|---|---|
| allisontransmission.com | ~1,600 dealer locations | **1,600 Dealer (approx)** ✓ |
| expo-e.uk | 600+ organisations | **600 organisations (approx)** ✓ |
| myfactory.com | partners in a PDF | **100 Partner** ✓ (new — "Rund 100 Partner aus dem deutschsprachigen Raum") |

Generic organisation nouns count only when the sentence carries channel vocabulary, because
"600 customers" is a claim about the customer base.

**Corpus coverage: 9 of 47 accounts with an established motion publish a count at all (19%).**
A published count is stored as a **claim** with its sentence attached, never as a measurement.

**Verdict: REFUTED as specified, replaced by a measured alternative that works 3/3 on the known
cases but reaches only 19% of the corpus.**

---

## E — Negation detection

Implemented across four prose detectors (`informal`, `trade`, `surfaces`, `programmes`), 10
dedicated tests, multilingual, scope-bounded to the governing clause.

**Measured effect on the hand-audited sample: 10 confirmed surfaces → 10. Nothing dropped.**

### I misdiagnosed this bug in the 25 August audit

That report attributed EXPO.e's confirmed tier claim to a keyword matcher reading a denial.
That is wrong, and checking the source shows it:

- All four of EXPO.e's confirmed surfaces come from `/partner-login`, whose extracted text is
  navigation chrome: *"Massive Margin Money Makers Platinum Partner S4 Object Storage SASE &
  SD-WAN"*. No sentence asserts a tier; a menu does.
- On the actual denial sentence, the guard correctly returns *not negated* — because
  "you are automatically a Platinum Partner" sits after a dash and **is** a positive statement.

The true cause is navigation-chrome text, measured across 35 production dossiers:

| surface | accounts | evidence items | menu-like | rate |
|---|---|---|---|---|
| **programme_tiers** | 6 | 6 | 4 | **67%** |
| partner_recruitment | 17 | 31 | 8 | 26% |
| portal | 7 | 9 | 2 | 22% |
| enablement | 6 | 7 | 1 | 14% |
| deal_registration | 3 | 4 | 0 | 0% |

**22.7% of all surface evidence reads as a navigation menu.**

**Verdict: negation IMPLEMENTED with ZERO measured effect.** Per the mandate's contingency:
the false-positive rate did not fall, so **the tiers detector should be retired** — 67%
menu-like at n=6, and it is the weakest-evidenced surface in the system. The real fix is
navigation-chrome exclusion, which is a different piece of work and is not claimed here.

---

## F1 — The untested-16, and the corrected headline

All 16 untested CRM cases were probed across 28 careers paths, 7 careers subdomains and 18
nested paths, then hand-checked where the verdict was implausible.

| verdict | n | meaning |
|---|---|---|
| **GOOD** | **9** | no public careers surface exists |
| **BAD** | **4** | a real surface existed and the pipeline missed it |
| **BLOCKED** | **3** | the site returns 403 — neither class |

BLOCKED is a class the original audit did not have. `sage.com` returns 403 on every careers
path; calling that "genuinely not public" would be wrong.

| | original | corrected |
|---|---|---|
| good | 39 (25.8%) | 48 (31.8%) |
| bad | 60 (39.7%) | 64 (42.4%) |
| blocked | – | 3 (2.0%) |
| untested | 52 (34.4%) | 36 (23.8%) |
| **"ours to fix"** | **74.2%** | **66.2%** |

**The 74.2% headline was an upper bound presented as a point estimate. The corrected measured
figure is 66.2%.** If the 36 still-untested cases resolve at the observed 9:4 ratio, it would
land near 50% — that is an extrapolation from n=13 and is offered as a range, not a figure.

---

## F2 — Discovery recall, one segment

Segment: Belgian B2B software companies with a publicly reachable partner page. 30 candidates
assembled by hand without consulting discovery output; **18 verified** by retrieving a partner
page on their own domain. Companies without one were dropped from the denominator rather than
counted as misses.

| mechanism | recall |
|---|---|
| query families (13 families, all queries run to date) | **0 / 18 = 0%** |
| reseller-side inversion (19 counterparties) | **3 / 18 = 17%** |
| **union** | **3 / 18 = 17%** |

The inversion beats the query families **3–0** on this segment, which is independent support
for workstream A. *Against interest:* one of the three (payflip.be) came via Securex, a
confirmatory counterparty found by searching for Payflip — circular. Excluding it,
**2/18 = 11%** from non-circular sources.

**This is recall against this list and nothing more.** The list is a convenience sample and
cannot support any claim about the size of the Belgian B2B software population.

**Verdict: MEASURED, AND IT IS LOW.** Nothing in this project supports a market-coverage claim.

---

## Reframe — ordering by cost-to-decide

Ordered by evidence density, a quoted first-person invitation, established ownership and the
absence of a competitor flag. Scored against an independent yardstick the ordering never
consults: the dossier's own open blocking questions.

| ordering | top-half blocking | bottom-half | separation |
|---|---|---|---|
| cost-to-decide | 1.94 | 2.44 | **0.50** |
| arbitrary baseline | 2.06 | 2.33 | 0.27 |

Spearman rho(cost, blocking questions) = **0.312**, n=35.

**Verdict: weakly positive, not deployable.** Better than an arbitrary ordering, but the margin
over baseline is 0.23 blocking questions and n=35 supports a direction, not an effect size.
**No queue was built**, per the mandate.

---

## Reported against interest

**What I got wrong in this phase**

1. **I misdiagnosed the EXPO.e tier bug in the 25 August audit** and built workstream E on that
   diagnosis. Negation was not the cause; navigation chrome is. E delivers a tested component
   with zero measured effect on the problem it was built for.
2. **My first segment-mix measurement was an artefact I created.** I counted enterprise giants
   only among domain-resolved vendors, and giants arrive predominantly as slug names — so the
   denominator systematically excluded the population being counted. It reported 3.9% for a
   seed containing Capgemini, Cognizant and Wipro, which should have been implausible on its
   face.
3. **My counterparty seed did not test the stated hypothesis.** It is dominated by global SIs,
   not the mid-market consultancies workstream A is about.
4. **I fitted the informal detector to its validation cohorts** across three iterations, and one
   of those consumed the matched-unlabelled cohort as a holdout.
5. **My first crawler fix made things worse** — trying www-then-bare on every path halved path
   coverage under a fixed budget and dropped a counterparty that had previously worked.

**What earlier phases got wrong, revealed by this one**

6. **The 74.2% headline was an upper bound presented as a point estimate.** Corrected to 66.2%,
   and the audit's closing conclusion rested on the higher figure.
7. **The audit's unknown taxonomy had no BLOCKED class.** Three of sixteen cases are sites that
   refuse retrieval, which is neither "genuinely not public" nor "our failure".
8. **`programme_tiers` has been reporting confirmed findings from navigation menus** at a 67%
   rate, undetected because only six accounts were ever hand-checked.
9. **The pipeline's English-only prose matching was producing false negatives on known
   customers** in a corpus whose thesis is explicitly about the EU mid-market.

**What did not work and should not be revisited**

- Locator JSON-endpoint extraction: no endpoint discoverable on any of three known cases.
- Query-family discovery on a bounded national segment: 0/18.

---

## What an AE should trust tomorrow

Carried forward from the 25 August audit and updated.

**Trust**
- That a partner motion exists and what type it is, when a quote and URL are shown — 61% coverage.
- **New:** that a company is actively recruiting partners in its own voice and has named the
  types it wants, when the informal verdict is shown. 4/4 on known customers, 0 false positives
  across 34 control companies.
- That a named CRM in a quoted live advert is real — 3.9% coverage, holdout 20/20.
- **New:** a published programme-size figure, as a claim the company makes about itself — 19%
  coverage, 3/3 on known cases.
- That a competitor flag is real, and that "unknown" is honest.

**Do not trust**
- **Partner tiers.** 67% of tier evidence is navigation menu. Recommend retiring the detector.
- Any `not_observed` field as evidence of absence.
- That CRM unknown means no CRM.
- **New:** any implication of market coverage. Measured recall on one bounded segment is 17%,
  and 0% for the query families.
- **New:** a proxy positive as a known customer. 88% verified is not 100%.

---

## Failed hypotheses

Per the mandate, nothing defined-and-almost-never-matching is presented as working.

| hypothesis | status |
|---|---|
| Partner locators are JS front-ends over a readable JSON endpoint | **failed** — 0/3 |
| Negation handling will reduce the prose false-positive rate | **failed** — 10 → 10 |
| Reseller-side counterparties select for mid-market regardless of counterparty size | **failed** — size is the variable, not type |
| Query families reach a bounded national segment | **failed** — 0/18 |

Two detectors shipped with low corpus coverage and are labelled as such rather than as
working features: programme-scale extraction (19%) and the informal signature (26.3% on the
stratum where it is strongest, 0% on enterprise).

---

## Status

255 tests across 18 files. Typecheck clean. Build clean. Nothing on the frozen list was
touched: no historical job handling, no search-based CRM forensics, no fingerprint CRM work, no
CRM gate, no partner-manager rule, no distributor demotion, no scoring, no queue, no UI.
