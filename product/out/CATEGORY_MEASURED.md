# Category classifier — measured performance

Two frozen holdouts, each run once, neither tuned against.
`holdout.v2` sha256 `9b723cd4e29554c9` · `holdout.v3` sha256 `2401b7ff8c178ce2`

Domains whose identity surfaces could not be retrieved are shown separately: a Cloudflare or
Vercel challenge is a coverage limit, not a classification error, and folding the two
together would flatter the classifier.

| Expected class | v2 | v3 | Combined (retrieved only) |
|---|---|---|---|
| partner_tech_vendor | 6/8 | 2/6 | **8/14 · 57%** |
| likely_target_category | 8/8 | 5/5 | **13/13 · 100%** |
| professional_services | 0/3 | 0/4 | **0/7 · 0%** |
| supply_side_marketplace | 1/2 | 0/1 | **1/3** |

Retrieval failures: 5 of 21 domains in v3 (24%) returned no identity surface at all.

## What this licenses

**The safety property holds: 13/13 real prospects were never excluded as vendors.** Across
both holdouts the classifier has not once told a seller to skip a genuine target. That is the
property that makes it shippable at all.

**Partner-tech recall is 57%.** Useful as an advisory flag, nowhere near sufficient as a gate.
Roughly two in five partner-tech vendors still reach the seller unflagged, and the dossier
must therefore keep showing the positioning quote so a human catches the rest — which is
exactly what the blind reviewer did unaided.

**Professional-services detection does not work.** 0/7 out-of-sample. The services-enumeration
rule that scored 4/6 on dev generalised to nothing. It is retained only because it costs
nothing and fires rarely; no product surface may treat its absence as informative, and no
claim about consultancy detection may be made.

**Supply-side is unmeasured, not validated.** n=3 after retrieval failures.

## What it does not license

- Automatic exclusion of any company.
- Any claim that competitors are reliably filtered.
- Reading `likely_target_category` as positive evidence — it is the absence of a
  disqualifying signal, and 4 of 14 vendors sit inside it.
