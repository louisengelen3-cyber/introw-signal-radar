/**
 * Search-pattern discovery.
 *
 * Generic, multilingual queries. No company name ever appears in a query, so results cannot
 * be a restatement of a list we already have. The language of the query is the lever: English
 * channel vocabulary returns software, German and Dutch trade vocabulary returns
 * manufacturers.
 *
 * This script only PREPARES the queries and normalises results; the search itself is executed
 * by the operator and pasted back, so the run is reproducible and auditable.
 */
import { SEARCH_PATTERNS } from '../src/discovery/adapters.js';
console.log(JSON.stringify(SEARCH_PATTERNS, null, 2));
