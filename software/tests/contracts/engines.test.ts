/**
 * M01 contract tests — Engine envelopes and bounded-context views.
 * Architecture §6.1–6.2. Engines receive only their authorized view and return
 * only their authorized artifact.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  EngineInputEnvelopeSchema,
  EngineResultEnvelopeSchema,
  MisconceptionContextViewSchema,
  MisconceptionProfileSchema,
  MentalModelContextViewSchema,
  EpisodeSpecificationSchema,
} from "@cklis/contracts/engines";

const iso = "2026-07-27T00:00:00.000Z";

describe("Generic engine input envelope factory", () => {
  const schema = EngineInputEnvelopeSchema(MisconceptionContextViewSchema);

  it("accepts a valid input envelope for the misconception engine", () => {
    const parsed = schema.safeParse({
      executionIdentity: {
        executionId: "exec-1",
        attemptNumber: 1,
        runtimeVersion: "1.0.0",
        cklisVersion: "2.0.0",
        architectureVersion: "2.0.0",
      },
      engineIdentity: { engineName: "MisconceptionEngine", engineVersion: "1.0.0", contractVersion: "1.0.0" },
      contextView: {
        resolvedLes: {
          educationalIntent: "Learn recursion",
          resolvedStudioFormat: "comic",
          resolvedAudience: "beginner",
          resolvedEducationalContext: "everyday life",
          resolvedLanguage: "en",
          experienceHints: [],
          experienceConstraints: [],
          wasNaturalLanguage: true,
          inferredFields: [],
        },
        primaryLearningObjective: "Explain recursion",
        resolvedAudience: "beginner",
        priorKnowledge: [],
        relevantConstraints: [],
      },
      upstreamArtifacts: [],
      objectiveAndLearner: {
        primaryLearningObjective: "Explain recursion",
        resolvedAudience: "beginner",
        priorKnowledge: [],
        relevantConstraints: [],
        resolvedLanguage: "en",
      },
      outputSchemaVersion: "1.0.0",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an input envelope missing the engine identity", () => {
    const parsed = schema.safeParse({ outputSchemaVersion: "1.0.0" });
    expect(parsed.success).toBe(false);
  });
});

describe("Generic engine result envelope factory", () => {
  const schema = EngineResultEnvelopeSchema(MisconceptionProfileSchema);

  it("accepts a valid result envelope carrying a misconception profile", () => {
    const parsed = schema.safeParse({
      producerName: "MisconceptionEngine",
      producerVersion: "1.0.0",
      artifactId: "a1",
      artifactType: "misconception_profile",
      revisionId: "a1-r1",
      revisionNumber: 1,
      result: {
        profileId: "mp1",
        primaryLearningObjective: "Explain recursion",
        audience: "beginner",
        misconceptions: [
          {
            misconceptionId: "m1",
            description: "recursion is a loop",
            priority: "high",
            causes: [],
            risks: [],
            correctionStrategy: "contrast with call stack",
            targetAudienceRelevance: "high",
          },
        ],
        overallCorrectionApproach: "call-stack model",
      },
      upstreamReferences: [],
      validationEvidence: ["schema validated"],
      findings: { blocking: [], nonBlocking: [] },
      completionStatus: "completed",
      executionMetadata: { attemptNumber: 1, startedAt: iso, completedAt: iso },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an unknown completion status", () => {
    const parsed = schema.safeParse({
      producerName: "X",
      producerVersion: "1.0.0",
      artifactId: "a1",
      artifactType: "misconception_profile",
      revisionId: "r1",
      revisionNumber: 1,
      result: {},
      upstreamReferences: [],
      validationEvidence: [],
      findings: { blocking: [], nonBlocking: [] },
      completionStatus: "maybe",
      executionMetadata: { attemptNumber: 1, startedAt: iso, completedAt: iso },
    });
    expect(parsed.success).toBe(false);
  });
});

describe("Bounded-context view scoping", () => {
  it("Misconception view does not expose downstream artifacts", () => {
    const keys = Object.keys((MisconceptionContextViewSchema as z.ZodObject<any>).shape);
    expect(keys).not.toContain("approvedMentalModel");
    expect(keys).not.toContain("approvedScenario");
  });

  it("Mental Model view exposes the approved misconception profile but not scenario", () => {
    const keys = Object.keys((MentalModelContextViewSchema as z.ZodObject<any>).shape);
    expect(keys).toContain("approvedMisconceptionProfile");
    expect(keys).not.toContain("approvedScenario");
  });

  it("Episode Specification is platform- and studio-format-neutral", () => {
    const shape = (EpisodeSpecificationSchema as z.ZodObject<any>).shape;
    expect(shape.platformNeutral).toBeDefined();
    expect(shape.studioFormatNeutral).toBeDefined();
  });
});
