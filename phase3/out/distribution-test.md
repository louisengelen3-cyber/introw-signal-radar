# Segment-controlled distribution test
Absolute counts only. n is small and a percentage here would overstate what it shows.

## Carriage by population, WITHOUT segment control
| population | n | distributor-carried |
|---|---|---|
| customer_discovery | 13 | 1 |
| customer_holdout | 6 | 0 |
| clean_negative | 14 | 0 |
| matched_unlabelled | 15 | 2 |

## Carriage WITHIN segment
| segment | population | n | carried |
|---|---|---|---|
| software | customer_discovery | 8 | 1 |
| software | customer_holdout | 4 | 0 |
| software | clean_negative | 5 | 0 |
| software | matched_unlabelled | 9 | 0 |
| security | customer_discovery | 3 | 0 |
| security | customer_holdout | 1 | 0 |
| security | matched_unlabelled | 3 | 1 |
| hardware | customer_discovery | 2 | 0 |
| hardware | customer_holdout | 1 | 0 |
| hardware | matched_unlabelled | 3 | 1 |
| services | clean_negative | 5 | 0 |
| reseller | clean_negative | 4 | 0 |

## The controlled comparison
- **software**: customers 1/12 carried · matched unlabelled 0/9 carried
- **security**: customers 0/4 carried · matched unlabelled 1/3 carried
- **hardware**: customers 0/3 carried · matched unlabelled 1/3 carried
- **clean negatives** (services + reseller + software): 0/14 carried

## Does carriage add anything once ownership is known?
| group | n | direct/mixed ownership | promoted high_fit |
|---|---|---|---|
| carried | 3 | 2 | 0 |
| not carried | 45 | 27 | 10 |
