/**
 * M01 contract tests — Quality Report, Q-level determination, feedback, gate result.
 * Architecture §3.5, §5.7. Q0-Q2 internal; only Q3 advances.
 */
import { describe, it, expect } from "vitest";
import {
  determineQLevelFromFindings,
  createQ3ApprovalSummary,
  QualityReportSchema,
  QualityGateResultSchema,
} from "@cklis/contracts/quality";

const iso = "2026-07-27T00:00:00.000Z";

describe("determineQLevelFromFindings", () => {
  it("returns Q3 when there are no blocking findings", () => {
    expect(determineQLevelFromFindings([])).toBe("Q3");
    expect(determineQLevelFromFindings([{ severity: "advisory", isBlocking: false }])).toBe("Q3");
  });

  it("returns Q0 for any blocking critical finding", () => {
    expect(
      determineQLevelFromFindings([
        { severity: "minor", isBlocking: true },
        { severity: "critical", isBlocking: true },
      ])
    ).toBe("Q0");
  });

  it("returns Q1 for a blocking major finding (no critical)", () => {
    expect(determineQLevelFromFindings([{ severity: "major", isBlocking: true }])).toBe("Q1");
  });

  it("returns Q2 for a blocking minor finding (no critical/major)", () => {
    expect(determineQLevelFromFindings([{ severity: "minor", isBlocking: true }])).toBe("Q2");
  });
});

describe("createQ3ApprovalSummary", () => {
  it("creates a summary for Q3", () => {
    expect(createQ3ApprovalSummary("Q3", iso)).toEqual({ approvalStatus: "q3_approved", completedAt: iso });
  });

  it("throws for any non-Q3 level (Q0/Q1/Q2 never advance)", () => {
    expect(() => createQ3ApprovalSummary("Q2", iso)).toThrow();
    expect(() => createQ3ApprovalSummary("Q0", iso)).toThrow();
  });
});

describe("QualityGateResult discriminated union", () => {
  const report = {
    reportId: "qr-1",
    evaluatedArtifactRevisionId: "a1-r1",
    evaluatedArtifactType: "misconception_profile" as const,
    evaluationContext: "stage_checkpoint" as const,
    applicableRules: ["09@1.0.0"],
    dimensionScores: [],
    findings: [],
    responsibleStage: "MisconceptionEngine",
    requiredAction: "none",
    finalQLevel: "Q3" as const,
    evaluatedAt: iso,
  };

  it("accepts a passing Q3 gate result with approval summary", () => {
    const parsed = QualityGateResultSchema.safeParse({
      passed: true,
      qLevel: "Q3",
      report,
      approvalSummary: { approvalStatus: "q3_approved", completedAt: iso },
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a passing result claiming a non-Q3 level", () => {
    const parsed = QualityGateResultSchema.safeParse({
      passed: true,
      qLevel: "Q2",
      report,
      approvalSummary: { approvalStatus: "q3_approved", completedAt: iso },
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a failing gate result carrying feedback", () => {
    const parsed = QualityGateResultSchema.safeParse({
      passed: false,
      qLevel: "Q1",
      report: { ...report, finalQLevel: "Q1" },
      feedbackRequest: {
        feedbackId: "fb-1",
        targetArtifactType: "misconception_profile",
        targetRevisionId: "a1-r1",
        responsibleModuleName: "MisconceptionEngine",
        qLevelReceived: "Q1",
        revisionGuidance: "Add missing high-impact misconception",
        blockingFindings: [],
        nonBlockingFindings: [],
        sourceReportId: "qr-1",
        issuedAt: iso,
      },
    });
    expect(parsed.success).toBe(true);
  });

  it("QualityReport requires a final Q-level", () => {
    const bad = { ...report } as Record<string, unknown>;
    delete bad.finalQLevel;
    expect(QualityReportSchema.safeParse(bad).success).toBe(false);
  });
});
