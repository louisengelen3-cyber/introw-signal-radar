/**
 * Feature flags for discovery and recovery (mandate §27).
 *
 * Both capabilities are independently controllable and both default OFF. Rollback must never
 * require removing code: a bad discovery run is disabled by flipping a flag, not by reverting
 * a commit and rebuilding. Per-family flags exist so one under-performing query family can be
 * disabled without disabling discovery as a whole (§36).
 */

export interface RadarFlags {
  /** Generate candidates at all. Off means the discovery pipeline does not run. */
  DISCOVERY_ENABLED: boolean;
  /**
   * Surface discovered candidates in the seller-facing workflow. Independent of
   * DISCOVERY_ENABLED so discovery can run in shadow mode: candidates are generated,
   * resolved and measured, but no seller sees them (§28).
   */
  DISCOVERY_VISIBLE: boolean;
  /** Add the recovery source layer to research. Never replaces base research (§14). */
  RECOVERY_ENABLED: boolean;
  /** Query families explicitly disabled, by name. Empty means all validated families run. */
  DISABLED_QUERY_FAMILIES: string[];
}

/**
 * Conservative production defaults. Discovery generates nothing and shows nothing until a
 * shadow run has been reviewed; recovery is opt-in per caller.
 */
export const DEFAULT_FLAGS: RadarFlags = {
  DISCOVERY_ENABLED: false,
  DISCOVERY_VISIBLE: false,
  RECOVERY_ENABLED: false,
  DISABLED_QUERY_FAMILIES: [],
};

const truthy = (v: string | undefined): boolean | undefined =>
  v === undefined ? undefined : /^(1|true|on|yes)$/i.test(v);

/**
 * Flags from the environment, falling back to the conservative defaults. Reading the
 * environment here rather than at each use site keeps the resolved configuration auditable:
 * one place answers "what was on during that run".
 */
export function resolveFlags(env: Record<string, string | undefined> = process.env): RadarFlags {
  return {
    DISCOVERY_ENABLED: truthy(env.DISCOVERY_ENABLED) ?? DEFAULT_FLAGS.DISCOVERY_ENABLED,
    DISCOVERY_VISIBLE: truthy(env.DISCOVERY_VISIBLE) ?? DEFAULT_FLAGS.DISCOVERY_VISIBLE,
    RECOVERY_ENABLED: truthy(env.RECOVERY_ENABLED) ?? DEFAULT_FLAGS.RECOVERY_ENABLED,
    DISABLED_QUERY_FAMILIES: (env.DISABLED_QUERY_FAMILIES ?? '').split(',').map((s) => s.trim()).filter(Boolean),
  };
}
