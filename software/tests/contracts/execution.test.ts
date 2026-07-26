/**
 * M01 contract tests — Internal execution state machine.
 * Playbook M01 step 5: every legal state, every legal transition, FAILED
 * terminal state, DESTROYED final state.
 */
import { describe, it, expect } from "vitest";
import {
  INTERNAL_EXECUTION_STATE_VALUES,
  isLegalTransition,
  legalNextStates,
  toPublicStatus,
  TERMINAL_STATES,
} from "@cklis/contracts/execution";

describe("Execution state machine", () => {
  it("declares all 13 internal states", () => {
    expect(INTERNAL_EXECUTION_STATE_VALUES).toHaveLength(13);
    expect([...INTERNAL_EXECUTION_STATE_VALUES]).toContain("ACCEPTED");
    expect([...INTERNAL_EXECUTION_STATE_VALUES]).toContain("DESTROYED");
    expect([...INTERNAL_EXECUTION_STATE_VALUES]).toContain("FAILED");
  });

  it("permits the happy-path transitions", () => {
    expect(isLegalTransition("ACCEPTED", "RESOLVING_LES")).toBe(true);
    expect(isLegalTransition("RESOLVING_LES", "PIPELINE_RUNNING")).toBe(true);
    expect(isLegalTransition("PIPELINE_RUNNING", "PIPELINE_APPROVED")).toBe(true);
    expect(isLegalTransition("PIPELINE_APPROVED", "STUDIO_RUNNING")).toBe(true);
    expect(isLegalTransition("STUDIO_APPROVED", "FINALIZING")).toBe(true);
    expect(isLegalTransition("FINALIZING", "COMPLETED")).toBe(true);
    expect(isLegalTransition("COMPLETED", "DESTROYED")).toBe(true);
  });

  it("permits bidirectional clarification and revision loops", () => {
    expect(isLegalTransition("RESOLVING_LES", "AWAITING_CLARIFICATION")).toBe(true);
    expect(isLegalTransition("AWAITING_CLARIFICATION", "RESOLVING_LES")).toBe(true);
    expect(isLegalTransition("PIPELINE_RUNNING", "PIPELINE_REVISING")).toBe(true);
    expect(isLegalTransition("PIPELINE_REVISING", "PIPELINE_RUNNING")).toBe(true);
    expect(isLegalTransition("STUDIO_RUNNING", "STUDIO_REVISING")).toBe(true);
    expect(isLegalTransition("STUDIO_REVISING", "STUDIO_RUNNING")).toBe(true);
  });

  it("rejects illegal skips", () => {
    expect(isLegalTransition("ACCEPTED", "COMPLETED")).toBe(false);
    expect(isLegalTransition("PIPELINE_RUNNING", "STUDIO_RUNNING")).toBe(false);
    expect(isLegalTransition("RESOLVING_LES", "FINALIZING")).toBe(false);
  });

  it("allows ANY non-terminal state to fail, but terminal states cannot", () => {
    expect(isLegalTransition("PIPELINE_RUNNING", "FAILED")).toBe(true);
    expect(isLegalTransition("ACCEPTED", "FAILED")).toBe(true);
    expect(isLegalTransition("COMPLETED", "FAILED")).toBe(false);
    expect(isLegalTransition("DESTROYED", "FAILED")).toBe(false);
    expect(isLegalTransition("FAILED", "FAILED")).toBe(false);
  });

  it("legalNextStates includes FAILED only for non-terminal states", () => {
    expect(legalNextStates("PIPELINE_RUNNING")).toContain("FAILED");
    expect(legalNextStates("COMPLETED")).not.toContain("FAILED");
    expect(legalNextStates("DESTROYED")).toEqual([]);
  });

  it("marks COMPLETED, DESTROYED, FAILED as terminal", () => {
    expect([...TERMINAL_STATES].sort()).toEqual(["COMPLETED", "DESTROYED", "FAILED"].sort());
  });

  it("maps every internal state to a public status", () => {
    for (const s of INTERNAL_EXECUTION_STATE_VALUES) {
      const pub = toPublicStatus(s);
      expect(pub).toBeTypeOf("string");
    }
    expect(toPublicStatus("PIPELINE_RUNNING")).toBe("running");
    expect(toPublicStatus("AWAITING_CLARIFICATION")).toBe("awaiting_clarification");
    expect(toPublicStatus("FAILED")).toBe("failed");
  });

  it("never maps an internal state to a Q-level or internal name", () => {
    for (const s of INTERNAL_EXECUTION_STATE_VALUES) {
      const pub = toPublicStatus(s);
      expect(["accepted", "awaiting_clarification", "running", "finalizing", "completed", "failed"]).toContain(pub);
    }
  });
});
