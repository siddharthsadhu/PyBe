/**
 * CKLIS Version 2 — Engine Contracts
 *
 * Defines the common engine input/result envelopes and the five bounded-context
 * view contracts for each educational engine.
 *
 * Architecture reference: Section 6 of Software Architecture.md
 *
 * Engine invariants (Architecture §1.4, §2.1):
 *   - Engine execution order is fixed: Misconception → Mental Model → Scenario
 *     → Pattern Mapping → Episode Generation.
 *   - Engines do not orchestrate one another. Direct engine-to-engine invocation
 *     is PROHIBITED.
 *   - Each engine receives only its authorized bounded-context view.
 *   - Each engine returns only its authorized output artifact.
 *   - Quality independently gates each engine stage.
 *   - Only Q3-approved results are merged into the artifact graph.
 */

import { z } from "zod";
import { ArtifactTypeSchema, QLevelSchema, UpstreamRevisionReferenceSchema } from "../artifacts/index.js";
import { ResolvedLesSchema } from "../les/index.js";

// ---------------------------------------------------------------------------
// Engine Identity
// ---------------------------------------------------------------------------

export const EngineIdentitySchema = z.object({
  engineName: z.string(),
  engineVersion: z.string(),
  contractVersion: z.string(),
});
export type EngineIdentity = z.infer<typeof EngineIdentitySchema>;

// ---------------------------------------------------------------------------
// Execution Identity View (subset available to engines — never the full context)
// ---------------------------------------------------------------------------

/**
 * The minimal execution context view available to all engines.
 * Engines receive ONLY this view, not the full RuntimeContext.
 * Architecture §4.3
 */
export const EngineExecutionIdentityViewSchema = z.object({
  executionId: z.string(),
  attemptNumber: z.number().int().min(1),
  runtimeVersion: z.string(),
  cklisVersion: z.string(),
  architectureVersion: z.literal("2.0.0"),
});
export type EngineExecutionIdentityView = z.infer<typeof EngineExecutionIdentityViewSchema>;

// ---------------------------------------------------------------------------
// Objective and Learner Assumptions View
// ---------------------------------------------------------------------------

/**
 * Resolved educational objective and learner profile, available to all engines.
 */
export const ObjectiveAndLearnerViewSchema = z.object({
  primaryLearningObjective: z.string(),
  resolvedAudience: z.string(),
  resolvedDifficulty: z.string().optional(),
  priorKnowledge: z.array(z.string()),
  relevantConstraints: z.array(z.string()),
  resolvedLanguage: z.string(),
});
export type ObjectiveAndLearnerView = z.infer<typeof ObjectiveAndLearnerViewSchema>;

// ---------------------------------------------------------------------------
// Engine Completion Status
// ---------------------------------------------------------------------------

export const ENGINE_COMPLETION_STATUS_VALUES = [
  "completed",
  "revision_required",
  "failed",
] as const;
export const EngineCompletionStatusSchema = z.enum(ENGINE_COMPLETION_STATUS_VALUES);
export type EngineCompletionStatus = z.infer<typeof EngineCompletionStatusSchema>;

// ---------------------------------------------------------------------------
// Generic Engine Input Envelope (Architecture §6.1)
// ---------------------------------------------------------------------------

/**
 * The standard input envelope every engine receives.
 * TContextView is the engine-specific bounded read-only context view.
 *
 * Architecture §6.1:
 *   - Execution identity (current execution, attempt, Runtime + spec versions)
 *   - Engine identity (engine name + contract version)
 *   - Context view (read-only fields authorized for this engine)
 *   - Upstream artifacts (exact current approved revisions required)
 *   - Objective and learner assumptions
 *   - Revision feedback (when applicable)
 *   - Output schema (required structured artifact contract)
 */
export const EngineInputEnvelopeSchema = <TContextView extends z.ZodTypeAny>(
  contextViewSchema: TContextView
) =>
  z.object({
    executionIdentity: EngineExecutionIdentityViewSchema,
    engineIdentity: EngineIdentitySchema,
    contextView: contextViewSchema,
    upstreamArtifacts: z.array(
      z.object({
        artifactType: ArtifactTypeSchema,
        revisionId: z.string(),
        content: z.unknown(),
      })
    ),
    objectiveAndLearner: ObjectiveAndLearnerViewSchema,
    revisionFeedback: z
      .object({
        feedbackId: z.string(),
        revisionGuidance: z.string(),
        blockingFindingDescriptions: z.array(z.string()),
      })
      .optional(),
    outputSchemaVersion: z.string(),
  });

export type EngineInputEnvelope<TContextView> = {
  executionIdentity: EngineExecutionIdentityView;
  engineIdentity: EngineIdentity;
  contextView: TContextView;
  upstreamArtifacts: Array<{
    artifactType: ArtifactType;
    revisionId: string;
    content: unknown;
  }>;
  objectiveAndLearner: ObjectiveAndLearnerView;
  revisionFeedback?: {
    feedbackId: string;
    revisionGuidance: string;
    blockingFindingDescriptions: string[];
  };
  outputSchemaVersion: string;
};

import type { ArtifactType } from "../artifacts/index.js";

// ---------------------------------------------------------------------------
// Generic Engine Result Envelope (Architecture §6.1)
// ---------------------------------------------------------------------------

/**
 * The standard result envelope every engine returns.
 *
 * Architecture §6.1:
 *   - Producer (engine name + version)
 *   - Artifact identity (ID, type, revision)
 *   - Structured result
 *   - Upstream references (exact revisions consumed)
 *   - Validation evidence
 *   - Findings (blocking + nonblocking)
 *   - Completion status
 *   - Execution metadata (attempt + timing)
 *
 * Runtime rejects any result with missing required fields, unauthorized scope,
 * invalid references, or incompatible schema before merge.
 */
export const EngineResultEnvelopeSchema = <TResult extends z.ZodTypeAny>(
  resultSchema: TResult
) =>
  z.object({
    producerName: z.string(),
    producerVersion: z.string(),
    artifactId: z.string(),
    artifactType: ArtifactTypeSchema,
    revisionId: z.string(),
    revisionNumber: z.number().int().min(1),
    result: resultSchema,
    upstreamReferences: z.array(UpstreamRevisionReferenceSchema),
    validationEvidence: z.array(z.string()),
    findings: z.object({
      blocking: z.array(z.string()),
      nonBlocking: z.array(z.string()),
    }),
    completionStatus: EngineCompletionStatusSchema,
    executionMetadata: z.object({
      attemptNumber: z.number().int().min(1),
      startedAt: z.string().datetime(),
      completedAt: z.string().datetime(),
    }),
  });

export type EngineResultEnvelope<TResult> = {
  producerName: string;
  producerVersion: string;
  artifactId: string;
  artifactType: ArtifactType;
  revisionId: string;
  revisionNumber: number;
  result: TResult;
  upstreamReferences: UpstreamRevisionReference[];
  validationEvidence: string[];
  findings: { blocking: string[]; nonBlocking: string[] };
  completionStatus: EngineCompletionStatus;
  executionMetadata: { attemptNumber: number; startedAt: string; completedAt: string };
};

import type { UpstreamRevisionReference } from "../artifacts/index.js";

// ---------------------------------------------------------------------------
// Engine 1: Misconception Engine Bounded Context View (Architecture §6.2)
// ---------------------------------------------------------------------------

/**
 * Read-only bounded context view for the Misconception Engine.
 *
 * AUTHORIZED: Resolved LES, objective, audience, prerequisites
 * PROHIBITED OUTPUT: Lesson, scenario, representation, final artifact
 */
export const MisconceptionContextViewSchema = z.object({
  resolvedLes: ResolvedLesSchema,
  primaryLearningObjective: z.string(),
  resolvedAudience: z.string(),
  priorKnowledge: z.array(z.string()),
  relevantConstraints: z.array(z.string()),
});
export type MisconceptionContextView = z.infer<typeof MisconceptionContextViewSchema>;

/**
 * Output artifact schema for Misconception Engine.
 * Architecture §6.2: "Prioritized Misconception Profile, causes, risks, correction strategies"
 */
export const MisconceptionItemSchema = z.object({
  misconceptionId: z.string(),
  description: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  causes: z.array(z.string()),
  risks: z.array(z.string()),
  correctionStrategy: z.string(),
  targetAudienceRelevance: z.string(),
});

export const MisconceptionProfileSchema = z.object({
  profileId: z.string(),
  primaryLearningObjective: z.string(),
  audience: z.string(),
  misconceptions: z.array(MisconceptionItemSchema).min(1),
  overallCorrectionApproach: z.string(),
});
export type MisconceptionProfile = z.infer<typeof MisconceptionProfileSchema>;

// ---------------------------------------------------------------------------
// Engine 2: Mental Model Engine Bounded Context View (Architecture §6.2)
// ---------------------------------------------------------------------------

/**
 * Read-only bounded context view for the Mental Model Engine.
 *
 * AUTHORIZED: Objective, audience, prerequisites, approved Misconception Profile
 * PROHIBITED OUTPUT: Scenario, episode, production artifact
 */
export const MentalModelContextViewSchema = z.object({
  primaryLearningObjective: z.string(),
  resolvedAudience: z.string(),
  priorKnowledge: z.array(z.string()),
  approvedMisconceptionProfile: MisconceptionProfileSchema,
});
export type MentalModelContextView = z.infer<typeof MentalModelContextViewSchema>;

/**
 * Output artifact schema for Mental Model Engine.
 * Architecture §6.2: "entities, relationships, rules, behaviors, analogies/visualization"
 */
export const MentalModelEntitySchema = z.object({
  entityId: z.string(),
  name: z.string(),
  description: z.string(),
  properties: z.array(z.string()),
});

export const MentalModelRelationshipSchema = z.object({
  relationshipId: z.string(),
  fromEntityId: z.string(),
  toEntityId: z.string(),
  type: z.string(),
  description: z.string(),
});

export const MentalModelSpecificationSchema = z.object({
  modelId: z.string(),
  primaryLearningObjective: z.string(),
  entities: z.array(MentalModelEntitySchema).min(1),
  relationships: z.array(MentalModelRelationshipSchema),
  rules: z.array(z.string()),
  behaviors: z.array(z.string()),
  analogiesAndVisualizations: z.array(z.string()),
  misconceptionsCovered: z.array(z.string()),
});
export type MentalModelSpecification = z.infer<typeof MentalModelSpecificationSchema>;

// ---------------------------------------------------------------------------
// Engine 3: Scenario Intelligence Engine Bounded Context View (Architecture §6.2)
// ---------------------------------------------------------------------------

/**
 * Read-only bounded context view for the Scenario Intelligence Engine.
 *
 * AUTHORIZED: Objective, audience, approved Mental Model, educational Context preference
 * PROHIBITED OUTPUT: Complete episode, Studio decisions
 */
export const ScenarioIntelligenceContextViewSchema = z.object({
  primaryLearningObjective: z.string(),
  resolvedAudience: z.string(),
  educationalContextPreference: z.string(),
  approvedMentalModel: MentalModelSpecificationSchema,
  relevantConstraints: z.array(z.string()),
});
export type ScenarioIntelligenceContextView = z.infer<typeof ScenarioIntelligenceContextViewSchema>;

/**
 * Output artifact schema for Scenario Intelligence Engine.
 * Architecture §6.2: "Scenario Specification with observable events and educational mapping"
 */
export const ScenarioEventSchema = z.object({
  eventId: z.string(),
  description: z.string(),
  educationalMapping: z.string(),
  mentaModelEntityIds: z.array(z.string()),
});

export const ScenarioSpecificationSchema = z.object({
  scenarioId: z.string(),
  scenarioName: z.string(),
  educationalContext: z.string(),
  contextSelectionRationale: z.string(),
  observableEvents: z.array(ScenarioEventSchema).min(1),
  educationalMapping: z.string(),
  audienceAppropriateness: z.string(),
  preservesMentalModel: z.literal(true),
});
export type ScenarioSpecification = z.infer<typeof ScenarioSpecificationSchema>;

// ---------------------------------------------------------------------------
// Engine 4: Pattern Mapping Engine Bounded Context View (Architecture §6.2)
// ---------------------------------------------------------------------------

/**
 * Read-only bounded context view for the Pattern Mapping Engine.
 *
 * AUTHORIZED: Approved Mental Model and Scenario, objective, audience
 * PROHIBITED OUTPUT: New scenario, lesson, representation choice
 */
export const PatternMappingContextViewSchema = z.object({
  primaryLearningObjective: z.string(),
  resolvedAudience: z.string(),
  approvedMentalModel: MentalModelSpecificationSchema,
  approvedScenario: ScenarioSpecificationSchema,
});
export type PatternMappingContextView = z.infer<typeof PatternMappingContextViewSchema>;

/**
 * Output artifact schema for Pattern Mapping Engine.
 * Architecture §6.2: "connecting observable, abstract, and programming patterns"
 */
export const PatternMappingSpecificationSchema = z.object({
  mappingId: z.string(),
  observablePatterns: z.array(
    z.object({
      patternId: z.string(),
      description: z.string(),
      sourceScenarioEventIds: z.array(z.string()),
    })
  ),
  abstractPatterns: z.array(
    z.object({
      patternId: z.string(),
      description: z.string(),
      linkedObservablePatternIds: z.array(z.string()),
    })
  ),
  programmingPatterns: z.array(
    z.object({
      patternId: z.string(),
      description: z.string(),
      linkedAbstractPatternIds: z.array(z.string()),
      transferOpportunities: z.array(z.string()),
    })
  ),
  generalizationRules: z.array(z.string()),
  transferOpportunities: z.array(z.string()),
});
export type PatternMappingSpecification = z.infer<typeof PatternMappingSpecificationSchema>;

// ---------------------------------------------------------------------------
// Engine 5: Episode Generation Engine Bounded Context View (Architecture §6.2)
// ---------------------------------------------------------------------------

/**
 * Read-only bounded context view for the Episode Generation Engine.
 *
 * AUTHORIZED: All approved educational artifacts and duration constraints
 * PROHIBITED OUTPUT: Changing upstream educational decisions or selecting Studio format
 */
export const EpisodeGenerationContextViewSchema = z.object({
  primaryLearningObjective: z.string(),
  resolvedAudience: z.string(),
  resolvedDuration: z.string().optional(),
  approvedMisconceptionProfile: MisconceptionProfileSchema,
  approvedMentalModel: MentalModelSpecificationSchema,
  approvedScenario: ScenarioSpecificationSchema,
  approvedPatternMapping: PatternMappingSpecificationSchema,
  relevantConstraints: z.array(z.string()),
});
export type EpisodeGenerationContextView = z.infer<typeof EpisodeGenerationContextViewSchema>;

/**
 * Output artifact schema for Episode Generation Engine.
 * Architecture §6.2: "Platform-neutral Episode Specification with progression,
 * transitions, practice, assessment, reflection"
 */
export const EpisodeStageSchema = z.object({
  stageId: z.string(),
  stageType: z.enum(["introduction", "concept_exploration", "practice", "assessment", "reflection", "transfer"]),
  description: z.string(),
  educationalPurpose: z.string(),
  transitionTo: z.string().optional(),
  durationHint: z.string().optional(),
});

export const EpisodeSpecificationSchema = z.object({
  episodeId: z.string(),
  primaryLearningObjective: z.string(),
  stages: z.array(EpisodeStageSchema).min(3),
  progressionRationale: z.string(),
  practiceActivities: z.array(
    z.object({
      activityId: z.string(),
      description: z.string(),
      linkedMisconceptions: z.array(z.string()),
    })
  ),
  assessmentCriteria: z.array(z.string()),
  reflectionPrompts: z.array(z.string()),
  successCriteria: z.array(z.string()),
  platformNeutral: z.literal(true),
  studioFormatNeutral: z.literal(true),
});
export type EpisodeSpecification = z.infer<typeof EpisodeSpecificationSchema>;
