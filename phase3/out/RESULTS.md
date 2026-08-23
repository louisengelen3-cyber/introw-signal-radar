# Phase 3 — positive promotion
Run 2026-08-23 · n=48

| population | n | high_fit | plausible | under_observed | not_promoted |
|---|---|---|---|---|---|
| Known customers (discovery) | 13 | 5 | 1 | 4 | 3 |
| Known customers (HOLDOUT) | 6 | 2 | 1 | 0 | 3 |
| Clean structural negatives | 14 | 0 | 0 | 8 | 6 |
| Matched unlabelled prospects | 15 | 3 | 0 | 5 | 7 |

**Known customers positively promoted: 7 of 19.**
**Clean negatives falsely promoted: 0 of 14.**
Phase 2 comparison: `strong` fired 1 time in 50.

## Constructs, measured separately
| population | materiality confirmed/strong | ownership direct/mixed | surface rich/moderate |
|---|---|---|---|
| Known customers (discovery) | 6/13 | 12/13 | 7/13 |
| Known customers (HOLDOUT) | 3/6 | 6/6 | 5/6 |
| Clean structural negatives | 2/14 | 3/14 | 0/14 |
| Matched unlabelled prospects | 3/15 | 8/15 | 6/15 |

## Every record
| population | company | materiality | ownership | surface | density | promotion | rule |
|---|---|---|---|---|---|---|---|
| clean_negative | bain.com | unknown | unknown | unknown | none | not_promoted | contradicted |
| clean_negative | bechtle.com | unknown | unknown | unknown | sparse | under_observed | sparse_publication |
| clean_negative | computacenter.com | weak_proxy | unknown | light | sparse | under_observed | sparse_publication |
| clean_negative | deloitte.com | unknown | unknown | unknown | sparse | not_promoted | contradicted |
| clean_negative | freshfields.com | unknown | unknown | unknown | sparse | not_promoted | contradicted |
| clean_negative | indexventures.com | unknown | unknown | unknown | sparse | under_observed | sparse_publication |
| clean_negative | insight.com | unknown | unknown | unknown | sparse | under_observed | sparse_publication |
| clean_negative | kinsta.com | confirmed | direct | light | moderate | not_promoted | contradicted |
| clean_negative | linear.app | unknown | unknown | unknown | sparse | under_observed | sparse_publication |
| clean_negative | posthog.com | unknown | direct | unknown | sparse | not_promoted | contradicted |
| clean_negative | semrush.com | confirmed | direct | unknown | sparse | not_promoted | contradicted |
| clean_negative | sentry.io | unknown | unknown | unknown | sparse | under_observed | sparse_publication |
| clean_negative | sequoiacap.com | unknown | unknown | unknown | sparse | under_observed | sparse_publication |
| clean_negative | softcat.com | unknown | unknown | light | sparse | under_observed | sparse_publication |
| customer_discovery | aikido.dev | confirmed | direct | moderate | moderate | high_fit | materiality_ownership_surface |
| customer_discovery | archerirm.com | weak_proxy | direct | rich | moderate | not_promoted | insufficient_positive_evidence |
| customer_discovery | coder.com | weak_proxy | direct | unknown | sparse | under_observed | sparse_publication |
| customer_discovery | cubbit.io | weak_proxy | direct | light | moderate | not_promoted | insufficient_positive_evidence |
| customer_discovery | epiphan.com | strong_proxy | direct | rich | rich | high_fit | materiality_ownership_surface |
| customer_discovery | factorialhr.com | confirmed | direct | moderate | moderate | high_fit | materiality_ownership_surface |
| customer_discovery | payflip.be | weak_proxy | direct | unknown | sparse | under_observed | sparse_publication |
| customer_discovery | quatt.io | unknown | unknown | unknown | sparse | under_observed | sparse_publication |
| customer_discovery | ringover.com | confirmed | direct | light | moderate | plausible | materiality_and_ownership_thin_surface |
| customer_discovery | safebreach.com | weak_proxy | direct | moderate | moderate | not_promoted | insufficient_positive_evidence |
| customer_discovery | sharegate.com | confirmed | direct | rich | rich | high_fit | materiality_ownership_surface |
| customer_discovery | storyblok.com | confirmed | direct | moderate | rich | high_fit | materiality_ownership_surface |
| customer_discovery | zenity.io | weak_proxy | direct | unknown | sparse | under_observed | sparse_publication |
| customer_holdout | axon.com | unknown | direct | moderate | moderate | not_promoted | insufficient_positive_evidence |
| customer_holdout | cumulocity.com | confirmed | direct | moderate | moderate | high_fit | materiality_ownership_surface |
| customer_holdout | parloa.com | confirmed | direct | rich | rich | high_fit | materiality_ownership_surface |
| customer_holdout | reversinglabs.com | weak_proxy | direct | moderate | moderate | not_promoted | insufficient_positive_evidence |
| customer_holdout | sedai.io | unknown | direct | moderate | moderate | not_promoted | insufficient_positive_evidence |
| customer_holdout | xelix.com | confirmed | direct | unknown | moderate | plausible | materiality_and_ownership_thin_surface |
| matched_unlabelled | aircall.io | strong_proxy | direct | moderate | moderate | high_fit | materiality_ownership_surface |
| matched_unlabelled | basware.com | confirmed | direct | moderate | rich | high_fit | materiality_ownership_surface |
| matched_unlabelled | contentful.com | unknown | unknown | unknown | none | not_promoted | contradicted |
| matched_unlabelled | datadoghq.com | unknown | unknown | unknown | sparse | under_observed | sparse_publication |
| matched_unlabelled | enphase.com | unknown | distributor_mediated | unknown | sparse | under_observed | sparse_publication |
| matched_unlabelled | loxone.com | unknown | unknown | light | sparse | under_observed | sparse_publication |
| matched_unlabelled | nedap.com | unknown | direct | light | sparse | under_observed | sparse_publication |
| matched_unlabelled | personio.com | unknown | unknown | unknown | none | not_promoted | contradicted |
| matched_unlabelled | silverfin.com | unknown | unknown | unknown | none | not_promoted | contradicted |
| matched_unlabelled | snyk.io | weak_proxy | direct | rich | rich | not_promoted | insufficient_positive_evidence |
| matched_unlabelled | teamleader.eu | weak_proxy | direct | moderate | moderate | not_promoted | insufficient_positive_evidence |
| matched_unlabelled | vectra.ai | weak_proxy | direct | moderate | moderate | not_promoted | insufficient_positive_evidence |
| matched_unlabelled | wasabi.com | weak_proxy | direct | light | moderate | not_promoted | insufficient_positive_evidence |
| matched_unlabelled | wiz.io | confirmed | direct | rich | rich | high_fit | materiality_ownership_surface |
| matched_unlabelled | yuki.nl | unknown | unknown | unknown | sparse | under_observed | sparse_publication |

## Customer-miss recovery (Phase 2 misses vs Phase 3 promotion)
| company | Phase 2 channel verdict | Phase 3 materiality | ownership | surface | promotion |
|---|---|---|---|---|---|
| ringover.com | unknown (channel_not_established) | confirmed | direct | light | plausible |
| zenity.io | unknown (channel_not_established) | weak_proxy | direct | unknown | under_observed |
| xelix.com | unknown (channel_not_established) | confirmed | direct | unknown | plausible |
| payflip.be | unknown (channel_not_established) | weak_proxy | direct | unknown | under_observed |

## Evidence density vs promotion (observability is tracked, never rewarded)
| density | n | high_fit | under_observed |
|---|---|---|---|
| rich | 7 | 6 | 0 |
| moderate | 16 | 4 | 0 |
| sparse | 21 | 0 | 17 |
| none | 4 | 0 | 0 |
