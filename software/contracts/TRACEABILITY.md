# CKLIS Version 2 — Specification-to-Contract Traceability Matrix

**Milestone:** M01 — Contract and Repository Foundation
**Architecture baseline:** Software Architecture Version 2.0.0 (frozen 2026-07-26)
**Purpose (Playbook M01):** map every contract to the frozen architecture section
and the official specification that mandates it, so no contract is implicit.

Path base: `software/contracts/src/`. Architecture references are sections of
`docs/Software Architecture.md`. Specification references are the documents in
the repository root layer folders (00–14, AI-01–AI-04, Studio prompts).

## 1. Contract modules

| Contract module | Key exported contracts | Architecture § | Specification source |
|---|---|---|---|
| `versions/` | `SYSTEM_VERSION_REGISTRY`, `ARCHITECTURE_VERSION`, `CONTRACT_VERSIONS`, `ENGINE_CONTRACT_VERSIONS`, `STUDIO_RESOURCE_VERSIONS`, `isVersionCompatible` | §0, §7.3; Playbook §8.2 | 12 – Documentation Style Guide (semver policy); 11 – CKMS (version pinning) |
| `public-api/` | `PublicExecutionStatusSchema` (6 values), `StudioFormatSchema` (4 values), `ProgressStageSchema` (9 labels), `FailureCategorySchema` (4), request forms, `CreateExecution*`, `SubmitClarification*`, `GetExecutionResponse`, `ProgressEvent`, `FailureResponse`, `PROHIBITED_PUBLIC_FIELD_NAMES` | §7.1–7.8 | 14 – SPRS; AI-03 Output Schema |
| `les/` | `EducationalIntentSchema`, `CandidateLesSchema`, `ResolvedLesSchema`, `LesValidationResultSchema` | §3.3, §4.2 | 13 – Learning Experience Specification |
| `execution/` | `INTERNAL_EXECUTION_STATE_VALUES`, `LEGAL_TRANSITIONS`, `isLegalTransition`, `INTERNAL_TO_PUBLIC_STATUS_MAP`, `ExecutionMetadataSchema`, `LearnerSafeErrorSchema` | §3.2, §7.1 | 11 – CKMS (execution lifecycle, error categories) |
| `runtime-context/` | `RuntimeContextSchema` (12 sections), `RUNTIME_CONTEXT_LIFECYCLE_VALUES`, `PinnedVersionsSchema` | §4.1–4.6 | 11 – CKMS (Runtime Context, Audit boundary) |
| `engines/` | `EngineInputEnvelopeSchema`, `EngineResultEnvelopeSchema`, 5 bounded-context views, 5 artifact schemas (`MisconceptionProfile` … `EpisodeSpecification`) | §6.1–6.2 | 03–07 engine specs |
| `artifacts/` | `ArtifactRevisionSchema`, `ArtifactTypeSchema`, `ArtifactStatusSchema`, `QLevelSchema`, `UpstreamRevisionReferenceSchema`, `ARTIFACT_DEPENDENCY_ORDER`, `downstreamArtifactTypes` | §4.4, §9.1–9.5 | 11 – CKMS (traceability, audit) |
| `outcomes/` | `PipelineOutcomeSchema`, `StudioOutcomeSchema`, `FinalizedOutcomeEnvelopeSchema` (trace-linkage + Q3 refinements), `preFinalizationCheck` | §3.6–3.8, §7.6 | 08 – Production Engine; Studio prompts (CP1/CP2/1-page/VP1/VP2) |
| `quality/` | `QualityReportSchema`, `QLevelSchema`, `QUALITY_DIMENSION_VALUES`, `StructuredFeedbackRequestSchema`, `Q3ApprovalSummarySchema`, `determineQLevelFromFindings`, `QualityGateResultSchema` | §3.5, §5.7 | 09 – Quality Engine |
| `ports/` | `AiReasoningPort`, `KnowledgeResourcePort`, `PromptResourcePort`, `ActiveContextPort`, `FinalOutcomePort`, `AuditLogPort`, `ProgressPort`, `DiagnosticsPort`, `IdentifierPort`, `ClockPort`, `PortFailureSchema` | §6.6, §9.4, §10 | Software Architecture (ports & adapters); 10 – Evolution Engine (governance boundary) |

## 2. Frozen architecture invariant → contract enforcement

| Frozen invariant (Arch §1.4 / §3 / Ledger §4) | Enforced by |
|---|---|
| Exactly six public execution statuses | `public-api` `PUBLIC_EXECUTION_STATUS_VALUES` (length asserted in tests) |
| Exactly four Studio formats | `public-api` `STUDIO_FORMAT_VALUES` (length asserted) |
| Exactly nine learner-safe progress labels | `public-api` `PROGRESS_STAGE_VALUES` (length asserted) |
| Fixed engine order Misconception→…→Episode | `artifacts` `ARTIFACT_DEPENDENCY_ORDER`; `engines` view dependencies |
| Q3-only advances / delivers | `artifacts.isDeliverable`, `quality.determineQLevelFromFindings`, `outcomes.preFinalizationCheck`, `FinalizedOutcomeEnvelope` Q3 refinement |
| Studio Outcome references exact Pipeline revision | `outcomes` `FinalizedOutcomeEnvelopeSchema` `.refine` trace-linkage |
| Q0/Q1/Q2, prompts, provider, RuntimeContext never public | `public-api` `PROHIBITED_PUBLIC_FIELD_NAMES` + prohibited-field tests |
| Legal state transitions only; ANY→FAILED from non-terminal | `execution` `LEGAL_TRANSITIONS` + `isLegalTransition` |
| Provider-neutral infrastructure boundary | `ports` `PortFailureSchema`, no provider fields in any port |
| Approved artifact content immutable; append-only revisions | `artifacts` `ArtifactRevisionSchema` (`status`, `revisionNumber`) |

## 3. Architecture dependency rules (Arch §10.4) → automated checks

Enforced by `software/tests/architecture/`:

- Contracts must not import from `runtime/`, `engines/`, `production/`, `quality/`, `infrastructure/`, or `apps/` (contracts are the innermost layer).
- `public-api` and `outcomes` must not import `runtime-context` (no internal-state leakage into public contracts).
- An intentional prohibited-import fixture (`tests/architecture/fixtures/`) must be detected and rejected by the checker.
