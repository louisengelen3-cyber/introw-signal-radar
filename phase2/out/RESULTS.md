# Track A — industrial discovery closure
Same 21 companies frozen in Phase 1. The benchmark is the list of NAMES a Belgian
wholesaler published; the domain was always derived, so Phase 2 re-resolves the names.

## Identity resolution v2
- confirmed=11 · probable=9 · dead_domain=1
- domain changed by v2: 5 — BOVER: bover.de→bover.pl; Bata: bata.com→bata.de; DELTA LIGHT: deltalight.com→deltalight.de; KDS: kds.eu→kds.be; PROTAPE: protape.ch→protape.it
- v2 refuses to resolve (v1 would have guessed): 1 — TREND NETWORKS[dead_domain]

## Channel classification, before vs after
- transacting/mixed BEFORE: 1/21 (5%)
- transacting/mixed AFTER:  1/21 (5%)
- surfaced as candidate AFTER (incl. routed to research): 2/21 (10%)

| company | before domain | after domain | identity | before | after | probes | hits |
|---|---|---|---|---|---|---|---|
| Anybus | anybus.com | anybus.com | confirmed | unknown | unknown | 0 | 0 |
| Bata | bata.com | bata.de | probable | unknown | unknown | 30 | 0 |
| BOVER | bover.de | bover.pl | probable | unknown | unknown | 30 | 0 |
| Circutor | circutor.com | circutor.com | confirmed | unknown | unknown | 0 | 0 |
| DELTA LIGHT | deltalight.com | deltalight.de | confirmed | unknown | unknown | 0 | 0 |
| ECODORA | ecodora.com | ecodora.com | confirmed | unknown | unknown | 30 | 0 |
| EURO 300 | euro300.de | euro300.de | probable | unknown | unknown | 30 | 0 |
| FLUKE | fluke.com | fluke.com | confirmed | transacting | transacting | 0 | 0 |
| Hafu | hafu.de | hafu.de | probable | unknown | unknown | 30 | 0 |
| IFM | ifm.com | ifm.com | confirmed | unknown | unknown | 30 | 0 |
| KDS | kds.eu | kds.be | confirmed | unknown | unknown | 30 | 0 |
| LEINE & LINDE | leinelinde.com | leinelinde.com | confirmed | unknown | unknown | 30 | 0 |
| Luzifer | luzifer.com | luzifer.com | probable | unknown | unknown | 30 | 0 |
| MITUTOYO | mitutoyo.com | mitutoyo.com | confirmed | unknown | unknown | 0 | 0 |
| PROTAPE | protape.ch | protape.it | probable | unknown | unknown | 30 | 0 |
| Röhm | rohm.com | rohm.com | confirmed | unknown | unknown | 0 | 0 |
| Seneca | seneca.com | seneca.com | probable | unknown | unknown | 30 | 0 |
| Solinteg | solinteg.com | solinteg.com | probable | unknown | unknown | 30 | 0 |
| Tekmar | tekmar.com | tekmar.com | probable | unknown | unknown | 30 | 0 |
| TREND NETWORKS | trendnetworks.net | — | dead_domain | unknown | — | 0 | 0 |
| VINTAGE | vintage.com | vintage.com | confirmed | unknown | unknown | 30 | 0 |

## Root cause of remaining industrial failure
- identity unresolved after v2: 1/21 (5%)
- site retrieved but no transacting channel established: 19/21 (90%)
- site not retrievable: 0/21 (0%)
- probed for partner paths and found none: 14 companies; 30 soft-404 responses rejected

# Track C — Introw suitability (DEV, n=34)

| cohort | n | strong | plausible | weak | incompatible | research | unknown |
|---|---|---|---|---|---|---|---|
| A · known customers | 12 | 1 | 7 | 0 | 0 | 1 | 3 |
| B · plausible targets | 13 | 0 | 4 | 1 | 0 | 6 | 2 |
| C · hypothesised poor fit | 9 | 0 | 2 | 2 | 0 | 2 | 3 |

- customers demoted to weak/incompatible (should be near zero): 0/12 (0%)
- hypothesised poor-fit demoted or routed to research: 4/9 (44%)

| cohort | company | channel | direction | suitability | rule |
|---|---|---|---|---|---|
| A | aikido.dev | transacting | channel_operator | plausible | direct_programme_partial_objects |
| A | axon.com | transacting | channel_operator | plausible | partial_evidence |
| A | coder.com | transacting | channel_operator | plausible | partial_evidence |
| A | cubbit.io | transacting | channel_operator | research_required | distribution_tier_unresolved |
| A | epiphan.com | transacting | channel_operator | strong | direct_programme_with_operational_objects |
| A | factorialhr.com | transacting | channel_operator | plausible | direct_programme_partial_objects |
| A | quatt.io | transacting | channel_operator | plausible | partial_evidence |
| A | ringover.com | unknown | channel_operator | unknown | channel_not_established |
| A | safebreach.com | transacting | channel_operator | plausible | direct_programme_partial_objects |
| A | sedai.io | transacting | channel_operator | plausible | partial_evidence |
| A | xelix.com | unknown | channel_operator | unknown | channel_not_established |
| A | zenity.io | unknown | channel_operator | unknown | channel_not_established |
| B | a10networks.com | transacting | channel_operator | plausible | distribution_alongside_direct_programme |
| B | avepoint.com | transacting | channel_operator | plausible | distribution_alongside_direct_programme |
| B | corelight.com | transacting | unknown | weak | multi_distributor_mediated_channel |
| B | deepinstinct.com | transacting | both | research_required | distribution_tier_unresolved |
| B | enphase.com | unknown | unknown | unknown | channel_not_established |
| B | extrahop.com | transacting | channel_operator | research_required | distribution_tier_unresolved |
| B | gigamon.com | transacting | channel_operator | research_required | distribution_tier_unresolved |
| B | illumio.com | transacting | channel_operator | research_required | distribution_tier_unresolved |
| B | keepersecurity.com | transacting | channel_operator | plausible | direct_programme_partial_objects |
| B | niko.eu | transacting | channel_operator | research_required | distribution_tier_unresolved |
| B | opengear.com | transacting | channel_operator | plausible | distribution_alongside_direct_programme |
| B | semperis.com | transacting | channel_operator | research_required | distribution_tier_unresolved |
| B | teamleader.eu | unknown | channel_operator | unknown | channel_not_established |
| C | cisco.com | unknown | unknown | unknown | channel_not_established |
| C | deloitte.com | unknown | unknown | unknown | channel_not_established |
| C | forcepoint.com | transacting | channel_operator | weak | multi_distributor_mediated_channel |
| C | netapp.com | transacting | channel_operator | plausible | distribution_alongside_direct_programme |
| C | nutanix.com | transacting | channel_operator | weak | multi_distributor_mediated_channel |
| C | proofpoint.com | transacting | channel_operator | research_required | distribution_tier_unresolved |
| C | riverbed.com | transacting | channel_operator | research_required | distribution_tier_unresolved |
| C | sap.com | unknown | channel_operator | unknown | channel_not_established |
| C | sophos.com | transacting | channel_operator | plausible | distribution_alongside_direct_programme |

- partner-platform fingerprints: axon.com:introw, coder.com:introw, cubbit.io:introw, epiphan.com:introw, quatt.io:introw, extrahop.com:allbound, semperis.com:allbound, proofpoint.com:impartner
- DNS lookup failures recorded (not read as absence): 0
- partner count types: unknown=24 · lower_bound=8 · exact_public=2

# Track C — Introw suitability (HOLDOUT, n=16)

| cohort | n | strong | plausible | weak | incompatible | research | unknown |
|---|---|---|---|---|---|---|---|
| A · known customers | 4 | 0 | 4 | 0 | 0 | 0 | 0 |
| B · plausible targets | 7 | 0 | 4 | 1 | 0 | 1 | 1 |
| C · hypothesised poor fit | 5 | 0 | 0 | 2 | 0 | 2 | 1 |

- customers demoted to weak/incompatible (should be near zero): 0/4 (0%)
- hypothesised poor-fit demoted or routed to research: 4/5 (80%)

| cohort | company | channel | direction | suitability | rule |
|---|---|---|---|---|---|
| A | cumulocity.com | transacting | channel_operator | plausible | partial_evidence |
| A | parloa.com | transacting | channel_operator | plausible | direct_programme_partial_objects |
| A | reversinglabs.com | transacting | channel_operator | plausible | distribution_alongside_direct_programme |
| A | sharegate.com | transacting | channel_operator | plausible | direct_programme_partial_objects |
| B | anomali.com | transacting | channel_operator | weak | multi_distributor_mediated_channel |
| B | bynder.com | integration_only | channel_operator | unknown | channel_not_established |
| B | egnyte.com | transacting | unknown | plausible | partial_evidence |
| B | exact.com | mixed | channel_operator | plausible | direct_programme_partial_objects |
| B | fluke.com | transacting | distributed_vendor | research_required | distribution_tier_unresolved |
| B | rooms.io | transacting | channel_operator | plausible | partial_evidence |
| B | vanta.com | transacting | channel_operator | plausible | partial_evidence |
| C | commvault.com | transacting | both | research_required | distribution_tier_unresolved |
| C | huawei.com | transacting | channel_operator | weak | multi_distributor_mediated_channel |
| C | microsoft.com | transacting | distributed_vendor | research_required | distribution_tier_unresolved |
| C | nokia.com | transacting | channel_operator | weak | multi_distributor_mediated_channel |
| C | se.com | unknown | unknown | unknown | channel_not_established |

- partner-platform fingerprints: cumulocity.com:introw, parloa.com:introw, reversinglabs.com:introw, sharegate.com:introw, nokia.com:impartner
- DNS lookup failures recorded (not read as absence): 0
- partner count types: directory_count=1 · unknown=8 · lower_bound=7
