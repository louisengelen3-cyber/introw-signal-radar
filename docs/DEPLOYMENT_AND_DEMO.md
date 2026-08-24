# Deployment and demo

## Live URL

**https://introw-signal-radar.vercel.app/**

Public, no authentication. Verified in a browser: navigation, dossier loading, evidence
expansion, review decisions with persistence and queue advance, data health, and the empty
Changes state. No application console errors.

## Deployment

| | |
|---|---|
| Provider | Vercel (team `heyantwerp`), production target |
| Method | Vercel CLI from a staged copy of the repo |
| Build | `npm run build` → `tsc -b --noEmit && vite build` |
| Output | `dist/` — a fully static site |
| Config | `vercel.json` (framework, build, cache headers) |
| Secrets | none — there is no backend and no API key |

### Why the CLI rather than a git integration

`create_git_project` failed because the Vercel GitHub App is not installed on this account:

> To link a GitHub repository, you need to install the GitHub integration first.

That is an account-level authorisation only the account owner can grant. Installing
https://github.com/apps/vercel on `louisengelen3-cyber/introw-signal-radar` would enable
push-to-deploy; until then, redeploy with:

```bash
npx vercel deploy --prod --yes     # from a directory whose name is lowercase
```

The Vercel CLI derives the project name from the directory, and `Introw-signal-radar` contains
uppercase characters, which Vercel rejects. Deploy from a staged lowercase copy (see
`.vercelignore` for what is excluded) or rename the directory.

### What is deployed

Source, not build output — Vercel installs dependencies and builds. `.vercelignore` excludes
the research phases, the design references, the docs and the local caches, leaving ~1.2MB
across ~100 files. The dossier data ships as static JSON under `public/data/`.

## Demo path

Fourteen steps, ~6 minutes. Every account below is a real observation.

1. **Overview.** Six workflow tiles. Read the note under them aloud — it states that the
   product does not rank, and why.
2. **Ready for review.** Point out the ordering is operational, not priority.
3. **Open Aikido Security.** A genuine Introw customer with a plainly-described partner motion.
   Machine interpretation: *strong evidence*.
4. **Constructs.** Materiality *Supported*, ownership *Direct*, surface *Moderate* — measured
   separately, never summed.
5. **Expand one quote → "What this proves".** Show the `Does not prove` line. This is the
   discipline the whole product rests on.
6. **Partner workflows.** Green ✓ confirmed, grey – not observed. Say the sentence: *not
   observed is not absent — deal registration usually sits behind the partner login.*
7. **Open question.** "Is there partner machinery behind a login that we cannot see?"
8. **Record a decision.** Confidence, optional rationale, then Promote — it saves and advances
   to the next undecided account. Keyboard: P R W X S.
9. **Open Datadog** — `under_observed`. One of the largest partner programmes in B2B software
   reads as sparse. Show that the product says *this does not mean low fit*, and names the next
   check. This is the honesty test, and it is the most important slide in the demo.
10. **Open Trengo.** Scroll to Systems: **Competitor PRM · Kiflo**, sourced to Trengo's own
    partner terms — *"Affiliate Partner Portal: means the Kiflo portal…"*. Then read the note:
    it indicates programme maturity and **not** dissatisfaction or intent to switch. Then the
    Contradictions panel, which states both sides.
11. **Open Kiflo** — `suppression candidate`, flagged as a direct competitor, with the
    provenance line distinguishing the maintained list from the inferred classification.
12. **Open Foleon** — a directory of **at least 82 certified partner organisations**, phrased
    as a lower bound, with named agencies.
13. **Changes** — deliberately empty. Monitoring began 23 Aug 2026; every account is at its
    first observation, so there is no timing claim to make. There is no "Why Now" anywhere.
14. **Data health** — the product publishes its own recall numbers: category 57%, CRM 33%,
    people not attempted.

Optional closer: **How this works** explains why the score was removed.

## Accounts chosen for the demo, and why

| Account | Demonstrates |
|---|---|
| aikido.dev | Genuine customer, plain-language partner motion, strong evidence |
| archerirm.com | Formal enterprise programme |
| trengo.com | Competitor PRM found in the prospect's own legal terms; contradiction panel |
| kiflo.com | Direct competitor, suppression candidate, list-vs-inference provenance |
| magentrix.com | Partner-tech vendor caught by the same route |
| datadoghq.com | Under-observed — a large programme the system cannot see |
| foleon.com | Partner directory, 82 organisations, phrased as a lower bound |
| vinted.com | Supply-side marketplace — "partners" that are not a channel |
| deloitte.com | Professional services |
| cubbit.io | HubSpot confirmed from a real artifact |
| channable.com | Apex domain blocked, partner subdomain readable — partial coverage declared |

## Deliberately not built

Scoring · ranking · "best opportunities" · a GTM queue · autonomous prioritisation · Why Now ·
predicted intent · estimated partner counts · inferred partner-team size · inferred CRM absence ·
inferred renewal dates · live arbitrary-company research in the browser.

The last one is a capability limit rather than a principle: research requires outbound HTTP,
DNS lookups and minutes of runtime, which a static deployment cannot do. Rather than ship a
search box that pretends to research any company, the app ships the validated dossier library
and says so. New dossiers are generated from the command line.

## Known limitations in this build

- **Decisions are stored per browser** (`localStorage`). No backend, no CRM write-back, no
  sharing between reviewers.
- **The dossier library is fixed** at 35 accounts until regenerated from the CLI.
- **Responsive** was validated by CSS review and the card-fallback path rather than device
  screenshots; the browser tooling available would not resize the window.
- **No real seller has used it.** Every validation number comes from language models
  substituting for sellers. That is the largest weakness and the next test should replace it.
