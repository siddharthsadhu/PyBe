/**
 * M01 contract tests — Infrastructure port contracts.
 * Architecture §6.6, §9.4. Ten provider-neutral ports; no provider detail leaks.
 */
import { describe, it, expect } from "vitest";
import {
  INFRASTRUCTURE_PORT_NAMES,
  PORT_FAILURE_CATEGORY_VALUES,
  PortFailureSchema,
  AiReasoningRequestSchema,
  PROMPT_RESOURCE_KEY_VALUES,
  PromptResourceKeySchema,
  AuditLogWriteRequestSchema,
} from "@cklis/contracts/ports";

describe("Infrastructure port registry", () => {
  it("declares exactly the ten Version 2 ports", () => {
    expect(INFRASTRUCTURE_PORT_NAMES).toHaveLength(10);
    expect([...INFRASTRUCTURE_PORT_NAMES]).toEqual([
      "AiReasoningPort",
      "KnowledgeResourcePort",
      "PromptResourcePort",
      "ActiveContextPort",
      "FinalOutcomePort",
      "AuditLogPort",
      "ProgressPort",
      "DiagnosticsPort",
      "IdentifierPort",
      "ClockPort",
    ]);
  });
});

describe("Provider-neutral failure model", () => {
  it("enumerates the neutral failure categories", () => {
    expect([...PORT_FAILURE_CATEGORY_VALUES]).toContain("unavailable");
    expect([...PORT_FAILURE_CATEGORY_VALUES]).toContain("conflict");
  });

  it("accepts a well-formed neutral failure", () => {
    const parsed = PortFailureSchema.safeParse({
      category: "timeout",
      message: "capability did not respond within policy",
      retryable: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an unknown failure category", () => {
    const parsed = PortFailureSchema.safeParse({
      category: "http_503",
      message: "raw provider error",
      retryable: true,
    });
    expect(parsed.success).toBe(false);
  });
});

describe("AI Reasoning request (Runtime-composed prompt)", () => {
  it("accepts a bounded reasoning request", () => {
    const parsed = AiReasoningRequestSchema.safeParse({
      requestId: "r1",
      executionId: "exec-1",
      requestingModule: "MisconceptionEngine",
      composedPrompt: "You are ...",
      expectedOutputSchemaId: "misconception_profile@1.0.0",
      controls: { maxOutputTokens: 4096, temperature: 0.2 },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an empty composed prompt", () => {
    const parsed = AiReasoningRequestSchema.safeParse({
      requestId: "r1",
      executionId: "exec-1",
      requestingModule: "MisconceptionEngine",
      composedPrompt: "",
      expectedOutputSchemaId: "x",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("Prompt Resource keys map to the four Studio paths", () => {
  it("declares the six Studio prompt resource keys", () => {
    expect([...PROMPT_RESOURCE_KEY_VALUES]).toEqual([
      "cp1",
      "cp2",
      "one_page_comic",
      "vp1",
      "vp2",
      "audio_podcast",
    ]);
  });

  it("rejects an unknown prompt resource key", () => {
    expect(PromptResourceKeySchema.safeParse("cp3").success).toBe(false);
  });
});

describe("Audit Log write request", () => {
  it("accepts markdown or json format", () => {
    for (const format of ["markdown", "json"] as const) {
      const parsed = AuditLogWriteRequestSchema.safeParse({
        executionId: "exec-1",
        format,
        record: { anything: true },
      });
      expect(parsed.success).toBe(true);
    }
  });

  it("rejects an unsupported audit format", () => {
    const parsed = AuditLogWriteRequestSchema.safeParse({
      executionId: "exec-1",
      format: "xml",
      record: {},
    });
    expect(parsed.success).toBe(false);
  });
});
