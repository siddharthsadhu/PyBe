/**
 * M01 contract tests — LES request/normalization contracts.
 * Playbook M01 step 4 + failure case: unsupported Studio format safely rejected.
 */
import { describe, it, expect } from "vitest";
import {
  CandidateLesSchema,
  ResolvedLesSchema,
  LesValidationResultSchema,
} from "@cklis/contracts/les";

describe("CandidateLes", () => {
  it("accepts a minimal valid candidate (intent + format)", () => {
    const parsed = CandidateLesSchema.safeParse({
      educationalIntent: "Learn Python loops",
      desiredStudioFormat: "video",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a missing educational intent", () => {
    const parsed = CandidateLesSchema.safeParse({
      educationalIntent: "",
      desiredStudioFormat: "video",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an unsupported Studio format", () => {
    const parsed = CandidateLesSchema.safeParse({
      educationalIntent: "Learn Python loops",
      desiredStudioFormat: "slides",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts the surprise_me educational context", () => {
    const parsed = CandidateLesSchema.safeParse({
      educationalIntent: "Learn recursion",
      desiredStudioFormat: "comic",
      educationalContext: "surprise_me",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("LesValidationResult", () => {
  it("represents a resolved result", () => {
    const resolved = ResolvedLesSchema.parse({
      educationalIntent: "Learn recursion",
      resolvedStudioFormat: "comic",
      resolvedAudience: "beginner",
      resolvedEducationalContext: "everyday life",
      resolvedLanguage: "en",
      experienceHints: [],
      experienceConstraints: [],
      wasNaturalLanguage: true,
      inferredFields: ["resolvedAudience"],
    });
    const parsed = LesValidationResultSchema.safeParse({ resolved: true, resolvedLes: resolved });
    expect(parsed.success).toBe(true);
  });

  it("represents an unresolved result with missing mandatory fields", () => {
    const parsed = LesValidationResultSchema.safeParse({
      resolved: false,
      missingMandatoryFields: ["desiredStudioFormat"],
      clarificationRequired: true,
      validationFindings: ["No supported Studio format provided"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an unresolved result with an empty missing-fields list", () => {
    const parsed = LesValidationResultSchema.safeParse({
      resolved: false,
      missingMandatoryFields: [],
      clarificationRequired: true,
      validationFindings: [],
    });
    expect(parsed.success).toBe(false);
  });
});
