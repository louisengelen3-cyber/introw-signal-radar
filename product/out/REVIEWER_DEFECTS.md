# Defects found by the blind assistant-arm reviewers

Two reviewers, working independently on different halves of the sample, with no access to
each other or to the codebase. Both found the same failure modes. Severity is mine.

| # | Defect | Severity | Found by |
|---|---|---|---|
| 1 | **Fabricated partner directories.** Juro's "5 partner organisations" are Wikipedia, GitHub, Columbia Law and Intercom — citation links in a blog post. Channable's "6" include its own status page, a CDN, G2 and Capterra. PayFit's "23" include its own developer subdomain. | **CRITICAL — manufactures fit** | both |
| 2 | **Keyword false positives carrying confident labels.** Trengo's homepage chat metric ("bring leads and customers to their answers") labelled as partners bringing leads. Mews' guest-bill "Partial Rebates" webinar labelled as partner commission. Productsup's wholesaler *customer-segment* page read as a distributor programme. | **CRITICAL — manufactures fit** | both |
| 3 | **"No blocking question identified" on dossiers with zero evidence** (Foleon, Cegeka). Inverts the signal exactly where caution is most needed. | High | both |
| 4 | **Partner-path retrieval is never logged.** Health records `/`, `/product`, `/compare`, `/alternatives`, `/vs` but never a `/partners` attempt, so "no programme found" is indistinguishable from "we never looked". | High | both |
| 5 | **Self-contradicting interpretation.** Channable's machine text says "the site could not be retrieved… Nothing here is evidence about the company" directly above three sourced partner claims. | High | 1 |
| 6 | **Category classifier is non-discriminating on this sample** — the same verdict for all 12, including a CRM vendor (Upsales) and a C2C marketplace (Vinted). | Medium | both |
| 7 | **Uncalibrated machine states.** Planhat rated `high_fit_evidence` on four claims from one page; Oneflow rated `research` with more and better evidence. Both reviewers stopped reading the state. | Medium | both |
| 8 | **Boilerplate dominates length.** "Why it may matter / may not / Unknown", the People note, the Timeline line and the CRM disclaimer are identical across every company. One reviewer: "roughly half the file's length carries no per-company information." | Medium | both |

## The reviewers' own summary of the risk

> "Because every claim carries its raw quote and URL, I caught all of the above without
> leaving the file. That is a real design strength. But it only works if the reader
> distrusts the summary line, and the summary line is written in confident declarative prose."

> "A seller cannot safely skim the summaries — and skimming summaries is exactly what a
> seller with 200 accounts will do."

That is the finding that matters most, and it is an argument about the summary, not about
the evidence.
