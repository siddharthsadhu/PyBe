/**
 * CKLIS Version 2 — System Version Registry
 *
 * Architecture baseline: Software Architecture Version 2.0.0 (frozen 2026-07-26)
 *
 * This registry is the authoritative record of all versioned system components.
 * Every execution records these versions in its metadata and Audit Log.
 * Mismatched versions must fail safely rather than silently produce incorrect output.
 *
 * Versioning scheme: MAJOR.MINOR.PATCH (semantic versioning)
 *   MAJOR — breaking contract change
 *   MINOR — backward-compatible addition
 *   PATCH — backward-compatible correction
 *
 * Architecture Version 2.0.0 pins the overall system identity.
 * Component versions may increment independently within Architecture 2.0.0 lifetime.
 */

// ---------------------------------------------------------------------------
// Architecture and System Identity
// ---------------------------------------------------------------------------

/** Frozen architecture version. Never changes without an Evolution Engine review. */
export const ARCHITECTURE_VERSION = "2.0.0" as const;

/** CKLIS system version aligned with the architecture baseline. */
export const CKLIS_VERSION = "2.0.0" as const;

/** CKMS (Code Katha Model Specification) version. */
export const CKMS_VERSION = "1.0.0" as const;

// ---------------------------------------------------------------------------
// Runtime and Public API
// ---------------------------------------------------------------------------

/** Runtime core version. */
export const RUNTIME_VERSION = "1.0.0" as const;

/** Public API contract version. All six approved operations. */
export const PUBLIC_API_CONTRACT_VERSION = "1.0.0" as const;

// ---------------------------------------------------------------------------
// Individual Contract Versions
// ---------------------------------------------------------------------------

export const CONTRACT_VERSIONS = {
  les: "1.0.0",
  execution: "1.0.0",
  runtimeContext: "1.0.0",
  engines: "1.0.0",
  artifacts: "1.0.0",
  outcomes: "1.0.0",
  quality: "1.0.0",
  ports: "1.0.0",
} as const;

export type ContractVersionKey = keyof typeof CONTRACT_VERSIONS;

// ---------------------------------------------------------------------------
// Educational Engine Contract Versions
// ---------------------------------------------------------------------------

export const ENGINE_CONTRACT_VERSIONS = {
  misconception: "1.0.0",
  mentalModel: "1.0.0",
  scenarioIntelligence: "1.0.0",
  patternMapping: "1.0.0",
  episodeGeneration: "1.0.0",
} as const;

export type EngineContractVersionKey = keyof typeof ENGINE_CONTRACT_VERSIONS;

// ---------------------------------------------------------------------------
// Studio Resource Versions (versioned prompt and reference assets)
// ---------------------------------------------------------------------------

export const STUDIO_RESOURCE_VERSIONS = {
  cp1: "1.0.0",
  cp2: "1.0.0",
  onePageComic: "1.0.0",
  vp1: "1.0.0",
  vp2: "1.0.0",
  audioPodcast: "1.0.0",
} as const;

export type StudioResourceKey = keyof typeof STUDIO_RESOURCE_VERSIONS;

// ---------------------------------------------------------------------------
// Combined registry for execution metadata recording
// ---------------------------------------------------------------------------

export const SYSTEM_VERSION_REGISTRY = {
  architecture: ARCHITECTURE_VERSION,
  cklis: CKLIS_VERSION,
  ckms: CKMS_VERSION,
  runtime: RUNTIME_VERSION,
  publicApi: PUBLIC_API_CONTRACT_VERSION,
  contracts: CONTRACT_VERSIONS,
  engineContracts: ENGINE_CONTRACT_VERSIONS,
  studioResources: STUDIO_RESOURCE_VERSIONS,
} as const;

export type SystemVersionRegistry = typeof SYSTEM_VERSION_REGISTRY;

// ---------------------------------------------------------------------------
// Version Compatibility Utilities
// ---------------------------------------------------------------------------

/**
 * Parses a semantic version string into its numeric parts.
 * Returns null if the string is not a valid semver.
 */
export function parseSemver(
  version: string
): { major: number; minor: number; patch: number } | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) return null;
  return {
    major: parseInt(match[1]!, 10),
    minor: parseInt(match[2]!, 10),
    patch: parseInt(match[3]!, 10),
  };
}

/**
 * Returns true if `actual` satisfies the minimum version requirement `required`.
 * Two versions are compatible when:
 *   - actual.major === required.major (breaking changes differ by major)
 *   - actual.minor >= required.minor  (backward-compatible additions)
 *   - if minors equal: actual.patch >= required.patch
 */
export function isVersionCompatible(
  actual: string,
  required: string
): boolean {
  const a = parseSemver(actual);
  const r = parseSemver(required);
  if (!a || !r) return false;
  if (a.major !== r.major) return false;
  if (a.minor > r.minor) return true;
  if (a.minor < r.minor) return false;
  return a.patch >= r.patch;
}

/**
 * Result of a version compatibility check.
 */
export interface VersionCompatibilityResult {
  readonly compatible: boolean;
  readonly actual: string;
  readonly required: string;
  readonly reason: string;
}

/**
 * Checks compatibility and returns a structured result with a reason.
 */
export function checkVersionCompatibility(
  actual: string,
  required: string,
  componentName: string
): VersionCompatibilityResult {
  const compatible = isVersionCompatible(actual, required);
  return {
    compatible,
    actual,
    required,
    reason: compatible
      ? `${componentName} version ${actual} satisfies requirement ${required}`
      : `${componentName} version ${actual} is incompatible with required ${required}`,
  };
}
