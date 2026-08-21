# Phase 1 classification results — all
Run: 2026-08-21 · records 115

## Coverage
- site reachable: 105/115 (91%)
- blocked/unreachable: 10 — tensis.io(domain_unresolved), wegive.com(bot_protection), personio.com(bot_protection), silverfin.com(bot_protection), solaredge.com(bot_protection), bain.com(bot_protection), upwork.com(bot_protection), toptal.com(bot_protection), beyondtrust.com(bot_protection), iqsol.biz(fetch_failed)
- of those, URL inventory still recovered via Common Crawl: 5 — wegive.com:131, personio.com:1389, silverfin.com:427, solaredge.com:719, beyondtrust.com:47
- inventory sources contributing: passive_dns=13 · site=105 · common_crawl=43 · cert_transparency=4

## Verdict distribution
- cohortA (n=22): transacting=16 · unknown=6
- cohortB (n=20): unknown=12 · transacting=5 · integration_only=2 · affiliate_only=1
- cohortC (n=17): unknown=14 · affiliate_only=3
- unseen (n=56): unknown=33 · transacting=22 · strategic_only=1

## Candidate surfacing (classified transacting/mixed OR routed to research)
- cohortA: 18/22 (82%)
- cohortB: 11/20 (55%)
- cohortC: 3/17 (18%)
- unseen: 27/56 (48%)
- flagged multi-tier / enterprise scale (demoted, not excluded): niko.eu, posthog.com, freshfields.com, vercel.com, deloitte.com, se.com, sap.com, bata.com, ifm.com, netapp.com, nokia.com, opengear.com, proofpoint.com, rooms.io

## Recall — Cohort A (all are real transacting-channel companies)
- classified transacting or mixed: 16/22 (73%)
- surfaced as a candidate (incl. routed to research): 18/22 (82%)
- surfaced, excluding unreachable sites: 17/19 (89%)
- misses:
  · ringover.com           => unknown [single_strong_uncorroborated] inv=1211 pages=5 
  · zenity.io              => unknown [single_strong_uncorroborated] inv=870 pages=2 
  · xelix.com              => unknown [insufficient_evidence] inv=309 pages=2 
  · payflip.be             => unknown [insufficient_evidence] inv=566 pages=3 
  · tensis.io              => unknown [insufficient_evidence] inv=0 pages=0 (UNREACHABLE)
  · personio.com           => unknown [insufficient_evidence] inv=1389 pages=0 (UNREACHABLE)

## Precision — Cohort C traps
- traps NOT flagged as transacting/mixed: 17/17 (100%)
- traps flagged (false positives):
- suppression fired on:
  · freshfields.com        rule=law_firm
  · deloitte.com           rule=accounting_consulting

- by trap class:
  · integration_only                     flagged 0/3
  · professional_services_partner_title  flagged 0/3
  · integration_marketplace              flagged 0/1
  · vc_partner_title                     flagged 0/2
  · staffing_marketplace                 flagged 0/2
  · affiliate_program                    flagged 0/2
  · enterprise_multitier_channel         flagged 0/3
  · small_strategic_alliances            flagged 0/1

## Suppression audit (all sets)
- suppression fired on 2 of 115
  · C freshfields.com        rule=law_firm               label=professional_services_partner_title
  · C deloitte.com           rule=accounting_consulting  label=professional_services_partner_title

## Evidence quality
- companies with any channel evidence: 94/115 (82%)
- with STRONG first-party evidence: 65/115 (57%)
- decided by a decisive artifact (deal-reg or platform fingerprint): 30/115 (26%)
- routed to research for want of corroboration: 0/115 (0%)
- strong evidence classes by frequency:
  · PARTNER_PORTAL           39
  · TECH_INTEGRATION         21
  · DEAL_REGISTRATION        21
  · DISTRIBUTOR_LANGUAGE     19
  · PARTNER_DIRECTORY        15
  · PRM_FINGERPRINT          14
  · RESELLER_LANGUAGE        14
  · PARTNER_TIERS            8
  · APP_MARKETPLACE          7
  · OTHER                    5
  · DEALER_LANGUAGE          5
  · AFFILIATE                5
  · COMMISSION               3
  · REFERRAL_LANGUAGE        2
  · INSTALLER_LANGUAGE       2

## Platform fingerprints (DNS)
  · A quatt.io                 introw                 partners.quatt.io
  · A cubbit.io                introw                 partners.cubbit.io
  · A cumulocity.com           introw                 partners.cumulocity.com
  · A epiphan.com              introw                 partners.epiphan.com
  · A wegive.com               introw                 partners.wegive.com
  · A coder.com                introw                 partners.coder.com
  · A sharegate.com            introw                 partner.sharegate.com
  · A parloa.com               introw                 partners.parloa.com
  · A reversinglabs.com        introw                 partners.reversinglabs.com
  · A axon.com                 introw                 partners.axon.com
  · n extrahop.com             allbound               partnerportal.extrahop.com
  · n nokia.com                impartner              partners.nokia.com
  · n proofpoint.com           impartner              partners.proofpoint.com
  · n semperis.com             allbound               partner.semperis.com
- total 14/115

## Partner count feasibility
- by count type: unknown=90 · lower_bound=23 · directory_count=1 · exact_public=1
- usable (exact or enumerated): 2/115 (2%)
  · cumulocity.com           78 partners [directory_count]
  · teamleader.eu            438 partners [exact_public]

## Language of matched evidence
- en=191 · de=24 · nl=5 · fr=2
