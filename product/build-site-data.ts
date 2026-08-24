/**
 * Emit the static data the web app reads.
 *
 *   public/data/index.json          one light row per account, for list screens
 *   public/data/dossiers/<d>.json   the full dossier, fetched only when opened
 *
 * Splitting matters: the combined dossier file is ~600KB, and bundling it meant the first
 * screen paid for all 35 accounts before rendering one. The index carries only what the
 * tables actually display.
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import type { Dossier } from '../src/dossier/types.js';

const OUT = new URL('../public/data/', import.meta.url).pathname;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}dossiers`, { recursive: true });

const all = JSON.parse(readFileSync(new URL('./out/dossiers.json', import.meta.url).pathname, 'utf8')) as Dossier[];

export interface IndexRow {
  domain: string;
  companyName: string | null;
  selfDescription: string | null;
  category: string;
  onCompetitorList: boolean;
  machineState: string;
  materiality: string;
  ownership: string;
  surface: string;
  programmes: string[];
  surfacesConfirmed: number;
  directoryLowerBound: number | null;
  crm: string;
  prm: string;
  prmVendor: string | null;
  people: string;
  coverage: string;
  distinctClaims: number;
  independentSources: number;
  contradictions: number;
  researchTasks: number;
  topUnknown: string | null;
  /** The machine's own first reason, so a list row states why rather than restating a category. */
  machineReason: string | null;
  prmIsIntrow: boolean;
  /** Strongest CRM evidence level, so a list row can distinguish supporting from confirmed. */
  crmLevel: string | null;
  crmVendor: string | null;
  jobVacancies: number;
  jobFacts: number;
  retrievedAt: string;
  sourceHealthOk: number;
  sourceHealthTotal: number;
  /**
   * What the additive recovery layer contributed on this account (§44). `null` means
   * recovery did not run, which is the expected state for a well-observed account.
   */
  recovery: { ran: boolean; added: number; domainsSearched: number; pagesRead: number } | null;
  /**
   * Forensic CRM panel (§39). Carries the LEVEL and the DATE, because a historical finding
   * must not be presentable as a current one (§40).
   */
  crmForensic: {
    vendor: string; level: string; jobTitle: string | null; sourceType: string | null;
    publishedAt: string | null; conflict: string | null; vacanciesRead: number;
  } | null;
}

const row = (d: Dossier): IndexRow => ({
  domain: d.domain,
  companyName: d.companyName,
  selfDescription: d.selfDescription?.text.slice(0, 180) ?? null,
  category: d.category.state,
  onCompetitorList: d.category.knownCompetitorList.onList,
  machineState: d.machineInterpretation.state,
  materiality: d.constructs.find((c) => c.construct === 'commercial_materiality')?.state ?? 'unknown',
  ownership: d.constructs.find((c) => c.construct === 'operational_ownership')?.state ?? 'unknown',
  surface: d.constructs.find((c) => c.construct === 'operational_surface')?.state ?? 'unknown',
  programmes: [...new Set(d.programmes.map((p) => p.kind))],
  surfacesConfirmed: (d.surfaces ?? []).filter((s) => s.state === 'confirmed').length,
  directoryLowerBound: d.partnerDirectory.isDirectory ? d.partnerDirectory.lowerBound : null,
  /**
   * The index CRM state follows the same precedence as the dossier panel: when forensics ran
   * it supersedes the legacy fingerprint-derived state, so Accounts, Data health and the
   * dossier cannot disagree about the same company.
   */
  crm: (() => {
    const f = (d as any).crmForensics;
    const top = f?.vendors?.[0];
    if (!top) return d.systems.crm.state;
    if (/^confirmed_/.test(top.level)) return `${top.vendor.toLowerCase().replace(/\s+/g, '_')}_${top.level.replace('confirmed_', '')}`;
    return 'unknown';
  })(),
  prm: d.systems.prm.state,
  prmVendor: d.systems.prm.vendor,
  people: d.people.state,
  coverage: d.evidenceCoverage,
  distinctClaims: d.machineInterpretation.diagnostics.distinctClaimCount,
  independentSources: d.machineInterpretation.diagnostics.independentSourceCount,
  contradictions: d.contradictions.length,
  researchTasks: d.researchTasks.length,
  // The single most useful unknown for a list row: the first research question.
  topUnknown: d.researchTasks[0]?.question ?? null,
  machineReason: d.machineInterpretation.reasons[0] ?? null,
  prmIsIntrow: d.systems.prm.state === 'introw_confirmed',
  crmLevel: d.systems.crm.bundle?.vendors[0]?.level ?? null,
  crmVendor: d.systems.crm.bundle?.vendors[0]?.vendor ?? null,
  jobVacancies: d.jobEvidence?.vacanciesUsed ?? 0,
  jobFacts: d.jobEvidence?.operationalHits.length ?? 0,
  retrievedAt: d.oldestEvidenceAt ?? d.builtAt,
  sourceHealthOk: d.sourceHealth.filter((h) => h.health === 'success').length,
  sourceHealthTotal: d.sourceHealth.length,
  recovery: d.recovery
    ? { ran: true, added: d.recovery.addedMotions.length + d.recovery.addedSurfaces.length + (d.recovery.addedDirectoryType ? 1 : 0),
        domainsSearched: d.recovery.domainsSearched.length, pagesRead: d.recovery.pagesRead }
    : null,
  crmForensic: (() => {
    const f = (d as any).crmForensics;
    const top = f?.vendors?.[0];
    if (!top) return null;
    return {
      vendor: top.vendor, level: top.level,
      jobTitle: top.basis?.jobTitle ?? null, sourceType: top.basis?.sourceType ?? null,
      publishedAt: top.basis?.sourcePublishedAt ?? null,
      conflict: f.conflict?.kind ?? null,
      vacanciesRead: f.coverage?.vacanciesRead ?? 0,
    };
  })(),
});

for (const d of all) writeFileSync(`${OUT}dossiers/${d.domain}.json`, JSON.stringify(d));

const index = {
  generatedAt: new Date().toISOString(),
  count: all.length,
  // Temporal monitoring began at the Phase 3 baseline; the app states this rather than
  // implying that an empty Changes view means nothing has happened in the world.
  monitoringSince: '2026-08-23',
  accounts: all.map(row).sort((a, b) => (a.companyName ?? a.domain).localeCompare(b.companyName ?? b.domain)),
};
writeFileSync(`${OUT}index.json`, JSON.stringify(index, null, 1));

const kb = (n: number) => `${Math.round(n / 1024)}KB`;
console.error(`index.json ${kb(JSON.stringify(index).length)} · ${all.length} dossiers written individually`);
