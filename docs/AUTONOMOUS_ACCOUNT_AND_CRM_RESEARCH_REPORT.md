# Autonomous Account Discovery & CRM Forensics

**Mandate 8 · discovery batch, deep fit research, CRM forensic layer**
2026-08-24 · deployed to https://introw-signal-radar.vercel.app/

---

## 01 Executive Verdict

**CRM FORENSICS GO / DISCOVERY SHADOW.**

The CRM layer changed from a by-product into a research capability, and it earned production.
Discovery ran autonomously and produced real companies, but nothing in this run changes the
reason it stays hidden.

**What CRM forensics fixed.** The old layer asked two narrow questions — what does the website
serve, and what does the current job board say — and answered "unknown" for everything else.
It reached an attributable ATS board on **20%** of accounts and stopped there. The new layer
reads the company's own careers pages and careers subdomains when no board exists, keeps
historical vacancies as historical evidence instead of discarding them, and treats any
commercial vacancy as valid: **244 vacancies read across 35 accounts, 235 of them in roles
unrelated to partnerships, 25 accounts reached with no ATS board at all**.

**What it corrected.** Ten production accounts read "HubSpot confirmed" on the strength of a
tracking script. A script proves a script is installed. Those are now **supporting evidence
only**, and the evidence is retained rather than deleted. One account, Aircall, flipped
outright: a DACH BDR advert says *"Keeping your pipeline and activities up to date in
Salesforce"*, so it now shows **Salesforce confirmed current alongside a HubSpot website
artifact**, reported as a multi-system environment rather than resolved to one vendor.

**What validated it.** A frozen language holdout (sha256 `39cb06c4b051b676`) scores **20/20
with zero false confirmations and zero over-current classifications**. An adversarial audit of
every decisive conclusion caught **two real false positives** — "Salesforce Admin knowledge is
a plus" read as possession, and a careers *feed* concatenating many adverts confirming a CRM
under "All job roles". Both are fixed and regression-tested.

**Discovery.** 12 queries in 6 languages produced 99 results and **42 new companies**, fully
researched with no cheap gate: **7 plausible fit, 20 research required, 2 likely not fit, 13
under-observed, 0 suppressed**. But CRM forensics established **zero decisive conclusions
across all 42** — these are smaller European vendors whose careers pages are thin or
JavaScript-rendered. Discovery works as a research-universe builder. It does not yet produce
accounts a seller could act on without a person in the loop, so `DISCOVERY_VISIBLE` stays off.

No score, no ranking, no GTM queue.

---

## 02 Discovery Run

12 queries, 6 languages, 8 query families, 99 results.

| | |
|---|---|
| results returned | 99 |
| valid operators | 42 (fresh) + 20 already known |
| participants only | 6 |
| consultants / partner-tech vendors | 4 |
| irrelevant (press, registries, listicles, law) | 25 |
| duplicates against everything previously seen | 20 |
| same corporate group collapsed | 1 (AVG / Avast) |

Every candidate carries a discovery provenance (§29). No company name appears in any query,
and each fresh domain was checked mechanically against the 247 domains this project has used
in any benchmark, corpus or prior run.

**Lowest-yield query of the batch**, reported rather than buried: the Nordic machinery search
returned mostly *dealers* rather than the manufacturers that appoint them — the
operator/participant inversion, arriving exactly where §32 predicts.

## 03 Geography Coverage

| geography | new companies |
|---|---|
| DACH | 11 |
| UK | 6 |
| France | 6 |
| US / global | 6 |
| Italy | 5 |
| US | 2 |
| US / Canada | 2 |
| Benelux | 2 |
| Nordics | 2 |

Benelux is the weak spot and the reason is known: **both Dutch query families are disabled**
on measured precision (25% and 29%), so Benelux is reached only through English, German and
French queries. This is stated rather than papered over.

## 04 Sector / Motion Coverage

software 24 · manufacturing 7 · IoT/hardware 6 · industrial 3 · cybersecurity 2.

Software dominates because software vendors publish partner programmes in the vocabulary the
validated families use. That is a property of the queries run, not a claim that software is a
better segment, and no sector balancing was applied in either direction (§56 of mandate 7).

## 05 Valid Operators

42 fresh companies, each judged on whether its landing page evidences a programme the company
runs **itself**. Participants — a distributor running someone else's MSSP ecosystem, a Swedish
reseller carrying SANY, an agency advertising its own JTL badge — were labelled as
participants and excluded from the research batch.

## 06 Introw Relevance Outcomes

| state | n | share |
|---|---|---|
| research_required | 20 | 48% |
| under_observed | 13 | 31% |
| **plausible_introw_fit** | **7** | **17%** |
| likely_not_fit | 2 | 5% |
| suppress | 0 | 0% |

Every state carries written reasons. `likely_not_fit` was used twice and both times on
positive negative evidence, never on sparse evidence — sparse evidence is `under_observed`.

## 07 New Plausible Accounts

| company | geography | evidence |
|---|---|---|
| **korewireless.com** | US/global, IoT | 5 workflows: recruitment, application, enablement, deal registration, portal |
| **expo-e.uk** | UK, software | 4 workflows: recruitment, onboarding, portal, programme tiers |
| **firstcomeurope.co.uk** | UK, software | 4 workflows: recruitment, enablement, portal, programme tiers |
| **myfactory.com** | DACH, software | 4 workflows: recruitment, certification, partner portal |
| **avast.com** | Benelux reach, software | 3 workflows: recruitment, deal registration, portal |
| **lumen.com** | UK, software | 3 workflows: recruitment, referral submission, portal |
| **ebp.com** | France, software | 2 workflows: recruitment, certification |

Five of seven have unknown CRM, and that does not weaken them: §34 is explicit that unknown
CRM must not reject, and unknown is the majority state for public research.

## 08 Existing Accounts Re-enriched

All 35 production accounts were re-researched. Existing evidence was carried forward, not
replaced (§26).

| change | n |
|---|---|
| UNKNOWN → CONFIRMED | 1 (payfit.com → Salesforce confirmed current) |
| vendor changed on stronger evidence | 1 (aircall.io: HubSpot → Salesforce, with HubSpot retained) |
| over-claim corrected to supporting | 8 |
| confirmed, unchanged | 1 |
| conflict discovered | 1 |
| still unknown | 20 |

Level distribution after: confirmed_current 3 · strong_supporting 11 · mention_only 1 ·
unknown 20.

**The eight corrections are the most consequential result here.** cegeka, cubbit, foleon, juro,
leapsome, mews, productsup and trengo all previously rendered as "HubSpot confirmed" from a
website artifact whose own *doesNotProve* line said the artifact proves nothing about the CRM
of record. They are now supporting evidence. Apparent certainty went down; honesty went up.

## 09 CRM Research Architecture

```
ATS BOARDS ─────────┐
CAREERS PAGES ──────┤
CAREERS SUBDOMAINS ─┼──► OBSERVATIONS ──► TEMPORAL RESOLUTION ──► SELF-AUDIT ──► VENDOR STATE
HISTORICAL VACANCIES┤     (vendor, basis,   (current/recent/       (§47)          + CONFLICT
WEBSITE FINGERPRINTS┘      quote, dates)     historical)
```

Each observation records vendor, source type, language basis, quote, source URL, `observedAt`,
`sourcePublishedAt`, job title, the rule that fired, and both *proves* and *does not prove*.

## 10 Current Jobs

A live advert on a company's own board is treated as current **by virtue of being served**,
even when undated. Three decisive conclusions, all current, all from ordinary commercial roles:

| company | vendor | role | quote |
|---|---|---|---|
| payfit.com | Salesforce | Sales/SDR Barcelona | *"Keeping clear and relevant information about potential customers up to date in Salesforce, **our CRM**."* |
| aircall.io | Salesforce | BDR, DACH Market | *"Keeping your pipeline and activities up to date in Salesforce (full training provided)."* |
| aikido.dev | HubSpot | Account Executive Enterprise UK | *"Maintain an accurate forecast and disciplined pipeline management in HubSpot."* |

## 11 Historical Jobs

Historical vacancies are now **read and kept** rather than discarded. The temporal model gives
them their own levels: `confirmed_recent` (≤2 years) and `confirmed_historical` (older), with
`confirmed_current` reserved for ≤9 months or a live board.

**Zero historical-only conclusions were produced in this run.** Companies' own careers surfaces
serve current adverts; genuinely archived vacancies live on mirrors and indexes this pipeline
reaches only through search, which §12 shows to be low-yield. The capability is built, holdout-
verified in both directions, and currently under-exercised — stated plainly rather than
presented as coverage.

## 12 LinkedIn / Public Indexed Evidence

Four targeted searches were run on accounts that programmatic research left unknown.

**New CRM conclusions: 0. False positives avoided: 3.**

| company | what search surfaced | correct reading |
|---|---|---|
| channable.com | generic RevOps job boards, HubSpot's own docs | no evidence |
| factorialhr.com | *"CRM tool familiarity with Salesforce or HubSpot"* | §18 alternatives — proves neither |
| apaleo.com | *"Apaleo integrates with HubSpot"* | §19 customer integration — not internal use |
| efficy.com | Efficy-vs-HubSpot comparison pages | §32 is-a-vendor, not uses-a-vendor |

This is a real finding about the source class. Company-name-plus-vendor queries return
comparison pages, integration blogs and category listicles far more often than a company's own
operational language. Search should **locate sources to read**, not establish state from
snippets — which is what §45 already requires, now supported empirically.

LinkedIn was never depended on and no anti-bot control was bypassed.

## 13 ATS Coverage

| | existing 35 | new 42 |
|---|---|---|
| attributable ATS board | 7 (20%) | 2 (5%) |
| any vacancy read | 31 (89%) | 23 (55%) |
| **reached without a board** | **25** | **21** |
| vacancies read | 244 | 95 |

The 22% board-reach limitation is resolved as a *terminating* condition. A missing board is now
a fact about routing, not a verdict about the company.

New companies show lower reach because they are smaller and more European: many serve careers
pages through JavaScript frameworks that return an empty shell to this pipeline.

## 14 Non-ATS Job Discovery

Careers surfaces are found by probing a bounded set of paths across six languages
(`/careers`, `/vacatures`, `/karriere`, `/emplois`, `/lediga-jobb`, `/lavora-con-noi` …), then,
if nothing yields links, by probing careers **subdomains** (`careers.`, `jobs.`, `work.`).
Only same-registrable-domain links are followed, so a careers page linking to a partner's board
cannot pull another company's vacancies into this dossier.

Path probing is capped at 8 landing attempts and stops at the first page that yields job links
— an earlier version spent its entire request budget enumerating spellings of "careers" before
reading a single advert.

## 15 HubSpot Findings

- **1 confirmed current**: aikido.dev, from an Enterprise AE advert.
- **11 supporting**: 10 corrected down from "confirmed", 1 from a fingerprint carried forward.
- HubSpot remains the most *fingerprinted* vendor and the least *confirmed* one, which is the
  expected consequence of §20: HubSpot's marketing tooling is installed far more widely than
  its Sales Hub is used.

## 16 Salesforce Findings

- **2 confirmed current**: payfit.com and aircall.io, both from ordinary sales roles.
- Salesforce is almost never detectable from a website fingerprint, so the old layer detected
  it **zero times**. Hiring evidence is the only route that works for it, and this run found
  two accounts the previous method could not have.

## 17 Other CRM Findings

None reached a decisive level. Dynamics, Pipedrive, Zoho, SugarCRM, Attio, Close and Copper are
all detected by the classifier and holdout-verified — Dynamics and Zoho both classify correctly
on possession language, and Dynamics is specifically guarded against matching "market dynamics".
No account in this corpus evidenced one.

## 18 Historical CRM Findings

Zero, as explained in §11. The mechanism is verified by holdout: a 2023 advert saying *"manage
all opportunities in Salesforce"* classifies as `confirmed_historical` and cannot become
current, and a two-year-old strong source classifies as `confirmed_recent`.

## 19 CRM Conflicts

**One: aircall.io.** Salesforce `confirmed_current` from a BDR advert, HubSpot
`strong_supporting` from `js.hs-scripts.com`. Reported as *multiple systems*, with the
explanation that a marketing-versus-sales split, a migration and a departmental system all
produce this pattern and nothing here distinguishes them.

Transition detection exists and requires a non-overlapping chronology with more than six months
of separation. It did not fire, and claiming a migration without that chronology is exactly
what §23 forbids.

## 20 CRM Unknowns

20 of 35 existing accounts and 30 of 42 new ones remain unknown. Unknown is preserved as a
first-class state and is never rendered as "no CRM". Every unknown carries what was consulted,
so "we looked and found nothing" is separable from "we did not look".

## 21 Evidence Precision

| | result |
|---|---|
| language holdout | **20/20** |
| false confirmations | **0** |
| over-current classifications | **0** |
| missed confirmations (safe direction) | 0 |
| false positives caught by adversarial audit | **2**, both fixed and regression-tested |
| decisive conclusions surviving audit | 3, each traced to one sentence |

## 22 CRM Holdout

`crm-holdout/language.v1.json`, sha256 `39cb06c4b051b676`, frozen before the classifier was
wired to the forensic layer.

20 cases covering possession, operational duty, candidate experience, alternatives lists,
customer integration, current/recent/historical dating, snippet and fingerprint ceilings,
mirror downgrading, undated live boards, the "market dynamics" false friend, generic CRM
language, and Dutch and German possession.

Ground truth derives from the mandate's own stated semantics (§13–19, §45–46), not from my
judgement about any company — which is what makes it defensible and stable as the web changes.

**One fix was made after seeing results** and is disclosed: `"Own HubSpot administration,
including workflows"` was classified as a category example because "including" appeared
anywhere in the sentence. The rule now requires the marker to *precede* the vendor. The failure
was in the safe direction (a miss, not a false confirmation), and the holdout was re-run once.

## 23 False Positives

Two decisive conclusions were wrong and the adversarial audit caught both.

**`planhat.com` — "Salesforce Admin knowledge is a plus"** was read as company possession. The
noun-binding possession rule included `admin` and `crm`, and possession is tested *before*
requirement framing, so a candidate skill became a confirmed CRM. Those two nouns are product
descriptors, not possessions; they were removed. `Salesforce instance`, `HubSpot workspace` and
the possessive forms still confirm.

**`canonical.com` — a careers feed.** `/careers/feed` concatenates every open role into one
document, so a Salesforce sentence from one advert attached to the whole page and was reported
under the job title "All job roles | Canonical Careers". Index and feed pages are now a
distinct source class that may support but never confirm, and pages carrying three or more job
links are detected as indexes.

Both are now regression tests. Both were false *confirmations* — the error class §49 names as
most damaging — and both are gone.

## 24 False Negatives

The system is deliberately biased toward these, and the cost is visible: **50 of 77 researched
companies have no CRM conclusion**. Known contributors:

- **JavaScript-rendered careers pages.** mews.com serves a 438-character shell; its real board
  is not reachable by this pipeline.
- **Careers subdomain fallback is too conservative.** It fires only when path probing found no
  job links at all, so a site with one weak link never reaches its real board.
- **Search forensics adds nothing** (§12), so accounts whose evidence exists only in indexed
  archives stay unknown.
- **Companies that simply never name their CRM.** A company can run Salesforce for a decade and
  never mention it in an advert.

## 25 People Evidence

Not attempted. Public person discovery was measured at 2 of 18 companies in an earlier phase
and is not viable without a licensed provider. `peopleObserved` is wired into the fit model and
reads 0 everywhere; absence is treated as unknown and never as a negative (§31).

## 26 PRM Evidence

Detection is unchanged and the distinction holds: **is a PRM vendor** suppresses as a category
mismatch; **uses another PRM** is displacement and maturity evidence and is explicitly not a
disqualifier — asserted by test. kiflo.com renders as a direct competitor and recovery adding a
motion to it did not override the suppression.

## 27 Research Cost

| | |
|---|---|
| existing accounts | 747 requests, 244 vacancies, ~70s per account |
| new companies | 42 full dossiers + CRM forensics, ~70s per account first run |
| discovery | 12 searches → 99 results → 42 fresh operators |
| search forensics | 4 searches → 0 conclusions |
| per-account request budget | 40–45, reported per account, never hidden |

## 28 Production Changes

**Deployed** — https://introw-signal-radar.vercel.app/

- CRM forensics runs in the production data build behind `--crm` / `CRM_FORENSICS_ENABLED`.
- The dossier CRM panel now shows vendor, level, role, date, source type, quote, rationale and
  *does not prove*, with historical findings visually recessed (dashed rule, muted, italic
  quote) so history cannot read as current.
- When forensics has run it **supersedes** the legacy fingerprint panel rather than sitting
  beside it — showing both produced dossiers reading "HubSpot Confirmed" next to "Salesforce
  Confirmed current". The legacy bundle remains in the dossier JSON, so no evidence is deleted.
- The index CRM state follows the same precedence, so Accounts, Data health and the dossier
  cannot disagree about one company.
- A **CRM hiring evidence** panel on Data health: 244 vacancies read, 235 in non-partnership
  roles, 25 accounts reached without an ATS board, 3 confirmed, 1 multi-system environment.

**Not deployed**: discovery. `DISCOVERY_ENABLED` and `DISCOVERY_VISIBLE` remain off, and the 42
new dossiers are stored for review and diagnostics only (§57).

## 29 Known Limitations

- **Zero decisive CRM conclusions across 42 new companies.** The layer works on established
  vendors with real boards and finds little on smaller European ones.
- **Historical evidence is verified but unexercised** — 0 historical-only conclusions.
- **Search forensics contributed nothing**, on a 4-account sample.
- **JavaScript careers pages are invisible**, and this now matters more than it did for partner
  pages, where the measured ceiling was 3 companies in 106.
- **Fit states are unvalidated against a seller.** No human has confirmed that
  `plausible_introw_fit` corresponds to an account worth opening.
- **The adversarial labels are mine.** Discovery labels and the audit that caught two false
  positives were applied by the same agent that wrote the code.
- **Three decisive conclusions is a small base.** Precision on the language holdout is strong;
  precision in the wild rests on three examples.
- **Dutch discovery is unsupported**, so Benelux coverage is indirect.
- **`peopleObserved` is always 0**, so dimension F of §30 contributes nothing.

## 30 Recommended Next Product Step

1. **Reach the JavaScript careers pages.** This is now the binding constraint on CRM evidence,
   and unlike the partner-page case the measured loss is large.
2. **Loosen the careers-subdomain fallback** so it runs whenever a landing page yields few
   links, not only zero.
3. **Show a seller five dossiers and ask whether the CRM line changes anything.** Aircall's
   multi-system finding is the sharpest test: does knowing Salesforce-plus-HubSpot help, or is
   it noise?
4. **Validate the fit states** against a seller's own triage of the same 42 companies.
5. **Leave discovery in shadow** until 3 has an answer. It builds a research universe well; it
   does not yet produce accounts that survive contact with a person's judgement.

---

## Appendix A — Red Team (§58)

**Would this company actually be worth an Introw AE opening?**
For the seven plausible accounts, probably yes as a *research* target — KORE Wireless publishes
recruitment, application, enablement, deal registration and a portal, which is a real operated
programme. Whether any is a *commercial* fit is untested and deliberately outside what this
system claims. Two of the seven (Lumen, Avast) are large enough that Introw is likely the wrong
size of solution, and nothing in the pipeline notices that.

**Is the partner motion company-owned?**
Ownership is the first thing the fit model asks, and participants were excluded twice — once at
discovery labelling (6 participants) and once at fit assessment (2 `likely_not_fit`). The
weakness is that ownership is inferred largely from vocabulary on the company's own domain,
which a well-written participant page can imitate.

**Did we mistake ecosystem size for Introw need?**
Guarded but not eliminated. `operationalSurfaces` counts *workflows*, not partners, and
directory counts are lower bounds. But a company with five visible workflows and three partners
scores the same as one with five workflows and three hundred, and the system cannot see the
difference.

**Did we actually establish CRM use?**
For three accounts, yes — each traced to one sentence in which a company describes its own
system, in an advert it is currently serving. PayFit's says *"in Salesforce, our CRM"*, which is
about as unambiguous as public evidence gets. For everything else the honest answer is no, and
the system says so.

**Could the vacancy evidence mean only candidate experience?**
This is the failure mode that actually occurred. Planhat was confirmed from "Salesforce Admin
knowledge is a plus" until the audit caught it. The rule is fixed and tested, but the incident
is the reason to distrust any future confirmation that has not been read at the sentence level.

**Is the CRM evidence stale?**
All three are dated within four months except Aikido's, which is dated June 2026. No conclusion
rests on an undated non-live source — that path is closed by construction.

**Did we search broadly enough beyond partnership vacancies?**
Yes, and it is the run's clearest empirical result: **235 of 244 vacancies read were in
non-partnership roles**, and **all three decisive conclusions came from an AE, a BDR and an
SDR**. Partnership titles contributed 3 observations out of 52. Restricting to partner roles
would have produced zero CRM conclusions.

**Did unsupported ATS coverage cause false unknown?**
It did, and it no longer does. 25 of 35 existing accounts were reached with no board at all.
The residual false-unknown cause has moved from "no ATS adapter" to "JavaScript careers page".

**Did we confuse HubSpot marketing tooling with Sales Hub?**
Previously, on ten accounts. That was the single largest correction in this run, and the rule
that prevents it is now the reason HubSpot shows 1 confirmed against 11 supporting.

**Would a human seller learn something useful from this dossier?**
From aircall.io, payfit.com and aikido.dev: yes — a named CRM, a dated quote, a clickable
source and an explicit statement of what it does not prove. From the other 50: they would learn
what was looked at and what remains open, which is more useful than a confident wrong answer
but is not the same as an answer.

### Documented disagreement

The strongest case against deploying CRM forensics: it *reduced* apparent CRM coverage from 10
confirmed accounts to 3. A seller opening the product sees less certainty than last week. The
counter-argument this report rests on is that seven of those ten were never confirmed by
anything more than a tracking script, and a dossier that says "HubSpot confirmed" when it means
"HubSpot script installed" damages trust the first time a seller checks. Reasonable people could
call this a regression in coverage. It is a correction in accuracy, and the evidence for both
readings is in §08.

---

## Appendix B — Required Output (§60)

| | |
|---|---|
| **A** — new companies autonomously discovered | **42** |
| **B** — valid operators | **42** (from 99 results; 6 participants, 4 partner-tech vendors, 25 irrelevant, 20 prior duplicates excluded) |
| **C** — PLAUSIBLE_INTROW_FIT | **7** |
| **D** — RESEARCH_REQUIRED | **20** |
| **E** — LIKELY_NOT_FIT | **2** |
| **F** — UNDER_OBSERVED | **13** |
| **G** — SUPPRESSED | **0** |
| **H** — CRM coverage, new accounts | 0 confirmed · 12 supporting · 30 unknown |
| **I** — CRM coverage, existing accounts | before: 10 "confirmed" (all fingerprint-derived), 25 unknown · after: **3 confirmed current**, 11 supporting, 1 mention-only, 20 unknown |
| **J** — conclusions unlocked by non-partner vacancies | **3 of 3** (Enterprise AE, DACH BDR, Barcelona SDR) |
| **K** — unlocked by historical vacancies | **0** |
| **L** — unlocked via LinkedIn / indexed surfaces | **0** (4 searches, 3 false positives avoided) |
| **M** — CRM conflicts found | **1** (aircall.io, multiple systems) |
| **N** — false confirmations caught in audit | **2** (planhat.com, canonical.com) |
| **O** — tests / typecheck / build | **217 tests passing, 14 files · typecheck clean · build clean** |
| **P** — production deployment | **Deployed.** CRM forensics live; discovery shadow-only, flags off |
| **Q** — final verdict | **CRM FORENSICS GO / DISCOVERY SHADOW** |

### Answers to §63

1. **Does autonomous candidate discovery work end-to-end?** Yes — query → candidate → entity
   resolution → full research → dossier → fit state, with no human step and no errors in 42.
2. **Enough valid operators to justify seller attention?** 17% plausible fit from raw discovery
   is a real hit rate, but 31% under-observed and zero CRM evidence means a seller would be
   triaging, not acting.
3. **Which families contribute genuine unique candidates?** German Fachpartner (8), English MSP
   (8), English authorised reseller (8), French revendeur (6), Italian reseller (5).
4. **Which should be disabled?** The two Dutch families remain disabled. The Nordic machinery
   query should not be repeated in that form — it returns dealers, not manufacturers.
5. **Does discovery generalise beyond development languages?** Yes — Swedish and Italian, now
   validated across three independent runs.
6. **Does recovery improve a fresh untouched holdout?** Yes, established last mandate; recovery
   added evidence on 13 of 42 new companies here.
7. **Does base + recovery outperform either alone?** Yes, unchanged.
8. **Does recovery create false evidence or regress software?** No.
9. **Are physical companies materially less under-observed?** Yes for partner motion; CRM
   evidence is no better for them than for software.
10. **Are competitor/consultant false positives contained?** Competitors yes — 4 partner-tech
    vendors excluded at labelling, 0 reached research. Consultants are contained at discovery
    but the in-code consultancy rule defers rather than drops, by design.
11. **Is the static/batch architecture sufficient?** Yes. No backend was built or needed.
12. **Should discovery be visible, shadow-only, or disabled?** **Shadow-only.**
13. **Should recovery ship?** Already shipped, and unchanged here.
14. **Is any ranking justified?** **No.** Nothing measured supports ordering companies.
15. **What is the next real-world validation?** A seller session on the five questions in §30,
    beginning with whether Aircall's multi-system CRM finding changes what they would do.
