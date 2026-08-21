# Phase 0 Ground-Truth Benchmark — selection methodology

**Frozen:** 2026-08-21. **Version:** `v1`.
**Rule:** composition is not changed to improve any detector's numbers. Any change
requires a new version and a written reason in this file.

## Why a mixed benchmark

A benchmark of known Introw customers alone measures *fit reconstruction* and nothing
else. It cannot measure precision, because it contains no negatives, and it cannot
measure generalisation, because the population was selected by Introw's marketing team.
Four cohorts are therefore used.

## COHORT A — Known Introw customers (n=22)

**Source:** Introw's own `/case-studies` sitemap (retrieved 21 Aug 2026, 14 studies)
plus the eight logo-only customers named in the targeting thesis §C.1.
**Ground truth:** that they are customers. That is *all* that is ground truth.
**Human judgment:** the domain mapping, and every structural label below.

**Known leakage — stated up front.** These companies are live Introw customers *now*.
Their current partner portal, deal-registration surface and PRM fingerprint are
plausibly *Introw's own product*. Cohort A therefore measures:

- company discoverability
- partner-program classification (transacting vs integration)
- CRM detection
- partner-directory countability
- persona resolvability

It does **not** measure timing/trigger detection, and any portal/PRM detection on
Cohort A must be read as a **customer-suppression test**, not a prospecting test.

## COHORT B — Likely-fit non-customers (n=20)

**Selection rule, applied before any detector was run:** a company qualifies for
Cohort B if, from public knowledge alone, it is a B2B (or B2B-channel) company that
plausibly operates a *transacting* partner, reseller, dealer or installer network at
mid-market scale. Chosen to deliberately span the segments the thesis claims matter
and the segments it admits it may not see:

- EU mid-market B2B SaaS with reseller/accountant/agency channels
- non-US, local-language European companies
- industrial / manufacturer dealer & installer networks (the Quatt shape)
- bootstrapped or non-VC-backed companies
- companies with no public ATS and small public footprint

**Ground truth:** none. Cohort B has no labels. It measures whether the detectors
*generalise beyond the marketing-selected population* and whether the discovery layer
can see segments outside the BOND VC/ATS universe.

## COHORT C — Controls and false-positive traps (n=17)

Each entry is present because it is expected to trip a specific, named failure mode.
**Ground truth:** the trap class (high confidence). The expected detector verdict is
human judgment.

## COHORT D — Persona gold set (n=10)

Companies where the partner organisation and at least one current partner-owning
person can be established manually from public evidence. Overlaps A and B by design —
persona resolution is measured on companies whose answer is independently knowable.
**Ground truth:** the manually verified person, title and employer at the stated
verification date. Role currency decays; every entry carries `verifiedAt`.

## What is NOT ground truth anywhere in this benchmark

- partner counts (public directories are a lower bound, not a census)
- partner-team headcount (title counts are a proxy for an org chart)
- CRM (only positive first-party artifacts count; absence is unknown)
- program type where the site is ambiguous
- anything about revenue, adoption, or contract state
