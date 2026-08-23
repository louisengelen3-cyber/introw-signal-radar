# Human review session — measured, not simulated

**Method:** I acted as the reviewer on a bounded sample drawn from the plausible/research
band, using only the review record. Where the record was insufficient I opened the source
and counted that as additional research. Decisions and effort recorded as they happened.

| # | account | population | machine said | I decided | extra sources opened | why |
|---|---|---|---|---|---|---|
| 1 | payflip.be | known customer | RESEARCH | **PROMOTE** | 0 | Record shows a lead-submission form ("Do you have a new lead for Payflip? Fill in the form below"), four named partner types, and first-party intake. That is a partner motion the company operates. |
| 2 | ringover.com | known customer | KEEP_PLAUSIBLE | **PROMOTE** | 0 | Record shows co-selling, "increase your revenue", and reach extension, all quoted from the company's own programme page. |
| 3 | zenity.io | known customer | RESEARCH | **PROMOTE** | 0 | Record shows "Value-Added Resellers (VARs) — our VAR partners expand Zenity's reach", plus first-person recruitment and named partner types. |
| 4 | xelix.com | known customer (holdout) | KEEP_PLAUSIBLE | **PROMOTE** | 0 | Record shows "resell or referral partnerships" and "help outsourcing firms win new deals". |
| 5 | sequoiacap.com | clean negative | RESEARCH | **DEMOTE** | 0 | Zero positive evidence captured, and the firm-type context is unambiguous. |
| 6 | sentry.io | clean negative | RESEARCH | **DEMOTE** | 0 | Zero positive evidence captured; verified integration-only in Phase 1. |

## What this measures

**Six of six records were decidable from the record alone. Zero additional sources opened.**

The reviewer's work was reading four to six quoted observations, each with its source URL
and an explicit statement of what it does and does not prove. On this sample that is
well under a minute per account — the cost is reading, not researching.

## The finding that matters

**All four known customers in this band were promotable, and the machine had promoted none
of them.** The evidence was captured correctly and displayed correctly; the automatic
threshold was too conservative, because all four publish no formal channel artefacts and
therefore score `surface: unknown`.

That separates two different things which are easy to conflate:

- **Evidence capture** — working. The right quotes were found and attributed.
- **Automatic promotion** — conservative. It under-promotes exactly the informal,
  younger programmes that Introw's own case studies describe.

A human-in-the-loop product works on this evidence today. A fully autonomous promoter
would systematically under-promote Introw's core ICP.

## Caveats

- n=6, drawn from one band. Not a workload study.
- I am not an Introw AE; a seller may want evidence I did not need, and may distrust
  evidence I accepted.
- Decisions 5 and 6 leaned on my prior knowledge of what Sequoia and Sentry are. A
  reviewer without that context would open one source each, which is still cheap.
- The band contains 17 of 48 records; 11 of those carry no positive evidence at all and
  would require research from scratch. This sample was drawn from the easier half.
