# PyBe / CKLIS Version 2 Implementation Milestones

**Plan version:** 1.0.0  
**Status:** Approved architecture implementation plan  
**Architecture baseline:** Frozen Software Architecture Version 2.0.0  
**Created:** 2026-07-26  
**Scope:** Implementation sequencing only; no implementation code

---

# 1. Milestone Principles

Every milestone must be:

- **Independently testable:** it has deterministic acceptance tests and does not require unfinished later milestones to prove its own behavior.
- **Independently reviewable:** it has a bounded responsibility, explicit contracts, and a specification-compliance checklist.
- **Independently deployable:** it produces a complete deployable package, service, adapter set, or web artifact. Internal milestones may be deployed to an isolated integration environment without being exposed through the learner-facing product.
- **Production-complete within scope:** no TODOs, placeholders, fake educational logic, or incomplete public paths.
- **Architecture-conformant:** it may extend the implementation but may not alter frozen boundaries or contracts.

An internal component being deployable does not mean it must be publicly enabled. Learner-facing exposure begins only after the complete backend contract is available.

---

# 2. Milestone Order

| Milestone | Name | Deployable unit |
|---|---|---|
| M01 | Contract and Repository Foundation | Versioned contract package and architecture checks |
| M02 | Execution Storage and Operational Foundation | Infrastructure adapter package |
| M03 | AI, Knowledge, and Prompt Boundary | Provider/resource adapter package |
| M04 | Quality Engine Foundation | Independent Quality package |
| M05 | Runtime Intake, LES, and RuntimeContext | Runtime core package |
| M06 | Misconception Engine | Misconception engine package |
| M07 | Mental Model Engine | Mental Model engine package |
| M08 | Scenario Intelligence Engine | Scenario engine package |
| M09 | Pattern Mapping Engine | Pattern engine package |
| M10 | Episode Generation Engine | Episode engine package |
| M11 | Pipeline Outcome and Pipeline Quality Gate | Generic pipeline package |
| M12 | Studio Framework and Router | Studio orchestration package |
| M13 | Comic Studio Path | Comic processor package |
| M14 | One-Page Comic Studio Path | One-page processor package |
| M15 | Video Studio Path | Video processor package |
| M16 | Audio/Podcast Studio Path | Audio processor package |
| M17 | Finalization and Dual-Outcome Publication | Finalization package |
| M18 | Public Backend API | Deployable backend service |
| M19 | Web Request and Clarification Experience | Deployable request UI |
| M20 | Web Progress and Dual-Outcome Experience | Complete deployable PyBe web application |
| M21 | Version 2 Release Candidate | Complete deployable PyBe system |

---

# 3. Detailed Milestones

## M01 — Contract and Repository Foundation

### Objective

Establish the implementation repository boundaries and the versioned contracts that every later milestone must obey.

### Deliverables

- Logical folder structure from the frozen architecture.
- Public API contract definitions.
- LES, execution-state, RuntimeContext, artifact, engine, Quality, outcome, and infrastructure-port contracts.
- Version identifiers for Runtime, CKLIS, CKMS, schemas, engines, prompts, and architecture.
- Architecture dependency rules and automated boundary checks.
- Specification-to-contract traceability matrix.

### Independent tests

- Every contract is structurally valid and versioned.
- Contract compatibility rules reject incompatible versions.
- Dependency tests reject prohibited imports or reverse dependencies.
- Public contracts contain no RuntimeContext, provider, prompt, or private Quality fields.
- Contract fixtures cover valid, invalid, and boundary envelopes.

### Independent review

Review only contracts, ownership, naming, traceability, and dependency direction. No educational implementation is reviewed in this milestone.

### Independent deployment

Publish the contract and architecture-check packages to the internal artifact environment. Later components must consume this exact version.

### Exit criteria

- All frozen architectural boundaries are represented.
- No contract is left implicit.
- No framework or provider detail leaks into domain contracts.

---

## M02 — Execution Storage and Operational Foundation

### Objective

Implement replaceable operational adapters without introducing educational policy.

### Deliverables

- Identifier and clock adapters.
- Active RuntimeContext storage adapter.
- Finalized dual-outcome storage adapter with atomic write/read behavior.
- Audit Log writer supporting developer-readable Markdown or JSON.
- Diagnostics adapter with learner-safe separation.
- Progress transport adapter.
- Storage failure and recovery behavior.

### Independent tests

- Active contexts are isolated by execution ID.
- Final outcome writes are atomic; partial envelopes are never readable.
- Audit Logs survive active-context destruction.
- Audit Logs exclude secrets, credentials, and private provider data.
- Adapter failures map to provider-neutral operational failures.
- Storage adapters contain no educational rules.

### Independent review

Review lifecycle guarantees, atomicity, isolation, failure handling, data boundaries, and port conformance.

### Independent deployment

Deploy the adapters and operational probes in an isolated integration environment. Validate create/read/destroy behavior without running educational engines.

### Exit criteria

- Temporary, finalized-outcome, and Audit Log lifecycles are demonstrably separate.
- No adapter owns Runtime or educational decisions.

---

## M03 — AI, Knowledge, and Prompt Boundary

### Objective

Provide provider-independent reasoning and immutable versioned access to official knowledge and Studio resources.

### Deliverables

- AI Reasoning Port implementation.
- Provider-neutral request, structured-result, timeout, and failure handling.
- Read-only Knowledge Resource adapter for official specifications.
- Read-only Prompt Resource adapter for CP1, CP2, one-page, VP1, VP2, and audio resources.
- Central Runtime Prompt Composer.
- Resource-version compatibility validation.
- Protection against prompt, provider, or credential leakage.

### Independent tests

- Provider adapters satisfy the same contract.
- Structured results are validated before return.
- Missing or incompatible resources stop execution safely.
- Prompt composition follows the approved knowledge hierarchy.
- Resources remain immutable during an execution.
- Provider details cannot enter public contracts.

### Independent review

Review provider independence, resource governance, prompt ownership, version pinning, and information boundaries.

### Independent deployment

Deploy as a provider/resource integration package with restricted conformance probes. It is not yet a learner-facing generation service.

### Exit criteria

- Runtime can invoke reasoning without depending on a named provider.
- Every resource used by execution is version-identifiable and read-only.

---

## M04 — Quality Engine Foundation

### Objective

Implement independent Quality evaluation, Q-level classification, evidence, and structured feedback before educational engines are integrated.

### Deliverables

- Quality dimension and scoring model.
- Q0, Q1, Q2, and Q3 classification.
- Standard Quality Report.
- Failure classifications and responsible-stage attribution.
- Structured feedback request contract.
- Stage, Pipeline, and Studio Quality evaluator entry points.
- Learner-safe Q3 summary projection.

### Independent tests

Using approved conformance fixtures:

- Critical constitutional and technical failures produce Q0.
- Major defects produce Q1.
- Minor defects produce Q2 and cannot advance.
- Fully compliant artifacts produce Q3.
- Quality never mutates the evaluated artifact.
- Every finding cites applicable evidence and specifications.
- Private reports cannot enter public events or outcomes.

### Independent review

Review independence, reproducibility, attribution, evidence quality, and strict Q3 gating.

### Independent deployment

Deploy as an internal Quality package and evaluation service in an isolated environment using fixed specification fixtures.

### Exit criteria

- Q-level behavior is deterministic and contract-compliant.
- Structured feedback is sufficient for a producing module to revise its output.

---

## M05 — Runtime Intake, LES, and RuntimeContext

### Objective

Implement execution creation, request interpretation, LES resolution, clarification, CKMS context construction, and RuntimeContext lifecycle without yet running the educational pipeline.

### Deliverables

- Execution Manager and legal state machine.
- Request Interpreter for natural-language, partial, and structured requests.
- LES Resolver and semantic validation.
- Clarification Coordinator.
- Runtime Decision Recorder.
- CKMS Context Builder.
- RuntimeContext Manager and bounded views.
- Safe failure and destruction behavior.
- Learner-safe progress projection for intake states.

### Independent tests

- One request creates exactly one execution and RuntimeContext.
- Clarification continues the same execution and context.
- Only mandatory clarification is requested.
- Optional values are inferred/defaulted without overriding explicit choices.
- Unsupported Studio formats produce safe validation behavior.
- Every decision and clarification is traceable.
- Illegal state transitions are rejected.
- Terminal failure destroys temporary state after preserving available audit information.

### Independent review

Review LES fidelity, inference boundaries, clarification minimality, state transitions, context ownership, and isolation.

### Independent deployment

Deploy the Runtime intake package with a restricted validation interface. It may accept and normalize requests but must not claim to generate outcomes.

### Exit criteria

- A valid request reaches a valid CKMS execution context.
- An invalid or incomplete request reaches a safe clarification or failure state.
- No educational engine logic exists in intake.

---

## M06 — Misconception Engine

### Objective

Implement the first educational stage and its complete stage Quality loop.

### Deliverables

- Misconception Engine contract implementation.
- Bounded RuntimeContext view for this stage.
- Prioritized Misconception Profile with causes, risks, and correction strategies.
- Schema validation, traceability, and stage Quality checkpoint.
- Q0–Q2 feedback and revision behavior.

### Independent tests

- Profiles are objective-, audience-, and prerequisite-specific.
- Duplicate or irrelevant misconceptions are rejected.
- Every misconception has priority and correction strategy.
- The engine cannot produce a lesson, scenario, or Studio artifact.
- Only Q3 profiles become current RuntimeContext artifacts.

### Independent review

Review educational fidelity against the Misconception Engine, Learning Science, Constitution, and Quality specifications.

### Independent deployment

Deploy as a versioned engine package connected to Runtime only through the engine contract.

### Exit criteria

A resolved CKMS context can produce one traceable Q3 Misconception Profile with no downstream processing.

---

## M07 — Mental Model Engine

### Objective

Implement Mental Model generation using the approved Misconception Profile.

### Deliverables

- Mental Model Engine implementation.
- Context view limited to approved required inputs.
- Mental Model Specification with entities, relationships, rules, behaviors, and valid analogy/visualization support.
- Stage Quality and revision integration.

### Independent tests

- A Mental Model cannot run without a Q3 Misconception Profile.
- The model addresses approved misconceptions without introducing inaccuracies.
- Abstraction level matches the resolved audience.
- The engine cannot generate scenarios, episodes, or production artifacts.
- Revision creates a new artifact revision and preserves trace history.

### Independent review

Review conceptual correctness, misconception alignment, cognitive-load discipline, contract boundaries, and traceability.

### Independent deployment

Deploy as a versioned engine package. The existing Misconception milestone remains unchanged.

### Exit criteria

Runtime can progress from resolved LES through Q3 Misconception and Q3 Mental Model artifacts.

---

## M08 — Scenario Intelligence Engine

### Objective

Implement scenario selection and design without changing the approved Mental Model.

### Deliverables

- Scenario Intelligence Engine implementation.
- Educational Context handling, including nonrandom Surprise Me resolution.
- Scenario Specification with observable events and educational mapping.
- Stage Quality and revision integration.

### Independent tests

- Scenario requires a Q3 Mental Model.
- Scenario is authentic, audience-appropriate, and educationally relevant.
- Surprise Me is educationally selected, never random.
- Scenario preserves the approved model and misconception strategy.
- The engine cannot generate a complete episode or select a Studio format.

### Independent review

Review scenario authenticity, Context purpose, model preservation, cultural relevance where used, and strict module scope.

### Independent deployment

Deploy as a versioned engine package added to the internal pipeline composition.

### Exit criteria

Runtime can produce a Q3 Scenario Specification linked to the exact Mental Model revision it consumed.

---

## M09 — Pattern Mapping Engine

### Objective

Implement the bridge from observable scenario behavior to transferable abstract and programming patterns.

### Deliverables

- Pattern Mapping Engine implementation.
- Pattern Mapping Specification.
- Observable-to-abstract-to-programming transition evidence.
- Transfer opportunities and generalization rules.
- Stage Quality and revision integration.

### Independent tests

- Pattern mapping requires Q3 Mental Model and Scenario artifacts.
- Patterns are accurate, recognizable, generalizable, and transferable.
- Mapping does not invent a replacement scenario or mental model.
- Every output references exact upstream revisions.
- Downstream invalidation occurs when a consumed upstream revision changes.

### Independent review

Review transition logic, technical correctness, transfer value, traceability, and module scope.

### Independent deployment

Deploy as a versioned engine package in the internal sequential pipeline.

### Exit criteria

Runtime can produce a Q3 Pattern Mapping Specification without episode or Production behavior.

---

## M10 — Episode Generation Engine

### Objective

Convert approved educational reasoning into a complete platform-neutral instructional sequence.

### Deliverables

- Episode Generation Engine implementation.
- Canonical Episode Specification.
- Objectives, progression, transitions, pacing, practice, assessment, reflection, and transfer.
- Stage Quality and revision integration.

### Independent tests

- Episode generation requires every upstream artifact at Q3.
- Progression is coherent and increases appropriately in complexity.
- Practice and assessment map to the objective.
- Episode remains platform- and Studio-independent.
- It cannot alter approved misconceptions, Mental Model, Scenario, or Pattern Mapping.

### Independent review

Review instructional progression, completeness, assessment alignment, representation independence, and dependency integrity.

### Independent deployment

Deploy as a versioned engine package completing the internal educational pipeline.

### Exit criteria

Runtime can produce a full chain of Q3 educational artifacts ending in a Q3 Episode Specification.

---

## M11 — Pipeline Outcome and Pipeline Quality Gate

### Objective

Assemble and approve the complete representation-independent Pipeline Outcome.

### Deliverables

- Pipeline Outcome Assembler.
- Complete Pipeline Outcome schema and serializer.
- Pipeline-level cross-engine consistency checks.
- Pipeline Quality Gate.
- Root-cause routing to the earliest responsible stage.
- Downstream invalidation and complete pipeline revision behavior.
- Learner-safe Q3 approval summary.

### Independent tests

- The assembler accepts only current Q3 artifact revisions.
- Every required educational artifact appears exactly once.
- Private prompts, reports, reasoning, and provider data are excluded.
- A cross-engine inconsistency returns to the responsible engine.
- Revised upstream artifacts regenerate every dependent downstream artifact.
- Studio processing cannot begin before Pipeline Q3.

### Independent review

Review completeness, representation independence, cross-engine consistency, revision graph correctness, and public/private data separation.

### Independent deployment

Deploy the complete generic CKLIS pipeline as an internal service capable of producing a Q3 Pipeline Outcome but not a public Version 2 execution result.

### Exit criteria

A valid request can produce one complete Q3 Pipeline Outcome with full traceability.

---

## M12 — Studio Framework and Router

### Objective

Implement shared Studio orchestration and strict routing without yet implementing format-specific generation.

### Deliverables

- Studio processor contract implementation framework.
- Studio Router for exactly four Version 2 formats.
- Shared Studio traceability, resource-version, fidelity-evidence, and revision handling.
- Studio Quality Gate integration point.
- Rejection of unsupported or ambiguous routes.

### Independent tests

- Exactly one Studio path is selected from resolved LES.
- Unsupported formats never silently map to a supported path.
- Studio cannot run without a Q3 Pipeline Outcome.
- Router contains no educational reasoning.
- No incomplete processor is exposed as supported.

### Independent review

Review routing exclusivity, format scope, Pipeline dependency, shared Studio contracts, and absence of educational mutation.

### Independent deployment

Deploy the Studio orchestration package internally with all format routes disabled until their complete processors are installed.

### Exit criteria

The router can validate and select installed processors without producing a placeholder outcome.

---

## M13 — Comic Studio Path

### Objective

Implement the complete Comic path from approved Pipeline Outcome through CP1 and CP2 to final Markdown.

### Deliverables

- CP1 blueprint stage.
- CP2 final prompt stage.
- Intermediate trace and resource-version records.
- Comic representation-fidelity evaluation.
- Studio Quality revision loop.

### Independent tests

- CP2 cannot run without a valid CP1 result.
- Comic output preserves objective, misconceptions, Mental Model, Scenario purpose, Pattern Mapping, episode progression, assessment, and reflection.
- Output is complete Markdown.
- Comic-only failures rerun only the responsible Comic stage.
- Educational failures route upstream and rebuild Pipeline before Comic reruns.

### Independent review

Review CP1/CP2 fidelity, comic production completeness, educational preservation, traceability, and Quality behavior.

### Independent deployment

Deploy as an independently versioned Studio processor and enable only the Comic route in the isolated Studio environment.

### Exit criteria

A Q3 Pipeline Outcome can produce a Q3 Comic Studio Outcome.

---

## M14 — One-Page Comic Studio Path

### Objective

Implement the complete One-Page Comic path using the authoritative reference example.

### Deliverables

- One-page transformation processor.
- Reference-resource version tracking.
- One-page completeness and constraint validation.
- Representation-fidelity Quality loop.

### Independent tests

- Output fits the one-page format contract without dropping mandatory educational stages.
- It preserves the exact source Pipeline revision.
- Output is complete Markdown.
- It does not invoke CP1/CP2 unless the approved one-page contract explicitly requires them.
- Failures route correctly without affecting other Studio processors.

### Independent review

Review one-page constraints, educational completeness, reference fidelity, and isolation from the Comic path.

### Independent deployment

Deploy as an independently versioned Studio processor and enable its route only after all tests pass.

### Exit criteria

A Q3 Pipeline Outcome can produce a Q3 One-Page Comic Studio Outcome.

---

## M15 — Video Studio Path

### Objective

Implement the complete Video path through VP1 and VP2 to final Markdown.

### Deliverables

- VP1 production blueprint stage.
- VP2 final production prompt stage.
- Scene, pacing, narration, visual, and transition validation.
- Video representation-fidelity Quality loop.

### Independent tests

- VP2 cannot run without a valid VP1 result.
- Output preserves the complete educational chain.
- Timing and production directions are internally coherent.
- Output is complete Markdown and not a binary video.
- Video-only revision does not mutate Pipeline artifacts.

### Independent review

Review VP1/VP2 compliance, pacing, production completeness, fidelity, and revision scope.

### Independent deployment

Deploy as an independently versioned Studio processor and enable the Video route in isolation.

### Exit criteria

A Q3 Pipeline Outcome can produce a Q3 Video Studio Outcome.

---

## M16 — Audio/Podcast Studio Path

### Objective

Implement the complete Audio/Podcast final-script path.

### Deliverables

- Audio/Podcast script processor.
- Spoken-language, pacing, cue, transition, recap, practice, and reflection validation.
- Audio representation-fidelity Quality loop.
- Complete Markdown serializer.

### Independent tests

- Output is suitable for spoken delivery.
- Visual dependence is absent unless represented through narration.
- Educational intent and progression remain unchanged.
- Output is complete Markdown and not binary audio.
- Audio-only failures remain isolated to this processor unless caused upstream.

### Independent review

Review spoken clarity, pacing, completeness, fidelity, and strict medium scope.

### Independent deployment

Deploy as an independently versioned Studio processor and enable the Audio/Podcast route in isolation.

### Exit criteria

A Q3 Pipeline Outcome can produce a Q3 Audio/Podcast Studio Outcome.

---

## M17 — Finalization and Dual-Outcome Publication

### Objective

Implement the guarded transaction that turns two Q3 candidates into one public finalized outcome envelope and destroys active context safely.

### Deliverables

- Finalization precondition validator.
- Immutable dual-outcome envelope.
- Atomic outcome persistence.
- Audit Log serialization and persistence.
- Completion publication.
- RuntimeContext freeze and destruction.
- Safe failure behavior for persistence errors.

### Independent tests

- Finalization rejects any Q0–Q2 outcome.
- Studio source revision must equal the finalized Pipeline revision.
- Neither outcome is readable before the complete envelope is committed.
- Audit persistence succeeds before completion is published.
- RuntimeContext remains available during finalization and is destroyed afterward.
- A failed finalization never exposes partial success.
- Audit Log remains readable after context destruction.

### Independent review

Review atomicity, ordering, lifecycle guarantees, failure recovery, public/private boundaries, and audit completeness.

### Independent deployment

Deploy the complete Runtime and finalization stack internally. It can now complete all four Version 2 execution paths through internal interfaces.

### Exit criteria

Every successful internal execution produces two linked Q3 outcomes, one Audit Log, and no surviving active RuntimeContext.

---

## M18 — Public Backend API

### Objective

Expose the complete Runtime through the approved Version 2 execution-resource API without leaking internals.

### Deliverables

- Create execution operation.
- Submit clarification operation.
- Get execution status operation.
- Progress event operation.
- Get finalized dual outcomes operation.
- Optional member download/render routes backed by the same finalized envelope.
- Public error translation.
- Backend composition root and deployment health/readiness behavior.

### Independent tests

- API contracts match M01 exactly.
- Controllers never call engines, processors, Quality, or providers directly.
- Public statuses are limited to approved values.
- Q0–Q2 and internal revision details never appear publicly.
- Outcome endpoint remains unavailable until atomic finalization.
- Improve, Regenerate, direct-engine, prompt, RuntimeContext, Quality Report, and Audit Log operations do not exist.
- All four Studio formats complete through the same public execution lifecycle.

### Independent review

Review transport thinness, contract compatibility, error safety, composition, and full Runtime delegation.

### Independent deployment

Deploy as a complete backend service in staging. It is independently usable through API clients without the web application.

### Exit criteria

The entire Version 2 backend is production-complete and externally testable through approved API contracts.

---

## M19 — Web Request and Clarification Experience

### Objective

Deploy the first learner-facing UI for creating and clarifying requests while preserving Runtime ownership.

### Deliverables

- PyBe application shell and branding.
- Responsive light/dark theme foundation.
- Simple request mode.
- Progressive advanced preferences.
- Studio format selection limited to four approved paths.
- Educational Context and Surprise Me controls.
- Clarification panel driven only by backend requests.
- Safe request and validation errors.

### Independent tests

- Required inputs and labels match the public contract.
- Advanced controls remain optional and progressively disclosed.
- Frontend performs no educational inference.
- Surprise Me is passed as intent; the frontend does not choose randomly.
- Clarification remains attached to the same execution.
- No unsupported output, Improve, or Regenerate control appears.
- Responsive and theme behavior is consistent.

### Independent review

Review cognitive load, product identity, API-only state ownership, progressive disclosure, and absence of educational logic.

### Independent deployment

Deploy the request UI against the staging backend. Users can submit and clarify executions; unfinished result presentation is not publicly released.

### Exit criteria

The learner can correctly create every supported Version 2 request and answer required clarification through the web application.

---

## M20 — Web Progress and Dual-Outcome Experience

### Objective

Complete the learner-facing application with meaningful progress and final Pipeline/Studio presentation.

### Deliverables

- Educational progress timeline.
- Learner-safe long-running execution behavior.
- Pipeline Outcome renderer.
- Studio Markdown renderer.
- Unified dual-outcome result workspace.
- Copy and download presentation actions.
- Safe completion and failure experiences.
- New-request path without Regenerate.

### Independent tests

- Progress uses only public backend events.
- No internal engine output, prompt, Q0–Q2 report, revision, or provider detail appears.
- Results remain unavailable until both outcomes are finalized.
- Pipeline and Studio views render the same finalized envelope.
- Copy/download operate only on Q3 outcomes.
- The result is presented as an educational workspace, not a chat.
- Starting again creates a new execution.

### Independent review

Review learning-focused presentation, dual-outcome clarity, Markdown safety, progress semantics, responsive behavior, and strict public-data boundaries.

### Independent deployment

Deploy the complete PyBe web application independently against the Version 2 backend.

### Exit criteria

The complete learner journey works from request through clarification, progress, and delivery of both approved outcomes.

---

## M21 — Version 2 Release Candidate

### Objective

Produce the first complete, reviewable, and deployable Version 2 release candidate without changing the frozen architecture.

### Deliverables

- Complete backend and web deployment manifests.
- Full specification-compliance test execution.
- CKLIS Validation Suite execution for all supported Version 2 routes.
- Cross-provider conformance evidence where more than one provider is configured.
- Operational failure, recovery, and Audit Log verification.
- Architecture dependency and forbidden-feature audit.
- Release notes and traceability from milestone deliverables to Architecture Version 2.0.0.

### Independent tests

- End-to-end tests cover natural-language, structured, partial, conflicting, and clarification requests.
- Every educational engine and Quality revision path is exercised.
- Every Studio format reaches Q3 and returns both outcomes.
- Finalization is atomic under storage and provider failure conditions.
- RuntimeContext is destroyed after success and terminal failure.
- No forbidden product capability or dependency exists.
- The complete Validation Suite meets the agreed production-readiness threshold.

### Independent review

Conduct separate architecture, educational-quality, backend, frontend, operational, and product-scope reviews. Any architectural change request returns to the Evolution Engine rather than being hidden inside release work.

### Independent deployment

Deploy the complete Version 2 release candidate to the production-equivalent environment as one versioned system. Production promotion requires explicit release approval.

### Exit criteria

- All milestone exit criteria remain satisfied together.
- Architecture Version 2.0.0 compliance is proven.
- No placeholders, incomplete paths, or hidden scope additions remain.
- The system is ready for production approval.

---

# 4. Dependency Sequence

```text
M01 Contracts
  ↓
M02 Operational Foundation ─────┐
  ↓                             │
M03 AI / Knowledge / Prompts    │
  ↓                             │
M04 Quality Foundation          │
  ↓                             │
M05 Runtime / LES / Context ←───┘
  ↓
M06 Misconception
  ↓
M07 Mental Model
  ↓
M08 Scenario Intelligence
  ↓
M09 Pattern Mapping
  ↓
M10 Episode Generation
  ↓
M11 Pipeline Outcome + Gate
  ↓
M12 Studio Framework
  ├──→ M13 Comic
  ├──→ M14 One-Page Comic
  ├──→ M15 Video
  └──→ M16 Audio/Podcast
           ↓
M17 Finalization
  ↓
M18 Public Backend API
  ↓
M19 Request + Clarification UI
  ↓
M20 Progress + Result UI
  ↓
M21 Version 2 Release Candidate
```

M13–M16 may be developed in parallel after M12 because they share contracts but do not depend on one another. Their files and processor ownership must remain separate.

---

# 5. Milestone Review Gate

A milestone is complete only when:

1. Its stated deliverables are complete.
2. Its independent tests pass.
3. Its architecture and specification review passes.
4. Its deployable unit is successfully deployed to the appropriate environment.
5. No placeholder or incomplete behavior exists within its scope.
6. Public behavior remains disabled until all dependencies required for that public path are complete.
7. Traceability identifies the frozen architecture sections and official specifications implemented.
8. Any discovered architectural change is routed through the Evolution Engine before implementation continues.

---

# Milestone Plan Completion Statement

These milestones implement the frozen architecture from contracts and operational foundations through the Runtime, every educational engine, Quality, all four Studio paths, atomic dual-outcome finalization, the public backend, and finally the complete PyBe learner interface.

No implementation code is included in this plan.
