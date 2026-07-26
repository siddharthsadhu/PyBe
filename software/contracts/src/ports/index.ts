/**
 * CKLIS Version 2 — Infrastructure Port Contracts
 *
 * Defines the replaceable capability boundaries between the Runtime/domain layers
 * and concrete infrastructure adapters (ports-and-adapters architecture style).
 *
 * Architecture reference: Sections 6.6, 9.1, 9.4 of Software Architecture.md
 *
 * Dependency rule (Architecture §10.1, §10.4):
 *   - Runtime and domain modules depend ONLY on these port interfaces.
 *   - Concrete infrastructure adapters IMPLEMENT these ports.
 *   - Runtime core must NEVER depend on a concrete provider, storage, transport,
 *     clock, or identifier implementation.
 *
 * Provider-neutrality rule (Architecture §9.4, Playbook §13.5):
 *   - Ports expose provider-NEUTRAL request/result/failure shapes only.
 *   - No provider name, model version, credential, prompt text, or raw provider
 *     response may appear in any port contract.
 *
 * NOTE: These are interface (behavioral) contracts. They are expressed as
 * TypeScript interfaces plus Zod schemas for the data envelopes crossing the
 * boundary. Adapters are implemented in M02 (storage/operational) and M03
 * (AI/knowledge/prompt); no adapter logic lives here.
 */

import { z } from "zod";
import { StudioFormatSchema } from "../public-api/index.js";

// ===========================================================================
// Shared provider-neutral failure model
// ===========================================================================

/**
 * Provider-neutral failure categories. Concrete adapters must translate their
 * own errors (HTTP codes, SDK exceptions, storage faults) into one of these.
 * No raw provider/infrastructure error text may cross a port boundary.
 *
 * Architecture §9.4, Playbook §13.5.
 */
export const PORT_FAILURE_CATEGORY_VALUES = [
  "unavailable", // the underlying capability is temporarily unreachable
  "timeout", // the operation did not complete within policy
  "invalid_request", // the request envelope was structurally invalid
  "not_found", // the requested resource/version does not exist
  "conflict", // atomicity or concurrency conflict (e.g., partial write)
  "capacity_exceeded", // rate/size/quota limits reached
  "internal_error", // adapter-internal fault, details captured via Diagnostics
] as const;

export const PortFailureCategorySchema = z.enum(PORT_FAILURE_CATEGORY_VALUES);
export type PortFailureCategory = z.infer<typeof PortFailureCategorySchema>;

/**
 * A provider-neutral failure envelope. `diagnosticReference` is an opaque key
 * into the Diagnostics adapter; it never carries learner-visible or provider
 * detail directly.
 */
export const PortFailureSchema = z.object({
  category: PortFailureCategorySchema,
  /** Provider-neutral, non-sensitive summary safe for internal logs. */
  message: z.string(),
  /** Opaque reference to the Diagnostics record holding technical detail. */
  diagnosticReference: z.string().optional(),
  retryable: z.boolean(),
});
export type PortFailure = z.infer<typeof PortFailureSchema>;

/**
 * Generic port operation result. Adapters return this discriminated shape so
 * that Runtime handles success and provider-neutral failure uniformly.
 */
export type PortResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly failure: PortFailure };

// ===========================================================================
// 1. AI Reasoning Port  (implemented in M03)
// ===========================================================================

/**
 * Bounded structured-reasoning request assembled by the Runtime. The Runtime
 * composes the authoritative prompt; the adapter transmits it and returns a
 * structured result. The adapter does NOT select engine order, decide retries
 * or Quality, read unrestricted context, or persist educational state.
 *
 * Architecture §6.6 (AI Reasoning Port), §9.4.
 */
export const AiReasoningRequestSchema = z.object({
  /** Correlates the reasoning call to an execution + stage, for diagnostics. */
  requestId: z.string(),
  executionId: z.string(),
  /** The engine/processor this reasoning call serves (internal name). */
  requestingModule: z.string(),
  /** Fully composed, authoritative prompt text (Runtime-owned). */
  composedPrompt: z.string().min(1),
  /** Name/version of the output schema the result must conform to. */
  expectedOutputSchemaId: z.string(),
  /** Bounded generation controls; provider-neutral. */
  controls: z
    .object({
      maxOutputTokens: z.number().int().positive().optional(),
      temperature: z.number().min(0).max(2).optional(),
    })
    .optional(),
});
export type AiReasoningRequest = z.infer<typeof AiReasoningRequestSchema>;

/**
 * Provider-neutral structured result. Raw provider responses, provider identity,
 * and model versions are intentionally excluded.
 */
export const AiReasoningResultSchema = z.object({
  requestId: z.string(),
  /** The structured payload conforming to the requested output schema. */
  structuredOutput: z.unknown(),
  /** Provider-neutral usage counters, if available. Never provider identity. */
  usage: z
    .object({
      inputTokens: z.number().int().nonnegative().optional(),
      outputTokens: z.number().int().nonnegative().optional(),
    })
    .optional(),
});
export type AiReasoningResult = z.infer<typeof AiReasoningResultSchema>;

export interface AiReasoningPort {
  reason(request: AiReasoningRequest): Promise<PortResult<AiReasoningResult>>;
}

// ===========================================================================
// 2. Knowledge Resource Port  (implemented in M03)
// ===========================================================================

/**
 * Read-only, versioned access to official specification documents (00–14,
 * Runtime docs). Runtime pins the version it loads. Adapters never mutate specs.
 *
 * Architecture §6.6 (Knowledge Resource Port), §9.5.
 */
export const KnowledgeResourceRequestSchema = z.object({
  /** Stable resource key (e.g., "01-constitution", "09-quality-engine"). */
  resourceKey: z.string(),
  /** Exact version to load; mismatched versions must fail safely. */
  version: z.string(),
});
export type KnowledgeResourceRequest = z.infer<typeof KnowledgeResourceRequestSchema>;

export const KnowledgeResourceSchema = z.object({
  resourceKey: z.string(),
  version: z.string(),
  /** Read-only document content. */
  content: z.string(),
});
export type KnowledgeResource = z.infer<typeof KnowledgeResourceSchema>;

export interface KnowledgeResourcePort {
  load(request: KnowledgeResourceRequest): Promise<PortResult<KnowledgeResource>>;
}

// ===========================================================================
// 3. Prompt Resource Port  (implemented in M03)
// ===========================================================================

/**
 * Read-only, versioned access to Studio prompt/example resources
 * (CP1, CP2, one-page comic example, VP1, VP2, audio/podcast resource).
 * Immutable during an execution; pinned by version (Playbook §8.5).
 *
 * Architecture §6.6 (Prompt Resource Port).
 */
export const PROMPT_RESOURCE_KEY_VALUES = [
  "cp1",
  "cp2",
  "one_page_comic",
  "vp1",
  "vp2",
  "audio_podcast",
] as const;
export const PromptResourceKeySchema = z.enum(PROMPT_RESOURCE_KEY_VALUES);
export type PromptResourceKey = z.infer<typeof PromptResourceKeySchema>;

export const PromptResourceRequestSchema = z.object({
  resourceKey: PromptResourceKeySchema,
  version: z.string(),
});
export type PromptResourceRequest = z.infer<typeof PromptResourceRequestSchema>;

export const PromptResourceSchema = z.object({
  resourceKey: PromptResourceKeySchema,
  version: z.string(),
  content: z.string(),
});
export type PromptResource = z.infer<typeof PromptResourceSchema>;

export interface PromptResourcePort {
  load(request: PromptResourceRequest): Promise<PortResult<PromptResource>>;
}

// ===========================================================================
// 4. Active Context Port  (implemented in M02)
// ===========================================================================

/**
 * Transient active-execution state support, keyed by execution ID. Supports
 * clarification continuity (same execution ID → same context). Context from one
 * execution is never accessible to another; it is destroyed after finalization.
 *
 * Architecture §6.6 (Active Context Port), §9.3.
 * The stored payload is the internal RuntimeContext, opaque at this boundary.
 */
export const ActiveContextRecordSchema = z.object({
  executionId: z.string(),
  /** Opaque serialized RuntimeContext; shape owned by the runtime-context contract. */
  context: z.unknown(),
  updatedAt: z.string().datetime(),
});
export type ActiveContextRecord = z.infer<typeof ActiveContextRecordSchema>;

export interface ActiveContextPort {
  create(executionId: string, context: unknown): Promise<PortResult<void>>;
  read(executionId: string): Promise<PortResult<ActiveContextRecord>>;
  update(executionId: string, context: unknown): Promise<PortResult<void>>;
  destroy(executionId: string): Promise<PortResult<void>>;
}

// ===========================================================================
// 5. Final Outcome Port  (implemented in M02)
// ===========================================================================

/**
 * Atomic write/read of the finalized dual-outcome envelope. Write is all-or-
 * nothing; read returns nothing (not-found) until a complete envelope is
 * committed. Partial envelopes are never readable.
 *
 * Architecture §6.6 (Final Outcome Port), §3.8, §9.3.
 * The envelope payload conforms to the outcomes contract (opaque here).
 */
export interface FinalOutcomePort {
  /** All-or-nothing persist of the complete finalized envelope. */
  writeAtomic(executionId: string, finalizedEnvelope: unknown): Promise<PortResult<void>>;
  /** Returns not-found until the atomic write for this execution has committed. */
  read(executionId: string): Promise<PortResult<unknown>>;
}

// ===========================================================================
// 6. Audit Log Port  (implemented in M02)
// ===========================================================================

/**
 * Durable, append-only, immutable-after-write developer audit record.
 * Format is Markdown or JSON. Must persist before COMPLETED is published and
 * must survive RuntimeContext destruction. Refuses records containing known
 * prohibited fields (secrets, credentials).
 *
 * Architecture §6.6 (Audit Log Port), §4.6, §14.3–14.4.
 */
export const AUDIT_LOG_FORMAT_VALUES = ["markdown", "json"] as const;
export const AuditLogFormatSchema = z.enum(AUDIT_LOG_FORMAT_VALUES);
export type AuditLogFormat = z.infer<typeof AuditLogFormatSchema>;

export const AuditLogWriteRequestSchema = z.object({
  executionId: z.string(),
  format: AuditLogFormatSchema,
  /** Complete execution record; shape owned by the audit adapter/runtime. */
  record: z.unknown(),
});
export type AuditLogWriteRequest = z.infer<typeof AuditLogWriteRequestSchema>;

export const AuditLogAckSchema = z.object({
  executionId: z.string(),
  persisted: z.literal(true),
  persistedAt: z.string().datetime(),
});
export type AuditLogAck = z.infer<typeof AuditLogAckSchema>;

export interface AuditLogPort {
  /** Durable write; returns an acknowledgement only after persistence succeeds. */
  write(request: AuditLogWriteRequest): Promise<PortResult<AuditLogAck>>;
  read(executionId: string): Promise<PortResult<unknown>>;
}

// ===========================================================================
// 7. Progress Port  (implemented in M02)
// ===========================================================================

/**
 * Publishes learner-safe progress events. The adapter must reject any attempt to
 * publish internal engine names, Q0/Q1/Q2 levels, attempt counts, or revision
 * details — only the nine approved learner-safe stage labels are permitted.
 *
 * Architecture §6.6 (Progress Port), §7.5. The event payload conforms to the
 * public-api ProgressEvent schema (opaque here to keep ports free of public-api
 * response coupling; the adapter validates against it).
 */
export interface ProgressPort {
  publish(executionId: string, learnerSafeEvent: unknown): Promise<PortResult<void>>;
}

// ===========================================================================
// 8. Diagnostics Port  (implemented in M02)
// ===========================================================================

/**
 * Captures technical diagnostics that must never reach learners. Returns a
 * reference other ports can attach to a provider-neutral PortFailure.
 *
 * Architecture §6.6 (Diagnostics Port), §14.2.
 */
export const DiagnosticSeveritySchema = z.enum(["info", "warning", "error"]);
export type DiagnosticSeverity = z.infer<typeof DiagnosticSeveritySchema>;

export const DiagnosticRecordSchema = z.object({
  executionId: z.string().optional(),
  severity: DiagnosticSeveritySchema,
  source: z.string(),
  detail: z.string(),
  occurredAt: z.string().datetime(),
});
export type DiagnosticRecord = z.infer<typeof DiagnosticRecordSchema>;

export interface DiagnosticsPort {
  /** Stores a diagnostic and returns an opaque reference for correlation. */
  capture(record: DiagnosticRecord): Promise<PortResult<{ diagnosticReference: string }>>;
}

// ===========================================================================
// 9. Identifier Port  (implemented in M02)
// ===========================================================================

/**
 * Provider-neutral unique identifier generation. Identifiers must be unique per
 * execution, usable as a correlation key, and must not embed secrets or provider
 * identifiers.
 *
 * Architecture §6.6 (Identifier and Clock Ports).
 */
export interface IdentifierPort {
  newExecutionId(): string;
  newArtifactId(): string;
  newRevisionId(): string;
  /** Generic unique id for other entities (reports, feedback, envelopes). */
  newId(prefix?: string): string;
}

// ===========================================================================
// 10. Clock Port  (implemented in M02)
// ===========================================================================

/**
 * Provider-neutral time source for Audit Log, execution metadata, and progress
 * event timestamps. Isolating the clock keeps domain logic deterministic/testable.
 *
 * Architecture §6.6 (Identifier and Clock Ports).
 */
export interface ClockPort {
  /** Current time as an ISO-8601 datetime string. */
  nowIso(): string;
  /** Current time as epoch milliseconds. */
  nowEpochMs(): number;
}

// ===========================================================================
// Port registry — the complete, closed set of Version 2 infrastructure ports.
// Used by architecture/documentation checks to assert completeness.
// ===========================================================================

export const INFRASTRUCTURE_PORT_NAMES = [
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
] as const;

export type InfrastructurePortName = (typeof INFRASTRUCTURE_PORT_NAMES)[number];

/** Convenience aggregate the Composition Root binds at wiring time. */
export interface InfrastructurePorts {
  readonly aiReasoning: AiReasoningPort;
  readonly knowledgeResource: KnowledgeResourcePort;
  readonly promptResource: PromptResourcePort;
  readonly activeContext: ActiveContextPort;
  readonly finalOutcome: FinalOutcomePort;
  readonly auditLog: AuditLogPort;
  readonly progress: ProgressPort;
  readonly diagnostics: DiagnosticsPort;
  readonly identifier: IdentifierPort;
  readonly clock: ClockPort;
}

// Studio format is re-exported for adapters that need the closed format set.
export { StudioFormatSchema };
