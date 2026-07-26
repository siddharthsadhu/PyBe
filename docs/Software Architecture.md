# PyBe / CKLIS Version 2 Software Architecture

**Architecture version:** 2.0.0  
**Status:** Approved and frozen  
**Approved by:** Product owner  
**Freeze date:** 2026-07-26  
**Freeze status:** Frozen  
**Product identity:** PyBe  
**Architectural identity:** Code Katha Learning Intelligence System (CKLIS)  
**Scope:** Complete Version 2 software architecture; no implementation code or framework selection

This document is the implementation boundary between the official CKLIS specifications and the future software. It defines responsibilities, contracts, execution flow, and dependency rules without selecting a programming language, framework, AI provider, database, cloud, or deployment platform.

Once approved, this exact architecture version is to be frozen. Any later behavioral or structural change must follow the Evolution Engine process and produce a new architecture version.

---

# 0. Authority, Scope, and Decisions

## 0.1 Source precedence

Architecture decisions are interpreted using this order:

1. Project Charter.
2. Constitution.
3. Learning Science.
4. Educational Engine specifications, including Quality and Evolution.
5. CKMS.
6. Learning Experience Specification (LES).
7. Software Product Requirements Specification (SPRS).
8. Runtime, prompt, schema, validation, and reference documents.
9. This architecture.

Explicit Version 2 product-owner decisions resolve remaining product ambiguity.

## 0.2 Version 2 product decisions encoded here

- PyBe and CKLIS are the same system. Learners see **PyBe**; engineering and architecture use **CKLIS**.
- Every successful execution first completes the generic CKLIS educational pipeline.
- Every successful execution produces and delivers two results:
  - **Pipeline Outcome:** the complete structured, representation-independent educational blueprint.
  - **Studio Outcome:** the representation-specific Markdown deliverable derived from the Pipeline Outcome.
- Version 2 Studio formats are exactly Comic, One-Page Comic, Video, and Audio/Podcast.
- Q0, Q1, and Q2 are internal only. Runtime automatically revises until Quality reaches Q3 or the execution fails safely.
- Improve is an internal automatic Quality-led process. There is no learner-facing Improve operation.
- Regenerate is removed. A fresh generation is a new request and a new execution.
- RuntimeContext lasts for one complete execution, including clarification, every Quality loop, and production of both outcomes.
- A separate persistent developer-readable Audit Log survives RuntimeContext destruction. Its retention period is intentionally unspecified.
- Accessibility standards are outside the current Version 2 implementation scope.

## 0.3 Out of scope

Version 2 does not introduce:

- Authentication, accounts, profiles, RBAC, or administration.
- Billing, analytics dashboards, marketplaces, notifications, or social features.
- Chat or conversation history.
- Prompt editors or learner-visible prompt controls.
- Engine registries or plugin marketplaces.
- Learner-facing RuntimeContext, Quality reports, Audit Logs, or provider diagnostics.
- Learner-facing Improve, Regenerate, or representation conversion.
- Direct image, audio, or video binary generation. Studio outputs are Markdown production deliverables.
- Accessibility-standard compliance work.

---

# 1. Overall Architecture

## 1.1 Architectural objective

PyBe transforms one learning request into an approved educational model and an approved representation-specific deliverable while preserving one educational intent across the entire execution.

**Pipeline Outcome** is the complete generic CKLIS result. It contains the resolved objective and the validated outputs of the Misconception, Mental Model, Scenario Intelligence, Pattern Mapping, Episode Generation, and generic Pipeline assembly stages. It is independent of Comic, Video, or Audio presentation mechanics.

**Studio Outcome** is a Markdown deliverable produced from the Q3-approved Pipeline Outcome through exactly one Version 2 Studio processor. It may change presentation, pacing, wording, and medium-specific direction, but it may not change approved educational reasoning.

Both outcomes are published as one finalized outcome envelope. Neither becomes publicly available before both are Q3-approved and finalization succeeds.

## 1.2 System context

```text
Learner
  ↓ intent, preferences, clarification answers
PyBe Web Application
  ↓ public execution contracts
API Application
  ↓ start/query execution
CKLIS Runtime
  ├── LES resolution and educational inference
  ├── RuntimeContext ownership
  ├── educational pipeline orchestration
  ├── Quality-led revision
  ├── Studio orchestration
  └── finalization
       ↓ invokes through contracts
Domain Modules
  ├── Educational Engines
  ├── Pipeline Outcome Assembler
  ├── Studio Processors
  └── Quality Engine
       ↓ use replaceable ports
Infrastructure Adapters
  ├── AI reasoning provider
  ├── specification and prompt resources
  ├── Audit Log persistence
  ├── finalized outcome persistence
  ├── progress transport
  └── diagnostics, identifiers, and clock
```

The Evolution Engine sits in the **governance plane**, not the per-request execution path. It governs approved changes to specifications, prompts, contracts, and architecture versions.

## 1.3 End-to-end execution

```text
Accept Learner Request
  ↓
Create Execution + RuntimeContext
  ↓
Interpret, Validate, and Normalize through LES
  ├── insufficient mandatory intent → Await Clarification in same execution
  └── resolvable → record defaults and inferences
  ↓
Construct CKMS Execution Context
  ↓
Misconception Engine → stage Quality checkpoint
  ↓ Q3
Mental Model Engine → stage Quality checkpoint
  ↓ Q3
Scenario Intelligence Engine → stage Quality checkpoint
  ↓ Q3
Pattern Mapping Engine → stage Quality checkpoint
  ↓ Q3
Episode Generation Engine → stage Quality checkpoint
  ↓ Q3
Pipeline Outcome Assembler
  ↓
Pipeline Quality Gate
  ├── Q0–Q2 → structured feedback → responsible stage → regenerate downstream
  └── Q3 → freeze approved Pipeline Outcome revision
  ↓
Studio Router
  ├── Comic: CP1 → CP2
  ├── One-Page Comic: 1_Page_Comic_Example
  ├── Video: VP1 → VP2
  └── Audio/Podcast: final script
  ↓
Studio Quality Gate
  ├── Q0–Q2 → structured feedback → responsible Studio stage or upstream stage
  └── Q3 → freeze approved Studio Outcome revision
  ↓
Finalization Transaction
  ├── verify both Q3 approvals and trace linkage
  ├── freeze the final outcome envelope
  ├── persist finalized outcomes
  ├── persist Audit Log
  └── mark execution complete
  ↓
Publish Both Outcomes Together
  ↓
Destroy RuntimeContext and temporary execution state
```

## 1.4 Mandatory invariants

1. Runtime is the sole execution and orchestration authority.
2. Exactly one RuntimeContext exists per execution.
3. Every request is interpreted through LES; natural-language requests do not bypass LES.
4. Explicit learner choices are preserved unless invalid or contradictory. Only omitted values may be inferred or defaulted.
5. The generic educational pipeline always runs before Studio processing.
6. Engine order is fixed for Version 2: Misconception → Mental Model → Scenario → Pattern → Episode.
7. Engines do not invoke one another and do not select execution order.
8. The Pipeline Outcome must reach Q3 before Studio processing begins.
9. The Studio Outcome must reach Q3 before finalization.
10. Q0–Q2 artifacts, reports, and feedback never appear in learner output, progress, or errors.
11. Quality never rewrites an artifact. The responsible producing module performs the revision.
12. A revised artifact invalidates and regenerates every dependent downstream artifact.
13. Studio processing preserves the educational identity of its source Pipeline Outcome.
14. Both outcomes are exposed atomically from one finalized outcome envelope.
15. Audit persistence succeeds before successful completion is published.
16. RuntimeContext is never reused by another request and is never reconstructed from an Audit Log.
17. Frontend and API contain no educational reasoning.
18. AI providers perform bounded reasoning; they do not own educational policy, retries, sequencing, or approval.
19. No implementation may add product capabilities absent from the approved scope.

## 1.5 Architectural styles

The system uses four complementary styles:

- **Runtime-centric architecture:** Runtime is the business and educational execution layer.
- **Ports and adapters:** provider, persistence, transport, resource loading, time, and identifiers remain replaceable.
- **Contract-based modules:** each engine, processor, and Quality evaluator exposes a bounded contract.
- **Revisioned artifact graph:** immutable artifact revisions and dependency links make correction and audit deterministic.

---

# 2. Folder Structure

This is the required logical source layout. It preserves the existing specification files as authoritative source material and separates them from future implementation code. Exact framework-generated subfolders may vary, but the boundaries below may not be collapsed.

```text
PyBe/
├── AGENTS.md
├── 00 - Project Charter.docx.md
├── 01 - Constitution.docx.md
├── 02- Learning Science.docx.md
├── 03 - Misconception Engine.docx.md
├── 04 - Mental Model Engine.docx.md
├── 05 – Scenario Intelligence Engine.docx.md
├── 06 – Pattern Mapping Engine.docx.md
├── 07 – Episode Generation Engine.docx.md
├── 08 – Production Engine.docx.md
├── 09 – Quality Engine.docx.md
├── 10 – Evolution Engine.docx.md
├── 11 – CKMS (Code Katha Model Specification).docx.md
├── 12 – Documentation Style Guide.docx.md
├── 13 - Learning Experience Specification.docx.md
├── 14 - Software Product Requirements Specification (SPRS).md
├── AI-01 Runtime.md
├── AI-02 Master Prompt.md
├── AI-03 Output Schema.md
├── AI-04 Prompt Library.md
├── CP1.md
├── CP2.md
├── 1_Page_Comic_Example.md
├── VP1.md
├── VP2.md
├── Software Architecture.md
│
└── software/
    ├── apps/
    │   ├── web/                         # Learner-facing PyBe presentation
    │   └── api/                         # Public transport and composition root
    │
    ├── contracts/
    │   ├── public-api/                  # Stable learner-facing envelopes
    │   ├── les/                         # Request and normalization contracts
    │   ├── execution/                   # State, progress, clarification, errors
    │   ├── runtime-context/             # RuntimeContext sections and lifecycle
    │   ├── engines/                     # Common and engine-specific interfaces
    │   ├── artifacts/                   # Artifact identity, revision, traceability
    │   ├── outcomes/                    # Pipeline, Studio, finalized envelope
    │   ├── quality/                     # Reports, Q-levels, feedback requests
    │   └── ports/                       # Provider, storage, resources, clock, IDs
    │
    ├── runtime/
    │   ├── execution/                   # Execution manager and state machine
    │   ├── intake/                      # Request interpretation and validation
    │   ├── normalization/               # LES resolution and defaults
    │   ├── context/                     # Context lifecycle and controlled merges
    │   ├── orchestration/               # Pipeline and Studio control flow
    │   ├── prompt-composition/           # Centralized prompt construction
    │   ├── revisions/                   # Failure attribution and invalidation
    │   ├── progress/                    # Learner-safe progress projection
    │   └── finalization/                # Atomic publication and destruction
    │
    ├── engines/
    │   ├── misconception/
    │   ├── mental-model/
    │   ├── scenario-intelligence/
    │   ├── pattern-mapping/
    │   └── episode-generation/
    │
    ├── production/
    │   ├── pipeline-outcome/            # Generic outcome assembly
    │   └── studio/
    │       ├── router/
    │       ├── comic/                   # CP1 → CP2
    │       ├── one-page-comic/          # Reference-example path
    │       ├── video/                   # VP1 → VP2
    │       └── audio-podcast/           # Final Markdown script
    │
    ├── quality/
    │   ├── stage-checkpoints/
    │   ├── pipeline-gate/
    │   ├── studio-gate/
    │   ├── feedback/
    │   └── reports/
    │
    ├── infrastructure/
    │   ├── ai-provider/
    │   ├── knowledge-resources/         # Read-only specifications
    │   ├── prompt-resources/            # Read-only Studio prompt assets
    │   ├── active-context/
    │   ├── finalized-outcomes/
    │   ├── audit-log/
    │   ├── progress-transport/
    │   ├── diagnostics/
    │   ├── identifiers/
    │   └── clock/
    │
    └── tests/
        ├── contracts/
        ├── runtime/
        ├── engines/
        ├── production/
        ├── quality/
        ├── api/
        ├── end-to-end/
        ├── architecture/
        └── specification-compliance/
```

Runtime data does not belong in source directories. Active contexts, finalized outcomes, and Audit Logs use deployment-managed storage through ports.

---

# 3. Runtime Architecture

## 3.1 Runtime components

| Component | Sole responsibility |
|---|---|
| Execution Manager | Own one execution from acceptance through completion or terminal failure |
| Execution State Machine | Enforce legal lifecycle transitions |
| Request Interpreter | Convert natural-language, partial, or structured input into a candidate LES |
| LES Resolver | Validate required fields, resolve compatible defaults, and normalize terminology |
| Clarification Coordinator | Ask only for mandatory information that cannot be safely inferred |
| Decision Recorder | Record defaults, inferences, compatibility decisions, and clarification history |
| CKMS Context Builder | Construct the validated educational execution context |
| RuntimeContext Manager | Create, expose bounded views, merge results, freeze, snapshot, and destroy context |
| Prompt Composer | Centrally compose authoritative knowledge, engine instructions, context, and schemas |
| Pipeline Orchestrator | Execute the fixed generic educational pipeline |
| Stage Checkpoint Coordinator | Validate each engine result before forward progress |
| Pipeline Outcome Assembler | Assemble the representation-independent Pipeline Outcome |
| Studio Router | Select the one resolved Version 2 Studio processor |
| Studio Coordinator | Execute the processor's required internal stages |
| Quality Coordinator | Invoke stage, Pipeline, and Studio Quality evaluations |
| Revision Coordinator | Attribute failures, create feedback, invalidate dependencies, and rerun affected stages |
| Progress Projector | Convert internal state into learner-safe progress events |
| Finalizer | Freeze, persist, publish, and trigger context destruction |

## 3.2 Legal execution states

```text
ACCEPTED
  → RESOLVING_LES
  → AWAITING_CLARIFICATION ↔ RESOLVING_LES
  → PIPELINE_RUNNING
  → PIPELINE_REVISING ↔ PIPELINE_RUNNING
  → PIPELINE_APPROVED
  → STUDIO_RUNNING
  → STUDIO_REVISING ↔ STUDIO_RUNNING
  → STUDIO_APPROVED
  → FINALIZING
  → COMPLETED
  → DESTROYED
```

Any nonrecoverable error may move the execution to `FAILED`, after which the Runtime writes available failure audit information and destroys temporary state. `COMPLETED` is legal only after both Q3 outcomes and the Audit Log have been durably written.

## 3.3 Intake and clarification

1. API accepts the request and trusted initiator metadata.
2. Runtime creates the execution ID and RuntimeContext immediately.
3. Request Interpreter creates a candidate LES without altering original input.
4. LES Resolver validates Educational Intent and Desired Output.
5. Missing optional information is inferred or defaulted where educationally safe.
6. Missing or conflicting mandatory information produces minimum clarification.
7. Clarification continues the same execution and RuntimeContext.
8. No educational engine starts until LES and CKMS context are valid.

The active context may remain in `AWAITING_CLARIFICATION`; timeout and abandoned-execution cleanup are deployment policies, not learner-visible educational behavior.

## 3.4 Generic pipeline

Runtime executes sequentially:

1. Misconception Engine.
2. Mental Model Engine.
3. Scenario Intelligence Engine.
4. Pattern Mapping Engine.
5. Episode Generation Engine.
6. Pipeline Outcome Assembler.

For every engine, Runtime:

- Builds the engine's bounded context view.
- Validates required inputs and upstream revisions.
- Composes the authoritative prompt internally.
- Invokes the engine through its contract.
- Validates result schema and traceability.
- Invokes the independent stage Quality checkpoint.
- Merges only a Q3-approved result into the current artifact graph.
- Records the artifact revision, specification versions, and decision path.

No engine may consume a future-stage artifact. Version 2 runs the educational engines sequentially.

## 3.5 Quality and revision

Quality classifications are authoritative:

| Level | Meaning | Runtime action |
|---|---|---|
| Q0 | Critical failure | Reject result; send structured feedback to the responsible producing module and re-execute |
| Q1 | Major issues | Send structured feedback to the responsible producing module and re-execute |
| Q2 | Minor issues / conditional approval | Send structured feedback to the responsible producing module and re-execute; conditional approval never advances or delivers |
| Q3 | Fully compliant | Permit forward progress or delivery |

Every Quality Report includes the evaluated artifact revision, applicable rules, dimension scores, failure classifications, evidence, responsible stage, required action, and final Q-level.

Revision procedure:

1. Quality identifies the earliest stage capable of correcting the root cause.
2. Runtime creates a structured feedback request for that stage.
3. The producing module creates a new artifact revision; Quality never edits it.
4. The old revision remains in append-only revision history and is marked superseded.
5. Every downstream artifact that consumed the old revision becomes invalid.
6. Runtime regenerates invalid downstream artifacts in normal order.
7. All applicable checkpoints and gates rerun.
8. Only a complete Q3 dependency chain can be finalized.

A Studio-only presentation failure reruns the affected Studio stage and Studio gate. A Studio finding caused by educational reasoning returns to the responsible educational stage, then rebuilds Pipeline and Studio outcomes.

Retry limits and provider retry mechanics are Runtime policy. Exhaustion produces a safe terminal failure; it never publishes Q0–Q2 content.

## 3.6 Pipeline Outcome

The Pipeline Outcome is assembled only from current Q3 educational artifact revisions. It contains:

- Execution and specification metadata.
- Resolved educational intent and one primary learning objective.
- Audience and prior-knowledge assumptions.
- Misconception Profile.
- Mental Model Specification.
- Scenario Specification.
- Pattern Mapping Specification.
- Episode Specification, including progression, practice, assessment, and reflection.
- Generic production blueprint and traceability.
- Q3 approval summary safe for delivery.

Private Quality reports, prompts, raw provider exchanges, hidden reasoning, and revision details are not part of the learner-facing Pipeline Outcome.

## 3.7 Studio routing and processing

Desired Output must resolve to exactly one Version 2 Studio format:

| Format | Processing path | Studio Outcome |
|---|---|---|
| Comic | Q3 Pipeline Outcome → CP1 → CP2 | Complete final comic-production Markdown prompt |
| One-Page Comic | Q3 Pipeline Outcome → `1_Page_Comic_Example` | Complete one-page comic Markdown prompt |
| Video | Q3 Pipeline Outcome → VP1 → VP2 | Complete final video-production Markdown prompt |
| Audio/Podcast | Q3 Pipeline Outcome → final-script processor | Complete Markdown script |

These are the complete Version 2 Studio routes. Unsupported Desired Outputs produce a safe validation response or minimum clarification; Runtime does not silently map them to another format.

Studio may adapt:

- Medium-specific structure and formatting.
- Pacing within resolved constraints.
- Visual, audio, scene, dialogue, and production direction.
- Wording and illustrative examples that preserve the approved model.

Studio may not change:

- Educational Intent or learning objective.
- Misconception coverage and correction strategy.
- Mental-model entities, relationships, rules, or behaviors.
- Scenario's educational function.
- Pattern mapping and transfer logic.
- Canonical episode progression.
- Practice, assessment, reflection, or success criteria.

## 3.8 Finalization

Finalization is one guarded publication operation:

1. Verify Pipeline Outcome is Q3 and references only current Q3 artifacts.
2. Verify Studio Outcome is Q3 and references that exact Pipeline Outcome revision.
3. Freeze RuntimeContext against further educational mutation.
4. Build one immutable finalized outcome envelope containing both outcomes.
5. Persist the finalized outcome envelope.
6. Persist the developer Audit Log from the frozen context.
7. Mark the execution `COMPLETED` and make the outcome envelope publicly retrievable.
8. Publish the completion event.
9. Destroy RuntimeContext and temporary provider/prompt state.

If outcome or Audit persistence fails, completion is not published. Runtime retries according to operational policy or fails safely. Partial outcome delivery is prohibited.

---

# 4. RuntimeContext

## 4.1 Purpose

RuntimeContext is the single authoritative, temporary execution state for one request. It carries the original intent, resolved decisions, revisioned artifact graph, Quality history, Studio state, and finalization state through every loop.

It is not a database record, HTTP request, UI store, provider session, or learner-visible document.

## 4.2 Conceptual structure

| Section | Required contents |
|---|---|
| Execution Identity | Execution ID, initiator, source, timestamps, phase, Runtime/CKLIS/CKMS/schema/prompt versions |
| Original Request | Exact natural-language or structured request received |
| LES State | Candidate LES, validation findings, clarification questions/answers, resolved LES |
| Resolved LES | Educational Intent, Desired Studio format, Audience, Context, language, duration, platform/profile, hints, constraints |
| Runtime Decisions | Inferences, defaults, objective, prior knowledge, difficulty, strategy, compatibility and routing decisions |
| Artifact Graph | Current and superseded revisions, dependencies, producing module, approval status |
| Educational Artifacts | Misconception, Mental Model, Scenario, Pattern Mapping, Episode |
| Pipeline Production | Pipeline candidate revisions, approval, metadata |
| Studio Production | Selected path, intermediate Studio stage results, candidate revisions, metadata |
| Quality State | Stage, Pipeline, and Studio reports; feedback; current Q-levels |
| Revision State | Attempts, root-cause attribution, invalidated dependencies, supersession history |
| Progress State | Internal state, learner-safe projection, event timestamps |
| Finalization State | Outcome IDs, persistence acknowledgements, audit state, publication state, destruction readiness |

## 4.3 Ownership and access

- Runtime alone creates, mutates, freezes, snapshots, and destroys RuntimeContext.
- Engines conceptually receive the current context but technically receive a read-only bounded view sufficient for their contract.
- Engines return structured results; Runtime performs the controlled context merge. This preserves the specification's receive–enrich–return model without transferring context ownership.
- Engines and processors retain no mutable state across invocations or executions.
- Quality receives the artifact plus the read-only evidence needed for evaluation.
- API, frontend, provider adapters, and prompt resources never receive the full context.
- No global mutable educational state is permitted.

## 4.4 Artifact and mutation rules

- Every artifact has an ID, type, revision, producer, specification version, upstream revision references, status, and Q-level.
- Approved artifact content is immutable.
- Revision creates a new artifact revision; it never edits history in place.
- RuntimeContext keeps one current pointer per artifact type.
- Superseded revisions remain available only inside execution history and Audit Log.
- Final outcomes reference only current Q3 revisions.
- Runtime decisions are append-only and include rationale references, not private chain-of-thought.

## 4.5 Lifecycle

```text
Created
  → LES unresolved/resolving
  → LES resolved
  → Pipeline active/revising
  → Pipeline Q3 approved
  → Studio active/revising
  → Studio Q3 approved
  → Frozen for finalization
  → Outcomes and Audit persisted
  → Completed and delivered
  → Destroyed
```

Backward movement occurs through new artifact revisions, not by mutating an approved revision or reusing a previous execution.

## 4.6 Persistence boundaries

Three lifecycles are distinct:

| Data | Lifecycle | Purpose |
|---|---|---|
| RuntimeContext | Temporary; one execution only | Active orchestration and revision state |
| Finalized Outcome Envelope | Persistent enough to support the public outcome resource | Atomic delivery of both approved outcomes |
| Audit Log | Persistent; retention intentionally unspecified | Developer inspection, governance, and execution reconstruction |

The Audit Log contains the original and resolved request, initiator metadata, runtime decisions, artifact revisions, checkpoints, Quality reports, feedback, execution order, final outcomes, failures, and timestamps. It excludes secrets, credentials, private chain-of-thought, and undocumented provider internals.

The Audit Log is not a backup from which RuntimeContext may be resumed for a new request.

---

# 5. Module Boundaries

## 5.1 Presentation

**Owns:** PyBe branding, request workspace, progressive disclosure, clarification UI, learner-safe progress, Markdown rendering, dual-outcome result workspace, copy/download presentation actions, light/dark visual theme, responsive behavior.

**Must not own:** educational inference, context selection logic, prompt composition, engines, Quality, retry policy, RuntimeContext, Audit Log access.

## 5.2 Public API application

**Owns:** transport parsing, syntactic validation, execution resource routing, status/event/outcome serialization, safe errors, composition of application dependencies.

**Must not own:** LES semantic interpretation, defaults, educational decisions, engine calls, Studio calls, Quality decisions, prompt construction.

## 5.3 Runtime core

**Owns:** execution lifecycle, LES resolution, CKMS context, RuntimeContext, decisions, prompt composition, orchestration, revision, progress projection, finalization, destruction.

**Must not own:** HTTP, browser rendering, provider-specific clients, physical persistence, framework-specific concerns.

## 5.4 Educational engines

**Own:** one domain-specific educational transformation and its structured result.

**Must not own:** orchestration, another engine, context persistence, representation production, Quality approval, transport, or learner delivery.

## 5.5 Pipeline Outcome Assembler

**Owns:** deterministic assembly of the complete generic educational blueprint from approved artifacts.

**Must not own:** new educational reasoning, Studio formatting, or approval.

## 5.6 Studio Production

**Owns:** format routing after Pipeline approval, application of authoritative Studio resources, medium-specific Markdown, and Studio traceability.

**Must not own:** changes to approved educational intent or educational artifact semantics.

## 5.7 Quality

**Owns:** independent stage audits, Pipeline and Studio gates, Q-levels, evidence, failure attribution, structured feedback, approval.

**Must not own:** artifact rewriting, execution sequencing, UI behavior, provider retry policy, or new learning objectives.

Quality Reports are internal. A learner-visible outcome may contain only a safe Q3 approval summary.

## 5.8 Infrastructure adapters

**Own:** AI provider calls, storage, resource loading, progress transport, diagnostics, clocks, and identifiers.

**Must not own:** educational rules, LES defaults, Quality thresholds, Studio selection policy, or product behavior.

## 5.9 Evolution governance plane

**Owns:** controlled specification and architecture change, evidence review, semantic versioning, compatibility analysis, approval history, and migration guidance.

**Must not own:** current-request revision or learner-output generation. Runtime Quality revision corrects an execution; Evolution changes future approved system versions.

---

# 6. Engine and Processor Interfaces

## 6.1 Common educational-engine interface

### Input envelope

| Field | Contract |
|---|---|
| Execution identity | Current execution, attempt, Runtime and specification versions |
| Engine identity | Engine name and contract version |
| Context view | Read-only fields authorized for this engine |
| Upstream artifacts | Exact current approved revisions required by the engine |
| Objective and learner assumptions | Resolved educational objective, audience, prerequisites, relevant constraints |
| Revision feedback | Structured Quality feedback for re-execution, when applicable |
| Output schema | Required structured artifact contract |

### Result envelope

| Field | Contract |
|---|---|
| Producer | Engine name and version |
| Artifact identity | Artifact ID, type, and revision |
| Structured result | Engine-specific output only |
| Upstream references | Exact revisions consumed |
| Validation evidence | Contract checks performed by the producing engine |
| Findings | Blocking and nonblocking issues, if any |
| Completion status | Completed, revision required, or failed |
| Execution metadata | Attempt and timing information |

Runtime rejects any result with missing required fields, unauthorized scope, invalid references, or an incompatible schema before merge.

## 6.2 Engine-specific boundaries

| Engine | Required view | Output artifact | Prohibited output |
|---|---|---|---|
| Misconception | Resolved LES, objective, audience, prerequisites | Prioritized Misconception Profile, causes, risks, correction strategies | Lesson, scenario, representation, final artifact |
| Mental Model | Objective, audience, prerequisites, approved Misconception Profile | Mental Model Specification: entities, relationships, rules, behaviors, analogies/visualization where valid | Scenario, episode, production artifact |
| Scenario Intelligence | Objective, audience, approved Mental Model, educational Context preference | Scenario Specification with observable events and educational mapping | Complete episode or Studio decisions |
| Pattern Mapping | Approved Mental Model and Scenario, objective, audience | Pattern Mapping Specification connecting observable, abstract, and programming patterns | New scenario, lesson, or representation choice |
| Episode Generation | All approved educational artifacts and duration constraints | Platform-neutral Episode Specification with progression, transitions, practice, assessment, reflection | Changing upstream educational decisions or selecting Studio format |

## 6.3 Pipeline Outcome Assembler interface

**Input:** all current Q3 educational artifact revisions, resolved LES, runtime decisions, and trace metadata.  
**Output:** a complete Pipeline Outcome candidate.  
**Prohibited:** new educational inference, silent omission of an approved artifact, representation-specific production.

## 6.4 Quality interface

**Input:** target artifact revision, applicable specifications and rules, upstream trace, and relevant read-only context.  
**Output:** Quality Report containing dimension scores, Q-level, failures, evidence, target/responsible stage, and required action.  
**Prohibited:** direct artifact modification.

## 6.5 Studio processor interface

**Input:** exact Q3 Pipeline Outcome revision, selected Studio format, applicable constraints/profile, versioned read-only Studio resources, and optional revision feedback.  
**Output:** Markdown Studio Outcome candidate, source Pipeline revision, processor/resource versions, intermediate-stage trace, and fidelity evidence.  
**Prohibited:** changing the educational identity of the Pipeline Outcome.

## 6.6 Infrastructure ports

Runtime and domain modules depend only on these capabilities:

- **AI Reasoning Port:** structured reasoning request and structured result; provider-neutral failures.
- **Knowledge Resource Port:** read-only, versioned official specification access.
- **Prompt Resource Port:** read-only, versioned Studio prompt/example access.
- **Active Context Port:** transient active-state support when required by the execution host.
- **Final Outcome Port:** atomic write/read of the dual-outcome envelope.
- **Audit Log Port:** durable write of Markdown or JSON execution audit.
- **Progress Port:** publication of learner-safe events.
- **Diagnostics Port:** technical diagnostics unavailable to learners.
- **Identifier and Clock Ports:** provider-neutral IDs and timestamps.

---

# 7. Public API Contracts

The API exposes execution resources only. It never exposes engines, prompts, RuntimeContext, internal Quality reports, or provider details.

## 7.1 Public execution status

| Status | Meaning |
|---|---|
| `accepted` | Execution and RuntimeContext created |
| `awaiting_clarification` | Mandatory LES information is required |
| `running` | Pipeline or Studio work is active |
| `finalizing` | Both outcomes are approved; persistence is in progress |
| `completed` | Both outcomes and Audit Log are persisted and outcomes are available |
| `failed` | No deliverable outcome is available |

Internal engine names, Q0–Q2 levels, attempts, and revision states are not public status values.

## 7.2 Create execution

**Operation:** `POST /api/v2/executions`

Accepted body forms:

- A natural-language learning request.
- A partially structured LES request.
- A fully structured LES request.

Required values before educational execution:

- Educational Intent.
- Desired Studio format: Comic, One-Page Comic, Video, or Audio/Podcast.

Optional values include Audience, Educational Context, programming language, duration, Production Profile, platform, experience hints, experience constraints, and additional output notes. Accessibility preferences are not implemented in Version 2.

Trusted host metadata includes initiator identity, request source, timestamp, and optional correlation ID.

**Response:** execution ID, public status, clarification requirement if known, status resource, event resource, and outcome resource.

Creation does not expose a partial artifact.

## 7.3 Submit clarification

**Operation:** `POST /api/v2/executions/{executionId}/clarifications`

The body contains answers only to Runtime-requested fields. A valid answer updates the same execution and RuntimeContext. The response returns public status and any remaining mandatory clarification.

## 7.4 Get execution

**Operation:** `GET /api/v2/executions/{executionId}`

Returns execution ID, public status, current learner-safe progress stage/message, clarification requirement, completion/failure information, and outcome availability.

## 7.5 Progress events

**Operation:** `GET /api/v2/executions/{executionId}/events`

The deployment may implement polling or streaming, but the public event meaning is stable.

| Internal work | Learner-facing stage |
|---|---|
| LES interpretation | Understanding Learning Goal |
| Misconception and Mental Model | Building Mental Model |
| Scenario and Pattern | Exploring Educational Context |
| Episode generation | Designing Learning Journey |
| Pipeline assembly | Creating Pipeline Outcome |
| Pipeline Quality and revisions | Reviewing Educational Quality |
| Studio processing | Creating Studio Outcome |
| Studio Quality and revisions | Reviewing Studio Quality |
| Persistence and finalization | Preparing Final Experience |

Events may include execution ID, stage, safe message, and timestamp. Percentage is optional and must reflect real state rather than elapsed-time guessing.

## 7.6 Get finalized outcomes

**Operation:** `GET /api/v2/executions/{executionId}/outcomes`

Available only when status is `completed`.

Returns one immutable envelope containing:

- Execution metadata safe for the learner.
- Complete Pipeline Outcome.
- Complete Studio Outcome in Markdown.
- Source relationship from Studio Outcome to Pipeline Outcome.
- Q3 approval summaries.

The entire resource appears atomically. Partial success is never a public state.

Optional rendering/download routes may expose the Pipeline or Studio member of the same finalized envelope, but only after combined finalization. They do not create independent outcome lifecycles.

## 7.7 Failure contract

A learner-visible failure contains:

- Execution ID.
- Safe category: invalid request, unsupported output, clarification required, or execution unavailable.
- Educationally meaningful message.
- Whether corrected input or a new request is required.

It excludes stack traces, prompts, provider errors, Quality reports, internal artifacts, credentials, and Audit Log details.

## 7.8 Deliberately absent Version 2 operations

No public operation exists for:

- Regenerate.
- Manual Improve.
- Change representation within an existing execution.
- Direct engine, Production, or Quality invocation.
- Prompt editing.
- RuntimeContext retrieval.
- Internal Quality Report retrieval.
- Learner Audit Log retrieval.

---

# 8. Frontend Architecture

## 8.1 Presentation composition

```text
PyBe Web Application
├── Application Shell
│   ├── PyBe identity
│   ├── theme and responsive layout
│   └── learner-safe error boundary
├── Request Workspace
│   ├── Simple Request
│   ├── Advanced Preferences
│   └── Clarification Panel
├── Execution Workspace
│   ├── educational progress timeline
│   └── safe guidance
└── Result Workspace
    ├── Pipeline Outcome view
    ├── Studio Outcome Markdown view
    └── copy/download presentation actions
```

## 8.2 Request workspace

Default visible controls:

- Learning Goal / Educational Intent.
- Desired Studio format.
- Target Audience.
- Educational Context or Surprise Me.

Advanced optional controls:

- Programming language.
- Duration.
- Production Profile or platform.
- Experience hints.
- Experience constraints.
- Additional output notes.

The frontend performs only syntactic required-field checks. Runtime decides semantic sufficiency, inference, defaults, Context selection, and compatibility.

## 8.3 Clarification experience

- Displays only fields requested by Runtime.
- Does not invent additional educational questions.
- Submits answers to the same execution.
- Preserves the execution ID and public state.

## 8.4 Progress experience

- Uses only public progress events.
- Uses educational labels rather than generic “thinking” or “generating” text.
- Never estimates hidden engine reasoning.
- Never displays Q0–Q2, revision details, prompts, or provider messages.
- Remains responsive during long execution.

## 8.5 Result workspace

The result is a crafted educational workspace, not a chat transcript.

**Pipeline view** renders the approved educational blueprint: objective, misconception profile, mental model, scenario, pattern mapping, episode plan, generic production blueprint, and safe approval summary.

**Studio view** renders the complete final Markdown deliverable for the selected format.

Only finalized Q3 outcomes can be copied or downloaded. Starting again creates a new request; there is no Regenerate or Improve control.

## 8.6 Frontend state boundary

Frontend state may contain form values, execution ID, public status/events, clarification questions/answers, and the finalized outcome envelope. It may not contain or reconstruct RuntimeContext, prompts, private Quality reports, engine communication, or provider state.

The backend finalized outcome resource, not browser state, is the source of truth after completion.

---

# 9. Backend Architecture

## 9.1 Components

| Component | Responsibility |
|---|---|
| API Controllers | Public transport contracts and syntactic validation |
| Execution Application Service | Start and query executions through the Runtime facade |
| Runtime Host | Run execution independently of HTTP request lifetime |
| Composition Root | Bind contracts and ports to implementations |
| Active Context Adapter | Support temporary context across long work and clarification |
| AI Provider Adapter | Replaceable structured reasoning capability |
| Knowledge Resource Adapter | Load official specifications read-only by version |
| Prompt Resource Adapter | Load CP1, CP2, one-page, VP1, VP2, and audio resources read-only |
| Final Outcome Store | Atomically persist/retrieve the finalized dual-outcome envelope |
| Audit Log Writer | Persist the complete developer execution record as Markdown or JSON |
| Progress Publisher | Publish learner-safe events supplied by Runtime |
| Diagnostics Adapter | Capture technical failures without learner leakage |

## 9.2 Hosting boundary

Backend accepts requests, supplies trusted request metadata, invokes Runtime, relays Runtime-owned progress, and returns finalized outcomes. Controllers never call individual engines or processors.

Runtime is reusable outside HTTP because it depends on contracts and ports rather than the web framework.

## 9.3 Data lifecycle

- Active RuntimeContext is transient and isolated per execution.
- Clarification does not create a second context.
- Final outcomes are immutable after publication.
- Audit Log is persistent and separate from the public outcome store.
- Audit retention is intentionally unspecified.
- Outcome retention and abandoned-execution cleanup are operational policies and do not alter educational behavior.
- No persistent learner profile or cross-request educational state exists.

## 9.4 AI-provider boundary

Provider adapters accept a bounded reasoning request assembled by Runtime and return a structured result. They translate provider failures into provider-neutral categories.

Provider adapters do not:

- Select engine order.
- Decide retries or Quality.
- Read unrestricted RuntimeContext.
- Persist educational state.
- expose provider identity, prompts, or raw responses to learners.

## 9.5 Prompt and specification governance

Official specifications and Studio prompt resources are immutable during an execution and pinned by version. Runtime records the versions used. Ad-hoc prompt mutation is prohibited.

Changes to approved specifications, prompt resources, contracts, or architecture follow the Evolution Engine and produce a versioned release.

---

# 10. Dependency Graph

## 10.1 Static source dependencies

The system uses dependency inversion. Control flow points outward to adapters at runtime, while source dependencies point inward to contracts and policy.

```text
Web Presentation
  └── depends on Public API Contracts

API Application
  ├── depends on Public API Contracts
  └── depends on Runtime Facade

Runtime Core
  ├── depends on LES / Execution / Artifact / Outcome Contracts
  ├── depends on Engine / Production / Quality Contracts
  └── depends on Infrastructure Ports

Educational Engine Implementations
  ├── depend on Engine and Artifact Contracts
  ├── depend on AI Reasoning Port
  └── depend on Knowledge Resource Port

Pipeline and Studio Implementations
  ├── depend on Production and Outcome Contracts
  ├── depend on AI Reasoning and Prompt Resource Ports where required
  └── depend on approved Artifact Contracts

Quality Implementation
  ├── depends on Quality and Artifact Contracts
  └── depends on Knowledge Resource Port

Infrastructure Adapters
  └── implement Infrastructure Ports

Composition Root
  └── wires Runtime, domain implementations, and adapters
```

Infrastructure implementations depend on port definitions; Runtime does not depend on concrete infrastructure.

## 10.2 Runtime control dependencies

```text
Execution Manager
  → LES Resolver / Clarification Coordinator
  → CKMS Context Builder
  → Pipeline Orchestrator
      → Misconception Engine → Stage Quality
      → Mental Model Engine → Stage Quality
      → Scenario Engine → Stage Quality
      → Pattern Engine → Stage Quality
      → Episode Engine → Stage Quality
      → Pipeline Outcome Assembler
      → Pipeline Quality Gate
          ↘ failure → Revision Coordinator → responsible stage
  → Studio Router
      → selected Studio Processor
      → Studio Quality Gate
          ↘ failure → Revision Coordinator → Studio or educational stage
  → Finalizer
      → Final Outcome Port
      → Audit Log Port
      → Progress Port
      → RuntimeContext destruction
```

## 10.3 Artifact dependency graph

```text
Resolved LES
  ├──→ Misconception Profile
  │       ↓
  ├──→ Mental Model Specification
  │       ↓
  ├──→ Scenario Specification
  │       ↓
  ├──→ Pattern Mapping Specification
  │       ↓
  └──→ Episode Specification
          ↓
      Pipeline Outcome
          ↓
      Selected Studio Path
          ↓
      Studio Outcome
          ↓
      Finalized Outcome Envelope
```

Each edge stores exact artifact revision IDs. Revision invalidation follows outgoing edges from the revised artifact.

## 10.4 Prohibited dependencies

- Presentation → Runtime internals, engines, Quality, providers, or prompt resources.
- API controller → individual engine, Studio processor, Quality evaluator, or provider.
- Engine → another engine, RuntimeContext storage, frontend, API, or finalization.
- Studio processor → mutation of approved educational artifacts.
- Quality → direct artifact mutation.
- Runtime core → concrete provider, storage, transport, clock, or ID implementation.
- Infrastructure adapter → educational policy or Quality decisions.
- AI provider → orchestration or approval.
- Audit Log → restoration or reuse of RuntimeContext for a new request.
- Evolution governance → mutation of an in-flight execution's pinned specifications.

---

# 11. Architecture Review and Freeze Gate

## 11.1 Review performed

This architecture was reviewed against the complete project set, including the Charter, Constitution, Learning Science, all educational and governance engines, CKMS, LES, SPRS, Runtime, Master Prompt, Output Schema, Prompt Library, Studio resources, Validation Suite, Release Notes, Reference Manual, examples, and recorded Version 2 product decisions.

The review resolved these architectural risks:

- Clarification now occurs inside the same execution and RuntimeContext.
- Quality checkpoints exist at every engine boundary, not only after Production.
- Q2 conditional approval remains internal and cannot advance to delivery.
- Pipeline assembly and representation-specific Studio Production are separate responsibilities.
- The Evolution Engine is placed in the governance plane rather than the request path.
- Final outcome persistence is distinct from temporary RuntimeContext and developer Audit Log persistence.
- Atomic dual-outcome publication has a defined completion boundary.
- Static dependencies use ports and adapters rather than a misleading infrastructure-downward chain.
- RuntimeContext ownership is preserved while engines still satisfy the conceptual receive–enrich–return contract.
- Version 2 format limits and the removal of Improve/Regenerate are explicit.

## 11.2 Approval checklist

The architecture is ready for approval only if all answers remain **Yes**:

- Does Runtime remain the sole execution authority? **Yes**
- Does every request pass through LES and CKMS context construction? **Yes**
- Does the complete generic educational pipeline always precede Studio? **Yes**
- Are engines independent and non-orchestrating? **Yes**
- Is RuntimeContext singular, temporary, isolated, and auditable? **Yes**
- Does Quality independently gate every stage and both outcomes? **Yes**
- Are only Q3 artifacts deliverable? **Yes**
- Are both Pipeline and Studio outcomes delivered atomically? **Yes**
- Are Version 2 Studio paths exactly the four approved paths? **Yes**
- Are Improve and Regenerate absent from the learner contract? **Yes**
- Are frontend and API free of educational reasoning? **Yes**
- Are provider and infrastructure implementations replaceable? **Yes**
- Is the Evolution Engine separated from per-execution revision? **Yes**
- Does the design avoid every forbidden product assumption? **Yes**

## 11.3 Frozen architecture rule

This document was approved by the product owner and frozen as Architecture Version 2.0.0 on 2026-07-26.

From this point:

1. Module boundaries, contracts, lifecycle, dual outcomes, Quality gates, and dependency rules are immutable for Version 2.0.0.
2. Implementation milestones and code must conform to this frozen version.
3. Any proposed architectural change must follow the Evolution Engine with impact, compatibility, migration, and approval records.
4. An approved change must produce a new architecture version; this frozen version is never edited in place to conceal architectural change.
5. Editorial corrections that do not change behavior must still be recorded under the Evolution Engine's traceability rules.

---

# Architecture Completion Statement

The Version 2 software architecture is complete when the system can be implemented so that one learner request creates one isolated Runtime execution, the full generic CKLIS educational pipeline reaches Q3, one approved Studio path produces a Q3 Markdown deliverable, both outcomes are finalized and exposed together, a persistent developer Audit Log is written, and the active RuntimeContext is destroyed.

No implementation is contained in this document. Architecture Version 2.0.0 is approved and frozen.
