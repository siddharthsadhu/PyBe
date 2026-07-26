/**
 * CKLIS Version 2 — Artifact Identity, Revision, and Traceability Contracts
 *
 * Every educational artifact produced during execution carries identity, revision,
 * status, and traceability information per Architecture §9.1 and §9.4.
 *
 * Architecture reference: Sections 4.4, 9.1–9.5 of Software Architecture.md
 *
 * Immutability rules:
 *   - Once Q3-approved, artifact content is immutable.
 *   - Revision creates a new artifact revision; never edits history.
 *   - RuntimeContext keeps a current pointer per artifact type.
 *   - Superseded revisions remain in append-only history.
 *   - Final outcomes reference only current Q3 revisions.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Core Enumerations
// ---------------------------------------------------------------------------

/**
 * All artifact types produced during execution.
 * Each type is produced by exactly one named producing module.
 */
export const ARTIFACT_TYPE_VALUES = [
  "misconception_profile",
  "mental_model_specification",
  "scenario_specification",
  "pattern_mapping_specification",
  "episode_specification",
  "pipeline_outcome",
  "studio_outcome",
] as const;

export const ArtifactTypeSchema = z.enum(ARTIFACT_TYPE_VALUES);
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

/**
 * Lifecycle status of an artifact revision.
 *   draft         — produced but not yet Q3-approved
 *   q3_approved   — passed Quality gate; content is immutable
 *   superseded    — replaced by a newer revision; retained in history
 */
export const ARTIFACT_STATUS_VALUES = [
  "draft",
  "q3_approved",
  "superseded",
] as const;

export const ArtifactStatusSchema = z.enum(ARTIFACT_STATUS_VALUES);
export type ArtifactStatus = z.infer<typeof ArtifactStatusSchema>;

/**
 * Quality levels.
 *   Q0 — Critical failure: reject; send feedback; re-execute
 *   Q1 — Major issues: send feedback; re-execute
 *   Q2 — Minor issues: send feedback; re-execute; NEVER advances
 *   Q3 — Fully compliant: permit forward progress or delivery
 *
 * Architecture §3.5. Q0–Q2 are INTERNAL only; learners never see them.
 */
export const Q_LEVEL_VALUES = ["Q0", "Q1", "Q2", "Q3"] as const;
export const QLevelSchema = z.enum(Q_LEVEL_VALUES);
export type QLevel = z.infer<typeof QLevelSchema>;

/** Returns true only for Q3 (the only level that may advance or deliver). */
export function isDeliverable(qLevel: QLevel): qLevel is "Q3" {
  return qLevel === "Q3";
}

/** Returns true for quality levels that require revision (Q0, Q1, Q2). */
export function requiresRevision(qLevel: QLevel): boolean {
  return qLevel !== "Q3";
}

// ---------------------------------------------------------------------------
// Upstream Reference
// ---------------------------------------------------------------------------

/**
 * Exact reference to an upstream artifact revision consumed during production.
 * Stored with every artifact to enable downstream invalidation (§9.4).
 */
export const UpstreamRevisionReferenceSchema = z.object({
  artifactId: z.string(),
  artifactType: ArtifactTypeSchema,
  revisionId: z.string(),
  revisionNumber: z.number().int().min(1),
});

export type UpstreamRevisionReference = z.infer<typeof UpstreamRevisionReferenceSchema>;

// ---------------------------------------------------------------------------
// Artifact Revision (the core traceability unit)
// ---------------------------------------------------------------------------

/**
 * The identity and metadata fields every artifact revision must carry.
 * The content field holds the typed educational payload (defined per artifact type
 * in the outcomes contract; opaque here to avoid coupling).
 *
 * Architecture §9.1, §4.4
 */
export const ArtifactRevisionSchema = z.object({
  /** Stable identifier for this artifact across all its revisions. */
  artifactId: z.string(),
  /** Distinguishes which kind of educational artifact this is. */
  artifactType: ArtifactTypeSchema,
  /** Unique identifier for this specific revision. */
  revisionId: z.string(),
  /** Monotonically increasing within one artifact (1, 2, 3, …). */
  revisionNumber: z.number().int().min(1),
  /** Module that produced this revision (e.g., "MisconceptionEngine"). */
  producerName: z.string(),
  /** Contract version of the producing module. */
  producerVersion: z.string(),
  /** Official specification document versions consulted during production. */
  specificationVersionsConsumed: z.array(z.string()),
  /** Exact upstream artifact revisions consumed. Enables downstream invalidation. */
  upstreamRevisionReferences: z.array(UpstreamRevisionReferenceSchema),
  /** Lifecycle status of this revision. */
  status: ArtifactStatusSchema,
  /** Quality level assigned after evaluation (Q0–Q3). */
  qLevel: QLevelSchema,
  /** ISO datetime when this revision was produced. */
  producedAt: z.string().datetime(),
  /**
   * The educational payload.
   * Type is opaque here; concrete sub-types are defined per artifact in outcomes.ts.
   * Runtime validates the schema for the specific type before merge.
   */
  content: z.unknown(),
});

export type ArtifactRevision = z.infer<typeof ArtifactRevisionSchema>;

// ---------------------------------------------------------------------------
// Traceability Chain
// ---------------------------------------------------------------------------

/**
 * The full traceability chain from a specific artifact revision back to the
 * resolved LES. Used in Pipeline Outcome assembly and Audit Log.
 */
export const ArtifactTraceabilitySchema = z.object({
  targetRevisionId: z.string(),
  targetArtifactType: ArtifactTypeSchema,
  resolvedLesReference: z.string(),
  upstreamChain: z.array(UpstreamRevisionReferenceSchema),
  traceCompletedAt: z.string().datetime(),
});

export type ArtifactTraceability = z.infer<typeof ArtifactTraceabilitySchema>;

// ---------------------------------------------------------------------------
// Downstream Invalidation
// ---------------------------------------------------------------------------

/**
 * When an artifact revision is superseded, all downstream artifacts that
 * consumed it must be invalidated and regenerated. This record captures
 * one invalidation event (Architecture §9.4).
 */
export const DownstreamInvalidationEventSchema = z.object({
  supersededRevisionId: z.string(),
  supersededArtifactType: ArtifactTypeSchema,
  invalidatedDownstreamRevisionIds: z.array(z.string()),
  invalidatedAt: z.string().datetime(),
  reason: z.string(),
});

export type DownstreamInvalidationEvent = z.infer<typeof DownstreamInvalidationEventSchema>;

// ---------------------------------------------------------------------------
// Artifact dependency order (fixed for Version 2)
// ---------------------------------------------------------------------------

/**
 * The fixed artifact dependency chain for Version 2 (Architecture §10.3).
 * Downstream invalidation always follows this order.
 */
export const ARTIFACT_DEPENDENCY_ORDER: ReadonlyArray<ArtifactType> = [
  "misconception_profile",
  "mental_model_specification",
  "scenario_specification",
  "pattern_mapping_specification",
  "episode_specification",
  "pipeline_outcome",
  "studio_outcome",
] as const;

/**
 * Returns the index of an artifact type in the dependency chain.
 * Lower index = earlier in the chain.
 */
export function artifactDependencyIndex(artifactType: ArtifactType): number {
  return ARTIFACT_DEPENDENCY_ORDER.indexOf(artifactType);
}

/**
 * Returns all artifact types that depend on (are downstream of) the given type.
 */
export function downstreamArtifactTypes(
  artifactType: ArtifactType
): ReadonlyArray<ArtifactType> {
  const idx = artifactDependencyIndex(artifactType);
  if (idx === -1) return [];
  return ARTIFACT_DEPENDENCY_ORDER.slice(idx + 1);
}
