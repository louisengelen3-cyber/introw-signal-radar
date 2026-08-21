# Phase 0 — measured benchmark results (frozen cohorts v1)
Run date: 2026-08-21. Records: 69.

## 1. Reachability / coverage
- cohortA: reachable 19/22 (86%) · bot-blocked 2 (wegive.com, personio.com) · unresolved 1 (tensis.io)
- cohortB: reachable 18/20 (90%) · bot-blocked 2 (silverfin.com, solaredge.com) · unresolved 0 (-)
- cohortC: reachable 14/17 (82%) · bot-blocked 3 (bain.com, upwork.com, toptal.com) · unresolved 0 (-)
- cohortD: reachable 10/10 (100%) · bot-blocked 0 (-) · unresolved 0 (-)

## 2. Transacting-channel detection
- cohortA: any partner surface 18/19 (95%) · classified transacting/weak 13/19 (68%)
- cohortB: any partner surface 14/18 (78%) · classified transacting/weak 11/18 (61%)
- cohortC: any partner surface 7/14 (50%) · classified transacting/weak 4/14 (29%)

### Cohort A (all are real transacting-channel companies) — per-account
  aikido.dev           surfaces=4    dealreg=0   verdict=transacting        basis=partner_page prm=-
  archerirm.com        surfaces=0    dealreg=0   verdict=unknown            basis=homepage_only prm=-
  axon.com             surfaces=77   dealreg=0   verdict=transacting        basis=partner_page prm=introw
  coder.com            surfaces=3    dealreg=0   verdict=weak_transacting   basis=partner_page prm=introw
  cubbit.io            surfaces=1    dealreg=0   verdict=transacting        basis=partner_page prm=introw
  cumulocity.com       surfaces=0    dealreg=0   verdict=unknown            basis=homepage_only prm=introw
  epiphan.com          surfaces=4    dealreg=0   verdict=transacting        basis=partner_page prm=introw
  factorialhr.com      surfaces=2    dealreg=0   verdict=weak_transacting   basis=partner_page prm=-
  parloa.com           surfaces=1    dealreg=0   verdict=unknown            basis=homepage_only prm=introw
  payflip.be           surfaces=1    dealreg=0   verdict=unknown            basis=partner_page prm=-
  personio.com         UNREACHABLE (bot_protection)
  quatt.io             surfaces=1    dealreg=0   verdict=unknown            basis=partner_page prm=introw
  reversinglabs.com    surfaces=5    dealreg=0   verdict=transacting        basis=partner_page prm=introw
  ringover.com         surfaces=2    dealreg=0   verdict=transacting        basis=partner_page prm=-
  safebreach.com       surfaces=23   dealreg=0   verdict=weak_transacting   basis=partner_page prm=-
  sedai.io             surfaces=1    dealreg=0   verdict=transacting        basis=partner_page prm=-
  sharegate.com        surfaces=138  dealreg=0   verdict=transacting        basis=partner_page prm=introw
  storyblok.com        surfaces=1    dealreg=0   verdict=unknown            basis=partner_page prm=-
  tensis.io            UNREACHABLE (domain_unresolved)
  wegive.com           UNREACHABLE (bot_protection)
  xelix.com            surfaces=1    dealreg=0   verdict=weak_transacting   basis=partner_page prm=-
  zenity.io            surfaces=1    dealreg=0   verdict=weak_transacting   basis=partner_page prm=-

### Cohort C traps — did the classifier suppress them?
  semrush.com          affiliate_program                  verdict=affiliate_only     partnerSurfaces=2
  kinsta.com           affiliate_program                  verdict=transacting        partnerSurfaces=4
  cisco.com            enterprise_multitier_channel       verdict=unknown            partnerSurfaces=1
  se.com               enterprise_multitier_channel       verdict=transacting        partnerSurfaces=0
  sap.com              enterprise_multitier_channel       verdict=transacting        partnerSurfaces=2692
  vercel.com           integration_marketplace            verdict=unknown            partnerSurfaces=135
  linear.app           integration_only                   verdict=unknown            partnerSurfaces=0
  posthog.com          integration_only                   verdict=unknown            partnerSurfaces=1
  sentry.io            integration_only                   verdict=unknown            partnerSurfaces=0
  bain.com             professional_services_partner_title UNREACHABLE
  deloitte.com         professional_services_partner_title verdict=transacting        partnerSurfaces=692
  freshfields.com      professional_services_partner_title verdict=unknown            partnerSurfaces=0
  anthropic.com        small_strategic_alliances          verdict=unknown            partnerSurfaces=0
  upwork.com           staffing_marketplace               UNREACHABLE
  toptal.com           staffing_marketplace               UNREACHABLE
  sequoiacap.com       vc_partner_title                   verdict=unknown            partnerSurfaces=0
  indexventures.com    vc_partner_title                   verdict=unknown            partnerSurfaces=0

## 3. CRM detection (CONFIRMED standard = first-party artifact)
- cohortA: any CRM artifact 14/19 (74%) · hubspot 13/19 (68%) · salesforce 2/19 (11%) · UNKNOWN 5/19 (26%)
- cohortB: any CRM artifact 4/18 (22%) · hubspot 3/18 (17%) · salesforce 0/18 (0%) · UNKNOWN 14/18 (78%)
- cohortC: any CRM artifact 1/14 (7%) · hubspot 1/14 (7%) · salesforce 0/14 (0%) · UNKNOWN 13/14 (93%)

### Known-HubSpot customers from Introw case studies (ground truth: HubSpot)
  cumulocity.com       detected=NONE pagesInspected=2
  cubbit.io            detected=hubspot[2] pagesInspected=4
  quatt.io             detected=hubspot[1] pagesInspected=3
  factorialhr.com      detected=NONE pagesInspected=9

## 4. Incumbent-PRM / existing-customer fingerprint (DNS CNAME)
- accounts with a vendor-attributable partner-subdomain CNAME: 11/69
  A quatt.io             introw @ partners.quatt.io
  A cubbit.io            introw @ partners.cubbit.io
  A cumulocity.com       introw @ partners.cumulocity.com
  A epiphan.com          introw @ partners.epiphan.com
  A sharegate.com        introw @ partner.sharegate.com
  A coder.com            introw @ partners.coder.com
  A reversinglabs.com    introw @ partners.reversinglabs.com
  A axon.com             introw @ partners.axon.com
  A parloa.com           introw @ partners.parloa.com
  D cumulocity.com       introw @ partners.cumulocity.com
  D quatt.io             introw @ partners.quatt.io
- Introw fingerprint recall on known customers: 9/19 (47%) of reachable Cohort A
- false positives outside Cohort A: 2

## 5. DNS wildcard contamination (why "subdomain resolves" is not evidence)
- domains with a catch-all wildcard: 11/69 (16%) — factorialhr.com, cumulocity.com, safebreach.com, personio.com, odoo.com, sentry.io, vercel.com, indexventures.com, cumulocity.com, factorialhr.com, safebreach.com
- naive "subdomain resolves" hits: 178 · after wildcard control: 84 (53% were wildcard noise)

## 6. Partner-directory countability
- some countable signal: 24 · explicit stated count: 5 · nothing countable: 37
  A quatt.io             methods=distinct_outbound_hosts 
  A zenity.io            methods=distinct_outbound_hosts 
  A ringover.com         methods=distinct_outbound_hosts 
  A factorialhr.com      methods=distinct_outbound_hosts 
  A epiphan.com          methods=distinct_outbound_hosts 
  A coder.com            methods=distinct_outbound_hosts 
  A aikido.dev           methods=distinct_outbound_hosts 
  A reversinglabs.com    methods=distinct_outbound_hosts 
  A axon.com             methods=distinct_outbound_hosts 
  B exact.com            methods=distinct_outbound_hosts 
  B bynder.com           methods=stated_count stated=20 partners
  B niko.eu              methods=distinct_outbound_hosts 
  B vanta.com            methods=distinct_outbound_hosts,stated_count stated=20 partners/20 partners
  B egnyte.com           methods=stated_count stated=100 partners/50 partners
  B keepersecurity.com   methods=distinct_outbound_hosts 
  B yuki.nl              methods=stated_count stated=22 partners
  C vercel.com           methods=distinct_outbound_hosts 
  C deloitte.com         methods=distinct_outbound_hosts 
  C semrush.com          methods=distinct_outbound_hosts 
  D factorialhr.com      methods=distinct_outbound_hosts 
  D zenity.io            methods=distinct_outbound_hosts 
  D quatt.io             methods=distinct_outbound_hosts 
  C kinsta.com           methods=stated_count stated=300 agencies/300 agencies
  C anthropic.com        methods=distinct_outbound_hosts 

## 7. How the partner surface was found
- sitemap=7 · homepage_links=40 · none=10 · path_probe=4
