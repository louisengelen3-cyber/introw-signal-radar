# INTROW — ADVERSARIAL GTM TARGETING THESIS

**Prepared:** 21 August 2026
**Subject:** Introw BV (BE0798161431), Dok-Noord 4E 102, 9000 Ghent, Belgium + 447 Broadway, New York, NY
**Purpose:** Pre-discovery targeting model. No prospect list. No named target accounts.
**Evidence cut-off:** All first-party sources retrieved 21 Aug 2026.
**Revision 2:** Incorporates a long-form Dutch-language founder interview with Andreas Geamanu (CEO) on the *Business Mentor* podcast, undated but internally dateable to summer 2026 ("27 jaar", "30-tal mensen", "chief of staff start in oktober", "die herlancering hebben we dit jaar gedaan"). This is a **source-authority-2** document and overrules the competitor-published analyses on every point where they conflict. Sections revised: B.8, B.9, C.2, C.4, D.1, G.1, K.5, L, M, O, Q, R, S, V, and the radar specification. All other sections are unchanged from Revision 1.

**Source caveat on the founder interview:** it is ASR output with visible transcription errors (Aikido → "Ikikido", Lorenz Bogaert → "Lorence Booert", Pitchdrive → "PidgeDrive"), it carries no publication date, and it contains at least one internal inconsistency (15 US events in one sentence, "de kost van die 60 events" in another). Figures are founder-reported, unaudited, and serve a recruiting purpose. **Directional claims: high confidence. Precise figures: medium.**

---

## READING INSTRUCTIONS

Every material conclusion carries a status label:

| Label | Meaning |
|---|---|
| **DSI** | Directly supported by Introw (first-party, current) |
| **DSF** | Directly supported by a named Introw founder/executive, first-person, current — source authority 2, below only Introw-controlled pages |
| **DSC** | Directly supported by a named customer or partner source |
| **SMES** | Supported by multiple independent external sources |
| **RI** | Reasonable inference — logically follows from evidence, not directly stated |
| **WH** | Working hypothesis — plausible, testable, not yet evidenced |
| **UNS** | Unsupported — asserted somewhere, no evidence found |
| **CON** | Contradicted |
| **UNR** | Unresolved |

Where a section mixes fact and interpretation, it is split explicitly into OBSERVED / INTERPRETATION / CONFIDENCE.

---

# A. EXECUTIVE GTM THESIS

**The single most important finding of this research: the correct ICP variable for Introw is not company size, not industry, and not funding stage. It is a ratio.**

### The thesis in one paragraph

Introw sells to companies at a specific and narrow structural moment: the partner motion has outgrown spreadsheets and email, but has not yet earned enough internal headcount or political weight to justify an enterprise channel suite. The person who feels this is almost always running a partner network that is 20x–200x larger than the team managing it, on a CRM (overwhelmingly HubSpot) that they refuse to abandon as the source of truth. Introw's entire product design — CRM-native, portal-optional, AI agents doing routine work, <2 weeks to live — is a direct answer to *"scale the network without adding people."* Every well-evidenced customer story is a variation of that sentence.

### The five load-bearing conclusions

**1. Qualify on a founder-stated floor first, then on a ratio: `partner_team_headcount >= 2`, then `partner_network_size ÷ partner_team_headcount`, both gated on `CRM = HubSpot`.**
Introw's CEO states the floor explicitly and backs it with churn evidence: *"vandaag willen wij altijd verkopen aan een bedrijf dat minstens twee partnership managers heeft"*, and companies below that line *"zijn ook gechurnd."* Above the floor, the ratio does the work: Cumulocity 2-person team against 100+ partners; Quatt 10 → 200+ installers "without adding headcount"; Factorial 500+ partners. Both inputs are publicly computable (partner directory count; LinkedIn title count), and the floor is the cheaper of the two — **run it first**. This pair outperforms employee-count banding, which the evidence does not support as a filter. **[DSF for the floor; RI on DSC for the ratio]**

**2. HubSpot is the hardest qualification gate in the model — harder than industry, geography, or size.**
HubSpot is the only CRM included on *every* Introw plan including free. Salesforce is gated to the Scale tier and above. HubSpot is Introw's distribution channel (Certified App, 500+ installs, 4.9/78 reviews, "Rising" tier). Reviewers repeatedly single out the HubSpot sync as the differentiator. An account on Pipedrive, Zoho, Attio, or Dynamics is not a slow deal — it is a structural non-fit. **[DSI + SMES]**

**3. The highest-conviction trigger is structural discontinuity in the partner program, not a partnerships hire.**
Two independent customer sources describe an ownership event as the trigger: Cumulocity ("when Cumulocity became independent… we weren't allowed to take our partners with us… we had to start from scratch") and a named AWS Marketplace reviewer ("invaluable for our partner program after our management buyout… starting from scratch"). Carve-outs, spin-outs, MBOs and divestitures create a partner program that must be rebuilt from zero, on a compressed timeline, with a skeleton team, and with no incumbent PRM contract to break. That is the highest-quality buying condition in the entire model. **[DSC ×2 — the strongest triangulated trigger found]**

**4. The obvious trigger — "hired a Head of Partnerships" — is still weaker than it appears, but for a different reason than Revision 1 gave.**
Of 14 named buyers in Introw's own case studies, only 8 carry a partner-family title. Revision 1 read this as a ~40% blind spot in any title-based model. **Revision 2 corrects that:** the founder's two-manager floor and his account of continuous up-market drift show the six non-partner-titled buyers sit almost entirely in Introw's *legacy* ICP — accounts they would no longer sell to (§C.5). Partner-title resolution is therefore largely sufficient today, with a **scoped fallback retained only for the non-SaaS dealer/installer segment**, where a company can pass every structural gate while presenting no partner title. Partner-title *hiring* nevertheless remains Tier 2 rather than Tier 1, on the independent grounds that the title space is the most contaminated in B2B data. **[DSF + DSC]**

**5. The most dangerous unforced error is conflating "partnerships" with "channel revenue."**
Introw's product is built around deal registration, lead attribution, commission automation, channel-conflict resolution, and partner tiering. Those objects only exist where partners *transact* — resellers, referral partners, installers, MSPs, distributors, agencies. A company with a rich *integration* ecosystem (tech partners, marketplace listings, API directory) and no transacting partners has no deal registration, no commission plan, and no attribution problem. Integration-ecosystem signals are the single largest false-positive generator available and must be explicitly demoted, not merely down-weighted. **[RI, high confidence, from DSI product design]**

**6. Introw is sales-led, not product-led — and roughly 400 unconverted free-tier installs are sitting inside its own systems. [ADDED IN REVISION 2]**
Revision 1 classified the motion as product-led land. The CEO states the opposite: PLG was considered and rejected, and *"met elke klant die vandaag Introw getekend heeft, hebben we een touchpoint gehad, een call."* That inverts the meaning of the 500+ HubSpot installs against ~100+ paying customers. Under a product-led model those are a passive funnel; under a sales-led model they are **the warmest outbound list the company owns** — accounts that have already connected a CRM, already built a portal, already demonstrated a partner motion, and have never been called. **Cross-referencing that internal list against the two-manager floor is probably a higher-yield first action than any external signal, and it requires access rather than engineering.** **[DSF]**

### What this means operationally

- Target on **program structure**, not firmographics.
- Gate hard on **HubSpot** (detectable), accept the resulting bias, and mitigate it deliberately (see §M).
- Check the **internal free-tier install base** before building anything external.
- Prioritise **discontinuity** (carve-out, MBO, PRM migration, step-change in partner recruitment) over **growth** (funding, hiring).
- Treat **partnership-event exhibitor and speaker lists** as a first-class signal — it is Introw's own sourcing channel.
- Route to whoever *owns partner outcomes*, which in this segment is frequently **not** a partner-titled person.
- Treat integration ecosystems as an **anti-signal**, not a signal.

---

# B. PRODUCT TRUTH

## B.1 What Introw actually sells

**OBSERVED [DSI]:** Introw self-describes as the *"#1 Agentic Partnership Management Platform"* and *"#1 Agentic PRM"*, with the sub-claim *"The first PRM that meets your partners where they already are."* The HubSpot marketplace listing uses a narrower and older self-description: *"#1 Partner Portal on top of HubSpot."*

**INTERPRETATION:** Introw sells Partner Relationship Management (PRM) software. The "agentic" and "headless" language is positioning layered on a recognisable PRM feature set, not a different category. The gap between the website positioning (agentic platform) and the marketplace positioning (portal on top of HubSpot) is a positioning-maturity gap, not a product contradiction — the marketplace copy is the older, more literal description.

**CONFIDENCE:** High. Do not describe Introw to a prospect as "partner ecosystem software." It is a PRM, and it competes as one.

## B.2 Product modules — complete, first-party

**OBSERVED [DSI — Introw product navigation, retrieved 21 Aug 2026]:**

*Manage:* Partner management (onboarding & tiering) · Deal & lead registration (no-code CRM-integrated form builder) · Dashboards & reports · Partner goals · Commission & SPIFF (payout automation) · Affiliate campaigns

*Collaborate:* Partner engagement (automatic deal updates) · Partner portal (no-code, branded) · Support ticket collaboration · Embed portal into your own platform · Deal coaching (AI) · CPQ (partner-generated quotes)

*Enable:* Content enablement (co-branded, tracked) · Partner Chatbot / AI agent · Partner LMS (AI-generated courses, certification) · Partner campaigns · MDF · **Partner Connect [flagged NEW]** — lets partners connect *their own* CRM and keep deals in sync

**INTERPRETATION:** This is a full-surface PRM, not a point solution. Notably it now spans capabilities usually associated with up-market suites (MDF, CPQ, LMS, certification) — but those are add-ons or gated tiers, which suggests they were built to *unblock* deals rather than to *lead* them.

**Partner Connect is commercially significant and under-appreciated.** A PeerSpot reviewer's stated limitation — *"it does not sync directly with the CRM of a different one of our partners, meaning that our partners have to manually update in Introw and not directly from their own CRM"* — is precisely what Partner Connect appears to solve. That review is therefore **stale relative to current product**. Any competitive objection built on it should be treated as out of date. **[DSI vs DSC, resolved in favour of the current first-party source]**

## B.3 Core workflows — operational description

**Before Introw** *(reconstructed from four independent customer accounts — Cumulocity, Cubbit, Quatt, Tensis)* **[DSC]:**

- Partner records live in spreadsheets, inboxes, or an inherited unqualified list.
- A partner emails a lead or deal; a human re-keys it into the CRM.
- Nobody knows if that account is already an open opportunity → channel conflict is discovered late, by argument.
- Attribution is reconstructed manually at commission time. Commission calculation is manual and error-prone.
- Marketing assets are scattered; partners ask for "the latest deck" by email.
- Partner status updates are chased by the partner manager, one relationship at a time.
- Reporting to leadership is a manual quarterly assembly exercise.

**After Introw [DSI + DSC]:**

- CRM (HubSpot/Salesforce) remains system of record; Introw syncs bi-directionally.
- Partner submits a deal via a no-code form mapped to CRM fields — or conversationally via Slack, Teams, email, or an AI assistant (Claude/ChatGPT/Gemini via MCP). Real-time duplicate detection runs; the record writes back with correct partner attribution.
- Cumulocity retained manual acceptance deliberately, to preserve channel-conflict control: **97% of deal registrations accepted since launch** — evidence the intake quality is high, not that review is rubber-stamped. **[DSC]**
- Partner activity appears in the CRM (App Cards, App Events, App Objects on HubSpot), so it can trigger workflows and appear in native CRM reports.
- Commission plans calculate automatically; payouts managed.
- AI agent answers partner questions 24/7; the partner-manager's inbox stops being the support queue.

**Which manual steps disappear:** re-keying partner deals; duplicate-checking by memory; chasing status updates; assembling partner reports; answering repetitive partner questions; manual commission math; manually adding partners to the portal.

**Which system becomes more valuable:** the CRM. Introw makes partner activity a first-class, reportable, automatable CRM object. **This is the actual commercial argument and it is the one that lands with RevOps and the CRO.** **[RI, high confidence]**

**Which workflows become visible:** partner-sourced pipeline; partner engagement (who logs in, who submits, and — per Cumulocity — *which questions partners ask the AI agent*); asset consumption; onboarding progress; commission liability.

**Which teams interact:** partner/channel team (owner) · sales/AE team (co-sell, conflict) · RevOps (CRM objects, fields, workflows) · marketing (asset library, campaigns) · finance (commission payout) · CS/support (partner tickets).

## B.4 Onboarding, implementation burden, time-to-value

**OBSERVED [DSI]:** Homepage claims *"<2 weeks average time to go live"*, *"Most teams launch their portal the same day"*, and a 30-day framework (Day 1 connect CRM + set up registration flows; Day 5 portal live, first deals arriving; Day 30 goals, campaigns, commissions running).

**OBSERVED [DSC]:** Cumulocity's Global VP Partners & Alliances built a portal experience himself in **48 hours** before purchase, and first partners onboarded ~4 weeks after signing. Factorial: **<4 weeks** to go live with 500+ partners. Tensis: *"From spreadsheets to scale in under two weeks."*

**INTERPRETATION:** Time-to-value claims triangulate across three independent customer sources and are unusually credible. Implementation burden is genuinely low and requires no engineering. Cumulocity explicitly states they run the program *"without engineering."*

**COMMERCIAL CONSEQUENCE:** Low implementation burden is not just a feature — it is a *sales-cycle compressor and a self-service evaluation vector*. The Cumulocity story is the template: the buyer built it himself, then took it to management. This means **the product is its own best demo, and the free tier is a genuine land motion, not a marketing gesture.** **[RI, high confidence]**

**CONFIDENCE:** High.

## B.5 Integrations and system-of-record dependency

**OBSERVED [DSI]:**

| Category | Integrations | Plan gating |
|---|---|---|
| CRM | HubSpot, Salesforce | **HubSpot on all plans incl. free. Salesforce excluded from Pro; included Starter, Scale, Enterprise** |
| Comms | Slack, Microsoft Teams, WhatsApp, email | All plans (Slack/Teams) |
| AI | Claude, ChatGPT, Gemini via MCP | MCP connection from Scale; Claude on all plans |
| Custom agent | Own MCP server | Scale + Enterprise only |
| Ecosystem | Crossbeam (account mapping) | Scale + Enterprise only |
| Billing | Stripe, Chargebee | Scale + Enterprise only |
| BI | Power BI | Add-on |
| Automation | Zapier | All plans |
| API | API connection | Add-on on every tier |

Introw claims **"100+ integrations."** Also listed on **AWS Marketplace** (sold by Introw, deployed on AWS, free trial).

**ANOMALY [CON — internal to first-party source]:** The pricing table shows Salesforce integration ✅ for Starter (free), ❌ for Pro, ✅ for Scale/Enterprise. The plan-card copy and the FAQ both state Salesforce is included on Scale and Enterprise only. The Starter ✅ is most likely a table error. **Do not rely on free-tier Salesforce access in a commercial conversation without verifying.**

**INTERPRETATION — system-of-record dependency is absolute.** Introw does not maintain an independent partner database of record. No CRM → no product. HubSpot or Salesforce specifically → everything else is a non-fit. Account mapping is *not native*: it runs through Crossbeam, which is itself a paid third-party product gated to Scale+. This is Introw's most consistently cited product limitation across independent review sources. **[SMES — G2 pros/cons, PartnerPortal, Slashdot review all cite it]**

## B.6 AI functionality

**OBSERVED [DSI]:** Channel conflict resolution (AI detection/resolution between direct and partner-sourced deals) · 24/7 Partner Support Agent · Internal Partner Support Agent · Deal coaching · AI campaigns · AI-generated LMS courses · MCP server exposing tools (Search Partners, Search CRM Objects, Search Commissions, Submit Partner Form, Generate Business Review, Update Task, Get Goals, Get Tier Information, Search Marketing Funds, Search Form Submissions, Add Comment, Update CRM Object, Add Task).

Notably, the four AI features listed above the fold (channel conflict, 24/7 support agent, internal support agent, deal coaching) are available on **every plan including free**.

**OBSERVED [DSC]:** Cumulocity's VP: *"Just last week I had to generate a report where I asked Claude Cowork to create a PowerPoint presentation where you take the information from the MCP server from Introw."* Quatt built an AI assistant that reads incoming orders, pulls partner details, checks pricing, and handles special requests, with Introw as source of truth.

**INTERPRETATION:** The AI is not decorative. Two independent customers describe production, daily, non-trivial agentic use. The MCP tool list is real and reasonably deep. However — the AI is **not the reason customers buy**; every case study's stated *purchase* driver is CRM-nativeness, speed, and simplicity. AI shows up as an *expansion and stickiness* driver post-purchase.

**COMMERCIAL CONSEQUENCE:** Lead with CRM-native + speed. Do not lead with AI. AI is the second-meeting differentiator and the reason the account expands. **[RI, high confidence — this is a direct contradiction of Introw's own homepage hierarchy, and sellers should be aware of it]**

## B.7 Security and compliance

**OBSERVED [DSI]:** ISO 27001, SOC 2 Type II, GDPR compliant, public trust centre (trust.introw.io). Application security via Aikido (itself an Introw customer logo). **SSO — internal and external/partner — is Enterprise tier only.**

**INTERPRETATION:** Certification posture is sufficient to clear mid-market and most enterprise security review. **SSO gating to Enterprise is the single most likely procurement-driven forced upgrade** — any prospect with an IT function that mandates SSO for external portals is an Enterprise deal by definition, regardless of partner count. This is a useful qualification question and a useful deal-sizing lever. **[RI, high confidence]**

## B.8 Pricing and packaging — and a genuine contradiction

**OBSERVED [DSI, current]:** Four tiers — Starter (free, 1 partner), Pro (3 seats, HubSpot only, 20 custom reports), Scale (5 seats, +Salesforce, +MCP, +Crossbeam, +Stripe/Chargebee, +multi-currency, 50 reports, priority support), Enterprise (custom partners/users, SSO, custom object collaboration, unlimited reports, dedicated CSM). **Introw publishes no monetary figures on its pricing page.** FAQ states: *"Pricing is tier-based on the number of partners you manage."* Add-ons: MDF, CPQ, Affiliate, LMS, embed, multi-lingual, API, Power BI. 14-day free trial on paid plans.

**RESOLVED IN REVISION 2 — founder source now overrules both competitors.**

**OBSERVED [DSF]:** Andreas Geamanu, on pricing negotiation: *"sommige klanten kunt ge binnenhalen voor €10.000, maar ge kunt die evengoed binnenhalen voor €13.000 voor exact hetzelfde platform, exact dezelfde value."* On packaging by segment: *"op het lage SMB niveau, dus dat is bij ons vandaag van 50 tot 100 werknemers, daar hebben we gewoon een list price van — oké, je hebt zoveel users, zoveel partners, dit is de prijs. Daar gaan we dat niet overcomplex maken."* Above that band, pricing is value-based: *"wij kijken vooral naar de impact die Introw heeft… we gaan heel vaak business cases maken en ROI calculators."* Historic anchor: the first customer on the post-pivot platform, February 2024, signed at **€2,500/year**. On why pricing rose: *"door de prijs naar omhoog te duwen ga je automatisch focussen op juistere bedrijven, op grotere bedrijven met lage churn."*

**REVISED WORKING BAND:** **circa €10,000–€13,000 for negotiated mid-market deals**, with a published-internally list price below that for the 50–100 employee band, and materially more above it. This is a founder-illustrated negotiation range, **not a stated ACV average** — treat it as the shape of the curve, not as a mean.

| Source | Authority | Claim | Status after Rev 2 |
|---|---|---|---|
| **Introw CEO, first-person** | **2** | **€10k vs €13k for the same platform; list price at 50–100 FTE; ROI-based above** | **Governing** |
| PartnerPortal.io (competitor, Aug 2026) | 9 | Pro $329/mo, Scale $499/mo | Plausibly the low end of the curve / entry list price. Superseded as a characterisation. |
| JourneyBee (competitor, Jun 2026) | 9 | Base $999/mo, $2,000/mo at 100 partners | Plausibly the mid-curve. Superseded as a characterisation. |
| Introw pricing page | 1 | No figures published | Consistent with value-based sales-led motion |

**Both competitor figures are now explicable as points on the same partner-count curve rather than as a contradiction** — which is what I hypothesised in Revision 1 and can now largely confirm. Remaining investigation notes:

- Both external sources are competitors with an incentive to distort in opposite directions (PartnerPortal competes on price-accessibility and benefits from Introw looking cheap-and-limited; JourneyBee competes on flat pricing and benefits from Introw looking expensive-and-escalating).
- Both may be partly right: if pricing is **tier-based on partner count**, then "$329 entry" and "$2,000 at 100 partners" are not necessarily contradictory — they could be the same curve sampled at different points.
- Introw removing published figures from its own pricing page (PartnerPortal explicitly states as of Aug 2026 that *"Introw publishes pricing"* — it currently does not) is itself the most informative datum.
- A named AWS Marketplace reviewer independently corroborates the opacity from the customer side: *"It would be helpful to have clearer visibility into what additional functionality is available and the associated price points."* **[DSC]**

**INTERPRETATION:** Introw has moved from published to unpublished pricing. The founder source confirms all three of the drivers I listed as candidates in Revision 1 — **moving up-market, value-based variability, and price increases — are happening simultaneously and deliberately**, and that price is being used as a *segmentation instrument* rather than merely as a revenue lever: raising price is how they push themselves toward larger, lower-churn accounts. Geamanu also states plainly that price is never settled: *"wat we vooral geleerd hebben is dat prijs nooit vast staat… die markt verandert zo snel, concurrenten moven."*

**CONFIDENCE:** Pricing structure — high. Pricing *level* — **medium, and no longer unresolved.** Working band €10k–€13k for negotiated mid-market, list price below at 50–100 FTE, more above. **Still: do not state a number to a prospect** (it is a founder's illustration in a podcast, not a rate card), and do not build ACV assumptions into radar scoring — the band is useful for deal-sizing intuition and for judging whether an account is worth a seller's time, nothing more.

## B.9 Land motion, expansion motion, switching cost

> **CORRECTION — Revision 1 was wrong here.** Revision 1 classified the land motion as product-led and called the free tier "a genuine land motion, not a marketing gesture." The founder source directly contradicts this and governs.

**OBSERVED [DSF]:** Geamanu, unprompted, on PLG: *"Wij hebben op een bepaald moment wel gedacht om PLG te gaan… wij hebben dat uiteindelijk niet gedaan omdat we net gegroeid zijn in het type bedrijf waaraan dat we verkopen vandaag."* And decisively: ***"met elke klant die vandaag Introw getekend heeft, hebben we een touchpoint gehad, een call, een onboarding call."*** He describes the model as freemium with a hard commercial gate: everything is available for **exactly one partner** — portal, training, commission calculation, MDF, affiliate links — and *"op het moment dat ze naar hun tweede partner willen gaan, dan komen zij in een betalend model"* and must talk to sales.

**OBSERVED [DSI + SMES]:** 500+ HubSpot marketplace installs against ~100+ paying customers.

**REVISED INTERPRETATION:** The land motion is **freemium-as-evaluation, 100% sales-touched**. There is no self-serve transaction path at any point. The free tier is a de-risking and internal-business-case instrument — the Cumulocity story (VP builds a portal himself in 48 hours, shows management, then buys through sales) is the *intended* use of it, not an accidental one.

**The most commercially significant consequence, and it inverts my Revision 1 reading of the same datum.** A ~5:1 install-to-customer ratio is not a self-converting funnel that seller attention would only disturb. It is roughly **400 accounts that have already connected their CRM, already built a portal, already proven they have a partner motion — and, per the founder, have never been converted by a call.** Under a genuinely product-led model those are passive. Under a sales-led model with a freemium front door, they are the warmest outbound list the company owns, they sit inside Introw's own systems, and they require no external radar to find. **Cross-referencing the free-tier install base against the two-partner-manager gate (§D.1) is almost certainly a higher-yield first action than any external signal.** This should be verified internally before radar engineering begins — it may materially reprioritise the whole build.

**Expansion [RI from DSI packaging]:** partner-count growth (the pricing axis) → tier upgrade for Salesforce/MCP/Crossbeam → add-on attach (LMS, MDF, CPQ, affiliate, embed, Power BI, API) → seats → Enterprise for SSO and custom objects. Multiple independent expansion vectors, which is a healthy structure.

**Switching cost [RI]:** Moderate and *increasing*. Low at land (CRM stays source of truth — the explicit anti-lock-in pitch, which cuts both ways). Rises materially once partners are trained through the LMS with certifications, commission plans are running, portal is on a custom domain, MCP is wired into internal AI workflows, and SSO is deployed. **The AI/MCP layer is the real moat because it embeds Introw into the customer's own internal automation** — Quatt's order-processing assistant and Cumulocity's Claude-generated reporting are both examples of Introw becoming infrastructure rather than a tool.

**Time to value [DSC ×3]:** days to <4 weeks.

---

# C. CUSTOMER EVIDENCE

## C.1 Complete verified customer set

Every entity below appears on an Introw-controlled page. Persona titles are as published by Introw.

### Full case studies with named persona

| # | Customer | Industry (as tagged) | Geography | Named persona | Stack | Evidenced trigger | Published result |
|---|---|---|---|---|---|---|---|
| 1 | **Cumulocity** | IoT / AIoT platform | DE-rooted, teams in 20 countries, ~300 people | Bart Schouw, **Global VP Partners & Alliances** | HubSpot, Crossbeam | **Became independent (carve-out) — barred from taking partners** | 0→20% partner-sourced deals in 15 mo; 30→100+ partners; 48h to build portal; 97% deal-reg acceptance |
| 2 | **Ringover** | Sales tech / telephony | France | Florian Servant, **Sr. Partnerships Marketing Manager** | — | Low partner activity | 20%→70% active partners; 25% connect daily; +200 lead submissions |
| 3 | **Factorial** | HR tech | Spain | Clara Arnaud, **Partner Revenue Operations** | HubSpot | Scale of program | 500+ partners; 100+ partnership managers; <4 wks live; 3.5x partner activity |
| 4 | **Quatt** | Manufacturing (heat pumps) | Netherlands | Rick Hakkaart, **BDM** | HubSpot, Slack | Installer network outgrew spreadsheet | 10→200+ installers in ~1 yr; +200 off-portal lead submitters; 1,400 form submissions |
| 5 | **Cubbit** | Cloud storage / cybersecurity | Italy | Ilaria, **Head of Marketing** (+ CSM) | HubSpot, Slack | **Migrating off an incumbent PRM** | Increased adoption; 20+ assets shared; 200+ activities tracked |
| 6 | **Zenity** | Cybersecurity | IL/US | Mike Foster, **Partner Lead** | — | PRM selection | — |
| 7 | **Sedai** | AI & automation | US | Darin Ritz, **Head of Partners & Alliances** | — | PRM selection | — |
| 8 | **Epiphan Video** | Hardware / manufacturing | Canada | Victor Doubrovine, **Head of Growth** | — | PRM selection | — |
| 9 | **Xelix** | Financial services / fintech | UK | Fred Leeming, **Head of Partnerships** | — | Portal access friction | Higher partner engagement |
| 10 | **WeGive** | Martech | US | Nelson Lacambra, **Account Executive** | — | Complex commissions | Simplified commissions, scaled partner success |
| 11 | **SafeBreach** | Cybersecurity | US/IL | Joe Wilkinson, **Channel Director** | — | Partner management complexity | Simplified partner management |
| 12 | **Payflip** | HR tech | **Belgium** | Cédric De Bruyne, **Growth Marketeer** | — | Partnership revenue | **+200% partnership revenue** |
| 13 | **Coder** | Software dev / fin services | US | Tim Cleary, **Sr. Partnerships Manager** | — | Static partnerships | Scalable co-selling motion |
| 14 | **Tensis** | AI & automation | US (likely) | Chris Britton, **COO** | — | Spreadsheets | Live in under two weeks |

### Logo-only (no published story — treat as lower evidence)

ShareGate (CA) · Archer (US) · Axon (US) · **Aikido Security (Belgium)** · Personio (DE) · Parloa (DE) · ReversingLabs (US/HR) · Storyblok (AT)

### Independent third-party customer evidence

- **AWS Marketplace review [DSC]:** unnamed reviewer, *"invaluable for our partner program after our management buyout… starting from scratch… very small partner team… Introw's automation enables us to reach and engage partners regularly without requiring additional headcount."* — **independently corroborates both the ownership-change trigger and the headcount-constraint thesis.**
- **PeerSpot review [DSC]:** *"approximately over eighty percent of our partners or more using the platform every day."*
- **HubSpot marketplace review, Jul 2026 [DSC]:** notes coverage of *"partner onboarding, document sharing, task management, partner tiers, quoting, learning management,"* praises responsiveness, criticises flat page hierarchy and journey-building limits.

## C.2 What customers have in common — the repeating patterns

**PATTERN 1 — Small partner team, large or fast-growing partner network. [DSC, 4 independent sources]**
Cumulocity (2-person team → 100+ partners) · Quatt ("without adding headcount" → 200+) · AWS reviewer ("very small partner team") · Factorial (500+ partners). **This is the single strongest repeating pattern in the dataset and it is the basis of the core ICP.**

**PATTERN 2 — Transacting partners, not integration partners. [DSC, all 14]**
Every case involves partners who bring or close deals: resellers, referral partners, installers, distributors, implementation partners, agencies. Not one case study is about an integration/tech-partner ecosystem.

**PATTERN 3 — HubSpot is the disclosed stack wherever a stack is disclosed. [DSC, 4/4]**
Cumulocity, Cubbit, Quatt, Factorial — all HubSpot. Zero disclosed Salesforce case studies. (A G2 reviewer with 15 years of PRM experience does describe a seamless Salesforce setup, so Salesforce customers exist — they are simply not the published proof.)

**PATTERN 4 — The prior state is spreadsheets/email, or a PRM that failed on adoption. [DSC]**
Tensis, Cumulocity, Quatt → spreadsheets. Cubbit → *switched from* an incumbent PRM specifically because deal registration was manual and there was no CRM dedup.

**PATTERN 5 — The stated purchase driver is speed and simplicity, not capability breadth. [DSC]**
Cumulocity chose Introw over *"more complex systems the team compared it against."* Cumulocity's own product is technically dense, so they explicitly did not want a partner system that added comparable complexity.

## C.3 What customers do NOT have in common — and what that kills

**They do not share an industry.** IoT, sales tech, HR tech, heat-pump manufacturing, cloud storage, cybersecurity, fintech, martech, developer tooling, AI/automation. **Introw's own site lists 11 industry pages. That is an SEO surface, not an ICP. Using Introw's industry pages as a targeting filter would be a category error.** **[RI, high confidence]**

**They do not share a size band.** Cumulocity ~300 employees; Factorial 1,000+; Payflip, Tensis, WeGive materially smaller. G2 segment split (Mid-Market 63.0%, SMB 35.2%, Enterprise 1.9%) confirms a spread rather than a band. **No headcount band is evidence-supported. Do not encode one as a hard filter.**

**They do not share a partner type.** Resellers, referral partners, installers, distributors, MSPs, agencies, implementation partners, system integrators.

**They do not share a buyer title.** See §A.4 and §G.

**They do not share a geography.** BE, NL, FR, ES, IT, UK, DE, AT, CA, US, IL, HR.

## C.4 Which stories are exceptional rather than representative

Adversarial screen — these should **not** be used as ICP anchors:

- **Factorial (500+ partners, 100+ partnership managers)** — an order of magnitude above every other published customer. Almost certainly Introw's flagship Enterprise deployment. Treating it as representative would push targeting toward accounts Introw is not yet structurally strong in (per its own 1.9% G2 Enterprise share). **Use as proof of ceiling, not as ICP.**
- **Quatt (20x growth)** — spectacular, but a D2C hardware company with a certified-installer network. Genuinely important as proof that non-SaaS works, but the 20x number is a function of starting from 10 partners. **Use as proof of segment breadth, not as an outcome benchmark.**
- **Cumulocity (0→20% partner-sourced revenue)** — the best-evidenced story in the set and the closest thing to a repeatable template, *but* it is a carve-out. The clean-slate condition is what made the 15-month result possible. **Use as the trigger template, not as a generic outcome promise.**

## C.5 The case-study set is an archive of a *moving* ICP, not a snapshot [ADDED IN REVISION 2]

**OBSERVED [DSF]:** *"Wij zijn eigenlijk ook gewoon gegroeid met onze klanten mee. Dus onze pricing is ook gewoon veranderd doordat onze klanten alsmaar groter geworden zijn."* And on the cost of that: *"het moeilijke is dan ook wel afscheid nemen van die lagere pricing. Ik denk dat ik het daar zelf persoonlijk het moeilijkst mee heb."* Combined with the two-partner-manager floor and the churn statement in §D.1.1.

**INTERPRETATION:** Introw's ICP has moved upward continuously since the January 2024 pivot, and the published case studies were captured at different points along that path. **They must therefore be read as a time series, not as a single population.** Sorting them against the current founder-stated floor produces a clean split:

| Likely CURRENT ICP | Likely LEGACY ICP (would probably not be sold to today) |
|---|---|
| **Cumulocity** — VP Partners & Alliances, dedicated 2-person partner team, ~300 FTE, 100+ partners. Sits exactly on the floor. | **Quatt** — one BDM, no partner function |
| **Factorial** — Partner Revenue Operations, 100+ partnership managers, 500+ partners | **Payflip** — Growth Marketeer |
| **SafeBreach** (Channel Director), **Sedai** (Head of Partners & Alliances), **Xelix** (Head of Partnerships) — all imply a partner function | **WeGive** — Account Executive |
| | **Tensis** — COO |

**CONSEQUENCE — and this partially weakens my own Revision 1 headline finding.** §G.1 reports that 6 of 14 evidenced buyers (43%) hold no partner title, and Revision 1 used that to argue for a dual-path persona resolver of equal weight. That 43% is now visibly **concentrated in the legacy cohort**. The pattern is real, but it is substantially a fossil of the 2024–25 ICP rather than a description of who Introw sells to now. See the revised §G.1.

**CONFIDENCE:** High on the direction of drift (founder-stated). Medium on the specific sorting above — case studies carry no reliable publication dates, so the assignment is inferred from persona seniority against the founder's stated floor, not from timestamps.

---

# D. CORE ICP

## D.1 Core ICP definition

> **A B2B company running HubSpot as CRM, with an existing or actively-recruiting network of transacting partners (resellers, referral partners, implementation partners, installers, agencies, MSPs, distributors) numbering roughly 20–500, managed by a partner function of at least 2 and no more than roughly 6 people, where indirect revenue is a named strategic priority but has not yet earned an enterprise channel budget.**

### D.1.1 The two-partner-manager floor — stated by the founder, and it hardens the whole model

**OBSERVED [DSF]:** *"Vandaag willen wij altijd verkopen aan een bedrijf dat minstens twee partnership managers heeft. Het is al zo een niche market, maar dat toont gewoon dat ze een bepaald volume aan partners hebben, een bepaald volume aan omzet via partners ook."* And the explicit exclusion: *"vandaag gaan wij niet meer aan founders verkopen. In het begin zouden wij elke founder contacteren en zeggen: heb je iets van partnership motion, dan heb je sowieso Introw nodig. **En dat zijn dan natuurlijk de bedrijven die ook gechurnd zijn.**"*

**INTERPRETATION:** This does not replace the ratio thesis — it puts a **floor underneath it**, and it does so with churn evidence behind it rather than inference. Two partner managers is Introw's own proxy for "there is real partner volume and real partner revenue here." Below that line, Introw has already learned that the accounts churn.

**This makes the gate both sharper and cheaper.** `partner_team_headcount >= 2` is a single LinkedIn title count — the least ambiguous, fastest, lowest-cost qualification step in the entire model, and it can run *before* the expensive directory crawl. Revised gate order: CRM → partner team ≥ 2 → transacting channel → ratio.

**Revised upper bound.** Revision 1 gave "1–4 FTE" from case-study observation. The floor is now founder-stated at 2. The ceiling remains inferred, and Factorial (100+ partnership managers) proves it is soft rather than hard — large partner orgs do buy, they are simply not where the volume is.

### Dimension-by-dimension, with evidence status

| Dimension | Core ICP | Status | Basis |
|---|---|---|---|
| **CRM** | **HubSpot** (hard gate) | **DSI + SMES** | Only CRM on every plan; certified app; 500+ installs; 4/4 disclosed stacks; reviewer consensus |
| **Partner network size** | ~20–500 transacting partners | **RI from DSC** | Cumulocity 100+, Quatt 200+, Factorial 500+ (ceiling) |
| **Partner team size** | **≥2 FTE (hard floor), roughly ≤6 (soft ceiling)** | **DSF (floor) + DSC (ceiling)** | Founder: *"minstens twee partnership managers"*, with churn evidence below that line. Ceiling from Cumulocity "two-person team", AWS reviewer "very small partner team", Quatt "without adding headcount" |
| **Ratio** | **Network ÷ team ≥ 20**, applied *after* the ≥2 floor | **RI, core thesis** | Derived from all of the above |
| **Partner type** | Transacting (resell/refer/implement/install) | **DSC 14/14** | Every case study |
| **Sector** | Sector-agnostic within B2B; software over-indexes | **SMES** | G2: Computer Software 46.3% of reviewers |
| **B2B vs B2C** | B2B, or B2C-with-B2B-channel (Quatt) | **DSC** | Quatt is D2C product sold through B2B installers |
| **Employee count** | **Not a filter.** Observed range ~50–1,000+ | **DSC + SMES** | G2 MM 63.0% / SMB 35.2% / Ent 1.9% |
| **Program maturity** | Program exists but is under-tooled — spreadsheets, or a PRM failing on adoption | **DSC** | Tensis, Cumulocity, Quatt, Cubbit |
| **GTM posture** | Sales-led or hybrid with a real indirect motion | **RI** | Deal registration presupposes a sales process |
| **Geography** | EU + US + English-speaking; multilingual capable | **DSI + DSC** | Ghent + NY offices; 6-language app listing; 12-country customer spread |
| **Security burden** | Standard mid-market. SSO requirement → Enterprise | **DSI** | ISO/SOC2 clear it; SSO gated |

## D.2 Why each element holds

**Why HubSpot is the gate, not a preference.** It is the only CRM available on every tier including free (removing the single largest friction to a self-serve land), it is Introw's certified distribution channel, and it is the capability reviewers consistently name as best-in-class. A Salesforce prospect is a *fit* but a more expensive, more gated, later-stage-tier deal. A Pipedrive/Zoho/Attio/Dynamics prospect is a **non-fit** — not a long sales cycle, a structural exclusion.

**Why the ratio and not the size.** Cumulocity (~300 people) and Factorial (1,000+) and Payflip (small) are all customers. Employee count does not discriminate. What discriminates is whether a small number of humans is accountable for a large number of partner relationships. That is the pain Introw's automation and AI agents are literally built to absorb, and it is what three independent customers say in their own words.

**Why "transacting partners" and not "partnerships."** Deal registration, attribution, commission, channel conflict, tiering, CPQ, MDF — the entire object model presupposes partners who *sell*. A tech-partner ecosystem generates none of these objects.

**Why "under-tooled but not un-programmed."** Introw is not a program-design consultancy. Cubbit and Cumulocity both had *something* running. The buyer must already believe partnerships matter. A company with zero indirect motion is not an early prospect — it is a non-prospect.

---

# E. SECONDARY ICP

## E.1 Secondary A — Salesforce-based mid-market with a transacting channel

Same structural profile, Salesforce instead of HubSpot. **Status: RI, medium confidence.**
- *Supporting:* Salesforce is a first-class supported CRM; a 15-year-PRM-veteran G2 reviewer reports seamless Salesforce setup in minutes; the product is genuinely dual-CRM.
- *Against:* zero disclosed Salesforce case studies; Salesforce gated to Scale+; G2 pros/cons cites *"complicated Salesforce configurations"* as a friction (2 mentions).
- *Consequence:* higher ACV, higher tier, but weaker proof and thinner reference base. Also **far harder to detect externally** (see §M).

## E.2 Secondary B — Non-software with a dealer/installer/reseller network

Manufacturing, hardware, energy, industrial equipment. **Status: DSC, medium-high confidence.**
- *Supporting:* Quatt (heat pumps, 200+ installers) and Epiphan Video (hardware) are both published customers; Introw maintains dedicated Manufacturing and IoT industry pages and a *hardware distributors* partner-type page.
- *Against:* only two published non-software cases; the buyer here often has no partner-family title (Quatt's is a BDM), which breaks standard persona routing.
- *Consequence:* real and under-served, but requires a different persona-detection method. Commercially attractive precisely *because* competitors' radars are tuned to SaaS partner titles.

## E.3 Secondary C — Carve-outs, MBOs, spin-outs, post-divestiture entities

**Status: DSC ×2 — this is arguably strong enough to be Core, and is held at Secondary only because the population is small and episodic, not because the evidence is weak.**
- *Supporting:* Cumulocity and the AWS-marketplace MBO reviewer — two independent customers, both describing rebuilding a partner program from zero after an ownership event, both citing tiny teams.
- *Why it is exceptional:* no incumbent PRM contract to displace; a hard external deadline; a mandate and budget; and an executive personally accountable. This is the highest-quality buying condition in the model.
- *Consequence:* low volume, extremely high conversion. Should be a **standing always-on watch**, not a campaign.

## E.4 Secondary D — Displacement from a legacy or portal-first PRM

**Status: DSC, medium confidence.**
- *Supporting:* Cubbit switched *from* an incumbent PRM, citing manual deal registration, no CRM dedup, and manual partner addition. Introw maintains a full comparison hub against *"every PRM."* Introw's own FAQ is built as an anti-traditional-PRM argument.
- *Against:* only one published displacement story; contract timing is invisible externally.
- *Consequence:* the *message* is proven; the *timing* is not observable. This is a nurture segment, not a trigger segment.

---

# F. ANTI-ICP AND CLEAR EXCLUSIONS

## F.1 Hard exclusions — do not enter the funnel

| Exclusion | Why | Status |
|---|---|---|
| **CRM is Pipedrive, Zoho, Attio, Dynamics, Close, Copper, or bespoke** | No native integration exists. Structural non-fit. | **DSI + SMES** |
| **No CRM at all** | Product has no system of record to attach to. | **DSI** |
| **No indirect/partner motion of any kind** | Nothing to register, attribute, or pay. | **RI, high** |
| **Ecosystem is integration/tech partners only** | No deal registration, no commission, no attribution, no channel conflict. The largest false-positive class. | **RI, high** |
| **Pure affiliate / influencer / performance-marketing motion** | Different category (Impact, Partnerize, Tune, Rewardful). Introw's affiliate module is an add-on, not the core. | **SMES** |
| **B2C with no B2B channel** | No partner objects. | **RI** |
| **Professional-services firms where "Partner" means equity partner** | Law, accounting, consulting, VC/PE. Title-matching contamination. | **RI, high** |
| **Staffing / recruitment marketplaces and job boards** | "Partner Manager" postings are marketplace artifacts, not employer intent. | **RI, high** |
| **Companies in visible decline / distress** | No discretionary GTM tooling spend. | **RI** |

## F.2 Soft anti-ICP — deprioritise, do not permanently exclude

| Condition | Why | Status |
|---|---|---|
| **Large enterprise channel org needing TCMA, deep MDF, multi-tier distributor governance** | Multiple independent sources place this outside Introw's design; enterprise suites (ZINFI, Impartner, MindMatrix, Channelscaler) are built for it. G2 Enterprise share 1.9%. | **SMES** |
| **Partner function fully outsourced to an agency/distributor** | No internal owner, no internal budget. | **RI** |
| **Closed / invitation-only partner program with a handful of strategic alliances** | Below the ratio threshold. Nothing to automate. | **RI** |
| **Native account mapping is a hard requirement** | Introw delivers it via Crossbeam, not natively — the most consistently cited limitation. | **SMES** |
| **Extremely early: <10 partners, no program owner** | Genuinely served by the free tier. Not worth seller time until it grows. | **RI** |

**Adversarial note on the last row:** the free tier means "too small today" ≠ "not a customer." These accounts should be *routed to product-led nurture*, not deleted. Deleting them destroys the top of the expansion funnel — which, given 500+ installs against ~100+ paying customers, is a large asset.

---

# G. PERSONA MODEL

## G.1 The empirical persona distribution — Introw's own published buyers

**OBSERVED [DSC]:** Across 14 named case-study personas:

| Persona family | Count | Titles observed |
|---|---|---|
| **Senior partner leadership** | 4 | Global VP Partners & Alliances · Head of Partners & Alliances · Head of Partnerships · Channel Director |
| **Partner manager / IC** | 3 | Partner Lead · Sr. Partnerships Manager · Sr. Partnerships Marketing Manager |
| **Partner RevOps** | 1 | Partner Revenue Operations |
| **Non-partner commercial** | 3 | BDM · Account Executive · COO |
| **Marketing / growth** | 3 | Head of Marketing · Head of Growth · Growth Marketeer |

**INTERPRETATION:** 8 of 14 (57%) carry a partner-family title. **6 of 14 (43%) do not.** The non-partner-titled buyers are concentrated in the smaller and non-SaaS accounts, where no dedicated partner function exists yet and partner ownership sits with whoever has commercial or growth accountability.

**CONFIDENCE:** High — this is a direct count from Introw's own published material, not an inference.

> **REVISION 2 — this finding is downgraded, partly against my own Revision 1 argument.**
>
> The count above is accurate, but §C.5 shows the case-study set spans a **rising** ICP, and the founder now states a hard floor of two partnership managers with churn evidence below it. The six non-partner-titled buyers sit almost entirely in the **legacy cohort** — Quatt (BDM), Payflip (Growth Marketeer), WeGive (AE), Tensis (COO). Under the current gate, most of those accounts would not be sold to at all.
>
> **Revised consequence.** Partner-title-only persona resolution is *not* wrong for 40% of the accounts Introw sells to today; it is wrong for roughly 40% of the accounts Introw sold to *historically*. **Path B is therefore demoted from co-equal to a scoped fallback**, retained specifically for the non-SaaS dealer/installer/distributor segment (§E.2), where the buyer genuinely may not carry a partner title even at real scale — and where Quatt remains the reference. Elsewhere, the partner-title path is now the primary and largely sufficient route.
>
> **Why this still matters and is not simply deleted:** in the non-SaaS segment the *company* can satisfy every structural gate — HubSpot, 200+ transacting partners, real commission volume — while presenting no partner-titled person at all. A resolver that hard-requires a partner title would drop those accounts at the persona step after they had already passed every expensive gate. That is the specific failure Path B exists to prevent, and it is narrower than Revision 1 claimed.

## G.2 Introw's own declared personas

**OBSERVED [DSI]:** Introw publishes exactly four role pages: **Channel Partner Manager · Partner Marketing Manager · RevOps · CRO.**

**INTERPRETATION:** Introw's *marketing* model recognises four personas; its *customer evidence* shows at least five families including growth/marketing generalists and COO/BDM. Where these diverge, the customer evidence is the stronger source. Note especially: **Introw publishes a CRO page, but no case study features a CRO.** The CRO is an aspirational/economic persona in Introw's positioning, not yet an evidenced champion.

## G.3 Persona detail

### TIER 1 — Head/VP of Partnerships, Alliances, or Channel

- **Day-to-day pain:** chasing partner status updates; manual deal-reg intake; reconstructing attribution; no reportable partner pipeline; being the human help desk for partner questions; commission spreadsheets.
- **KPI:** partner-sourced/influenced pipeline and revenue; % active partners; partners onboarded; time-to-first-deal.
- **Incentives:** usually carries a partner revenue number.
- **Budget ownership:** often holds a small tooling budget; frequently needs CRO/CFO sign-off above a threshold. **[RI]**
- **Buying authority:** champion and usually decision-maker at Pro/Scale; not sole authority at Enterprise.
- **Current tools:** CRM + spreadsheets + Slack/email + shared drive; sometimes an incumbent PRM they dislike.
- **Likely objections:** "we already have a PRM"; "my partners won't adopt another tool"; "our CRM is a mess"; "I don't have budget until next FY"; "account mapping isn't native."
- **Trigger sensitivity:** very high to partner-count growth, program relaunch, adoption failure, ownership change.
- **Why they might ignore Introw:** PRM fatigue; assumes another portal means another adoption failure. **The "portal-optional/headless" message exists precisely to defuse this and is the correct opener for this persona.** **[DSI]**
- **Preferred entry:** their partner-adoption problem, in their language. Not AI.
- **Evidence status:** **DSC** — Cumulocity, Sedai, Xelix, SafeBreach, Zenity.

### TIER 1 — Partner RevOps / Partner Operations

- **Pain:** partner data drift between PRM and CRM; duplicate opportunities; broken attribution; unreportable partner activity; manual reconciliation.
- **KPI:** data integrity; reporting accuracy; automation coverage.
- **Influence:** very high — often the *technical* veto and the *technical* champion simultaneously.
- **Objections:** "how does the sync actually work?"; "what happens to our custom objects?"; "who owns the field mapping?"
- **Why they care:** Introw's core claim — CRM stays the single source of truth, no second system to reconcile — is aimed directly at them. **This is the persona for whom Introw's product argument is strongest and least contested.** **[DSI + DSC — Factorial's persona is literally Partner Revenue Operations]**
- **Preferred entry:** the reconciliation problem and the CRM-object model.
- **Evidence status:** **DSC** — Factorial.

### TIER 2 — Partner Marketing Manager

- **Pain:** partners can't find current assets; no visibility into what gets used; campaigns don't reach the network; co-branding chaos.
- **KPI:** asset utilisation, partner engagement, campaign reach.
- **Budget:** rarely owns the PRM budget; strong influencer.
- **Evidence status:** **DSC** — Ringover (Sr. Partnerships Marketing Manager), Cubbit (Head of Marketing).

### TIER 2 — CRO / VP Sales

- **Pain:** partner revenue is unforecastable; channel conflict surfaces as escalations; can't answer "what did the channel actually source?"
- **KPI:** total pipeline coverage, revenue mix, forecast accuracy.
- **Budget:** economic buyer above the threshold.
- **Objections:** "is this a real channel or a hobby?"; "does this cannibalise direct?"
- **Trigger sensitivity:** high to a shift in revenue mix toward indirect; high to a new partner leader they just hired.
- **Why they might ignore:** partner tooling is small-ticket and delegated.
- **Evidence status:** **DSI only** (Introw publishes a CRO page). **No case study features a CRO.** Treat as economic buyer and secondary contact — **not** as a primary entry point. This is a deliberate demotion against Introw's own marketing hierarchy.

### TIER 2 — COO / Founder (smaller companies)

- **Pain:** partner motion is unstructured and consuming leadership time.
- **Budget:** full authority.
- **Evidence status:** **DSC** — Tensis (COO).

### TIER 3 — Growth / BD generalist with de facto partner ownership

- **Titles observed:** BDM, Head of Growth, Growth Marketeer, Account Executive.
- **Why they matter:** in the non-SaaS and sub-scale segments, this *is* the buyer. Quatt — the 20x story — was bought by a BDM.
- **Detection problem:** no partner keyword in the title. Must be found via *company-level* signals (public partner/installer/dealer directory, "become a partner" page) and then resolved to whoever owns it.
- **Evidence status:** **DSC** — Quatt, WeGive, Epiphan, Payflip.

### BLOCKERS

| Blocker | Concern | Mitigation |
|---|---|---|
| **IT / Security** | External users touching CRM data; SSO mandate | ISO 27001 + SOC 2 Type II + trust centre; **SSO requires Enterprise — surface early** |
| **CRM owner / Salesforce admin** | "Nothing else writes to our CRM" | Bi-directional sync architecture, field-level mapping, native app-card model |
| **Finance / Procurement** | New vendor, unclear price scaling | Free tier de-risks; **pricing opacity is a real friction — the AWS reviewer said so explicitly** |
| **Incumbent PRM owner** | Sunk cost, personal credibility | Cubbit displacement narrative; adoption-failure framing |
| **Direct sales leadership** | Channel conflict / margin | AI channel-conflict resolution; Cumulocity's 97% acceptance with manual review |

### ANTI-PERSONAS

| Anti-persona | Why |
|---|---|
| **Corp Dev / Strategic Partnerships (M&A, JV, BD)** | Nothing to do with channel operations. Title collision only. |
| **Affiliate / Performance Marketing Manager** | Wrong category. |
| **"Partner" at law/accounting/consulting/VC firms** | Title collision. Highest-volume contamination source. |
| **Marketplace / App Store / Integrations Manager** | Integration ecosystem ≠ transacting channel. **Second-highest contamination source.** |
| **HR "Business Partner" / "People Partner"** | Pure keyword collision. Must be explicitly excluded in any title matcher. |

## G.4 Persona priority table

| Tier | Persona | Role | Evidence |
|---|---|---|---|
| **1** | Head/VP Partnerships, Alliances, Channel | Champion + usual decision-maker | DSC ×5 |
| **1** | Partner RevOps / Partner Ops | Technical champion + veto | DSC ×1, DSI |
| **2** | Partner Marketing Manager | Champion (enablement-led entry) | DSC ×2 |
| **2** | CRO / VP Sales | Economic buyer, secondary contact | DSI only — no case study |
| **2** | COO / Founder (small co.) | Economic buyer + decision-maker | DSC ×1 |
| **3** | Growth/BD generalist owning partners | De facto buyer in non-SaaS/sub-scale | DSC ×4 |
| **Anti** | Corp Dev · Affiliate Mgr · Marketplace Mgr · Prof-services "Partner" · HR BP | Exclude | RI |

---

# H. USER vs BUYER vs ECONOMIC BUYER

| Layer | Who | What they do | Evidence |
|---|---|---|---|
| **End user — external** | The partner's sellers and managers | Register deals, pull assets, take LMS courses, ask the AI agent, view pipeline — via Slack/Teams/email/AI assistant/portal | DSI + DSC (Quatt: 200+ *additional* partners submitting leads **with no login at all**) |
| **End user — internal** | Partner managers, AEs, marketing | Manage partners from inside HubSpot/Salesforce via app cards | DSI |
| **Champion / user-buyer** | Head of Partnerships, Partner Ops, Partner Marketing, or the growth/BD generalist | Evaluates, often self-serve builds first, then sells internally | DSC — Cumulocity built it himself in 48h |
| **Technical approver** | RevOps / CRM admin | Approves sync architecture and field mapping | RI + DSC (Factorial) |
| **Economic buyer** | CRO / COO / Founder; CFO at Enterprise | Signs; cares about partner-sourced revenue, not features | DSI (CRO page) + RI |
| **Security approver** | IT/Security | ISO/SOC2/GDPR; **SSO mandate forces Enterprise** | DSI |

**The critical distinction sellers get wrong here.** The **most numerous users are external and unpaid** — the partners themselves. Introw's entire differentiation is that adoption is measured on people who are not the customer's employees and cannot be mandated to log in. Ringover's headline metric is *partner* activity (20%→70%). Quatt's most striking number is 200+ partners submitting leads **without logging in**.

**Consequence:** the ROI argument is not "your team saves time." It is **"partners who ignored your portal will now transact."** That reframes the value from internal efficiency (small, hard to fund) to partner-sourced revenue (large, CRO-fundable). **[RI, high confidence — this is the single most important framing insight in the persona section]**

---

# I. PAIN TAXONOMY

## I.1 Explicitly stated by Introw [DSI]

| Pain | Introw's own words |
|---|---|
| Low partner adoption of standalone portals | *"every partner has to log in and adoption stays low"* |
| Second system to reconcile with CRM | *"no second system to reconcile"* |
| Spreadsheet-based partner management | *"Stop managing partners in spreadsheets"* |
| Long PRM implementations | *"without the lengthy implementations of a traditional PRM"* |
| Channel conflict | Named AI feature, all plans |
| Duplicate opportunities | Real-time duplicate detection on registration |
| Partner attribution | Automatic partner attribution on CRM writeback |
| Manual partner-facing support load | 24/7 AI partner support agent |
| Manual commission calculation and payout | Commission & SPIFF module |
| Manual partner reporting | *"Forget about spending hours on partnership reporting"* |
| Partner onboarding/training at scale | AI-powered LMS + certification |
| Asset findability and tracking | Content enablement with per-asset tracking |
| Difficulty of cold outbound (macro framing) | *"As cold outbound is becoming a challenge, more and more companies are embracing partnerships"* (careers page) |

## I.2 Explicitly stated by customers [DSC] — the highest-value evidence

| Pain | Source | Verbatim substance |
|---|---|---|
| **No single source of truth; spreadsheet chaos** | Cumulocity | *"I've seen in previous companies the pain if you start working with spreadsheets because there's no single truth, it's always chaos."* |
| **Cannot scale personal attention** | Cumulocity | *"Introw helps me because I can't do that 24 hours a day."* |
| **Channel conflict with no system to prevent it** | Cumulocity | Named directly as one of the most important things to solve |
| **Complex partner systems are wrong for a 2-person team** | Cumulocity | Product complexity was itself disqualifying |
| **Inherited unqualified partner records** | Cumulocity | Hundreds of records from former parent, mostly noise |
| **Manual deal reg with no CRM dedup** | Cubbit | Partners had to log in; no deduplication |
| **Manual partner provisioning doesn't scale** | Cubbit | Manual adds became unmanageable |
| **Partners can't find current materials** | Cubbit | Files scattered across inboxes |
| **No way to push partner engagement into the CRM** | Cubbit | Team couldn't collaborate on deals in CRM |
| **No centralised partner overview** | Quatt | Data across disconnected tools |
| **Inconsistent, ad-hoc onboarding** | Quatt | No repeatable process |
| **Deal attribution guesswork** | Quatt | *"a guessing game"*; constant back-and-forth |
| **Manual commission tracking** | Quatt | Time-consuming, error-prone |
| **Low partner activity** | Ringover | 20% baseline active partners |
| **Complex commission structures** | WeGive | Headline of the case study |
| **Static, non-scalable partnerships** | Coder | *"static partnerships"* → co-selling motion |
| **Rebuilding a program after ownership change** | Cumulocity + AWS reviewer | Two independent sources |
| **Partner-team headcount constraint** | Quatt + AWS reviewer | *"without adding headcount"* / *"without requiring additional headcount"* |

## I.3 Inferred from product design [RI] — use with care

- Partner performance measurement / tiering discipline (partner goals, tiering modules exist; no customer names this as the *buying* pain)
- Partner communication at scale (campaigns module)
- MDF administration (add-on)
- Partner quoting friction (CPQ add-on)
- **These are expansion pains, not land pains.** No case study buys on them.

## I.4 Generic market pain — DO NOT convert into Introw-specific truth

The following are true of the category and appear widely in PRM marketing, but are **not** evidenced as Introw purchase drivers and should never be presented as if they were:

- "Partnerships drive X% of B2B revenue" (macro stat, not an account-level pain)
- "Ecosystem-led growth is the future"
- "Partner ecosystems reduce CAC"
- Generic "channel enablement maturity" framing

**Adversarial verdict on the pain model:** the evidenced pain set collapses to **four** things. (1) A tiny team cannot manually service a growing partner network. (2) Partner-sourced deals arrive as unstructured, unattributed, un-deduplicated noise. (3) Partners will not adopt a portal, so the data never exists in the first place. (4) Commission and reporting are manual and error-prone. Everything else is either downstream of these or is marketing.

---

# J. PRODUCT ENVIRONMENT

| Tool / category | Classification | Why | Evidence standard required |
|---|---|---|---|
| **HubSpot** | **CRITICAL DEPENDENCY** | Only CRM on all plans; certified app; all disclosed customer stacks | **CONFIRMED** — tracking script, HS forms, `meetings.hubspot.com`, `hs-sites`/`hubspotusercontent` assets, HS CTAs, MX/DNS |
| **Salesforce** | **CRITICAL DEPENDENCY (alt)** | Supported, gated to Scale+ | **PROXY at best** — externally hard to confirm; `force.com`/`my.salesforce.com` community domains, job-ad admin roles |
| Any other CRM | **DISQUALIFIER** | No native integration | Confirmed presence = exclude |
| **Crossbeam / Reveal** | **HIGH-VALUE SIGNAL** | Scale+ integration; Cumulocity uses it. Presence ⇒ mature ecosystem practice **and** likely Scale-tier deal | **PROXY** — public Crossbeam partner-network badges, listed integrations |
| **Slack / Microsoft Teams** | **HIGH-VALUE SIGNAL** | Powers the headless model; Quatt + Cubbit both disclose Slack | **PROXY** — Slack Connect references, community links, job ads |
| **Existing PRM (any)** | **HIGH-VALUE SIGNAL** | Displacement path proven (Cubbit) | **CONFIRMED, and detectable** — see §M, portal fingerprinting |
| **Public partner portal / deal-reg form** | **HIGH-VALUE SIGNAL** | Proves a transacting channel exists **and** reveals the incumbent | **CONFIRMED** — `partners.<domain>`, "register a deal", portal login page vendor artifacts |
| **Public partner/dealer/installer directory** | **HIGH-VALUE SIGNAL** | Gives a *countable* partner network size — one half of the core ratio | **CONFIRMED** — scrape and count |
| **Stripe / Chargebee** | **USEFUL QUALIFICATION** | Scale+ commission/payout integration | PROXY |
| **Power BI** | **USEFUL QUALIFICATION** | Add-on; implies Microsoft BI estate | PROXY |
| **Zapier** | **USEFUL QUALIFICATION** | Low signal value | PROXY |
| **Claude / ChatGPT / Gemini (MCP)** | **USEFUL QUALIFICATION** | Differentiator resonance, not a requirement | UNKNOWN — essentially undetectable externally |
| **Marketing automation, ticketing, PM, docs, meeting intelligence, data warehouse, sales engagement** | **IRRELEVANT** | No product dependency, no evidenced correlation | — |

## J.1 Evidence standards — mandatory rule

**CONFIRMED INTERNAL USE** = first-party artifact observable on the company's own web properties or DNS (tracking script, form endpoint, portal subdomain, vendor-branded login page, public integration listing).

**PROXY** = job description mention, review-site profile, third-party database tag, conference sponsorship, employee skill listing.

**UNKNOWN** = absence of evidence.

> **HARD RULE: A job-description mention is never CONFIRMED usage.** Job ads routinely list aspirational tooling, tooling used by another department, or tooling from a template. A "HubSpot experience preferred" line in a job ad is PROXY at best. Encoding it as CONFIRMED would corrupt the single most important gate in the model.

---

# K. COMPETITIVE LANDSCAPE

## K.1 Category map

### Direct PRM competitors — same buyer, same job

| Vendor | Positioning | Segment | Strength | Weakness | Pricing (public) | Likely switching trigger toward Introw |
|---|---|---|---|---|---|---|
| **Kiflo** | Lightweight PRM, HubSpot/SF-native, Paris | **SMB (63.5–63.8% of reviews)** | Proven, transparent pricing, 116+ G2 reviews | Lighter feature depth; no free tier | **$399/mo** | Buyer outgrows it or wants free start + AI |
| **PartnerPortal.io** | 5-CRM native, free tier, LMS certifications | SMB (52.9%) | Pipedrive/Zoho/Attio native; Stripe/QuickBooks payouts | Weaker AI/CRM-depth story; 4.5 vs 4.9 | Free tier | Buyer is all-in HubSpot and wants deeper sync |
| **JourneyBee** | AI-native, headless, flat pricing, MDF | SMB/MM | Flat pricing; CRM independence; Pipedrive/Attio | Smaller footprint | Flat | Buyer wants CRM as source of truth (opposite bet) |
| **PartnerStack** | SaaS partner network + marketplace + payouts | **SMB (84.1%)**, 898 G2 reviews, 600+ SaaS customers | Network effects, partner recruitment, automated payouts | Not CRM-native; affiliate/referral-weighted | Not public | Buyer needs co-sell and CRM truth, not a marketplace |
| **Impartner** | Enterprise PRM | MM (55.7%), 553 reviews | Depth, governance, tenure | **$25,000 entry**, heavy implementation | **$25,000** | Buyer finds it too heavy/expensive for team size |
| **ZINFI** | Unified partner management, 24+ modules, TCMA/MDF | Enterprise | Breadth, multi-tier channel, ~90-day deploy | Complexity; overkill for small teams | Not public | Complexity fatigue |
| **Channelscaler** (Allbound + Channel Mechanics) | Mid-market PRM + incentive automation | MM | Established | Post-merger identity churn | Not public | Modernisation |
| **Magentrix** | Salesforce/Dynamics-native no-code portals | MM/Ent | SF-native depth | Portal-first | Not public | HubSpot shops |
| **Unifyr** | Enterprise scale; **raised $20M Jan 2026** | Enterprise | Well-capitalised, up-market | Enterprise weight | Not public | Too heavy |
| **MindMatrix** | AI-infused partner marketing / TCMA | MM/Ent | TCMA depth | Marketing-weighted | Not public | Co-sell need |
| **Euler** | HubSpot-native, automation-first, AI | SMB/MM | **Closest structural rival: also HubSpot + AI-native** | Newer, smaller | Not public | — |
| **Salesforce PRM / Partner Cloud** | Native Salesforce | Ent | Native to SF | Requires Sales Cloud Enterprise+; cost; complexity | ~$25/partner/mo + SF licensing | Cost and complexity |
| **Kademi, Channeltivity, WorkSpan, Channext, PartnerProp, Channel Mechanics** | Various | Various | — | — | — | — |

### Adjacent — different category, frequently confused

- **Crossbeam / Reveal** — ecosystem-led growth and account mapping. **Not a competitor; an Introw integration and a positive signal.** A prospect using Crossbeam has already invested in partner data maturity.
- **Impact, Partnerize, Tune, Affise, Everflow, Rewardful, Tapfiliate, Refersion, Partnero, Tolt, Reditus** — affiliate/performance networks. Different buyer (performance marketing), different objects.

### CRM-native and no-tool alternatives — the real competition

- **HubSpot/Salesforce alone + custom objects + shared views.** Free, already owned, no procurement. **Loses on partner-facing experience: partners cannot be given CRM seats.** This is Introw's cleanest counter and it is structural, not feature-based.
- **Spreadsheets + email + shared drive.** Named as the prior state by Cumulocity, Quatt, Tensis. **[DSC]**
- **Internal build.** Real in engineering-heavy orgs. Loses on maintenance and on the partner-facing surface.
- **No tool / no program.** The largest "competitor" by volume and the reason "do nothing" is the most common loss.

## K.2 Where Introw is structurally advantaged

1. **HubSpot depth.** Certified app, App Cards, App Events, App Objects, workflow actions, Breeze integration, 500+ installs, 4.9/78. Independent reviewers call it *"the most feature-complete HubSpot sync for PRM."* Enterprise suites are Salesforce-first by heritage. **[SMES]**
2. **Time-to-value as a competitive weapon.** 48 hours to a self-built portal versus a $25,000 entry point and a multi-month implementation. **This is not a feature comparison; it is a different purchase decision entirely.** **[DSC vs public pricing]**
3. **Portal-optional / headless.** Directly attacks the category's central failure mode — portal adoption. Ringover 20%→70%; Quatt's 200+ non-login lead submitters. **[DSC]**
4. **Free tier as a wedge.** No competitor at comparable feature depth offers a genuinely functional free tier with live CRM integration. It converts evaluation from a procurement event into a Tuesday afternoon.
5. **Agentic/MCP lead.** Multiple independent analysts name Introw as ahead on AI-native partner workflows. A durable-for-now lead; likely a 12–24 month window before it commoditises. **[SMES]**

## K.3 Where Introw is structurally weak

1. **CRM narrowness.** HubSpot + Salesforce only. Cited by every independent source. Non-recoverable in-deal.
2. **Account mapping via Crossbeam, not native.** Most consistently cited limitation across G2, Slashdot, PartnerPortal. Adds cost and a second vendor.
3. **Enterprise channel governance, TCMA, deep MDF, multi-tier distributor management.** Multiple sources place this outside its design. G2 Enterprise share: **1.9%.**
4. **Youth and reference depth.** Founded 2023, ~24 people, ~$4M raised. Against Impartner (553 reviews) and PartnerStack (898 reviews), Introw has ~54–90. In a risk-averse procurement this is a real objection.
5. **Pricing opacity.** Named as a friction by a customer. Competitors exploit it with irreconcilable public claims (see §S).
6. **Reporting/customisation depth.** G2 pros/cons: *"limited customization restricts flexibility and insights in performance reporting compared to legacy PRMs"* (2 mentions); *"improvements needed in feature depth and reporting customization"* (4 mentions).

## K.4 Which ICP segments should prefer someone else

**Be honest about this — it protects forecast quality:**

- Enterprise channel org, multi-tier distribution, TCMA/MDF depth → ZINFI, Impartner, MindMatrix, Unifyr.
- Pipedrive / Zoho / Attio / Dynamics → PartnerPortal, JourneyBee, Magentrix.
- Marketplace-driven partner *recruitment* and automated affiliate/referral payouts at volume → PartnerStack.
- Deep Salesforce-native portal customisation → Magentrix or Salesforce Partner Cloud.
- Native account mapping as a hard requirement → a vendor that builds it in.
- Cheapest possible transparent price → Kiflo or PartnerPortal.
- Hard requirement for CRM independence → JourneyBee (this is their explicit counter-positioning).

---

# L. TRIGGER HIERARCHY

Every candidate trigger was tested against seven questions: (A) plausibly increases relevance? (B) supported by Introw/customer evidence? (C) publicly observable? (D) reliably detectable at scale? (E) required freshness? (F) routes to which persona? (G) false-positive risk?

## TIER 1 — High conviction

### T1.1 — Corporate carve-out, spin-out, divestiture, or management buyout, at a company with an existing partner or dealer network
- **A:** Yes. **B: DSC ×2** (Cumulocity; AWS MBO reviewer) — the only trigger with two independent customer confirmations. **C:** Yes — press releases, PE/M&A announcements, rebrand notices, new legal entity, new domain. **D:** Moderate — requires M&A feeds or press monitoring; volume is low, precision is high. **E:** 0–12 months; the sweet spot is 0–6. **F:** Head/VP Partnerships → COO/CRO. **G:** Low; the main risk is the new entity having no partner motion at all.
- **Why it is the strongest:** it manufactures every buying condition at once — clean slate, no incumbent contract, hard deadline, executive mandate, skeleton team.

### T1.2 — Public partner directory grows fast, or a partner/installer/reseller recruitment drive launches, while partner-team headcount stays flat
- **A:** Yes — this *is* the core ICP ratio in motion. **B: DSC** (Quatt 10→200+; Cumulocity 30→100+, both explicitly without headcount growth). **C:** Yes — partner directory pages are public and countable; team size is countable on LinkedIn. **D:** **High** — snapshot the directory page on a schedule and diff. **E:** 1–6 months. **F:** whoever owns partners (dual-path resolution). **G:** Low-moderate — directories sometimes mix tech and transacting partners; requires classification.
- **Why it is strong:** it is the only trigger that directly measures the ICP variable rather than proxying it.

### T1.3 — Partner portal / deal-registration surface appears, is rebuilt, or is visibly failing
- **A:** Yes. **B: DSC** (Cubbit — the incumbent PRM's manual deal reg was the stated reason to switch; Xelix — portal *access* was the stated problem). **C:** Yes — `partners.<domain>`, "register a deal", "partner login" pages, vendor artifacts on the login page. **D:** **High** — crawlable, fingerprintable, diffable. **E:** 0–6 months for a new/rebuilt portal. **F:** Head of Partnerships → Partner Ops. **G:** Low — a public deal-reg form is close to proof that a transacting channel exists.
- **This is the highest-value-per-unit-of-engineering-effort signal in the entire model.** It simultaneously confirms channel existence, reveals the incumbent, and indicates timing.

### T1.4 — Confirmed HubSpot + confirmed transacting partner motion (compound gate, not a moment)
- **A/B:** Yes — **DSI + DSC 4/4.** **C/D:** High for HubSpot (script/form/DNS artifacts); high for channel (partner page/deal-reg form). **E:** low decay. **F:** any. **G:** low.
- Strictly this is a *qualification gate* rather than a time-based trigger, but it belongs in Tier 1 because absent it, nothing else matters.

## TIER 2 — Strong supporting

### T2.1 — First-ever partner/channel/alliances hire, or a step-change in partner-team headcount
- **A:** Yes. **B:** Partial — Introw's careers page frames the macro shift (*"more and more companies are embracing partnerships in their GTM strategy"*), and 8/14 buyers hold partner titles. **But no case study names a hire as the trigger.** **C:** Yes — LinkedIn, job boards. **D:** High. **E:** 0–9 months; first 90 days strongest. **F:** the new hire. **G:** **HIGH — see §N.**
- **Demoted from the Tier 1 that most models assign it**, because (i) no customer evidence names it, (ii) 43% of evidenced buyers have no partner title, and (iii) it is the single most contaminated title space in B2B data.

### T2.2 — New CRO / VP Sales, especially with a stated indirect or channel mandate
- **B:** DSI only (Introw publishes a CRO page); **no CRO appears in any case study.** **C/D:** High. **E:** 0–6 months. **F:** CRO → Head of Partnerships. **G:** Moderate — most new CROs have no channel agenda.

### T2.3 — HubSpot implementation, migration, or major expansion
- **A:** Yes — the gate becomes satisfiable. **B:** RI. **C:** Moderate — detectable via new tracking script appearing, HubSpot case studies, partner-agency announcements, job ads (PROXY only). **D:** Moderate. **E:** 3–12 months (let the migration settle). **F:** RevOps → Head of Partnerships. **G:** Moderate.

### T2.4 — Public commitment to shifting revenue mix toward indirect
- **B:** RI + Introw's own macro framing. **C:** Moderate — investor updates, press, exec LinkedIn posts, conference talks. **D:** Low-moderate; NLP over unstructured text. **E:** 0–12 months. **F:** CRO → Head of Partnerships. **G:** Moderate — announcements often exceed reality.

### T2.5 — Series A/B funding **with** a pre-existing partner motion
- **A:** Only conditionally — budget appears, but funding alone says nothing about channel. **B:** Weak. **C/D:** Very high (this is the problem — it is over-available). **E:** 0–9 months. **G:** **HIGH.**
- **Funding must never be a standalone trigger.** It is a **budget-availability modifier** applied on top of a real channel signal. Using funding alone is the classic "fake timing" error and would flood the radar.

### T2.6 — Crossbeam / Reveal adoption becomes publicly visible
- **A:** Yes — indicates ecosystem-data maturity and points to Scale tier. **B:** DSC (Cumulocity). **C/D:** Moderate. **G:** Low.

### T1.5 — Company sends a partner-titled person to a partnership/channel event [ADDED IN REVISION 2 — PROMOTED TO TIER 1]

- **A: Yes, strongly.** Sending a named partner manager to a partnership conference is simultaneous proof of three things that otherwise have to be inferred separately: a partner **function** exists, it has **budget**, and it is **actively looking** at how to run the program better.
- **B: DSF.** This is Introw's own primary sourcing channel, which is the strongest possible endorsement of the signal's quality — they are paying roughly $50,000 per flagship booth to stand in front of exactly this population. *"Als je naar een partnership event gaat en je leert echt partnership managers kennen, partnership consultants kennen…"* Geamanu is explicit that this is where deals get sourced before being closed from Ghent.
- **C: Yes.** Exhibitor lists, sponsor tiers, speaker line-ups, agenda pages, and post-event recaps are published by the organisers.
- **D: HIGH.** Static, structured, crawlable pages. Cheap to parse. Attendee lists are usually private, but **exhibitors, sponsors and speakers are public and are the higher-intent subset anyway.**
- **E:** 0–6 months around the event; sponsor and speaker lists often publish months in advance, which makes this a **leading** rather than lagging indicator.
- **F:** the named speaker/booth owner directly, or the partner lead at the sponsoring company.
- **G: LOW.** Partnership-specific events are self-selecting. Main contamination risk is generic sales or SaaS conferences where "partnerships" is one track among many — restrict to partnership/channel-specific events and partnership tracks.
- **Adversarial check:** this is the rare signal that is *both* high-value and easy to observe, which usually means I have missed something. The specific weakness is **coverage, not precision**: it only catches companies that attend events at all, which skews toward US, larger, and better-funded organisations, and will systematically miss the European mid-market industrials that §M.1 already flags as under-detected. It is a high-precision, low-recall signal. **Use it as a priority accelerator on accounts, never as the universe.**

## TIER 3 — Context only, never a trigger on its own

Geographic expansion · new distributor/reseller agreement announcement · cloud marketplace listing (AWS/Azure/GCP) · acquisition of a company with a partner network · new integration partnership announcement · conference/community participation (Partnership Leaders, ecosystem events) · Slack/Teams standardisation · partner-focused webinar or content publication.

## ANTI-SIGNALS / MISLEADING — see §N for full treatment

Partner-title hiring volume without a real channel · integration/marketplace ecosystem signals · affiliate program launch · funding alone · "partnerships" language in professional-services or investment firms · job-board duplication · staffing-marketplace contamination.

---

# M. SIGNAL OBSERVABILITY MATRIX

**This is the most operationally important section. It exists to stop the radar optimising for what is easy to scrape.**

| # | Signal | Commercial value | Public observability | Reliability | Source | Automation feasibility | False-positive risk |
|---|---|---|---|---|---|---|---|
| 1 | Public partner/dealer/installer **directory with countable entries** | **VERY HIGH** | HIGH | HIGH | Company website | **HIGH** (crawl + count + diff) | **LOW** |
| 2 | Public **deal-registration form / partner portal login** | **VERY HIGH** | HIGH | HIGH | Company website, subdomain | **HIGH** | **LOW** |
| 3 | **Incumbent PRM identified via portal fingerprint** | **VERY HIGH** | MODERATE | HIGH | Login-page artifacts, CNAME, vendor CSS/JS/footer | **MODERATE-HIGH** | LOW |
| 4 | **HubSpot confirmed** (script, forms, meetings links, hs assets) | **VERY HIGH** | HIGH | HIGH | Site HTML, DNS | **HIGH** | LOW |
| 5 | **Partner-team headcount** (LinkedIn title count at company) | **VERY HIGH** | MODERATE | MODERATE | LinkedIn | MODERATE (ToS-constrained) | MODERATE |
| 6 | **Computed ratio: directory count ÷ partner headcount** | **HIGHEST** | Derived | MODERATE | Computed from 1 + 5 | MODERATE | MODERATE |
| 7 | Carve-out / MBO / divestiture announcement | **VERY HIGH** | MODERATE | HIGH | Press, M&A feeds, rebrand notices | MODERATE | LOW |
| 8 | Partner directory **growth rate** (diff over time) | **VERY HIGH** | HIGH | HIGH | Repeat crawl | **HIGH** | LOW |
| 9 | New partner-titled hire | MODERATE | **VERY HIGH** | **LOW-MODERATE** | LinkedIn, job boards | **VERY HIGH** | **VERY HIGH** |
| 10 | Funding round | LOW alone | **VERY HIGH** | LOW as timing | Crunchbase, press | **VERY HIGH** | **VERY HIGH** |
| 11 | Job ad mentioning HubSpot/Salesforce | LOW-MODERATE | HIGH | **LOW** (PROXY only) | Job boards | HIGH | HIGH |
| 12 | New CRO / VP Sales | MODERATE | HIGH | MODERATE | LinkedIn, press | HIGH | MODERATE |
| 13 | Salesforce confirmed | **HIGH** | **LOW** | MODERATE | Community domains, job ads | **LOW** | MODERATE |
| 14 | Crossbeam/Reveal usage | HIGH | MODERATE | MODERATE | Partner-network badges, listings | MODERATE | LOW |
| 15 | Slack/Teams usage | LOW-MODERATE | LOW | LOW | Inference | LOW | HIGH |
| 16 | Actual partner-sourced revenue % | **HIGHEST** | **NONE** | — | Private | **NONE** | — |
| 17 | Incumbent PRM **contract renewal date** | **HIGHEST** | **NONE** | — | Private | **NONE** | — |
| 18 | Internal frustration with current PRM | **HIGHEST** | **NEAR-NONE** | — | Occasional G2/LinkedIn leakage | **VERY LOW** | — |
| 19 | Partner adoption/login rates | **VERY HIGH** | **NONE** | — | Private | **NONE** | — |
| 20 | Integration/marketplace/app-directory presence | **NEGATIVE** | **VERY HIGH** | **INVERTED** | Company site | VERY HIGH | **SEVERE — actively misleading** |
| 21 | Cloud marketplace listing (AWS/Azure/GCP) | LOW-MODERATE | HIGH | LOW | Marketplaces | HIGH | HIGH |
| 22 | Affiliate program launch | **NEGATIVE-to-LOW** | HIGH | INVERTED | Company site | HIGH | HIGH |
| 23 | Generic conference/community participation | LOW | MODERATE | LOW | Event sites | MODERATE | MODERATE |
| **24** | **Partner-titled person exhibits, sponsors or speaks at a partnership/channel event** | **VERY HIGH** | **HIGH** | **HIGH** | Organiser exhibitor/sponsor/speaker pages | **HIGH** | **LOW** (coverage-limited, not precision-limited) |

## M.1 HIGH VALUE BUT HARD TO OBSERVE — accept the blind spot, do not fake it

| Signal | Why it can't be seen | What to do instead |
|---|---|---|
| **Partner-sourced revenue %** (#16) | Private | Proxy with directory size × visible program formality. **Ask it in discovery — it is the single best qualifying question.** |
| **PRM contract renewal date** (#17) | Private | Detect incumbent via #3, then run time-based nurture. Never guess. |
| **Internal PRM frustration** (#18) | Private | Monitor public review sites for named-company complaints (rare, high-value). Otherwise, discovery. |
| **Partner adoption rates** (#19) | Private | Introw's whole pitch. Ask it. |
| **Salesforce confirmation** (#13) | Low external footprint | Accept lower coverage; treat SF accounts as a manual-research tier, not an automated one. |

**This produces a known and structural bias: the radar will systematically over-detect HubSpot accounts and under-detect Salesforce accounts — which are the higher-tier, higher-ACV deals.** This bias happens to align with Introw's strongest product fit, which makes it comfortable and therefore dangerous. **Mitigation: reserve a fixed quota (suggest 15–20%) of researched accounts for manually-qualified Salesforce prospects, so the automated pipeline does not silently define the ICP.**

## M.2 EASY TO OBSERVE BUT WEAK — the trap

| Signal | Why it is a trap |
|---|---|
| **Partner-title hiring** (#9) | Cheapest signal in B2B data, most contaminated title space, and — critically — **misses 43% of Introw's own evidenced buyers.** |
| **Funding** (#10) | Universally available, therefore universally used, therefore zero differentiation. Says nothing about channel. |
| **Job-ad tool mentions** (#11) | PROXY, never CONFIRMED. Aspirational, template-copied, or another department's stack. |
| **Integration ecosystem presence** (#20) | **Not merely weak — inverted.** High observability, high superficial plausibility, and negatively correlated with fit. A radar built on "companies with a big integrations page" would produce a large, clean-looking, systematically wrong list. |
| **Affiliate program launch** (#22) | Signals a *performance-marketing* motion, i.e. PartnerStack/Impact territory, not Introw's. |

> **DESIGN PRINCIPLE FOR ENGINEERING: no signal may enter the scoring model on observability grounds alone. Every scored signal must have a documented evidence basis in §R. If it is not in the claim-evidence matrix, it does not get built.**

---

# N. ANTI-SIGNALS

Evidence-backed reasons to *lower* an account's priority.

| # | Anti-signal | Rationale | Status | Action |
|---|---|---|---|---|
| A1 | **CRM is not HubSpot or Salesforce** | No native integration | **DSI + SMES** | **Hard exclude** |
| A2 | **No CRM detectable at all** | No system of record | RI | Hard exclude |
| A3 | **Ecosystem is integration/tech partners only** — API docs, app directory, "integrations" page, no reseller/referral/partner *program* page | No deal reg, no commission, no attribution | **RI, high** | **Hard exclude — and specifically suppress the integration-page signal** |
| A4 | **Affiliate/influencer program only** | Different category | SMES | Hard exclude |
| A5 | **Professional-services firm** (law, accounting, consulting, VC/PE) | "Partner" = equity partner | RI, high | **Hard exclude at the title matcher** |
| A6 | **Staffing / recruitment marketplace / job-board operator** | "Partner Manager" postings are marketplace artifacts | RI, high | **Hard exclude — known contamination class** |
| A7 | **HR "Business Partner" / "People Partner" titles** | Pure keyword collision | RI, high | Hard exclude at title matcher |
| A8 | **Enterprise with existing multi-tier channel + TCMA/MDF requirements** | Outside design; 1.9% G2 Enterprise | SMES | Deprioritise; do not exclude (Factorial exists) |
| A9 | **Fully self-serve PLG with no sales motion** | No deal to register | RI | Deprioritise |
| A10 | **Partner function outsourced to agency/distributor** | No internal owner or budget | RI | Deprioritise |
| A11 | **<10 partners and no program owner** | Below threshold; free tier serves them | RI | **Route to PLG nurture — do not delete** |
| A12 | **Company in visible decline, layoffs, distress** | No discretionary spend | RI | Deprioritise |
| A13 | **Closed/invitation-only alliance program, handful of strategic partners** | Below the ratio | RI | Deprioritise |
| A14 | **Native account mapping stated as hard requirement** | Crossbeam dependency | SMES | Flag as deal risk |
| A15 | **Duplicate job postings across boards** | Inflates hiring-signal weight; one role appears as N signals | RI, high | **Dedupe before scoring — otherwise hiring signals are double-counted by construction** |
| A16 | **Very recently implemented a competing PRM (<12 months)** | Sunk cost, contract lock, credibility | RI | Long-cycle nurture |
| A17 | **No public partner page of any kind, and no partner-titled staff** | No detectable channel | RI | Deprioritise pending manual check |

---

# O. GEOGRAPHY

## O.1 Introw's actual GTM geography — established first, without reference to my location

**OBSERVED [DSI]:**
- Two offices: **Ghent, Belgium (EU HQ)** and **New York, NY (US)**.
- Six of seven open roles are in Ghent; one is **"Founding Sales Player-Coach (New York)"**, published 21 July 2026 and updated within hours of this research — i.e. **live and current**.
- HubSpot marketplace listing available in **Dutch, English, French, German, Italian, Spanish**.
- Company claims 100+ companies across 30+ countries.
- AE role: *"Introw is helping customers worldwide meaning that you will be able to attend events worldwide."*

**OBSERVED — customer geography [DSC]:**
Belgium (Payflip, Aikido) · Netherlands (Quatt) · France (Ringover) · Spain (Factorial) · Italy (Cubbit) · UK (Xelix) · Germany/DACH (Personio, Parloa, Cumulocity roots) · Austria (Storyblok) · Canada (ShareGate, Epiphan) · US (Coder, Sedai, WeGive, Axon, Archer, Tensis) · Israel/US (Zenity, SafeBreach) · Croatia/US (ReversingLabs).

**OBSERVED [DSF] — REVISION 2, and this materially upgrades the picture:**
- ***"Ondertussen vandaag komt 50% van de omzet uit de US."***
- Customers in **33 countries** (up from the 30+ Introw publishes).
- **15 US events in 2026**, at roughly **$50,000 per flagship booth** (Dreamforce, Unbound named), flying five to six people to Boston and San Francisco. *"Gigantische investeringen die voor ons wel een positieve ROI hebben."*
- Deal mechanics: *"vaak worden die deals ook wel gesourced in de US… dan gaan we naar een event met drie, vier mensen, spreken we met heel veel partner managers, bouwen we die relatie op en dan gaan we die closen vanuit de Gent office."*
- Deliberate perception management: *"die Amerikanen hebben wel het gevoel dat wij een global company zijn… soms zeggen ze: jullie zijn met 100 of 200 zeker."*
- US trust-building tactic: pulling an existing US customer into a live reference call for a hesitant US prospect, then sending merch as thanks.

**REVISED INTERPRETATION — Revision 1 understated this.**
Revision 1 called the US "an active, funded, currently-executing push." At **half of revenue**, it is no longer a push — it is a co-equal market, and arguably the primary growth market. The correct description is a **Ghent-operated business with a US-weighted revenue base, running a physical-events sourcing motion in the US and a remote closing motion from Belgium.**

Note the internal inconsistency: Geamanu says 15 US events in one breath and refers to "de kost van die 60 events" in another. Either the 60 is a slip, or it counts all events globally including smaller EU ones. **Treat "15 US flagship-scale events" as the defensible figure and 60 as UNRESOLVED.**

**CONFIDENCE:** High on the 50/50 revenue split and the events motion (both founder-stated, first-person, and consistent with the NY hire and the $50k booth spend). Medium on exact event counts.

## O.2 Language advantage

**OBSERVED [DSI]:** App listing in six languages including Dutch, French, German, Italian, Spanish. Multi-lingual portal support (30+ languages) is an **add-on on every paid tier**.

**INTERPRETATION:** Introw can serve non-English partner networks natively — a genuine advantage over US-origin competitors when the *partners* (not the customer's staff) are French installers, German resellers, or Italian MSPs. **The multilingual capability matters at the partner tier, not the customer tier, and that is where competitors are weakest.** Note that it is a paid add-on, which is a pricing conversation to prepare for. **[RI, high]**

## O.3 Benelux — evaluated separately, on its merits

**I deliberately established §O.1 before touching this question, per the brief.**

**Case FOR Benelux as a practical wedge:**
1. Introw is headquartered in Ghent; the AE role is Ghent-based. Local presence, local time zone, local references.
2. Two Benelux customers are already published or logo'd: **Quatt (NL)** and **Payflip (BE)**, plus **Aikido (BE)** as a logo. Real, nameable, local proof.
3. Dutch-language product support exists.
4. The Belgian/Dutch mid-market is structurally dense in exactly the profile that fits: mid-size B2B software and industrial companies with dealer/installer/reseller networks, HubSpot-heavy, small teams.
5. Personal network effects and in-person meetings are disproportionately effective in a market this size.
6. **Quatt is the strongest non-SaaS proof point Introw has, and it is Dutch.** For a Benelux industrial or manufacturing prospect this is an unusually powerful local reference.

**Case AGAINST over-weighting Benelux — strengthened in Revision 2:**

0. **Half of revenue is American [DSF].** This is the decisive counter-datum and it was not available in Revision 1. Benelux is not merely "not the core market" — it is a minority slice of the *European* half of a business whose revenue centre of gravity has already crossed the Atlantic.

1. **The market is small.** The addressable population of Benelux companies meeting the full Core ICP gate (HubSpot + transacting channel + 20–500 partners + 1–4 person team) is plausibly in the low hundreds, not thousands. It can be exhausted.
2. **Introw's customer weight is not Benelux** — it is spread across FR/ES/IT/DE/UK/US. Benelux is *home*, not *core market*.
3. **Company investment is pointed at the US**, not at deepening Belgium.
4. Optimising a scalable radar for a market that can be covered by hand is a misallocation of engineering.

**VERDICT:**

> **Benelux is a valid *personal territory and beachhead*, not the *targeting model's centre of gravity*.**
>
> Build the radar to be geography-agnostic across EU + US + English-speaking markets, with a **configurable geographic weighting** rather than a hard-coded regional bias. Then apply a Benelux weighting as an *operator setting* for whoever is selling from Ghent — justified by reference density, language, and meeting economics, not by ICP fit.
>
> **Explicit warning against my own bias:** the fact that I am based in Antwerp is not evidence about Introw's market. Everything above should hold whether the seller sits in Ghent, London, or New York. If Benelux weighting is applied, it must be applied as an *execution efficiency* argument, and labelled as such — never smuggled into the ICP definition.

**CONFIDENCE:** High on the geography facts; medium on the Benelux market-size estimate (**WH** — the low-hundreds figure is unverified and should be measured, not assumed).

---

# P. ROUTING / ENTRY-POINT LOGIC

## Route 1 — Carve-out / spin-out / MBO with an existing partner network

- **Trigger:** T1.1
- **Account situation:** partner program must be rebuilt from zero, on a deadline, with no incumbent contract and a skeleton team.
- **Primary contact:** most senior partner-titled person at the *new* entity. If none exists → COO or CRO.
- **Secondary:** RevOps (CRM rebuild is happening simultaneously).
- **Reason to enter:** the timeline. A new entity must stand up partner infrastructure faster than a normal procurement cycle allows. Introw's 48-hour-to-portal fact is the entire argument.
- **What to reference:** the structural situation — starting from scratch, small team, CRM being rebuilt in parallel. Cumulocity is the reference *if* the prospect is in the same shape.
- **What NOT to assume:** that they kept their partners (Cumulocity was contractually barred from taking theirs); that they kept their CRM; that they kept their partner team; that budget is unconstrained post-transaction.
- **Qualification question:** *"When you separated, what actually came with you on the partner side — the relationships, the data, both, or neither?"*

## Route 2 — Partner directory growing fast against flat partner headcount

- **Trigger:** T1.2 (+ T1.4 gate)
- **Account situation:** the ICP ratio is deteriorating in real time.
- **Primary contact:** whoever owns partners — **resolve empirically, do not assume a title.**
- **Secondary:** CRO/COO (the headcount decision-maker).
- **Reason to enter:** the arithmetic. Recruiting partners faster than you can service them converts a growth story into an activation problem, and Ringover's 20%-active baseline is what that looks like at the end.
- **What to reference:** their own visible partner growth. Quatt if non-SaaS; Cumulocity if software.
- **What NOT to assume:** that all directory entries are transacting partners; that the growth is intentional rather than inherited; that they experience it as a problem yet.
- **Qualification question:** *"Of the [N] partners on your site, how many registered a deal in the last quarter?"* — **This single question qualifies, sizes, and creates the pain simultaneously. It is the best question in the entire model.**

## Route 3 — Public deal-reg form / partner portal exists with an identifiable incumbent PRM

- **Trigger:** T1.3
- **Account situation:** a channel exists, is tooled, and the tooling is visible.
- **Primary contact:** Head of Partnerships. **Secondary:** Partner Ops / RevOps.
- **Reason to enter:** adoption, not features. The portal-first model's failure mode is partners who never log in.
- **What to reference:** Cubbit (switched from a PRM over manual deal reg and no CRM dedup); Ringover (20%→70%).
- **What NOT to assume:** that they are unhappy; that the contract is near renewal; that the incumbent is the vendor whose artifacts you fingerprinted (could be a reseller-built portal or a legacy instance).
- **Qualification question:** *"What percentage of your partners logged into the portal last month?"* — if they don't know, that is the pain. If they do know and it's low, that is the pain.

## Route 4 — Non-SaaS with a dealer / installer / reseller network

- **Trigger:** T1.2 or T1.3 on a manufacturing/hardware/energy/industrial account
- **Account situation:** network scaling on spreadsheets, commissions manual, attribution guessed.
- **Primary contact:** **do not search for a partner title — search for the person whose LinkedIn or the company site associates them with the dealer/installer network.** Often BDM, Head of Growth, Commercial Director, Sales Director.
- **Secondary:** COO or Managing Director.
- **Reason to enter:** commission accuracy and onboarding consistency — these land harder than "partner enablement," which is SaaS vocabulary.
- **What to reference:** **Quatt.** Same shape, same problem, published numbers.
- **What NOT to assume:** that "partner" is their word (it may be dealer, installer, distributor, agent, integrator); that they have a CRM at all; that SaaS partner-program vocabulary will land — **it will not, and using it will cost the meeting.**
- **Qualification question:** *"How do you currently calculate what each installer is owed, and how long does that take each month?"*

## Route 5 — New Head of Partnerships (first 90 days)

- **Trigger:** T2.1 — **Tier 2, entered only when the T1.4 compound gate is already satisfied**
- **Account situation:** new leader with a mandate and no infrastructure.
- **Primary contact:** the new hire. **Secondary:** the CRO who hired them.
- **Reason to enter:** they need visible wins fast and are re-evaluating everything.
- **What to reference:** their mandate, not the product.
- **What NOT to assume:** **that the hire indicates channel investment at all.** The title may be alliances, BD, corp dev, or integrations. Verify the *company* has a transacting channel before believing the *person*.
- **Qualification question:** *"What did you inherit — an existing program with partners in it, or a mandate to build one?"*

## Route 6 — Partner RevOps / RevOps-led technical entry

- **Trigger:** T2.3 (HubSpot migration/expansion) or T1.3
- **Primary contact:** RevOps / Partner Ops. **Secondary:** Head of Partnerships.
- **Reason to enter:** data integrity, not partner experience. This persona is measured on whether the CRM is trustworthy.
- **What to reference:** the CRM-as-single-source-of-truth architecture; app cards/events/objects; two-way sync; no second system to reconcile.
- **What NOT to assume:** that they care about the partner portal at all. **They mostly don't. They care about what writes to their CRM and who owns the mapping.**
- **Qualification question:** *"Today, when a partner sends you a deal, what actually happens to that record before it reaches your pipeline?"*

## P.1 Routing rules that apply universally

1. **Never lead with AI.** Every evidenced purchase driver is CRM-nativeness, speed, or simplicity. AI is the second-meeting differentiator.
2. **Resolve the persona empirically before writing anything.** 43% of evidenced buyers have no partner title.
3. **Never quote a price.** Introw publishes none, and the two public third-party figures are irreconcilable.
4. **Confirm the CRM before the first meeting.** It is the gate; discovering it live wastes the slot.
5. **Match the reference to the shape, not the industry.** Cumulocity = carve-out/small team. Quatt = non-SaaS network scaling. Cubbit = PRM displacement. Ringover = adoption failure. Factorial = enterprise scale ceiling.
6. **Surface SSO requirements early** — they determine tier and therefore price.

---

# Q. COMMERCIAL MOTION

## Q.1 Classification

**OBSERVED [DSI]:**
- Free Starter tier with real CRM integration; self-serve signup; 14-day trials on paid plans.
- Every paid plan CTA is **"Get a demo"**, not "buy now."
- No public pricing.
- Dedicated CSM at Enterprise; priority Slack/Teams channel at Scale.
- Open roles: AE (Ghent, full-cycle, outbound), SDR (Ghent), Founding Sales Player-Coach (New York).
- AE spec: *"close deals with both small businesses and large enterprises"*; NY spec: *"proven track record selling to both mid-market and enterprise."*

**OBSERVED [SMES]:** G2 segment mix Mid-Market 63.0% / SMB 35.2% / Enterprise 1.9%. HubSpot marketplace 500+ installs against a company-reported 100+ customers.

**CLASSIFICATION:**

> **REVISED IN REVISION 2. Sales-led throughout, with a freemium evaluation front door. Mid-market centre of gravity, deliberate and continuous up-market movement. Inbound-dominant demand generation with a physical-events sourcing motion, and outbound currently being rebuilt.**

- **PLG: explicitly considered and rejected [DSF].** *"Wij hebben op een bepaald moment wel gedacht om PLG te gaan… wij hebben dat uiteindelijk niet gedaan."* Every signed customer has had a call. **Revision 1 classified this as product-led land and was wrong.**
- **Freemium as evaluation, not as transaction:** full product for exactly one partner; hard commercial gate at partner #2.
- **Sales-led:** demo-gated paid tiers, unpublished pricing, ROI calculators and business cases above the SMB list-price band, SDR + AE + US player-coach hires.
- **Mid-market:** 63% of reviewers, and it is the plurality by a clear margin.
- **Enterprise:** aspirational but real at the edge (Factorial). Only 1.9% of reviewers. **Do not model Introw as an enterprise vendor.**
- **Land-and-expand:** yes — partner count, tier, add-ons, seats. Now also a planned **fintech expansion**: *"nu gaan wij in die fintech market ook gaan — gaan wij commissies ook laten uitbetalen, gaan we er ook een stukje op oppakken. Dus dat wordt een extra revenue stream."* Payment-facilitation take-rate on partner commissions is a new and previously undocumented expansion vector. **[DSF]**
- **Departmental, not company-wide:** the partner function is the buying centre. Not a platform sale.

**Demand generation [DSF] — a channel Revision 1 missed entirely.** Introw switched *"volledig van outbound naar volledig inbound"*, built heavily on SEO, content and LinkedIn ads from roughly 2024, and is explicit that the payoff has shifted to LLM rankings: *"vandaag gaan bedrijven zoeken op GPT of Claude — wat is het beste partnerportaal? Wat is een PRM die goed integreert met HubSpot? Als je daar niet bij die top vijf zit in die LLM search, dan kan het zijn dat je er gewoon uit valt."* Alongside this runs the US flagship-events motion (§O.1). **Outbound is now being deliberately reopened** — see §Q.3.

**The removal of published pricing, the US player-coach hire, the Enterprise tier build-out, the two-partner-manager floor, and the founder's stated discomfort at "afscheid nemen van die lagere pricing" are five independent indicators pointing the same direction: Introw is moving up-market, continuously and on purpose.** **[DSF + DSI, high confidence]**

## Q.3 Outbound is being rebuilt right now — the commercial opening [ADDED IN REVISION 2]

**OBSERVED [DSF]:** *"We zijn eigenlijk volledig geswitcht op een bepaald moment van outbound naar volledig inbound. Nu komt eigenlijk heel veel inbound. **We willen nu toch wel weer een kanaal gaan openzetten op pure outbound.** Dus dat is echt wel bellen, e-mail sturen."*

**OBSERVED [DSI]:** An SDR role is open in Ghent. The AE role specifies *"Strategy Development: collaborate with our sales team to determine which companies to target and the best approach to engage them"* and *"Prospect Identification."*

**INTERPRETATION:** Introw ran outbound in its earliest phase (founder-led, low deal size, event-driven), then switched it off in favour of inbound for roughly two years, and is now reopening it — at a materially higher price point, against a much narrower ICP, and into a US-weighted market. **An organisation that has been inbound-led for two years is unlikely to have a current, evidence-based outbound targeting model.** Their institutional targeting knowledge was built for a €2,500-per-year ICP that they have since deliberately abandoned.

**CONSEQUENCE:** The gap this thesis fills is not hypothetical — it is the exact gap Introw's own CEO describes as their current build. Any conversation about targeting, signals, or radar design lands on live, funded, in-progress work rather than on a nice-to-have. **[RI, high confidence]**

## Q.2 How motion should shape targeting

| Dimension | Implication |
|---|---|
| **Account size** | Mid-market is the volume. Enterprise is the stretch, and needs SSO, custom objects, dedicated CSM. SMB is real but should route to PLG, not to a seller. |
| **Entry persona** | Departmental owner (partner function). CRO is economic buyer, not entry point. |
| **Sales cycle** | Compressed by the free tier and by <2-week implementation. **[WH — no public data on actual cycle length; do not model one.]** |
| **Trigger strength** | Because the product is easy to try, *awareness at the right moment* matters more than *long nurture*. Triggers should be optimised for freshness, not volume. |
| **Security/procurement** | ISO 27001 + SOC 2 II clear mid-market. SSO gating means IT involvement escalates the deal to Enterprise. |
| **Deal risk** | Pricing opacity and Crossbeam dependency are the two most likely late-stage surprises. |

---

# R. CLAIM–EVIDENCE MATRIX

*(Every material claim in this document appears here. Nothing important exists only in prose.)*

| # | Claim | Status | Best source | Second source | Counter-evidence | Conf. | Observable? | Radar-useful? | Action |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Introw sells PRM software | **DSI** | introw.io homepage | HubSpot marketplace listing | None | High | n/a | Framing | Position as PRM |
| 2 | Positioning is "#1 Agentic PRM" / headless | **DSI** | Homepage | Careers page | Marketplace copy is older/narrower | High | n/a | Messaging | Use in messaging, not qualification |
| 3 | HubSpot is on every plan incl. free | **DSI** | Pricing page | HubSpot listing | Pricing table shows SF ✅ on Starter (likely error) | High | n/a | **Gate** | **Hard gate** |
| 4 | Salesforce gated to Scale+ | **DSI** | Pricing page FAQ | PartnerPortal | Table inconsistency on Starter row | High | n/a | Tiering | Verify before quoting |
| 5 | No native support for Pipedrive/Zoho/Attio/Dynamics | **DSI + SMES** | Introw integrations | PartnerPortal, JourneyBee | None | High | Partially | **Exclusion** | Hard exclude |
| 6 | Account mapping is via Crossbeam, not native | **SMES** | PartnerPortal | G2/Slashdot reviews | None | High | Partially | Qualification | Flag as deal risk |
| 7 | Time-to-value: days to <4 weeks | **DSI + DSC ×3** | Cumulocity 48h | Factorial <4wk; Tensis <2wk | None | High | n/a | Messaging | Lead with it |
| 8 | **Free tier is an evaluation front door, NOT a self-serve land motion** | **DSF** | Founder: *"met elke klant hebben we een touchpoint gehad, een call"*; PLG explicitly rejected | Hard gate at partner #2 | Revision 1 claimed the opposite | **High** | n/a | **Internal list** | **Cross-reference ~400 free installs against the ≥2 gate — do this first** |
| 9 | ISO 27001 + SOC 2 II + GDPR | **DSI** | Trust centre badges | HubSpot listing | None | High | Yes | Objection handling | Use in security conv. |
| 10 | SSO is Enterprise-only | **DSI** | Pricing table | — | None | High | n/a | **Tier trigger** | Ask early |
| 11 | Pricing is tier-based on partner count | **DSI** | Pricing FAQ | Both competitor sources agree on structure | None | High | n/a | Deal sizing | Use structure, not level |
| 12 | **Price level: ~€10k–€13k negotiated mid-market; list price at 50–100 FTE; ROI-based above** | **DSF** (was UNR) | Founder: *"€10.000… evengoed voor €13.000 voor exact hetzelfde platform"* | Competitor figures now explicable as points on the same partner-count curve | Founder illustration, not a rate card | **Med** | No | **No** | **Deal-sizing intuition only. Still never quote to a prospect.** |
| 13 | ~24 employees | **SMES** | Tracxn (31 May 2026) | About-us roster ~24; join.com "11-50" | TFN said 15 in Nov 2025 | Med-High | Yes | Context | Note growth trajectory |
| 14 | ~$4M raised total | **SMES** | Introw blog | EU-Startups, TFN, Vestbee, Tracxn | None | High | Yes | Context | — |
| 15 | 100+ customers, 30+ countries | **DSI** | Introw blog | TFN, Vestbee (company-sourced) | All trace to Introw | Med | No | Context | Treat as company-reported |
| 16 | Revenue 4x in 2025 | **DSI via press** | TechFundingNews | — | Single source, company-supplied | Med-Low | No | Context | Do not repeat as fact |
| 17 | G2 4.9; MM 63.0% / SMB 35.2% / Ent 1.9% | **SMES** | G2 comparison pages | Multiple G2 comparisons | Review counts vary 39–90 across pages | Med-High | Yes | **ICP calibration** | **Use for segment definition** |
| 18 | HubSpot Certified App, 500+ installs, 4.9/78, "Rising" | **DSI via HubSpot** | HubSpot marketplace | — | None | High | Yes | Distribution | — |
| 19 | Also on AWS Marketplace | **DSI** | AWS listing | — | None | High | Yes | Context | — |
| 20 | **14 named case-study personas; 6 have no partner title** | **DSC** | Introw case-studies index | Individual case studies | None | **High** | n/a | **Persona model** | **Dual-path persona resolution** |
| 21 | Introw publishes only 4 role pages (CPM, PMM, RevOps, CRO) | **DSI** | Introw nav | — | Contradicted by its own case studies | High | n/a | Persona | Prefer case-study evidence |
| 22 | **No case study features a CRO** | **DSC (absence)** | Case-studies index | — | Introw publishes a CRO page | Med-High | n/a | Routing | Demote CRO to secondary |
| 23 | **Small partner team + large network is the repeating pattern** | **DSC ×4** | Cumulocity "two-person team" | Quatt, AWS reviewer, Factorial | None found | **High** | **Computable** | **CORE ICP** | **Primary scoring feature** |
| 24 | **Carve-out/MBO is a validated trigger** | **DSC ×2** | Cumulocity case study | AWS Marketplace review | None | **High** | Yes | **Tier 1** | **Standing watch** |
| 25 | PRM displacement is a validated path | **DSC** | Cubbit case study | Introw comparison hub | Only one published story | Med | Partially | Tier 1 (via #3 fingerprint) | Nurture |
| 26 | HubSpot in 4/4 disclosed customer stacks | **DSC** | Cumulocity, Cubbit, Quatt, Factorial | — | SF customers exist (G2 reviewer) | High | Yes | **Gate** | Hard gate |
| 27 | Non-SaaS/manufacturing is a real segment | **DSC** | Quatt case study | Epiphan; Manufacturing + IoT pages | Only 2 published cases | Med-High | Yes | **Secondary ICP** | Distinct persona path |
| 28 | All 14 cases involve *transacting* partners | **DSC 14/14** | Case-studies index | Partner-type pages | None | High | Partially | **Gate** | Exclude integration-only |
| 29 | Integration ecosystems are an **anti**-signal | **RI (from #28 + product design)** | Product object model | Absence in all case studies | None found | Med-High | Very | **Suppress** | **Explicitly demote** |
| 30 | Introw's 11 industry pages are SEO, not ICP | **RI** | Customer spread vs page list | G2 industry mix | None | High | n/a | **Do not filter on industry** | Exclude from model |
| 31 | No headcount band is supported | **DSC + SMES** | Customer range ~50–1,000+ | G2 spread across all segments | None | High | n/a | **No hard size filter** | Soft weighting only |
| 32 | Not built for enterprise TCMA/multi-tier channel | **SMES** | ZINFI, Forecastable, PartnerPortal | G2 Ent 1.9% | Factorial is large | Med-High | Partially | Deprioritise | Soft anti-signal |
| 33 | Reporting customisation is a stated weakness | **SMES** | G2 pros/cons (4+2 mentions) | HubSpot review (flat hierarchy) | Rapid shipping cadence | Med | No | Objection prep | — |
| 34 | Partner Connect solves partner-side CRM sync | **DSI** | Product nav (NEW) | Product page | PeerSpot review predates it | Med-High | n/a | Objection handling | **Treat old objection as stale** |
| 35 | Purchase drivers are speed/simplicity/CRM-native, not AI | **DSC** | Cumulocity, Cubbit, Tensis, Quatt | — | Homepage leads with AI | **High** | n/a | **Messaging** | **Do not lead with AI** |
| 36 | AI drives expansion and stickiness post-purchase | **DSC ×2** | Cumulocity (MCP + Claude reporting) | Quatt (order-processing agent) | None | Med-High | No | Expansion | Second-meeting content |
| 37 | **~50% of revenue is US; 33 countries; US-sourced via events, closed from Ghent** | **DSF** | Founder: *"vandaag komt 50% van de omzet uit de US"* | Ghent + NY offices; NY role live 21 Jul 2026; 15 US events at ~$50k/booth | Revision 1 understated this as a "push" | **High** | Yes | Geography | Geo-agnostic radar; Benelux as operator setting only |
| 38 | Multilingual capability is a partner-tier advantage | **DSI** | 6-language app listing; 30+ lang add-on | — | It is a paid add-on | Med-High | n/a | Differentiation | Prepare pricing conv. |
| 39 | **Motion = sales-led throughout with freemium evaluation; inbound-dominant + US events; mid-market** | **DSF** | Founder rejects PLG explicitly | G2 63% MM; pricing/CTA structure; hiring | **Revision 1 said PLG land — corrected** | **High** | n/a | Motion design | Model as sales-led, not product-led |
| 40 | Introw is moving up-market | **RI** | Pricing de-publication + NY player-coach + Enterprise tier | — | Free tier still prominent | Med-High | Partially | Strategy | Watch |
| 41 | Founded 2023 by Geamanu/Lavaert/Van Den Hende, via StarApps | **SMES** | Introw blog | EU-Startups, TFN, PartnerPortal | Tracxn lists 6 founders incl. studio partners | High | Yes | Context | — |
| 42 | Partner-title hiring has severe false-positive risk | **RI, high** | Title-collision analysis | 43% of buyers lack the title (#20) | — | Med-High | Very | **Demote to Tier 2** | Gate behind #26+#28 |
| 43 | Funding alone is not a valid trigger | **RI, high** | No case study cites it | — | — | High | Very | **Modifier only** | Never standalone |
| 44 | Salesforce accounts are systematically under-detectable | **RI, high** | Low external SF footprint | — | — | High | n/a | **Bias mitigation** | **Reserve manual quota** |
| 45 | Job-ad tool mentions are PROXY, never CONFIRMED | **RI, high** | Standard data-quality principle | — | — | High | n/a | **Evidence rule** | Enforce in schema |
| 46 | Benelux is a beachhead, not the ICP centre | **RI** | §O.1 geography evidence | Customer spread | Local references exist (Quatt, Payflip, Aikido) | Med-High | n/a | Territory config | **Operator setting, not ICP** |
| 47 | The ROI story is partner-sourced revenue, not internal time saved | **RI, high** | Ringover, Quatt off-portal metrics | Cumulocity 0→20% | — | Med-High | n/a | **Messaging** | Reframe for CRO |
| **48** | **Minimum 2 partnership managers is Introw's own stated qualification floor** | **DSF** | Founder: *"minstens twee partnership managers"* | Founder: sub-floor accounts *"zijn ook gechurnd"* | None | **High** | **Yes (LinkedIn)** | **YES — cheapest gate** | **Run before the crawl** |
| **49** | **Introw no longer sells to founder-led companies with no partner function** | **DSF** | Founder, explicit, with churn rationale | Consistent with up-market drift | None | **High** | Yes | **Exclusion** | Hard exclude below the floor |
| **50** | **ICP has drifted upward continuously; case studies span multiple ICP generations** | **DSF** | Founder: *"gegroeid met onze klanten mee"*; *"afscheid nemen van die lagere pricing"* | Persona split in §C.5 | Case studies undated — sorting is inferred | **Med-High** | n/a | **Evidence hygiene** | Read case studies as a time series |
| **51** | **US flagship events are Introw's primary sourcing channel** | **DSF** | Founder: 15 US events, ~$50k/booth, 5–6 people, positive ROI | Deals sourced US, closed Ghent | "60 events" inconsistency unresolved | **High** | **Yes (organiser pages)** | **YES — Tier 1** | **Build event crawler in Phase 1** |
| **52** | **Outbound is being rebuilt now after ~2 years of inbound-only** | **DSF + DSI** | Founder: *"we willen nu toch wel weer een kanaal openzetten op pure outbound"* | Open SDR role; AE role includes target selection | None | **High** | n/a | **Commercial opening** | This thesis fills a live, funded gap |
| **53** | **Fintech expansion: Introw will take a cut of partner commission payouts** | **DSF** | Founder: *"gaan wij commissies ook laten uitbetalen… extra revenue stream"* | Existing Stripe/Chargebee integrations | Not yet shipped publicly | **Med-High** | Partially | Expansion vector | New, previously undocumented |
| **54** | **Inbound is built on SEO + LLM search ranking, not just Google** | **DSF** | Founder: *"als je daar niet bij die top vijf zit in die LLM search, dan val je eruit"* | Heavy content/comparison-page footprint observed in §K | None | **Med-High** | n/a | Context | Explains the comparison-hub strategy |
| **55** | **v1 was scrapped entirely in Jan 2024; first new-platform customer signed 6 weeks later** | **DSF** | Founder: all code discarded, rebuilt from scratch | First customer Feb 2024 at €2,500/yr | None | **High** | n/a | **Source hygiene** | **Confirms Tracxn's description is v1, not stale metadata** |

---

# S. CONTRADICTIONS AND UNRESOLVED FACTS

## S.1 Active contradictions

**C1 — Pricing. [RESOLVED IN REVISION 2]**
PartnerPortal (competitor): Pro $329/mo, Scale $499/mo. JourneyBee (competitor): $999 base, $2,000/mo at 100 partners. Introw's pricing page: publishes nothing.
*Resolution:* The founder source settles the direction and the order of magnitude: **~€10k–€13k for negotiated mid-market deals**, an internally-held list price for the 50–100 employee band, and ROI/business-case pricing above that. Both competitor figures are now readable as points on a single partner-count curve rather than as a contradiction — which was the hypothesis in Revision 1. **Still do not quote a number to a prospect** (a founder's podcast illustration is not a rate card) and still do not encode ACV into scoring. See §B.8.

**C2 — Employee count. [PARTIALLY RESOLVED]**
TFN (Nov 2025): 15. Tracxn (31 May 2026): 24. join.com: "11-50."
*Resolution:* Not a conflict — a growth curve. ~15 → ~24 across six months, consistent with post-raise hiring and the ~24-name about-us roster. **Resolved.**

**C3 — Tracxn's product description. [CONTRADICTED — cause now confirmed]**
Tracxn describes Introw as *"AI powered sales discovery platform for partnerships… automates search, screening, and outreach."*
*Resolution, upgraded in Revision 2:* This is not database lag. The founder confirms that v1 — a network-effect product that connected customer and partner data sources (CRM, Gmail, LinkedIn) to *discover* opportunities — was **deliberately and completely destroyed in January 2024**: *"we smijten het product volledig in de vilbak, we hebben alle code weggesmeten, we zijn from scratch gestart."* Tracxn is describing a product that no longer exists in any form. **Discard for product characterisation. Funding and headcount data remain usable.**

**C4 — Salesforce on the Starter tier. [CONTRADICTED — internal to first-party source]**
The pricing comparison table shows Salesforce ✅ for Starter and ❌ for Pro; plan cards and FAQ say Scale+ only.
*Resolution:* Almost certainly a table error. **Verify before making any commitment.**

**C5 — G2 review counts. [MINOR]**
Different G2 comparison pages show 39, 54, 58; PartnerPortal claims 90+; HubSpot marketplace shows 78 (different corpus).
*Resolution:* Snapshot timing plus different corpora. Segment *percentages* have been stable at ~63% MM across pages and are the usable datum. **Use percentages, not counts.**

**C6 — Introw's own messaging hierarchy vs its customers' stated reasons. [MATERIAL]**
Introw's homepage leads with agentic AI. Every case study's stated purchase driver is CRM-nativeness, speed, or simplicity.
*Resolution:* Not an error — a marketing/evidence divergence. **For selling, follow the customers. For positioning, note the divergence.**

**C7 — PeerSpot criticism vs Partner Connect. [RESOLVED — stale]**
A reviewer's complaint that partners must update manually rather than from their own CRM is directly addressed by Partner Connect, flagged NEW on Introw's current navigation.
*Resolution:* **Review is stale.** Current first-party source wins.

**C8 — US event count. [UNRESOLVED — minor, added in Revision 2]**
The founder says *"we hebben in 2026 events gedaan van 15 in de US"* and, in the following breath, *"het gaat gewoon over de kost van die 60 events."*
*Resolution:* Either 60 is a slip, or it counts all events globally including smaller European ones while 15 counts US flagship-scale only. **Use "15 US flagship-scale events" as the defensible figure. Leave 60 unresolved.** Does not affect any conclusion — the events motion is established either way.

**C9 — Employee count, again. [MINOR — added in Revision 2]**
Founder says *"met 30-tal mensen"*; Tracxn said 24 at 31 May 2026; join.com says "11-50".
*Resolution:* Consistent with continued hiring across mid-2026, plus a founder rounding upward. Growth curve, not conflict. Note the founder also mentions a **chief of staff starting in October** — a role that signals operational scaling and is worth tracking.

## S.2 Explicitly unresolved — do not guess

| # | Unresolved | Why it matters | How to close |
|---|---|---|---|
| U1 | **Actual ACV distribution** *(partially closed in Rev 2 — band now ~€10k–€13k negotiated mid-market, but the distribution and mean remain unknown)* | Deal sizing, qualification thresholds | Internal data only |
| U2 | **Average sales cycle length** | Pipeline modelling | Internal CRM |
| U3 | **Win/loss split by competitor** | Competitive strategy | Internal |
| U4 | **HubSpot vs Salesforce customer split** | Would validate/invalidate the HubSpot gate strength | Internal |
| U5 | **Free-tier → paid conversion rate, and how many of the ~400 unconverted installs pass the ≥2-manager gate** | **Now the highest-priority internal question** — determines whether external radar work or internal list work comes first | Internal — ask before building |
| U6 | **Whether Introw runs its own reseller/agency channel** | Would change entry motion — a "Become a partner" page exists but I did not verify its content or whether partners transact | Fetch the page; ask internally |
| U7 | **Churn / net revenue retention** | Expansion thesis validity | Internal |
| U8 | **Real Benelux TAM under the full Core ICP gate** | Territory sizing | Measure with the radar; do not assume |
| U9 | **Whether Introw has a formal SDR-to-AE handoff or full-cycle model** | Affects how a radar's output is consumed | Both SDR and full-cycle AE roles are open — ask |
| U10 | **How partner count is actually metered** (active? contracted? provisioned?) | Determines deal size and expansion mechanics | Ask internally |
| **U11** | **Which specific partnership events Introw sponsors, and the full calendar** | Directly determines the event-crawler target list | Organiser sites; ask internally |
| **U12** | **Timing and structure of the commission-payout fintech product** | New expansion vector; may change ICP toward commission-heavy programs | Ask internally |
| **U13** | **Whether the outbound rebuild is SDR-prospecting or AE full-cycle** | Determines who consumes radar output and in what format | Both roles open — ask |

---

# T. LOW-CONFIDENCE HYPOTHESES

Explicitly labelled. **None of these should be built into a production radar without validation.**

| # | Hypothesis | Status | Test |
|---|---|---|---|
| H1 | ~~ACV sits roughly €4k–€25k with Enterprise above~~ **Superseded in Rev 2** — founder gives ~€10k–€13k negotiated mid-market. Remaining hypothesis: the *distribution* is wide and add-on attach drives most of the spread | **WH** | Internal data |
| H2 | Sales cycle 30–90 days for mid-market, driven by fast TTV | **WH** | Internal data |
| H3 | Crossbeam users convert at above-average rates (ecosystem maturity + Scale tier) | **WH** | Cohort analysis |
| H4 | Carve-out/MBO accounts convert at multiples of baseline | **WH — strongest hypothesis in this table, given DSC ×2** | Track as a cohort from day one |
| H5 | The non-SaaS dealer/installer segment is under-served by competitors whose radars are tuned to SaaS partner titles | **WH** | Competitive win-rate by segment |
| H6 | Companies whose partner directory grew >50% in 12 months convert above baseline | **WH — directly testable and the highest-value test to run** | Instrument directory diffing, measure |
| H7 | Benelux Core-ICP population is in the low hundreds | **WH** | Measure with the radar |
| H8 | Introw's agentic/MCP lead is durable ~12–24 months | **WH** | Competitive monitoring |
| H9 | Accounts with a public deal-reg form but no identifiable PRM vendor (i.e. home-built) are unusually good targets | **WH — plausible and cheap to test** | Segment and measure |
| H10 | SSO requirements are the most common forced-upgrade path to Enterprise | **WH** | Internal deal review |

---

# U. FAILURE MODES AND BIAS

Each risk below was tested against the evidence, not merely listed.

| # | Risk | Present? | Assessment | Mitigation |
|---|---|---|---|---|
| F1 | **Overfitting to visible customers** | **YES** | 14 case studies are a marketing-selected sample. Successes are published; failures are not. Introw chooses stories that flatter the product. | Weight *structural patterns* repeating across cases (team-to-network ratio) over *outcomes* (20x). Never quote outcome numbers as expectations. |
| F2 | **Mistaking user for buyer** | **YES, severe** | The most numerous users are the customer's *partners* — external, unpaid, unmandatable. | §H makes this explicit. ROI framing = partner-sourced revenue, not internal time saved. |
| F3 | **Mistaking hiring volume for intent** | **YES, severe** | Partner-title hiring is the cheapest signal and the most contaminated. | Demoted to Tier 2; gated behind CRM + transacting-channel confirmation; dedupe postings (A15). |
| F4 | **Over-prioritising large companies because they publish more** | **YES** | Factorial and Cumulocity dominate the evidence because they produce more public artifacts. G2 says 35.2% of reviewers are SMB. | No hard size filter. Explicit PLG routing for sub-scale. Treat Factorial as ceiling, not ICP. |
| F5 | **Over-prioritising US companies because sources are easier** | **YES** | English-language sources dominate; EU mid-market companies publish less. | Geo-agnostic radar. Do not let source availability define coverage. Multilingual crawling for partner directories. |
| F6 | **Ambiguous partner titles** | **YES, severe** | "Partner" collides with equity partner (law/accounting/consulting/VC), HR business partner, channel partner in media, corp-dev partnerships. | Hard exclusions A5–A7 at the title matcher; require company-level channel confirmation before any title signal scores. |
| F7 | **Marketplace / job-board employer contamination** | **YES** | Staffing marketplaces and job boards post partner roles as marketplace artifacts. | Hard exclusion A6; maintain a suppression list of known job-board and staffing domains. |
| F8 | **Measuring public visibility instead of fit** | **YES, systemic** | Every signal in the model is biased toward companies that publish. Some of the best-fit accounts (mid-market European industrials) publish least. | Accept and document. Reserve manual-research capacity (§M.1) for low-visibility segments. **Never let the radar's coverage define the ICP.** |
| F9 | **Stale headcount data** | **YES** | Tracxn's own Introw entry carries a stale product description; databases lag. | Prefer live LinkedIn counts; timestamp every headcount; expire after 90 days. |
| F10 | **Funding as fake timing** | **YES** | Funding is the most available and least discriminating signal in B2B. | A2/T2.5 — modifier only, never standalone. |
| F11 | **Assuming CRM/tool usage** | **YES** | The single highest-consequence assumption error, because CRM is the gate. | Mandatory CONFIRMED evidence standard (§J.1). Job ads are never CONFIRMED. |
| F12 | **Confusing partnerships with channel revenue** | **YES, most severe** | Partner-titled people frequently run alliances, BD, or integrations — none of which generate Introw's object model. | Require *transacting-channel* evidence (deal-reg form, commission language, reseller/installer directory) before any partner signal scores. |
| F13 | **Confusing integrations with a partner program** | **YES, most severe and most seductive** | Integration pages are highly visible, highly scrapable, and inversely correlated with fit. | A3 hard exclusion. **Explicitly suppress the integration-directory signal.** Documented as W1 in §W. |
| F14 | **Reference-shape mismatch** | **YES** | Deploying Cumulocity (carve-out, IoT) at a Dutch heat-pump installer network wastes the best reference in the arsenal. | §P routes references by *shape*, not industry. |
| F15 | **Anchoring on Belgium because the seller is Belgian** | **YES** | Explicitly warned against in the brief and a genuine risk. | §O establishes Introw's geography before evaluating Benelux; Benelux is an operator weighting, never an ICP element. |
| F16 | **Trusting competitor-published analysis** | **YES** | Four of the richest external sources are published by direct competitors (PartnerPortal, JourneyBee, ZINFI). | Every such claim is labelled with its source's commercial interest. Structural claims (CRM narrowness, Crossbeam) corroborated independently and retained; pricing claims flagged UNRESOLVED. |
| F17 | **Stale objection handling** | **YES** | The PeerSpot partner-CRM-sync criticism is obsolete post-Partner Connect. | Version competitive objections against Introw's release cadence; re-verify quarterly. |

---

# V. RECOMMENDED RADAR INPUTS

Ranked by evidence strength × observability × automation feasibility. **Build in this order.**

## Phase 1 — Build first (highest value per unit of engineering effort)

> **REVISION 2 — Phase 1 reordered.** The founder-stated two-partner-manager floor (§D.1.1) is the cheapest possible gate and now runs *before* the expensive crawl, rather than after it as a scoring input. Two items are added: the internal free-tier cross-reference (#0) and the partnership-events crawler (#7).

0. **Free-tier install cross-reference — internal, and almost certainly the highest-yield action available.** Roughly 400 accounts have connected a CRM and built a portal without converting, and per the founder every paying customer was closed by a human. Filter that internal list against the ≥2-partner-manager gate before building anything external. **This requires no engineering, only access, and it should be verified first because it may reprioritise the entire external build.**
1. **Partner-team headcount resolver — now the first external gate.** Count of partner-family titles at the company. `>= 2` is a hard pass/fail. Cheapest, least ambiguous, fastest step in the model; run it before anything that requires crawling.
2. **HubSpot confirmation detector.** Tracking script, HS form endpoints, `meetings.hubspot.com`, `hs-sites`/`hubspotusercontent` assets, HS CTAs, DNS/MX. **The other hard gate.**
3. **Partner/dealer/installer directory crawler + counter + differ.** Detects existence, size, growth rate, and partner *type* of the channel. Supplies the numerator of the ratio and the strongest timing trigger.
4. **Partner portal / deal-registration surface detector.** Subdomain enumeration (`partners.*`, `portal.*`, `deals.*`), page-path detection ("register a deal", "partner login", "become a partner"). Confirms a transacting channel exists.
5. **Incumbent PRM fingerprinter.** Vendor artifacts on partner login pages — CSS/JS paths, favicons, footer strings, CNAME targets. Identifies the incumbent, which is otherwise invisible.
6. **Ratio computation + scoring.** `directory_count ÷ partner_headcount`, thresholded, applied only to accounts that already passed the ≥2 floor.
7. **Partnership/channel event crawler [ADDED].** Exhibitor, sponsor and speaker pages for partnership-specific events and partnership tracks. Static, structured, cheap to parse, and often published months ahead of the event — a leading indicator. High precision, limited recall: use as a priority accelerator, never as the universe.

## Phase 2 — Build second

8. **Carve-out / MBO / divestiture watch.** M&A and press feeds, new-entity detection, rebrand notices, domain changes. Low volume, highest precision.
9. **Partner directory change detection over time.** Scheduled re-crawl and diff. Converts a static signal into a timing signal.
10. **Persona resolver — primary path plus scoped fallback [REVISED].** Path A: partner-family titles, now the primary and largely sufficient route given the ≥2-manager floor. **Path B: scoped to the non-SaaS dealer/installer/distributor segment**, where a company can pass every structural gate while presenting no partner-titled person; resolve the owner via commercial/growth/ops titles + site attribution. Revision 1 made Path B co-equal; §C.5 and §G.1 show that was an artefact of Introw's legacy ICP.
11. **Partner-title hire monitor**, gated behind the CRM and channel gates, with deduplication and the A5–A7 exclusion list.
12. **Crossbeam/Reveal usage detector.** Partner-network badges, public integration listings.

## Phase 3 — Build third

13. **Salesforce detector** (best-effort; low coverage expected — feeds the manual-research quota rather than automated scoring).
14. **New CRO/VP Sales monitor**, gated behind the compound ICP gate.
15. **Indirect-revenue-mandate NLP** over investor updates, press, exec posts.
16. **HubSpot migration/expansion detector** (new tracking script appearing on a previously non-HubSpot domain — a genuinely strong signal if instrumented over time).
17. **Funding monitor as a modifier field only** — never a trigger, never independently scored.

---

# W. SIGNALS WE SHOULD NOT BUILD

**Every item here is easy to build. That is precisely why they are listed.**

| # | Do not build | Why |
|---|---|---|
| **W1** | **Integration / app-directory / API-docs presence as a positive signal** | **Inverted correlation.** High observability, high superficial plausibility, negatively correlated with fit. Would generate a large, clean-looking, systematically wrong list. **The single most dangerous buildable signal in this domain.** |
| **W2** | **Standalone partner-title hiring alerts** | The title space is the most contaminated in B2B data, and duplicated postings inflate it further. Only useful gated behind CRM + channel confirmation. *(Revision 2: the additional "43% of buyers have no partner title" argument is downgraded — see §G.1. The contamination and dedup arguments stand on their own and are sufficient.)* |
| **W3** | **Standalone funding alerts** | Universally available, universally used, zero differentiation, no evidenced link to Introw purchase. Classic fake timing. |
| **W4** | **Employee-count banding as a hard filter** | No evidence supports any band. Would exclude both Payflip (small) and Factorial (large) — real customers at both extremes. |
| **W5** | **Industry filters derived from Introw's industry pages** | Those pages are an SEO surface. Customers span 11+ sectors with no clustering that survives scrutiny. |
| **W6** | **Job-ad tech-stack inference treated as confirmed usage** | PROXY only. Encoding it as CONFIRMED corrupts the model's most important gate. |
| **W7** | **Affiliate-program launch detection** | Signals the wrong category (performance marketing). Would route Introw at PartnerStack/Impact deals it should not chase. |
| **W8** | **Cloud-marketplace listing detection as a primary signal** | Weak evidentiary link; high false-positive rate; listing ≠ channel program. |
| **W9** | **Generic "ecosystem-led growth" content/thought-leadership scoring** | Marketing noise. No evidenced link to purchase. |
| **W10** | **Sentiment scraping of individual employees' social posts** | Low reliability, high noise, meaningful privacy exposure, poor precision. |
| **W11** | **Any inference of PRM contract renewal dates** | Unknowable. Any model output here would be fabricated confidence — the worst possible failure mode for CRO trust. |
| **W12** | **Estimated ACV / deal-size prediction from public data** | Pricing is UNRESOLVED (§S, C1). Building a number here manufactures false precision on top of a known unknown. |

---

# X. DATA SOURCES NEEDED FOR THE RADAR

| Source | Purpose | Priority | Notes / constraints |
|---|---|---|---|
| **Company website crawler** (multi-page, multilingual) | Partner directories, deal-reg forms, partner pages, becoming-a-partner pages | **Critical** | Must handle NL/FR/DE/IT/ES — the EU mid-market publishes in local language |
| **Subdomain enumeration + DNS/CNAME** | Portal detection, incumbent PRM fingerprinting | **Critical** | Passive DNS or certificate-transparency logs |
| **Tech-stack detection** (HubSpot-focused) | The gate | **Critical** | HS script, form endpoints, hosted assets, CTAs |
| **Scheduled re-crawl + diff store** | Directory growth = the timing signal | **Critical** | Snapshot history is what turns a static fact into a trigger |
| **LinkedIn company + people data** | Partner-team headcount, persona resolution, hires | **Critical** | ToS-constrained — use a compliant provider |
| **M&A / carve-out / MBO feeds + press monitoring** | Tier 1 trigger | **High** | PE deal feeds, business press, rebrand/new-entity detection |
| **Job-board aggregation with deduplication** | Hiring signals (Tier 2 only) | Medium | **Dedupe is mandatory**, plus staffing/job-board domain suppression |
| **G2 / Capterra / PeerSpot monitoring** | Incumbent PRM identification, public dissatisfaction | Medium | Rare but very high value when a named company complains |
| **Crossbeam/Reveal public network artifacts** | Ecosystem-maturity signal | Medium | Badges, listings |
| **HubSpot Solutions Partner directory** | Potential channel/referral route into HubSpot-native accounts | Medium | Depends on U6 resolution |
| **Company registries** (KBO/BCE, KvK, Companies House) | New-entity detection post-carve-out; verifying spin-outs | Medium | Especially strong for Benelux execution |
| **Funding databases** | Modifier field only | Low | Never a trigger |
| **Introw's own CRM (HubSpot)** | Closed-loop validation; exclusion of existing customers/opps; **free-tier install segmentation** | **Critical** | **Without this the radar cannot learn.** REV2: because the motion is sales-led, unconverted free installs are prospects, not do-not-contact — segment them against gate_0 rather than suppressing them. |
| **Partnership/channel event organiser sites** | Exhibitor, sponsor, speaker and agenda pages | **High** *(added REV2)* | Static, structured, cheap. Often published months ahead of the event. Introw's own sourcing channel, so signal quality is founder-endorsed. |

---

# Y. FINAL ADVERSARIAL VERDICT

## Y.1 What survived scrutiny

Four conclusions are strong enough to bet engineering time and outbound capacity on:

1. **HubSpot + a transacting partner channel is a hard, binary, detectable gate.** First-party, multi-source, and directly observable. Everything else is refinement.
2. **The `network ÷ team` ratio is the ICP.** Four independent customer sources, computable from public data, and it explains why firmographic banding fails.
3. **Structural discontinuity beats growth as a trigger.** Two independent customer confirmations for carve-out/MBO. Nothing else in the trigger set has two.
4. **The evidenced buyer is frequently not partner-titled.** A direct count of Introw's own published personas. This is the finding most likely to differentiate this model from a competitor's.

## Y.1a What Revision 2 changed, and where Revision 1 was wrong

Stated plainly, because a thesis that quietly edits itself is not trustworthy:

| Revision 1 said | Revision 2 says | Why |
|---|---|---|
| Product-led land, sales-led expand | **Sales-led throughout, freemium evaluation front door** | Founder rejects PLG explicitly; every customer closed by a call |
| Free installs are a self-converting funnel | **Free installs are an uncalled outbound list** | Same datum, inverted meaning once the motion is known |
| Price level UNRESOLVED | **~€10k–€13k negotiated mid-market** | Founder gives a live negotiation example |
| Partner team 1–4 FTE, inferred | **≥2 FTE, founder-stated, with churn evidence below the line** | Explicit qualification rule |
| 43% of buyers lack a partner title → dual-path resolver | **Mostly a legacy-ICP artefact → scoped fallback** | ICP has drifted upward; the cohort is dated |
| EU-weighted with a US push | **~50% of revenue is US** | Direct founder figure |
| Events not considered | **Tier 1 signal and Phase 1 radar input** | It is Introw's own sourcing channel |

Three of those seven are outright corrections to Revision 1 rather than additions. The pattern is instructive: **every one of them was a case where I inferred a mechanism from artefacts (pricing pages, install counts, case-study personas) when the mechanism itself was only knowable from someone inside the company.** Artefact-based inference held up well on structure — the HubSpot gate, the transacting-channel requirement, the carve-out trigger and the integration-ecosystem inversion all survived unchanged — and poorly on intent.

## Y.2 What did not survive, and was cut

- **"Target Series A/B SaaS companies that just hired a Head of Partnerships."** This is the intuitive answer, it is what most PRM radars are built on, and the evidence does not support it as a Tier 1 construct. Funding has no evidenced link to purchase; partner-title hiring misses 43% of evidenced buyers and sits in the most contaminated title space available.
- **Industry-based targeting.** Introw's 11 industry pages are an SEO surface. Customers span IoT, HR tech, telephony, heat pumps, cloud storage, cybersecurity, fintech, martech, and developer tooling with no clustering that survives scrutiny.
- **Headcount banding.** Real customers exist from small to 1,000+; G2 shows 35% SMB and 63% mid-market. Any band would exclude real customers.
- **Integration ecosystems as a signal.** Not merely cut — **inverted and suppressed.**
- **Any ACV or price-based qualification.** Unresolvable from public sources; anything built here would be fabricated.

## Y.3 The three most likely ways this thesis is wrong

**1. The case studies may be systematically unrepresentative.** Fourteen marketing-selected stories are the backbone of the ICP. If Introw's actual revenue concentration differs materially from its published proof — for example, if most revenue comes from Salesforce accounts that simply don't produce case studies — the HubSpot gate would be over-tight and the model would be discarding the better half of the market. **Test immediately against internal closed-won data (U4). This is the single highest-priority validation and it is cheap to run.**

**2. The ratio may be a consequence rather than a cause.** Companies with a high network-to-team ratio may simply be companies that already bought a PRM — the ratio being achievable *because* of tooling, not a signal of needing it. If so, the radar would surface accounts that already have an incumbent. **Mitigation is already in the design: the incumbent-PRM fingerprinter (input #4) runs alongside the ratio and re-routes those accounts to the displacement play rather than dropping them. But this reordering matters — it turns a scoring error into a routing decision.**

**3. The agentic/MCP differentiation may commoditise faster than assumed.** Euler is already positioned as HubSpot-native and AI-native; every competitor will ship MCP. If the differentiation window closes inside 12 months, Introw is left competing on HubSpot depth and time-to-value — both real, both defensible, but both narrower moats. **This does not change the targeting model. It changes the messaging hierarchy, and it argues for building the radar around structural fit rather than around a technology story that has an expiry date.**

## Y.4 Would a CRO trust this?

Only if it is presented with its limits attached. The defensible position is:

> *"We can identify, with confirmable public evidence, companies running HubSpot with a transacting partner channel where the network is outgrowing the team. We can detect when that gap widens, when a portal appears or is rebuilt, and when an ownership event forces a program rebuild. We can identify the incumbent PRM. We cannot see contract dates, partner-sourced revenue percentages, or internal dissatisfaction — those are discovery questions, and we have written the questions. We are deliberately not building the five signals that are easiest to build, because four of them are noise and one of them is inverted."*

That is a smaller claim than most targeting decks make. It is also the only version that survives contact with the evidence — and it is the version that will still be true in six months.

## Y.5 The single highest-leverage next action

**REVISED IN REVISION 2. Two actions, in this order.**

**First, and it is not engineering: pull the free-tier install list and filter it against the two-partner-manager floor.** The founder has confirmed the motion is sales-led and that every paying customer was closed by a human. That makes roughly 400 unconverted installs — accounts that already connected a CRM and built a portal — the warmest list in the business, and it requires access rather than a build. If a meaningful share of them clear the floor, that list outranks any external radar for the first quarter of outbound. **Answer this before committing engineering time.**

**Second, instrument partner-directory crawling and diffing.** It remains the only external input that directly measures the core ICP variable, it doubles as the strongest timing trigger, it is cheap, fully automatable, legally uncomplicated, and it produces a proprietary time-series no competitor's radar has. Run it behind the two cheap gates (partner headcount ≥ 2, then HubSpot confirmation), not in front of them.

Everything else in this model is either a gate (binary, cheap) or a refinement.

---

# RADAR DESIGN SPECIFICATION

*Conceptual specification for an engineering agent. Not code. Hand this section over directly.*

```yaml
target_company: Introw (introw.io) — CRM-native, portal-optional PRM

core_icp:
  hard_gates:                       # ALL must be true. Binary. No scoring.
    - partner_team_headcount >= 2   # REV2: founder-stated floor, cheapest gate, RUN FIRST
    - crm_confirmed IN [hubspot, salesforce]
    - transacting_partner_channel_confirmed == true
    - business_model == b2b OR (b2c AND indirect_b2b_channel_present)
  primary_scoring_variable:
    name: partner_leverage_ratio
    formula: public_partner_directory_count / partner_team_headcount
    applies_only_when: partner_team_headcount >= 2   # REV2
    threshold_strong: ">= 20"
    threshold_moderate: "10 - 19"
    threshold_weak: "< 10"
    evidence_basis: "DSF (floor) + DSC x4 (ratio) — Cumulocity, Quatt, Factorial, AWS reviewer"
  supporting_attributes:
    partner_network_size: {range: 20-500, weighting: soft}
    partner_team_headcount: {range: 1-4, weighting: soft}
    partner_types: [reseller, referral, implementation, installer, dealer,
                    distributor, msp, agency, system_integrator, solution_partner]
    program_maturity: "exists but under-tooled (spreadsheets) OR incumbent PRM failing on adoption"
  explicitly_not_filters:            # documented negative decisions
    - employee_count_band            # no evidence supports any band
    - industry_vertical              # Introw's 11 industry pages are SEO, not ICP
    - funding_stage                  # no evidenced link to purchase
    - revenue_band                   # unobservable and unsupported

secondary_icp:
  - id: salesforce_midmarket
    note: "Same structure, Salesforce CRM. Higher ACV (Scale+). LOW external detectability."
    handling: "route to manual research quota, not automated scoring"
  - id: non_saas_channel
    note: "Manufacturing/hardware/energy with dealer/installer/reseller networks. DSC: Quatt, Epiphan."
    handling: "REQUIRES persona_path_B — buyer typically has no partner title"
  - id: ownership_change
    note: "Carve-out / spin-out / divestiture / MBO. DSC x2. Highest conversion quality."
    handling: "standing always-on watch, not a campaign"
  - id: prm_displacement
    note: "Incumbent PRM identified via portal fingerprint. DSC: Cubbit."
    handling: "time-based nurture — contract timing is NOT observable"

exclusions:
  hard:                              # remove from universe entirely
    - crm NOT IN [hubspot, salesforce]
    - no_crm_detected
    - ecosystem_type == integration_partners_only
    - motion_type == affiliate_or_influencer_only
    - industry IN [law, accounting, consulting, venture_capital, private_equity]
    - company_type IN [staffing_marketplace, job_board, recruitment_marketplace]
    - business_model == b2c_with_no_indirect_channel
  soft:                              # deprioritise, retain
    - enterprise_channel_with_tcma_mdf_multitier_requirements
    - fully_plg_no_sales_motion
    - partner_function_outsourced
    - partner_count < 10 AND no_program_owner    # ROUTE TO PLG NURTURE, DO NOT DELETE
    - company_in_visible_distress
    - competing_prm_implemented_within_12_months

persona_priority:
  tier_1:
    - {title_family: [head_of_partnerships, vp_partnerships, vp_alliances,
                      channel_director, head_of_partners_and_alliances], evidence: DSC_x5}
    - {title_family: [partner_revenue_operations, partner_operations, revops],
       evidence: DSC_x1_plus_DSI, note: "technical champion AND technical veto"}
  tier_2:
    - {title_family: [partner_marketing_manager, head_of_marketing], evidence: DSC_x2}
    - {title_family: [cro, vp_sales], evidence: DSI_only,
       note: "NO case study features a CRO — economic buyer, secondary contact only"}
    - {title_family: [coo, founder], evidence: DSC_x1, applies_when: company_size_small}
  tier_3:
    - {title_family: [bdm, head_of_growth, growth_marketeer, account_executive,
                      commercial_director], evidence: DSC_x4,
       note: "REV2: largely a LEGACY-ICP persona. Retained ONLY for the non-SaaS
              dealer/installer segment via scoped persona_path_B. Do not weight
              equally with tier_1 — see C.5."}
  anti_personas:                     # exclude at the title matcher
    - corporate_development / strategic_partnerships_m_and_a
    - affiliate_manager / performance_marketing_manager
    - marketplace_manager / app_store_manager / integrations_manager
    - equity_partner (law, accounting, consulting, vc, pe)
    - hr_business_partner / people_partner

  persona_resolution:                 # REVISED IN REV2
    path_A: "PRIMARY — match tier_1/tier_2 title families at the account.
             Sufficient for most accounts once the >=2 floor is applied."
    path_B: "SCOPED FALLBACK — non-SaaS dealer/installer/distributor segment ONLY.
             Where no partner-family title exists, resolve the owner via
             commercial/growth/ops titles cross-referenced with site attribution
             on partner/dealer pages."
    rationale: "6 of 14 evidenced buyers hold no partner title, BUT those sit almost
                entirely in Introw's legacy (pre-floor) ICP. Rev1 made path_B
                co-equal; that over-weighted a fossil. Path_B is retained because a
                non-SaaS account can pass every structural gate and still present no
                partner title — dropping it at the persona step would waste the
                expensive gates already passed."

trigger_priority:
  tier_1:
    - id: ownership_change
      evidence: DSC_x2
      freshness: 0-12mo (optimal 0-6)
      routes_to: [senior_partner_lead, coo, cro]
    - id: partner_directory_growth_vs_flat_headcount
      evidence: DSC_x2
      freshness: 1-6mo
      routes_to: resolved_partner_owner
    - id: partner_portal_or_dealreg_surface_appears_or_rebuilt
      evidence: DSC_x2
      freshness: 0-6mo
      routes_to: [head_of_partnerships, partner_ops]
    - id: partner_titled_person_exhibits_sponsors_or_speaks_at_partnership_event
      evidence: DSF                      # ADDED REV2 — Introw's own sourcing channel
      freshness: 0-6mo (sponsor/speaker lists often publish months ahead — leading indicator)
      routes_to: named_speaker_or_booth_owner
      note: "High precision, LOW RECALL. Skews US/larger/funded. Use as a priority
             accelerator on accounts, never as the universe."
    - id: compound_gate_crm_plus_channel
      type: qualification_gate_not_temporal
  tier_2:
    - {id: first_partner_hire_or_team_expansion, evidence: partial,
       gated_behind: [crm_confirmed, channel_confirmed], fp_risk: HIGH}
    - {id: new_cro_or_vp_sales, evidence: DSI_only, freshness: 0-6mo}
    - {id: hubspot_migration_or_expansion, evidence: RI, freshness: 3-12mo}
    - {id: public_indirect_revenue_commitment, evidence: RI, freshness: 0-12mo}
    - {id: crossbeam_or_reveal_adoption, evidence: DSC_x1}
    - {id: funding_round, type: MODIFIER_ONLY, never_standalone: true}
  tier_3_context_only:
    [geographic_expansion, distributor_agreement, cloud_marketplace_listing,
     acquisition_with_partner_network, integration_announcement, event_participation]

anti_signals:
  - integration_ecosystem_presence        # INVERTED — suppress, do not merely down-weight
  - affiliate_program_launch
  - partner_title_hiring_without_channel_confirmation
  - funding_alone
  - duplicate_job_postings                # dedupe BEFORE scoring
  - professional_services_partner_title
  - hr_business_partner_title
  - staffing_marketplace_employer

environment_requirements:
  critical_dependency: [hubspot, salesforce]
  high_value_signal: [crossbeam, reveal, slack, microsoft_teams,
                      existing_prm, public_partner_portal, public_partner_directory]
  useful_qualification: [stripe, chargebee, power_bi, zapier]
  irrelevant: [marketing_automation, ticketing, project_management, document_tools,
               meeting_intelligence, data_warehouse, sales_engagement]

source_priority:                        # never let a lower rank overrule a higher current one
  1: introw_controlled_current
  2: named_introw_founder_or_employee_first_person_current
     # REV2: the Geamanu podcast sits here. It OVERRULES all competitor-published
     # analysis (rank 9) on pricing, motion, ICP floor, and geography.
  3: customer_controlled_current
  4: integration_or_partner_source_current
  5: reputable_press_or_interview
  6: investor_vc_source
  7: structured_database          # Tracxn's Introw product description = the v1 product
                                  # DESTROYED in Jan 2024 (founder-confirmed). Funding/headcount only.
  8: linkedin_company_or_profile
  9: review_or_community_source
  10: aggregator_or_search_snippet

observability_rules:
  evidence_standards:
    CONFIRMED: "first-party artifact on the company's own web properties or DNS —
                tracking script, form endpoint, portal subdomain, vendor-branded
                login page, public integration listing"
    PROXY:     "job description mention, review-site profile, third-party database
                tag, conference sponsorship, employee skill listing"
    UNKNOWN:   "absence of evidence — never treated as absence of the thing"
  hard_rules:
    - "A job-description mention is NEVER CONFIRMED usage."
    - "No signal enters the scoring model on observability grounds alone."
    - "Every scored signal must trace to a row in the claim-evidence matrix."
    - "Absence of evidence is never scored as negative evidence."
  known_biases_requiring_mitigation:
    - id: hubspot_over_detection
      description: "HubSpot is highly detectable; Salesforce is not. The radar will
                    over-represent HubSpot and under-represent higher-ACV Salesforce accounts."
      mitigation: "reserve 15-20% of researched-account capacity for manually
                   qualified Salesforce prospects"
    - id: publication_bias
      description: "Signals favour companies that publish. Best-fit EU mid-market
                    industrials publish least."
      mitigation: "multilingual crawling; manual-research capacity for low-visibility segments;
                   never let radar coverage define the ICP"

qualification_gates:                    # ordered — fail fast. REORDERED IN REV2.
  gate_0: partner_team_headcount >= 2     # cheapest test; run before any crawl
  gate_1: crm_confirmed IN [hubspot, salesforce]              # CONFIRMED standard only
  gate_2: transacting_partner_channel_confirmed               # directory OR deal-reg form
  gate_3: NOT matched_by_any_hard_exclusion
  gate_4: partner_leverage_ratio >= moderate_threshold OR tier_1_trigger_active
  gate_5: persona_resolvable (path_A, or path_B if non_saas_channel segment)

routing_rules:
  - {trigger: ownership_change, primary: senior_partner_lead_at_new_entity,
     fallback: [coo, cro], secondary: revops,
     question: "When you separated, what actually came with you on the partner side —
                the relationships, the data, both, or neither?"}
  - {trigger: directory_growth_vs_flat_headcount, primary: resolved_partner_owner,
     secondary: [cro, coo],
     question: "Of the N partners on your site, how many registered a deal last quarter?"}
  - {trigger: portal_or_dealreg_detected, primary: head_of_partnerships,
     secondary: partner_ops,
     question: "What percentage of your partners logged into the portal last month?"}
  - {segment: non_saas_channel, primary: resolved_via_path_B,
     secondary: [coo, managing_director],
     question: "How do you currently calculate what each installer is owed,
                and how long does that take each month?",
     constraint: "DO NOT use SaaS partner-program vocabulary — use their word:
                  dealer, installer, distributor, agent, integrator"}
  - {trigger: new_partner_hire, primary: the_new_hire, secondary: hiring_cro,
     question: "What did you inherit — an existing program with partners in it,
                or a mandate to build one?",
     precondition: gate_1 AND gate_2}
  - {trigger: hubspot_migration, primary: revops, secondary: head_of_partnerships,
     question: "Today, when a partner sends you a deal, what actually happens
                to that record before it reaches your pipeline?"}

forbidden_inferences:                   # hard constraints on the engineering agent
  - "Do NOT infer CRM usage from job-ad mentions."
  - "Do NOT infer a partner program from an integrations or app-directory page."
  - "Do NOT infer channel investment from funding alone."
  - "Do NOT infer buying intent from partner-title hiring without channel confirmation."
  - "Do NOT estimate ACV, price, or deal size — pricing is UNRESOLVED."
  - "Do NOT estimate PRM contract renewal dates — unknowable."
  - "Do NOT treat Introw's 11 industry pages as an ICP definition."
  - "Do NOT apply an employee-count band as a hard filter."
  - "Do NOT treat absence of evidence as negative evidence."
  - "Do NOT weight geography toward Benelux inside the ICP — it is an operator
     setting applied at execution, justified by reference density and meeting
     economics, never by fit."

release_gates:                          # do not ship without these
  - "Precision on gate_1 (CRM confirmation) measured at >= 95% against manual audit
     of a random 100-account sample."
  - "Anti-persona exclusion list live and tested against known contamination classes
     (law/accounting/consulting/VC 'Partner', HR Business Partner, staffing marketplaces)."
  - "Job-posting deduplication live and verified — otherwise hiring signals are
     double-counted by construction."
  - "Integration-ecosystem signal explicitly suppressed and the suppression tested."
  - "Persona path_B implemented and SCOPED to the non-SaaS segment (REV2 — no longer
     a co-equal path; see C.5 and G.1)."
  - "Introw's own CRM cross-referenced to exclude existing customers and open
     opportunities from cold outbound. REV2: free-tier installs must be SEGMENTED,
     not excluded — the motion is sales-led, so unconverted installs above the
     >=2-manager floor are the warmest available list, not a do-not-contact set."
  - "Internal question U5 answered BEFORE external build begins: how many of the
     ~400 unconverted free-tier installs pass gate_0? The answer may reprioritise
     the entire external radar."
  - "Every scored signal traces to a claim-evidence-matrix row; unmapped signals
     cannot enter scoring."
  - "Manual-research quota for Salesforce accounts operational (bias mitigation)."
  - "Every account record carries evidence-standard labels (CONFIRMED / PROXY /
     UNKNOWN) per attribute, visible to the seller."
  - "Directory-diff time-series storage live before any growth-based trigger fires."
```

---

*End of thesis, Revision 2. Unresolved facts are listed in §S. Low-confidence hypotheses are listed in §T and are not built into the specification above. Corrections to Revision 1 are logged in §Y.1a.*
