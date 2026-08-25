/**
 * Resolve a company NAME to a domain by first-party verification (Phase 5, workstream B).
 *
 * Most proxy-positive records arrive as case-study slugs, i.e. names without domains, and a
 * name cannot be researched. Search is not used to resolve them: the KORE case showed search
 * actively supplies the wrong company, and the first-party-only rule is not relaxed here.
 *
 * Instead a small set of candidate hosts is constructed mechanically from the name and each is
 * FETCHED. A candidate is accepted only if the site itself names the company — in its title,
 * its meta description or its opening prose. That makes a wrong resolution require the wrong
 * company to also carry the right name, which is a far higher bar than a search result.
 */
import { get, mainContent, stripTags } from '../lib/http.js';
import { isSoft404 } from '../recovery/surfaces.js';

const TLDS = ['com', 'io', 'co', 'ai', 'app', 'eu', 'net'];

export interface NameResolution {
  name: string;
  domain: string | null;
  basis: 'first_party_name_match' | 'unresolved';
  evidence: string | null;
  candidatesTried: number;
}

const slugify = (n: string) => n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
const hyphen = (n: string) => n.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Names too generic to resolve safely. Resolving these would attach the wrong company. */
export function tooGenericToResolve(name: string): boolean {
  const n = name.trim().toLowerCase();
  if (n.length < 3) return true;
  if (/^\d+$/.test(n)) return true;
  const GENERIC = /^(the|our|a|an|new|global|international|group|company|team|customer|client|partner|solution|platform|software|technology|digital|academy|services?|systems?)\b/;
  return GENERIC.test(n) && n.split(/\s+/).length <= 2;
}

export async function resolveNameToDomain(
  name: string,
  opts: { maxCandidates?: number } = {},
): Promise<NameResolution> {
  if (tooGenericToResolve(name)) {
    return { name, domain: null, basis: 'unresolved', evidence: null, candidatesTried: 0 };
  }
  const flat = slugify(name);
  const dashed = hyphen(name);
  const hosts: string[] = [];
  for (const t of TLDS) {
    hosts.push(`${flat}.${t}`);
    if (dashed !== flat) hosts.push(`${dashed}.${t}`);
  }
  const cap = opts.maxCandidates ?? 6;
  let tried = 0;
  const needle = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

  for (const h of hosts.slice(0, cap)) {
    tried++;
    const r = await get(`https://www.${h}/`, { timeout: 12000 });
    const rr = r.ok ? r : await get(`https://${h}/`, { timeout: 12000 });
    if (!rr.ok || !rr.body) continue;
    const title = rr.body.match(/<title[^>]*>([\s\S]{0,200}?)<\/title>/i)?.[1] ?? '';
    const desc = rr.body.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{0,300})["']/i)?.[1] ?? '';
    const text = stripTags(mainContent(rr.body)).slice(0, 600);
    if (isSoft404(text, title)) continue;
    const hay = `${title} ${desc} ${text}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
    if (!hay.includes(needle)) continue;                       // the site must name itself
    return {
      name, domain: h, basis: 'first_party_name_match',
      evidence: (title || desc || text.slice(0, 120)).replace(/\s+/g, ' ').trim().slice(0, 160),
      candidatesTried: tried,
    };
  }
  return { name, domain: null, basis: 'unresolved', evidence: null, candidatesTried: tried };
}
