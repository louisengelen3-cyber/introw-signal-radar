# Radar Reliability & Data-Coverage Audit

**Observational. No system was changed to improve these numbers.**
Corpus: 77 companies — 35 existing production accounts + 42 autonomously discovered · 2026-08-25

Machine-derived outputs: `audit/out/introw-radar-reliability-audit.{json,csv}` ·
`field-coverage.csv` · `failure-analysis.csv` · `source-yield.csv` · `crm-forensics.csv` ·
`account-completeness.csv` · `unknown-audit.csv`

---

## 1. The Central Question

> If an Introw AE relied on this system, what would it systematically see, systematically miss,
> sometimes misinterpret, and be unable to know?

**Systematically sees** — that a company operates a partner motion, and what kind. 61% of the
corpus. This is the Radar's one genuinely reliable capability.

**Systematically misses** — how the programme *works*. Deal registration 7.8%. Partner tiers
10.4%. Onboarding 2.6%. Referral 1.3%. Lead sharing, partner pipeline, incentives and
attribution: **0%**. The Radar can tell you a company has resellers. It almost never tells you
how those resellers are managed, which is the part Introw actually sells into.

**Sometimes misinterprets** — tier vocabulary. EXPO.e's partner page says *"we don't use tiered
services — you are automatically a Platinum Partner"*, and the Radar recorded
`partner_tiers = confirmed` from the word "Platinum". One in ten tier findings is a claim the
page explicitly denies.

**Cannot know** — current CRM, for 96% of companies. And partner headcount, partner counts,
programme activity and internal ownership, none of which were ever attempted.

### The four failure classes, measured separately

| class | share of corpus | meaning |
|---|---|---|
| **PUBLIC-DATA LIMIT** (P1, P4) | **45.5%** | we looked properly and the information is not public |
| **RETRIEVAL FAILURE** (R1, R3) | **35.1%** | the page or vacancy exists and we did not get it |
| **EXTRACTION FAILURE** (E1) | **16.9%** | we retrieved the page and got nothing off it |
| **DISCOVERY FAILURE** (D) | 1 case | wrong domain resolved at discovery time |
| **CLASSIFICATION FAILURE** (C) | 2 confirmed | tier false positive; CRM possession false positive |
| **fully complete** | **2.6%** | both motion and CRM established |

**Only two accounts in 77 have both a partner motion and a CRM conclusion.**

---

## 2. Account-Level Export

`audit/out/introw-radar-reliability-audit.json` and `.csv` — 77 rows × 54 fields.

Three values are used and they are not interchangeable:

- `unknown` — we asked and could not establish it
- `not_observed` — we read the relevant pages and the thing was not there
- `not_attempted` — no detector exists, or the question was never reached

`partner_incentives_state`, `partner_attribution_state` and `partner_people_state` are
`not_attempted` on every row. No detector exists for the first two, and person discovery was
measured non-viable in an earlier phase. Reporting them as "0% coverage" would imply we tried.

---

## 3. Field Coverage Matrix

n = 77. Full file: `audit/out/field-coverage.csv`.

| field | known | unknown | conflicting | not attempted | coverage | source that most often establishes it |
|---|---|---|---|---|---|---|
| Partner motion | 47 | 30 | 0 | 0 | **61.0%** | company partner page + recovery |
| Programme type | 46 | 31 | 0 | 0 | **59.7%** | partner page vocabulary |
| Programme ownership | 36 | 41 | 0 | 0 | **46.8%** | operator resolution |
| CRM — any evidence | 27 | 50 | 0 | 0 | 35.1% | website fingerprint (mostly) |
| Partner portal | 16 | 61 | 0 | 0 | 20.8% | partner page / login link |
| Partner directory | 13 | 64 | 0 | 0 | 16.9% | outbound-link density |
| Partner enablement | 10 | 67 | 0 | 0 | 13.0% | partner page prose |
| Partner tiers | 8 | 69 | 0 | 0 | 10.4% | partner page prose |
| Deal registration | 6 | 71 | 0 | 0 | 7.8% | partner page prose |
| Co-selling | 6 | 71 | 0 | 0 | 7.8% | partner page prose |
| Partner onboarding | 2 | 75 | 0 | 0 | 2.6% | partner page prose |
| **CRM — decisive** | **2** | 74 | **1** | 0 | **2.6%** (3.9% incl. conflict) | company vacancy |
| Referral | 1 | 76 | 0 | 0 | 1.3% | partner page prose |
| Lead sharing | 0 | 77 | 0 | 0 | **0%** | — |
| Partner pipeline | 0 | 77 | 0 | 0 | **0%** | — |
| CRM historical | 0 | 77 | 0 | 0 | **0%** | — |
| PRM | 0 | 77 | 0 | 0 | **0%** | DNS fingerprint (never fired) |
| Partner incentives | 0 | — | — | 77 | not attempted | no detector |
| Partner attribution | 0 | — | — | 77 | not attempted | no detector |
| Partner people | 0 | — | — | 77 | not attempted | measured non-viable |

**Which commercially important fields does the Radar almost never establish?** Deal
registration, lead sharing, partner pipeline, attribution and incentives — the entire
operational layer Introw exists to manage. Partner motion is well covered; *partner operations*
is not covered at all.

---

## 4. Coverage by Segment

### By sector

| sector | n | motion | CRM any | CRM decisive | deal reg |
|---|---|---|---|---|---|
| cybersecurity | 2 | 100% | 100% | 0% | 0% |
| IoT / hardware | 6 | 100% | 66.7% | 0% | 16.7% |
| industrial | 3 | 66.7% | 33.3% | 0% | 0% |
| software | 24 | 62.5% | 20.8% | 0% | 8.3% |
| *existing corpus (sector unrecorded)* | 35 | 57.1% | 42.9% | 8.6% | 8.6% |
| **manufacturing** | 7 | **28.6%** | **0%** | 0% | 0% |

Manufacturing is the weakest sector on every measure. This is the same physical-sector
observability gap earlier mandates measured, and recovery narrows but does not close it.

### By region

| region | n | motion | CRM any | deal reg |
|---|---|---|---|---|
| US/CA | 2 | 100% | 100% | 0% |
| US/global | 6 | 100% | 66.7% | 16.7% |
| UK | 6 | 100% | 16.7% | 16.7% |
| Benelux | 2 | 100% | 0% | 50% |
| DACH | 11 | 54.5% | 18.2% | 0% |
| France | 6 | 50% | 33.3% | 0% |
| Italy | 5 | **20%** | 20% | 0% |
| Nordics | 2 | **0%** | 0% | 0% |

### By discovery language

English 93.8% motion · German 54.5% · French 50% · Italian 20% · Swedish 0% (n=2).

The Radar is materially more reliable on English-language, US/UK, software and IoT companies.
It is weakest on Italian and Nordic manufacturers. Sample sizes below 6 are too small to carry
weight and are shown for completeness, not inference.

---

## 5. CRM Forensics Funnel

Real numbers, whole corpus:

```
77  accounts researched
77  received CRM research
59  had a reachable careers surface (ATS board or readable careers page)
54  had at least one readable vacancy
27  produced any vendor-specific observation
 9  produced vendor language in a JOB source (not a fingerprint)
 4  produced possession or operational-duty language
 3  established a decisive CRM conclusion
 3  established CURRENT CRM
 0  historical only
 1  conflict
74  remained current-CRM unknown  (96.1%)
```

**The collapse is between 54 and 9.** Fifty-four companies served us readable adverts and
forty-five of them never named a CRM. That is not a retrieval failure; it is what companies
choose to publish.

Decisive conclusions by source: **company ATS vacancy 2, company careers page 1**. Every other
source family contributed zero decisive conclusions: historical vacancies 0, LinkedIn 0, job
boards 0, search snippets 0, website fingerprints 0, company documentation 0.

---

## 6. Random-Vacancy Contribution

37 CRM observations came from job sources. By family:

| family | observations | decisive |
|---|---|---|
| General / other | 9 | 0 |
| **AE / Sales** | **7** | **3** |
| Unknown / untitled | 6 | 1 |
| Marketing Ops | 5 | 0 |
| Technical presales | 4 | 0 |
| Partnership / Channel | 3 | **0** |
| **RevOps / Sales Ops** | 2 | **1** |
| Customer Success | 1 | 0 |

**Decisive conclusions from non-partnership roles: 5 of 5.** Partnership titles produced three
observations and zero conclusions.

**Does broad vacancy research create meaningful incremental coverage?** Yes — it is the *only*
thing that produced any current-CRM evidence at all. Restricting research to partnership titles
would have yielded zero. But the absolute gain is 3 accounts in 77, so "meaningful incremental
coverage" means going from 0% to 3.9%, not from poor to good.

---

## 7. Historical Vacancy Contribution

**Zero.** No account had CRM evidence only because historical vacancies were searched.

Evidence age across all 37 job observations:

| age | n |
|---|---|
| < 6 months | 26 |
| 6–12 months | 0 |
| 1–2 years | 0 |
| 2–3 years | 0 |
| > 3 years | 0 |
| undated | 11 |

Conflicts with current evidence: 0. Possible migrations claimed: 0.

**Why:** companies' own careers surfaces serve *current* adverts. Genuinely archived vacancies
live on mirrors and search indexes, which this pipeline reaches only through search — and
search contributed nothing (§8). The temporal machinery is holdout-verified in both directions
and is currently carrying no load.

**Recommendation:** do not invest further in historical-vacancy handling until a source that
actually serves archived vacancies is wired in. The classification logic already works; there
is nothing for it to classify.

---

## 8. LinkedIn Contribution

| measure | value |
|---|---|
| accounts where LinkedIn was searched as a distinct source | **0** |
| accounts reached through public indexed search | 4 |
| blocked | 0 (never attempted directly) |
| useful evidence found | **0** |
| unique CRM evidence | **0** |
| unique people evidence | **0** |
| unique partner evidence | **0** |

**Does LinkedIn materially improve the Radar?** On this evidence, no — and it was not properly
tested as a standalone source, which I state rather than dress up. What *was* tested is targeted
public search including LinkedIn-indexed pages, on four accounts. It produced zero new
conclusions and surfaced three would-be false positives:

- Factorial: *"CRM tool familiarity with Salesforce **or** HubSpot"* — names two, proves neither
- Apaleo: *"Apaleo **integrates with** HubSpot"* — a product connector, not internal use
- Efficy: comparison pages, because Efficy **is** a CRM vendor

One further case makes the point sharply. Searching *"KORE Wireless careers Salesforce OR
HubSpot"* returns a Sales Ops Director role saying *"administer **HubSpot**"* — belonging to
**Kore.ai**, an unrelated company. A search-driven CRM detector would have attributed it. The
Radar did not, because it only reads first-party sources. **The strongest argument for the
first-party-only rule is that search actively supplies wrong answers.**

---

## 9. ATS Coverage

| state | n | share |
|---|---|---|
| attributable ATS board | 9 | 11.7% |
| **no board, vacancies read anyway** | **46** | **59.7%** |
| careers page but no readable vacancy | 4 | 5.2% |
| no careers surface at all | 18 | 23.4% |

**Is ATS coverage still a structural bottleneck?** **No — it has been replaced by a different
one.** Board reach fell to 11.7% (the new corpus is smaller and more European), yet vacancies
were read for 71% of companies. The bottleneck moved from "no ATS adapter" to "no readable
careers surface at all" (23.4%) and "careers page that serves nothing" (5.2%).

---

## 10. Discovery Funnel

```
12  queries (6 languages, 8 families)
99  search results
94  unique domains
74  resolved to a company            — dropped 25 non-companies: trade press, registries,
                                        legal references, listicles, a securities regulator
52  after removing duplicates        — dropped 22 already-known or same-group
42  channel operators                — dropped 4 partner-tech vendors/consultancies,
                                        6 participants (distributors, dealers, an agency)
42  dossiers built                   — no cheap gate; every operator researched
29  with sufficient or partial evidence — 13 under-observed
 7  plausible Introw fit
```

**Drop-off causes, largest first:** non-companies 25 (the web's SEO layer around channel
vocabulary), duplicates 22, under-observed after research 13, participants 6, partner-tech
vendors 4.

---

## 11–12. Failure Taxonomy and Counts

Full file: `audit/out/failure-analysis.csv`.

| stage | companies | % corpus | commercial consequence | fixability |
|---|---|---|---|---|
| **P1 — information not public** | 18 | 23.4% | vacancies read, no CRM named; nothing left to retrieve | PUBLIC_DATA_LIMIT |
| **R1 — relevant page not retrieved** | 17 | 22.1% | company looks like it has no partner motion when it may | ENGINEERING_FIXABLE |
| **P4 — source authority too weak** | 17 | 22.1% | a CRM is suggested but not establishable; seller must verify | PUBLIC_DATA_LIMIT |
| **E1 — page found, evidence not extracted** | 13 | 16.9% | a partner surface was read and produced nothing | ENGINEERING_FIXABLE |
| **R1b — no careers surface reachable** | 8 | 10.4% | CRM can never be established by hiring evidence | SOURCE_COVERAGE_FIXABLE |
| **R3 — JS-rendered careers page** | 2 | 2.6% | vacancies exist and are invisible | ENGINEERING_FIXABLE |
| none — fully established | 2 | 2.6% | — | — |

Observed but not corpus-wide countable:

| class | instances | evidence |
|---|---|---|
| **D3 — wrong domain resolved** | 1 | `machineering.de` does not resolve (HTTP 000); the company is `machineering.com`. Discovery took the domain from a trade-press article. |
| **C1 — wrong classification** | 1 | EXPO.e `partner_tiers = confirmed` from the word "Platinum" on a page that says *"we don't use tiered services"*. |
| **C2 — possession vs experience** | 1 | Planhat confirmed from *"Salesforce Admin knowledge is a plus"* — caught in the mandate's audit and fixed. |
| **C4/C5** | 0 confirmed | Guarded and holdout-verified; no instance survived to production. |

**Split:** 45.5% public-data limit, 35.1% retrieval, 16.9% extraction. Roughly **half of all
failures are ours**.

---

## 13. False Negative Audit

From deep manual research (§26) on a stratified sample.

| expected fact | Radar output | failure stage | root cause | would this architecture ever find it? | fix |
|---|---|---|---|---|---|
| **myfactory** runs a two-tier programme (Vertriebspartner / Fachhandelspartner) with NFR licences, training, workshops and partner events | motion ✓, tiers `not_observed`, enablement `not_observed`, portal `not_observed` | E3 structure | the programme detail is in a **PDF** (`myfactory_Partnerprogramm_m.pdf`) and on `/de/unternehmen/partner-werden`, which the surface finder did not read | Not as built — PDFs are deliberately out of scope | bounded PDF read for pages linked from a partner page |
| **machineering** operates a sales-partner network across several countries | 0 pages read, motion `unknown` | D3 wrong entity | discovery took `machineering.de` from a trade-press article; the company is `machineering.com` | No — the domain is dead | verify the domain resolves before dossier build; prefer the domain the article links to |
| **Allison Transmission** has ~1,600 dealer/distributor locations and 6,200 certified technicians | motion ✓ (`distributor\|dealer\|oem_partner`), directory `not_observed` | E3 extraction | the count is prose on a Channel page, not a linked directory; the detector counts outbound links | Partially — a numeric-scale extractor would find it | extract stated network sizes as a lower bound |
| **EXPO.e** runs a Referral partner track | referral `not_observed` | E2 vocabulary | the page names "Carrier, Reseller, or Referral partner" as *partner types*, not as a workflow | Yes, with a partner-type extractor | treat enumerated partner types as evidence |
| **Apaleo** operates a certified app marketplace with a Tech Partnerships team | `under_observed`, motion `unknown` | E1 extraction | the store and certification live on `apaleo.dev` and `/apaleo-store`, off the main partner path | Possibly, via recovery on developer subdomains | add `*.dev` and `/store` to surface vocabulary |

**A pattern:** four of five misses are *extraction*, not retrieval. The page was reachable; the
detector was looking for different words or a different structure.

---

## 14. False Positive Audit

| account | machine output | what is actually true | error class |
|---|---|---|---|
| **expo-e.uk** | `partner_tiers = confirmed` | the page states *"we don't use tiered services — you are automatically a Platinum Partner"* | **generic partner language** — tier vocabulary matched a denial of tiers |
| **planhat.com** | Salesforce `confirmed_current` (during the mandate) | *"Salesforce Admin knowledge is a plus"* — candidate experience | **wrong CRM inference**, caught and fixed |
| **canonical.com** | Salesforce `confirmed_current` (during the mandate) | a careers **feed** concatenating every role; the sentence belonged to a different advert | **wrong CRM inference**, caught and fixed |
| **mews.com** | `plausible`, motion via `integration` programme + directory confirmed | an integration marketplace, not a reseller channel | **integration ecosystem** read as partner motion |

Not observed in this corpus: partner-tech vendor slipping through (4 were caught at discovery),
affiliate-only programmes, dead programmes, distributor participants reaching a dossier (6 were
caught at labelling).

**Publication-density bias remains structurally present**: a company that writes more about its
partner programme scores as more evidenced, regardless of what it actually operates.

---

## 15. Unknown Audit

The most important table in this report. Full file: `audit/out/unknown-audit.csv`.

| field | unknown | GOOD | BAD | UNTESTED |
|---|---|---|---|---|
| CRM | 50 | 17 (34%) | 17 (34%) | 16 (32%) |
| Partner motion | 30 | 12 (40%) | 12 (40%) | 6 (20%) |
| Deal registration | 71 | 10 (14%) | 31 (44%) | 30 (42%) |

Across the three fields that matter most:

- **GOOD unknown — 25.8%.** We asked properly; the information is not public.
- **BAD unknown — 39.7%.** It probably exists publicly and our retrieval failed.
- **UNTESTED unknown — 34.4%.** We stopped before asking properly.

> **74.2% of unknowns are ours to fix, not the web's fault.**

This reframes the whole audit. The Radar's low coverage is *mostly not* a public-data problem.
It is a retrieval-and-extraction problem wearing a public-data problem's clothing.

---

## 16. Source Yield

Full file: `audit/out/source-yield.csv`.

| source family | accounts touched | unique useful facts | false facts caught | verdict |
|---|---|---|---|---|
| **company website (base partner research)** | 77 | 47 motions | — | **the backbone** |
| **recovery (regional + subdomains)** | 27 | 27 accounts gained evidence | — | **high yield** |
| **search engine (discovery)** | 99 results | 42 new companies | — | **the entire new universe** |
| company careers pages (non-ATS) | 46 | 1 decisive CRM | 1 | modest but the only route for 60% |
| ATS boards | 9 | 2 decisive CRM | 0 | high precision, low reach |
| website fingerprints | 23 | **0 decisive** | 10 over-claims corrected | supporting only |
| historical / cached vacancies | 0 | **0** | 0 | **carrying no load** |
| careers index / feed | few | **0** by design | 1 | correctly cannot confirm |
| **search engine (targeted CRM)** | 4 | **0** | **3** | **negative value for establishing facts** |
| **LinkedIn as a distinct source** | 0 | **0** | 0 | **not run** |
| third-party directories | 1 | 1 candidate | 0 | marginal |

**Which sources make the Radar materially better?** Three: the company's own website, recovery
across regional domains and subdomains, and search *for discovery*. Everything else is either
supporting-only or currently contributing nothing.

---

## 17. Information Gain

| layer | incremental contribution |
|---|---|
| base website partner research | partner motion on **47 of 77 (61%)** |
| **+ recovery** (regional domains, programme subdomains) | added evidence on **27 accounts** — 14 existing, 13 new |
| + current jobs (ATS + careers pages) | **3** decisive CRM conclusions |
| + historical jobs | **0** |
| + LinkedIn / indexed search | **0** |
| + website fingerprints | 23 supporting-only, **0** decisive |

**Where engineering effort belongs:** recovery returned by far the most information per unit of
work and should be extended (PDFs, developer subdomains, deeper careers-subdomain fallback).
Historical-job handling and search-based CRM forensics both returned nothing and should be
frozen, not extended.

---

## 18. Introw-Critical Field Analysis

Commercial importance assigned from the CRO/AE perspective; coverage and reliability measured.

| field | importance | coverage | reliability | biggest source | biggest failure mode |
|---|---|---|---|---|---|
| Partner motion | **CRITICAL** | 61.0% | high — quoted and attributed | company partner page | R1 page not retrieved |
| Programme ownership | **CRITICAL** | 46.8% | medium — inferred from vocabulary | operator resolution | operator/participant ambiguity |
| Deal registration | **CRITICAL** | **7.8%** | high when found | partner page prose | sits behind partner login |
| Partner pipeline / attribution | **CRITICAL** | **0%** | — | none | never public |
| CRM (current) | **CRITICAL** | **3.9%** | **very high** — holdout 20/20, 0 false confirmations | company vacancy | companies don't name it |
| Partner tiers | HIGH VALUE | 10.4% | **low** — one confirmed false positive in 8 | partner page prose | tier vocabulary without tiers |
| Partner portal | HIGH VALUE | 20.8% | high — a login link is unambiguous | partner page | — |
| Partner enablement | HIGH VALUE | 13.0% | medium | partner page prose | PDF programme docs |
| Partner people | HIGH VALUE | **not attempted** | — | — | measured non-viable |
| Partner directory | USEFUL | 16.9% | medium — lower bound only | link density | prose counts not extracted |
| PRM in use | USEFUL | **0%** | — | DNS fingerprint | vendors serve from customer domains |
| Partner count | USEFUL | ~0% | unreliable | — | public-data limit |
| Programme activity / recency | USEFUL | **0%** | — | — | needs elapsed time |

**The damning row is deal registration**: CRITICAL importance, 7.8% coverage. And partner
pipeline and attribution — equally critical to Introw's pitch — are at zero.

---

## 19. Reliability Scorecard — no composite score

| dimension | status | supporting numbers |
|---|---|---|
| Discovery precision | **MEASURED** | 42 operators / 74 resolved companies = 57%; 76% on the earlier shadow run |
| Discovery recall | **UNMEASURED** | no denominator exists; 5/34 on an 11-query budget previously, not re-tested |
| Entity resolution | **PARTIALLY MEASURED** | 0 wrong-entity dossiers in 77; but 1 dead domain reached dossier build |
| Partner-motion coverage | **MEASURED** | 61.0% (47/77) |
| Partner-operations coverage | **MEASURED** | deal reg 7.8%, tiers 10.4%, pipeline 0%, attribution 0% |
| CRM coverage | **MEASURED** | 3.9% decisive, 35.1% any evidence |
| CRM precision | **MEASURED** | holdout 20/20, 0 false confirmations; 2 real false positives caught and fixed |
| Currentness | **PARTIALLY MEASURED** | all evidence <6 months or undated; no historical corpus to test decay against |
| People coverage | **UNMEASURED** | never attempted |
| PRM coverage | **MEASURED** | 0% |
| Evidence attribution | **MEASURED** | every claim carries quote, URL, date, proves/does-not-prove |
| Cross-industry robustness | **MEASURED** | manufacturing 28.6% motion vs cybersecurity/IoT 100% |
| Geographic robustness | **PARTIALLY MEASURED** | US/UK 100%, Italy 20%, Nordics 0% — but n<6 in most buckets |

---

## 20. Reliable Today

Stated with both precision and coverage, as required.

1. **"This company operates a partner motion, and here is the quote."** 61% coverage, high
   precision, every claim attributed to a URL. Reliable when the partner page is on a domain we
   can reach.
2. **"This company's programme is of type X"** (reseller / dealer / installer / MSP / solution
   partner). 59.7% coverage, multilingual, holdout-tested.
3. **"When a company names its CRM in a live advert, we will read it correctly."** Holdout 20/20,
   zero false confirmations, zero over-current classifications. **This is precision, not
   coverage — it applies to the 3.9% of accounts where it fires.**
4. **"This company is a partner-tech vendor / competitor."** Caught 4 at discovery, 0 reached a
   dossier; the maintained list is asserted reference data.
5. **"A partner surface exists on a regional domain or subdomain the main site does not link."**
   Recovery added evidence on 27 of 77 accounts.
6. **"We did not establish this, and here is exactly what we consulted."** Every unknown carries
   its coverage record.

## 21. Not Reliable Today

1. **Current CRM.** 3.9%. Do not build a workflow that assumes it.
2. **Deal registration, lead sharing, partner pipeline, attribution, incentives.** 7.8% / 0% /
   0% / 0% / not attempted. The operational layer is effectively invisible.
3. **Partner tiers.** 10.4% coverage and a confirmed false positive rate of 1 in 8 in the
   audited sample.
4. **Partner team size, partner headcount, partner counts.** Never attempted or ~0%.
5. **Programme activity or recency.** No temporal evidence exists yet.
6. **Manufacturing and Nordic/Italian companies.** 28.6% / 0% / 20% motion coverage.
7. **Market completeness.** Discovery recall is unmeasured; nothing here supports a claim about
   how much of any market has been seen.

## 22. Almost Never Found — bottom 10 by coverage

| field | coverage | why missing | fixable? |
|---|---|---|---|
| Lead sharing | 0% | vocabulary sits inside programme prose we mostly don't reach | ENGINEERING (E2) |
| Partner pipeline | 0% | behind the partner login by design | PUBLIC-DATA LIMIT |
| Partner incentives | not attempted | no detector written | ENGINEERING |
| Partner attribution | not attempted | no detector written | ENGINEERING |
| CRM historical | 0% | no source serving archived vacancies is wired in | SOURCE COVERAGE |
| Partner people | not attempted | public person discovery measured at 2/18 | PAID DATA |
| PRM in use | 0% | vendors serve portals from the customer's own domain | PUBLIC-DATA LIMIT |
| Referral | 1.3% | named as a partner *type*, not as a workflow | ENGINEERING (E2) |
| Partner onboarding | 2.6% | described on pages behind the application step | PUBLIC-DATA LIMIT |
| CRM decisive | 2.6% | companies do not name their CRM in adverts | PUBLIC-DATA LIMIT |

## 23. What Fails Most Often

**By frequency:**

1. P1 information not public — 18 (23.4%)
2. R1 relevant page not retrieved — 17 (22.1%)
3. P4 source authority too weak — 17 (22.1%)
4. E1 page found, evidence not extracted — 13 (16.9%)
5. R1b no careers surface reachable — 8 (10.4%)
6. R3 JS-rendered careers page — 2 (2.6%)
7. C1 wrong classification (tiers) — 1 confirmed
8. D3 wrong domain resolved — 1
9. C2 possession vs experience — 1 (fixed in-mandate)
10. C5 internal use vs customer integration — 0 surviving

**By commercial impact:**

1. **C2/C4 false CRM confirmation** — rare but catastrophic: a seller opens a call with a wrong
   system claim. Two occurred and were caught only by manual audit.
2. **C1 tier false positive** — a dossier asserting tiers on a page that denies them.
3. **D3 wrong domain** — an entire account researched against a dead domain.
4. **R1 page not retrieved** — an operator recorded as having no motion.
5. **E1 evidence not extracted** — the highest-volume silent failure; a page is read and reports
   nothing, indistinguishable from a page that says nothing.
6. **C3 operator vs participant** — guarded, but a well-written participant page could pass.
7. **Publication-density bias** — verbose companies systematically outscore operational ones.
8. **P4 supporting-only CRM** — invites a seller to assume a system that was never established.
9. **P1 genuine absence** — costly in volume, but honest.
10. **R3 JS careers** — small today, will grow as more sites render client-side.

## 24. Reliability by Account

`audit/out/account-completeness.csv` — one profile per account, no score. Example rows:

```
aircall.io       motion ESTABLISHED · ownership ESTABLISHED · CRM ESTABLISHED (conflict)
                 people NOT_ATTEMPTED · PRM UNKNOWN · currentness PARTIAL
                 → SUFFICIENT_FOR_REVIEW

korewireless.com motion ESTABLISHED · ownership ESTABLISHED · CRM PARTIAL
                 people NOT_ATTEMPTED · PRM UNKNOWN · currentness UNKNOWN
                 → SUFFICIENT_FOR_REVIEW

machineering.de  motion UNKNOWN · ownership UNKNOWN · CRM UNKNOWN
                 people NOT_ATTEMPTED · PRM UNKNOWN · currentness UNKNOWN
                 → UNDER_OBSERVED
```

Corpus totals: **45 sufficient for review (58.4%)**, 10 partial (13.0%), 22 under-observed
(28.6%).

---

## 25. "Would I Trust This?" Red Team

Four reviewers, stratified sample (aircall.io, korewireless.com, expo-e.uk, machineering.de).

**Reviewer A — Introw AE.**
*Trusts:* the partner-motion quotes, because each is a sentence with a link. Aircall's Salesforce
line is worth opening a call with.
*Needs verified:* the tier claim on EXPO.e — "I'd check that before I said it out loud."
*Missing:* who owns partnerships, how many partners, whether the programme is active.
*Could decide?* Yes for aircall and korewireless; no for machineering.
*Would search next:* LinkedIn for a Head of Partnerships, then the partner portal login page.

**Reviewer B — OSINT researcher.**
*Trusts:* first-party sourcing throughout — no claim rests on a third-party page.
*Needs verified:* nothing, given the URLs are there.
*Missing:* the PDF layer. "Half these companies put the real programme in a PDF and you're not
reading them."
*Notes:* machineering.de not resolving should have been caught before a dossier existed.
*Would search next:* `site:domain filetype:pdf partner`.

**Reviewer C — Data quality auditor.**
*Trusts:* the CRM layer's precision — the holdout and the two caught false positives are more
convincing than the coverage number.
*Distrusts:* `not_observed`. "It reads like a finding and it usually means we didn't look
properly." The unknown audit proves it: 74% of unknowns are retrieval failures.
*Missing:* per-field confidence. Motion at 61% and tiers at 10.4% render identically.
*Would want:* the tier detector suspended until it is re-measured.

**Reviewer D — Skeptical RevOps lead.**
*Trusts:* very little as a system of record. "Three CRMs in seventy-seven accounts is not a
data source, it's an anecdote."
*Values:* the honesty. "It tells me what it didn't find, which is more than most tools do."
*Missing:* everything operational — pipeline, attribution, incentives.
*Verdict:* "This is a research assistant. Anyone who calls it a prospecting engine hasn't read
the coverage table."

**Where they agree:** the evidence that exists is trustworthy and well-attributed; the *volume*
is too low to run a process on; `not_observed` is dangerously reassuring.
**Where they disagree:** A would act on a plausible-fit dossier today; D would not act on any of
it without manual verification.

---

## 26. Manual Research Gap

Deep manual investigation on six accounts, performed **after** the Radar finished. Nothing was
tuned as a result.

| account | Radar found | manual research found | gap |
|---|---|---|---|
| **myfactory.com** | motion, reseller + distributor | two partner tracks (Vertriebspartner / Fachhandelspartner), NFR licences, training, workshops, partner events, a full programme **PDF**, named partners | tiers, enablement, portal — **all missed** |
| **apaleo.com** | `under_observed`, no motion | Apaleo Store marketplace, formal app **certification** process, pre-certification call, Tech Partnerships team | entire ecosystem missed; correct read is integration-only, i.e. *likely not fit* — more useful than "unknown" |
| **machineering.de** | 0 pages, nothing | company is `machineering.com`; sales-partner network across several countries, partner programme covered in trade press | **wrong domain** — everything missed |
| **allisontransmission.com** | motion (distributor/dealer/OEM), no CRM | ~1,600 dealer and distributor locations, 6,200 certified technicians; **still no public CRM** | network scale missed; **CRM absence confirmed genuine** |
| **expo-e.uk** | motion, portal ✓, tiers ✓ | 600+ channel partners, deals £5k–£1M, Carrier/Reseller/**Referral** tracks, partner hub login; page explicitly says **no tiers** | referral missed; **tiers is a false positive** |
| **korewireless.com** | motion, HubSpot *supporting* (fingerprint) | search surfaces a "administer HubSpot" role that belongs to **Kore.ai**, a different company | **Radar correctly avoided the trap** |

**How much public information is the Radar leaving on the table?** On this sample, a great deal
of *partner-operations* detail — tiers, enablement, partner types, network scale — was publicly
available and not captured. But **CRM absence was confirmed genuine** where the Radar said so.

The gap is concentrated in one place: **partner programme detail published as prose or PDF on
pages adjacent to the ones we read.** That is an extraction and surface-coverage problem, and it
is fixable.

---

## 27. Three Types of Limit

**A — ENGINEERING LIMIT (likely fixable)**
- R1 page not retrieved (22.1%) — deeper surface discovery
- E1 evidence not extracted (16.9%) — the largest silent failure
- PDF programme documents — never read
- Developer/store subdomains (`apaleo.dev`) — outside surface vocabulary
- Partner **types** not treated as workflow evidence
- Network scale stated in prose, not extracted
- Dead-domain check before dossier build
- Tier detector precision
- JS-rendered careers pages (2.6% today, structurally growing)

**B — DATA-ACCESS LIMIT (another source could help)**
- Archived/historical vacancies — no source currently serves them
- Partner people — public discovery measured at 2/18
- Technographics — a paid vendor claims a CRM for Allison where public sources have none

**C — FUNDAMENTAL PUBLIC-DATA LIMIT**
- Deal registration mechanics, partner pipeline, attribution — behind the partner login by design
- Partner counts and programme activity — not published
- **Current CRM for most companies** — 45 of 54 companies whose adverts we read never named one
- Internal programme ownership and headcount

---

## 28. Paid Data Question

**Would licensed data materially improve this Radar?** For two fields, clearly yes. For the
rest, no.

| category | verdict | why |
|---|---|---|
| **People** | **YES — the strongest case** | `partner_people_state` is not attempted on all 77 accounts. "Is there a Head of Partnerships?" is a §31 promotion signal we cannot answer at all. A licensed people source turns a 0%-coverage CRITICAL-adjacent field into a usable one. |
| **Technographics** | **QUALIFIED YES** | CRM decisive is 3.9%, and 34% of CRM unknowns are GOOD unknowns — genuinely unpublished. Only a vendor with non-public telemetry closes that. **But** their precision is unmeasured, and this project's whole discipline is that unverified confidence is worse than unknown. Buy only with the right to see the evidence per record. |
| Historical jobs | **NO, not yet** | The classification logic works and has nothing to classify. Wire a free archived-vacancy source first and measure before paying. |
| Company metadata | NO | Country and sector are missing for the existing 35 because we never recorded them — a data-model gap, not a data-availability one. |
| Current jobs | NO | 71% reach already; the gap is JS rendering, which is an engineering fix. |
| CRM (as a purchased field) | NO | Buying "company X uses Salesforce" without the sentence behind it reintroduces exactly the over-claim this mandate spent its effort removing. |

---

## 29. Output Files

All derived from the run; no hand-written numbers where machine derivation was possible.

| file | contents |
|---|---|
| `audit/out/introw-radar-reliability-audit.json` | 77 accounts × 54 fields |
| `audit/out/introw-radar-reliability-audit.csv` | same, flat |
| `audit/out/field-coverage.csv` | §3 matrix |
| `audit/out/failure-analysis.csv` | §11–12 taxonomy with fixability |
| `audit/out/source-yield.csv` | §16 per-source yield |
| `audit/out/crm-forensics.csv` | per-account CRM funnel detail |
| `audit/out/account-completeness.csv` | §24 profiles |
| `audit/out/unknown-audit.csv` | §15 good/bad/untested |
| `audit/out/unknown-audit-detail.json` | per-account unknown classification |

---

## 30. Final Executive Output

1. **Sufficient for commercial review?** **58.4%** (45/77).
2. **Under-observed?** **28.6%** (22/77); 13.0% partial.
3. **Best-covered Introw facts:** partner motion 61.0% · programme type 59.7% · programme
   ownership 46.8% · CRM any evidence 35.1% · partner portal 20.8%.
4. **Worst-covered important facts:** partner pipeline 0% · lead sharing 0% · partner
   attribution 0% (not attempted) · PRM 0% · deal registration 7.8%.
5. **Defensible current CRM:** **3.9%** (3/77).
6. **From random/non-partner vacancies:** **5 of 5 decisive observations — 100%.** Partnership
   titles produced zero.
7. **From historical vacancies:** **0%.**
8. **Uniquely from LinkedIn/indexed evidence:** **0%.**
9. **Biggest discovery failure:** the web's SEO layer — 25 of 99 results were trade press,
   registries, listicles and legal references, not companies. Plus one dead domain reaching
   dossier build.
10. **Biggest retrieval failure:** R1, 22.1% — the partner page exists and we did not reach it;
    plus 23.4% of accounts with no reachable careers surface at all.
11. **Biggest extraction/classification failure:** E1, 16.9% — a partner page was read and
    yielded nothing. It is silent: indistinguishable from a page that genuinely says nothing.
12. **Biggest genuine public-data limitation:** companies do not name their CRM. 45 of 54
    companies whose adverts we read never mentioned one.
13. **Source creating the most unique useful evidence:** recovery across regional domains and
    programme subdomains — 27 of 77 accounts.
14. **Source consuming effort and adding little:** targeted CRM search (0 facts, 3 false
    positives avoided) and historical-vacancy handling (0 facts). Website fingerprints produce
    volume but zero decisive conclusions.
15. **Most reliable where:** English-language US/UK software, cybersecurity and IoT companies
    with a live ATS board — 100% motion coverage in those buckets.
16. **Least reliable where:** manufacturing (28.6% motion), Nordics (0%), Italy (20%), and any
    company serving careers or programme content through JavaScript or PDF.
17. **What an AE must still research manually:** who owns partnerships; whether the programme is
    active; partner counts; deal-registration mechanics; the CRM for 96% of accounts; and any
    tier claim.
18. **What engineering could realistically fix next**, in measured-value order: extraction on
    pages already retrieved (E1, 16.9%); deeper partner-surface discovery (R1, 22.1%); bounded
    PDF reading; partner *types* as workflow evidence; a dead-domain check; tier-detector
    precision.
19. **Probably requires licensed data:** partner people (0% and CRITICAL-adjacent), and CRM for
    the 34% of unknowns that are genuinely unpublished.
20. **Probably unsolvable from public data:** deal-registration mechanics, partner pipeline,
    attribution, partner counts, programme activity, internal ownership.
21. **What an AE should trust tomorrow:** that a partner motion exists and what type it is, when
    a quote and URL are shown; that a named CRM in a quoted live advert is real; that a
    competitor flag is real; that "unknown" is honest.
22. **What they should NOT trust:** any `not_observed` field as evidence of absence; partner
    tiers; that CRM unknown means no CRM; that the absence of a discovered company means it does
    not exist.
23. **Verdicts by role:**

| role | verdict | basis |
|---|---|---|
| **Discovery engine** | **YES, with human triage** | 42 real operators from 12 queries; 57% precision on resolved companies; recall unmeasured |
| **Research assistant** | **YES — this is what it is** | 58.4% of accounts reach a reviewable dossier with attributed evidence, and every gap is stated |
| **Qualification assistant** | **NO** | the fields that qualify an Introw prospect — deal registration, pipeline, attribution, CRM — are at 7.8%, 0%, 0% and 3.9% |
| **Autonomous prospecting engine** | **NO** | 74.2% of unknowns are our own retrieval failures; nothing should run unattended on that base |

---

### Closing observation

The single most actionable finding is not a coverage number. It is that **74.2% of what the
Radar does not know is not the web's fault.** A quarter of the gap is a genuine public-data
limit and would survive any amount of engineering. Three quarters is pages we did not reach,
PDFs we did not open, and prose we read without extracting.

That is the opposite of the comfortable conclusion, and it is the one the measurements support.
