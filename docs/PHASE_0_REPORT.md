# Introw Signal Radar — Phase 0 Report

**Commercial validation × observability × architecture**
**Date:** 21 August 2026 · **Benchmark:** `cohorts.v1` (frozen, sha256 `db30302202…`)
**Status:** blocking approval gate. No mass discovery, production scoring, GTM queue or production UI has been built.

---

## How to read this

Phase 0 asked one question: *can the intelligence the Introw Radar wants to show actually be discovered, dated, resolved and verified reliably enough to justify production use?*

I did not answer it by reasoning about the thesis. I froze a 69-company benchmark before running anything, built the detectors, and ran them. Every number below comes from a real request made from this machine on 21 Aug 2026. Where a source was not tested, it says so.

The short version: **the commercial thesis is largely right about what matters and substantially wrong about what is observable.** Three of its four hard gates cannot be operated as gates. The signal it rates as its cheapest is, in practice, its most expensive. And the strongest detector in the model is one the thesis rates as merely "moderate".

---

## A. Commercial model verdict

### A.1 What survived, and got stronger

**1. Transacting partners ≠ integration partners, and the distinction is detectable.**
The thesis calls integration-ecosystem presence "the single most dangerous buildable signal." Measured: 4 of 4 integration-only controls (Linear, Sentry, PostHog, Vercel) were correctly refused a transacting verdict, while 95% of known-customer accounts (18/19 reachable) exposed a partner surface. This is the load-bearing distinction in the model and it holds empirically. **UPGRADED from RI to measured.**

**2. Incumbent-PRM fingerprinting — much stronger than the thesis assumed.**
The thesis rates PRM fingerprinting "MODERATE" observability via login-page artifacts. The real mechanism is DNS: `partners.<domain>` CNAMEs to the vendor. Measured on Cohort A: **9 of 19 reachable known customers (47%) resolve to `cname.introw.io`, with zero false positives anywhere in the 69-company benchmark.**

```
partners.cumulocity.com   → cm4ll6dsj0004dsj1l96pxq9x.cname.introw.io
partners.axon.com         → cmal3shoq006yqv01kifwdicp.cname.introw.io
partners.quatt.io · partners.cubbit.io · partners.epiphan.com
partner.sharegate.com · partners.coder.com · partners.reversinglabs.com · partners.parloa.com
```

Two consequences the thesis does not draw. First, this generalises to every competitor with a hosted portal, which makes **PRM displacement a detectable segment rather than a nurture hope**. Second — and this is a release gate — **it is an existing-customer suppression detector**. Nine accounts in a 69-company benchmark are current Introw customers. At scale, cold-mailing your own customers is the most embarrassing failure the system can produce, and this is the cheapest possible guard against it.

**3. A public partner surface is close to proof that a channel exists.** Confirmed: no control company without a channel produced a transacting verdict on a real partner page.

### A.2 What failed, and must change before implementation

**1. `crm_confirmed IN [hubspot, salesforce]` cannot operate as a hard gate. [FAILED]**

The thesis calls HubSpot "the hardest qualification gate in the model — harder than industry, geography, or size" and specifies it as `gate_1`, at CONFIRMED evidence standard. Measured, sweeping up to ten form-bearing pages per company:

| Cohort | Any CRM artifact | HubSpot | Salesforce | **UNKNOWN** |
|---|---|---|---|---|
| A — known customers | 74% | 68% | 11% | 26% |
| **B — realistic prospect population** | **22%** | **17%** | **0%** | **78%** |
| C — controls | 7% | 7% | 0% | 93% |

And on the four customers whose HubSpot use Introw itself publishes: **Cumulocity — not detected. Factorial — not detected** (9 pages inspected). Factorial's own application config carries `showHubspotChatModal` flags — the company's own code references HubSpot — but no live artifact was served.

Applied as specified, this gate would discard roughly **four-fifths of a realistic prospect universe on absence of evidence**, and would discard two of Introw's own flagship references. That is a direct violation of the thesis's own invariant, *"absence of evidence is never scored as negative evidence."* The gate is written correctly in prose and wrongly in the specification.

**2. Salesforce accounts are not a secondary ICP — one of them is a customer. [CONTRADICTED]**

`partners.axon.com` CNAMEs to Introw. Axon's own distributor page serves `go.pardot.com` — Salesforce. No HubSpot artifact appears anywhere on the site. Independently re-verified outside the cache.

Across the nine CNAME-confirmed Introw customers in the benchmark: **6 HubSpot, 1 Salesforce, 2 no CRM detectable.** The thesis's "4/4 disclosed stacks are HubSpot" is an artifact of which case studies Introw chose to publish, exactly as its own §F1 warned. HubSpot is the dominant pattern, not a binary gate — and because Salesforce is the *less* detectable of the two, a hard gate would compound a marketing-selection bias with an observability bias in the same direction.

**3. `partner_team_headcount >= 2` is the most expensive gate in the model, not the cheapest. [FAILED ON OBSERVABILITY]**

The thesis: *"a single LinkedIn title count — the least ambiguous, fastest, lowest-cost qualification step in the entire model,"* to be run **first**, before any crawl.

Measured. LinkedIn company people pages return a login wall; profile URLs return HTTP 999. Both are also ToS-constrained. The free alternatives were tested against a ten-company gold set:

- **Company team / about / leadership pages: 1 named partner-persona person across 10 companies.** Sedai's about page lists seven executives — CEO, CTO, CRO, VP Marketing, SVP Engineering, VP Product, VP Engineering — and no partner leader, while Introw's own case study names Sedai's Head of Partners & Alliances. The partner leader sits below the published executive cut, systematically.
- **Company partner pages: 0 named partner-persona people across 10 companies.**

The denominator of the model's primary scoring variable is not observable from free public sources. This is the BOND failure repeating in a new form, caught this time before discovery rather than after.

**4. `partner_leverage_ratio` cannot be the primary scoring variable. [FAILED]**

Numerator: a partner count was directly countable for **5 of 61 reachable companies** by explicit stated count, 24 by any method at all, and 37 not at all. Where it *is* countable, it is a **lower bound, not a census** — Cumulocity's public directory contains 78 entries (extracted from the PartnerPage.io payload) against a company-stated "100+", a ~22% undercount.

Denominator: see (3) — unavailable.

And the threshold is contradicted by Introw's own evidence. The specification calls `>= 20` strong. **Factorial — 500+ partners, 100+ partnership managers — is a ratio of ~5.** Introw's flagship enterprise reference sits in the specification's "weak" band. The ratio is a good *description* of the pain. It is not a computable primary score.

### A.3 What changed in degree

**Partnership events: right about precision, wrong about population. [WEAKENED]**

The thesis promotes event attendance to Tier 1 on founder endorsement, and argues the public subset — exhibitors, sponsors, speakers — "is the higher-intent subset anyway." Measured across eight partnership/channel organisers: 233 people extracted, 70 by clean structured methods, of which **21 (30%) are Tier-1 partner leadership** with usable titles. Precision is genuinely high.

But **26% of the corpus references large-cap employers** — Microsoft, AWS, SAP, Oracle, IBM, Salesforce, BCG, EY, NTT DATA, Mastercard, ServiceNow, Snowflake. Introw's G2 enterprise share is 1.9%.

The refinement matters: Introw buys $50k booths at these events to meet mid-market partner managers *in the aisles*. Those people are attendees, and attendee lists are private. **The published part of the event population is the part Introw does not sell to.** The signal is real; the observable slice of it is systematically the wrong size band. Tier 1 for *person* discovery, not for account prioritisation.

### A.4 What remains unresolved

- **Carve-out / MBO detection.** The thesis's highest-conviction trigger (DSC ×2). No M&A feed or company registry was tested this session. Observability **UNRESOLVED** — and it is the one Tier-1 trigger with no measured basis.
- **The two-manager floor itself.** Founder-stated with churn evidence; I have no way to test it externally and no reason to doubt it. It is the *measurement* that failed, not the rule.
- **U5 — the ~400 unconverted free-tier installs.** Untestable without access. The thesis calls this the highest-leverage action available and I agree; nothing I built beats it.

---

## B. Approved qualification model

The thesis's five sequential hard gates become **one hard gate, three eligibility states, and a routing decision.** The change is forced by measurement: only one of its gates can be evaluated reliably enough to *exclude* on.

### B.1 The single hard gate

```
GATE  transacting_channel_evidence == present
      satisfied by ANY of:
        · a partner subdomain with a vendor-attributable CNAME (strongest)
        · a partner page classified transacting on main content
        · a deal-registration or partner-login surface
        · a countable partner/dealer/installer directory
      AND NOT matched by an active suppression rule (§I)
```

Everything else is a *state*, not a gate.

### B.2 Suppression — hard exclusions that fire before anything else

| Rule | Basis | Measured |
|---|---|---|
| Already an Introw customer (PRM CNAME = introw) | release-critical | 9/69 in benchmark |
| Integration-ecosystem only, no transacting surface | thesis §A5, measured | 4/4 controls suppressed |
| Affiliate/performance-marketing only | thesis §F1 | Semrush correctly suppressed |
| Professional-services equity-partner firm | thesis §A5 | **fails on Deloitte — see §I** |
| Staffing / recruitment marketplace | thesis §A6 | untested (both controls bot-blocked) |

### B.3 Eligibility states, not gates

| Dimension | States | Effect |
|---|---|---|
| **CRM environment** | `hubspot_confirmed` · `salesforce_confirmed` · `incompatible_confirmed` · **`unknown`** | Only `incompatible_confirmed` excludes. `unknown` is the *majority* state and routes to Research, never to exclusion. |
| **Programme scale** | `countable(n)` · `stated(n)` · `present_uncountable` · `unknown` | Ranks; never gates. Always shown with its method. |
| **Partner team** | `verified(n)` · `unknown` | `unknown` is the default. Blocks *GTM Ready*, not *account inclusion*. |
| **Enterprise complexity** | `multi_tier_suspected` | Soft demotion (SAP, Cisco, Schneider all correctly classified transacting — the model must not treat that as a win). |

**The one structural change to make:** the thesis orders gates cheapest-first and fails fast. Measurement inverts the cost order. The correct order is **evidence-density-first**: run the cheap, high-precision, high-availability checks (DNS, CT, Common Crawl, site crawl) across the whole universe, and spend the scarce expensive resource — human research and any licensed people-data credits — only on accounts that already cleared the transacting-channel gate. Gate 0 moves from first to last, and stops being a gate at all.

---

## C. Approved personas

Reconstructed from the thesis, then tested against sources.

| Tier | Persona | Thesis evidence | **Can a source see it?** |
|---|---|---|---|
| 1 | Head/VP Partnerships · Alliances · Channel | DSC ×5 | **Person-first: YES** (events, 21/70 clean extractions). **Company-first: NO free source.** |
| 1 | Partner RevOps / Partner Ops | DSC ×1 + DSI | Person-first: yes, low volume (3–4 in corpus). Company-first: no. |
| 2 | Partner Marketing Manager | DSC ×2 | Person-first: yes, low volume. Company-first: no. |
| 2 | CRO / VP Sales | DSI only, no case study | **Yes** — on leadership pages. The one persona company pages reliably carry. |
| 2 | COO / Founder (small co.) | DSC ×1 | **Yes** — leadership pages. |
| 3 | Growth/BD generalist owning partners (path B) | DSC ×4 | **NO.** Cannot be resolved from titles; requires site attribution that does not exist (0/10 partner pages named a contact). |
| Anti | HR BP · equity partner · corp dev · marketplace mgr · affiliate mgr | RI | **Classifier verified in both directions** (architecture §15.2 lesson applied). |

**The blocking finding, stated plainly:**

> For the company-first question the product is built around — *"who should an Introw seller contact at this account?"* — **there is no viable free public source for the Tier-1 persona.** Company team pages yielded one named partner person across ten companies. Partner pages yielded none. LinkedIn is technically blocked and ToS-constrained. Sanctioned web search resolved one of four attempts.

This is not fatal, but it forces a product decision rather than an engineering one:

1. **Procure a licensed people-data provider** (Proxycurl, People Data Labs, Apollo, Cognism). Requires credentials and budget — **a decision only you can make.** Untested; I have no credentials.
2. **Run person-first as a parallel lane.** Event and community corpora give name + title + employer without any company-first lookup. That population is enterprise-skewed (§A.3), so it seeds *some* accounts well and most badly.
3. **Model `person: unknown` as a first-class state** that routes to Research and blocks GTM-Ready without blocking the account.

Option 3 is mandatory regardless. Options 1 and 2 are additive. **Without option 1, the majority of qualified accounts will reach the queue with no named contact**, and the product's honest answer to "who do I call?" will be "we don't know yet — here is the research task."

---

## D. Signal model

| Signal | Effect | Verdict |
|---|---|---|
| Partner subdomain with vendor-attributable CNAME | **Increase priority; confirms channel; identifies incumbent** | **BUILD — highest value** |
| Introw CNAME detected | **Suppress — existing customer** | **BUILD — release gate** |
| Competitor PRM CNAME detected | Increase priority; route to displacement play | **BUILD** |
| Partner page classified transacting (main content) | Increase priority | **BUILD** |
| Deal-registration / partner-login surface | Increase priority | **BUILD** |
| Partner directory countable | Context + ranking, always with method and "lower bound" label | **BUILD WITH MODIFICATION** (per-vendor payload parsers) |
| Partner directory grew between two dated observations | **Why Now** | **BUILD** — backfill history from Common Crawl, do not wait six months |
| Self-declared programme vocabulary (separate "channel partner" and "technology partner" pages) | Increase confidence in the transacting classification | **BUILD** — the company labelling its own programme beats our lexicon |
| Partner-titled person at a partnership event | Increase priority *for person resolution*; do **not** use as account prioritisation | **BUILD WITH MODIFICATION** |
| Carve-out / MBO / divestiture | Increase priority — highest conviction | **UNRESOLVED — observability untested** |
| CRM artifact (HubSpot/Salesforce) | Priority modifier + environment state | **BUILD, demoted from gate** |
| Integration/app-directory presence | **Suppress** | **DO NOT BUILD as positive** — suppression verified 4/4 |
| Affiliate programme | Suppress | **DO NOT BUILD as positive** |
| Funding | Context only, never timing | **CONTEXT ONLY** |
| Partner-title hiring | Gated behind channel confirmation, deduped | **BUILD LAST** |
| Job-ad tool mentions | Never CONFIRMED | **CONTEXT ONLY** |
| Employee-count band · industry filter · ACV estimate · PRM renewal date | — | **NEVER BUILD** (unchanged from thesis §W) |

---

## E. Observability map

**Reliably knowable:** channel existence · partner-surface inventory · incumbent PRM identity · existing-customer status · programme type (transacting/integration/affiliate) · self-declared partner types · historical partner-surface state (via Common Crawl) · partner count *for a minority*, as a lower bound.

**Knowable with reduced coverage:** CRM vendor (22% of a realistic prospect cohort) · partner count · country/language footprint.

**Not knowable from free public sources:** partner-team headcount · who currently owns partners at a named account · partner-sourced revenue % · partner adoption/login rates · PRM contract renewal date · internal dissatisfaction · deal-registration volume.

**Structural coverage limits, measured:**
- **Bot protection blocks ~10%** of the benchmark outright (7/69: personio, wegive, silverfin, solaredge, bain, upwork, toptal). These are not small companies. Coverage is not a solved problem.
- **DNS wildcards contaminate 16% of domains**, and **53% of naive "subdomain resolves" hits were wildcard noise**. Any subdomain check without a control probe is roughly half false positives.
- **Entity resolution is a real error source, not a footnote.** One benchmark domain (`tensis.io`) was my own mis-mapping from a case-study name and does not exist. That is a 1-in-22 human error rate on a task the pipeline will do thousands of times.

---

## F. Source architecture

Three tiers, ordered by what the measurements justify.

**Tier 1 — build now, all validated this session**
DNS CNAME resolution with wildcard control · passive DNS host enumeration · certificate transparency (certspotter) · company site crawl driven by sitemap + link graph · Common Crawl CDX for historical backfill and cheap per-domain screening.

Passive DNS and CT are **complementary, not redundant** — each found partner surfaces the other missed, and both found surfaces that path probing and crawling could not:

```
found only by passive DNS : partnerprogram.niko.eu · channel.teamleader.eu
                            partnerhub.corp.cumulocity.com · partner-academy.vanta.com
found only by CT          : partners.quatt.io · deal-api.quatt.io
found only by crawling    : loxone.com partner pages (13 surfaces, no partner subdomain at all)
```

Cumulocity is the case that settles the design: **zero partner surfaces by crawling, decisive evidence by DNS.** The best-evidenced customer in the entire thesis is invisible to a crawl-only architecture.

**Tier 2 — build after Phase 0 approval**
Partnership event and community corpora (person-first lane) · vendor-hosted directory payload parsers (PartnerPage.io first) · sanctioned web search as a research aid.

**Tier 3 — requires a decision from you, not engineering**
Licensed people-data provider · Introw's own CRM and free-tier install base · M&A/carve-out feed · company registries.

**Rejected on evidence:** LinkedIn scraping (blocked, ToS) · SERP scraping (CAPTCHA on second call, ToS) · PRM vendor logo pages (thin) · Common Crawl as a *discovery* source (the index is domain-keyed; you cannot ask "which hosts have a `/become-a-partner` page").

---

## G. Detector requirements

Each of these exists because a measurement demanded it.

1. **Wildcard-controlled subdomain resolver.** Probe a random subdomain first; treat only CNAME/A targets that differ from the wildcard as evidence. *Without this, 53% of hits are noise.*
2. **PRM/vendor CNAME fingerprinter**, with an Introw branch that suppresses rather than scores.
3. **Non-production host filter.** `dev.`, `qa.`, `tst.`, `staging.` variants appear alongside real ones (`dev.partnerprogram.niko.eu`). A staging portal is not a portal.
4. **Main-content extractor before lexicon classification.** Ringover's genuine reseller programme classified `integration_only` purely because its mega-nav advertises "100+ integrations". *Site chrome defeats whole-page classification.*
5. **Partner-page ranker that demotes integration pages.** Factorial's top-ranked partner URL was `/integrations-partner-program`; its real one was `/partnerships`.
6. **Directory counter with declared method and a lower-bound label.** Static HTML counting fails on client-rendered directories; the count must carry `method`, `observedAt`, and never be presented as a census.
7. **Vendor-directory payload parsers** (PartnerPage.io / Nuxt payload extraction, `count: 78` on Cumulocity).
8. **Persona classifier with anti-personas resolving first**, verified in both directions on real titles — HR Business Partner, "Managing Partner, Tax", and marketplace/integrations manager all correctly refused; "Global Head, Alliance Ecosystem and Programs" and "Director, Global Partner Programs & Operations" correctly accepted.
9. **Person-record boundary detection.** Flat-text extraction glues adjacent speakers together ("Bauer Senior Director | Global Partner Operations and Programs Frank Hanzlik VP & GM"). Only structured extraction (JSON-LD, heading+sibling) produces trustworthy records; text-derived records must be marked lower confidence or discarded.
10. **Common Crawl history backfiller**, keyed per domain, unioned across collections (single collections are volatile — Enphase returned 7 captures in one and 800 in another).
11. **Bot-block classifier** that records `bot_protection` distinctly from `not_found`. *"We could not look" is not "nothing is there."*

---

## H. Missing-data model

These stay unknown. They are discovery questions and first-party fields, not proxies.

| Fact | State | What the product does instead |
|---|---|---|
| Partner-team headcount | `unknown` unless human-verified | Research task. Blocks GTM Ready. Never estimated. |
| Who owns partners | `unknown` unless verified | Research task. Never inferred from a leadership page. |
| Partner-sourced revenue % | never known | Ships as a discovery question: *"Of the N partners on your site, how many registered a deal last quarter?"* |
| Partner adoption / login rates | never known | Discovery question. |
| PRM contract renewal date | never known | Never estimated. Incumbent detected → time-based nurture. |
| True partner count | `lower_bound(n)` at best | Always labelled with method and date. |
| CRM, where no artifact found | `unknown` — **not** "no CRM" | Research task; does not exclude. |

**The invariant this enforces:** the majority state for most fields on most accounts is `unknown`. A design that treats `unknown` as a gap to be filled will fill it with proxies. The Radar must treat `unknown` as information — it is what tells a seller which question to ask first.

---

## I. False-positive risks, ranked

1. **Professional-services firms with real alliance ecosystems.** Deloitte returned `transacting` across 692 partner surfaces. Equity-partner suppression and alliance-ecosystem detection fire simultaneously and the wrong one wins. *Mitigation: suppress on firm type (industry + "our people/partners" page structure), not on programme lexicon.*
2. **Enterprise multi-tier channel read as fit.** SAP (2,692 partner surfaces), Schneider, Cisco all classify transacting — correctly. The failure is treating a correct classification as a qualification. *Mitigation: an explicit `multi_tier_suspected` demotion, not a stronger classifier.*
3. **DNS wildcards read as portals.** 53% of naive hits. *Mitigated by the control probe.*
4. **Staging/dev hosts read as production surfaces.** *Mitigated by the host filter.*
5. **Site chrome read as programme content.** *Mitigated by main-content extraction.*
6. **Agency/affiliate programmes read as reseller channels.** Kinsta returned `transacting` on a 300-agency programme; genuinely ambiguous and needs a human. *Mitigation: route to Research, do not auto-resolve.*
7. **Entity mis-resolution.** Company name → domain is not a solved mapping (1/22 wrong by hand). *Mitigation: identity must be verified before its evidence is trusted — architecture invariant 26.*
8. **Glued person records** from flat-text extraction. *Mitigation: structured methods only for GTM-Ready records.*

## J. False-negative risks, ranked

1. **Accounts whose channel lives only on a non-guessable subdomain.** Cumulocity — the thesis's best-evidenced customer — is invisible to crawling. *Mitigated by passive DNS + CT.*
2. **Bot-protected companies (~10%).** No mitigation available; must be recorded as `blocked`, never as `no channel`.
3. **Salesforce accounts.** 0% detection on Cohort B, and a confirmed customer (Axon) is one of them. *Mitigated only by removing the CRM hard gate and reserving manual research capacity, per the thesis's own §M.1.*
4. **EU industrials and local-language mid-market.** Loxone, Duco, Niko, Yuki all have real channels; none produced a CRM artifact, none appear in the event corpora, none are findable by the person sources. **This is the segment the thesis calls commercially attractive precisely because competitors miss it — and this radar misses it too, everywhere except channel existence.**
5. **Login-walled portals.** `partners.quatt.io` proves a portal exists and reveals nothing about its size. Correct answer: portal `confirmed`, count `unknown`.
6. **Client-rendered directories** without a vendor parser.
7. **Companies below the published-content threshold.** Bootstrapped, non-VC, small footprint — the BOND observability bias, unchanged.

---

## K. Architecture recommendation

**Do not inherit BOND's shape. Inherit its epistemics.**

Keep: evidence provenance with `retrievedAt` per fact · source authority tiers · verified-facts precedence · the commercial-review layer between model and queue · queue blockers as code · identity resolution before evidence is trusted · raw-universe immutability · graceful degradation · scores re-derived at load · validation as an exit-code gate.

Reject: the YC/Getro discovery universe (structurally cannot see industrials, bootstrapped, or EU local-language companies — four of Introw's six segments) · person-discovery attached to company discovery (the exact failure that produced 648 founders) · additive 0–100 scoring · BOND's signal taxonomy, personas and weights.

**The specific structural changes Phase 0 forces:**

1. **Company-first and person-first are separate lanes with separate sources**, joined by identity resolution — not one pipeline where people fall out of company discovery. This is the single most important architectural decision, and it is the direct lesson of the BOND post-mortem.
2. **`resolveFact()` as a real function, not a coalesce order.** BOND's precedence is procedural and its own handoff calls that debt. Every field carries `{value, evidenceState, method, sourceUrl, observedAt, retrievedAt, confidence, supersedes}` and precedence is structural.
3. **Snapshot store from day one.** Change claims are the product's "Why Now". `firstSeenAt` ≠ `effectiveAt` ≠ `observedAt` ≠ `retrievedAt`, and Common Crawl backfill means history exists at launch rather than in six months.
4. **Research is a first-class object, not a fallback.** Given the persona finding, a large share of qualified accounts will legitimately be "channel confirmed, person unknown". That is a *product state*, and the queue must be able to represent it without either lying or hiding the account.
5. **Storage:** file-based JSON is adequate for a benchmark-scale run and will not survive scheduled re-verification across thousands of accounts with per-field freshness. Build the domain model against a repository interface now; swap the implementation when scale demands it. Do not build the database yet.

---

## L. Design impact

The mockups are strong and the visual direction should be kept. But several primary fields cannot be populated at the confidence the design implies.

| Design element | Verdict |
|---|---|
| Warm off-white palette, editorial type, restrained colour | **Keep.** |
| Radar / Accounts / Signals / Watchlist / Research navigation | **Keep** — and Research becomes more load-bearing than the design assumes. |
| Independent states instead of a 0–100 score | **Keep, strongly validated.** |
| `✓ CHANNEL / ✓ CRM / ✓ TEAM / ✓ LOAD / ✓ TIMING` chip row | **Modify.** Five green ticks will be rare. The row must render `unknown` and `blocked` as first-class visual states, not as missing ticks. On current measurements the modal account is `✓ CHANNEL · ? CRM · ? TEAM · ? LOAD · ? TIMING`. |
| **"186 PARTNERS"** as a headline metric | **Modify.** Countable for a minority; always a lower bound. Must render as `~186 listed` with method and date, and must have a designed `unknown` state — the mockup has none. |
| **"2 PARTNER MANAGERS"** | **Cannot be supported reliably.** Not observable without a licensed people source. Either procure one, or this becomes a research-verified field that is blank by default. |
| **"93× OPERATIONAL LOAD"** as a primary hero metric | **Cannot be supported reliably.** It is a derived metric and inherits the weakest confidence of its inputs — one of which is unavailable. Demote from hero to a conditional field shown only when both inputs are verified. |
| **"HubSpot ✓ CRM · CONFIRMED"** | **Modify.** Correct when true; true for a minority. `unknown` is the majority state and needs equal visual weight. |
| **"CURRENT PRM: PartnerStack · Possible"** | **Keep and upgrade.** DNS CNAME evidence makes this `confirmed`, not `possible`, for a meaningful share of accounts — and it is stronger evidence than anything else on the card. |
| Partner-network growth chart (142 → 186) | **Keep** — supportable via Common Crawl backfill plus own snapshots, provided every point carries its observation date and the axis distinguishes "first seen by radar" from "when it changed". |
| "Who to contact" with three Verified people | **Cannot be supported reliably today.** Design the `unknown` state as the primary state, with a Research call-to-action, not as an empty list. |
| Risks & unknowns panel | **Keep and promote.** It is the most honest element in the design and, on these measurements, the most frequently populated. |

**The design's core assumption is that the account card is mostly full. The measurements say it will mostly be partly empty.** A design that only looks good when full will push the build toward proxies. Design the sparse state first.

---

## M. Benchmark results

Frozen `cohorts.v1`: 22 known customers (A), 20 likely-fit non-customers (B), 17 controls/traps (C), 10 persona gold set (D). Full numbers in `phase0/out/BENCHMARK_RESULTS.md`; methodology and known leakage in `phase0/benchmark/METHODOLOGY.md`.

**Headlines, including the failures:**

- Reachability **61/69 (88%)** · bot-blocked 7 · my own entity error 1.
- Partner surface found on Cohort A: **18/19 (95%)**. Classified transacting/weak: **13/19 (68%)** — five known customers were *not* classified as transacting, including Cumulocity.
- Integration-only suppression: **4/4**.
- Professional-services suppression: **fails on Deloitte**.
- CRM at CONFIRMED standard on the realistic prospect cohort: **22%** · HubSpot **17%** · Salesforce **0%** · unknown **78%**.
- Known-HubSpot customers detected: **2/4**.
- Introw-customer detection by CNAME: **47% recall, 0 false positives**.
- Wildcard noise in naive subdomain checks: **53%**.
- Partner count directly countable: **5/61** explicit, 24/61 by any method.
- Named Tier-1 partner persona on company-owned pages: **1 across 10 companies**.
- Tier-1 personas from event corpora: **21 of 70 clean extractions (30%)**, with a 26% large-cap skew.

**What is ground truth here and what is not:** customer status (A) is ground truth. Trap class (C) is ground truth. Everything else — segment labels, expected verdicts, domain mappings, Cohort B fit — is human judgment, and Cohort B has no labels at all by design. Cohort A leaks: these companies' current portals *are* Introw, so Cohort A measures discoverability and suppression, never timing.

---

## N. Go / No-Go

**CONDITIONAL GO for Phase 1, on the revised model in §B, with two blocking questions for you.**

The commercial thesis is sound about what makes an account interesting. It is wrong about what can be seen. Rebuilding the qualification model around that — one hard gate, states instead of gates, `unknown` as a first-class value — produces a system that is smaller than the mockups promise and defensible in front of a CRO. Building the specified model instead would produce a system that looks complete and is quietly wrong in four places.

**What I recommend proceeding with:** Phase 1 domain model and fixture UX, designed around the sparse account rather than the full one; then the Tier-1 detectors, which are all validated.

**Two blocking questions — genuine decisions, not engineering:**

1. **Licensed people data.** Without a provider (Proxycurl / PDL / Apollo / Cognism, or equivalent), the product cannot answer "who do I contact at this account" for most accounts, and the partner-team gate and operational-load metric cannot be populated at all. Do you want me to design around a provider, or design around `unknown` plus manual research? I have no credentials and have not tested any of them.

2. **Introw's own data — the free-tier install base and CRM.** The thesis's own conclusion (§Y.5, U5) is that cross-referencing ~400 unconverted installs against the two-manager floor outranks any external radar for the first quarter of outbound. Nothing I built this session beats it. If that access is coming, it should shape Phase 1; if it is not, I should stop designing for it.

Neither blocks starting Phase 1. Both change what Phase 1 should optimise for, so I would rather ask once, now, than assume.

---

*Nothing in this report was inferred where it could be measured. Where a source was not tested, it is marked UNRESOLVED rather than estimated. The benchmark was frozen before the first detector ran and has not been edited since.*
