/**
 * Vocabulary bias audit. Static: reads the detector sources and asks which trade language
 * they can and cannot see. Nothing is modified.
 */
import { readFileSync } from 'node:fs';

/**
 * CORRECTED after red-team review. The first version scanned 8 hand-picked files out of 34 in
 * src/, excluding category/classify.ts, temporal/snapshot.ts, pipeline/operator.ts and
 * suitability/distribution.ts — which is where much of the trade language actually lives. It
 * penalised the trade lexicon partly for living in files the instrument declined to open.
 */
import { readdirSync, statSync } from 'node:fs';
const SRC = new URL('../src/', import.meta.url).pathname;
const walk = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = `${dir}${f}`;
  return statSync(p).isDirectory() ? walk(`${p}/`) : p.endsWith('.ts') ? [p] : [];
});
const FILES = walk(SRC);
const corpus = FILES.map((f) => readFileSync(f, 'utf8')).join('\n');

/** Terms a SaaS partner programme uses. */
const SAAS_NATIVE = [
  'partner program', 'deal registration', 'partner portal', 'co-sell', 'co-selling',
  'partner-sourced', 'referral partner', 'alliances', 'partner tiers', 'partner enablement',
  'solution partner', 'technology partner', 'integration partner', 'agency partner',
  'partner onboarding', 'partner marketing', 'MDF', 'partner directory',
];

/** Equivalent language used outside SaaS. */
const TRADE_NATIVE = [
  'dealer network', 'authorized dealer', 'authorised dealer', 'become a dealer', 'dealer locator',
  'installer network', 'certified installer', 'find an installer', 'become an installer',
  'approved installer', 'installateur', 'fachpartner', 'fachbetrieb',
  'distribution network', 'authorized distributor', 'authorised distributor', 'distributeur',
  'where to buy', 'stockist', 'wholesaler', 'groothandel', 'grossist',
  'system integrator', 'systems integrator', 'integrator network', 'VAR', 'value-added reseller',
  'OEM partner', 'sales agent', 'representative network', 'rep network', 'trade partner',
  'service partner', 'service centre', 'service center', 'service network', 'maintenance partner',
  'certified partner', 'accredited installer', 'partner locator', 'find a dealer',
  'MSP', 'managed service provider', 'verkooppunten', 'händlersuche', 'point de vente',
];

/**
 * Detectors are written as GENERAL regexes — `systems? integrator`, `authoriz?ed distributor`,
 * `solution(s)? partner`. Literal matching reported all three ABSENT: the `?` and `(s)?` that
 * make a pattern more general are exactly what made the naive instrument call it missing. Each
 * term is therefore tested both literally and with optional-character tolerance.
 */
const has = (term: string) => {
  const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const literal = new RegExp(esc.replace(/[\s-]/g, '[\\s\\\\-]?'), 'i');
  if (literal.test(corpus)) return true;
  // Tolerate an optional character after any letter, and optional pluralisation.
  const tolerant = new RegExp(
    term.split(/[\s-]+/).map((wd) => wd.split('').map((ch) => `${ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\??`).join('') + '(?:\\(s\\)\\?|s\\?|s)?')
      .join('[\\s\\\\|-]{0,4}'),
    'i',
  );
  return tolerant.test(corpus);
};

const report = (label: string, terms: string[]) => {
  const found = terms.filter(has);
  const missing = terms.filter((t) => !has(t));
  console.log(`\n${label}: ${found.length}/${terms.length} present (${Math.round((found.length / terms.length) * 100)}%)`);
  if (missing.length) console.log(`  ABSENT: ${missing.join(' · ')}`);
  return { found: found.length, total: terms.length, missing };
};

console.log('VOCABULARY BIAS AUDIT — which trade language can the detectors see?');
const saas = report('SaaS-native partner vocabulary', SAAS_NATIVE);
const trade = report('Non-SaaS trade vocabulary', TRADE_NATIVE);

console.log(`\nSUMMARY`);
console.log(`  SaaS-native coverage : ${Math.round((saas.found / saas.total) * 100)}%`);
console.log(`  Trade coverage       : ${Math.round((trade.found / trade.total) * 100)}%`);
console.log(`  Gap                  : ${Math.round((saas.found / saas.total) * 100) - Math.round((trade.found / trade.total) * 100)} percentage points`);

// Which locales can the pipeline read at all?
const LOCALES = ['nl', 'de', 'fr', 'es', 'it', 'sv', 'da', 'no', 'pl', 'pt'];
console.log(`\nLOCALE REACH (paths and lexicon hints found in source):`);
for (const l of LOCALES) {
  const hit = new RegExp(`['"\\\\/]${l}[-_/'"]|\\b${l}\\b\\s*[:=]`, 'i').test(corpus);
  console.log(`  ${l}: ${hit ? 'referenced' : 'absent'}`);
}
