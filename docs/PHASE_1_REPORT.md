# Introw Signal Radar — Phase 1 Report

**Core channel-discovery validation**
**Date:** 21 August 2026
**Frozen sets:** `phase0/benchmark/cohorts.v1.json` (59 classified) · `phase1/benchmark/unseen.v1.json` (56, frozen before any classifier ran)
**Recommendation:** **SEGMENTED GO**

---

## The question, and the answer

> Can we reliably discover meaningful transacting partner programmes from public data, at useful precision and recall, and distinguish them from the dangerous false positives?

**Yes for software, hardware and IT/security vendors. Not yet for the local-language industrial segment.** The gap is not where the thesis predicted: classification is strong and it is *discovery plumbing* — entity resolution and locale-aware crawling — that fails on industrials.

Two numbers carry the verdict. On 17 deliberately-chosen traps, **zero false positives**. On 56 companies produced by the discovery mechanisms and never seen by a classifier, **22 were classified transacting and all 22 survive manual inspection** — Anomali, A10, AvePoint, Corelight, Commvault, Deep Instinct, ExtraHop, Fluke, Forcepoint, Gigamon, Illumio, Huawei, NetApp, Nokia, Nutanix, Opengear, Proofpoint, Microsoft, Riverbed, Semperis, Sophos, Rooms. Every one operates a real reseller or distributor channel.

---

## 1. Channel discovery verdict

**Discovery works, and the mechanism that works is not one the thesis named.**

Four mechanisms were built and measured. Discovery deliberately excludes YC, funding feeds and ATS boards — those define a universe by financing rather than by channel motion.

| Mechanism | Candidates | Verdict |
|---|---|---|
| **M1 · Distributor inversion** | **1,170** | **BUILD — the backbone** |
| M2 · Partner-directory harvest | 3 | DO NOT BUILD as implemented |
| M3 · Platform tenancy (CT on vendor domains) | 9 | CONTEXT ONLY — precise but sparse |
| M4 · Sanctioned web search | — | Research aid only |

**Distributor inversion** is the finding. A distributor's published vendor list is a near-tautological channel-motion list: if a distributor sells your product, you operate a transacting channel. Three seeds produced 1,170 candidates:

```
exclusive-networks.com/ecosystem/vendors      73 vendors   cybersecurity, EN
infinigate.com/vendors                       106 vendors   IT/security, EN
cebeo.be/catalog/nl-be/brand                 991 brands    electrical industrial, NL
```

It reaches the segments the thesis says are commercially attractive and structurally invisible: **Cebeo alone yields 991 manufacturer brands in Dutch**, including Niko — one of my own independently-chosen Cohort B picks. Exclusive Networks yields Cubbit, a known Introw customer, discovered from nothing but a distributor's vendor page.

**Partner-directory harvest failed** and the reason is instructive: the directories worth harvesting are client-rendered, so an HTML link scrape returns nothing. It also answers a slightly wrong question — a vendor's partner directory lists channel *participants*, and Introw sells to channel *operators*.

**Platform tenancy** found 9 tenants on `introw.io` (including ZutaCore and Rooms). Precise but sparse: most tenants use a custom domain CNAMEd to the vendor, whose certificate is issued under the *customer's* domain and therefore never appears under the vendor's.

## 2. Classification verdict

**Classification is the strong half of the system.**

| Measure | Result |
|---|---|
| Trap precision (Cohort C, 17 deliberate traps) | **17/17 not flagged (100%)** |
| Unseen precision (56 never-classified companies) | **22/22 apparent, on manual inspection** |
| Cohort A recall — auto-classified transacting | 16/22 (73%) |
| Cohort A — surfaced as a candidate | 18/22 (82%) |
| Cohort A — surfaced, excluding unreachable sites | **17/19 (89%)** |
| Suppression false-positive rate | **0/2 fires** (was 4/6 before the fixes below) |

Two things make this work, and neither is a weight:

**Corroboration.** A single strong signal never produces `transacting`. It produces `unknown` with rule `single_strong_uncorroborated`, which routes the account to Research rather than rejecting it. That is why surfacing (82%) is higher than classification (73%) — those accounts are not lost, they are queued for a human.

**Decisive artifacts.** A published deal-registration process and a partner subdomain served by a partner platform are treated as decisive alone, because those artifacts do not exist where partners do not transact. 30 of 115 companies (26%) were decided this way.

## 3. Benchmark results

```
Coverage          105/115 reachable (91%) · 9 bot-blocked · 1 dead domain
                  Common Crawl recovered URL inventory for 5 of the 10 unreachable
Inventory sources site=105 · common_crawl=43 · passive_dns=13 · cert_transparency=4
Evidence          82% of companies produced some channel evidence
                  57% produced STRONG first-party evidence
Language          en=191 · de=24 · nl=5 · fr=2 evidence matches
Partner count     unknown=90 · lower_bound=23 · directory_count=1 · exact_public=1
```

**Cohort A misses, all six:**

| Company | Verdict | Why |
|---|---|---|
| ringover.com | `single_strong_uncorroborated` | Real programme; one corroborating class short. Surfaced for research. |
| zenity.io | `single_strong_uncorroborated` | Same. Surfaced for research. |
| xelix.com | `insufficient_evidence` | Genuinely thin public partner page. |
| payflip.be | `insufficient_evidence` | Genuinely thin public partner page. |
| personio.com | `insufficient_evidence` | Bot-blocked. Inventory recovered, page content not. |
| tensis.io | `insufficient_evidence` | Domain does not resolve — my own Phase 0 entity error. |

## 4. Discovery-source comparison

| Source | What it proves | What it cannot prove | Verdict |
|---|---|---|---|
| Distributor vendor lists | a distributor sells this company's product | that the company runs the downstream programme itself | **BUILD** |
| DNS CNAME on partner hosts | the partner surface runs on a named platform | absence — a missing fingerprint is never "no platform" | **BUILD** |
| Passive DNS + certificate transparency | which partner-shaped hosts exist | that they are production, or in use | **BUILD** (union both; each finds what the other misses) |
| Site crawl (sitemap + link graph) | what the company publishes | anything behind a login or a locale gate | **BUILD** |
| Common Crawl CDX | a per-domain URL history, without touching the target | current state | **BUILD** — the only thing that reached bot-blocked companies |
| Partner-directory harvest | organisations a vendor calls partners | that they are operators rather than participants | rebuild against payloads, or drop |
| Platform tenancy via CT | a tenant subdomain exists on a vendor | the customer base — most use custom domains | **CONTEXT ONLY** |

## 5. Evidence taxonomy — what is actually strongest

Measured frequency of strong evidence classes across 115 companies:

```
PARTNER_PORTAL        39     DEAL_REGISTRATION     21     PARTNER_DIRECTORY   15
TECH_INTEGRATION      21     DISTRIBUTOR_LANGUAGE  19     PRM_FINGERPRINT     14
RESELLER_LANGUAGE     14     PARTNER_TIERS          8     APP_MARKETPLACE      7
DEALER_LANGUAGE        5     AFFILIATE              5     COMMISSION           3
REFERRAL_LANGUAGE      2     INSTALLER_LANGUAGE     2
```

The two artifacts that carry the most weight per unit of engineering are **PRM_FINGERPRINT** (DNS, zero false positives, 14 hits including four *competitor* platforms) and **DEAL_REGISTRATION** (a process that cannot exist without a channel).

`PARTNER_PORTAL` is the most common strong class but the weakest of the strong ones — a portal proves a gated surface exists, not that anything transacts through it. It never decides a verdict alone.

**Four competitor platform fingerprints were found in the unseen set** — Allbound at ExtraHop and Semperis, Impartner at Nokia and Proofpoint. PRM displacement is a detectable segment, not a nurture hope.

## 6. False positives — representative failures, and the fixes

Seven defects were found by measurement. Each fix is a general rule, not a patch for one company, and each is covered by a regression test.

| Failure | What actually happened | Generalisable fix |
|---|---|---|
| **Firm-type suppression fired on ordinary copy** | SafeBreach — a cybersecurity company — was suppressed as a *law firm*. PostHog and Keeper Security as *investment firms*. Kinsta as a *staffing marketplace*. 4 false fires out of 6. | Patterns must match **self-description** in the identity region, and **two distinct indicators** are required. Never suppress over a decisive artifact. |
| **Deloitte classified transacting** | From pages about *SAP's* value-added reseller programme, which Deloitte participates in. The reseller language was real and belonged to another company. | **Participant-page detection**: transacting evidence found under `/alliances/<vendor>/` is demoted to weak. The channel may belong to that vendor. |
| **Ringover classified integration-only** | A genuine reseller programme lost to its own mega-nav advertising "100+ integrations". | `integration_only` requires **zero** strong transacting evidence. Integration is counter-evidence; it cannot outvote a positive artifact. |
| **Xelix classified strategic-only** | One passing alliance mention produced a confident class. | `strategic_only` requires corroboration, else `unknown`. |
| **Anthropic classified transacting** | Via a Salesforce Experience Cloud CNAME treated as a PRM. | Experience Cloud is a general community platform, not a PRM — removed from the decisive vendor list. |
| **Loxone spent its whole budget on one section** | Six children of `/nlnl/installateur/` fetched; the programme page never was. | **Diversify**: at most two URLs per host-and-path prefix. |
| **Schneider fetched two PDF endpoints** | Ranking put `/download/document/RESELLER_AGREEMENT/` first. | Exclude asset and download paths; penalise depth; ignore locale segments as depth. |

**One case is not a classifier failure and was deliberately not "fixed":** SAP operates one of the largest reseller channels in existence, so calling it transacting is *correct*. It is nonetheless a poor Introw account because multi-tier distributor governance sits outside Introw's design. That is a prioritisation problem, so the demotion lives in a separate `multiTierSuspected` dimension — 14 companies carry it — rather than in the classifier. Tuning the classifier to call SAP "not transacting" would have been false, and would have been benchmark-memorisation.

## 7. False negatives — representative misses

| Class | Example | Fixable? |
|---|---|---|
| **Entity resolution on industrial brands** | 6 of 21 industrial candidates resolved to parked or dead domains; `bata.com` resolved to a shoe company | Partly. Hyphenated and first-token variants already recovered Pepperl+Fuchs and Lapp; ampersand names (`BRAD & HARRISON`) remain unresolved. |
| **Bot protection** | 9 of 115 companies | No. Common Crawl recovers the URL inventory for about half, but not page content. |
| **Thin public partner pages** | Xelix, Payflip | No. Some companies genuinely publish almost nothing. |
| **One-signal companies** | Ringover, Zenity | Not a miss by design — surfaced to Research. |
| **Locale-gated multi-country sites** | ifm.com: 13,119 URLs, homepage is a country selector | Partly fixed by locale-root following; large industrial sites still defeat it. |
| **Login-walled directories** | `partners.quatt.io` | Portal confirmed, count unknowable. Correct behaviour. |

## 8. Segment differences — the reason this is a SEGMENTED GO

Measured on the frozen unseen set:

| Segment | n | Classified transacting | Surfaced | Got any partner page | Dead/wrong domain |
|---|---|---|---|---|---|
| Cybersecurity | 16 | 11 (69%) | 12 (75%) | 13 | 2 |
| IT / security | 15 | 9 (60%) | 12 (80%) | 13 | 2 |
| **Electrical / industrial** | **21** | **1 (5%)** | **2 (10%)** | **4** | **6** |
| PRM tenants | 4 | 1 | 1 | 2 | 2 |

The industrial gap decomposes into three causes, and only one of them is about channel evidence:

1. **Entity resolution (≈8 of 21).** Parked domains, wrong entities, ampersand names. A plumbing problem.
2. **Locale-gated and very large catalogue sites (≈5).** ifm.com, Ecodora, Circutor: thousands of URLs, none reachable from the homepage.
3. **Genuine non-publication (≈8).** Small manufacturers with no public partner surface at all.

Only (3) is a real observability limit. (1) and (2) are engineering, and they are where the next effort belongs.

**A second industrial-specific trap was measured:** these sites use channel words as *product* nouns — `/prodotti/.../distributori-pneumatici/` is pneumatic distributors, not distribution. Product paths are now excluded, which is a rule the software segment never needed.

## 9. Partner-count feasibility

**2 of 115 (2%) produced a usable count.** This is worse than the Phase 0 estimate and it is the honest number.

```
unknown          90     the majority state
lower_bound      23     partial enumeration, pagination not exhausted
directory_count   1     cumulocity.com — 78 partners, from the PartnerPage.io payload
exact_public      1     teamleader.eu — 438 partners, stated by the company
```

The one directory count is worth noting: `partnerlisting.corp.cumulocity.com` was found by passive DNS, ranked only after the ranker learned to read *hostnames* as well as paths, and counted by parsing a Nuxt payload. Three separate mechanisms had to work for one number. That is the cost of a partner count, and it explains the 2%.

**The count type is part of the value.** A lower bound, an approximate figure and an enumerated directory must never render identically — Phase 0 measured a 22% gap between Cumulocity's public directory (78) and its own stated figure ("100+").

## 10. CRM update

No improvement, and no attempt at one. CRM detection remains what Phase 0 measured — roughly 22% at CONFIRMED standard on a realistic prospect population. Per the revised assumptions it is now a priority modifier and an environment state, never a gate, and `unknown` neither suppresses nor excludes. Further engineering against an inherently low-observability field is not warranted.

## 11. Person strategy without licensed data

Unchanged from Phase 0 and not re-litigated: no free public source resolves a Tier-1 partner persona from a company name. The system therefore ships a **provider-agnostic `PersonProvider` interface** and a `Person` record carrying raw title, normalised title, persona, role currency, role dates, source, confidence and `verifiedAt`. No vendor response shape reaches the domain model.

Until a provider exists: `person: unknown` is a first-class state that routes to Research and blocks GTM-Ready without blocking the account. The persona classifier is built and verified in both directions — HR Business Partner, "Managing Partner, Tax" and Marketplace Manager correctly refused; "Global Head, Alliance Ecosystem and Programs" correctly accepted.

## 12. Revised domain model

`src/domain/types.ts`. Two rules govern every type:

**A value is never stored bare.** `Fact<T>` carries `{value, state, confidence, method, sources[], observedAt, supersedes?}`. `EvidenceState` is `confirmed · strong_proxy · weak_proxy · contradicted · unknown · blocked`, and `blocked` is distinct from `unknown` because "we could not look" is not "there is nothing there".

**`unknown` is a value, not a gap.** Entities: `CompanyIdentity` (with `identityState: resolved | ambiguous | unresolved`, because resolution is a measured error source) · `PartnerProgram` · `PartnerCount` (with `countType` and `enumerationComplete`) · `Environment` · `Person` · `PartnerOrganisation` (with `teamSizeState`) · `OperationalLoad` (with `availability` and `unavailableReason`) · `Signal` (with `effectiveAt` separate from `observedAt`, `firstSeenAt`, `lastSeenAt`) · `ResearchTask` · `RelationshipState` · `Qualification`.

`RelationshipState` has no `not_customer` member. Absence of an Introw fingerprint is `no_evidence_observed`.

## 13. Minimal UX contract

Fourteen fixtures, each existing to prove one state renders honestly. Verified in the browser.

The account card has **no fixed metric slots**. It leads with whatever is strongest and renders unknown states at equal visual weight:

- Partner count unknown reads *"Not established — no countable directory found; this is not a claim that the network is small"*, not an empty box.
- Team size unknown reads *"No partner owner identified. Company-owned pages do not normally name this role."*
- **Operational load appears only when both inputs are independently reliable** — 1 of 14 fixtures. Otherwise it is absent, with the reason available in the drawer.
- Suppressed accounts stay visible with the suppression reason stated.

The fixture header reports its own sparseness: 8 of 14 channel-confirmed, 8 of 14 CRM unknown, 11 of 14 team size unknown, 1 of 14 with a computable operational load. That is roughly the real distribution, and designing against it is the point.

## 14. Research workflow

Research is a first-class object, not a fallback. Tasks carry the missing field, why it is missing, a **suggested method**, and a priority — so a task is actionable rather than a complaint. The realistic per-account human budget is 2–5 minutes to resolve CRM, the partner owner, or a contested count.

The system's job is to reduce how many accounts need that, not to eliminate it. On current numbers roughly half of surfaced accounts will carry at least one open research task.

## 15. Recommended detector roadmap

Ordered by measured value, not by the original assumptions.

1. **Distributor-inversion harvester** — the discovery backbone. Add EU wholesalers per segment (HVAC, plumbing, solar, industrial automation) to reach the industrial market in its own languages.
2. **Entity resolution v2** — the single highest-leverage fix. It is currently the largest cause of industrial false negatives, ahead of any evidence problem.
3. **PRM/platform CNAME fingerprinter** — highest precision per unit of effort. Already yielding competitor displacement targets.
4. **Locale-aware crawler for multi-country sites** — partly built; large catalogue sites still defeat it.
5. **Vendor-directory payload parsers** — PartnerPage.io done; the count problem is otherwise unsolvable at scale.
6. **Common Crawl history backfill** — turns a static count into a dated change, which is the only honest route to "Why Now".
7. Carve-out / M&A watch — still **UNRESOLVED**; no feed tested in either phase, and it remains the highest-conviction trigger with no measured observability basis.
8. CRM detector — maintain, do not invest.

## 16. Architecture changes forced by validation

- **Discovery and classification are separate subsystems** with separate measurement. Conflating them hides which half is failing.
- **Three complementary URL inventories, always union'd.** Each found surfaces the others missed. Cumulocity produces zero partner surfaces to a crawler and decisive evidence to DNS.
- **Rank on hostname as well as path.** A dedicated partner host carries its signal in the hostname; scoring only the path silently discarded the best directory a company had.
- **Suppression operates at company level and never over a decisive artifact.**
- **Verdicts carry their rule and rationale.** Every classification returns the named rule and a sentence a reviewer can disagree with. There are no weights, because there is no conversion data to fit them against.
- **Scale and complexity are a separate dimension from commerciality.** SAP forced this and it is the right shape.

## 17. Product and design changes

Beyond the Phase 0 conclusions, Phase 1 adds:

- **`single_strong_uncorroborated` needs its own product state.** It is neither qualified nor rejected. In the UI it is a Research candidate with the one signal shown and the missing corroboration named. Without it, 2 of 22 known customers would silently vanish.
- **Partner count needs four visual treatments, not one** — exact, enumerated, lower bound, approximate — plus a designed unknown. On measured data the unknown treatment is used 78% of the time.
- **Suppressed accounts remain visible.** A suppression the seller cannot see is indistinguishable from a bug.
- **The multi-tier flag needs surfacing.** Fourteen companies are correctly transacting and wrong for Introw. A card that shows only "transacting channel" is telling a true and misleading story.

## 18. Recommendation

### SEGMENTED GO

**Proceed for software, hardware and IT/security vendors.** Discovery produces a genuine candidate universe from channel motion rather than from financing; classification separates real channels from the dangerous traps at 100% trap precision and 22/22 apparent precision on unseen data; and the evidence is defensible to a seller because every verdict carries its rule and its sources.

**Do not yet claim the industrial segment.** It classifies at 5% versus 60–69% for software. The cause is mostly fixable plumbing — entity resolution and locale-aware crawling — but it is not fixed today, and the honest position is that the radar currently sees the industrial market poorly. This matters because that segment is where the thesis argues Introw is *least* contested.

**What would move this to a full GO:** entity resolution good enough that a Belgian wholesaler's brand list becomes a usable account list, and a locale-aware crawler that reaches partner pages on multi-country catalogue sites. Both are bounded engineering against a measurable target — the same 21 industrial companies, already frozen.

**What would move it to NO-GO:** if industrial resolution and locale crawling were fixed and the segment still classified below ~30%, the conclusion would be that these companies genuinely do not publish channel evidence, and the radar should be scoped to software and IT explicitly rather than quietly under-serving everything else.

---

*Measured, not asserted. Frozen sets were not edited after results were seen. The one benchmark label I believe is wrong — Anthropic, labelled a small-strategic-alliances trap, which publishes referral-partner programme terms — is reported here rather than corrected in the frozen file.*
