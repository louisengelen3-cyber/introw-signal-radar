# Phase 1 classification results — benchmark
Run: 2026-08-21 · records 59

## Coverage
- site reachable: 51/59 (86%)
- blocked/unreachable: 8 — wegive.com(bot_protection), tensis.io(domain_unresolved), personio.com(bot_protection), silverfin.com(bot_protection), solaredge.com(bot_protection), bain.com(bot_protection), upwork.com(bot_protection), toptal.com(bot_protection)
- of those, URL inventory still recovered via Common Crawl: 4 — wegive.com:131, personio.com:1389, silverfin.com:427, solaredge.com:719
- inventory sources contributing: passive_dns=13 · site=51 · common_crawl=29 · cert_transparency=2

## Verdict distribution
- cohortA (n=22): transacting=7 · unknown=7 · mixed=6 · integration_only=1 · strategic_only=1
- cohortB (n=20): unknown=11 · integration_only=3 · transacting=3 · mixed=2 · affiliate_only=1
- cohortC (n=17): unknown=14 · transacting=2 · affiliate_only=1

## Recall — Cohort A (all are real transacting-channel companies)
- classified transacting or mixed: 13/22 (59%)
- misses:
  · ringover.com           => integration_only [integration_dominant] inv=1211 pages=4 
  · sedai.io               => unknown [insufficient_evidence] inv=1344 pages=1 
  · zenity.io              => unknown [single_weak_transacting] inv=870 pages=2 
  · xelix.com              => strategic_only [strategic_only] inv=309 pages=3 
  · safebreach.com         => unknown [suppressed:law_firm] inv=753 pages=6 
  · payflip.be             => unknown [insufficient_evidence] inv=566 pages=3 
  · tensis.io              => unknown [insufficient_evidence] inv=0 pages=0 (UNREACHABLE)
  · personio.com           => unknown [insufficient_evidence] inv=1389 pages=0 (UNREACHABLE)
  · storyblok.com          => unknown [single_weak_transacting] inv=1257 pages=5 

## Precision — Cohort C traps
- traps NOT flagged as transacting/mixed: 15/17 (88%)
- traps flagged (false positives):
  · deloitte.com           label=professional_services_partner_title => transacting [corroborated_transacting]
  · anthropic.com          label=small_strategic_alliances          => transacting [decisive_artifact]
- suppression fired on:
  · posthog.com            rule=investment_firm
  · freshfields.com        rule=law_firm
  · indexventures.com      rule=investment_firm
  · kinsta.com             rule=staffing_marketplace

- by trap class:
  · integration_only                     flagged 0/3
  · integration_marketplace              flagged 0/1
  · professional_services_partner_title  flagged 1/3
  · staffing_marketplace                 flagged 0/2
  · vc_partner_title                     flagged 0/2
  · affiliate_program                    flagged 0/2
  · enterprise_multitier_channel         flagged 0/3
  · small_strategic_alliances            flagged 1/1

## Suppression audit (all sets)
- suppression fired on 6 of 59
  · A safebreach.com         rule=law_firm               label=known_customer
  · B keepersecurity.com     rule=investment_firm        label=likely_fit
  · C posthog.com            rule=investment_firm        label=integration_only
  · C freshfields.com        rule=law_firm               label=professional_services_partner_title
  · C indexventures.com      rule=investment_firm        label=vc_partner_title
  · C kinsta.com             rule=staffing_marketplace   label=affiliate_program

## Evidence quality
- companies with any channel evidence: 54/59 (92%)
- with STRONG first-party evidence: 38/59 (64%)
- decided by a decisive artifact (deal-reg or platform fingerprint): 15/59 (25%)
- routed to research for want of corroboration: 5/59 (8%)
- strong evidence classes by frequency:
  · TECH_INTEGRATION         16
  · PRM_FINGERPRINT          11
  · DISTRIBUTOR_LANGUAGE     8
  · RESELLER_LANGUAGE        8
  · DEAL_REGISTRATION        8
  · PARTNER_TIERS            7
  · APP_MARKETPLACE          7
  · OTHER                    4
  · AFFILIATE                4
  · DEALER_LANGUAGE          3
  · REFERRAL_LANGUAGE        3
  · COMMISSION               2
  · INSTALLER_LANGUAGE       2

## Platform fingerprints (DNS)
  · A cubbit.io                introw                 partners.cubbit.io
  · A quatt.io                 introw                 partners.quatt.io
  · A cumulocity.com           introw                 partners.cumulocity.com
  · A epiphan.com              introw                 partners.epiphan.com
  · A wegive.com               introw                 partners.wegive.com
  · A coder.com                introw                 partners.coder.com
  · A sharegate.com            introw                 partner.sharegate.com
  · A parloa.com               introw                 partners.parloa.com
  · A reversinglabs.com        introw                 partners.reversinglabs.com
  · A axon.com                 introw                 partners.axon.com
  · C anthropic.com            salesforce_experience  partnerportal.anthropic.com
- total 11/59

## Partner count feasibility
- by count type: unknown=46 · lower_bound=12 · exact_public=1
- usable (exact or enumerated): 1/59 (2%)
  · teamleader.eu            438 partners [exact_public]

## Language of matched evidence
- en=152 · de=23 · nl=11 · fr=1
