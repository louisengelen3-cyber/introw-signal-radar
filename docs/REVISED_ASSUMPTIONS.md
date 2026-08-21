# Introw Radar — revised product assumptions (post Phase 0)

**Status:** these OVERRIDE any conflicting statement in `introw-gtm-targeting-thesis.md`
until new measured evidence changes them. The thesis remains the source of truth for
*commercial* reasoning; this file is the source of truth for *what the system may assume*.

**Locked:** 21 Aug 2026, after Phase 0 measurement on frozen benchmark `cohorts.v1`.
Machine-readable mirror: `config/assumptions.json`.

---

## R1 — CRM is not a gate

| | |
|---|---|
| **Thesis said** | `gate_1: crm_confirmed IN [hubspot, salesforce]`, run second, hard exclusion |
| **Measured** | 22% any CRM artifact on a realistic prospect cohort; 78% unknown; 0% Salesforce; 2 of 4 known-HubSpot customers undetected |
| **Now** | CRM is **positive evidence and a priority modifier**, never a discovery gate |

`unknown` CRM must not suppress an account, count as incompatible, count as negative
evidence, or prevent discovery. Only `incompatible_confirmed` may later block *release*,
and only if a validated Introw requirement demands it.

**Salesforce is a first-class Introw environment.** Axon is a CNAME-confirmed Introw
customer running Salesforce with no HubSpot artifact anywhere on its site. Salesforce
accounts are under-detected, not rare — those are different problems and only the first
is ours.

## R2 — Partner-team headcount is enrichment, not a gate

| | |
|---|---|
| **Thesis said** | `gate_0: partner_team_headcount >= 2`, "the cheapest gate", run first |
| **Measured** | LinkedIn blocked (login wall / HTTP 999). Free alternatives: 1 named partner-persona person across 10 gold-set companies; 0 from partner pages |
| **Now** | Never a discovery gate. Never a reason to discard. |

`no people found` ≠ `no partner team`. Team size is represented as an explicit state:
`verified` · `partially_observed` · `manually_verified` · `provider_derived` · `unknown`.
`unknown` is the expected default.

## R3 — Operational load is a derived hypothesis, not the ICP

| | |
|---|---|
| **Thesis said** | `primary_scoring_variable: partner_leverage_ratio`, `>= 20` strong |
| **Measured** | Numerator directly countable for 5 of 61 reachable companies. Denominator unavailable. **Factorial — ~500 partners, 100+ managers, ratio ~5 — is a real customer sitting in the specification's "weak" band** |
| **Now** | Computed **only** when both sides are independently reliable. Never fabricated on either side. Never penalises an account when uncomputable. |

No universal ratio bands until segment-specific benchmark evidence validates them.
Candidate replacements to investigate instead: absolute programme scale · count of
*transacting* partners · workflow complexity · programme maturity · partner-type mix ·
CRM dependency · number of distinct partner motions · geography · recent growth ·
structural change · and combinations.

## R4 — First-party Introw data is unavailable, permanently for this build

No CRM, install base, trials, opportunities, closed-lost, customer database or product
usage. This is a **fixed constraint**, not a pending dependency. No Warm Accounts or Free
Installs surface is built. The architecture stays extensible; the engineering priority is
zero.

## R5 — Licensed people data is unavailable, and the design is vendor-agnostic

No credentials for People Data Labs, Proxycurl, Apollo, Cognism or any equivalent. The
system defines a `PersonProvider` interface and normalises into internal `Person` records.
No vendor response shape leaks into the domain model. Until a provider exists: public
evidence where defensible, manual verification, `unknown` preserved, role currency explicit.

## R6 — The Introw DNS fingerprint is high-precision and one-directional

`partners.<domain> → cname.introw.io`. Measured 47% recall on known customers, zero false
positives across 69 companies.

> **FOUND = strong evidence of an existing Introw relationship.
> NOT FOUND = UNKNOWN. Never "not a customer".**

Strong evidence of an existing relationship **suppresses from cold outbound**, with the
reason recorded.

## R7 — Absence, blocking and negation are three different things

- `unknown` — we looked and found nothing. Not evidence of absence.
- `blocked` — we could not look (bot protection stopped ~10% of the benchmark). Not `unknown`.
- `contradicted` — we found positive evidence of the opposite. The only state that may create a negative fact.

## R8 — Current state is fit evidence; only a dated change is timing evidence

Observing "186 partners today" is **fit**. It becomes **Why Now** only when a previous
dated observation existed and the value changed. `firstSeenAt` ≠ `effectiveAt` ≠
`observedAt` ≠ `retrievedAt`. "First observed by the radar" must never render as "launched".

## R9 — Event attendance is a person source, not an account prioritiser

Measured 30% Tier-1 persona yield on clean extractions, but 26% of the corpus references
large-cap employers against Introw's 1.9% enterprise share. The published slice
(speakers, sponsors, exhibitors) is systematically the wrong size band. Use it to resolve
people; do not use it to rank accounts.

## R10 — Research is part of the product

Manual verification is a designed workflow, not a failure state. The Radar's job is to
reduce the number of companies needing human work, not to eliminate human work.

---

## What did NOT change

The thesis's core commercial reasoning stands: transacting partners are the object model
Introw sells against; integration ecosystems are inverted and must be suppressed; funding
is never timing; job-ad tool mentions are never confirmation; industry pages are SEO not
ICP; no employee-count band; never estimate ACV or PRM renewal dates.

---

# Phase 1 conclusions — locked 21 Aug 2026

## R11 — Software/IT channel discovery and classification are validated. Do not re-prove.

Measured: 17/17 traps not flagged · 22/22 apparent precision on 56 never-seen companies ·
89% of reachable known customers surfaced. Regression-test these; do not make them the
research objective again.

## R12 — Partner count is OPTIONAL ENRICHMENT

Measured across 115 companies: 90 unknown · 23 lower_bound · 1 directory_count · 1 exact_public.

Partner count is **not** a discovery gate, a qualification gate, a mandatory card field, a
universal ranking variable, or a GTM-Ready requirement. Preserve the five count types and
never render them as equivalent. Do not invest further engineering in making it universal.

## R13 — Operational load stays derived and optional

Computed only when numerator *and* denominator are independently reliable — 1 of 14 fixtures.
Never inferred, never thresholded universally, never a ranking prerequisite, never the centre
of the UI. The "93× load" concept is no longer the centre of the Radar. The capability is
preserved; its original importance is not.

## R14 — Distributor inversion is candidate generation, not qualification

Phase 1 wrote: *"if a distributor sells your product, you operate a transacting channel."*
That is a **hypothesis**, not an invariant. A distributor vendor list proves a commercial
relationship exists. It does not prove the manufacturer operates the programme, manages
partners directly, owns the workflow, or is Introw-suitable.

## R15 — Three questions, three classifiers, never corrupted into each other

| Question | Classifier | Example |
|---|---|---|
| **Channel reality** — does a transacting channel exist? | commerciality | SAP: **yes** |
| **Introw suitability** — is this operating model appropriate for Introw? | suitability | SAP: probably **no** |
| **Timing** — is there a reason to approach now? | signals | separate again |

Tuning the commerciality classifier to call SAP "not transacting" would be false. The
demotion belongs in a separate dimension. This is the central Phase 2 architecture.

## R16 — Program ownership is modelled, not assumed

Evidence attaches to a **programme with an owner**, not to a company. One company can
simultaneously run its own reseller programme, participate in AWS Marketplace, hold
strategic alliances, be distributed by wholesalers, and run an affiliate scheme. Every
strong commercial artifact must attempt to answer *whose programme is this?*

## R17 — Blocked ≠ unknown ≠ absent

`blocked` = retrieval was attempted and refused. `unknown` = insufficient evidence.
`absent` requires positive contrary evidence. Never collapse them.
