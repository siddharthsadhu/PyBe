/**
 * CKLIS Version 2 — Outcome Contracts
 *
 * Defines the Pipeline Outcome, Studio Outcome, and the finalized dual-outcome
 * envelope that is atomically published to learners.
 *
 * Architecture reference: Sections 3.6, 3.7, 3.8, 7.6 of Software Architecture.md
 *
 * KEY INVARIANTS (Architecture §1.4 and §3.8):
 *   1. Both outcomes are published atomically — partial success is never a public state.
 *   2. The Studio Outcome must reference the exact Pipeline Outcome revision it was
 *      derived from (trace linkage constraint).
 *   3. Only Q3-approved revisions may appear in the finalized envelope.
 *   4. Audit Log persistence succeeds before COMPLETED is published.
 *   5. Private prompts, provider data, Quality reports, and revision history are
 *      EXCLUDED from all public outcome schemas.
 */

import { z } from "zod";
import { StudioFormatSchema } from "../public-api/index.js";
import { Q3ApprovalSummarySchema } from "../quality/index.js";
import {
  MisconceptionProfileSchema,
  MentalModelSpecificationSchema,
  ScenarioSpecificationSchema,
  PatternMappingSpecificationSchema,
  EpisodeSpecificationSchema,
} from "../engines/index.js";

// ---------------------------------------------------------------------------
// Generic Production Blueprint
// ---------------------------------------------------------------------------

/**
 * The representation-independent production blueprint included in the Pipeline Outcome.
 * This is the educational blueprint from which any Studio format can be derived.
 * Architecture §3.6
 */
export const GenericProductionBlueprintSchema = z.object({
  blueprintId: z.string(),
  keyConceptsSequence: z.array(z.string()),
  educationalTransitions: z.array(
    z.object({
      fromConcept: z.string(),
      toConcept: z.string(),
      bridgingRationale: z.string(),
    })
  ),
  practiceFramework: z.string(),
  assessmentFramework: z.string(),
  reflectionFramework: z.string(),
});
export type GenericProductionBlueprint = z.infer<typeof GenericProductionBlueprintSchema>;

// ---------------------------------------------------------------------------
// Outcome Traceability
// ---------------------------------------------------------------------------

/**
 * Traceability record for a Pipeline Outcome linking it to all constituent artifacts.
 */
export const OutcomeTraceabilitySchema = z.object({
  resolvedLesReference: z.string(),
  misconceptionProfileRevisionId: z.string(),
  mentalModelRevisionId: z.string(),
  scenarioRevisionId: z.string(),
  patternMappingRevisionId: z.string(),
  episodeRevisionId: z.string(),
  assembledAt: z.string().datetime(),
});
export type OutcomeTraceability = z.infer<typeof OutcomeTraceabilitySchema>;

// ---------------------------------------------------------------------------
// Execution Specification Metadata (safe for learner)
// ---------------------------------------------------------------------------

/**
 * Specification metadata included in the Pipeline Outcome.
 * Excludes: provider details, prompt versions, revision counts, Q-scores.
 */
export const ExecutionSpecMetadataSchema = z.object({
  executionId: z.string(),
  architectureVersion: z.literal("2.0.0"),
  cklisVersion: z.string(),
  ckmsVersion: z.string(),
  assembledAt: z.string().datetime(),
});
export type ExecutionSpecMetadata = z.infer<typeof ExecutionSpecMetadataSchema>;

// ---------------------------------------------------------------------------
// Audience Assumptions (public, safe)
// ---------------------------------------------------------------------------

export const AudienceAssumptionsSchema = z.object({
  resolvedAudience: z.string(),
  assumedPriorKnowledge: z.array(z.string()),
  targetDifficulty: z.string().optional(),
});
export type AudienceAssumptions = z.infer<typeof AudienceAssumptionsSchema>;

// ---------------------------------------------------------------------------
// Pipeline Outcome (Architecture §3.6)
// ---------------------------------------------------------------------------

/**
 * The complete, representation-independent educational blueprint.
 * Assembled from all Q3-approved educational artifact revisions.
 *
 * Architecture §3.6: "Private Quality reports, prompts, raw provider exchanges,
 * hidden reasoning, and revision details are NOT part of the learner-facing
 * Pipeline Outcome."
 *
 * EXCLUDED from this schema:
 *   - Any Q0/Q1/Q2 reports or intermediate revisions
 *   - Prompt text or prompt versions
 *   - Provider identity or raw responses
 *   - Private Quality feedback
 *   - Revision attempt counts
 *   - RuntimeContext fields
 */
export const PipelineOutcomeSchema = z.object({
  /** Stable ID for this Pipeline Outcome across all its revisions. */
  outcomeId: z.string(),
  /** Unique identifier for this specific revision. Referenced by Studio Outcome. */
  revisionId: z.string(),
  revisionNumber: z.number().int().min(1),
  specificationMetadata: ExecutionSpecMetadataSchema,
  resolvedEducationalIntent: z.string(),
  primaryLearningObjective: z.string(),
  audienceAssumptions: AudienceAssumptionsSchema,
  misconceptionProfile: MisconceptionProfileSchema,
  mentalModelSpecification: MentalModelSpecificationSchema,
  scenarioSpecification: ScenarioSpecificationSchema,
  patternMappingSpecification: PatternMappingSpecificationSchema,
  episodeSpecification: EpisodeSpecificationSchema,
  genericProductionBlueprint: GenericProductionBlueprintSchema,
  traceability: OutcomeTraceabilitySchema,
  q3ApprovalSummary: Q3ApprovalSummarySchema,
});
export type PipelineOutcome = z.infer<typeof PipelineOutcomeSchema>;

// ---------------------------------------------------------------------------
// Studio Outcome (Architecture §3.7)
// ---------------------------------------------------------------------------

/**
 * The representation-specific Markdown deliverable derived from a Q3 Pipeline Outcome.
 *
 * Studio processing may adapt:
 *   - Medium-specific structure and formatting
 *   - Pacing within resolved constraints
 *   - Visual, audio, scene, dialogue, and production direction
 *   - Wording and illustrative examples that preserve the approved model
 *
 * Studio MUST NOT change:
 *   - Educational Intent or learning objective
 *   - Misconception coverage and correction strategy
 *   - Mental-model entities, relationships, rules, or behaviors
 *   - Scenario's educational function
 *   - Pattern mapping and transfer logic
 *   - Canonical episode progression
 *   - Practice, assessment, reflection, or success criteria
 */
export const StudioStageTraceSchema = z.object({
  stageId: z.string(),
  stageName: z.string(),
  stageVersion: z.string(),
  completedAt: z.string().datetime(),
});
export type StudioStageTrace = z.infer<typeof StudioStageTraceSchema>;

export const StudioOutcomeSchema = z.object({
  outcomeId: z.string(),
  revisionId: z.string(),
  revisionNumber: z.number().int().min(1),
  executionId: z.string(),
  studioFormat: StudioFormatSchema,
  /**
   * CRITICAL: Must reference the exact Pipeline Outcome revision this was derived from.
   * Enforced by FinalizedOutcomeEnvelope validation.
   */
  sourcePipelineOutcomeRevisionId: z.string(),
  markdownContent: z.string().min(1, "Studio Outcome Markdown content cannot be empty"),
  processorName: z.string(),
  processorVersion: z.string(),
  studioResourceVersionsUsed: z.record(z.string(), z.string()),
  intermediateStageTrace: z.array(StudioStageTraceSchema),
  fidelityEvidence: z.array(z.string()),
  q3ApprovalSummary: Q3ApprovalSummarySchema,
});
export type StudioOutcome = z.infer<typeof StudioOutcomeSchema>;

// ---------------------------------------------------------------------------
// Finalized Outcome Envelope (Architecture §3.8, §7.6)
// ---------------------------------------------------------------------------

/**
 * The immutable, atomically published dual-outcome envelope.
 *
 * ATOMICITY RULE (Architecture §1.4, invariant 14):
 *   Both outcomes are exposed atomically from one finalized outcome envelope.
 *   Partial success is never a public state.
 *
 * TRACE LINKAGE RULE:
 *   studioOutcome.sourcePipelineOutcomeRevisionId must equal
 *   pipelineOutcome.revisionId.
 *
 * Q3 RULE:
 *   Both Pipeline and Studio outcomes must have q3ApprovalSummary.approvalStatus
 *   equal to "q3_approved". Q0/Q1/Q2 outcomes may never be finalized.
 *
 * Architecture §7.6: "Returns one immutable envelope containing:
 *   - Execution metadata safe for the learner
 *   - Complete Pipeline Outcome
 *   - Complete Studio Outcome in Markdown
 *   - Source relationship from Studio Outcome to Pipeline Outcome
 *   - Q3 approval summaries"
 */
export const FinalizedOutcomeEnvelopeSchema = z
  .object({
    envelopeId: z.string(),
    executionId: z.string(),
    executionMetadata: z.object({
      executionId: z.string(),
      studioFormat: StudioFormatSchema,
      completedAt: z.string().datetime(),
      architectureVersion: z.literal("2.0.0"),
      cklisVersion: z.string(),
    }),
    pipelineOutcome: PipelineOutcomeSchema,
    studioOutcome: StudioOutcomeSchema,
    sourceRelationship: z.object({
      studioOutcomeRevisionId: z.string(),
      sourcePipelineOutcomeRevisionId: z.string(),
    }),
    q3ApprovalSummaries: z.object({
      pipeline: Q3ApprovalSummarySchema,
      studio: Q3ApprovalSummarySchema,
    }),
    finalizedAt: z.string().datetime(),
  })
  .refine(
    (data) =>
      data.studioOutcome.sourcePipelineOutcomeRevisionId ===
      data.pipelineOutcome.revisionId,
    {
      message:
        "Studio Outcome source Pipeline revision ID must match the Pipeline Outcome revision ID. " +
        "The Studio Outcome must be derived from the exact Pipeline Outcome revision in this envelope.",
      path: ["studioOutcome", "sourcePipelineOutcomeRevisionId"],
    }
  )
  .refine(
    (data) =>
      data.sourceRelationship.sourcePipelineOutcomeRevisionId ===
      data.pipelineOutcome.revisionId,
    {
      message:
        "sourceRelationship.sourcePipelineOutcomeRevisionId must match pipelineOutcome.revisionId.",
      path: ["sourceRelationship", "sourcePipelineOutcomeRevisionId"],
    }
  )
  .refine(
    (data) =>
      data.sourceRelationship.studioOutcomeRevisionId ===
      data.studioOutcome.revisionId,
    {
      message:
        "sourceRelationship.studioOutcomeRevisionId must match studioOutcome.revisionId.",
      path: ["sourceRelationship", "studioOutcomeRevisionId"],
    }
  );

export type FinalizedOutcomeEnvelope = z.infer<typeof FinalizedOutcomeEnvelopeSchema>;

// ---------------------------------------------------------------------------
// Validation helper: enforce Q3-only outcomes before finalization
// ---------------------------------------------------------------------------

export interface PreFinalizationCheckResult {
  readonly valid: boolean;
  readonly reasons: string[];
}

/**
 * Validates that both outcomes are Q3-approved before finalization.
 * Call this before constructing a FinalizedOutcomeEnvelope.
 * Q0, Q1, and Q2 outcomes MUST be rejected here.
 *
 * Architecture §3.8, invariant 1+2 in the finalization procedure.
 */
export function preFinalizationCheck(
  pipelineQApproval: { approvalStatus: string },
  studioQApproval: { approvalStatus: string }
): PreFinalizationCheckResult {
  const reasons: string[] = [];

  if (pipelineQApproval.approvalStatus !== "q3_approved") {
    reasons.push(
      `Pipeline Outcome approval status is "${pipelineQApproval.approvalStatus}"; ` +
      `only "q3_approved" may be finalized. Q0/Q1/Q2 content is never delivered.`
    );
  }

  if (studioQApproval.approvalStatus !== "q3_approved") {
    reasons.push(
      `Studio Outcome approval status is "${studioQApproval.approvalStatus}"; ` +
      `only "q3_approved" may be finalized. Q0/Q1/Q2 content is never delivered.`
    );
  }

  return { valid: reasons.length === 0, reasons };
}
