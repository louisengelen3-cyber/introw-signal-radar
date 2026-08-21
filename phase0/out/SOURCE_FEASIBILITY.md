# Phase 0 — source feasibility, as tested (21 Aug 2026)

Every row was actually called from this runtime. "Tested" means a real request was made
and the response inspected, not that the source was reasoned about.

| Source | Access | Result | Unique value | Verdict |
|---|---|---|---|---|
| Company website (homepage + sitemap + link graph) | direct HTTP | 61/69 reachable; 88% | partner surfaces, programme language, CRM artifacts | **BUILD** |
| robots.txt + sitemap.xml | direct HTTP | works; sitemaps 0–11,024 URLs; often truncated or absent | URL inventory | **BUILD** (as one of three inventory sources) |
| Passive DNS (hackertarget hostsearch) | free API, capped ~50 hosts | found `partnerhub.corp.cumulocity.com`, `partnerlisting.corp.cumulocity.com`, `partnerprogram.niko.eu`, `channel.teamleader.eu`, `installers.enphase.com`, `partner-academy.vanta.com` — **none discoverable by path probing** | partner surfaces on non-guessable hosts | **BUILD** (licensed tier needed for completeness) |
| Certificate transparency (certspotter API) | free API | found `partners.quatt.io`, `deal-api.quatt.io` that passive DNS missed; missed hosts passive DNS found | complementary subdomain inventory | **BUILD** (union with passive DNS) |
| crt.sh | — | 502 throughout the session | — | do not depend on it |
| DNS CNAME resolution (`dig`) | local | **decisive.** `partners.cumulocity.com → cname.introw.io`, same for axon, quatt, cubbit, epiphan, sharegate, coder, reversinglabs, parloa | incumbent PRM identity; existing-customer suppression | **BUILD — highest value per unit of effort** |
| DNS wildcard control probe | local | 16% of domains have a catch-all; **53% of naive subdomain hits were wildcard noise** | prevents a large false-positive class | **BUILD — mandatory alongside any subdomain check** |
| Common Crawl CDX index | free API, 14 collections back to 2025-26 | per-domain URL history works, including EU/local-language sites (niko.eu, loxone.com, duco.eu, yuki.nl). **Cannot query by path across hosts** — index is domain-keyed | historical backfill of partner surfaces; cheap per-domain screening without touching the target | **BUILD** — solves the Why-Now cold start |
| LinkedIn (company people, profiles) | direct | login wall on `/company/*/people`; HTTP 999 on `/in/*` | — | **DO NOT BUILD** — technically blocked and ToS-constrained |
| DuckDuckGo HTML/lite SERP scraping | direct | lite works, html served a CAPTCHA on the second call | — | **DO NOT BUILD** — fragile and ToS-constrained |
| Bing SERP scraping | direct | ignored `site:` operator, returned unrelated results | — | **DO NOT BUILD** |
| Sanctioned web search API | tool | mixed: named a Teamleader channel leader; returned nothing for Loxone, Enphase, Cumulocity partner leads | opportunistic persona + surface discovery | **BUILD** as a research aid, not a scoring input |
| Company team / about / leadership pages | direct HTTP | **1 named partner-persona person across 10 gold-set companies.** Sedai lists 7 executives, none partner-facing, while having a Head of Partners & Alliances | — | **CONTEXT ONLY** — cannot carry the persona gate |
| Company partner pages (named contact) | direct HTTP | 0 named partner-persona people across 10 companies | — | **CONTEXT ONLY** |
| Partnership/channel event organiser pages | direct HTTP | 233 people extracted, 70 by clean structured methods, **21 of those 70 (30%) Tier-1 partner leadership** with title text | the only free source that reliably yields Tier-1 partner personas | **BUILD — but see the bias finding** |
| Vendor-hosted partner directories (PartnerPage.io) | direct HTTP | Cumulocity's directory is a Nuxt SPA on PartnerPage.io; count extractable from the embedded payload (`count: 78`) | machine-readable partner counts and partner *types* | **BUILD WITH MODIFICATION** — needs per-vendor payload parsers |
| PRM vendor customer/logo pages | direct HTTP | thin: logos are images, few outbound links; 4 of 10 returned 404 | — | **CONTEXT ONLY** |
| Licensed people-data provider (Proxycurl / PDL / Apollo / Cognism) | **no credentials** | not tested | the only viable route to company→person resolution and to partner-team headcount | **REQUIRES FIRST-PARTY DATA / PROCUREMENT — blocking** |
| Introw's own CRM + free-tier install base | **no access** | not tested | customer suppression, closed-loop learning, the ~400 uncalled installs | **REQUIRES FIRST-PARTY DATA — blocking** |
| M&A / carve-out feeds | not tested | deferred — no free feed identified in session | Tier-1 trigger | **UNRESOLVED** |
| Company registries (KBO/KvK/Companies House) | not tested | deferred | new-entity detection post carve-out | **UNRESOLVED** |
