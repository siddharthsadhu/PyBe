/**
 * CKLIS Version 2 — Public API Contracts
 *
 * Defines the stable learner-facing envelopes for the six approved API operations.
 *
 * Architecture reference: Section 7 of Software Architecture.md (frozen 2026-07-26)
 *
 * PROHIBITED CONTENTS — these fields must never appear in any schema in this module:
 *   - RuntimeContext fields or internal section names
 *   - Internal engine names or execution attempt counts
 *   - Q0, Q1, Q2 Quality levels or reports
 *   - Raw prompt text or prompt assembly details
 *   - Provider names, credentials, or diagnostic information
 *   - Stack traces, exception messages, or infrastructure errors
 *   - Audit Log contents
 *   - Revision history or superseded artifact content
 *   - Private Quality feedback or structured feedback requests
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Core Enumerations
// ---------------------------------------------------------------------------

/**
 * Exactly six public execution status values.
 * Internal states (PIPELINE_RUNNING, PIPELINE_REVISING, etc.) are never public.
 * Q-levels are never public status values.
 *
 * Architecture §7.1
 */
export const PUBLIC_EXECUTION_STATUS_VALUES = [
  "accepted",
  "awaiting_clarification",
  "running",
  "finalizing",
  "completed",
  "failed",
] as const;

export const PublicExecutionStatusSchema = z.enum(PUBLIC_EXECUTION_STATUS_VALUES);
export type PublicExecutionStatus = z.infer<typeof PublicExecutionStatusSchema>;

/**
 * Exactly four Version 2 Studio formats.
 * Any Desired Output that cannot resolve to exactly one of these produces a safe
 * validation response or minimum clarification; it is never silently mapped.
 *
 * Architecture §3.7, §7.2
 */
export const STUDIO_FORMAT_VALUES = [
  "comic",
  "one_page_comic",
  "video",
  "audio_podcast",
] as const;

export const StudioFormatSchema = z.enum(STUDIO_FORMAT_VALUES);
export type StudioFormat = z.infer<typeof StudioFormatSchema>;

/**
 * Exactly nine learner-safe progress stage labels.
 * These are the only labels a client may observe for progress events.
 * Internal engine names (Misconception, MentalModel, etc.) never appear in progress.
 *
 * Architecture §7.5
 */
export const PROGRESS_STAGE_VALUES = [
  "understanding_learning_goal",
  "building_mental_model",
  "exploring_educational_context",
  "designing_learning_journey",
  "creating_pipeline_outcome",
  "reviewing_educational_quality",
  "creating_studio_outcome",
  "reviewing_studio_quality",
  "preparing_final_experience",
] as const;

export const ProgressStageSchema = z.enum(PROGRESS_STAGE_VALUES);
export type ProgressStage = z.infer<typeof ProgressStageSchema>;

/**
 * Exactly four learner-safe failure categories.
 * Stack traces, provider errors, and Quality reports are excluded.
 *
 * Architecture §7.7
 */
export const FAILURE_CATEGORY_VALUES = [
  "invalid_request",
  "unsupported_output",
  "clarification_required",
  "execution_unavailable",
] as const;

export const FailureCategorySchema = z.enum(FAILURE_CATEGORY_VALUES);
export type FailureCategory = z.infer<typeof FailureCategorySchema>;

// ---------------------------------------------------------------------------
// Q3 Approval Summary (only safe approval information is public)
// ---------------------------------------------------------------------------

/**
 * The only Quality-related information that may appear in a learner-facing response.
 * Q-level grades, dimension scores, revision counts, and private reports are excluded.
 */
export const Q3ApprovalSummarySchema = z.object({
  approvalStatus: z.literal("q3_approved"),
  completedAt: z.string().datetime(),
});
export type Q3ApprovalSummary = z.infer<typeof Q3ApprovalSummarySchema>;

// ---------------------------------------------------------------------------
// Request forms (POST /api/v2/executions)
// ---------------------------------------------------------------------------

/** Shared optional preference fields for all request forms. Architecture §7.2 */
const SharedPreferencesSchema = z.object({
  audience: z.string().optional(),
  educationalContext: z.string().optional(),
  language: z.string().optional(),
  duration: z.string().optional(),
  productionProfile: z.string().optional(),
  platform: z.string().optional(),
  experienceHints: z.array(z.string()).optional(),
  experienceConstraints: z.array(z.string()).optional(),
  additionalOutputNotes: z.string().optional(),
});

/**
 * Natural-language form: the learner types a free-text request.
 * Runtime interprets it through LES before any engine runs.
 */
export const NaturalLanguageRequestSchema = z.object({
  form: z.literal("natural_language"),
  /** The free-text learning request. Educational Intent is extracted by Runtime. */
  request: z.string().min(1, "Learning request cannot be empty"),
  studioFormat: StudioFormatSchema,
}).merge(SharedPreferencesSchema);

export type NaturalLanguageRequest = z.infer<typeof NaturalLanguageRequestSchema>;

/**
 * Partially structured form: Educational Intent is explicit; other fields optional.
 */
export const PartialStructuredRequestSchema = z.object({
  form: z.literal("partial_structured"),
  educationalIntent: z.string().min(1, "Educational Intent cannot be empty"),
  studioFormat: StudioFormatSchema,
}).merge(SharedPreferencesSchema);

export type PartialStructuredRequest = z.infer<typeof PartialStructuredRequestSchema>;

/**
 * Fully structured form: all LES fields explicitly provided.
 */
export const FullyStructuredRequestSchema = z.object({
  form: z.literal("fully_structured"),
  educationalIntent: z.string().min(1, "Educational Intent cannot be empty"),
  studioFormat: StudioFormatSchema,
  audience: z.string(),
  educationalContext: z.string(),
  language: z.string(),
  duration: z.string(),
  productionProfile: z.string().optional(),
  platform: z.string().optional(),
  experienceHints: z.array(z.string()).optional(),
  experienceConstraints: z.array(z.string()).optional(),
  additionalOutputNotes: z.string().optional(),
});

export type FullyStructuredRequest = z.infer<typeof FullyStructuredRequestSchema>;

/** Any of the three supported request forms. */
export const LearningRequestSchema = z.discriminatedUnion("form", [
  NaturalLanguageRequestSchema,
  PartialStructuredRequestSchema,
  FullyStructuredRequestSchema,
]);

export type LearningRequest = z.infer<typeof LearningRequestSchema>;

/**
 * Trusted host metadata supplied by the API layer, not by the learner.
 * Architecture §7.2
 */
export const InitiatorMetadataSchema = z.object({
  requestSource: z.string(),
  timestamp: z.string().datetime(),
  correlationId: z.string().optional(),
  initiatorId: z.string().optional(),
});

export type InitiatorMetadata = z.infer<typeof InitiatorMetadataSchema>;

/** POST /api/v2/executions — full inbound envelope. */
export const CreateExecutionRequestSchema = z.object({
  request: LearningRequestSchema,
  initiatorMetadata: InitiatorMetadataSchema,
});

export type CreateExecutionRequest = z.infer<typeof CreateExecutionRequestSchema>;

/** POST /api/v2/executions — response. */
export const CreateExecutionResponseSchema = z.object({
  executionId: z.string(),
  status: PublicExecutionStatusSchema,
  clarificationRequired: z.boolean(),
  statusResourceUrl: z.string().url(),
  eventsResourceUrl: z.string().url(),
  outcomesResourceUrl: z.string().url(),
});

export type CreateExecutionResponse = z.infer<typeof CreateExecutionResponseSchema>;

// ---------------------------------------------------------------------------
// Clarification (POST /api/v2/executions/{id}/clarifications)
// ---------------------------------------------------------------------------

/**
 * A single clarification field requested by Runtime.
 * Only mandatory information that cannot be safely inferred is ever requested.
 */
export const ClarificationFieldSchema = z.object({
  fieldKey: z.string(),
  label: z.string(),
  description: z.string(),
  required: z.literal(true),
});

export type ClarificationField = z.infer<typeof ClarificationFieldSchema>;

/** What Runtime tells the learner it needs. */
export const ClarificationRequirementSchema = z.object({
  executionId: z.string(),
  requestedFields: z.array(ClarificationFieldSchema).min(1),
  message: z.string(),
});

export type ClarificationRequirement = z.infer<typeof ClarificationRequirementSchema>;

/** What the learner sends back. Answers only Runtime-requested fields. */
export const SubmitClarificationRequestSchema = z.object({
  answers: z.record(z.string(), z.string()),
});

export type SubmitClarificationRequest = z.infer<typeof SubmitClarificationRequestSchema>;

/** Response after submitting clarification. */
export const SubmitClarificationResponseSchema = z.object({
  executionId: z.string(),
  status: PublicExecutionStatusSchema,
  remainingClarification: ClarificationRequirementSchema.optional(),
});

export type SubmitClarificationResponse = z.infer<typeof SubmitClarificationResponseSchema>;

// ---------------------------------------------------------------------------
// Get Execution (GET /api/v2/executions/{id})
// ---------------------------------------------------------------------------

/** Current learner-safe progress descriptor. */
export const ProgressDescriptorSchema = z.object({
  stage: ProgressStageSchema,
  message: z.string(),
  /** Optional; must reflect real state, not elapsed-time guessing. */
  percentComplete: z.number().int().min(0).max(100).optional(),
});

export type ProgressDescriptor = z.infer<typeof ProgressDescriptorSchema>;

/** GET /api/v2/executions/{id} — response. */
export const GetExecutionResponseSchema = z.object({
  executionId: z.string(),
  status: PublicExecutionStatusSchema,
  progress: ProgressDescriptorSchema.optional(),
  clarificationRequired: ClarificationRequirementSchema.optional(),
  outcomesAvailable: z.boolean(),
  failureInfo: z
    .object({
      category: FailureCategorySchema,
      message: z.string(),
      requiresNewRequest: z.boolean(),
    })
    .optional(),
});

export type GetExecutionResponse = z.infer<typeof GetExecutionResponseSchema>;

// ---------------------------------------------------------------------------
// Progress Events (GET /api/v2/executions/{id}/events)
// ---------------------------------------------------------------------------

/** A single learner-safe progress event. Architecture §7.5 */
export const ProgressEventSchema = z.object({
  executionId: z.string(),
  stage: ProgressStageSchema,
  message: z.string(),
  timestamp: z.string().datetime(),
  percentComplete: z.number().int().min(0).max(100).optional(),
});

export type ProgressEvent = z.infer<typeof ProgressEventSchema>;

/** The events resource response. */
export const ProgressEventsResponseSchema = z.object({
  executionId: z.string(),
  events: z.array(ProgressEventSchema),
});

export type ProgressEventsResponse = z.infer<typeof ProgressEventsResponseSchema>;

// ---------------------------------------------------------------------------
// Finalized Outcomes (GET /api/v2/executions/{id}/outcomes)
// ---------------------------------------------------------------------------

/**
 * Execution metadata safe for the learner.
 * Excludes: provider details, prompt versions, revision counts, Q-scores.
 */
export const PublicExecutionMetadataSchema = z.object({
  executionId: z.string(),
  studioFormat: StudioFormatSchema,
  completedAt: z.string().datetime(),
  architectureVersion: z.literal("2.0.0"),
  cklisVersion: z.string(),
});

export type PublicExecutionMetadata = z.infer<typeof PublicExecutionMetadataSchema>;

/**
 * Failure response contract. Architecture §7.7
 *
 * Excluded: stack traces, prompts, provider errors, Quality reports, internal
 * artifacts, credentials, and Audit Log details.
 */
export const FailureResponseSchema = z.object({
  executionId: z.string(),
  category: FailureCategorySchema,
  message: z.string(),
  requiresNewRequest: z.boolean(),
});

export type FailureResponse = z.infer<typeof FailureResponseSchema>;

// ---------------------------------------------------------------------------
// Field-name allow-list for prohibited-field enforcement
// ---------------------------------------------------------------------------

/**
 * Names that must NEVER appear as top-level keys in any public API response schema.
 * This list is used by contract tests to assert absence.
 */
export const PROHIBITED_PUBLIC_FIELD_NAMES = [
  // RuntimeContext internals
  "runtimeContext",
  "lesState",
  "candidateLes",
  "runtimeDecisions",
  "artifactGraph",
  "qualityState",
  "revisionState",
  "finalizationState",
  // Internal execution states
  "internalState",
  "PIPELINE_RUNNING",
  "PIPELINE_REVISING",
  "PIPELINE_APPROVED",
  "STUDIO_RUNNING",
  "STUDIO_REVISING",
  "STUDIO_APPROVED",
  "RESOLVING_LES",
  "AWAITING_CLARIFICATION",
  "DESTROYED",
  // Q-levels
  "q0",
  "q1",
  "q2",
  "Q0",
  "Q1",
  "Q2",
  "qualityReport",
  "dimensionScores",
  "failureClassifications",
  "structuredFeedback",
  // Prompts and providers
  "promptText",
  "promptAssembly",
  "providerName",
  "providerModel",
  "providerCredentials",
  "rawProviderResponse",
  // Audit and revisions
  "auditLog",
  "revisionHistory",
  "supersededRevisions",
  "attemptCount",
  "retryCount",
  "privateQualityReport",
] as const;

export type ProhibitedPublicFieldName =
  (typeof PROHIBITED_PUBLIC_FIELD_NAMES)[number];
