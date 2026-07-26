/**
 * CKLIS Version 2 — RuntimeContext Section Contracts
 *
 * Defines the shape of each section of the RuntimeContext.
 *
 * Architecture reference: Section 4 of Software Architecture.md
 *
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  INTERNAL — NEVER EXPOSE TO PUBLIC API OR LEARNER-FACING OUTPUT  ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 *
 * The RuntimeContext is the single authoritative, temporary execution state
 * for one request. It exists only for the duration of one execution.
 *
 * Ownership rules (Architecture §4.3):
 *   - Runtime alone creates, mutates, freezes, snapshots, and destroys context.
 *   - Engines receive read-only bounded views; they do not receive the full context.
 *   - Engines return structured results; Runtime performs controlled merges.
 *   - API, frontend, provider adapters, and prompt resources never receive full context.
 *   - Context is never reused across executions.
 *   - Context is never reconstructed from an Audit Log.
 */

import { z } from "zod";
import { InternalExecutionStateSchema } from "../execution/index.js";
import { ResolvedLesSchema, CandidateLesSchema } from "../les/index.js";
import { StudioFormatSchema } from "../public-api/index.js";

// ---------------------------------------------------------------------------
// RuntimeContext Lifecycle States
// ---------------------------------------------------------------------------

/**
 * Fine-grained lifecycle states of the RuntimeContext itself.
 * These are distinct from InternalExecutionState — the context has its own
 * mutation lifecycle even within a single execution state.
 *
 * @internal
 */
export const RUNTIME_CONTEXT_LIFECYCLE_VALUES = [
  "created",
  "les_unresolved",
  "les_resolved",
  "pipeline_active",
  "pipeline_q3_approved",
  "studio_active",
  "studio_q3_approved",
  "frozen_for_finalization",
  "outcomes_persisted",
  "completed_and_delivered",
  "destroyed",
] as const;

export const RuntimeContextLifecycleSchema = z.enum(
  RUNTIME_CONTEXT_LIFECYCLE_VALUES
);
export type RuntimeContextLifecycle = z.infer<typeof RuntimeContextLifecycleSchema>;

// ---------------------------------------------------------------------------
// Section 1: Execution Identity  (@internal)
// ---------------------------------------------------------------------------

/**
 * Pinned system version snapshot at execution creation time.
 * Every execution records the exact versions used. Mismatched versions fail safely.
 * @internal
 */
export const PinnedVersionsSchema = z.object({
  architecture: z.literal("2.0.0"),
  cklis: z.string(),
  ckms: z.string(),
  runtime: z.string(),
  publicApiContract: z.string(),
  engineContracts: z.record(z.string(), z.string()),
  studioResources: z.record(z.string(), z.string()),
});

export type PinnedVersions = z.infer<typeof PinnedVersionsSchema>;

/**
 * Execution Identity section of RuntimeContext.
 * @internal
 */
export const ExecutionIdentitySectionSchema = z.object({
  executionId: z.string(),
  initiatorId: z.string().optional(),
  requestSource: z.string(),
  createdAt: z.string().datetime(),
  phase: InternalExecutionStateSchema,
  contextLifecycle: RuntimeContextLifecycleSchema,
  pinnedVersions: PinnedVersionsSchema,
  correlationId: z.string().optional(),
});

export type ExecutionIdentitySection = z.infer<typeof ExecutionIdentitySectionSchema>;

// ---------------------------------------------------------------------------
// Section 2: Original Request  (@internal)
// ---------------------------------------------------------------------------

/**
 * Preserved verbatim original request.
 * The Runtime must never alter the original request it received.
 * @internal
 */
export const OriginalRequestSectionSchema = z.object({
  rawRequest: z.unknown(),
  receivedAt: z.string().datetime(),
  requestForm: z.enum(["natural_language", "partial_structured", "fully_structured"]),
});

export type OriginalRequestSection = z.infer<typeof OriginalRequestSectionSchema>;

// ---------------------------------------------------------------------------
// Section 3: LES State  (@internal)
// ---------------------------------------------------------------------------

/**
 * @internal
 */
export const ClarificationExchangeSchema = z.object({
  questionsAsked: z.array(
    z.object({
      fieldKey: z.string(),
      askedAt: z.string().datetime(),
    })
  ),
  answersReceived: z.record(z.string(), z.string()),
  answeredAt: z.string().datetime().optional(),
});

export type ClarificationExchange = z.infer<typeof ClarificationExchangeSchema>;

/**
 * LES resolution state throughout the intake phase.
 * @internal
 */
export const LesStateSectionSchema = z.object({
  candidateLes: CandidateLesSchema.optional(),
  validationFindings: z.array(z.string()),
  clarificationHistory: z.array(ClarificationExchangeSchema),
  clarificationAttempts: z.number().int().min(0),
  resolvedLes: ResolvedLesSchema.optional(),
  isResolved: z.boolean(),
});

export type LesStateSection = z.infer<typeof LesStateSectionSchema>;

// ---------------------------------------------------------------------------
// Section 4: Runtime Decisions  (@internal)
// ---------------------------------------------------------------------------

/**
 * A single runtime decision with its rationale reference.
 * Decisions are append-only; rationale references spec sections, not private reasoning.
 * @internal
 */
export const RuntimeDecisionSchema = z.object({
  decisionKey: z.string(),
  value: z.unknown(),
  source: z.enum(["explicit_learner_choice", "inference", "default", "compatibility_rule"]),
  rationaleReference: z.string(),
  decidedAt: z.string().datetime(),
});

export type RuntimeDecision = z.infer<typeof RuntimeDecisionSchema>;

/**
 * @internal
 */
export const RuntimeDecisionsSectionSchema = z.object({
  primaryLearningObjective: z.string().optional(),
  resolvedAudience: z.string().optional(),
  resolvedDifficulty: z.string().optional(),
  resolvedPriorKnowledge: z.array(z.string()),
  resolvedTeachingStrategy: z.string().optional(),
  resolvedStoryIntegration: z.string().optional(),
  selectedStudioFormat: StudioFormatSchema.optional(),
  decisions: z.array(RuntimeDecisionSchema),
});

export type RuntimeDecisionsSection = z.infer<typeof RuntimeDecisionsSectionSchema>;

// ---------------------------------------------------------------------------
// Section 5: Artifact Graph  (@internal)
// ---------------------------------------------------------------------------

/**
 * Current pointer for one artifact type within the execution graph.
 * @internal
 */
export const ArtifactGraphPointerSchema = z.object({
  artifactType: z.string(),
  currentRevisionId: z.string(),
  status: z.enum(["draft", "q3_approved", "superseded"]),
  allRevisionIds: z.array(z.string()),
});

export type ArtifactGraphPointer = z.infer<typeof ArtifactGraphPointerSchema>;

/**
 * @internal
 */
export const ArtifactGraphSectionSchema = z.object({
  pointers: z.record(z.string(), ArtifactGraphPointerSchema),
  dependencyEdges: z.array(
    z.object({
      producerRevisionId: z.string(),
      consumerRevisionId: z.string(),
    })
  ),
  invalidatedRevisionIds: z.array(z.string()),
});

export type ArtifactGraphSection = z.infer<typeof ArtifactGraphSectionSchema>;

// ---------------------------------------------------------------------------
// Section 6–7: Educational Artifacts & Pipeline Production  (@internal)
// ---------------------------------------------------------------------------

/**
 * Placeholder for educational artifact content within RuntimeContext.
 * Concrete content types are defined in the artifacts and outcomes contracts.
 * @internal
 */
export const EducationalArtifactsSectionSchema = z.object({
  misconceptionProfileRevisionIds: z.array(z.string()),
  mentalModelRevisionIds: z.array(z.string()),
  scenarioRevisionIds: z.array(z.string()),
  patternMappingRevisionIds: z.array(z.string()),
  episodeRevisionIds: z.array(z.string()),
});

export type EducationalArtifactsSection = z.infer<typeof EducationalArtifactsSectionSchema>;

/** @internal */
export const PipelineProductionSectionSchema = z.object({
  candidateRevisionIds: z.array(z.string()),
  approvedRevisionId: z.string().optional(),
  pipelineQualityGatePassed: z.boolean(),
  assembledAt: z.string().datetime().optional(),
});

export type PipelineProductionSection = z.infer<typeof PipelineProductionSectionSchema>;

// ---------------------------------------------------------------------------
// Section 8: Studio Production  (@internal)
// ---------------------------------------------------------------------------

/** @internal */
export const StudioProductionSectionSchema = z.object({
  selectedPath: StudioFormatSchema.optional(),
  intermediateStageRevisionIds: z.array(z.string()),
  candidateRevisionIds: z.array(z.string()),
  approvedRevisionId: z.string().optional(),
  studioQualityGatePassed: z.boolean(),
});

export type StudioProductionSection = z.infer<typeof StudioProductionSectionSchema>;

// ---------------------------------------------------------------------------
// Section 9: Quality State  (@internal)
// ---------------------------------------------------------------------------

/** @internal */
export const QualityStateSectionSchema = z.object({
  stageReportIds: z.record(z.string(), z.array(z.string())),
  pipelineGateReportIds: z.array(z.string()),
  studioGateReportIds: z.array(z.string()),
  currentPipelineQLevel: z.string().optional(),
  currentStudioQLevel: z.string().optional(),
});

export type QualityStateSection = z.infer<typeof QualityStateSectionSchema>;

// ---------------------------------------------------------------------------
// Section 10: Revision State  (@internal)
// ---------------------------------------------------------------------------

/** @internal */
export const RevisionStateSectionSchema = z.object({
  totalRevisionAttempts: z.number().int().min(0),
  revisionsByArtifactType: z.record(z.string(), z.number().int().min(0)),
  supersessionHistory: z.array(
    z.object({
      supersededRevisionId: z.string(),
      supersededAt: z.string().datetime(),
      reason: z.string(),
    })
  ),
  invalidatedDependencyChains: z.array(z.array(z.string())),
});

export type RevisionStateSection = z.infer<typeof RevisionStateSectionSchema>;

// ---------------------------------------------------------------------------
// Section 11: Progress State  (@internal)
// ---------------------------------------------------------------------------

/** @internal */
export const ProgressStateSectionSchema = z.object({
  internalStateSince: z.string().datetime(),
  lastPublishedProgressEvent: z.string().optional(),
  publishedEventCount: z.number().int().min(0),
});

export type ProgressStateSection = z.infer<typeof ProgressStateSectionSchema>;

// ---------------------------------------------------------------------------
// Section 12: Finalization State  (@internal)
// ---------------------------------------------------------------------------

/** @internal */
export const FinalizationStateSectionSchema = z.object({
  pipelineOutcomeId: z.string().optional(),
  studioOutcomeId: z.string().optional(),
  envelopeId: z.string().optional(),
  outcomePersistenceAcknowledged: z.boolean(),
  auditLogPersistenceAcknowledged: z.boolean(),
  completionPublished: z.boolean(),
  destructionReadiness: z.boolean(),
  finalizedAt: z.string().datetime().optional(),
});

export type FinalizationStateSection = z.infer<typeof FinalizationStateSectionSchema>;

// ---------------------------------------------------------------------------
// Full RuntimeContext Schema (INTERNAL — never expose publicly)
// ---------------------------------------------------------------------------

/**
 * The complete RuntimeContext for one execution.
 *
 * @internal
 * This type MUST NEVER be serialized to the public API, progress events,
 * or any learner-visible output. It exists solely within the Runtime layer.
 *
 * Architecture §4.1–4.5
 */
export const RuntimeContextSchema = z.object({
  executionIdentity: ExecutionIdentitySectionSchema,
  originalRequest: OriginalRequestSectionSchema,
  lesState: LesStateSectionSchema,
  runtimeDecisions: RuntimeDecisionsSectionSchema,
  artifactGraph: ArtifactGraphSectionSchema,
  educationalArtifacts: EducationalArtifactsSectionSchema,
  pipelineProduction: PipelineProductionSectionSchema,
  studioProduction: StudioProductionSectionSchema,
  qualityState: QualityStateSectionSchema,
  revisionState: RevisionStateSectionSchema,
  progressState: ProgressStateSectionSchema,
  finalizationState: FinalizationStateSectionSchema,
});

export type RuntimeContext = z.infer<typeof RuntimeContextSchema>;
