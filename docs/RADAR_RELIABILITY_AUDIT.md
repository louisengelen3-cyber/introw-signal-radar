# Radar Reliability & Data-Coverage Audit — completed

**Observational. No detector was tuned to improve any number here.**
Population: **151 researched companies** across four discovery mechanisms · 2026-08-25

Machine-derived outputs in `audit/out/`: `introw-radar-reliability-audit.{json,csv}` ·
`field-coverage.csv` · `segment-coverage.csv` · `failure-analysis.csv` · `failure-ranking.csv` ·
`unknown-audit.csv` · `crm-forensics.csv` · `ats-coverage.csv` · `discovery-funnel.csv` ·
`source-yield.csv` · `account-completeness.csv` · `false-negatives.csv` · `false-positives.csv` ·
`importance-vs-coverage.csv` · `bottom-10-fields.csv` · `compliance-audit.json` ·
`people-linkedin.json` · `manual-research-gap.json` · `tiers-utility.json`

---

## 01 Executive Verdict

The audit required by the original mandate was **not complete**. Of 24 requirements inspected
against their artifacts: **1 completed, 22 partial, 1 missing entirely.** The dataset behind
the 25 August report was written before Phase 5 and covers 77 accounts; Phase 5 then researched
75 more and added two fields the schema had no column for. This mandate completed the missing
work and rebuilt every derived output over the full 151-company population.

Three findings dominate.

**The Radar does not reach Introw's actual customers.** Of 19 known Introw customers, **15 were
never surfaced by any discovery mechanism**. The four that appear in the corpus do so because
they were seeded by hand in an earlier phase, not because discovery found them. Combined with
the Phase 5 recall measurement — query families 0/18, counterparty inversion 3/18 on a
hand-built Belgian segment — discovery is not currently a mechanism that finds prospects.

**The Radar establishes THAT a programme exists and misses HOW it works.** Partner motion 66.2%.
Every field describing the programme's operation sits below 11%: deal registration 4%, partner
tiers 5.3%, referral 0.7%, lead sharing 0%, partner pipeline 0%, incentives and attribution
never attempted. On a frozen six-account manual comparison the Radar missed **17 publicly
available facts, 5 of them critical**, and every miss was operational detail — certification
levels, tier requirements, incentive structures, margin mechanics.

**One frozen assumption was wrong and is now corrected.** Public person discovery was measured
at 2/18 in an earlier phase and dropped as non-viable. Measured again through search-engine
**indexed** LinkedIn rather than direct access: **7 of 8 accounts yield a named partner person,
4 of 8 yield two or more, and 0 of 8 were blocked.** The earlier failure was an access failure,
not an availability failure.

---

## 02 Compliance Audit

Full detail in `audit/out/compliance-audit.json`. Classified by inspecting artifacts.

| status | n | notable |
|---|---|---|
| COMPLETED | 1 | discovery recall (Part 11) |
| PARTIAL | 22 | dataset, field coverage, CRM funnel, ATS, failure taxonomy, unknown audit, source yield, manual comparison |
| MISSING | 1 | **people coverage (Part 28)** — never attempted on any account |

The largest single defect: the failure taxonomy required 18 named classes and only 6 were ever
assigned, so twelve classes had no count. The second: the unknown audit had no BLOCKED class,
so a site returning 403 was recorded as "genuinely not public".

**Two measurement-instrument bugs were found and fixed during this mandate** (disclosed per
Part 35, and both are now covered by tests):

1. `build-dataset` read the file it writes. On its second run it consumed its own output and
   reclassified 42 search-discovered accounts as manual seeds. Fixed by reading a frozen copy
   of the prior dataset from commit `d773b61`.
2. The "CRM any evidence" coverage row reused the decisive-level set and reported 1.3% where
   the true figure including supporting evidence is 17.2%.

A third instrument gap produced a false zero: constructs were never persisted for the 30
inversion-surfaced accounts, so all 30 read "ownership unknown" and "0 commercially reviewable".
Re-run with constructs persisted, the true figures are 21 with motion and 20 review-ready.

---

## 03 Population & Denominators

| mechanism | n | how these companies entered |
|---|---|---|
| PRM customer harvest | 45 | named as a customer by a PRM vendor |
| search query family | 42 | 12 generic multilingual queries |
| manual seed | 34 | supplied by hand in earlier phases |
| counterparty inversion | 30 | named as a vendor by a consultancy, VAR or marketplace |
| **total** | **151** | |

Every coverage percentage in this report uses **151** as its denominator, asserted by test.
Cells below n=6 carry an explicit warning in `segment-coverage.csv` and should not be compared.

Two denominators are deliberately smaller and are never mixed into corpus rates: the CRM
forensic funnel runs on the **77** accounts that received full CRM research, and people/LinkedIn
was measured on a bounded **8**.

---

## 04 Discovery Reliability

`audit/out/discovery-funnel.csv`.

| mechanism | surfaced | resolved | researched | motion established | review-ready |
|---|---|---|---|---|---|
| search query family | 99 results → 94 domains | 74 companies | 42 | 27 (64.3%) | 15 (35.7%) |
| counterparty inversion | 363 mentions | 153 domains | 30 | 21 (70%) | 20 (66.7%) |
| PRM customer harvest | 133 mentions | 78 domains | 45 | 35 (77.8%) | 26 (57.8%) |

**Counterparty inversion and PRM-customer harvest both outperform query families** on every
downstream measure. The query-family funnel loses 25 of 99 results to things that are not
companies at all — trade press, registries, listicles, a securities regulator.

## 05 Discovery Recall

Measured on one bounded segment (Belgian B2B software with a public partner page, 18 verified
members): **query families 0/18 (0%), counterparty inversion 3/18 (17%), union 17%.** Excluding
one circular hit, 2/18 = 11% from non-circular sources.

Against known Introw customers: **15 of 19 never discovered by any mechanism.**

**Candidate-generation precision and market recall are different things and only the first is
good.** Precision on resolved companies is 57%; recall is 0–17% on the one segment where it has
been measured. **Nothing in this project supports a claim about market coverage.**

## 06 Entity Resolution

151 accounts: 78 resolved by first-party name match (PRM harvest), 30 by outbound link, 43
supplied with a domain. Zero wrong-company dossiers were built. Two resolution risks are
recorded: 58% of inversion mentions arrive as slug names with no domain, and one people result
(DataCore) names a person at a subsidiary brand — a D3 brand-resolution risk, not a clean match.

## 07 Partner Motion Coverage

**103 of 151 = 68.2% established** (`partner_motion_state`), 66.2% by the stricter
field-coverage rule. This remains the Radar's one strong capability.

## 08 Commercial Workflow Coverage

The layer Introw sells into.

| field | known | coverage | importance |
|---|---|---|---|
| Partner portal | 16 | 10.6% | HIGH_VALUE |
| Partner enablement | 10 | 6.6% | HIGH_VALUE |
| Partner tiers | 8 | 5.3% | HIGH_VALUE |
| Deal registration | 6 | 4.0% | **CRITICAL** |
| Co-selling | 6 | 4.0% | USEFUL |
| Partner onboarding | 2 | 1.3% | USEFUL |
| Referral | 1 | 0.7% | HIGH_VALUE |
| Lead sharing | 0 | **0%** | HIGH_VALUE |
| Partner pipeline | 0 | **0%** | **CRITICAL** |
| Partner incentives | 0 | not attempted | HIGH_VALUE |
| Partner attribution | 0 | not attempted | **CRITICAL** |

## 09 CRM Coverage

**3 of 151 accounts have a defensible current CRM conclusion — 2.0%.** Any CRM evidence
including supporting: 26 (17.2%). Blocked: 3. Not attempted: 74.

## 10 CRM Forensics Funnel

`audit/out/crm-forensics.csv`, n=77 (the accounts that received full CRM research).

```
77  accounts researched
77  CRM research attempted
59  careers surface reachable
54  jobs found (>=1 readable vacancy)
54  relevant non-partner jobs read
27  vendor-specific evidence, any source
 9  CRM language in a JOB source (not a fingerprint)
 4  operational possession evidence
 3  current CRM established
 0  historical CRM established
 1  conflict
74  remains unknown  (96.1%)
```

The collapse is 54 → 9. Fifty-four companies served readable adverts and forty-five never named
a CRM. That is publication behaviour, not retrieval failure.

Unique accounts unlocked, by source: `company_ats_vacancy` 2, `company_current_vacancy` 1,
`company_careers_index` 1. By job family: **AE/Sales 2, other/untitled 1.**

## 11 Non-Partner Vacancy Contribution

**5 of 5 decisive CRM observations came from non-partnership roles.** Partnership titles
produced 3 observations and **zero** conclusions. Restricting research to partner roles would
have produced no CRM evidence at all. The absolute gain is 3 accounts in 151 — going from 0% to
2.0%, not from poor to good.

## 12 Historical Vacancy Contribution

**Zero.** No account has CRM evidence only because historical vacancies were searched. Every job
observation is under six months old or undated. No source that serves genuinely archived
vacancies is wired in, so the temporal classification machinery — which is holdout-verified in
both directions — is carrying no load.

## 13 LinkedIn Contribution

`audit/out/people-linkedin.json`, n=8.

| measure | value |
|---|---|
| attempted | 8 |
| accessible via search index | 8 |
| **blocked** | **0** |
| useful evidence (any named person) | 7 (87.5%) |
| two or more people | 4 (50%) |
| **unique CRM evidence** | **0** |
| **unique partner-programme evidence** | **0** |
| accounts where LinkedIn was the only source | 4 |

**Does LinkedIn materially improve the Radar? For people, yes and it is the only source that
does. For everything else, no.** Across the entire project, indexed search including LinkedIn
has produced zero CRM conclusions and zero partner-programme facts, and on one occasion would
have attributed another company's HubSpot (Kore.ai to KORE Wireless).

## 14 ATS Coverage

`audit/out/ats-coverage.csv`, n=77.

| state | n | % |
|---|---|---|
| supported ATS board attributed | 9 | 11.7% |
| **no board, vacancies read anyway** | **46** | **59.7%** |
| careers page found, no readable vacancy (JS-only or listing) | 4 | 5.2% |
| no careers surface reached at all | 18 | 23.4% |
| blocked (403) | 3 | 3.9% |
| historical vacancies despite no board | 0 | 0% |
| indexed jobs used despite unsupported ATS | 0 | 0% |

**ATS reach is no longer the bottleneck.** It has been replaced by "no careers surface reachable
at all" (23.4%) and by the fact that reaching vacancies does not produce CRM evidence.

## 15 People Coverage

Measured for the first time. n=8, chosen as the **most favourable** population (established
partner motion).

| measure | value |
|---|---|
| any relevant partner person found | **7/8 (87.5%)** |
| two or more found | 4/8 (50%) |
| role evidence without a named person | 1 (Canonical) |
| never attempted (rest of corpus) | 143 |

Named examples: Aikido (Jake Vogt, Thomas Segura), Aircall (Adam Bailes, Frédéric Viet), Cubbit
(Raffaele Giustini, Enrico Signoretti), Bytes (Andy Walker, Penelope Bridger).

**This overturns a frozen assumption.** The earlier 2/18 result measured a different route.
Absence still means UNKNOWN and team size is never inferred from no results.

## 16 PRM Coverage

**0%.** No account has a confirmed PRM vendor. PRM portals are served from the customer's own
domain behind a login, so DNS fingerprints find nothing. This is a public-data limit.

## 17 Programme Scale

**9 of 151 = 6.0%** publish a claimed programme size (19% of the 47 accounts with an established
motion, which is the honest denominator for this field). Four distinct quantities are kept
separate and never converted into one another: `directory_entries_observed`,
`programme_scale_claimed`, unique partner entities (not measured), and estimated size (never
estimated). A published count is stored as a **claim the company makes about itself**.

## 18 Informal Signature

Fires on **8 of 151 (5.3%)** across the whole population; 19 accounts have any informal verdict.
Phase 5 validation stands: 4/4 known positives, 0/14 clean negatives, 0/5 partner-tech,
0/15 matched-unlabelled, and 26.3% SMB / 16.7% mid / 0% enterprise / 0% control.

**It is not presented as generalised.** The detector was fitted across three iterations and one
of those consumed the matched-unlabelled cohort. Its only genuinely independent test is the
proxy-positive population, where it fired at 26.3% on SMB and 0% on control.

## 19 Sector Coverage

| sector | n | motion | ownership | CRM | review-ready |
|---|---|---|---|---|---|
| unclassified | 109 | 69.7% | 60.6% | 2.8% | 57.8% |
| software | 24 | 62.5% | 45.8% | 0% | 37.5% |
| manufacturing | 7 | **28.6%** | 14.3% | 0% | 14.3% |
| IoT / hardware | 6 | 100% | 50% | 0% | 50% |
| industrial | 3 | 66.7% | 0% | 0% | 0% ⚠ |
| cybersecurity | 2 | 100% | 100% | 0% | 100% ⚠ |

⚠ cells below n=6 — do not compare. **109 of 151 accounts have no recorded sector**, because
sector was never captured for the manual-seed and Phase 5 populations. That is a data-model
gap, not a research gap, and it makes the sector analysis weak.

## 20 Geography Coverage

DACH 11 (motion 54.5%, ownership 9.1%) · US/global 6 (100%) · UK 6 (100%) · FR 6 (50%) ·
IT 5 ⚠ (20%) · US 2 ⚠ · Benelux 2 ⚠ · Nordics 2 ⚠. Canada: **0 accounts** — the region was
never reached. 109 accounts have no region recorded.

## 21 Language Coverage

English 16 (motion 93.8%) · German 11 (54.5%) · French 6 (50%) · Italian 5 ⚠ (20%) ·
Dutch 2 ⚠ · Swedish 2 ⚠ (0%). Language is recorded as the **discovery query language**, not the
company's publication language — a proxy, and a weak one.

## 22 Failure Taxonomy

`audit/out/failure-analysis.csv`. All classes now assigned.

| class | n | % | consequence | fixability |
|---|---|---|---|---|
| **R1** page not retrieved | 73 | 48.3% | company looks like it has no motion when it may | ENGINEERING_FIXABLE |
| **E1** evidence not extracted | 19 | 12.6% | page read, produced nothing — silent | ENGINEERING_FIXABLE |
| **R4** search index failure | 18 | 11.9% | CRM never establishable from hiring | SOURCE_COVERAGE_FIXABLE |
| **P4** source authority too weak | 17 | 11.3% | CRM suggested, not establishable | PUBLIC_DATA_LIMIT |
| **P1** not public | 12 | 7.9% | vacancies read, no CRM named | PUBLIC_DATA_LIMIT |
| **C1** wrong classification | 8 | 5.3% | asserts a workflow the page does not support | ENGINEERING_FIXABLE |
| **R3** JS / access blocked | 3 | 2.0% | no evidence either way | ENGINEERING_FIXABLE |
| NONE | 1 | 0.7% | motion and CRM both established | — |

Classes with a count of zero in this corpus, recorded rather than omitted: D1 (measured
separately against customers: 15), D2, D3 (1 risk case), R2, R5, E2, E3 (both observed in the
manual comparison but not machine-assignable), C2, C4, C5 (all caught and fixed in earlier
phases), P2, P3.

**Roughly two thirds of failures are ours.** 68.2% engineering or source-coverage fixable,
19.2% public-data limit.

## 23 Unknown Taxonomy

`audit/out/unknown-audit.csv`. Four classes, `partner_people` excluded from the aggregate
because it was measured on a deliberately bounded n=8.

| field | unknown | good | bad | untested | blocked |
|---|---|---|---|---|---|
| CRM | 148 | 29 | 42 | 74 | 3 |
| Partner motion | 48 | 16 | 14 | 18 | 0 |
| Deal registration | 140 | 17 | 75 | 48 | 0 |
| *partner people* | *144* | *0* | *1* | *143* | *0* |

**Full population (n=336):** good 18.5% · bad 39.0% · untested 41.7% · blocked 0.9% →
**"ours to fix" 80.7%.**

**Comparable 76-account subset:** good 28.5% · bad 49.4% · untested 20.3% · blocked 1.7% →
**"ours to fix" 69.8%.**

The headline has now been computed three ways: **74.2%** (25 Aug), **66.2%** (Phase 5 F1
correction), **69.8%** (this audit, comparable subset), **80.7%** (full population). It is
sensitive both to population and to classification rule. **It should be quoted as a range of
roughly 66–81%, never as a point estimate**, and the higher full-population figure is inflated
by newly added accounts that were researched less deeply.

## 24 False Negatives

`audit/out/false-negatives.csv`, against the 19 known Introw customers.

- **15 of 19 never discovered** — failure class D1. Root cause: no discovery mechanism reaches
  them. Would the current architecture ever find them? **No.**
- Of the 4 present in the corpus, **4/4 are review-ready** and **1/4 has a CRM conclusion**.

So: when a customer is handed to the Radar, it researches them adequately. It does not find them.

## 25 False Positives

`audit/out/false-positives.csv`, 18 flagged items.

| category | n |
|---|---|
| generic partner language (tier evidence) | 10 |
| partner-tech vendor (caught by the guard) | 4 |
| uses a competitor PRM (recorded, not an error) | 2 |
| integration/finder read as a programme | 1 |
| integration ecosystem read as motion | 1 |

The one new case from the manual comparison: **3M's robotics integrator FINDER is recorded as
an established partner motion.** It is a buyer-facing directory, not a programme 3M recruits
into — the operator/participant distinction at divisional granularity inside a conglomerate.

## 26 Source Yield

`audit/out/source-yield.csv`.

| source family | accounts touched | unique useful facts | verdict |
|---|---|---|---|
| company website (base) | 151 | 103 motions | **the backbone** |
| counterparty inversion | 19 counterparties | 30 researched, 150 domains surfaced | **highest discovery yield** |
| PRM customer harvest | 13 vendors | 45 researched | **highest review-ready rate (57.8%)** |
| recovery (regional/subdomains) | 77 | 27 | high |
| LinkedIn / public indexed | 8 | 7 people | **people only** |
| partner directories | 151 | 13 | low, lower-bound only |
| programme-scale prose | 47 | 9 | low |
| current jobs | 77 | 3 | very low |
| website fingerprints | 151 | **0 decisive** | supporting only |
| historical jobs | 77 | **0** | **carrying no load** |
| targeted CRM search | 4 | **0** | **negative value** — 3 false positives avoided |

## 27 Information Gain

Base company website establishes motion on 103 of 151. Then, without double counting:
**+ counterparty inversion** 30 accounts that no other mechanism reached ·
**+ PRM harvest** 45 accounts · **+ recovery** 27 accounts gained evidence ·
**+ non-partner jobs** 3 CRM conclusions (all of them) ·
**+ LinkedIn** 7 people, 0 anything else ·
**+ historical jobs** 0 · **+ fingerprints** 0 decisive · **+ directories** 13 lower bounds.

## 28 Manual Research Gap

`audit/out/manual-research-gap.json`. Sample frozen at sha256 `fddda63cb7268661` **before** any
research, Radar output captured at freeze time, six of eleven researched.

| account | facts missed | critical | false claims |
|---|---|---|---|
| ebp.com | 4 | 2 | 0 |
| avast.com | 4 | 2 | 0 |
| appelit.com | 4 | 1 | 0 |
| aftersell.com | 3 | 0 | 0 |
| 3mdeutschland.de | 2 | 0 | **1** |
| accruent.com | 0 | 0 | 0 |
| **total** | **17** | **5** | **1** |

EBP alone: two named programmes, four certification levels, a selective-distribution contract
and a reseller-versus-integrator distinction — all on a sub-page of the partner page the Radar
did read. Avast: tiered programme with revenue and training requirements, tiered discounts,
quarterly incentives. **Every miss is operational detail.**

## 29 Commercial Importance vs Observability

`audit/out/importance-vs-coverage.csv`. The rows that matter:

| field | importance | coverage | fixability |
|---|---|---|---|
| Partner motion | CRITICAL | 66.2% | ENGINEERING_FIXABLE |
| Programme ownership | CRITICAL | 41.1% | HUMAN_RESEARCH_MAY_HELP |
| Commercial partner motion | CRITICAL | 15.9% | ENGINEERING_FIXABLE |
| **Deal registration** | **CRITICAL** | **4.0%** | PUBLIC_DATA_LIMIT |
| **Partner pipeline** | **CRITICAL** | **0%** | PUBLIC_DATA_LIMIT |
| **Partner attribution** | **CRITICAL** | **not attempted** | PUBLIC_DATA_LIMIT |
| **Current CRM** | **CRITICAL** | **2.0%** | PUBLIC_DATA_LIMIT |
| Partner people | HIGH_VALUE | 4.6% measured, 87.5% on the sample | SOURCE_COVERAGE_FIXABLE |

**Five of seven CRITICAL fields sit below 16%, and four of those are public-data limits.**

## 30 Bottom 10 Fields

| field | coverage | importance | harms qualification? |
|---|---|---|---|
| Partner pipeline | 0% | CRITICAL | **YES** |
| Partner attribution | not attempted | CRITICAL | **YES** |
| Partner incentives | not attempted | HIGH_VALUE | **YES** |
| Historical CRM | 0% | OPTIONAL | no |
| PRM | 0% | USEFUL | no |
| Temporal / Why Now | not attempted | USEFUL | no |
| Referral | 0.7% | HIGH_VALUE | **YES** |
| Lead sharing | 0.7% | HIGH_VALUE | **YES** |
| Partner onboarding | 1.3% | USEFUL | no |
| **CRM decisive** | **1.3%** | **CRITICAL** | **YES** |

## 31 Top Failure Modes

**By frequency:** R1 (73) · E1 (19) · R4 (18) · P4 (17) · P1 (12) · C1 (8) · R3 (3).

**By commercial impact:** C2 possession-vs-experience and C4 current-vs-historical (both
catastrophic, both caught and fixed, both now regression-tested) · C1 wrong classification (8
live) · C3 operator-vs-participant (1 live, 3M) · D3 brand resolution (1 risk) · R1 volume ·
E1 silence · R4 · P4 · P1.

## 32 Paid Data Assessment

Based only on measured gaps.

| category | verdict | reasoning |
|---|---|---|
| **People** | **NO — and this is a reversal** | Public indexed LinkedIn returns a named partner person on 7 of 8. The gap was access, not availability. Build the search path before buying the data. |
| **Technographics / CRM** | **QUALIFIED YES** | Current CRM 2.0%; 29 of 148 CRM unknowns are GOOD unknowns — genuinely unpublished. Only non-public telemetry closes those. Buy only with per-record evidence visible; a vendor assertion without a sentence reintroduces the over-claim this project spent three phases removing. |
| **Historical jobs** | **NO, not yet** | The classification machinery works and has nothing to classify. Wire a free archived-vacancy source and measure first. |
| **Company metadata** | **NO** | 109 of 151 accounts have no sector and no region because we never recorded them. That is a schema fix, not a purchase. |
| **Current jobs** | **NO** | 71% reach already; the gap is JS rendering and 23% of companies having no careers surface at all. |

## 33 Production Reliability

Production ships recovery and CRM forensics. Neither was changed in this mandate. 277 tests
across 19 files, typecheck clean, build clean. The live product still renders partner tiers,
which §27 below recommends retiring.

## 34 What Is Reliable Today

1. **"A partner motion exists and here is the quote."** 66.2% coverage, quoted and attributed.
2. **"The programme is of type X."** 65.6%, multilingual, holdout-tested.
3. **"This company is a partner-tech vendor."** 4 caught, 0 promoted; guard is unconditional.
4. **"A named CRM in a quoted live advert is real."** 2.0% coverage, holdout 20/20, zero false
   confirmations.
5. **"A named partner person exists."** 7/8 on the measured sample — the strongest new result.
6. **"We did not establish this, and here is what we consulted."** Now with four distinct
   unknown states.

## 35 What Is NOT Reliable Today

1. **Discovery.** 15/19 known customers never found; recall 0–17% on the one measured segment.
2. **Every commercial workflow field.** Deal registration 4%, pipeline 0%, attribution and
   incentives never attempted.
3. **Current CRM.** 2.0%.
4. **Partner tiers.** 67% menu-like; see §27 recommendation.
5. **PRM, temporal, historical CRM.** All 0%.
6. **Sector and geography analysis.** 109 of 151 accounts carry neither.
7. **Any claim of market coverage.**

### programme_tiers — KEEP / REWORK / **RETIRE**

`audit/out/tiers-utility.json`. 8 accounts carry a confirmed tier finding; 67% of tier evidence
in the audited sample is navigation-menu text; and tiers is the **only** workflow found on just
**2** accounts. It is the least reliable surface in the system and contributes almost nothing
unique. **RETIRE.** It is not retired in this mandate, because that is product optimisation and
Part 35 forbids it here.

## 36 Recommended Next Engineering Priorities

In measured-value order. **None implemented here.**

1. **Deeper partner-page traversal.** R1 is 48.3% of failures and the manual comparison shows
   the missing facts sit on sub-pages of pages already read.
2. **Navigation-chrome exclusion.** 22.7% of surface evidence is menu text; it is the true
   cause of the tier false positives.
3. **Wire indexed-LinkedIn people search into the pipeline.** 7/8 on the sample; currently a
   manual method with zero production integration.
4. **Record sector, region and language at ingest.** 109 accounts lack them, which is why the
   segment analysis is weak.
5. **Read PDFs linked from partner pages.** Two manual-comparison misses lived in PDFs.
6. **Detectors for incentives and attribution.** Both CRITICAL-adjacent, both at zero because
   nothing looks for them.

## 37 Final Verdict

**The Radar is a competent research assistant with no working discovery and almost no
visibility into partner operations.**

It establishes that a company runs a partner programme, in 66% of cases, with quoted
first-party evidence and honest unknowns. It cannot find the companies Introw sells to, cannot
describe how a programme works, and cannot establish a CRM. Two thirds of what it does not know
is its own retrieval and extraction failure, not a limit of the public web.

---

## Red Team

**Are denominators honest?** Now yes, and asserted by test: every coverage figure uses 151.
Three smaller denominators (77 CRM, 8 people, 6 manual) are stated at each use. The previous
report's field coverage silently used 77 while describing a corpus that had grown.

**Did we reuse tuning populations as validation?** Yes, and it is disclosed. The informal
detector was fitted across three iterations, consuming the matched-unlabelled cohort. Its only
clean test is the proxy population. The people sample was chosen to be maximally favourable.

**Are any claims based on known labels?** The false-negative audit uses the 19 known customers —
appropriate, since it measures misses. No detector was tuned against them in this mandate.

**Are we confusing publication with commercial suitability?** Structurally, yes, and it is
unfixed. A company that writes more about its programme scores as better evidenced. The 3M case
shows the sharper version: a buyer-facing finder read as an operated programme.

**Are we confusing inability to retrieve with absence?** This is what the four-state unknown
audit exists to prevent, and it says 39% BAD and 42% UNTESTED — so the honest answer is that we
were, extensively, and now we can quantify it.

**Are historical jobs being overstated?** No. Zero, reported as zero, with a recommendation not
to invest further.

**Are CRM mentions being overstated?** No. 27 accounts have vendor-specific evidence and only 3
have a defensible conclusion; the gap between those numbers is the whole point.

**Are proxy positives being mistaken for customers?** No. 88% verified, labelled a distinct
class, stratified and never pooled. But 45 of 151 accounts — 30% of the population — are proxy
positives, and their higher review-ready rate (57.8%) partly reflects that PRM buyers publish
more.

**Are informal signatures overfit?** Yes, and stated. 8 firings in 151.

**Is discovery recall actually known?** Only for one hand-built segment of 18 companies. That is
not market recall and is not presented as it.

**Would an Introw seller trust this?** For the 78 review-ready accounts, the motion evidence and
the quotes, yes. The tier fields, no. The absence of a CRM, no — it means nothing.

---

## Answers

1. **Sufficient for commercial review:** 78/151 = **51.7%**
2. **Insufficient / under-observed:** 73/151 = **48.3%**
3. **Best covered:** partner motion 66.2% · programme type 65.6% · programme ownership 41.1% ·
   CRM any evidence 17.2% · commercial partner motion 15.9%
4. **Worst covered:** partner pipeline 0% · lead sharing 0.7% · referral 0.7% ·
   partner attribution (not attempted) · partner incentives (not attempted)
5. **Defensible current CRM:** 3/151 = **2.0%**
6. **From non-partner vacancies:** **5 of 5 decisive observations — 100% of all CRM evidence**
7. **From historical vacancies:** **0%**
8. **Uniquely from LinkedIn/indexed:** **0% for CRM and partner facts; 7/8 for people**
9. **Largest discovery failure:** 15 of 19 known Introw customers never surfaced (D1)
10. **Largest retrieval failure:** R1 — relevant page not retrieved, 48.3%
11. **Largest extraction/classification failure:** E1 — page read, nothing extracted, 12.6%;
    C1 wrong classification, 5.3%, concentrated in tiers
12. **Largest genuine public-data limit:** companies do not name their CRM — 45 of 54 companies
    whose adverts were read never mentioned one
13. **Most unique useful information:** the company's own website for facts; **counterparty
    inversion** for discovery
14. **Most effort for least gain:** historical vacancies (0), targeted CRM search (0, 3 false
    positives avoided), website fingerprints (0 decisive)
15. **Strongest:** English-language UK and US/global software, cybersecurity and IoT with a live
    ATS board
16. **Weakest:** manufacturing (28.6% motion), Italian (20%), Nordic (0%), and anything served
    through JavaScript or PDF
17. **AE must still research manually:** every workflow detail (deal registration, tiers,
    incentives, attribution), the CRM for 98% of accounts, whether a programme is active, and
    partner counts
18. **Engineering can fix:** deeper partner-page traversal, navigation-chrome exclusion, indexed
    people search, sector/region capture at ingest, PDF reading
19. **Probably needs licensed data:** technographics for the 29 GOOD CRM unknowns — and **not**
    people, which is the reversal in this audit
20. **Probably unsolvable publicly:** deal-registration mechanics, partner pipeline, attribution,
    partner counts, programme activity, internal ownership
21. **Trust tomorrow:** the quoted motion evidence, the programme type, the competitor flag, a
    quoted CRM sentence, a named partner person, and every stated unknown
22. **Do NOT trust:** partner tiers · any `not_observed` as absence · CRM unknown as "no CRM" ·
    any implication of market coverage · sector and geography breakdowns below n=6
23. **Verdicts:**

| role | verdict | basis |
|---|---|---|
| **Discovery engine** | **NO** | 15/19 known customers never found; recall 0–17% |
| **Research assistant** | **YES** | 51.7% review-ready with attributed evidence and honest unknowns |
| **Qualification assistant** | **NO** | five of seven CRITICAL fields below 16% |
| **Autonomous prospecting engine** | **NO** | no discovery, and ~69–81% of unknowns are our own failures |
