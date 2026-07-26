/**
 * M01 contract tests — Outcomes and finalized dual-outcome envelope.
 * Playbook M01 "Tests and failure cases":
 *   - Finalized outcome envelope test: attempt to build an envelope with a Q2
 *     Studio Outcome; confirm rejection.
 *   - Trace linkage: Studio Outcome must reference the exact Pipeline revision.
 */
import { describe, it, expect } from "vitest";
import {
  preFinalizationCheck,
  FinalizedOutcomeEnvelopeSchema,
} from "@cklis/contracts/outcomes";

const iso = "2026-07-27T00:00:00.000Z";

function pipelineOutcome(revisionId: string) {
  return {
    outcomeId: "po-1",
    revisionId,
    revisionNumber: 1,
    specificationMetadata: {
      executionId: "exec-1",
      architectureVersion: "2.0.0",
      cklisVersion: "2.0.0",
      ckmsVersion: "1.0.0",
      assembledAt: iso,
    },
    resolvedEducationalIntent: "Understand recursion",
    primaryLearningObjective: "Explain how a function calls itself",
    audienceAssumptions: { resolvedAudience: "beginner", assumedPriorKnowledge: [] },
    misconceptionProfile: {
      profileId: "mp-1",
      primaryLearningObjective: "Explain recursion",
      audience: "beginner",
      misconceptions: [
        {
          misconceptionId: "m1",
          description: "Recursion is just a loop",
          priority: "high",
          causes: ["surface similarity"],
          risks: ["wrong base-case reasoning"],
          correctionStrategy: "contrast call stack with iteration",
          targetAudienceRelevance: "high for beginners",
        },
      ],
      overallCorrectionApproach: "call-stack mental model",
    },
    mentalModelSpecification: {
      modelId: "mm-1",
      primaryLearningObjective: "Explain recursion",
      entities: [{ entityId: "e1", name: "Call frame", description: "one invocation", properties: [] }],
      relationships: [],
      rules: ["each call adds a frame"],
      behaviors: ["frames unwind on return"],
      analogiesAndVisualizations: ["nested boxes"],
      misconceptionsCovered: ["m1"],
    },
    scenarioSpecification: {
      scenarioId: "s1",
      scenarioName: "Nested gift boxes",
      educationalContext: "everyday life",
      contextSelectionRationale: "concrete nesting",
      observableEvents: [
        { eventId: "ev1", description: "open a box to find another", educationalMapping: "recursive step", mentaModelEntityIds: ["e1"] },
      ],
      educationalMapping: "boxes -> frames",
      audienceAppropriateness: "beginner-friendly",
      preservesMentalModel: true as const,
    },
    patternMappingSpecification: {
      mappingId: "pm-1",
      observablePatterns: [{ patternId: "op1", description: "open until smallest", sourceScenarioEventIds: ["ev1"] }],
      abstractPatterns: [{ patternId: "ap1", description: "reduce to base case", linkedObservablePatternIds: ["op1"] }],
      programmingPatterns: [{ patternId: "pp1", description: "recursive call + base case", linkedAbstractPatternIds: ["ap1"], transferOpportunities: ["tree traversal"] }],
      generalizationRules: ["always define a base case"],
      transferOpportunities: ["tree traversal"],
    },
    episodeSpecification: {
      episodeId: "ep-1",
      primaryLearningObjective: "Explain recursion",
      stages: [
        { stageId: "st1", stageType: "introduction", description: "hook", educationalPurpose: "engage" },
        { stageId: "st2", stageType: "concept_exploration", description: "boxes", educationalPurpose: "observe" },
        { stageId: "st3", stageType: "reflection", description: "recap", educationalPurpose: "consolidate" },
      ],
      progressionRationale: "concrete to abstract",
      practiceActivities: [{ activityId: "a1", description: "predict output", linkedMisconceptions: ["m1"] }],
      assessmentCriteria: ["identifies base case"],
      reflectionPrompts: ["where else is nesting?"],
      successCriteria: ["predicts recursion depth"],
      platformNeutral: true as const,
      studioFormatNeutral: true as const,
    },
    genericProductionBlueprint: {
      blueprintId: "bp-1",
      keyConceptsSequence: ["base case", "recursive step"],
      educationalTransitions: [{ fromConcept: "base case", toConcept: "recursive step", bridgingRationale: "combine" }],
      practiceFramework: "predict-then-verify",
      assessmentFramework: "concept checks",
      reflectionFramework: "generalization prompts",
    },
    traceability: {
      resolvedLesReference: "les-1",
      misconceptionProfileRevisionId: "mp-r1",
      mentalModelRevisionId: "mm-r1",
      scenarioRevisionId: "s-r1",
      patternMappingRevisionId: "pm-r1",
      episodeRevisionId: "ep-r1",
      assembledAt: iso,
    },
    q3ApprovalSummary: { approvalStatus: "q3_approved" as const, completedAt: iso },
  };
}

function studioOutcome(revisionId: string, sourcePipelineRevisionId: string) {
  return {
    outcomeId: "so-1",
    revisionId,
    revisionNumber: 1,
    executionId: "exec-1",
    studioFormat: "comic" as const,
    sourcePipelineOutcomeRevisionId: sourcePipelineRevisionId,
    markdownContent: "# Recursion comic\n\nPanel 1 ...",
    processorName: "ComicStudioProcessor",
    processorVersion: "1.0.0",
    studioResourceVersionsUsed: { cp1: "1.0.0", cp2: "1.0.0" },
    intermediateStageTrace: [{ stageId: "cp1", stageName: "blueprint", stageVersion: "1.0.0", completedAt: iso }],
    fidelityEvidence: ["preserves mental model entities"],
    q3ApprovalSummary: { approvalStatus: "q3_approved" as const, completedAt: iso },
  };
}

function envelope(pipelineRev: string, studioRev: string, studioSource: string) {
  return {
    envelopeId: "env-1",
    executionId: "exec-1",
    executionMetadata: {
      executionId: "exec-1",
      studioFormat: "comic" as const,
      completedAt: iso,
      architectureVersion: "2.0.0",
      cklisVersion: "2.0.0",
    },
    pipelineOutcome: pipelineOutcome(pipelineRev),
    studioOutcome: studioOutcome(studioRev, studioSource),
    sourceRelationship: {
      studioOutcomeRevisionId: studioRev,
      sourcePipelineOutcomeRevisionId: studioSource,
    },
    q3ApprovalSummaries: {
      pipeline: { approvalStatus: "q3_approved" as const, completedAt: iso },
      studio: { approvalStatus: "q3_approved" as const, completedAt: iso },
    },
    finalizedAt: iso,
  };
}

describe("preFinalizationCheck (Q3-only gate)", () => {
  it("accepts two Q3 approvals", () => {
    const r = preFinalizationCheck({ approvalStatus: "q3_approved" }, { approvalStatus: "q3_approved" });
    expect(r.valid).toBe(true);
    expect(r.reasons).toEqual([]);
  });

  it("rejects a Q2 Studio Outcome", () => {
    const r = preFinalizationCheck({ approvalStatus: "q3_approved" }, { approvalStatus: "q2" });
    expect(r.valid).toBe(false);
    expect(r.reasons.join(" ")).toContain("Studio Outcome");
  });

  it("rejects a Q0 Pipeline Outcome", () => {
    const r = preFinalizationCheck({ approvalStatus: "q0" }, { approvalStatus: "q3_approved" });
    expect(r.valid).toBe(false);
    expect(r.reasons.join(" ")).toContain("Pipeline Outcome");
  });
});

describe("FinalizedOutcomeEnvelope schema", () => {
  it("accepts a well-formed, trace-linked, dual-Q3 envelope", () => {
    const parsed = FinalizedOutcomeEnvelopeSchema.safeParse(envelope("po-rev-1", "so-rev-1", "po-rev-1"));
    expect(parsed.success).toBe(true);
  });

  it("rejects an envelope whose Studio Outcome references the wrong Pipeline revision", () => {
    const parsed = FinalizedOutcomeEnvelopeSchema.safeParse(envelope("po-rev-1", "so-rev-1", "po-rev-WRONG"));
    expect(parsed.success).toBe(false);
  });
});
