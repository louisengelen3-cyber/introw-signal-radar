# Product Validation Report
## Introw Partner Intelligence — evidence-first assistant

Built after four research phases established that autonomous ranking could not be supported
by public evidence. This report records what was built, what it may claim, what it may not,
and what was measured rather than assumed.

---

## 01 Product built

An **evidence-first partner intelligence assistant**. It researches a company from public
web data and produces an auditable commercial dossier: what the company says it sells, which
partner programmes it appears to run, which partner workflows are publicly visible, what
contradicts that, what remains unknown, and the smallest question that would resolve it. A
human then decides promote / research / watch / reject / suppress.

It has no score, no ranking, and no ordering. There is deliberately no numeric field in the
data model that could be sorted into a leaderboard, and an executable test enforces that.

**Scale:** 35 real dossiers, ~7,500 lines of TypeScript, 97 tests including 13 executable
product invariants.

## 02 Product claim

What the evidence supports saying:

> For companies that publish a partner page, the assistant compresses "research this company"
> into "verify this evidence", and does so without inventing what it does not know.

Measured, on a sample frozen before any dossier was built:

- A reviewer with only the dossiers reached a defensible decision on **16 of 24** companies
  with **zero** external page retrievals.
- A reviewer doing the same job manually used **75 retrievals** across the same 24 companies.
- Concentrating the manual effort on the 8 the dossier could not resolve would have cost 33
  retrievals instead of 75 — a **56% reduction in external retrievals**.
- The two arms agreed on direction (pursue / hold / drop) for **16 of 24**, and on the exact
  outcome for **14 of 24**.

## 03 Claims explicitly rejected

The product may **not** claim any of these, and the interface states none of them:

- That it identifies the best prospects, or any ordering among accounts.
- That it reliably filters out competitors. It catches 57% of partner-tech vendors.
- That absence of CRM evidence says anything about a company's CRM.
- That absence of partner-people evidence says anything about a partner team.
- That it detects timing, intent, buying readiness, dissatisfaction, or "why now".
- That a competitor PRM implies switching intent.
- That a partner-directory count is a partner count. It is a lower bound.
- That it saves a specific amount of seller time. The measured quantity is retrievals, not
  minutes — see §16.

## 04 Architecture

```
company input
  → evidence collection      (site, canonical partner paths, DNS, certificate transparency,
                              Common Crawl, positioning surfaces)
  → entity + programme resolution
  → structured dossier       (observation ≠ interpretation, everything attributed)
  → machine interpretation   (advisory, labelled, never a verdict)
  → uncertainty + contradictions
  → human commercial review  (promote / research / watch / reject / suppress)
  → temporal monitoring      (baseline now; verified change later)
```

Two properties are structural rather than incidental:

**Machine and human verdicts are separate fields.** `machineInterpretation` and `humanReview`
never overwrite one another. In the Phase 4 hardening sprint a blind human reviewer beat the
automated model 6–0 on the hardest cases; merging the two would erase the only signal that
worked.

**Category is answered from different evidence than everything else.** Partner-page language
cannot distinguish "operates a programme" from "sells programme software" — both write about
deal registration and tiers, in the same words, at the same density. So category is read only
from identity surfaces (title tag, meta description, homepage H1, product page). That also
makes it structurally insensitive to publication volume: one company yields one
self-description whether it has one page or ten thousand.

## 05 Core dossier model

Every observation carries a verbatim quote, a source URL, a retrieval timestamp, an evidence
strength, and — mandatory — both `proves` and `doesNotProve`. Both blind reviewers named the
`proves` / `doesNotProve` pairing as the format's best feature.

Panels: company + self-description, category, three constructs, programmes, partner directory,
operational surfaces, systems (CRM/PRM), people, temporal, contradictions, research tasks,
evidence coverage, source health, commercial summary, machine interpretation, human review.

## 06 Category / competitor handling

Two separate things, deliberately never merged:

| | Source | Coverage |
|---|---|---|
| `CATEGORY_CLASSIFICATION` | inferred from the company's own positioning | 57% of partner-tech vendors |
| `KNOWN_COMPETITOR_LIST` | asserted business data, maintained by hand | exact, but only what is on it |

They are displayed side by side and compared. When the list fires and the classifier does not,
that is a measurement of classifier recall; when the classifier fires and the list does not,
that is a candidate for the list. Collapsing them would make the classifier look better than
it is.

**Measured** (`product/out/CATEGORY_MEASURED.md`), two frozen holdouts:

- partner-tech vendors caught: **8/14 (57%)**
- genuine targets wrongly excluded: **0/13** — the property that makes it shippable
- professional services: **0/4** on the only clean holdout — this rule does not work
- retrieval failure: 24% of holdout v3 domains returned no identity surface

Because recall is 57%, the flag is advisory and the positioning quote is always shown beside
it, so a human can catch what the rule misses. That is exactly what both blind reviewers did.

## 07 Commercial constructs

Commercial materiality, operational ownership and operational surface are measured separately
and never summed. Each shows state, evidence, counter-evidence, named unknowns and source
quality (distinct claims and independent sources, not raw hit counts).

## 08 Unknown / under-observed semantics

`unknown` is a first-class result, rendered with the same visual weight as a confirmed value —
same size, same border, neutral slate rather than faded grey. If unknown looks like an error,
a reviewer reads absence as a negative, which is the failure the whole product exists to avoid.

Operational surfaces carry three states, and the last two are not the same thing:
`confirmed` (we saw it), `not_observed` (we read surfaces where it would appear and did not
see it), `unknown` (we could not look). Deal registration usually sits behind a partner login
and is invisible to us by design.

Evidence coverage (rich / moderate / sparse / none) describes what a company publishes and is
never converted into fit. The interface says "manual research may be required", never "low fit".

## 09 CRM

`src/evidence/crm.ts`, strictly one-directional. Only artifacts count —
`js.hs-scripts.com/1234567.js`, a Web-to-Lead endpoint, a `.my.salesforce.com` org domain.
Prose mentions are ignored.

**Measured against a control group that cannot lie:** Introw integrates only with HubSpot and
Salesforce, so every known Introw customer provably runs one. Recall was **2/6 (33%)**, and
**Salesforce was never detected on any of 18 domains** — structural, not accidental, because
Salesforce is not a website technology.

In the live dataset: 12 of 35 accounts have any CRM evidence. CRM is therefore not a
qualification gate, and both blind reviewers confirmed independently that unknown CRM never
changed their decision. One called the "Which CRM?" research task "space in every dossier
doing no work" — a fair criticism retained deliberately, since the question is cheap to
answer on a first call.

## 10 People

2 of 18 companies yielded any public person evidence in measurement; 0 of 35 in the live
dataset. Public person discovery is not viable and no crawler was built for it. The panel
exists with an `unknown` state and an architecture that accepts a licensed provider later.
Team size below two is never a disqualifier.

## 11 PRM

High-precision DNS/CNAME fingerprinting is retained. 2 of 35 accounts show a platform.

Where a competitor PRM is detected the dossier states, in the panel itself:

> A competitor PRM is in use. This indicates programme maturity. It does NOT indicate
> dissatisfaction, contract timing, or any intent to switch.

An executable invariant enforces that sentence's presence. *Uses a PRM* and *sells a PRM* are
different questions handled in different panels.

## 12 Temporal monitoring

Baseline only. Every account is at `first_observation`, so the Changes view is empty and says
so:

> No verified changes yet. Every account is at its first observation... This will stay empty
> until enough calendar time has passed — showing anything else here would be fabrication.

The mechanism was tested in the hardening sprint with caching forcibly disabled: **0/40
surfaces differed within hours**, a 0% false-positive floor. The detector works; it has no
elapsed time to work with. No Why Now card exists.

## 13 Review workflow

Five outcomes with stated definitions, keyboard-driven (P/R/W/X/S), confidence and optional
rationale captured, decision time recorded. Workflow states — ready for review, research
needed, under-observed, reviewed, watching, suppressed — organise the queue without implying
an ordering.

## 14 Fresh validation sample

`product/validation-sample.v1.json`, sha256 `9d5a8ef4d17d4633`, 24 companies, frozen before
any dossier was built or reviewed. No domain appears in any Phase 0–4 benchmark, in the
regression corpus, or in either category holdout. Composition is deliberately mixed — European
and US B2B SaaS, non-software companies, a consultancy, a marketplace, and several sparse
accounts — not curated for ease.

Per §56, these companies are **unlabelled**. A review outcome on them is a commercial
judgement, not ground truth, and is not scored as accuracy.

## 15 Seller-efficiency experiment

Four isolated reviewers, no contact between them.

- **Manual arm** (2 reviewers × 12): given only company names, required to research the web,
  recorded pages retrieved per company.
- **Assistant arm** (2 reviewers × 12): given only the rendered dossiers, **browsing
  prohibited**, asked to report honestly when the dossier was insufficient.

Both arms covered all 24 companies, so the comparison is paired, and no reviewer saw both
conditions.

**Stated limitations**, including one a red-team methodologist found that I had not stated:

- The reviewers are language models, not human sellers. Wall-clock time for an agent is not
  seller time, so the primary measure is **external retrievals**, which transfers.
- **The assistant arm has no cost measure at all.** The manual arm recorded pages opened; the
  assistant arm recorded only a sufficiency boolean. `HumanReview.decisionSeconds` exists in
  the model, is captured by the UI, and was **never populated by this experiment**. So a true
  efficiency *delta* is not computable from these artifacts. What is computable is the
  retrieval count on one side and a sufficiency rate on the other, which is weaker than a
  delta and is how §16 is now phrased.
- Group assignment was `slice(0, 12)` / `slice(12)` of a hand-ordered list, not randomised.
- Both arms saw all 24 companies, which makes the comparison paired but means neither arm is
  a clean control for order effects.
- n=24, and the sample is unlabelled, so agreement between arms is not accuracy.

## 16 Research-time results

| | Manual arm | Assistant arm |
|---|---|---|
| External retrievals | **75** (mean 3.1/company) | **0** |
| Defensible decision without further research | 14/24 from the partner page alone | **16/24 (67%)** |
| Confidence: high / medium / low | 9 / 13 / 2 | 6 / 14 / 4 |

**Reduction in external retrievals: 56%** (75 → 33, spending the remaining 33 on the 8
companies the dossier could not resolve).

Read that number carefully. It says the dossier removed the *need* to retrieve for 16 of 24
companies. It does **not** say the dossier was cheaper to read than those pages were to
fetch — nothing here measured the cost of reading a dossier, and one reviewer noted the
packets ran to roughly 1,100 lines for 12 companies, of which perhaps 400 were informative.
The claim this licenses is "less external research", not "faster".

The assistant arm is measurably **less confident** — 6 high-confidence calls versus 9. Read
honestly, that is the product working as intended rather than a defect: it withholds the
confidence the evidence does not support. It is also a real cost, and a seller may experience
it as hedging.

**Per §54, no time-savings claim is made.** Retrievals were measured; minutes were not.

## 17 Evidence sufficiency

Sufficient on 16/24. The 8 failures split cleanly:

- **Retrieval failure (1):** Efficy — 403 on every attempt.
- **Silent non-coverage (4):** Apaleo, Leapsome, Juro, Cegeka — the dossier could not
  distinguish "no programme" from "we never looked". Both assistant reviewers named this
  independently as the single most-missing thing.
- **Genuine ambiguity (3):** Twikey, Lano, Productsup — resell versus technical integration,
  and managed referral versus affiliate scheme.

The second category is the most actionable finding in this report. Source health logs
`/product`, `/compare` and `/vs` but did not log partner-path attempts, so every "no programme
identified" was uninterpretable. Canonical partner paths are now always probed; logging every
attempt into source health remains owed.

## 18 Additional research burden

For the 8 unresolved accounts the manual arm needed 33 retrievals (mean 4.1) — well above the
3.1 sample mean, confirming these are genuinely the hard cases rather than an artefact.

Both manual reviewers independently named the same two most-wanted facts, neither of which is
publicly observable:

1. **Whether partners are compensated, and how.** Six of twelve companies name partner types
   then send you to a contact form for terms.
2. **What tooling already sits underneath.** Efficy looked like an ideal prospect and already
   runs Impartner PRM — discovered only from a conference page on the competitor's own site.

## 19 Adversarial cases

All twelve §65 cases were built as **real observations**, not fixtures.

| Case | Company | Result |
|---|---|---|
| Genuine customer, plain language | aikido.dev | `high_fit_evidence` |
| Formal enterprise programme | archerirm.com | `research` |
| Direct competitor | kiflo.com | `suppression_candidate` |
| Partner-tech vendor | magentrix.com | `suppression_candidate` |
| Supply-side marketplace | glovoapp.com | `suppression_candidate` |
| Reseller / participant | devoteam.com | `plausible` — **missed**, see §23 |
| Integration-heavy | datadoghq.com | `under_observed` |
| Sparse but interesting | leapsome.com | `under_observed` |
| Confirmed HubSpot | cubbit.io | `research`, HubSpot confirmed |
| Source failure | doordash.com | `under_observed`, "Nothing here is evidence about the company" |
| Conflicting evidence | aircall.io | `research` with contradiction surfaced |
| Professional services | deloitte.com | correctly classified |

The Phase 4 failure is closed: every PRM competitor that the previous model promoted to
`high_fit` is now a suppression candidate.

## 20 Holdout / regression status

- `corpus/regression.v1.json` — previously-seen companies. Detects breakage; **cannot support
  accuracy claims**.
- `corpus/holdout.v2.json` (`9b723cd4e29554c9`) and `holdout.v3.json` (`2401b7ff8c178ce2`) —
  frozen, single-shot.

Two honest notes:

1. A repair written after seeing which Phase 4 hard negatives failed scored 3/6 in-sample and
   **1/6 out-of-sample**. It was reported as a failure and not shipped. The current classifier
   is a different approach — different evidence, not better regexes.
2. After v2 was spent, the professional-services and supply-side rules were redesigned on dev
   data and v2 was re-run as a regression check. **Those two rows in v2 are no longer clean
   out-of-sample**, and only v3 measures them honestly.
3. **The adversarial demo set reuses three holdout domains** — glovoapp.com and devoteam.com
   from v2, doordash.com from v3 — and devoteam.com appears there under a different expected
   label than the one it was scored against. Those are exactly the two classes whose numbers
   moved.
4. **Every corpus carries `frozenAt: 2026-08-24`**, the same day as the rules, the dossier
   build and the validation sample. "Frozen" here means "a list written before the run, of
   domains I believe I had not inspected". It is not temporally separated from the rules it
   evaluates, and the git history cannot prove otherwise.
5. **The retrieval-failure exclusion is outcome-correlated.** In v3 all five excluded rows are
   misses, and the three excluded supply-side domains are bot-protected consumer marketplaces
   — the detector's own target class is systematically the class it cannot reach. The correct
   statement is not "n too small" but "this rule cannot be evaluated by this method".

## 21 Publication-bias audit

The Phase 3 failure was that promotion tracked publication volume: observations ≥ 9 predicted
promotion 90% of the time, and nine of the ten companies clearing that bar were partner-tech
vendors.

`product/audit-publication-bias.ts` runs as a standing diagnostic. Current dataset (n=35):

Correlation alone turned out to be the wrong test, and reporting it alone would have been
misleading in both directions. Some volume dependence is unavoidable: an account with zero
retrieved evidence cannot be reviewed, so "has evidence" will always predict "forwarded". The
audit therefore now separates three things:

| Measure | Value |
|---|---|
| Correlation with raw observation count | 0.68 |
| Correlation with independent source count | **0.79** (higher — the right shape) |
| Correlation **excluding zero-evidence accounts** | **−0.06** |
| Known partner-tech vendors in the top volume band (≥6 observations) | **0** |
| …of those, forwarded to a seller | **0** |
| Phase 3 comparison | 9 of 10 accounts clearing ≥9 observations were partner-tech vendors; 8 of 9 promoted |

The near-zero correlation once empty accounts are excluded shows the headline number is
almost entirely the trivial dependence. The directional test is the one that matters, because
Phase 3's harm was not that volume predicted promotion — it was that volume selected for
**competitors**. It no longer does.

Three mechanisms produce this: deduplication, the attribution guard (unattributable matches
are dropped, not downgraded), and category classification reading only identity surfaces.

The diagnostic cannot prove the remaining dependence is legitimate. It makes it visible.

## 22 Data-health status

Live dataset: 70 successful fetches, 117 not-found, 3 blocked. Three accounts
(channable.com, efficy.com, doordash.com) have no readable identity surface, and the Data
Health view names them with the explanation that this is a retrieval limit, not a finding.

The view also publishes the product's own measured limits — CRM 33%, people 2/18, category
57%, temporal baseline-only — where a user will see them.

## 22b Red team

Three independent panels, eight roles, no contact between them. They were asked what is
wrong, not whether it works, and told to verify claims in the code rather than trust comments.
They found substantially more than the blind reviewers did.

### Found, verified, and fixed

| Finding | Panel | Fix |
|---|---|---|
| **Construct states were computed pre-attribution while their evidence was post-attribution** — `commercial_materiality: strong_proxy` beside `0 distinct claims`. The attribution guard made this *worse*: it removed the quote a reader used to catch the error and left the confident label standing alone | AE, RevOps, technical | A state with no surviving evidence collapses to `unknown`; a state on one claim cannot exceed `strong_proxy`. **0 unsourced labels remain** |
| **The `/glossary/reseller` bug lived in a third file.** Juro's entire "reseller motion" came from a free contract template; Sana's "distributor motion" from a customer case study about a dental wholesaler | all three | Content-path exclusion moved into the attribution guard, which now covers programmes, surfaces and directory — not just probes. **0 content-path citations remain** |
| **Two promotion rules shipped in one codebase**, and the dossier used the laxer one — Planhat reached the top state with `operational_surface: unknown`, the one construct that speaks to whether Introw has anything to do | RevOps | Surface is now required; Planhat is no longer a top state |
| **Surfaces were discarded when no programme was detected.** Eight dossiers asserted "Visible partner workflows include…" with every quote and URL dropped — including a food-delivery app credited with partner certification | technical | Surfaces stored top-level and rendered |
| **`\bVAR\b/i` matches the Swedish and Dutch word "var"** ("was"/"where"). Half the sample is Nordic or Dutch and the pipeline reads `/nl/partners` | technical | Removed; the acronym was already covered by "value-added reseller" |
| **Catastrophic backtracking in `denoise()`** — 8.8s on a 24k-character selector run, inside every page fetch, no timeout | technical | Bounded token pattern. **8,848ms → 18ms** |
| **"Last checked" was the assembly clock over a cache with no TTL** — 78% of cached fetches predated the build day | technical | Now derived from the oldest contributing retrieval |
| **Summary contradicted the machine on the same screen** — Datadog named a partner programme above "No distinct partner claim was retrieved" | data quality | Programme and workflow findings now count into diagnostics |
| **`suppression_candidate` had no branch in `workflowState()`** — Kiflo and Magentrix rendered as "Ready for review" and sat in the review queue | designer, technical | Added. The one machine judgement that demonstrably works is no longer discarded |
| **`likely_target_category` rendered green on 28 of 35 rows** for a state the measured record defines as the absence of a signal | designer | Neutral tone |
| **`not_observed` and `unknown` surfaces never rendered** — the grid was a block of green that grew with publication volume | designer | All three states render (36 confirmed, 133 not-observed) |
| **Rationale silently discarded** on keyboard review; confidence decorative; no queue advance | designer | Confidence and rationale set first, decision commits last and advances |
| **5 of 6 Overview tiles were fake filters** | designer | Real filters |
| **Attribution fallback caught 1 of the 4 cases it was written for** — any quote containing "partner" passed | data quality | Raised to a programme-*relationship* construction |
| **SVG attribute soup in quotes**; **"a agency motion"** in four summaries | data quality, RevOps | Both fixed |
| **People and temporal panels asserted findings where no lookup runs** | data quality | Now state that no lookup was performed |

### The single best catch

> **"Trengo runs Kiflo."** Trengo's own partner terms, quoted verbatim *inside its own
> dossier*, read: *"Affiliate Partner Portal: means the **Kiflo** portal the Affiliate Partner
> has acquired an account for."* Kiflo is a direct Introw competitor. The systems panel above
> that quote said `unknown`, because platform detection read only DNS.

Text-side platform detection over pages already fetched now runs. Trengo reads
`competitor_prm_confirmed · Kiflo`, sourced to that line. It is the most commercially
decisive single fact in the dataset and it was sitting in the file unread.

### Found and NOT fixed — corrected in the claims instead

- **"Never wrongly excluded a genuine target" was close to a tautology.**
  `likely_target_category` is the unconditional fallthrough, so a target can only be excluded
  if a disqualifying rule misfires. 13 cases with 0 failures bounds the true rate at **~21%**,
  not 0%. Corrected in the measured record, the code, the UI and the seller-facing preamble.
- **The competitor classifier contributed nothing inferentially on this sample.** Zero of 35
  dossiers are `partner_tech_vendor` by inference; the two suppressed competitors are both on
  the 16-entry hand-maintained list. On this corpus the classifier is a lookup table.
- **34 of 35 dossiers rest on a single independent source** — usually the company's own
  `/partners` page. The dedup and independence apparatus built to fix the Phase 3 confound
  measures almost nothing on real data, and `volumeSensitive` has never once fired.

### Where the panels disagreed, preserved

The designer treats the evidence layer as sound and the presentation as broken. The founder
says the presentation problems are downstream of a collection layer producing one source per
company, and that polishing the screen makes the wrong answer easier to read. The channel
expert says both are arguing about presentation and the real defect is upstream of both:

> "This system does not model partner programmes. It models partner web pages. A company that
> launched a programme in 2021, recruited nine agencies, closed two deals and quietly stopped
> staffing it has exactly the same page today as a company doing 40% partner-sourced ARR."

That objection is correct and is not fixable with public data. It is the strongest argument
against the product and it is recorded here undiluted.

All three panels independently named the same two things worth keeping: **the quote with its
source URL and its `does not prove` line**, and **the partner directory with named
organisations**.

## 23 Remaining blind spots

**Found by two independent blind reviewers, since fixed and verified:**

| Defect | Fix |
|---|---|
| Fabricated directories — Juro's "5 partner organisations" were Wikipedia, GitHub and Columbia Law; Channable's included its own status page | Path *segment* matching, brand-token exclusion, infrastructure denylist. Junk eliminated; Pleo's accountancies, Sana's ERP VARs and Foleon's 82 agencies all survived |
| Keyword matches carrying confident labels — Trengo's homepage chat metric read as "partners bring leads"; Mews' guest-bill rebate read as partner commission | Evidence must be attributable to the partner motion or it is **dropped**, not downgraded |
| "No blocking question identified" on zero-evidence dossiers | Now names the blocking question first |
| "Nothing here is evidence about the company" printed above three sourced claims | Partial coverage now declared instead |
| Boilerplate reviewers stopped reading | Hoisted to a single preamble; why-blocks collapse by default |

**Open and unresolved.** These are the honest residue after two rounds of adversarial review.

1. **The product reads partner web pages, not partner programmes.** A dead programme keeps its
   marketing page for free, and nothing observable separates it from a live one. Every state
   here is a function of published intent; none is a function of activity. This is not fixable
   with public data and it is the strongest argument against the product.
2. **34 of 35 dossiers rest on a single independent source.** Usually the company's own
   `/partners` page — a page a seller can open in ten seconds. The marginal value over "read
   their partner page" is real but narrower than the architecture implies.
3. **The category classifier contributed nothing inferentially on this sample.** Both suppressed
   competitors came from the hand-maintained list, not the rule.
4. **Professional-services classification does not work** — 0/4 on the clean holdout. Devoteam
   and Cegeka, both systems integrators — the *partners* your prospects recruit, not buyers —
   sit in `likely_target_category`.
5. **Recall against a determined manual researcher.** The manual arm found Efficy's Impartner
   incumbency, Channable's 1,200+ agency partners and Productsup's opportunity-registration
   portal from press releases and conference pages the crawler never reaches.
6. **Client-side rendering is invisible.** `productsup.com/partners` returns HTTP 200 with 177
   characters of extractable text and a full partner network behind JavaScript. Productsup is
   reported `under_observed`, which is honest and wrong.
7. **Machine states are still not calibrated against each other**, and both blind reviewers said
   they stopped reading the state and worked from quotes. Requiring operational surface helped;
   it did not make the six states comparable.
8. **Supply-side classification cannot be evaluated by this method** — its target class is
   systematically bot-protected.
9. **Decisions go nowhere.** Reviews persist to `localStorage` only. Introw's own product is
   CRM sync, and this tool cannot write a decision into HubSpot or Salesforce; two sellers on
   one account see nothing of each other.

## 24 What would require licensed or internal data

- **Partner-team size and ownership** — licensed people data. Public web yields 2 in 18.
- **Whether partners are compensated and how much** — behind contact forms; a first-call question.
- **Partner-sourced revenue or pipeline share** — not public for private companies.
- **Incumbent PRM contract timing** — not public; a competitor CNAME shows presence, never terms.
- **Whether an account is already an Introw customer** — internal CRM, unavailable for this work.
- **Salesforce presence** — structurally undetectable from marketing sites.

## 25 What the product should never automate yet

- Ordering or prioritising accounts.
- Excluding a company automatically on category — 57% recall does not earn an automatic anything.
- Qualifying or disqualifying on CRM, people, or partner count.
- Any timing or intent claim.
- Writing outreach copy from the dossier — the summary is safe to read, not safe to skim, and
  a generated email would inherit whatever the summary overstated.

## 26 Recommended next step

Not another research phase. The two highest-value, lowest-risk items, in order:

1. **Log every partner-path attempt into source health.** The single most-cited gap: it turns
   "no programme identified" from uninterpretable into informative, and would have resolved
   4 of the 8 insufficient dossiers.
2. **Put it in front of one real Introw seller for one afternoon**, on accounts they were
   already going to research. Every number here comes from language models standing in for
   sellers. That substitution is the largest single weakness in this report, and one afternoon
   with a real rep would replace it.

---

## Verdict

### PRODUCT READY WITH LIMITATIONS

The workflow is useful and the evidence discipline is real. A reviewer with only the dossiers
resolved two-thirds of a fresh, deliberately mixed sample with zero web retrievals; the
structural failure that ended the previous phase — competitors ranked above prospects — is
closed and verified by a directional test; and two rounds of adversarial review found sixteen
defects, of which fifteen are fixed and the sixteenth is corrected in the claims.

It is not "ready" without qualification, and the reasons are specific.

**The reader-care problem.** Two blind reviewers reached the same conclusion in almost the same
words:

> "Because every claim carries its raw quote and URL, I caught all of the above without leaving
> the file. That is a real design strength. But it only works if the reader distrusts the
> summary line, and the summary line is written in confident declarative prose."

> "A seller cannot safely skim the summaries — and skimming summaries is exactly what a seller
> with 200 accounts will do."

A format that is self-correcting *for a careful reader* is only as safe as the reader's care.

**The published-intent problem**, which the channel expert put more sharply than I had:

> "This system does not model partner programmes. It models partner web pages."

Nothing observable separates a programme with four hundred active resellers from one launched
in 2021 and quietly abandoned. That gap is where the commercial decision actually lives, and no
amount of engineering closes it from public data.

**What I would not claim.** That this saves seller time — retrievals were measured, minutes were
not, and the assistant arm has no cost measure at all. That the competitor filter works — on
this sample it was a lookup table. That it is more than a careful reading of a company's
`/partners` page for 34 of 35 accounts.

**What I would claim.** It reads pages a seller would not find — Trengo's partner terms named
the competitor PRM they already run; Weglot's academy article explained how their partners get
paid — and it attaches to every sentence the source and the limits of what that source proves.
On the measured sample that removed the need for external research on two-thirds of accounts
without once inventing what it did not know.

Ready with limitations, and the limitation that matters is that no real seller has used it yet.
