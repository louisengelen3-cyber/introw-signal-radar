# Cross-Industry Discovery Bias Audit

Bounded diagnostic. **Nothing in production was changed** — no detector was tuned, no scoring
touched, no deployment made. All output lives in `audit/`.

---

## 01 Executive verdict

# MATERIAL SaaS / SOFTWARE BIAS

...in **observability**, with three qualifications that matter more than the headline.

**The bias is real and survives every control I could apply.** Holding publication language
constant, physical-goods companies still underperform software by 32–37 points on partner-motion
identification. Holding *country* constant — Germany only — German software identifies a motion
in 50% of cases and German physical-goods companies in 13%.

**But "physical" is not one thing.** Hardware and AV electronics (70% motion, median 1 claim)
perform close to software. Industrial automation (20%) and solar (0%) do not. The gradient runs
with publishing convention inside the physical group, not with physicality.

**And the largest single cause is not vocabulary.** It is retrieval — country domains,
professional subdomains, PDFs and login walls. Where the Radar *did* read partner pages, physical
companies still yielded claims 59% of the time versus 85% for software, so vocabulary is a real
second-order effect, not the primary one.

**There is no measured discovery bias, because there is no discovery.** See §03.

---

## 02 Corpus composition

The 35-account production corpus, classified by hand (the Radar has no industry field):

| Industry | n | % |
|---|---|---|
| SaaS / software | 7 | 20% |
| MarTech / sales tech | 4 | 11% |
| HR / business software | 4 | 11% |
| Fintech | 4 | 11% |
| E-commerce tech | 3 | 9% |
| Consumer marketplace | 3 | 9% |
| Hospitality tech | 2 | 6% |
| IT services | 2 | 6% |
| Partner tech | 2 | 6% |
| Legal tech · Cybersecurity · Infrastructure · Professional services | 1 each | 3% each |

- **Software / tech: 29 of 35 — 83%**
- **Manufacturing / industrial / hardware: 0 of 35 — 0%**

Geography: Benelux and Western Europe dominant. Company type: overwhelmingly venture-backed
scale-ups. Partner motions identified across the whole corpus: reseller 7, technology 5,
integration 4, affiliate 3, agency 2, referral 2, services 2, strategic alliance 2,
implementation 1, distributor 1.

**This number does not measure the Radar.** I chose those 35 companies. It measures my sampling.
Reporting it as evidence of detector bias would be double-counting one observation, and §03
explains why.

---

## 03 Discovery performance by industry — NOT MEASURABLE

**The production Radar has no discovery mechanism wired into it.** `product/build-dossiers.ts`
consumes a hand-supplied domain list. There is no crawl, no seed expansion, no candidate
generation in the deployed path.

`src/discovery/mechanisms.ts` does exist and implements distributor inversion, partner-directory
harvest and certificate-transparency tenancy. Its own header records that distributor inversion is
*"the only mechanism tested that reaches the local-language industrial segment"*, and Phase 1 ran
it — a single Belgian electrical wholesaler yielded 991 candidates. It is not connected to
production.

So **discovery bias cannot be measured on the deployed system, because the deployed system does
not discover.** Everything below is observability. This distinction is the audit's most important
structural finding and it changes what any remedy would have to target.

---

## 04 Observability by industry

Frozen benchmark `audit/cross-industry.v1.json`, sha256 `ecc330e5abefa54d` — 106 companies,
13 cohorts, 23 countries, 49% software / 51% physical, assembled independently of Radar output.
105 completed.

| Cohort | n | reach | motion | under-obs | med. claims | CRM | ATS | forwarded |
|---|---|---|---|---|---|---|---|---|
| ecommerce_tech | 6 | 100% | **100%** | 0% | 6 | 33% | 50% | 100% |
| cybersecurity_it | 10 | 100% | 90% | 10% | 3 | 60% | 30% | 80% |
| martech_salestech | 6 | 100% | 83% | 17% | 5 | 50% | 17% | 83% |
| hr_business_software | 6 | 83% | 83% | 17% | 4 | 17% | 0% | 83% |
| saas_software | 10 | 80% | 70% | 30% | 3 | 10% | 20% | 70% |
| hardware_electronics | 10 | 90% | 70% | 30% | 1 | 0% | 0% | 70% |
| hospitality_tech | 6 | 100% | 67% | 50% | 2 | 50% | 17% | 50% |
| iot_connected_devices | 10 | 100% | 60% | 40% | 1 | 20% | 10% | 50% |
| fintech | 8 | 88% | 50% | 50% | 0 | 13% | 0% | 50% |
| manufacturing_equipment | 12 | 92% | 42% | 50% | 0 | 0% | 8% | 42% |
| industrial_automation | 10 | 80% | 20% | 80% | 0 | 0% | 0% | 20% |
| solar_energy_tech | 6 | 83% | **0%** | 83% | 0 | 0% | 0% | 17% |

| | Software (52) | Physical (53) | Gap |
|---|---|---|---|
| Site reachable | 92% | 86% | +6 |
| **Partner motion identified** | **77%** | **40%** | **+37** |
| **Under-observed** | **25%** | **56%** | **−31** |
| Forwarded to a seller | 73% | 40% | +33 |
| CRM established | 33% | 4% | +29 |
| ATS board attributed | 19% | 4% | +15 |
| Partner page returned content | 88% | 56% | +32 |
| **Partner directory found** | **13%** | **14%** | **−1** |
| Median distinct claims | 3 | 0 | — |

### Is it sector, or is it publication convention?

The red team argued the cohorts are confounded — German industrials publish across country
subdomains, in German, behind logins. Cutting the same data both ways:

| | English-first market | Non-English market |
|---|---|---|
| **Software** | motion 85%, under-obs 19%, claims 3 (n=26) | motion 69%, under-obs 31%, claims 2 (n=26) |
| **Physical** | motion 53%, under-obs 42%, claims 0 (n=19) | motion 32%, under-obs 62%, claims 0 (n=34) |

- **Sector effect, holding language constant: −32 points (English), −37 points (non-English).**
- **Language effect, holding sector constant: −16 points (software), −21 points (physical).**

Both are real. **Both are additive, and sector is the larger of the two.** The single cleanest
control — Germany alone, one publication convention — gives German software 50% motion against
German physical 13%.

The red team's methodologist was right that language matters and wrong that it explains the
sector gap. The gap survives the control.

---

## 05 Source coverage by industry

- **Partner page returned content: 88% software vs 56% physical.**
- **Eleven sites returned zero readable pages**, and the failure is *sector-neutral*:
  silverfin, contentful, clearbank, personio (all software) alongside vaillant, turck, balluff,
  barco, solaredge, ricoh-europe, trotec.
- `vaillant.com` fails at the network layer (`status 0, fetch failed`) while `vaillant.co.uk`
  returns 536 KB and `professional.vaillant.co.uk` returns 200. **The pipeline researches one
  apex domain**; multinational manufacturers publish their channel per country.
- **The one detector with no sector gap is the partner directory** — 7/52 software, 7/53 physical,
  and it finds real industrial ones: Crestron ≥58, Milesight ≥57, SMA ≥22, Niko ≥10,
  Schneider ≥10, Itho Daalderop ≥6, Digi ≥6.

---

## 06 Vocabulary coverage by industry

**This measurement was wrong the first time and the red team caught it.** My instrument scanned
8 of 34 files in `src/` and matched literally, so deliberately-general regexes
(`systems? integrator`, `authoriz?ed distributor`, `solution(s)? partner`) were reported ABSENT
when they were present. Corrected to scan all 34 files with optional-character tolerance:

| | First (wrong) | Corrected |
|---|---|---|
| SaaS-native vocabulary | 89% | **100%** (18/18) |
| Non-SaaS trade vocabulary | 57% | **67%** (31/46) |
| Gap | 32 pts | **33 pts** |

Still genuinely absent, and each is a motion **Introw's own site names**:
`MSP` · `managed service provider` · `OEM partner` · `service partner` · `service network` ·
`maintenance partner` · `sales agent` · `representative network` · `trade partner` · `stockist` ·
`distribution network` · `integrator network`.

Locale references present for nl, de, fr, es, it; **absent for sv, da, pl, pt**.

### But vocabulary is not the binding constraint

When the Radar **did** read two or more partner pages:

| | n | claims > 0 | median claims |
|---|---|---|---|
| Software | 40 | 34 (85%) | 3 |
| Physical | 22 | 13 (59%) | 1 |

Reach-good / yield-zero cases — pages read, nothing extracted:
`fronius.com` (7 partner pages, 0 claims), `sma.de` (5, 0), `niko.eu` (9, 0), `kerlink.com` (5, 0),
`sensative.com` (6, 0), `eaton.com` (4, 0) — **and `bitdefender.com` (7, 0) and `watchguard.com`
(6, 0), which are cybersecurity.** The yield failure is not purely sectoral.

---

## 07 ATS / job coverage by industry

- Software: **10/52 boards (19%)**, 164 vacancies read.
- Physical: **2/53 boards (4%)**, 40 vacancies read.

The job layer is itself substantially more SaaS-reaching, as suspected. It cannot compensate for
the primary gap and slightly widens it.

---

## 08 Publication-density effect

| Pages read | Forwarded to a seller |
|---|---|
| ≥ 8 | 36/45 (80%) |
| 4–7 | 18/28 (64%) |
| 1–3 | 4/18 (22%) |
| 0 | 0/11 (0%) |

Forwarding still tracks how much was read. This is the same publication-volume dependence the
Phase 3 hardening sprint identified, reappearing as a sector effect: **companies that publish
more get read more, and software publishes more.** Note the earlier audit's own conclusion —
below zero-evidence accounts the dependence is near-nil — so most of this is the trivial "you
cannot review what you could not read".

---

## 09 Manual false-negative audit

| Company | Radar | Reality | Classification |
|---|---|---|---|
| **Vaillant** | `under_observed`, 0 pages | **Vaillant Advance**: four installer tiers to Advanced MasterTEC, product registration, partner portal (myVaillant Pro / myREWARDS), cash-and-points rewards, and *"top tier installers able to benefit from access to sales leads"* | **ENTITY RESOLUTION** (apex unreachable, channel on country domain + `professional.` subdomain) + **SOURCE** (PDF) |
| **Fronius** | `under_observed`, 7 partner pages read, 0 claims | Three tiers — Service Authorized Installer → Trained Installer → Solutions Partner — **5,000+ installers**, annual criteria to retain tier, E-Academy, and partners *"empowered with exclusive service work, **customer leads**, … marketing and sales tools"* | **VOCABULARY / SEMANTIC** — pages were read and nothing extracted |
| **Quatt** | `suppression_candidate` (correct), 0 claims | Introw's own flagship manufacturing customer: *"We went from 10 partners to over 200 in a year."* Its `/partners` page is a **product** page; the motion appears only as the Dutch compound **`installatiepartners`** | **VOCABULARY + LOCALE** — caught only by the Introw DNS fingerprint, not by content |
| **Personio** | `under_observed`, 0 pages | Named Introw customer | **RETRIEVAL** — sector-neutral |

**Named Introw customers in the benchmark: 5 of 7 handled correctly.** Storyblok, Aikido,
Factorial and Ringover all reached `strong_evidence` with a motion identified; ReversingLabs was
correctly suppressed. **Personio and Quatt both returned `motion = NO`** — and Quatt is the
manufacturing reference customer.

---

## 10 Manufacturing / industrial deep dive

The instruction was to challenge the earlier conclusion that industrial public data is thin, and
to test whether we were simply looking in the wrong places. Three independent lines of evidence:

**1. Phase 2 Track A already ran the strong version of this experiment.** 21 industrial
manufacturers sourced by inverting a Belgian electrical wholesaler's vendor catalogue — a
*channel-guaranteed* sample, since a distributor carrying your product implies a channel — each
probed on **30 trade-native paths** (`/haendlersuche`, `/vakhandel`, `/vertriebspartner`,
`/installateurs-agrees`, `/verkooppunten`, …). Result: **transacting 1/21 (5%) before, 1/21
after**, with **0/21 unreachable** and 30 soft-404s rejected. Trade vocabulary was tested directly
and did not move the number.

**2. My own trade-path probe was inconclusive and I am discarding it.** It lacked soft-404
detection — Loxone returned HTTP 200 for all 35 trade paths, and Biamp for 35 — so its hit counts
are not usable. Reported here rather than quietly dropped.

**3. The strongest counter-evidence is real but concentrated.** Vaillant and Fronius both run
programmes with tiering, registration, portals, enablement and **lead routing to partners** —
which is precisely the operating model Introw's manufacturing page describes. Neither was
observed. So the motion exists; the Radar cannot see it.

**Reconciling 1 and 3:** the wholesaler-inverted sample is dominated by component makers selling
through two-tier distribution, where the counterparty is the distributor. Vaillant and Fronius
sell **direct to installers** and run vendor-owned tier schemes. These are different motions, and
only the second is PRM-shaped. The industrial sector is not uniformly a poor fit — **the
direct-to-installer sub-segment is a genuine miss and the two-tier-distribution sub-segment
largely is not.**

### One correction to the red team

The manufacturing expert's strongest citation — `distribution.ts`, "known Introw customers carried
by a distributor 1/16 (6%) vs poor-fit 10/14 (71%), the strongest structural discriminator" — **was
withdrawn in Phase 3.** Thirteen of fourteen negative rationales in that cohort *cite distribution
structure*, so it partly measured its own labels. Re-tested against independent controls:
customers 1/19, clean negatives **0/14**, matched unlabelled 2/15. **The signal separates nothing**;
it is UNRESOLVED, not a validated negative. The argument that distributor-mediation is a reliable
disqualifier does not currently stand on measured evidence.

---

## 11 Geographic bias

| Country | n | motion | under-observed | med. claims |
|---|---|---|---|---|
| US | 15 | 87% | 13% | 2 |
| BE | 13 | 77% | 23% | 2 |
| NL | 16 | 69% | 25% | 1 |
| FR | 6 | 67% | 33% | 2 |
| SE | 5 | 60% | 40% | 2 |
| UK | 4 | 50% | 50% | 5 |
| **DE** | **23** | **26%** | **70%** | **0** |

Germany is the outlier, but 15 of its 23 companies are industrial. Isolating within Germany:
German software 50% motion, German physical 13%. **Both effects are present; neither explains the
other.** Locale support is absent for Swedish, Danish, Polish and Portuguese.

---

## 12 Company-size / digital-maturity bias

Digital maturity is acting as a partial proxy. Milesight (LoRaWAN sensors, China) returns
`strong_evidence`, a 57-partner directory and confirmed HubSpot. Balluff (sensors, Germany)
returns zero pages. Same product category, same channel shape, opposite outcome — the difference
is an English-language single-domain marketing stack versus German country subdomains and a
login-gated `Händlerportal`.

The counter-argument deserves weight: Vaillant has five-figure installer counts and Fronius 5,000+,
which sit **above** any plausible Introw band, and Introw's own thesis records no evidence-supported
size band at all. So some of what the Radar misses is genuinely out of scope for reasons unrelated
to observability.

---

## 13 Which non-SaaS motions are genuinely Introw-relevant

Judged against operational collaboration — lead sharing, registration, attribution, enablement,
tiering, onboarding — not against having partners.

1. **Direct-to-installer networks with vendor-passed leads** (Quatt, Vaillant Advance). Introw's
   own reference customer is this shape. Highest-confidence non-SaaS segment.
2. **MSPs**, structurally identical to SaaS reselling — recurring revenue, vendor-registered deals,
   tiered margin. Introw names MSPs explicitly; the lexicon does not contain the term.
3. **System integrators on capital equipment**, where project registration for price protection is
   deal registration under another name.
4. **OEM / design-in registration** in electronics — genuine opportunity registration with a real
   conflict-arbitration problem.
5. **IoT and AV hardware vendors** — already observable at near-software rates (70% / 60% motion).

## 14 Which non-SaaS motions look like fit but are not

1. **Two-tier distribution.** The vendor's counterparty is the distributor; the transaction is a
   purchase order; there is no opportunity object to attribute. A dealer locator is a marketing
   asset — it proves customers can find someone, not that a managed relationship exists.
2. **Rebate and volume-bonus schemes.** Settled annually off ERP sell-through against contracted
   tiers. A finance process owned by the CFO, in SAP. Introw does not touch it.
3. **Purchasing tiers.** Discount off list based on annual buy volume — the same *word* as a
   performance tier, a different object, system and owner.
4. **Spare parts and warranty claims** — the highest-frequency vendor-installer interaction in
   HVAC, run through a service portal wired to parts inventory. No corresponding object in a PRM.
5. **Consumer marketplaces** where "partners" are supply. Already correctly suppressed.

---

## 15 Root causes, in order of measured contribution

1. **Single-apex-domain research.** Multinational manufacturers publish channel per country and
   behind `professional.` / `pro.` subdomains. Vaillant is the clean case: apex unreachable,
   country domain 536 KB.
2. **Semantic extraction failure on trade pages.** Physical companies with ≥2 partner pages read
   yield claims only 59% of the time versus 85% — Fronius at 7 pages and 0 claims.
3. **Missing motion vocabulary** for MSP, service partner, OEM partner, sales agent — all named on
   Introw's own site.
4. **Publication-volume dependence**, unchanged from Phase 3 and now visible as a sector effect.
5. **Login-gated programmes.** Vaillant's detail sits behind myVaillant Pro. No public-web method
   reaches it.
6. **PDF-only content**, unreadable by the current pipeline.
7. **Locale gaps** — no Swedish, Danish, Polish, Portuguese; Dutch compounds like
   `installatiepartners` unmatched.

---

## 16 Proposed changes — NOT IMPLEMENTED

Ranked by measured evidence, not by appeal.

| | Change | Evidence | Risk |
|---|---|---|---|
| **1** | **Multi-domain entity resolution** — follow country domains and `professional.`/`pro.` subdomains | Largest single cause; fixes Vaillant, and also Personio, Contentful, Silverfin, which are software | Low. Sector-neutral source-fidelity fix, not a market thesis |
| **2** | **Lean on the partner directory** — the only detector with **no sector gap** (13% vs 14%), already finding SMA ≥22, Crestron ≥58, Niko ≥10 | Measured parity | Low |
| **3** | **Add the named-but-missing motions** — MSP, service partner, OEM partner, integrator network | Introw names all of them; lexicon has none | Low, but §06 shows vocabulary is second-order |
| **4** | **Wire distributor inversion into discovery**, its own header calls it the only industrial-reaching mechanism | 991 candidates from one wholesaler | **Medium-high.** Phase 2 got 1/21 transacting from exactly this population |
| **5** | Locale expansion (sv, da, pl, pt) and Dutch/German compounds | Locale effect measured at 16–21 points | Low |
| **6** | PDF extraction | Vaillant tier detail is PDF-only | Medium cost, narrow benefit |

**Explicitly not proposed:** any scoring, ranking, sector weighting or GTM queue. Nothing here
changes the product thesis.

---

## 17 What should remain unchanged

- **No scoring, no ranking, no queue.** Nothing in this audit bears on that.
- **Unknown semantics.** `under_observed` on an industrial company means "we could not read it",
  and the product already says exactly that.
- **The existing-customer suppression rule.** It caught Quatt and ReversingLabs correctly.
- **The three constructs and the evidence-first dossier.**
- **The distributor demotion must stay withdrawn.** Phase 3 showed it separates nothing.

---

## 18 Limitations

1. **The benchmark was built from Introw's industry pages — and the project's own thesis (line
   280) says doing so is a category error**: *"Introw's own site lists 11 industry pages. That is
   an SEO surface, not an ICP. Using Introw's industry pages as a targeting filter would be a
   category error."* I used them anyway, because they are the only public statement of claimed
   scope. Every "missed sector" claim inherits that weakness.
2. **The sampling frame is channel-plausible, not random.** There is no denominator, so no miss
   *rate* and no market-size claim can be derived — only "conditional on a plausible channel, yield
   is lower in industrial cohorts".
3. **No ICP-fit ground truth.** I measured whether a motion is *observable*, never whether the
   company is *buyable*. Vaillant and Fronius may be too large regardless.
4. **My vocabulary instrument was wrong on first run** and is corrected in §06. Its replacement is
   still a proxy: string presence, not detector behaviour.
5. **My industrial trade-path probe lacked soft-404 detection** and is discarded.
6. **Cohorts are small** (6–12) and sector correlates with country in the frame.
7. **One run, one point in time.** Sites change.

---

## 19 The most important question

> If Introw gave this Radar to an AE tomorrow, would it systematically cause that AE to spend too
> much time on SaaS/software companies while missing equally or more attractive companies with
> reseller, distributor, installer or SI networks outside SaaS?

## Yes for the second half. No for the first.

**It would not push an AE *toward* SaaS.** The Radar does not rank, does not score and does not
generate a queue. It researches the domains it is given. An AE who hands it 50 manufacturers gets
50 manufacturer dossiers.

**It would systematically fail them on non-software accounts.** On the measured benchmark it
identifies a partner motion for 77% of software companies and 40% of physical-goods companies, and
calls 56% of the latter under-observed against 25%. An AE working an industrial list would find
more than half their accounts returning "we could not establish a partner motion" — for companies
that demonstrably have one. Vaillant runs a four-tier installer programme that passes leads to its
top tier and the Radar returned zero pages.

**The sharpest evidence is Introw's own customer list.** Of seven named customers in the benchmark,
five were handled correctly and two failed — and one of the two is **Quatt, the flagship
manufacturing reference**, whose partner motion was invisible to content analysis and was caught
only by an Introw DNS fingerprint. A Radar that cannot see its own best manufacturing customer
cannot find the next one.

**The honest qualification**, which the red team pressed hard and which I accept: I measured
*observability*, not *buyability*. Some of the missed population — Fronius at 5,000+ installers,
Vaillant with a channel organisation per country — may be outside any workable band. Whether the
missed segment contains buyers is unmeasured, and Phase 2's 1-in-21 result on a channel-guaranteed
industrial sample is a genuine warning against assuming it does.

---

## 20 Which solution

# F — a combination, and deliberately narrow: B, then A

**B (source types) first, as a source-fidelity fix rather than a market-expansion thesis.**
Multi-domain resolution and subdomain following address the largest measured cause, and they are
sector-neutral: the same change recovers Personio, Contentful and Silverfin. The claim it supports
is *"the Radar under-reads multi-domain non-English sites"* — true, measured, and not a bet on any
sector.

**A (vocabulary) second, scoped to the motions Introw already names** — MSP, service partner, OEM
partner, integrator network. Cheap and defensible. But §06 shows the ceiling: Fronius read 7 partner
pages and produced 0 claims, so more nouns would not have saved it.

**Not C.** Sector-specific adapters presuppose the sector is worth the build, and Phase 2's 1/21 on
a channel-guaranteed industrial sample says that is unproven.

**Not D.** The thesis is not implicated. The failures are retrieval and extraction, not targeting.

**Not E.** Staying deliberately SaaS-focused would require believing the non-SaaS miss is
worthless, and Introw's own flagship manufacturing case study — invisible to this Radar — is
evidence against that.

**The single change I would make before any of it:** the strongest non-SaaS signal already works.
Partner-directory detection has **no sector gap at all** (13% vs 14%) and already returns Crestron
≥58, Milesight ≥57 and SMA ≥22 partner organisations. A named list of a manufacturer's partners is
the most expensive-to-fake evidence in the system, and it is the one thing that already crosses the
industry boundary intact.
