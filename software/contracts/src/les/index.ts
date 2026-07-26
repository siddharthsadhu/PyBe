/**
 * CKLIS Version 2 — Learning Experience Specification (LES) Contracts
 *
 * Defines the standardized request model for learner intent.
 * LES separates what the learner wants from how CKLIS produces it.
 *
 * Specification reference: Document 13 — Learning Experience Specification (LES) v1.0.0
 * Architecture reference: Section 3.3 of Software Architecture.md
 *
 * LES responsibilities:
 *   - Standardize learner requests
 *   - Define required and optional request fields
 *   - Support consistent Runtime interpretation
 *   - Enable deterministic CKMS execution context construction
 *
 * LES does NOT perform educational reasoning, generate content, or select engines.
 */

import { z } from "zod";
import { StudioFormatSchema } from "../public-api/index.js";

// Re-export StudioFormat from here since it is defined in LES
export { StudioFormatSchema, STUDIO_FORMAT_VALUES } from "../public-api/index.js";
export type { StudioFormat } from "../public-api/index.js";

// ---------------------------------------------------------------------------
// LES Field Schemas
// ---------------------------------------------------------------------------

/**
 * Educational Intent — required field.
 * Defines what the learner wishes to understand or achieve.
 * Examples: "Learn Python loops", "Understand recursion", "Master SQL joins"
 * Spec §5: Required Fields
 */
export const EducationalIntentSchema = z.string().min(1, "Educational Intent is required");
export type EducationalIntent = z.infer<typeof EducationalIntentSchema>;

/**
 * Audience — optional field.
 * Inferred by Runtime if not provided.
 * Spec §6: Optional Fields
 */
export const AudienceSchema = z.enum(["beginner", "intermediate", "advanced"]);
export type Audience = z.infer<typeof AudienceSchema>;

/**
 * Educational Context — optional field.
 * When "surprise_me" is selected, Runtime intelligently determines the context
 * most likely to maximize conceptual understanding. No random selection occurs.
 * Spec §6: Educational Context
 */
export const EducationalContextSchema = z.union([
  z.literal("surprise_me"),
  z.string().min(1),
]);
export type EducationalContext = z.infer<typeof EducationalContextSchema>;

/**
 * Production Profile — optional field.
 * Examples: classroom, self_paced, corporate_training, short_form_video, university_lecture
 */
export const ProductionProfileSchema = z.string().min(1);
export type ProductionProfile = z.infer<typeof ProductionProfileSchema>;

// ---------------------------------------------------------------------------
// Candidate LES (in-progress, before full resolution)
// ---------------------------------------------------------------------------

/**
 * The incoming learner request before Runtime normalization.
 * Contains the minimally required and all provided optional fields.
 *
 * Architecture §3.3: "Clarification does not create a new execution or RuntimeContext.
 * It continues the same execution."
 */
export const CandidateLesSchema = z.object({
  /** Required: what the learner wants to learn. */
  educationalIntent: EducationalIntentSchema,
  /** Required: which of the four Version 2 Studio formats is desired. */
  desiredStudioFormat: StudioFormatSchema,
  /** Optional: target audience level. Runtime infers if absent. */
  audience: AudienceSchema.optional(),
  /** Optional: educational context theme or "surprise_me". */
  educationalContext: EducationalContextSchema.optional(),
  /** Optional: programming or human language preference. */
  language: z.string().optional(),
  /** Optional: target duration (e.g., "10 minutes", "30 minutes"). */
  duration: z.string().optional(),
  /** Optional: production profile / delivery platform. */
  productionProfile: ProductionProfileSchema.optional(),
  /** Optional: platform or profile constraints. */
  platform: z.string().optional(),
  /** Optional: positive hints to improve experience quality. */
  experienceHints: z.array(z.string()).optional(),
  /** Optional: constraints the experience must respect. */
  experienceConstraints: z.array(z.string()).optional(),
  /** Optional: supplementary output notes. */
  additionalOutputNotes: z.string().optional(),
});

export type CandidateLes = z.infer<typeof CandidateLesSchema>;

// ---------------------------------------------------------------------------
// Resolved LES (after Runtime normalization and inference)
// ---------------------------------------------------------------------------

/**
 * The fully resolved LES after Runtime has normalized, inferred defaults,
 * and applied compatibility decisions.
 *
 * INVARIANT: Explicit learner choices are preserved without modification.
 * Only omitted values may be inferred or defaulted (Architecture §1.4, invariant 4).
 *
 * Architecture §4.2: "Resolved LES" section of RuntimeContext.
 */
export const ResolvedLesSchema = z.object({
  /** The canonical educational intent after normalization. */
  educationalIntent: EducationalIntentSchema,
  /** The validated, resolved Studio format (one of the four). */
  resolvedStudioFormat: StudioFormatSchema,
  /** Resolved audience (may be inferred if not provided). */
  resolvedAudience: AudienceSchema,
  /** Resolved educational context (may be intelligently selected for "surprise_me"). */
  resolvedEducationalContext: z.string(),
  /** Resolved language for the experience. */
  resolvedLanguage: z.string(),
  /** Resolved target duration. */
  resolvedDuration: z.string().optional(),
  /** Resolved production profile. */
  resolvedProductionProfile: ProductionProfileSchema.optional(),
  /** Resolved platform. */
  resolvedPlatform: z.string().optional(),
  /** Experience hints preserved from the learner request. */
  experienceHints: z.array(z.string()),
  /** Experience constraints preserved from the learner request. */
  experienceConstraints: z.array(z.string()),
  /** Additional output notes. */
  additionalOutputNotes: z.string().optional(),
  /** Whether the LES was inferred from natural language vs. provided structured. */
  wasNaturalLanguage: z.boolean(),
  /** Fields that were inferred/defaulted (vs. explicitly provided). */
  inferredFields: z.array(z.string()),
});

export type ResolvedLes = z.infer<typeof ResolvedLesSchema>;

// ---------------------------------------------------------------------------
// LES Validation Result
// ---------------------------------------------------------------------------

/**
 * The result of validating a candidate LES.
 * If not resolved, contains the specific missing mandatory fields.
 */
export const LesValidationResultSchema = z.discriminatedUnion("resolved", [
  z.object({
    resolved: z.literal(true),
    resolvedLes: ResolvedLesSchema,
  }),
  z.object({
    resolved: z.literal(false),
    missingMandatoryFields: z.array(z.string()).min(1),
    clarificationRequired: z.boolean(),
    validationFindings: z.array(z.string()),
  }),
]);

export type LesValidationResult = z.infer<typeof LesValidationResultSchema>;

// ---------------------------------------------------------------------------
// LES Request (the incoming structured request form)
// ---------------------------------------------------------------------------

/**
 * Direct LES request for structured API consumers who know the LES model.
 * Equivalent to CandidateLesSchema but used at the API boundary.
 */
export const LesRequestSchema = CandidateLesSchema;
export type LesRequest = CandidateLes;
