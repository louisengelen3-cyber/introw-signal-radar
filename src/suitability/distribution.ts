/**
 * Distribution-mediated channel, observed from the counterparty side.
 *
 * The finding that produced this module: the structural evidence of two-tier distribution
 * is essentially ABSENT from vendors' own partner pages. Across twelve public partner
 * pages at NetApp, Sophos, Cisco, Nutanix and Forcepoint — companies whose channels are
 * unambiguously distributor-led — the words `two-tier`, `through a distributor`,
 * `authorised distributor`, `rebate`, `MDF` and `co-op` appeared zero times. Those pages
 * are reseller-recruitment marketing; the operating model lives behind the partner portal.
 *
 * It is, however, plainly visible from the other side. A distributor publishes the brands
 * it carries, and a vendor on that list sells through distribution by definition.
 *
 * Measured against the frozen suitability benchmark:
 *
 *   known Introw customers            1 of 16   (6%)
 *   hypothesised poor-fit programmes 10 of 14   (71%)
 *
 * That is the strongest structural discriminator found in Phase 2. It is a DEMOTION and
 * not an exclusion: Cubbit is a real Introw customer and is carried by Exclusive Networks,
 * so distribution and a direct programme plainly coexist.
 */

import { readFileSync } from 'node:fs';
import { normalise } from '../discovery/resolve.js';

export interface DistributorSighting {
  distributor: string;
  brandAsListed: string;
  sourceUrl: string;
}

export interface DistributionIndex {
  /** normalised brand key -> sightings */
  lookup: Map<string, DistributorSighting[]>;
  distributors: string[];
  brandCount: number;
}

const key = (s: string) => normalise(s).replace(/\s+/g, '');

/**
 * Build the index from harvested distributor vendor lists.
 * Kept file-driven rather than hard-coded so the distributor seed set can grow without
 * touching the suitability logic.
 */
export function buildDistributionIndex(harvestFiles: string[]): DistributionIndex {
  const lookup = new Map<string, DistributorSighting[]>();
  const distributors = new Set<string>();

  for (const file of harvestFiles) {
    let parsed: { results?: { mechanism: string; candidates: { name: string; source?: { url: string } }[] }[] };
    try { parsed = JSON.parse(readFileSync(file, 'utf8')); } catch { continue; }
    for (const m of parsed.results ?? []) {
      if (!m.mechanism.startsWith('distributor_inversion')) continue;
      const distributor = m.mechanism.split(':')[1] ?? m.mechanism;
      distributors.add(distributor);
      for (const c of m.candidates) {
        const k = key(c.name);
        if (!k || k.length < 3) continue;
        lookup.set(k, [...(lookup.get(k) ?? []), {
          distributor,
          brandAsListed: c.name,
          sourceUrl: c.source?.url ?? '',
        }]);
      }
    }
  }
  return { lookup, distributors: [...distributors], brandCount: lookup.size };
}

/**
 * Look a company up by name and by domain label. Both are tried because a distributor
 * lists a brand ("A10 Networks") while the radar carries a domain (a10networks.com).
 */
export function findSightings(index: DistributionIndex, name: string, domain: string): DistributorSighting[] {
  const byName = index.lookup.get(key(name));
  if (byName?.length) return byName;
  const label = domain.replace(/^www\./, '').split('.')[0];
  return index.lookup.get(key(label)) ?? [];
}
