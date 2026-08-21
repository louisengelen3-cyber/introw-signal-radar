# Phase 1 classification results — benchmark
Run: 2026-08-21 · records 59

## Coverage
- site reachable: 51/59 (86%)
- blocked/unreachable: 8 — wegive.com(bot_protection), tensis.io(domain_unresolved), personio.com(bot_protection), silverfin.com(bot_protection), solaredge.com(bot_protection), bain.com(bot_protection), upwork.com(bot_protection), toptal.com(bot_protection)
- of those, URL inventory still recovered via Common Crawl: 4 — wegive.com:131, personio.com:1389, silverfin.com:427, solaredge.com:719
- inventory sources contributing: passive_dns=13 · site=51 · common_crawl=29 · cert_transparency=2

## Verdict distribution
- cohortA (n=22): transacting=16 · unknown=6
- cohortB (n=20): unknown=12 · transacting=5 · integration_only=2 · affiliate_only=1
- cohortC (n=17): unknown=13 · affiliate_only=3 · transacting=1

## Recall — Cohort A (all are real transacting-channel companies)
- classified transacting or mixed: 16/22 (73%)
- misses:
  · ringover.com           => unknown [single_strong_uncorroborated] inv=1211 pages=4 
  · zenity.io              => unknown [single_strong_uncorroborated] inv=870 pages=2 
  · xelix.com              => unknown [insufficient_evidence] inv=309 pages=2 
  · payflip.be             => unknown [insufficient_evidence] inv=566 pages=3 
  · tensis.io              => unknown [insufficient_evidence] inv=0 pages=0 (UNREACHABLE)
  · personio.com           => unknown [insufficient_evidence] inv=1389 pages=0 (UNREACHABLE)

## Precision — Cohort C traps
- traps NOT flagged as transacting/mixed: 16/17 (94%)
- traps flagged (false positives):
  · sap.com                label=enterprise_multitier_channel       => transacting [corroborated_transacting]
- suppression fired on:
  · freshfields.com        rule=law_firm
  · deloitte.com           rule=accounting_consulting

- by trap class:
  · integration_only                     flagged 0/3
  · integration_marketplace              flagged 0/1
  · professional_services_partner_title  flagged 0/3
  · vc_partner_title                     flagged 0/2
  · staffing_marketplace                 flagged 0/2
  · affiliate_program                    flagged 0/2
  · enterprise_multitier_channel         flagged 1/3
  · small_strategic_alliances            flagged 0/1

## Suppression audit (all sets)
- suppression fired on 2 of 59
  · C freshfields.com        rule=law_firm               label=professional_services_partner_title
  · C deloitte.com           rule=accounting_consulting  label=professional_services_partner_title

## Evidence quality
- companies with any channel evidence: 54/59 (92%)
- with STRONG first-party evidence: 36/59 (61%)
- decided by a decisive artifact (deal-reg or platform fingerprint): 16/59 (27%)
- routed to research for want of corroboration: 0/59 (0%)
- strong evidence classes by frequency:
  · TECH_INTEGRATION         18
  · PARTNER_PORTAL           13
  · PRM_FINGERPRINT          10
  · DEAL_REGISTRATION        10
  · DISTRIBUTOR_LANGUAGE     8
  · RESELLER_LANGUAGE        8
  · PARTNER_TIERS            6
  · APP_MARKETPLACE          6
  · PARTNER_DIRECTORY        5
  · AFFILIATE                4
  · OTHER                    3
  · COMMISSION               2
  · DEALER_LANGUAGE          2
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
- total 10/59

## Partner count feasibility
- by count type: unknown=43 · lower_bound=15 · exact_public=1
- usable (exact or enumerated): 1/59 (2%)
  · teamleader.eu            438 partners [exact_public]

## Language of matched evidence
- en=107 · de=12 · nl=3 · fr=1
