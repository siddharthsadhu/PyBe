/**
 * CKLIS Version 2 — Execution State Contracts
 *
 * Defines the internal execution state machine, progress events, clarification
 * envelopes, and error contracts for the Runtime execution lifecycle.
 *
 * Architecture reference: Section 3.2 (Legal execution states) of Software Architecture.md
 *
 * IMPORTANT DISTINCTION:
 *   InternalExecutionState — internal Runtime state machine (never public)
 *   PublicExecutionStatus  — six values exposed through the public API
 *
 * The mapping from internal states to public status is a Runtime responsibility.
 * Clients must never observe internal states.
 */

import { z } from "zod";
import {
  PublicExecutionStatusSchema,
  ProgressStageSchema,
  FailureCategorySchema,
} from "../public-api/index.js";

export {
  PublicExecutionStatusSchema,
  PUBLIC_EXECUTION_STATUS_VALUES,
  ProgressStageSchema,
  PROGRESS_STAGE_VALUES,
  FailureCategorySchema,
  FAILURE_CATEGORY_VALUES,
} from "../public-api/index.js";
export type {
  PublicExecutionStatus,
  ProgressStage,
  FailureCategory,
} from "../public-api/index.js";

// ---------------------------------------------------------------------------
// Internal Execution State Machine
// ---------------------------------------------------------------------------

/**
 * All legal internal execution states.
 * These MUST NEVER appear in public API responses, progress events, or learner output.
 *
 * Architecture §3.2
 */
export const INTERNAL_EXECUTION_STATE_VALUES = [
  "ACCEPTED",
  "RESOLVING_LES",
  "AWAITING_CLARIFICATION",
  "PIPELINE_RUNNING",
  "PIPELINE_REVISING",
  "PIPELINE_APPROVED",
  "STUDIO_RUNNING",
  "STUDIO_REVISING",
  "STUDIO_APPROVED",
  "FINALIZING",
  "COMPLETED",
  "DESTROYED",
  "FAILED",
] as const;

export const InternalExecutionStateSchema = z.enum(INTERNAL_EXECUTION_STATE_VALUES);
export type InternalExecutionState = z.infer<typeof InternalExecutionStateSchema>;

// ---------------------------------------------------------------------------
// Legal State Transitions
// ---------------------------------------------------------------------------

/**
 * A single legal state transition as a [from, to] pair.
 */
export type LegalTransition = readonly [InternalExecutionState, InternalExecutionState];

/**
 * The complete set of legal state transitions for the CKLIS execution state machine.
 * Any transition not in this list is prohibited and must be rejected.
 *
 * Architecture §3.2:
 *   ACCEPTED → RESOLVING_LES
 *   RESOLVING_LES → AWAITING_CLARIFICATION
 *   AWAITING_CLARIFICATION → RESOLVING_LES  (bidirectional)
 *   RESOLVING_LES → PIPELINE_RUNNING
 *   PIPELINE_RUNNING → PIPELINE_REVISING
 *   PIPELINE_REVISING → PIPELINE_RUNNING   (bidirectional)
 *   PIPELINE_RUNNING → PIPELINE_APPROVED
 *   PIPELINE_APPROVED → STUDIO_RUNNING
 *   STUDIO_RUNNING → STUDIO_REVISING
 *   STUDIO_REVISING → STUDIO_RUNNING       (bidirectional)
 *   STUDIO_RUNNING → STUDIO_APPROVED
 *   STUDIO_APPROVED → FINALIZING
 *   FINALIZING → COMPLETED
 *   COMPLETED → DESTROYED
 *   ANY → FAILED  (from any non-terminal state)
 */
export const LEGAL_TRANSITIONS: ReadonlyArray<LegalTransition> = [
  ["ACCEPTED", "RESOLVING_LES"],
  ["RESOLVING_LES", "AWAITING_CLARIFICATION"],
  ["AWAITING_CLARIFICATION", "RESOLVING_LES"],
  ["RESOLVING_LES", "PIPELINE_RUNNING"],
  ["PIPELINE_RUNNING", "PIPELINE_REVISING"],
  ["PIPELINE_REVISING", "PIPELINE_RUNNING"],
  ["PIPELINE_RUNNING", "PIPELINE_APPROVED"],
  ["PIPELINE_APPROVED", "STUDIO_RUNNING"],
  ["STUDIO_RUNNING", "STUDIO_REVISING"],
  ["STUDIO_REVISING", "STUDIO_RUNNING"],
  ["STUDIO_RUNNING", "STUDIO_APPROVED"],
  ["STUDIO_APPROVED", "FINALIZING"],
  ["FINALIZING", "COMPLETED"],
  ["COMPLETED", "DESTROYED"],
] as const;

/**
 * Non-terminal states that may transition to FAILED.
 * COMPLETED and DESTROYED cannot become FAILED.
 */
export const STATES_THAT_CAN_FAIL: ReadonlyArray<InternalExecutionState> = [
  "ACCEPTED",
  "RESOLVING_LES",
  "AWAITING_CLARIFICATION",
  "PIPELINE_RUNNING",
  "PIPELINE_REVISING",
  "PIPELINE_APPROVED",
  "STUDIO_RUNNING",
  "STUDIO_REVISING",
  "STUDIO_APPROVED",
  "FINALIZING",
] as const;

/**
 * Terminal states. No further transitions are legal from these states
 * (except FAILED which may only clean up).
 */
export const TERMINAL_STATES: ReadonlyArray<InternalExecutionState> = [
  "COMPLETED",
  "DESTROYED",
  "FAILED",
] as const;

/**
 * Returns true if the given transition is legal per the state machine.
 * FAILED transitions from non-terminal states are always legal.
 */
export function isLegalTransition(
  from: InternalExecutionState,
  to: InternalExecutionState
): boolean {
  if (to === "FAILED" && STATES_THAT_CAN_FAIL.includes(from)) {
    return true;
  }
  return LEGAL_TRANSITIONS.some(([f, t]) => f === from && t === to);
}

/**
 * Returns all legal next states from a given state.
 */
export function legalNextStates(
  from: InternalExecutionState
): ReadonlyArray<InternalExecutionState> {
  const next = LEGAL_TRANSITIONS.filter(([f]) => f === from).map(([, t]) => t);
  if (STATES_THAT_CAN_FAIL.includes(from)) {
    return [...next, "FAILED"] as const;
  }
  return next;
}

// ---------------------------------------------------------------------------
// Internal-to-Public Status Mapping
// ---------------------------------------------------------------------------

/**
 * Maps internal execution states to their public status.
 * Multiple internal states may map to the same public status.
 * This mapping is a Runtime responsibility; the API never exposes internal states.
 *
 * Architecture §7.1
 */
export const INTERNAL_TO_PUBLIC_STATUS_MAP: Readonly<
  Record<InternalExecutionState, z.infer<typeof PublicExecutionStatusSchema>>
> = {
  ACCEPTED: "accepted",
  RESOLVING_LES: "running",
  AWAITING_CLARIFICATION: "awaiting_clarification",
  PIPELINE_RUNNING: "running",
  PIPELINE_REVISING: "running",
  PIPELINE_APPROVED: "running",
  STUDIO_RUNNING: "running",
  STUDIO_REVISING: "running",
  STUDIO_APPROVED: "running",
  FINALIZING: "finalizing",
  COMPLETED: "completed",
  DESTROYED: "completed",
  FAILED: "failed",
};

/** Maps an internal state to its learner-visible public status. */
export function toPublicStatus(
  internalState: InternalExecutionState
): z.infer<typeof PublicExecutionStatusSchema> {
  return INTERNAL_TO_PUBLIC_STATUS_MAP[internalState];
}

// ---------------------------------------------------------------------------
// Internal-to-Public Progress Stage Mapping
// ---------------------------------------------------------------------------

/**
 * Maps internal states to the appropriate learner-safe progress stage label.
 * Architecture §7.5: "Events may include execution ID, stage, safe message, and timestamp."
 */
export const INTERNAL_STATE_TO_PROGRESS_STAGE: Partial<
  Record<InternalExecutionState, z.infer<typeof ProgressStageSchema>>
> = {
  RESOLVING_LES: "understanding_learning_goal",
  AWAITING_CLARIFICATION: "understanding_learning_goal",
  PIPELINE_RUNNING: "building_mental_model",
  PIPELINE_REVISING: "reviewing_educational_quality",
  PIPELINE_APPROVED: "creating_pipeline_outcome",
  STUDIO_RUNNING: "creating_studio_outcome",
  STUDIO_REVISING: "reviewing_studio_quality",
  STUDIO_APPROVED: "reviewing_studio_quality",
  FINALIZING: "preparing_final_experience",
};

// ---------------------------------------------------------------------------
// Execution Metadata Schema (internal)
// ---------------------------------------------------------------------------

/** Core execution identity fields carried throughout the lifecycle. @internal */
export const ExecutionMetadataSchema = z.object({
  executionId: z.string(),
  createdAt: z.string().datetime(),
  internalState: InternalExecutionStateSchema,
  studioFormat: z.string(),
  cklisVersion: z.string(),
  architectureVersion: z.literal("2.0.0"),
  contractVersion: z.string(),
});

export type ExecutionMetadata = z.infer<typeof ExecutionMetadataSchema>;

// ---------------------------------------------------------------------------
// Learner-safe error record
// ---------------------------------------------------------------------------

/**
 * The error information a learner may safely receive.
 * Architecture §7.7: excludes stack traces, prompts, provider errors, Quality reports.
 */
export const LearnerSafeErrorSchema = z.object({
  executionId: z.string(),
  category: FailureCategorySchema,
  message: z.string(),
  requiresNewRequest: z.boolean(),
});

export type LearnerSafeError = z.infer<typeof LearnerSafeErrorSchema>;
