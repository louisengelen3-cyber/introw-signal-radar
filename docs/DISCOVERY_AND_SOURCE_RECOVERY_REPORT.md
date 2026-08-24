# Discovery & Cross-Industry Source Recovery

**Mandate 6 · measurement and capability build · no production change, no deployment**
Run date 2026-08-24 · benchmarks frozen before any result was seen

---

## 01 Executive Verdict

**SEGMENTED DISCOVERY GO.**

Independent discovery works. It is not a SaaS-only capability, and it is not a
physical-sector failure. It is **segmented by vocabulary specificity, not by sector**, and
that distinction is the single most useful finding in this report.

Three results carry the verdict.

**Discovery generates real, independent candidates.** Eleven generic multilingual queries —
none of which contains a company name — returned 42 distinct companies evidencing a partner
motion they operate themselves, 37 of which were not on any list held before the query ran.
Two additional queries in Swedish and Italian, languages absent from every vocabulary file in
this codebase, returned 75% operator precision. The mechanism generalises beyond what it was
built for.

**Source recovery materially closes the observability gap.** Adding multi-domain resolution,
sitemap-first surface discovery and trade vocabulary to the existing pipeline lifts
partner-motion identification on physical companies from **39% to 61%**, and on software from
**77% to 83%**. The software−physical gap narrows from **38 points to 22**. Directory
detection on physical companies rises from **13% to 44%**. Of physical companies with motion
evidence in the combined configuration, **36% depend on recovery** to have any evidence at
all, against 7% for software: recovery pays off precisely where the bias was.

**The pessimistic conclusion the mandate invited is refuted by measurement.** §64 offers:
*"Physical-sector partner networks are publicly discoverable through directories, but their
operational model remains too private for automatic dossier construction."* The first clause
holds. The second does not. Of physical companies where recovery found any motion evidence,
**89% carry business-facing programme evidence** — recruitment, tiering, certification,
portal, lead routing — against **95%** for software. Only 3 physical companies in 54 are
locator-only. Physical companies are not more private than software companies about how they
run their channel. They are **harder to find**, not more secretive.

The bottleneck is retrieval, not disclosure. That is a solvable engineering problem, and it
is a different problem from the one the previous audit implied.

What holds the verdict back from FULL DISCOVERY GO is coverage, honestly stated: **33% of
physical companies still yield no partner surface at all**, per-query operator precision
ranges from 0% to 89% depending on phrasing, and recall against the frozen 34-company
discovery benchmark was 5/34 with an eleven-query budget. Discovery is a real capability with
known-good segments and known-bad ones. It is not yet a universal crawler, and this report
does not claim it is.

---

## 02 Current Architecture Gap

**Production has no discovery.** It never had any.

Every prior phase of this project consumed a hand-supplied domain list. The corpus was
assembled by a human, passed to the pipeline, and researched. The pipeline's job began at
`resolveDomains(domain)` and ended at a dossier. Nothing in `src/` chose which company to
look at.

This matters for how the previous mandate's finding should be read. The Cross-Industry
Discovery Bias Audit concluded MATERIAL SaaS BIAS, and the corpus behind that conclusion was
83% software and 0% industrial. But a system with no discovery cannot have discovery bias.
The corpus composition was a **sampling** property of the human list, not a property of the
Radar. The measured bias was real, but it was an **observability** bias — the pipeline saw
software companies more clearly — and the two were not separable until discovery existed to
be measured on its own.

This mandate builds discovery for the first time, which is what makes the separation
possible. Question A (can we find companies?) and Question B (can we read them once found?)
are now measured independently, against different frozen benchmarks, and they give different
answers.

---

## 03 Discovery Benchmark

`discovery/benchmark.v1.json` · sha256 `0596cd07f3cf8462` · frozen before any query was run.

34 companies across 10 sectors and 14 countries, each a known channel operator. The frozen
rule governs what counts as a miss:

> A miss is only a discovery failure if the company's partner motion is genuinely
> discoverable from a public seed. Customer status alone does not make a company a required
> find.

Sector distribution: cybersecurity 7, saas 6, iot 5, av_hardware 4, manufacturing 4,
ecommerce 2, industrial 2, solar 2, fintech 1, hospitality 1.

**Disclosed dependency.** Many of these 34 also appear in the 106-company cross-industry
benchmark used for Question B. That overlap does not compromise discovery independence,
because no query ever contained a company name and no candidate was scored against a held
list before classification — but the two benchmarks are not statistically independent
samples, and recall figures here should not be read as though they were.

---

## 04 Cross-Industry Benchmark

`audit/cross-industry.v1.json` · sha256 `ecc330e5abefa54d` · 106 companies, 13 cohorts, 23
countries, 52 software / 54 physical.

Frozen baseline (`audit/baseline/cross-industry.BASELINE.json`), production as it stands:

| | software (n=52) | physical (n=54) |
|---|---|---|
| partner motion identified | 77% | 39% |
| directory detected | 13% | 13% |
| companies with zero pages read | 4 | 8 |

Every before/after number in this report reconstructs these baseline figures from the frozen
file as an integrity check before comparing anything. The reconstruction reproduces 77 / 13 /
4 and 39 / 13 / 8 exactly; where it had not, the comparison would have been discarded.

**Limitation carried forward.** This benchmark is *channel-plausible by construction*, not a
random sample of each industry. It measures observability **given** a plausible channel. It
does not measure how common channel motions are in any sector, and no base-rate claim is made
from it anywhere in this report.

---

## 05 Discovery Source Catalogue

The mandate lists seven source families (§5 A–G). Two were implemented and measured; the
rest were scoped and deliberately not run within this mandate's bounds.

| family | status | why |
|---|---|---|
| **E. Search / web pattern** | **implemented, measured** | highest yield per unit of effort; language is the lever |
| **F. Programme hosting / portal infrastructure** | **implemented, measured — negative** | returned 0 candidates; see §06 |
| A. Partner directories | adapter written, not harvested | harvesting proves *participation*, not operation — see §25 |
| B. Distributor / wholesaler ecosystems | adapter written, seed-only | inversion yields brand names needing separate operator resolution |
| C. Trade / industry directories | not run | membership ≠ channel motion |
| D. Event ecosystems | not run | exhibitor lists are a proxy for marketing spend, not channel structure |
| G. Company-owned structured sources | folded into Phase B | sitemaps are the primary surface-discovery mechanism |

Each implemented adapter in `src/discovery/adapters.ts` carries a written source contract
naming what it CAN discover, what it DOES NOT prove, its segment and geography bias, its
identity risk, and its precision, recall, stability, cost and scalability characteristics.

---

## 06 Discovery Performance by Source

### E. Search / web pattern — works

Per-query operator precision, construction slice (11 queries, 85 candidates):

| lang | segment | operators | total | precision | query |
|---|---|---|---|---|---|
| fr | manufacturing | 8 | 9 | **89%** | `"devenir revendeur" programme partenaire fabricant` |
| en | it_security | 8 | 9 | **89%** | `"MSP partner program" "deal registration" apply` |
| de | manufacturing | 7 | 8 | **88%** | `"Fachpartner werden" Hersteller Partnerprogramm` |
| en | industrial | 5 | 7 | 71% | `"system integrator partner program" industrial automation` |
| nl | manufacturing | 4 | 8 | 50% | `"dealer worden" verdeler partnerprogramma fabrikant` |
| en | av_hardware | 3 | 7 | 43% | `"authorized reseller" program AV integrator display` |
| nl | manufacturing | 2 | 7 | 29% | `"installateur worden" partnerprogramma fabrikant` |
| en | manufacturing | 2 | 7 | 29% | `"certified installer" program apply manufacturer` |
| en | software | 2 | 8 | 25% | `"become a partner" "deal registration" partner program software` |
| en | manufacturing | 2 | 9 | 22% | `"become an authorized dealer" application form manufacturer` |
| de | manufacturing | 0 | 6 | **0%** | `"Vertriebspartner werden" Händlerprogramm Hersteller` |

Overall 43/85 = **51%**.

**The governing variable is not language or sector. It is whether the phrase is one only an
operator would publish about itself.** `"Fachpartner werden"` is what a manufacturer writes on
its own recruitment page: 88%. `"Vertriebspartner werden"` is what consultants and trade
press write *about* manufacturers: 0%. Same language, same sector, same intent, 88-point
spread. English `"become an authorized dealer"` scores 22% because the English-language web
has a large SEO content industry occupying exactly that phrase — the results were a Jotform
template, a marketing glossary, a Chron how-to, a legal dictionary and a Texas securities
regulator using a different sense of "dealer" entirely.

### F. Programme hosting / portal infrastructure — honest negative

**0 candidates.** The mechanism was to find companies by their PRM tenancy — subdomains
served by Impartner, PartnerStack, Allbound and similar. Certificate transparency indexes
certificates by the domain *inside* the certificate, so querying `impartner.com` returns
Impartner's own 35 subdomains and nothing about its customers. The inversion the mechanism
required does not exist in the source. Recorded in `discovery/out/MECHANISM_NOTES.md` and not
retried under a different name.

---

## 07 Discovery Performance by Sector

Segment mix of the 55 operator hits across all 13 queries:

| segment | hits | share |
|---|---|---|
| manufacturing | 25 | 45% |
| mixed (holdout) | 12 | 22% |
| it_security | 8 | 15% |
| industrial | 5 | 9% |
| av_hardware | 3 | 5% |
| software | 2 | 4% |

**Software is the smallest segment in discovery output, not the largest.** This inverts the
expectation the previous audit would set. The reason is §29: the English channel-vocabulary
query returns Introw's own competitors rather than its prospects.

Recall against the frozen 34, eleven-query budget:

| sector | recall | | sector | recall |
|---|---|---|---|---|
| cybersecurity | **4/7** | | av_hardware | 0/4 |
| manufacturing | **1/4** | | ecommerce | 0/2 |
| iot | 0/5 | | industrial | 0/2 |
| saas | 0/6 | | solar | 0/2 |
| fintech | 0/1 | | hospitality | 0/1 |

**Total 5/34 = 15%.** This is a budget artifact, not a ceiling. Eleven queries cannot address
34 companies across 10 sectors; each query returns roughly 8 results and most sectors received
one query or none. The number that carries information is not 15% — it is that the two
sectors that received well-formed, operator-specific queries returned 4/7 and 1/4, while
sectors that received no query returned 0. Reported because the mandate requires recall by
sector, and reported with its cause rather than as a headline.

---

## 08 Discovery Performance by Geography

Registrable TLD of operator hits — a proxy for market, not incorporation:

| geography | hits | share |
|---|---|---|
| global/US (.com/.io/.dev) | 36 | 65% |
| SE | 4 | 7% |
| EU | 3 | 5% |
| FR | 3 | 5% |
| DE, NL, BE, IT | 2 each | 4% each |

Recall by benchmark country: CH 1/1, RO 1/1, UK 1/1, NL 1/5, US 1/6, and 0 for AT (0/3), BE
(0/5), DE (0/6), CN, FR, LT, SE, SK, TW.

The `.com` concentration overstates US presence: Husqvarna, Canon, Fristads and Schneider all
appear under generic TLDs. Non-English queries reliably surface companies that
English queries do not — the German query found sonnen, Viessmann, E3/DC, alpha innotec and
NIBE, none of which appeared in any English result.

---

## 09 Entity Resolution

Every candidate resolved to a registrable domain directly from its result URL: **100%
resolution, 1% duplicate rate** (1 repeat in 101 candidates — Schneider Electric's `se.com`,
returned by both the English industrial query and the French reseller query, correctly
collapsed to one company).

The harder entity problem is in source recovery, not discovery: deciding whether
`vaillant.de` and `vaillant.com` are the same company. `src/recovery/domains.ts` ranks
ownership evidence rather than guessing:

| basis | confidence | meaning |
|---|---|---|
| `hreflang` | high | the site itself declares the alternate |
| `same_brand_link` | medium | canonical site links to it under the same brand |
| `probed_cctld` | low | shared brand token only — a guess, never asserted |

Probing is gated to domains that genuinely fail to resolve (`status === 0 || status === 404`,
never `blocked`), because an earlier version invented `contentful.be` from a blocked response.
`bata.com` / `bata.de` — different companies sharing a token — is a standing regression test
asserting that a probed ccTLD can never carry high confidence.

---

## 10 Source Recovery Before/After

Same 106 companies, same detectors, same scoring. The only variable is which pages reached
the detectors.

| | software before | software after | physical before | physical after |
|---|---|---|---|---|
| partner motion identified | 77% | **83%** | 39% | **61%** |
| directory detected | 13% | **60%** | 13% | **44%** |
| companies with motion evidence | 40 | 43 | 21 | 33 |

**Software−physical motion gap: 38 points → 22 points.**

### Recovery is complementary, not superior

Recovery run *alone* scores software 71% and physical 50% — worse than production on software.
It regresses 12 companies that production identifies, because sitemap-first discovery and
production's path probing find different page sets. Eaton is the clearest case: recovery found
9 surfaces and read 8, none of which was the distributor page production's path probe reaches
directly.

| | production only | recovery only | both | neither |
|---|---|---|---|---|
| software (43 with motion) | 6 | 3 | 34 | 9 |
| physical (33 with motion) | 6 | 12 | 15 | 21 |

**36% of physical motion evidence depends on recovery; 7% of software does.** The union
regresses nothing. **The union is the only configuration that could ever ship**, and this
report recommends recovery exclusively as an added source, never as a replacement.

---

## 11 Multi-Domain Recovery

Multi-domain resolution engaged on **54 of 106 companies**. Where a company publishes
hreflang alternates, its channel programme is frequently on a market domain rather than the
canonical one.

Verified recoveries, each matching what manual research independently confirmed:

| company | canonical | evidence found on |
|---|---|---|
| Vaillant | vaillant.com | `vaillant.de/kontakt/fachpartner-finden/` |
| Somfy | somfy.com | `somfy.de/haendlersuche` |
| SMA | sma.de | `sma.de/partner/lieferanten` + `sma.com.tr/authorized-distributors` |
| Quatt | quatt.io | `quatt.io/zakelijk/partner-programma` |
| Fronius | fronius.com | `fronius.com/de/kontakt/partner-finden/vertriebspartner-finden` |

Selection is bounded to 3 domains per company: channel subdomains first (`partners.`, `pro.`,
`dealer.`), then major markets in preference order. An earlier version ranked on
`language === 'en'` alone and selected Somfy's Egyptian and Chinese English locales out of 45
alternates — technically English, commercially useless.

---

## 12 Regional/Locale Recovery

Locale handling required three fixes, each found by inspecting output rather than by test:

**Near-duplicate collapse.** Vaillant's installer locator generates a page per city nested
under a page per region. Counting these as distinct surfaces reported 6 surfaces where one
exists. `surfaceKey()` collapses them with a `while` loop, not a single path pop — a single
pop leaves the region tier intact.

**Locale preference.** English copies are sorted first so extraction runs against text the
pipeline reads best, without discarding the non-English original that carried the evidence.

**Named accented entities.** `decodeEntities` handled `&nbsp;` and numeric references but no
named accented entity, so every German and French quote carried raw markup:
`"Somfy H&auml;ndlersuche ... zertifizierte Fachbetriebe f&uuml;r"`. Extended to cover
`uml/acute/grave/circ/tilde/slash/cedil/szlig/aelig` plus `euro/pound/deg`. This is the one
change in this mandate that touches a file production shares — see §33.

---

## 13 Partner Directory Results

Directory detection, production → union: **software 13% → 60%, physical 13% → 44%.**

Typed directories found across the 106 (mandate §17 taxonomy):

| type | n | | type | n |
|---|---|---|---|---|
| solution_partner_directory | 12 | | affiliate_directory | 4 |
| msp_directory | 8 | | distributor_directory | 3 |
| dealer_locator | 8 | | reseller_directory | 2 |
| installer_locator | 6 | | service_network | 1 |

The typing matters more than the count. `installer_locator` and `dealer_locator` are
**consumer-facing**: they prove a network exists. `solution_partner_directory` and
`msp_directory` sit beside recruitment surfaces and evidence a managed programme. Collapsing
these into one "has directory" boolean would let network existence masquerade as operational
ownership — the distinction §25 measures.

Directory counts are reported as a **lower bound** (`directory.lowerBound`), never as a
partner count, and never used as a gate.

---

## 14 Trade Vocabulary Results

`src/recovery/trade.ts` covers 15 motion patterns and 17 surface patterns across German,
Dutch, French and English.

**8 of 106 companies have motion evidence that exists only because of trade vocabulary** —
6 physical, 2 software. Without it they are invisible regardless of how many pages are read.

Two gaps found by inspecting recovered pages that scanned clean, both fixed as general
locale rules rather than company-specific patterns:

**English trade terms were missing entirely.** The first pass covered DE/NL/FR and assumed
English was already handled by SaaS vocabulary. It was not: Niko's `"Find your Niko
distributor"` matched nothing. Added English `distributor`, `dealer`, `installer` and
`solution_partner` patterns including `where to buy`.

**Quatt publishes its motion in plain commercial Dutch.** Its partner page reads
*"Introduceer klanten, verdien €400 per installatie"* and *"Meld je direct aan"* — introduce
customers, earn €400 per installation, sign up now. This is lead routing with a published
commission and an intake step, and it contains **no partner vocabulary in any language**.
Requiring the word "partner" would lose the clearest lead-sharing evidence in the entire
physical cohort. This is exactly the §22 Quatt-type case, and it is now a regression test.

Both fixes are class-level rules. No company name appears anywhere in `src/recovery/` or
`src/discovery/`.

---

## 15 Compound Language Results

German and Dutch compound the noun, so `\b`-anchored English matching fails on the most
common forms. Every stem is matched as `\p{L}*stem\p{L}*` under the `u` flag:

`Fachpartner` · `Fachpartnersuche` · `Vertriebspartner` · `Vertriebspartnerprogramm` ·
`Händlersuche` · `Installateurssuche` · `Servicepartner`

Two compound-specific defects were found and fixed. `\bdynamics\b` matched "market dynamics"
in job text (carried over from the prior mandate; now requires a qualifier). And motions
fired three times per page because `Installateur` is identical in German, Dutch and French —
the dedup key was `kind|lang` and became `kind`, because three language matches on one word
are one fact, not three.

---

## 16 JS/PDF Results

**Measured, then deliberately not built.**

The mandate asks for *bounded* recovery, so the scoping measurement came before the
implementation. Where companies are actually lost after Phase A+B+D:

| | no surface found | surface found, unreadable | pages read, no motion | motion |
|---|---|---|---|---|
| software (52) | 5 (10%) | **2 (4%)** | 8 (15%) | 37 (71%) |
| physical (54) | 18 (33%) | **1 (2%)** | 8 (15%) | 27 (50%) |

**JS rendering could help at most 3 companies in 106 (3%).** PDF surfaces across all 106: **2**.

Building a headless-browser stage would add a heavyweight dependency, a per-company latency
cost and a large new failure surface to address 3% of the corpus. The bounded recommendation
is **do not build it**. The dominant loss is the 33% of physical companies where no surface is
found at all — a retrieval problem that more rendering cannot touch.

---

## 17 Physical/Industrial Deep Dive

Physical motion identification: **39% → 61%**. Directory detection: **13% → 44%**.

Twelve physical companies gained motion evidence they did not previously have:

| company | directory type | evidence |
|---|---|---|
| fronius.com | installer_locator | dealer, service_partner, reseller, distributor, installer, tiering, partner_locator |
| somfy.com | installer_locator | installer, dealer, partner_locator, certification |
| nibe.eu | installer_locator | installer, reseller, partner_locator |
| phoenixcontact.com | distributor_directory | system_integrator, distributor, solution_partner |
| vaillant.com | installer_locator | installer |
| enphase.com | installer_locator | installer |
| festo.com | dealer_locator | dealer, certification |
| konicaminolta.eu | dealer_locator | dealer, tiering |
| quatt.io | — | lead_routing, tiering, partner_recruitment |
| nedap.com | — | reseller |
| victronenergy.com | — | distributor |
| zehnder-systems.com | — | partner_portal |

**The residual is real: 21 of 54 physical companies (39%) still have no motion evidence.**
18 of those yield no partner surface at all. Nine more were reached and read but said nothing
detectable — Wago, Zebra and Sensative each had 10 pages read with no motion found, which is
a surface-precision problem rather than a vocabulary problem: the surface finder located ten
partner-ish URLs that were not programme pages.

---

## 18 Software/SaaS Deep Dive

Software motion identification: **77% → 83%**. Directory detection: **13% → 60%**.

The directory gain is the larger story. Production was detecting almost no partner
directories on software companies either; sitemap-first discovery finds
`solution_partner_directory` (12) and `msp_directory` (8) consistently.

Only 3 software companies depend on recovery for their evidence (7% of the software union),
against 12 physical (36%). Software was already well observed, and recovery adds
proportionally little — which is the correct and expected result.

Nine software companies still have no motion evidence, including Apaleo and SiteMinder, where
10 surfaces were found and 0 could be read.

---

## 19 USA Results

US-headquartered companies are well served by both capabilities, with one important
qualification.

Discovery: US benchmark recall 1/6, but the `.com` operator concentration (65% of hits) is
dominated by US and US-adjacent vendors — Rockwell, Honeywell, AutomationDirect, Big Ass Fans,
Airex, Arecont Vision, AVPro, Supercircuits, Rocket Software, AccuKnox, ConnectWise, Kaseya,
N-able, Barracuda.

The qualification is §29's contamination: the English-language channel-vocabulary queries that
best match US publication conventions are also the queries most polluted by the PRM software
category and by SEO content. US discovery works best through **sector-technical** vocabulary
(`"system integrator partner program" industrial automation`, 71%) rather than
**channel-generic** vocabulary (`"become a partner" "deal registration"`, 25%).

---

## 20 Europe/Benelux/DACH Results

This is where source recovery earns its keep.

Every multi-domain recovery that changed an outcome was European: Vaillant (DE), Somfy
(DE/FR), SMA (DE/TR), Quatt (NL), Fronius (AT/DE), NIBE (SE/EU), Niko (BE), Phoenix Contact
(DE), Zehnder (CH/DE), Konica Minolta (EU).

Discovery in European languages outperforms the English average: French 89%, German 88% on
well-formed queries, Dutch 50% at best, Swedish 75% and Italian 75% on the holdout. The
German counterexample (0%) shows the risk is phrasing, not language.

Benelux specifically: Quatt (NL), Niko (BE), Nedap (NL), Itho Daalderop (NL), AED Winkel (BE),
Armaro (BE), Forklift Robot (NL), PVG (BE) — eight companies with operator evidence, six of
them discovered rather than supplied.

---

## 21 Observability Gap Before/After

| metric | before | after | change |
|---|---|---|---|
| software motion | 77% | 83% | +6 pts |
| physical motion | 39% | 61% | +22 pts |
| **software − physical gap** | **38 pts** | **22 pts** | **−16 pts** |
| software directory | 13% | 60% | +47 pts |
| physical directory | 13% | 44% | +31 pts |
| companies regressed | — | 0 | union regresses nothing |

The gap narrowed materially. It did not close. A 22-point residual is not a rounding error,
and this report does not present the improvement as a solution.

---

## 22 Under-Observed Analysis

Where surfaces came from, across all 106 companies: **sitemap 317, navigation 44, path probe
39**. Sitemap-first discovery is doing the overwhelming majority of the work, which is why
the 18 physical companies with no sitemap-derived surface are the hard residual.

Under-observation now has three distinct causes, and they need different fixes:

1. **No surface found (23 companies, 18 physical).** The dominant failure. Neither sitemap,
   navigation nor path probe located a partner page. This is the retrieval problem.
2. **Surface found, unreadable (3 companies).** The JS/PDF ceiling from §16. Not worth
   building for.
3. **Read but silent (16 companies).** Pages were retrieved and yielded no motion signal.
   Partly surface precision, partly companies that genuinely publish nothing operational.

Conflating these three into "under-observed" is what made the previous audit's finding hard
to act on.

---

## 23 False Positives

Six classes were found and fixed during this mandate. Each was caught by inspecting output,
not by a passing test.

| false positive | cause | fix |
|---|---|---|
| Next.js build chunks as partner surfaces | `partners.quatt.io/_next/static/chunks/*.js` matched on host | `NON_DOCUMENT` + `BUILD_PATH` filters; `/oauth` anchored `(\/\|$)` |
| Vaillant counted 6× | city nested under region under locator | `surfaceKey()` `while` loop |
| `contentful.be` invented | ccTLD probed on a *blocked* response | probe only on genuine non-resolution |
| Somfy's Egyptian/Chinese English sites | ranked on `language === 'en'` alone | `MAJOR` market ordering |
| `fronius.com → fronius.com` | self-referential hreflang | exclude `canonicalHost` |
| installer fired 3× per page | dedup key `kind\|lang`, word identical in de/nl/fr | dedup on `kind` |

**Discovery's dominant false positive is commentary.** 34 of 101 candidates (34%) were blogs,
glossaries, templates, trade press, forums, a legal dictionary and a US state securities
regulator. This is a property of the source, not a bug, and it is why per-query precision is
reported rather than an aggregate.

**Soft-404s.** An earlier industrial probe returned HTTP 200 for all 35 paths on Loxone. That
probe was discarded rather than reported. `isSoft404()` now covers English, German, Dutch,
French, Spanish, Italian, Swedish and Danish — Spanish was added because a test written
during this mandate failed against it, and the source was fixed rather than the test.

---

## 24 False Negatives

**12 companies regress under recovery alone** (§10). All 12 are recovered by the union, which
is why the union is the recommendation. Six physical: Itho Daalderop, Beckhoff, Kerlink,
Extron, Zebra, Eaton. Six software: ESET, Unit4, Twikey, Officient, Guestline, SiteMinder.

**Two vocabulary false negatives were found by inspecting pages that scanned clean** — Niko's
English distributor locator and Quatt's Dutch commission language (§14). Both had readable
text the detector simply did not match. This is the failure mode that does not announce
itself: a page is fetched, parsed, scanned, and reports nothing, indistinguishable from a page
that genuinely says nothing.

The nine physical companies read with no motion detected (Wago, Zebra, Sensative and others,
10 pages each) are the most likely remaining reservoir of this class. They were not
investigated individually within this mandate, and are named here rather than absorbed into
an aggregate.

---

## 25 Operator vs Participant

This is the measurement that refutes §64.

A **locator** addresses a consumer — "find an installer near you" — and proves only that a
network exists. A **programme surface** addresses a business — become a partner, tiers,
portal, certification, deal registration, lead routing — and evidences that the company
operates and manages that network.

| | motion evidence | programme evidence | locator/weak only |
|---|---|---|---|
| software | 37 | **35 (95%)** | 2 |
| physical | 27 | **24 (89%)** | 3 |

**Of physical companies where any motion evidence was found, 89% carry business-facing
programme evidence, against 95% for software.** Only five companies in 106 are locator-only:
Biamp, Enphase, Vaillant, Sitecore and WatchGuard — and that list contains two software
companies, so it is not a physical-sector characteristic at all.

The mandate's §64 hypothesis — that physical operational models are "too private for
automatic dossier construction" — is not supported. Physical companies publish their
operational model at very nearly the software rate **once their partner surface is found**.
The difficulty is entirely in the finding.

The distinction is preserved structurally rather than asserted: participation in someone
else's directory is never counted as operating one, and directory counts remain lower bounds.

---

## 26 Candidate Quality

§9 metrics for the search/web pattern mechanism, across all 13 queries (101 candidates):

| metric | value |
|---|---|
| candidates generated | 101 |
| unique companies | 100 |
| duplicate rate | 1% |
| entity resolution success | 100% |
| valid company rate (non-commentary) | 64% |
| partner-motion candidate rate | 54% |
| **operator rate** (of non-commentary results) | **85%** |
| category contamination (PRM vendors) | 7% |
| third-party directory rate | 3% |

The operator rate is the number that matters commercially: **when a result is a company at
all, 85% of the time it is a company operating its own channel**, not a participant, not a
directory, not a competitor. The weakness is upstream of that — 36% of results are not
companies.

---

## 27 Fresh Autonomous Discovery Test

Mandate §45–46 requires a fresh slice not used in construction. Two languages were chosen
that appear **nowhere** in `src/recovery/trade.ts` or any vocabulary file in this repository:
Swedish and Italian. Both queries were run after the construction measurement was frozen.

| lang | operators | total | precision |
|---|---|---|---|
| sv | 6 | 8 | **75%** |
| it | 6 | 8 | **75%** |
| **combined** | **12** | **16** | **75%** — vs 51% on the construction slice |

Swedish returned Canon Sweden (print/reseller/IT tracks), Beebyte (10% recurring commission),
Fristads, Prowejd, Blikk (commission on new sales and recurring licence revenue) and OS
Worker. Italian returned Husqvarna (authorised reseller application), Arrivly, eMotori, LMA
Machine, DocsMarshal (reseller Academy) and Simpedil.

The holdout **outperforms** the construction slice, because the construction slice
deliberately includes weak queries such as the 0% German one. Not a single Swedish or Italian
pattern exists in the codebase, so this is a genuine generalisation result: the mechanism is
not tuned to the languages it was built against.

The Swedish query also returned Salesforce's manufacturing partner-channel software page —
category contamination reproducing outside English.

---

## 28 Discovery Diversity

37 of 42 distinct operators found in the construction slice were **novel** — not present in
the discovery benchmark, never named in any query. Among them: sonnen, Viessmann, E3/DC,
alpha innotec, Solyco, PV Selected (DE solar/heating); Rockwell, Honeywell, AutomationDirect,
Schneider (industrial); Big Ass Fans, Airex, Hy-Capacity, Go-EV (US manufacturing); Arecont
Vision, AVPro, Supercircuits (AV); Terra Computer, TransfertPro, Tenable, Koban, Arrivly,
Avantage Business (FR); AED Winkel, Armaro, Forklift Robot, PVG, Itho Daalderop (Benelux);
N-able, ConnectWise, Kaseya, Barracuda, Rocket Software, AccuKnox (software/IT).

Language mix of operator hits: en 40%, fr 15%, de 13%, nl 11%, sv 11%, it 11%. **60% of
operator discoveries came from non-English queries**, from 7 of 13 queries.

---

## 29 Source Bias

Three biases were measured. One is the opposite of what was expected.

**The English channel-vocabulary query returns Introw's own competitors.** The flagship query
`"become a partner" "deal registration" partner program software` returned ZINFI,
ChannelScaler, Journeybee, Unifyr, Channeltivity and PartnerPortal.io — six PRM vendors — and
only two actual prospects. These vendors dominate SEO for precisely the vocabulary a naive
discovery layer would use. Any discovery system built on English channel vocabulary will
generate its own competitive set as leads. 7% contamination overall, and it recurred in
Swedish via Salesforce.

**English trade vocabulary is saturated by content marketing.** 22% and 29% precision on
English manufacturing queries, against 88% and 89% for German and French. English results
were templates, glossaries, how-to articles and a securities regulator. This inverts the
"English is better observed" assumption.

**The measured bias is publication-convention bias, not sector bias.** German manufacturers
publish `Fachpartner werden` pages as readily as SaaS companies publish `/partners`. The prior
audit's finding — that software is better observed — was real, but the cause is that the
pipeline's vocabulary and surface discovery were built around software publication patterns,
not that physical companies publish less. §25 confirms this directly.

---

## 30 Human Research Burden

Recovery reduces burden where it works and does not eliminate it.

- **Automatic today:** 43/52 software and 33/54 physical companies reach motion evidence with
  no human step. For 8 companies, trade vocabulary is the sole reason.
- **Human-necessary today:** the 21 physical companies with no motion evidence, of which 18
  yield no surface at all. Finding these requires either a better retrieval mechanism or a
  human locating the page.
- **Human-verifiable, not human-necessary:** discovery candidates. At 85% operator rate among
  actual companies and 51–75% raw precision, a human triage step is required before any
  candidate is treated as qualified. Discovery output is a **research queue**, not a lead list.

§25 changes the shape of the remaining burden. Because 89% of found physical companies publish
programme evidence, the human task is *"find the partner page"* — a bounded, mechanisable task
— rather than *"determine how this company runs its channel"*, which is open-ended. That is a
materially cheaper form of human work than the previous audit implied.

---

## 31 What Is Still Not Observable

Stated plainly, without softening:

- **39% of physical companies (21/54)** have no partner-motion evidence; 18 yield no surface.
- **Partner counts.** Directory counts are lower bounds. Nothing supports a true count.
- **Programme health.** Tier names are visible; whether tiers are populated or dormant is not.
- **Commercial materiality.** Quatt's "€400 per installatie" is the only published unit
  economic found across 106 companies. Channel revenue share is not observable anywhere.
- **Whether a locator's network is managed by the vendor** or is a list of independent
  stockists — the operator/participant boundary is inferred from surrounding surfaces, never
  proven.
- **Recency.** `first_seen_at` is not `launch_date`, and this mandate added no temporal
  evidence.
- **9 physical and 8 software companies** read pages and yielded nothing — genuinely silent
  or a vocabulary gap that does not announce itself (§24).

---

## 32 Product Implications

**Discovery is shippable as a research queue, not as a lead list.** Operator rate among real
companies is 85%, but 36% of raw results are not companies. A human triage step is mandatory.
Presenting discovery output as qualified leads would misrepresent it.

**Query craft is the product surface, not the crawler.** The 88-point spread between
`"Fachpartner werden"` and `"Vertriebspartner werden"` is larger than any sector or language
effect measured. The asset worth building is a curated, tested, multilingual pattern library
with per-pattern measured precision — not a general web crawler.

**The English default must be actively resisted.** It generates competitors as leads and
returns SEO content instead of vendors. Non-English queries produced 60% of operator
discoveries.

**Source recovery should be added to production as an additional source.** The union
regresses nothing and lifts physical observability by 22 points. Recovery must never replace
production's existing path probing — alone it is worse.

**The physical-sector story is better than the previous audit suggested.** The blocker is
retrieval, not privacy (§25). This changes what is worth building.

---

## 33 Recommended Architecture

```
DISCOVERY  (new, human-gated)
  pattern library ──► search ──► candidate ──► entity resolution ──► TRIAGE ──► queue
  · patterns carry measured precision; none contains a company name
  · PRM-vendor and commentary exclusion applied before triage
  · output is explicitly a research queue

SOURCE RECOVERY  (new, additive)
  domain resolution ──► surface discovery ──► trade vocabulary
  · hreflang > same-brand link > probed ccTLD, bounded to 3 domains
  · sitemap ──► navigation ──► path probe, soft-404 filtered
  · runs ALONGSIDE production's existing probe; union only

PRODUCTION  (unchanged)
  existing detectors, existing dossier model, existing three constructs
```

**Isolation held.** `src/recovery/` and `src/discovery/adapters.ts` are new and imported by
nothing in production. No scoring, no dossier model, no ranking, no GTM queue, no UI was
touched, and nothing was deployed.

**One disclosed exception.** `src/lib/http.ts` — `decodeEntities` — is shared with production
and was extended with named accented entities (§12). It is additive and strictly a fidelity
fix: it converts `&auml;` to `ä` and cannot create, suppress or alter a signal. It is
disclosed rather than buried because it is a production-shared file, it is **not deployed**,
and the measurements in this report depend on it. Reverting it would invalidate the German
and French evidence quotes above.

---

## 34 What Should Be Built Next

In priority order, by measured value:

1. **Better surface retrieval for physical companies.** 18 companies yield no surface — the
   single largest loss anywhere in this report, and §25 shows the evidence is there to be
   found. Worth more than every other item combined.
2. **A tested pattern library with per-pattern precision.** The measured spread is 0%–89%.
   Treat patterns as versioned, measured assets.
3. **A triage step before any candidate is surfaced.** Exclude PRM vendors and commentary
   mechanically; both are recognisable.
4. **Surface precision.** Wago, Zebra and Sensative each had 10 pages read and no motion —
   the finder is returning partner-ish URLs that are not programme pages.
5. **Distributor inversion (family B), properly scoped.** Catalogues yield brand names
   requiring operator resolution; useful as a seed, not as evidence.

## 35 What Should NOT Be Built

- **JS rendering and PDF extraction.** Measured ceiling 3/106 companies, 2 PDF surfaces.
  Cost is not justified (§16).
- **PRM tenancy discovery.** Returned 0. The inversion does not exist in certificate
  transparency (§06). Do not retry under another name.
- **Any numeric fit score, 0–100 ranking, purchase probability, or GTM queue.** Out of scope
  by standing constraint, and nothing measured here supports one.
- **Partner count as a gate.** Counts are lower bounds only.
- **ATS/job activity as a discovery backbone, or CRM as discovery.** Excluded by mandate and
  unsupported by evidence.
- **A general web crawler.** The value is in query craft, not crawl volume.
- **English-only discovery.** It generates competitors as leads.

---

## 36 Final Verdict

**SEGMENTED DISCOVERY GO.**

Discovery works, generalises to unseen languages at 75%, and produces an 85% operator rate
among real companies. It is segmented not by sector but by **vocabulary specificity**: queries
using phrasing that only an operator publishes about itself score 88–89%, while phrasing
shared with commentators scores 0–29%. The segment that performs *worst* is English software
channel vocabulary, which returns Introw's own competitors — the opposite of what a
SOFTWARE-FIRST verdict would require, which is why that verdict is rejected.

Source recovery materially reduces the cross-industry observability gap: physical motion
39% → 61%, software 77% → 83%, gap 38 → 22 points, physical directory detection 13% → 44%,
with 36% of physical evidence depending on recovery against 7% for software. It must ship as
an additional source, never a replacement — alone it regresses 12 companies.

The mandate's §64 hypothesis is **refuted by measurement**, and this is the finding most worth
carrying forward: physical companies publish their operational model at 89% once found,
against software's 95%. Physical-sector partner networks are not too private for automatic
dossier construction. They are **harder to retrieve**, and retrieval is an engineering
problem rather than an epistemic limit.

FULL DISCOVERY GO is not claimed: 39% of physical companies remain unobserved, 33% yield no
surface at all, per-query precision ranges from 0% to 89%, and recall against the frozen
34-company benchmark was 5/34 on an eleven-query budget. Those numbers are the reason for
"SEGMENTED" and they are not presented as anything smaller than they are.

---

### Provenance

| artefact | sha256 / status |
|---|---|
| `audit/cross-industry.v1.json` | `ecc330e5abefa54d` — frozen before results |
| `discovery/benchmark.v1.json` | `0596cd07f3cf8462` — frozen before results |
| `audit/baseline/cross-industry.BASELINE.json` | pre-change baseline; reproduced exactly as an integrity check |
| tests | 153 passing across 12 files; typecheck clean |
| production files modified | `src/lib/http.ts` only, additive, disclosed §33 |
| deployed | **nothing** |

Measurement scripts: `audit/run-recovery.ts`, `audit/compare-recovery.ts`,
`audit/union-recovery.ts`, `audit/phase-e.ts`, `audit/locator-vs-programme.ts`,
`discovery/measure.ts`, `discovery/metrics9.ts`.
Outputs: `audit/out/`, `discovery/out/`.

---

## Appendix A — Red-Team Loop (§61)

Convened against the finished measurements. Each of the six required questions is answered
with the evidence that settles it, or with an admission that nothing settles it.

### Are we improving real source recovery, or just increasing keyword recall?

**Partly the latter, and the split is measurable.**

The honest decomposition: of 106 companies, **8 gained motion evidence from trade vocabulary
alone** — new keywords firing on pages production could already reach. That is keyword recall.
The other **7 companies** that gained evidence did so because multi-domain resolution or
sitemap discovery put a page in front of the detectors that production never fetched. That is
genuine source recovery.

Two structural checks argue against pure keyword inflation. Recovery **regressed 12
companies**, which a keyword-recall expansion cannot do — it proves a different page set, not
a looser matcher. And the surface-origin distribution (sitemap 317, navigation 44, path probe
39) shows the bulk of surfaces arriving through a mechanism production does not have.

*Statistical reviewer's caveat:* with n=106 and 15 changed outcomes, the physical +22-point
movement rests on 12 companies. It is directionally solid and reproduced across two
independent cuts (motion and directory), but it is not a tight estimate, and no confidence
interval is claimed.

### Are we finding real channel operators?

**Yes, at 85% of real companies** — but only 64% of results are companies at all.

Operator status was judged from the landing page itself (an application form, a tier
structure, a portal, a published commission), never from the query that returned it. The
mechanism's weakness is upstream: 34% commentary and 7% competitors. As a lead list this
would be poor; as a research queue it is strong.

*Manufacturing channel expert:* the physical finds are genuine operator programmes —
Vaillant's Fachpartner locator, Fronius's tiered system-partner programme, SMA's authorised
distributors, Quatt's €400-per-installation referral. These are not marketing pages.

*SaaS partnership expert:* the software finds skew toward MSP/security, which is where
English channel vocabulary is most operator-specific and least colonised by SEO.

### Are we expanding into low-buyability segments?

**Unknown, and deliberately unmeasured — which is itself a risk to state.**

§51 is explicit: this mandate measures discovery and observability, not buyability. Nothing
here promotes a company on network presence. But an honest red team must name the exposure:
several discovered operators are very small (Prowejd, Forklift Robot, Arcade for Good, AED
Winkel) and several are very large (Schneider, Rockwell, Honeywell, Canon, Husqvarna).
Neither end is likely to be a good Introw fit, and **discovery has no mechanism to tell**.

The 45% manufacturing share of operator hits is a property of the queries run, not evidence
that manufacturing is a good segment. Per §52, that share is not a recommendation, and this
report makes none. The existing human-review model must remain the gate.

### Are we still biased toward English?

**Less than production is, and not in the direction expected.**

60% of operator discoveries came from non-English queries. The two highest-precision queries
were French (89%) and German (88%); the three lowest were English (22%, 25%, 29%). English
holds a 40% share of operator hits, but that reflects `.com` concentration rather than
detection advantage.

The residual English bias is real and lives in **source recovery**, not discovery: the
pipeline's extraction works best on English text, locale ranking prefers English copies, and
the trade vocabulary covers four languages against the web's many. Swedish and Italian
discovery worked at 75% while `src/recovery/trade.ts` contains no Swedish or Italian pattern
at all — so those companies would be discovered and then read poorly. **Discovery has
outrun recovery in language coverage**, and that is now the asymmetry to watch.

### Are we now overfitting industrial benchmark cases?

**A real risk, partially controlled, and not fully excluded.**

The honest exposure: Niko and Quatt patterns were added *after* inspecting Niko's and Quatt's
recovered pages. That is fitting to observed cases, and it must be declared.

Three controls limit it. Both fixes were written as **class-level rules** — English trade
nouns, Dutch referral-and-commission phrasing — not as company patterns; no company name
appears anywhere in `src/recovery/` or `src/discovery/`. Both generalise beyond their origin:
the English distributor pattern fires on Moxa, Phoenix Contact and Victron, and the Dutch
patterns fire on Shiftbase and Protime. And the Swedish/Italian holdout (§27), run after
freezing, scored 75% with zero patterns in those languages.

What is **not** controlled: the surface-finder's `URL_VOCAB` and probe paths were iterated
against this same 106-company set. A fresh company set would likely score lower than 61% on
physical, and no independent estimate of that drop exists. The 75% holdout speaks to
discovery generalisation, not to recovery generalisation. **Recovery has no holdout, and its
numbers should be read as an upper bound.**

### Are discovery sources independent of the benchmark?

**Yes for generation, no for evaluation.**

No query contains a company name — this is asserted by a test that fails if any published
pattern mentions one — so candidate *generation* cannot restate a held list. 37 of 42
operators were novel.

But *evaluation* is not independent: the 34-company discovery benchmark overlaps the
106-company observability benchmark (§03), so recall and observability figures are drawn from
partially shared companies. And the 106-company set is channel-plausible by construction, so
it measures observability given a plausible channel, never a base rate.

*Entity resolution specialist:* 100% resolution and 1% duplication are healthy, but both are
easy on 101 candidates from a single mechanism. The bata.com/bata.de guard is a test, not a
measured error rate — no false-merge rate has been estimated at scale.

*Introw AE / RevOps lead:* the output usable tomorrow is a triaged research queue plus 22
points of additional physical-sector observability. What is **not** usable is any claim about
partner counts, programme health, or fit. The €400-per-installation figure is the only
published unit economic found in 106 companies, and it should not be presented as
representative of anything.

### Standing disagreement

The strongest case against SEGMENTED DISCOVERY GO: 5/34 recall is weak, and 11 queries is a
thin basis for a GO of any kind. The counter-argument this report rests on is that recall was
budget-bound rather than mechanism-bound — sectors that received a well-formed query returned
4/7 and 1/4, sectors that received none returned 0 — and that the 75% holdout demonstrates the
mechanism generalises. That argument is reasonable but not proven. A larger query budget
across all ten sectors would settle it, and until that is run, the verdict carries this
caveat rather than resolving it.
