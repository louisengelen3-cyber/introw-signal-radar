# Phase 2 suitability benchmark — methodology

**Frozen:** 21 Aug 2026, **before** any suitability rule was written.
**Split:** deterministic — every third company by sorted domain goes to HOLDOUT.
**Rule:** labels and rationales are not edited after results are seen. A label I come to
believe is wrong is reported as a label error, not corrected in the frozen file.

## What this benchmark is NOT

It is not a channel-existence benchmark. Every company here already has Phase 1 evidence
of a transacting channel, or is a known Introw customer. Mixing the two questions is
exactly the error Phase 1 identified with SAP: channel reality and Introw suitability are
different questions and must be measured separately.

## Cohort A — known Introw customer programmes (ground truth: customer)

Source: Introw's own case-study index plus the CNAME-confirmed customers found in Phase 1.
**Ground truth:** that they are customers. That is all.
**Purpose:** identify which operating structures Introw demonstrably serves.

**Leakage, stated:** their current partner infrastructure may *be* Introw. Suitability
evidence read from these companies today partly describes Introw's own product surface.
Structural dimensions (channel depth, governance, incentive complexity) are largely
unaffected by this; artifact presence (portal, deal registration) is not, and is therefore
weighted as corroboration rather than as a discriminator.

## Cohort B — plausible target programmes (no ground truth)

Transacting non-customers selected on independent structural reasoning: a channel that
looks like it is run by one team, at mid-market scale, in a market Introw sells to.
**Ground truth:** none. This cohort measures generalisation, not accuracy.

## Cohort C — transacting but hypothesised poor fit (ground truth: the hypothesis only)

Every entry carries a **structural** hypothesis about *why* the operating model may be
inappropriate — never "because it is large". Company size is not a label and is not used
as evidence. If a Cohort C company turns out to run a simple, centrally-managed direct
programme, that is a finding about the label, not a failure of the model.

Each Cohort C entry states the specific structure hypothesised, so the detector can be
checked against it: does the system actually observe two-tier distribution at this company,
or is it merely agreeing with my prior?
