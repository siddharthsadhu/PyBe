/**
 * M01 contract tests — Artifact identity, revision, Q-level, dependency order.
 * Architecture §9.1–9.5.
 */
import { describe, it, expect } from "vitest";
import {
  ARTIFACT_TYPE_VALUES,
  ARTIFACT_DEPENDENCY_ORDER,
  ArtifactRevisionSchema,
  isDeliverable,
  requiresRevision,
  downstreamArtifactTypes,
  artifactDependencyIndex,
} from "@cklis/contracts/artifacts";

describe("Artifact types and dependency order", () => {
  it("declares the seven artifact types", () => {
    expect(ARTIFACT_TYPE_VALUES).toHaveLength(7);
  });

  it("orders the dependency chain from misconception to studio outcome", () => {
    expect(ARTIFACT_DEPENDENCY_ORDER[0]).toBe("misconception_profile");
    expect(ARTIFACT_DEPENDENCY_ORDER[ARTIFACT_DEPENDENCY_ORDER.length - 1]).toBe("studio_outcome");
    expect(artifactDependencyIndex("mental_model_specification")).toBe(1);
  });

  it("computes downstream artifacts for invalidation", () => {
    expect(downstreamArtifactTypes("scenario_specification")).toEqual([
      "pattern_mapping_specification",
      "episode_specification",
      "pipeline_outcome",
      "studio_outcome",
    ]);
    expect(downstreamArtifactTypes("studio_outcome")).toEqual([]);
  });
});

describe("Q-level semantics (Q3-only advances)", () => {
  it("treats only Q3 as deliverable", () => {
    expect(isDeliverable("Q3")).toBe(true);
    expect(isDeliverable("Q0")).toBe(false);
    expect(isDeliverable("Q1")).toBe(false);
    expect(isDeliverable("Q2")).toBe(false);
  });

  it("requires revision for Q0/Q1/Q2", () => {
    expect(requiresRevision("Q0")).toBe(true);
    expect(requiresRevision("Q2")).toBe(true);
    expect(requiresRevision("Q3")).toBe(false);
  });
});

describe("ArtifactRevision schema", () => {
  it("accepts a well-formed revision carrying full identity", () => {
    const parsed = ArtifactRevisionSchema.safeParse({
      artifactId: "a1",
      artifactType: "misconception_profile",
      revisionId: "a1-r1",
      revisionNumber: 1,
      producerName: "MisconceptionEngine",
      producerVersion: "1.0.0",
      specificationVersionsConsumed: ["03@1.0.0"],
      upstreamRevisionReferences: [],
      status: "q3_approved",
      qLevel: "Q3",
      producedAt: "2026-07-27T00:00:00.000Z",
      content: { anything: true },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a revision number below 1", () => {
    const parsed = ArtifactRevisionSchema.safeParse({
      artifactId: "a1",
      artifactType: "misconception_profile",
      revisionId: "a1-r0",
      revisionNumber: 0,
      producerName: "X",
      producerVersion: "1.0.0",
      specificationVersionsConsumed: [],
      upstreamRevisionReferences: [],
      status: "draft",
      qLevel: "Q0",
      producedAt: "2026-07-27T00:00:00.000Z",
      content: {},
    });
    expect(parsed.success).toBe(false);
  });
});
