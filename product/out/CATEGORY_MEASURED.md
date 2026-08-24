# Category classifier — measured performance

Two frozen holdouts, neither tuned against.
`holdout.v2` sha256 `9b723cd4e29554c9` · `holdout.v3` sha256 `2401b7ff8c178ce2`

Domains whose identity surfaces could not be retrieved are reported separately: a Cloudflare
or Vercel challenge is a coverage limit, not a classification error, and folding the two
together would flatter the classifier.

| Expected class | v2 | v3 | Combined (retrieved only) |
|---|---|---|---|
| partner_tech_vendor | 6/8 | 2/6 | **8/14 · 57%** |
| likely_target_category | 8/8 | 5/5 | **13/13 · 100%** |
| professional_services | 1/3 | 0/4 | **1/7 · 14%** |
| supply_side_marketplace | 2/2 | 0/1 | **2/3** |

**A caveat that matters more than the table.** After v2 was spent, the professional-services
and supply-side rules were redesigned on *dev* data and v2 was re-run as a regression check.
Its numbers for those two rows are therefore no longer clean out-of-sample. The only
untouched measurement of those rules is v3: **professional services 0/4, supply-side 0/1.**
Read the combined column for partner-tech and target categories; read v3 alone for the
other two.

Retrieval failures: 5 of 21 domains in v3 (24%) returned no identity surface at all.

## What this licenses

**The 13/13 row is weaker than it looks, and was previously overstated here.**
`likely_target_category` is the *unconditional fallthrough* in `classifyCategory` — no pattern
has to match to reach it. So "never wrongly excluded a genuine target" is largely a
restatement of the control flow, not an empirical finding: a target can only be excluded if a
vendor, supply-side or services rule misfires.

The honest statement is narrower: **the disqualifying rules produced 0 false positives across
13 non-vendor cases.** Thirteen observations with zero failures is consistent with a true
false-exclusion rate as high as **~21%** at 95% confidence. That is still the strongest
property the classifier has, and it is still why the flag is safe to surface — but it is not
the guarantee the earlier wording implied.

**Partner-tech recall is 57%.** Useful as an advisory flag, nowhere near sufficient as a gate.
Roughly two in five partner-tech vendors still reach the seller unflagged, so the dossier must
keep showing the positioning quote — which is exactly how the blind reviewers caught the ones
the rule missed.

**Professional-services detection does not work.** The services-enumeration rule scored 4/6 on
dev and 0/4 on the only clean holdout. It is retained because it costs nothing and fires
rarely; no product surface may treat its absence as informative, and no claim about
consultancy detection may be made.

**Supply-side is unmeasured, not validated.** n=3 after retrieval failures.

## What it does not license

- Automatic exclusion of any company.
- Any claim that competitors are reliably filtered.
- Reading `likely_target_category` as positive evidence — it is the unconditional
  fallthrough, and 6 of 14 known vendors sit inside it.
- Reading "0 false exclusions" as a guarantee. n=13 bounds the true rate at ~21%, not 0%.
