# Hard-negative challenge set — methodology

**Frozen:** 23 Aug 2026, before the Phase 3 constructs were run against any member.
**Model state:** git tag `phase3-frozen`. Constructs unchanged for the baseline run.

## Why the Phase 3 negatives were not enough

The Phase 3 clean negatives — law firms, VCs, IT resellers, integration-only SaaS,
affiliate programmes — are sanity checks, not boundary tests. None of them has a real
owned partner programme, so rejecting them tests almost nothing. A model that merely
detects "this company has a serious partner programme" would score 0/14 false promotions
on that set and still be commercially useless.

## What makes a negative HARD here

Every member must look like a strong prospect on the features under test:

- a real, owned, commercially-motivated partner programme
- first-person partner recruitment
- visible operational surface — onboarding, portal, named partner types
- language about partners growing revenue or acquiring customers

**and** carry an independent, defensible reason it is a poor Introw account — a reason
that does not appeal to materiality, ownership, surface, distribution, size or
"not currently a customer".

## The two blocker classes used

**1 · Competitor or category vendor.** The company sells partner-management software
itself. It runs a genuine partner programme, and it will not buy a competing PRM. The
blocker is *what the company sells*, established from its own product pages — entirely
independent of how good its partner programme looks.

**2 · Supply-side marketplace "partner" programme.** The company calls its suppliers,
merchants, couriers or property owners "partners", recruits them in the first person,
onboards them, gives them a portal, and tells them they will grow their revenue. Every
positive probe fires. But those partners are *inventory* — they supply what the company
sells — not a channel that resells the company's product. There is no deal registration
to automate, no partner-sourced pipeline into a CRM, no commission on resale of the
company's own product. The blocker is the *direction of the commercial relationship*,
established from the programme's own description.

This second class is the sharpest test in the whole project. It is designed to fire every
Phase 3 probe while being categorically wrong for Introw.

## Rejected blocker rationales

- "it has distributors" — the feature under test, withdrawn in Phase 3
- "it looks enterprise" — size is not evidence
- "it is not a known Introw customer" — a non-customer is not a negative
- "its ownership is weak" / "its surface is thin" — the features under test

## Provenance rule

Each entry records whether the negative rationale would still hold without knowing the
result of the feature being tested. Only `VALID` entries count toward headline results.
