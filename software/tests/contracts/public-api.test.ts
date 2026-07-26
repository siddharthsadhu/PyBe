/**
 * M01 contract tests — Public API envelopes and prohibited-field enforcement.
 * Playbook M01 "Tests and failure cases":
 *   - Public contracts do not contain RuntimeContext, Q0/Q1/Q2 levels, provider
 *     names, prompt text, or Audit Log fields.
 *   - LES contract test: unsupported Studio format is safely rejected.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  PUBLIC_EXECUTION_STATUS_VALUES,
  STUDIO_FORMAT_VALUES,
  PROGRESS_STAGE_VALUES,
  FAILURE_CATEGORY_VALUES,
  StudioFormatSchema,
  LearningRequestSchema,
  CreateExecutionRequestSchema,
  CreateExecutionResponseSchema,
  GetExecutionResponseSchema,
  ProgressEventSchema,
  FailureResponseSchema,
  PROHIBITED_PUBLIC_FIELD_NAMES,
} from "@cklis/contracts/public-api";

describe("Public API closed enumerations (frozen invariants)", () => {
  it("has exactly six public execution statuses", () => {
    expect(PUBLIC_EXECUTION_STATUS_VALUES).toHaveLength(6);
    expect([...PUBLIC_EXECUTION_STATUS_VALUES]).toEqual([
      "accepted",
      "awaiting_clarification",
      "running",
      "finalizing",
      "completed",
      "failed",
    ]);
  });

  it("has exactly four Studio formats", () => {
    expect(STUDIO_FORMAT_VALUES).toHaveLength(4);
    expect([...STUDIO_FORMAT_VALUES]).toEqual([
      "comic",
      "one_page_comic",
      "video",
      "audio_podcast",
    ]);
  });

  it("has exactly nine learner-safe progress stages", () => {
    expect(PROGRESS_STAGE_VALUES).toHaveLength(9);
  });

  it("has exactly four learner-safe failure categories", () => {
    expect(FAILURE_CATEGORY_VALUES).toHaveLength(4);
  });
});

describe("Learning request forms", () => {
  it("accepts a valid natural-language request", () => {
    const parsed = LearningRequestSchema.safeParse({
      form: "natural_language",
      request: "Teach me recursion",
      studioFormat: "video",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an unsupported Studio format (safe rejection)", () => {
    const parsed = LearningRequestSchema.safeParse({
      form: "natural_language",
      request: "Teach me recursion",
      studioFormat: "tiktok_dance",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an empty educational intent in a partial-structured request", () => {
    const parsed = LearningRequestSchema.safeParse({
      form: "partial_structured",
      educationalIntent: "",
      studioFormat: "comic",
    });
    expect(parsed.success).toBe(false);
  });

  it("StudioFormatSchema rejects unknown formats directly", () => {
    expect(StudioFormatSchema.safeParse("slides").success).toBe(false);
    expect(StudioFormatSchema.safeParse("audio_podcast").success).toBe(true);
  });

  it("validates a full CreateExecution request envelope", () => {
    const parsed = CreateExecutionRequestSchema.safeParse({
      request: {
        form: "partial_structured",
        educationalIntent: "Understand SQL joins",
        studioFormat: "one_page_comic",
      },
      initiatorMetadata: {
        requestSource: "web",
        timestamp: "2026-07-27T00:00:00.000Z",
      },
    });
    expect(parsed.success).toBe(true);
  });
});

/**
 * Recursively collect all object property keys declared anywhere in a Zod schema.
 * Used to assert prohibited internal field names never appear in public schemas.
 */
function collectKeys(schema: z.ZodTypeAny, seen = new Set<z.ZodTypeAny>()): string[] {
  if (seen.has(schema)) return [];
  seen.add(schema);
  const def: any = (schema as any)._def;
  const keys: string[] = [];
  if (def?.typeName === "ZodObject") {
    const shape = def.shape();
    for (const [k, v] of Object.entries(shape)) {
      keys.push(k);
      keys.push(...collectKeys(v as z.ZodTypeAny, seen));
    }
  } else if (def?.typeName === "ZodOptional" || def?.typeName === "ZodNullable") {
    keys.push(...collectKeys(def.innerType, seen));
  } else if (def?.typeName === "ZodArray") {
    keys.push(...collectKeys(def.type, seen));
  } else if (def?.typeName === "ZodUnion" || def?.typeName === "ZodDiscriminatedUnion") {
    const opts = def.options ?? [];
    for (const o of opts) keys.push(...collectKeys(o as z.ZodTypeAny, seen));
  } else if (def?.typeName === "ZodEffects") {
    keys.push(...collectKeys(def.schema, seen));
  }
  return keys;
}

describe("Prohibited-field enforcement on public response schemas", () => {
  const publicSchemas: Array<[string, z.ZodTypeAny]> = [
    ["CreateExecutionResponse", CreateExecutionResponseSchema],
    ["GetExecutionResponse", GetExecutionResponseSchema],
    ["ProgressEvent", ProgressEventSchema],
    ["FailureResponse", FailureResponseSchema],
  ];

  for (const [name, schema] of publicSchemas) {
    it(`${name} contains no prohibited internal field names`, () => {
      const keys = new Set(collectKeys(schema).map((k) => k.toLowerCase()));
      const leaked = PROHIBITED_PUBLIC_FIELD_NAMES.filter((p) =>
        keys.has(p.toLowerCase())
      );
      expect(leaked).toEqual([]);
    });
  }

  it("prohibited list itself covers the key internal categories", () => {
    const lower = PROHIBITED_PUBLIC_FIELD_NAMES.map((s) => s.toLowerCase());
    expect(lower).toContain("runtimecontext");
    expect(lower).toContain("qualityreport");
    expect(lower).toContain("prompttext");
    expect(lower).toContain("auditlog");
    expect(lower).toContain("q0");
  });
});
