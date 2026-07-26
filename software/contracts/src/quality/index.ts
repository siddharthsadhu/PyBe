/**
 * CKLIS Version 2 — Quality Engine Contracts
 *
 * Defines Quality Reports, Q-level classification, evidence, feedback requests,
 * and responsible-stage attribution.
 *
 * Architecture reference: Section 3.5, 5.7 of Software Architecture.md
 *
 * Quality responsibilities:
 *   - Independent stage audits after each engine
 *   - Pipeline Quality Gate (after Pipeline Outcome assembly)
 *   - Studio Quality Gate (after Studio processing)
 *   - Q-level classification (Q0–Q3)
 *   - Evidence and failure attribution
 *   - Structured feedback for the producing module to revise
 *
 * Quality MUST NOT:
 *   - Rewrite artifacts (producing module performs revision)
 *   - Own execution sequencing
 *   - Affect UI behavior
 *   - Own provider retry policy
 *   - Create new learning objectives
 *
 * Q0–Q2 are INTERNAL only. Learners receive only Q3 approval summaries.
 */

import { z } from "zod";
import { QLevelSchema, ArtifactTypeSchema, type QLevel } from "../artifacts/index.js";

// Re-export Q-level types for convenience
export { QLevelSchema, Q_LEVEL_VALUES, isDeliverable, requiresRevision } from "../artifacts/index.js";
export type { QLevel } from "../artifacts/index.js";

// ---------------------------------------------------------------------------
// Quality Dimensions
// ---------------------------------------------------------------------------

/**
 * The quality dimensions evaluated for every artifact.
 * Exact dimension names are defined here; thresholds within each level
 * are determined by the Quality Engine implementation per Quality Engine spec (doc 09).
 */
export const QUALITY_DIMENSION_VALUES = [
  "conceptual_correctness",
  "educational_completeness",
  "objective_satisfaction",
  "representation_consistency",
  "educational_progression",
  "learner_appropriateness",
  "specification_compliance",
] as const;

export const QualityDimensionSchema = z.enum(QUALITY_DIMENSION_VALUES);
export type QualityDimension = z.infer<typeof QualityDimensionSchema>;

// ---------------------------------------------------------------------------
// Failure Classifications
// ---------------------------------------------------------------------------

/**
 * Severity classification for individual quality findings.
 * Maps to Q-level: critical → Q0, major → Q1, minor → Q2.
 */
export const FAILURE_SEVERITY_VALUES = [
  "critical",    // → Q0: reject immediately
  "major",       // → Q1: significant defect
  "minor",       // → Q2: small defect; still cannot advance
  "advisory",    // informational; does not lower Q-level
] as const;

export const FailureSeveritySchema = z.enum(FAILURE_SEVERITY_VALUES);
export type FailureSeverity = z.infer<typeof FailureSeveritySchema>;

// ---------------------------------------------------------------------------
// Individual Finding
// ---------------------------------------------------------------------------

/**
 * A single quality finding from the evaluation of one artifact dimension.
 */
export const QualityFindingSchema = z.object({
  findingId: z.string(),
  dimension: QualityDimensionSchema,
  severity: FailureSeveritySchema,
  /** Human-readable description of the specific problem found. */
  description: z.string(),
  /** References to specification sections that define the violated rule. */
  specificationReferences: z.array(z.string()),
  /** Concrete evidence from the artifact that supports this finding. */
  evidence: z.string(),
  /** Whether this finding blocks advancement. */
  isBlocking: z.boolean(),
});

export type QualityFinding = z.infer<typeof QualityFindingSchema>;

// ---------------------------------------------------------------------------
// Dimension Score
// ---------------------------------------------------------------------------

/**
 * Evaluation result for a single quality dimension.
 */
export const DimensionScoreSchema = z.object({
  dimension: QualityDimensionSchema,
  passed: z.boolean(),
  findings: z.array(QualityFindingSchema),
});

export type DimensionScore = z.infer<typeof DimensionScoreSchema>;

// ---------------------------------------------------------------------------
// Quality Report (INTERNAL — never expose publicly)
// ---------------------------------------------------------------------------

/**
 * Complete quality evaluation report for one artifact revision.
 *
 * @internal
 * Q0, Q1, and Q2 reports are NEVER exposed to learners.
 * Only the Q3ApprovalSummary is public.
 *
 * Architecture §3.5: "Every Quality Report includes the evaluated artifact revision,
 * applicable rules, dimension scores, failure classifications, evidence,
 * responsible stage, required action, and final Q-level."
 */
export const QualityReportSchema = z.object({
  reportId: z.string(),
  /** Which artifact revision was evaluated. */
  evaluatedArtifactRevisionId: z.string(),
  evaluatedArtifactType: ArtifactTypeSchema,
  /** The Q-level this report pertains to (stage, pipeline, or studio gate). */
  evaluationContext: z.enum(["stage_checkpoint", "pipeline_gate", "studio_gate"]),
  /** Specification rule references that apply to this artifact type. */
  applicableRules: z.array(z.string()),
  /** Per-dimension evaluation results. */
  dimensionScores: z.array(DimensionScoreSchema),
  /** All findings, blocking and non-blocking. */
  findings: z.array(QualityFindingSchema),
  /** The earliest stage capable of correcting the root cause. */
  responsibleStage: z.string(),
  /** What action the responsible stage must take. */
  requiredAction: z.string(),
  /** The final Q-level classification for this evaluation. */
  finalQLevel: QLevelSchema,
  evaluatedAt: z.string().datetime(),
});

export type QualityReport = z.infer<typeof QualityReportSchema>;

// ---------------------------------------------------------------------------
// Q-level Determination Rule
// ---------------------------------------------------------------------------

/**
 * Determines the overall Q-level from a set of findings.
 * Follows the Architecture §3.5 classification:
 *   Any critical finding → Q0
 *   Any major finding (no critical) → Q1
 *   Any minor finding (no critical or major) → Q2
 *   No blocking findings → Q3
 */
export function determineQLevelFromFindings(
  findings: ReadonlyArray<{ severity: FailureSeverity; isBlocking: boolean }>
): QLevel {
  const blocking = findings.filter((f) => f.isBlocking);
  if (blocking.some((f) => f.severity === "critical")) return "Q0";
  if (blocking.some((f) => f.severity === "major")) return "Q1";
  if (blocking.some((f) => f.severity === "minor")) return "Q2";
  return "Q3";
}

// ---------------------------------------------------------------------------
// Structured Feedback Request
// ---------------------------------------------------------------------------

/**
 * The structured feedback sent from Quality to the responsible producing module.
 * This provides precise, actionable guidance for revision.
 *
 * Architecture §3.5: "The producing module creates a new artifact revision;
 * Quality never edits it."
 *
 * @internal — never exposed to learners
 */
export const StructuredFeedbackRequestSchema = z.object({
  feedbackId: z.string(),
  targetArtifactType: ArtifactTypeSchema,
  /** The revision ID that should be revised. */
  targetRevisionId: z.string(),
  /** The producing module that must create the new revision. */
  responsibleModuleName: z.string(),
  qLevelReceived: QLevelSchema,
  /** Summarized guidance for the producing module. */
  revisionGuidance: z.string(),
  /** The blocking findings that must be addressed. */
  blockingFindings: z.array(QualityFindingSchema),
  /** Optional non-blocking findings that the module may address. */
  nonBlockingFindings: z.array(QualityFindingSchema),
  /** Reference to the Quality Report that produced this feedback. */
  sourceReportId: z.string(),
  issuedAt: z.string().datetime(),
});

export type StructuredFeedbackRequest = z.infer<typeof StructuredFeedbackRequestSchema>;

// ---------------------------------------------------------------------------
// Q3 Approval Summary (the ONLY public Quality information)
// ---------------------------------------------------------------------------

/**
 * The only Quality information that may appear in a learner-facing response.
 * This is a minimal, safe representation of Q3 approval.
 *
 * Architecture §5.7: "Quality Reports are internal. A learner-visible outcome
 * may contain only a safe Q3 approval summary."
 */
export const Q3ApprovalSummarySchema = z.object({
  approvalStatus: z.literal("q3_approved"),
  completedAt: z.string().datetime(),
});

export type Q3ApprovalSummary = z.infer<typeof Q3ApprovalSummarySchema>;

/**
 * Creates a Q3ApprovalSummary. Only callable when quality has verified Q3.
 * Throws if passed a non-Q3 level to make the restriction explicit.
 */
export function createQ3ApprovalSummary(
  qLevel: QLevel,
  completedAt: string
): Q3ApprovalSummary {
  if (qLevel !== "Q3") {
    throw new Error(
      `Cannot create Q3 approval summary: artifact has Q-level ${qLevel}, not Q3. ` +
      `Q0, Q1, and Q2 outcomes may never advance or be delivered.`
    );
  }
  return { approvalStatus: "q3_approved", completedAt };
}

// ---------------------------------------------------------------------------
// Quality Gate Result
// ---------------------------------------------------------------------------

/**
 * The result of a Quality gate evaluation (stage, pipeline, or studio).
 * @internal
 */
export const QualityGateResultSchema = z.discriminatedUnion("passed", [
  z.object({
    passed: z.literal(true),
    qLevel: z.literal("Q3"),
    report: QualityReportSchema,
    approvalSummary: Q3ApprovalSummarySchema,
  }),
  z.object({
    passed: z.literal(false),
    qLevel: z.enum(["Q0", "Q1", "Q2"]),
    report: QualityReportSchema,
    feedbackRequest: StructuredFeedbackRequestSchema,
  }),
]);

export type QualityGateResult = z.infer<typeof QualityGateResultSchema>;
