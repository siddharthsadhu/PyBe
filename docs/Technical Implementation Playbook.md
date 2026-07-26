# PyBe / CKLIS Version 2 — Technical Implementation Playbook

**Document version:** 1.0.0  
**Architecture baseline:** Software Architecture Version 2.0.0 (frozen 2026-07-26)  
**Milestones baseline:** Implementation Milestones Plan Version 1.0.0  
**Status:** Authoritative implementation guide  
**Scope:** All milestones M01–M21; no implementation code; no language, framework, provider, or database prescription beyond what the frozen architecture itself mandates

---

## 0. How to Use This Document

This playbook is the single engineering reference for a fresh AI coding agent or human engineer joining this project at any point. It explains *how* to build CKLIS Version 2, *why* each decision was made, *what* must not change, and *exactly* what to do at each milestone.

Read this document before writing a single line of implementation. Do not skip sections. Every section is load-bearing. If something in this playbook conflicts with the frozen architecture (`Software Architecture.md`), the frozen architecture wins. If something in this playbook conflicts with the milestone plan (`Implementation Milestones.md`), the milestone plan wins. The playbook amplifies and operationalises those documents; it does not override them.

This playbook does not replace the project specifications (files 00–14, AI-01–AI-04, CP1, CP2, VP1, VP2, and the reference examples). Those specifications define *what* CKLIS educationally does. This playbook defines *how* to implement it and *in what order*.

---

## 1. Authoritative Source Order

Before making any implementation decision, consult the sources in the following order. A higher source overrides a lower one.

| Priority | Source | Path |
|---|---|---|
| 1 | Project Charter | `00 - Project Charter.docx.md` |
| 2 | Constitution | `01 - Constitution.docx.md` |
| 3 | Learning Science | `02- Learning Science.docx.md` |
| 4 | Educational Engine specifications (Misconception, Mental Model, Scenario, Pattern, Episode, Production, Quality, Evolution) | `03`–`10` |
| 5 | CKMS | `11 – CKMS (Code Katha Model Specification).docx.md` |
| 6 | Learning Experience Specification (LES) | `13 - Learning Experience Specification.docx.md` |
| 7 | Software Product Requirements Specification (SPRS) | `14 - Software Product Requirements Specification (SPRS).md` |
| 8 | Runtime, prompt, schema, validation, and reference documents | `AI-01`, `AI-02`, `AI-03`, `AI-04`, `CKLIS Validation Suite v2.0.md`, `CKLIS Version 2.0 Release Notes.md`, `Reference Manual.md` |
| 9 | Frozen Software Architecture | `Software Architecture.md` |
| 10 | Studio prompt and reference resources | `CP1.md`, `CP2.md`, `1_Page_Comic_Example.md`, `VP1.md`, `VP2.md` |
| 11 | This playbook | `Technical Implementation Playbook.md` |
| 12 | Implementation Handoff Ledger | `Implementation Handoff Ledger.md` |
| 13 | AGENTS.md engineering contract | `AGENTS.md` |

**Resolution rule.** When two sources appear inconsistent, identify the inconsistency, apply the precedence table, and continue only when the correct implementation path is unambiguous. Never invent behaviour. Never silently ignore a source. The frozen architecture's explicit Version 2 decisions govern implementation where older Version 1 wording remains in a lower product or runtime document—for example, the removal of learner-facing Improve and Regenerate. If genuine ambiguity remains, record it in the Handoff Ledger's Decision / Change Log and apply the CKLIS ambiguity-resolution process before proceeding.

---

## 2. Frozen Architecture Constraints

Architecture Version 2.0.0 was approved by the product owner and frozen on 2026-07-26. The following rules are immutable for Version 2.

### 2.1 Structural invariants that may never be violated

1. The Runtime is the sole execution and orchestration authority. No other layer may own educational reasoning, retry policy, Quality approval, or execution sequencing.
2. Exactly one RuntimeContext exists per execution. It is created when the execution is accepted and destroyed after both outcomes and the Audit Log are durably written.
3. Every request is interpreted through LES and CKMS context construction before any engine runs. Natural-language requests do not bypass LES.
4. Explicit learner choices are preserved. Only omitted values may be inferred or defaulted.
5. The complete generic educational pipeline (Misconception → Mental Model → Scenario → Pattern → Episode) always runs and reaches Q3 before Studio processing begins.
6. Engine execution order for Version 2 is fixed: Misconception, Mental Model, Scenario Intelligence, Pattern Mapping, Episode Generation. Engines do not orchestrate one another and do not select their own execution order.
7. Quality independently gates every engine stage, the Pipeline Outcome, and the Studio Outcome. Q0, Q1, and Q2 results may never advance or be delivered.
8. Quality never rewrites an artifact. The responsible producing module performs the revision.
9. A revised artifact invalidates every downstream artifact that consumed it. Downstream artifacts are regenerated in normal order.
10. Both the Pipeline Outcome and the Studio Outcome must reach Q3 before finalization. They are delivered atomically as one finalized outcome envelope.
11. The Studio Outcome preserves the educational identity of its source Pipeline Outcome. Studio processing may adapt medium-specific structure, pacing, wording, and production direction only.
12. Audit Log persistence succeeds before the execution is marked COMPLETED or the completion event is published.
13. RuntimeContext is never reused by another request and is never reconstructed from an Audit Log.
14. Frontend and API contain no educational reasoning, no direct engine calls, no Quality logic, and no prompt construction.
15. AI providers perform bounded reasoning; they do not own educational policy, retries, sequencing, or approval.
16. No implementation may add capabilities that are absent from the approved Version 2 scope (see Section 0.3 of the frozen architecture for the full out-of-scope list).

### 2.2 Version 2 product decisions encoded in the architecture

These decisions were made by the product owner and are architectural constants:

- **Dual branding:** learners see **PyBe**; internal engineering uses **CKLIS**.
- **Dual outcomes:** every successful execution produces a **Pipeline Outcome** (representation-independent educational blueprint) and a **Studio Outcome** (format-specific Markdown deliverable). Both are always produced; neither is optional.
- **Four Studio paths, no others:** Comic (CP1 → CP2), One-Page Comic (reference-example path), Video (VP1 → VP2), Audio/Podcast (final-script processor). Any request whose Desired Output cannot resolve to exactly one of these four produces a safe validation response or minimum clarification.
- **Q3-only delivery:** Q0, Q1, and Q2 are internal Quality levels only. They never appear in public status, public progress events, public errors, or any learner-visible output.
- **Improve is automatic and internal:** Quality-led internal revision is the only form of Improve. There is no learner-facing Improve operation. No public API endpoint for Improve exists.
- **Regenerate is removed:** a new attempt at the same topic is a new request and a new execution. No public API endpoint or frontend control for Regenerate exists.
- **One RuntimeContext per execution:** this context spans clarification, every Quality loop, and production of both outcomes. It is not a per-engine context or a per-request-attempt context.
- **Persistent Audit Log:** a separate developer-readable record (Markdown or JSON) that survives RuntimeContext destruction. Retention period is intentionally unspecified.
- **Accessibility standards:** outside Version 2 implementation scope. No accessibility-standard compliance work is required for V2.

### 2.3 Legal execution state machine

```
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

Any nonrecoverable error at any state moves to `FAILED`. From `FAILED` the Runtime writes available failure audit information and destroys temporary state. `COMPLETED` is legal only after both Q3 outcomes and the Audit Log are durably written.

Clarification does not create a new execution or a new RuntimeContext. It continues the same execution.

### 2.4 Changes to the frozen architecture

Any proposed change to module boundaries, contracts, lifecycle, Quality gates, or dependency rules must follow the Evolution Engine process (`10 – Evolution Engine.docx.md`). The result must be a new architecture version. This frozen document (2.0.0) is never edited in place. Implementation work may not proceed until an Evolution Engine review is complete and a new architecture version is approved.

---

## 3. Implementation Philosophy

### 3.1 The Runtime is the product

CKLIS is not a chatbot, course platform, content generator, or prompt wrapper. It is an Educational Intelligence Runtime. The Runtime owns educational reasoning, orchestration, RuntimeContext, Quality validation, and production coordination. Every engineering decision must preserve this philosophy.

### 3.2 Educational philosophy governs engineering decisions

When multiple technically valid solutions exist, evaluate them in this order:
1. Educational philosophy preserved?
2. Runtime integrity preserved?
3. Product behaviour preserved?
4. Software simplicity favoured?
5. Maintainability favoured?
6. Performance favoured?

Developer convenience never overrides educational integrity.

### 3.3 Forbidden assumptions

Never introduce functionality because it is common in modern software. The following must not be implemented unless explicitly required by the specifications: authentication, user profiles, RBAC, administration portals, billing, analytics dashboards, marketplaces, notifications, chat interface, conversation history, prompt editors, engine registries. Absence from the specification means absence from the software.

### 3.4 Zero placeholder policy

Every generated component must contain complete implementation within its declared scope. No TODOs, FIXMEs, placeholder functions, empty methods, pseudo-implementations, dummy services, or `implement later` comments are permitted. A milestone is production-complete within its scope or it is not complete.

### 3.5 Simplicity rule

When two solutions satisfy the specifications equally, choose the simpler one. Simpler means fewer moving parts, fewer dependencies, clearer ownership, easier maintenance, and lower cognitive load — not fewer educational capabilities.

### 3.6 Specification fidelity

Implement what the specification says. Never add functionality because it seems useful, is common elsewhere, or another framework provides it.

---

## 4. Recommended Agent Startup and Read Order

A fresh AI engineering agent beginning work on this project must load these resources in this order before architecture or implementation begins. Do not start any milestone work until all resources are loaded and understood.

**Step 1 — Project identity and philosophy**
Read `00 - Project Charter.docx.md` and `01 - Constitution.docx.md`. Understand what CKLIS is, what it is not, and the non-negotiable educational principles.

**Step 2 — Learning science foundations**
Read `02- Learning Science.docx.md`. These principles become active engineering constraints throughout all implementation.

**Step 3 — Engine specifications**
Read `03` through `10` in order (Misconception, Mental Model, Scenario, Pattern, Episode, Production, Quality, Evolution). Understand each engine's domain, responsibilities, inputs, and outputs.

**Step 4 — CKMS and LES**
Read `11 – CKMS` and `13 - Learning Experience Specification.docx.md`. Understand how learner requests are modelled and how execution contexts are constructed.

**Step 5 — SPRS and runtime documents**
Read `14 - Software Product Requirements Specification (SPRS).md`, `AI-01 Runtime.md`, `AI-02 Master Prompt.md`, `AI-03 Output Schema.md`, `AI-04 Prompt Library.md`.

**Step 6 — Studio resources**
Read `CP1.md`, `CP2.md`, `1_Page_Comic_Example.md`, `VP1.md`, `VP2.md`. Understand the exact structure and intent of each Studio production resource.

**Step 7 — Architecture and milestones**
Read `Software Architecture.md` in full. Then read `Implementation Milestones.md` in full. These two documents define the entire implementation boundary.

**Step 8 — Supporting documents**
Read `CKLIS Version 2.0 Release Notes.md`, `CKLIS Validation Suite v2.0.md`, `Reference Manual.md`, `AGENTS.md`.

**Step 9 — Handoff Ledger**
Read `Implementation Handoff Ledger.md`. Identify the current milestone, any completed work, active blockers, and the resume protocol.

**Step 10 — Begin the current milestone**
Locate the current milestone in this playbook. Read its entire procedure before doing any implementation.

---

## 5. Technical Decisions: Fixed vs Intentionally Deferred

### 5.1 Fixed by the frozen architecture (do not decide, do not change)

| Decision | Value |
|---|---|
| Number of Studio formats | Exactly four: Comic, One-Page Comic, Video, Audio/Podcast |
| Engine execution order | Misconception → Mental Model → Scenario → Pattern → Episode |
| Outcome model | Dual outcomes (Pipeline + Studio), always both, always atomic |
| Quality gate model | Stage checkpoints + Pipeline gate + Studio gate; Q3-only advancement |
| Improve model | Internal, automatic, Quality-led; no learner-facing Improve |
| Regenerate | Removed; not a public operation |
| RuntimeContext scope | One per execution; destroyed after finalization |
| Audit Log | Separate from RuntimeContext; persists after destruction |
| Audit Log format | Markdown or JSON (either is acceptable) |
| Audit Log retention | Intentionally unspecified |
| Public API shape | Six approved operations only (create, clarify, get, events, outcomes, and optional download routes backed by the same envelope) |
| Public execution statuses | `accepted`, `awaiting_clarification`, `running`, `finalizing`, `completed`, `failed` only |
| Learner-visible progress labels | Exactly the nine labels defined in Section 7.5 of the frozen architecture |
| Studio processing constraint | May adapt medium-specific concerns only; may not change educational identity |
| Finalization constraint | Persist the atomic dual-outcome envelope, then persist the Audit Log; publish completion only after both succeed; partial success is never public |
| Dependency direction | Source dependencies point inward to contracts and ports; infrastructure adapters implement ports; Runtime orchestrates engines, Production, and Quality without depending on concrete adapters |
| Provider independence | Runtime depends on the AI Reasoning Port contract, not any named provider |
| Clarification model | Continues the same execution and RuntimeContext; does not create new context |
| Q2 behaviour | Never advances or delivers; always treated as failing; conditional approval does not exist externally |

### 5.2 Intentionally deferred (decide during implementation)

| Decision | Constraint |
|---|---|
| Programming language | Any language that satisfies the architectural contracts and quality standards |
| Web framework | Any framework compatible with the ports-and-adapters boundary |
| AI provider selection | Must be behind the AI Reasoning Port; provider identity must not leak to learners |
| Database and storage technology | Must satisfy the atomicity, isolation, and lifecycle guarantees of Sections 4.6 and 9.3 of the frozen architecture |
| Deployment platform and cloud | Must support the operational model without altering educational behaviour |
| Retry limits and provider retry mechanics | Runtime policy, not architectural constants; set conservatively and record in Audit Log |
| Active context storage mechanism | Must support temporary execution state and cross-request clarification continuity; implementation technology is free |
| Progress transport (polling vs. streaming) | Either is acceptable; the public event meaning is stable regardless of transport |
| Audit Log retention period | Intentionally unspecified; set as operational policy |
| Abandoned-execution cleanup | Operational policy; must not alter educational behaviour |
| Outcome retention period | Operational policy |
| Specific Quality scoring thresholds within each Q-level | Must be grounded in the Quality Engine specification; exact numeric thresholds are an implementation decision |

---

## 6. Global Definition of Done

A milestone is done only when every item on this checklist is satisfied. Partial completion is not done.

**Functional completeness**
- [ ] All stated deliverables for the milestone are fully implemented within scope.
- [ ] No TODOs, placeholders, fake logic, or incomplete public paths exist.
- [ ] All milestone exit criteria are satisfied.

**Contract conformance**
- [ ] Every new component exposes a versioned contract aligned with the M01 contract package.
- [ ] No contract field leaks runtime internals, provider details, prompts, or private Quality reports.
- [ ] Dependency direction rules are satisfied (no reverse dependencies).

**Test passage**
- [ ] All independent tests defined for the milestone pass.
- [ ] Architecture dependency checks pass.
- [ ] Specification-compliance checks pass where applicable.

**Review passage**
- [ ] The review defined for the milestone has been conducted and its evidence is recorded.
- [ ] Any architectural change discovered during the milestone has been routed to the Evolution Engine before implementation continues.

**Deployment**
- [ ] The deployable unit has been successfully deployed to the appropriate environment.
- [ ] Deployment validation steps have been executed and passed.

**Traceability**
- [ ] Implementation is traceable to specific frozen architecture sections and official specifications.
- [ ] Any decisions made are recorded in the Handoff Ledger.

**Handoff**
- [ ] The Handoff Ledger has been updated: milestone status, artifact versions, test evidence, review evidence, and deployment record.

---

## 7. Repository and Environment Rules

### 7.1 Folder structure

The logical source layout is mandated by the frozen architecture (Section 2 of `Software Architecture.md`). The following top-level boundaries must be preserved exactly and may not be collapsed or renamed:

```
software/
├── apps/
│   ├── web/
│   └── api/
├── contracts/
│   ├── public-api/
│   ├── les/
│   ├── execution/
│   ├── runtime-context/
│   ├── engines/
│   ├── artifacts/
│   ├── outcomes/
│   ├── quality/
│   └── ports/
├── runtime/
│   ├── execution/
│   ├── intake/
│   ├── normalization/
│   ├── context/
│   ├── orchestration/
│   ├── prompt-composition/
│   ├── revisions/
│   ├── progress/
│   └── finalization/
├── engines/
│   ├── misconception/
│   ├── mental-model/
│   ├── scenario-intelligence/
│   ├── pattern-mapping/
│   └── episode-generation/
├── production/
│   ├── pipeline-outcome/
│   └── studio/
│       ├── router/
│       ├── comic/
│       ├── one-page-comic/
│       ├── video/
│       └── audio-podcast/
├── quality/
│   ├── stage-checkpoints/
│   ├── pipeline-gate/
│   ├── studio-gate/
│   ├── feedback/
│   └── reports/
├── infrastructure/
│   ├── ai-provider/
│   ├── knowledge-resources/
│   ├── prompt-resources/
│   ├── active-context/
│   ├── finalized-outcomes/
│   ├── audit-log/
│   ├── progress-transport/
│   ├── diagnostics/
│   ├── identifiers/
│   └── clock/
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

The specification files (00–14, AI-01–AI-04, CP1, CP2, VP1, VP2, examples, architecture, milestones, playbook, ledger) remain in the `PyBe/` root. They are never modified by implementation work.

Runtime data (active contexts, finalized outcomes, Audit Logs) must not be stored inside source directories. They use deployment-managed storage through ports.

### 7.2 Specification files are read-only

The specification files are immutable reference material for implementation. An AI agent must never write to, rename, or delete these files during implementation work. Any required change must go through the Evolution Engine and produce a new specification version.

### 7.3 Version pinning

Every execution records the exact versions of: Runtime, CKLIS, CKMS, all engine schemas, all Studio resource files, and the architecture. These are recorded in the execution metadata and Audit Log. Mismatched versions must fail safely rather than silently produce incorrect output.

### 7.4 Secrets and credentials

Secrets, API keys, tokens, and credentials must never appear in source code, specification files, contract definitions, Audit Logs, or the Handoff Ledger. Provider credentials must be injected through the deployment environment and accessed only by infrastructure adapters through the AI Reasoning Port. Leakage to learner-visible output is strictly prohibited.

---

## 8. Contract and Versioning Strategy

### 8.1 Contract-first development

All contracts are established in M01 before any implementation begins. Every subsequent milestone must consume those contracts exactly. No component may depend on another component's internal implementation; it must depend only on the published contract.

### 8.2 Versioning scheme

Contracts, engines, processors, the Runtime, the public API, and Studio resources each carry a version identifier. All version identifiers follow semantic versioning: `MAJOR.MINOR.PATCH`.

- A `MAJOR` bump indicates a breaking change to the contract interface.
- A `MINOR` bump indicates a backward-compatible addition.
- A `PATCH` bump indicates a backward-compatible correction.

Architecture Version 2.0.0 pins the overall system identity. Component versions may increment independently within the lifetime of architecture version 2.0.0.

### 8.3 Backward compatibility rule

A component may not break a published contract without a version bump. A consuming component specifies the minimum compatible version it requires. The composition root is responsible for wiring compatible versions together.

### 8.4 Prohibited contract contents

Public contracts (especially `contracts/public-api/`, `contracts/outcomes/`) must never contain:

- RuntimeContext fields, sections, or pointers.
- Internal engine names or execution states (Q0, Q1, Q2, revision counts, attempt numbers).
- Raw prompt text or prompt assembly details.
- Provider names, credentials, or diagnostic information.
- Private Quality reports or failure evidence.
- Audit Log contents.

### 8.5 Contract immutability during execution

Official specification and Studio prompt resources are immutable during an execution and pinned by version. Ad-hoc mutation of prompt or specification resources during execution is prohibited.

---

## 9. Artifact and Revision Model

### 9.1 Every artifact carries identity

Every educational artifact (Misconception Profile, Mental Model Specification, Scenario Specification, Pattern Mapping Specification, Episode Specification, Pipeline Outcome, Studio Outcome) must carry:

- Artifact ID.
- Artifact type.
- Revision number.
- Producing module name and version.
- Specification version(s) consumed.
- Exact upstream artifact revision IDs consumed.
- Status (draft, Q3 approved, superseded).
- Q-level.

### 9.2 Immutability of approved content

Once an artifact revision reaches Q3 approval, its content is immutable. Revision creates a new artifact revision; it never edits an existing revision in place.

### 9.3 Append-only revision history

RuntimeContext keeps a pointer to the current revision for each artifact type, but all previous revisions remain in append-only execution history. Superseded revisions are marked superseded and remain available in the Audit Log.

### 9.4 Dependency graph and downstream invalidation

Artifact dependencies follow this chain:

```
Resolved LES
  ↓
Misconception Profile
  ↓
Mental Model Specification
  ↓
Scenario Specification
  ↓
Pattern Mapping Specification
  ↓
Episode Specification
  ↓
Pipeline Outcome
  ↓
Studio Outcome (one of four paths)
  ↓
Finalized Outcome Envelope
```

When an artifact revision is superseded, every downstream artifact that consumed it becomes invalid and must be regenerated in normal order. The Revision Coordinator is responsible for attributing the failure, invalidating dependencies, and directing re-execution.

### 9.5 Final outcomes reference only Q3 revisions

The Finalized Outcome Envelope may only reference artifact revisions whose status is Q3 approved. Any Q0, Q1, or Q2 revision is excluded from final outcomes.

---

## 10. Testing Pyramid and Fixture Rules

### 10.1 Testing layers

Tests are organized by the folder structure under `tests/`:

| Layer | Location | Purpose |
|---|---|---|
| Contract tests | `tests/contracts/` | Structural validity, versioning, prohibited-field checks, boundary envelopes |
| Architecture tests | `tests/architecture/` | Dependency direction enforcement; no reverse dependencies; no prohibited imports |
| Unit/engine tests | `tests/engines/` | Deterministic output for fixed inputs; Quality revision loops; scope constraints |
| Production tests | `tests/production/` | Assembler completeness; Studio fidelity; revision scope |
| Quality tests | `tests/quality/` | Q-level classification; evidence; feedback completeness; no mutation |
| Runtime tests | `tests/runtime/` | State machine transitions; intake logic; LES resolution; context ownership |
| API tests | `tests/api/` | Contract conformance; prohibited operations absent; error safety |
| Specification-compliance tests | `tests/specification-compliance/` | Compliance with CKLIS Validation Suite v2.0 |
| End-to-end tests | `tests/end-to-end/` | Full executions through all four Studio paths; failure and recovery paths |

### 10.2 Fixture rules

- Fixtures must be deterministic. Tests that depend on live AI provider calls are integration probes, not unit tests.
- Educational fixture content must come from the approved Validation Suite (`CKLIS Validation Suite v2.0.md`) wherever applicable.
- Negative fixtures (invalid contracts, missing fields, wrong versions, Q0/Q1/Q2 responses) are mandatory for every component, not optional.
- Provider fixtures must use stubbed or contract-compliant fake provider responses so tests remain stable without a live provider.
- Fixtures must not embed secrets, credentials, or private chain-of-thought content.
- Cross-engine dependency fixtures must carry exact artifact revision IDs to test downstream invalidation.

### 10.3 Compliance test protocol

For every milestone that introduces an engine, processor, Quality evaluator, or complete pipeline path, execute the relevant sections of the CKLIS Validation Suite as specification-compliance tests. Record the suite version and pass/fail evidence in the Handoff Ledger.

### 10.4 Architecture check automation

Dependency direction rules (Section 10 of the frozen architecture) must be enforced by automated architecture checks that run on every build. The checks must reject any prohibited import or reverse dependency.

---

## 11. Review Protocol

Every milestone requires an independent review before it is considered complete. Reviews are conducted against the milestone's scope only. The reviewer checks facts against the official specifications, not against implementation preferences.

### 11.1 Review checklist (applicable to every milestone)

- [ ] Deliverables match what the milestone plan states.
- [ ] No scope creep: no behaviour outside the milestone's stated scope.
- [ ] No prohibited product capabilities introduced.
- [ ] Frozen architecture boundaries not violated.
- [ ] Contracts contain no leaked internals.
- [ ] Tests are present, meaningful, and cover failure cases.
- [ ] Specification-compliance evidence is present.
- [ ] Any discovered architectural concern has been routed through the Evolution Engine.

### 11.2 Milestone-specific review focus

Each milestone section below identifies the specific review focus for that milestone. The general checklist above applies to all milestones in addition to the milestone-specific focus.

### 11.3 Review evidence

The outcome of each review must be recorded in the Handoff Ledger under the relevant milestone's review field. Evidence must include: what was reviewed, what was found, whether the review passed, and any issues that were routed to the Evolution Engine.

---

## 12. Deployment Protocol

### 12.1 Environments

| Environment | Purpose |
|---|---|
| Local development | Individual engineer or agent workspace |
| Isolated integration | Deploying internal packages for per-milestone validation (no learner exposure) |
| Staging | Full-system testing after M18 and M20; accessible to API clients and the web application |
| Production-equivalent | M21 release candidate; requires explicit product owner release approval |

### 12.2 Deployment steps (per milestone)

1. Build the deployable unit for the milestone.
2. Execute all independent tests.
3. Deploy to the appropriate environment.
4. Execute deployment validation steps defined for the milestone.
5. Record the deployment result in the Handoff Ledger.
6. Confirm no learner-facing exposure occurs before all required prerequisite milestones are complete.

### 12.3 Rollback

Every milestone deployment must have a rollback approach. The default rollback is to redeploy the previous version of the affected package. Because milestones are additive, rolling back one milestone's package does not require rolling back prerequisite packages unless a contract breaking change occurred. Contract breaking changes require a version bump before deployment; if they are deployed in error, all consuming components must be rolled back to the version that matches the previous contract.

### 12.4 Public exposure gate

Learner-facing exposure begins only after the complete backend contract is publicly available (M18 fully deployed). M19 may be deployed but not publicly released until M18 is complete. M20 completes the learner journey. M21 is the first release candidate. No feature or capability may be publicly enabled before its full dependency chain is production-complete.

---

## 13. Security, Privacy, and Public-Private Boundaries

### 13.1 Information that must never reach learners

| Prohibited information | Reason |
|---|---|
| Raw RuntimeContext | Internal execution state; contains unapproved intermediate reasoning |
| Q0, Q1, Q2 Quality levels or reports | Internal Quality grades; never public status values |
| Internal engine names or execution attempt counts | Internal execution mechanics |
| Prompt text or prompt assembly details | Internal construction of AI instructions |
| Raw AI provider responses | Provider internals; may contain unsafe content |
| Provider identity, model versions, or credentials | Provider independence; security |
| Stack traces, exception messages, or infrastructure errors | Technical details that must not reach learners |
| Audit Log contents | Developer record; not learner content |
| Revision history or superseded artifact content | Internal correction history |
| Private Quality feedback or structured feedback requests | Internal revision mechanism |

### 13.2 Learner-safe error categories

Learner-visible failure information is limited to four safe categories: invalid request, unsupported output, clarification required, or execution unavailable. Every failure response includes the execution ID, the safe category, an educationally meaningful message, and whether corrected input or a new request is required.

### 13.3 Audit Log privacy boundary

The Audit Log is a developer record. It must contain the original and resolved request, initiator metadata, runtime decisions, artifact revisions, checkpoints, Quality reports, feedback, execution order, final outcomes, failures, and timestamps. It must exclude: secrets, credentials, private chain-of-thought, and undocumented provider internals. The Audit Log must not be accessible through any public API endpoint.

### 13.4 Frontend state boundary

Frontend state may contain: form values, execution ID, public status and progress events, clarification questions and answers, and the finalized outcome envelope. It must not contain or reconstruct RuntimeContext, prompts, private Quality reports, engine communication, or provider state. The backend finalized outcome resource, not browser state, is the source of truth after completion.

### 13.5 Provider adapter boundary

Provider adapters accept a bounded reasoning request assembled by the Runtime and return a structured result. They translate provider failures into provider-neutral categories. They must not: select engine order, decide retries or Quality, read unrestricted RuntimeContext, persist educational state, or expose provider identity, prompts, or raw responses to learners.

---

## 14. Observability and Audit Rules

### 14.1 Internal logging

Every significant Runtime action must create a log entry, including: execution started, specification versions loaded, engine started, engine completed with Q-level, validation passed, validation failed with reason, revision started, revision completed, Studio format selected, finalization started, finalization completed, context destroyed. Logs are internal and must not be visible to learners.

### 14.2 Diagnostics adapter

The Diagnostics Port captures technical failures without learner leakage. Technical diagnostic information must be routed through this port and never surfaced through public API responses or frontend events.

### 14.3 Audit Log content

The Audit Log is the authoritative, permanent record of what happened in an execution. It must be sufficient for a developer to reconstruct the full execution path, including: which artifact revisions were created, which reached Q3, which were superseded and why, what Quality feedback was issued, how many revision attempts occurred, which Studio path was taken, when each state transition occurred, and what the final outcomes were.

### 14.4 Audit Log integrity

The Audit Log must be written and persisted before the execution is marked `COMPLETED`. If Audit Log persistence fails, the execution must not be marked `COMPLETED`. The Audit Log must survive RuntimeContext destruction. It must be immutable after being written. It must not contain secrets or credentials.

### 14.5 Execution metadata in outcomes

The public Pipeline Outcome and finalized outcome envelope may include a safe Q3 approval summary and execution metadata safe for the learner. This does not include Quality scores, revision counts, attempt numbers, provider details, or prompt content.

---

## 15. Milestone Procedures: M01–M21

The sections below define the exact procedure for each milestone. Every milestone section follows this template:

- **Prerequisites** — what must be complete before this milestone begins.
- **Exact scope** — what this milestone builds.
- **Out of scope** — what this milestone explicitly does not build.
- **Files and modules expected** — the source folders and key modules introduced.
- **Work sequence** — step-by-step work instructions.
- **Contracts produced or consumed** — which contracts are created, extended, or used.
- **Tests and failure cases** — specific tests required.
- **Review evidence** — what the review must confirm.
- **Deployable unit** — what is deployed.
- **Deployment validation** — how to confirm the deployment succeeded.
- **Completion evidence** — what constitutes proof that the milestone is done.
- **Rollback approach** — how to undo the milestone if necessary.
- **Handoff instructions** — what to record in the Handoff Ledger before the next milestone begins.

---

### M01 — Contract and Repository Foundation

**Prerequisites.** All specification files are present and readable in the `PyBe/` directory. The `software/` source root does not yet exist or is empty. No implementation from a later milestone exists.

**Exact scope.** Establish the complete logical folder structure. Define and version every contract that later milestones will consume. Implement automated architecture dependency checks. Produce the specification-to-contract traceability matrix. Produce version identifiers for all system components.

**Out of scope.** No runtime logic. No engine logic. No storage adapters. No AI provider integration. No frontend. No deployment manifests beyond the contract package itself.

**Files and modules expected.**
- The complete `software/` folder hierarchy as specified in Section 2 of the frozen architecture.
- `software/contracts/public-api/` — stable learner-facing execution envelopes (create, clarify, get, events, outcomes, failure).
- `software/contracts/les/` — LES request fields and normalization result contract.
- `software/contracts/execution/` — execution state enumeration, progress event, clarification request and answer envelopes.
- `software/contracts/runtime-context/` — RuntimeContext section definitions and lifecycle state enumeration.
- `software/contracts/engines/` — common engine input envelope, result envelope, and engine-specific bounded-context view stubs.
- `software/contracts/artifacts/` — artifact identity, revision, status, Q-level, upstream reference, and traceability fields.
- `software/contracts/outcomes/` — Pipeline Outcome schema, Studio Outcome schema, finalized dual-outcome envelope.
- `software/contracts/quality/` — Quality Report schema, Q-level enumeration, feedback request and evidence contracts.
- `software/contracts/ports/` — AI Reasoning Port, Knowledge Resource Port, Prompt Resource Port, Active Context Port, Final Outcome Port, Audit Log Port, Progress Port, Diagnostics Port, Identifier Port, Clock Port definitions.
- `software/tests/contracts/` — contract structural-validity, version-compatibility, and prohibited-field tests.
- `software/tests/architecture/` — dependency direction enforcement checks.
- Traceability matrix document (format to be chosen by implementer) mapping each contract to the frozen architecture section and specification that mandates it.
- System version identifier registry (Runtime, CKLIS, CKMS, engine schemas, Studio resource schemas, architecture version).

**Work sequence.**
1. Create the entire `software/` folder skeleton as defined in the frozen architecture. Create placeholder marker files (not code) in each directory to establish identity.
2. Define the system version identifier registry. Record architecture baseline as 2.0.0. Assign initial versions (e.g., 1.0.0) to Runtime, CKLIS, CKMS, each engine contract, each Studio path contract, and the public API contract.
3. Define the Public API contracts: request envelopes (natural-language, partial-structured, fully-structured), public execution status enumeration (exactly the six approved values), clarification request and answer, progress event, finalized outcome envelope, and failure envelope. Verify that no prohibited fields appear.
4. Define the LES contract: all fields from `13 - Learning Experience Specification.docx.md` including Educational Intent, Desired Studio format (exactly the four approved values), Audience, Educational Context, language, duration, platform/profile, experience hints, experience constraints, and additional output notes.
5. Define the execution state machine contract: every legal state, every legal transition, `FAILED` terminal state, and `DESTROYED` final state.
6. Define RuntimeContext section contracts covering all conceptual sections from the frozen architecture Section 4.2. Mark sections as internal (never to appear in public contracts).
7. Define the common engine input envelope and result envelope as specified in Section 6.1 of the frozen architecture. Include all required fields.
8. Define engine-specific bounded-context view contracts for each of the five engines, limited to the exact required view specified in Section 6.2 of the frozen architecture.
9. Define artifact identity, revision, and traceability contracts.
10. Define Pipeline Outcome and Studio Outcome schemas. Verify the Studio Outcome must reference an exact Pipeline Outcome revision. Define the finalized dual-outcome envelope.
11. Define Quality Report, Q-level enumeration (Q0, Q1, Q2, Q3 with meanings), evidence, feedback request, and responsible-stage attribution contracts.
12. Define all nine infrastructure port contracts: AI Reasoning (bounded reasoning request and structured result; provider-neutral failure types), Knowledge Resource (versioned read-only specification access), Prompt Resource (versioned read-only Studio resource access), Active Context, Final Outcome (atomic write/read), Audit Log (durable write of Markdown or JSON), Progress, Diagnostics, Identifier, and Clock.
13. Implement architecture dependency check tests that reject: Presentation → Runtime internals; API controller → engines; Engine → another engine; Engine → RuntimeContext storage; Studio processor → mutation of approved artifacts; Quality → direct artifact mutation; Runtime core → concrete infrastructure; and each other prohibited dependency from Section 10.4 of the frozen architecture.
14. Implement contract structural-validity tests: every contract is versioned, required fields are present, prohibited fields are absent, boundary envelopes for valid/invalid/edge cases are covered.
15. Produce the specification-to-contract traceability matrix.
16. Package contracts and architecture checks as a versioned artifact.

**Contracts produced.**
All contracts under `software/contracts/` are produced in this milestone. Every later milestone consumes them without modification to their published interface (only additions with version bumps are acceptable).

**Contracts consumed.** None (M01 produces the foundation).

**Tests and failure cases.**
- Every contract passes structural validity.
- Version compatibility check rejects incompatible version combinations.
- Dependency check rejects a known prohibited import (test with an intentional violation, confirm rejection).
- Public contracts do not contain RuntimeContext, Q0/Q1/Q2 levels, provider names, prompt text, or Audit Log fields.
- Finalized outcome envelope test: attempt to build an envelope with a Q2 Studio Outcome; confirm rejection.
- LES contract test: attempt to submit an unsupported Studio format; confirm safe rejection.

**Review evidence.** Reviewer confirms: all frozen architectural boundaries are represented by contracts; no contract is implicit; no framework or provider detail leaks into domain contracts; traceability matrix is complete; dependency checks reject at least one intentional violation.

**Deployable unit.** Versioned contract package and architecture-check runner published to the internal artifact environment.

**Deployment validation.** Run the contract test suite and architecture checks against the published package in the integration environment. All tests pass. Architecture checks reject an intentional dependency violation introduced as a probe.

**Completion evidence.**
- All frozen architectural boundaries are represented.
- No contract is left implicit.
- No framework or provider detail leaks into domain contracts.
- Contract package is published and all tests pass.
- Architecture check package is published and demonstrably rejects violations.
- Traceability matrix is complete.

**Rollback approach.** The contract package is versioned. Rolling back M01 means unpublishing the package. Downstream work cannot proceed without M01, so rolling back M01 requires discarding all subsequent milestone work.

**Handoff instructions.** Record in the Handoff Ledger: contract package version, architecture check version, traceability matrix location, all component version identifier initial values, any decisions made during contract design, and any ambiguities resolved.

---

### M02 — Execution Storage and Operational Foundation

**Prerequisites.** M01 complete and all contract packages published and accessible.

**Exact scope.** Implement all infrastructure adapters defined by the ports in M01, excluding the AI Reasoning, Knowledge Resource, and Prompt Resource ports (those belong to M03). Implement Identifier, Clock, Active Context, Final Outcome (with atomic write/read behaviour), Audit Log writer, Diagnostics, and Progress transport adapters. Implement storage failure and recovery behaviour.

**Out of scope.** No educational logic. No Runtime. No engines. No AI provider. No specification or prompt loading. No frontend.

**Files and modules expected.**
- `software/infrastructure/identifiers/` — Identifier port implementation.
- `software/infrastructure/clock/` — Clock port implementation.
- `software/infrastructure/active-context/` — Active Context adapter; supports temporary execution state keyed by execution ID; supports clarification continuity (same execution ID, same context).
- `software/infrastructure/finalized-outcomes/` — Final Outcome adapter with atomic write, atomic read-back, and a guard that prevents reading a partial envelope.
- `software/infrastructure/audit-log/` — Audit Log writer supporting Markdown and/or JSON; append-only; immutable after written; no secrets.
- `software/infrastructure/progress-transport/` — Progress adapter that publishes learner-safe events without leaking internal state.
- `software/infrastructure/diagnostics/` — Diagnostics adapter that captures technical failures without learner leakage.
- `software/tests/` — M02 adapter tests.

**Work sequence.**
1. Implement the Identifier Port. The identifier must be unique per execution, suitable for use as a correlation key, and must not embed secrets or provider identifiers.
2. Implement the Clock Port. The clock must provide timestamps suitable for Audit Log, execution metadata, and progress event timestamps.
3. Implement the Active Context Port. Active context is isolated by execution ID. Clarification within the same execution must update the same context. Context from one execution must never be accessible to another execution. Define the lifecycle: created when the execution is accepted, readable and updatable during the execution, destroyable (explicitly) after finalization.
4. Implement the Final Outcome Port with strictly atomic semantics. Write must be all-or-nothing. Read must return nothing until the complete envelope is committed. Implement the read guard that returns a not-found result (not a partial result) if the write has not been completed atomically.
5. Implement the Audit Log Port. The writer must: accept a complete execution record; serialize to Markdown or JSON; write durably; return an acknowledgement that persistence succeeded; refuse to write if the record contains known prohibited fields (secrets, credentials). Verify that the Audit Log record survives after the Active Context is destroyed by testing write-then-destroy sequencing.
6. Implement the Progress Port. Progress events must use only the nine approved learner-safe stage labels. The adapter must reject any attempt to publish internal engine names, Q0/Q1/Q2 levels, attempt counts, or revision details.
7. Implement the Diagnostics Port. Technical failures route through this adapter. The adapter must capture and store or forward diagnostic information without surfacing it through any learner-visible channel.
8. Implement storage failure and recovery behaviour. For each adapter: define what happens when the underlying storage is unavailable, what happens on partial failure during write, and how failure is communicated through provider-neutral error categories.

**Contracts produced.** No new contracts; this milestone implements the port contracts defined in M01.

**Contracts consumed.** Infrastructure Ports from `software/contracts/ports/`.

**Tests and failure cases.**
- Active contexts are isolated by execution ID: write to execution A, confirm it is not visible in execution B.
- Clarification continuity: write context for execution X, simulate a clarification update, confirm the same context is updated not replaced.
- Final outcome write atomicity: interrupt a write mid-operation (or simulate failure); confirm the partial result is not readable; confirm the next complete write succeeds.
- Audit Log survives Active Context destruction: write Audit Log, destroy active context, confirm Audit Log is still readable.
- Audit Log must reject records containing a simulated secret field.
- Progress adapter rejects a progress event containing an internal engine state name.
- Each adapter failure maps to a provider-neutral operational failure type (not a raw infrastructure exception).
- Storage adapters contain no educational rules or Quality logic.

**Review evidence.** Reviewer confirms: lifecycle guarantees are correct; atomicity of Final Outcome is provable from tests; Audit Log and Active Context have independent lifecycles; failure handling is provider-neutral; no adapter owns educational decisions.

**Deployable unit.** Infrastructure adapter package deployed to an isolated integration environment with operational probes.

**Deployment validation.** Execute create/read/destroy probe for Active Context adapter. Execute atomic write/read probe for Final Outcome adapter. Execute write/destroy-context/read-after probe for Audit Log adapter. Execute a progress event publication probe. Confirm all probes pass.

**Completion evidence.**
- Temporary, finalized-outcome, and Audit Log lifecycles are demonstrably separate in test evidence.
- No adapter owns Runtime or educational decisions.
- All adapter tests pass.

**Rollback approach.** Undeploy the infrastructure adapter package and redeploy the previous version. M01 contracts are unaffected.

**Handoff instructions.** Record adapter package version, storage technology chosen (if decided), atomic write mechanism, Audit Log format chosen (Markdown or JSON or both), any deployment environment configuration required.

---

### M03 — AI, Knowledge, and Prompt Boundary

**Prerequisites.** M01 and M02 complete.

**Exact scope.** Implement the AI Reasoning Port, Knowledge Resource Port, Prompt Resource Port, and the central Prompt Composer. Implement resource version compatibility validation and protection against credential and prompt leakage.

**Out of scope.** No Runtime. No engines. No Quality. No frontend. No educational decisions. The Prompt Composer composes prompts from authoritative knowledge; it does not make educational decisions.

**Files and modules expected.**
- `software/infrastructure/ai-provider/` — AI Reasoning Port implementation; provider-neutral request/result translation; timeout and failure handling.
- `software/infrastructure/knowledge-resources/` — read-only, versioned access to official specifications (00–14, AI-01–AI-04); resource version compatibility validation.
- `software/infrastructure/prompt-resources/` — read-only, versioned access to CP1, CP2, 1_Page_Comic_Example, VP1, VP2, and audio resources.
- `software/runtime/prompt-composition/` — central Prompt Composer; follows the approved knowledge hierarchy for prompt assembly.
- `software/tests/` — M03 adapter and Prompt Composer tests.

**Work sequence.**
1. Implement the AI Reasoning Port. The adapter must accept a bounded reasoning request (assembled by the Prompt Composer, not by the adapter itself) and return a structured result. It must translate provider-specific failures into provider-neutral failure categories. It must not: select engine order, decide retries, read RuntimeContext, persist educational state, or expose provider identity to callers.
2. Implement the Knowledge Resource adapter. Load official specifications by version identifier. Resources must be read-only during an execution. The adapter must fail safely if a requested specification version is not found. Version compatibility validation must prevent an execution from proceeding if the available specification version is incompatible with the requested version.
3. Implement the Prompt Resource adapter. Load Studio production resources (CP1, CP2, 1_Page_Comic_Example, VP1, VP2, audio resources) by version identifier. Same read-only and version-compatibility rules apply. Resources must be immutable during an execution.
4. Implement the central Prompt Composer following the approved layered prompt assembly hierarchy defined in AGENTS.md Section 34: Project Constitution, Learning Science, Runtime Rules, Master Prompt, Current Educational Engine or Studio Processor, RuntimeContext (bounded view), Educational Outputs Generated So Far. The Prompt Composer must combine these layers to produce an authoritative prompt for the AI Reasoning Port. The Prompt Composer must never allow its output to be overridden by external callers or by provider adapters.
5. Implement protection against leakage: the Prompt Composer's output must not appear in any public contract, progress event, or learner-visible output. Provider credentials must not appear in composed prompts. Raw provider responses must not pass through to higher layers unvalidated.
6. Implement resource mutation guard: confirm that resources loaded at execution start cannot be modified mid-execution by any other component.

**Contracts produced.** No new contracts; this milestone implements port contracts from M01. The Prompt Composer is a Runtime component and its interface is internal.

**Contracts consumed.** AI Reasoning Port, Knowledge Resource Port, Prompt Resource Port from M01.

**Tests and failure cases.**
- The configured provider adapter passes a provider-neutral contract conformance suite; the suite proves that another conforming adapter can replace it without Runtime changes.
- Missing or incompatible resource version stops execution with a safe error, not a runtime exception.
- Prompt composition follows the approved knowledge hierarchy: verify that each layer is present in a test-mode composition trace.
- Resources remain immutable: attempt a mid-execution resource modification through the adapter; confirm it is rejected.
- Provider details cannot enter public contracts: confirm composed prompts and provider responses are not present in any public-facing envelope.
- Provider adapter failure maps to a provider-neutral category.

**Review evidence.** Reviewer confirms: provider independence is proven by port conformance and absence of provider-specific Runtime dependencies; resource governance is correct; prompt ownership is centralised in the Prompt Composer; version pinning works; information boundaries prevent leakage.

**Deployable unit.** Provider/resource integration package with restricted conformance probes.

**Deployment validation.** Execute a minimal conformance probe: load a specification resource, compose a test prompt, submit to a configured provider, receive a structured result. Confirm resource version compatibility check rejects a version mismatch.

**Completion evidence.**
- Runtime can invoke reasoning without importing or depending on a named provider, as proven by port-conformance and architecture-test evidence.
- Every resource used by execution is version-identifiable and read-only.

**Rollback approach.** Undeploy the package. M01 and M02 are unaffected.

**Handoff instructions.** Record adapter package version, resource version identifiers for each specification and Studio resource, provider selected (if decided), any version compatibility matrix.

---

### M04 — Quality Engine Foundation

**Prerequisites.** M01 complete. M02 and M03 are useful but not strictly required for Quality unit work; integration tests will require M02 and M03.

**Exact scope.** Implement the complete Quality Engine: dimension scoring, Q-level classification, Quality Report generation, failure classification, responsible-stage attribution, structured feedback request, and learner-safe Q3 approval summary projection. All three evaluation entry points: stage checkpoints, Pipeline Quality Gate, and Studio Quality Gate.

**Out of scope.** No Runtime. No engines. No production. Quality evaluates artifacts; it never generates them.

**Files and modules expected.**
- `software/quality/stage-checkpoints/` — stage Quality checkpoint evaluator for each engine stage.
- `software/quality/pipeline-gate/` — Pipeline Quality Gate evaluator.
- `software/quality/studio-gate/` — Studio Quality Gate evaluator.
- `software/quality/feedback/` — structured feedback request builder.
- `software/quality/reports/` — Quality Report serializer and learner-safe Q3 summary projector.
- `software/tests/quality/` — Quality tests using conformance fixtures.

**Work sequence.**
1. Define the Quality dimension model: identify the evaluation dimensions mandated by the Quality Engine specification (Section 09). Each dimension must have a scoring model and a minimum threshold for each Q-level.
2. Implement Q-level classification: Q0 (critical failure — reject immediately; send structured feedback), Q1 (major issues — send structured feedback; re-execute), Q2 (minor issues — send structured feedback; re-execute; never advance), Q3 (fully compliant — permit forward progress or delivery). These four definitions are architectural constants.
3. Implement the Quality Report schema from `software/contracts/quality/`: evaluated artifact revision ID, applicable rules and specification versions, dimension scores, Q-level, failure classifications, evidence, responsible stage, required action, and overall determination.
4. Implement responsible-stage attribution: when Quality identifies a failure, it must identify the earliest stage capable of correcting the root cause and name it in the feedback.
5. Implement structured feedback request: a machine-readable feedback envelope containing the failure evidence, the dimension that failed, the responsible stage, and the required corrective action. The feedback request must be sufficient for the producing module to understand what to revise.
6. Implement the three evaluation entry points: stage checkpoint (invoked after each engine), Pipeline Quality Gate (invoked after Pipeline Outcome Assembly), and Studio Quality Gate (invoked after Studio processing). Each entry point uses the same core classification logic with the appropriate rule set for its context.
7. Implement the learner-safe Q3 approval summary projector: extract only a safe summary suitable for inclusion in the public Pipeline Outcome. This summary must not include Q-level numbers, dimension scores, revision counts, attempt information, or failure evidence.
8. Implement the immutability constraint: Quality evaluators must receive artifacts as read-only inputs. The Quality Engine must never write to or modify an artifact.

**Contracts produced.** No new contracts; Quality Report and feedback request contracts were defined in M01. This milestone implements them.

**Contracts consumed.** Quality Report, Q-level enumeration, feedback request, artifact revision contracts from M01.

**Tests and failure cases (using approved conformance fixtures).**
- A fixture representing a critical constitutional violation produces Q0.
- A fixture representing a major educational defect produces Q1.
- A fixture representing a minor educational defect produces Q2.
- A fixture representing a fully compliant artifact produces Q3.
- A Q2 result is confirmed to be unable to advance to delivery (guard test).
- Quality never mutates the evaluated artifact: confirm artifact content is identical before and after evaluation.
- Every finding cites evidence and applicable specification sections.
- Private Quality reports cannot enter public progress events or public outcome envelopes (boundary test).
- The learner-safe Q3 summary contains no prohibited fields.

**Review evidence.** Reviewer confirms: Q-level classification is deterministic and contract-compliant; structured feedback is sufficient for producing modules; evidence quality is adequate; Q3 gating is strict; Quality never modifies artifacts.

**Deployable unit.** Internal Quality package and evaluation service in an isolated environment using fixed specification fixtures.

**Deployment validation.** Run the conformance fixture test suite against the deployed Quality service. Confirm Q-level classifications match expected values for each fixture.

**Completion evidence.**
- Q-level behaviour is deterministic and contract-compliant.
- Structured feedback is sufficient for a producing module to revise its output (demonstrated by structured feedback review).

**Rollback approach.** Undeploy Quality package and redeploy previous version. No downstream engine work depends on Quality's internal implementation; all depend on the Quality Report contract from M01.

**Handoff instructions.** Record Quality package version, dimension model version, fixture set version, any Q-level threshold decisions made.

---

### M05 — Runtime Intake, LES, and RuntimeContext

**Prerequisites.** M01, M02, M03, and M04 complete.

**Exact scope.** Implement execution creation, request interpretation, LES resolution, clarification coordination, CKMS context construction, RuntimeContext lifecycle management, bounded views, the execution state machine, and learner-safe progress projection for intake states. No educational engine execution.

**Out of scope.** No engines. No Quality pipeline execution. No Studio. No production. No finalization. The Runtime intake accepts and resolves requests; it does not run the educational pipeline.

**Files and modules expected.**
- `software/runtime/execution/` — Execution Manager; Execution State Machine (legal transitions only; rejects illegal transitions).
- `software/runtime/intake/` — Request Interpreter (natural-language, partial-structured, fully-structured); LES Resolver (semantic validation of Educational Intent and Desired Studio Format); Clarification Coordinator.
- `software/runtime/normalization/` — LES defaults and inference logic; Decision Recorder (records all inferences and defaults with rationale; append-only).
- `software/runtime/context/` — RuntimeContext Manager (create, expose bounded views, merge results, freeze, snapshot, destroy); bounded view generator per engine and per component.
- `software/tests/runtime/` — Runtime intake tests.

**Work sequence.**
1. Implement the Execution Manager: accept a request, assign an execution ID using the Identifier Port, assign a timestamp using the Clock Port, create a RuntimeContext immediately via the RuntimeContext Manager, transition to `ACCEPTED` then immediately `RESOLVING_LES`.
2. Implement the Execution State Machine: enforce all legal transitions from the frozen architecture Section 3.2. Reject illegal transitions with a safe internal failure. From any state, a nonrecoverable error must move to `FAILED` and trigger failure cleanup.
3. Implement the Request Interpreter: translate natural-language, partial, or fully structured input into a candidate LES without altering the original input. The interpreter must preserve exact learner phrasing in the RuntimeContext Original Request section.
4. Implement the LES Resolver: validate that Educational Intent is present and interpretable; validate that Desired Studio Format resolves to exactly one of the four approved Version 2 formats (Comic, One-Page Comic, Video, Audio/Podcast). Missing optional information must be inferred or defaulted where educationally safe. Missing or conflicting mandatory information must produce minimum clarification — only the fields that cannot be safely inferred.
5. Implement the Clarification Coordinator: generate minimum clarification questions, continue the same execution and RuntimeContext, merge clarification answers into the same context, resume LES resolution, never ask for optional information unnecessarily.
6. Implement the Decision Recorder: every inference, default, compatibility decision, and clarification answer must be recorded in the RuntimeContext in append-only fashion with a rationale reference to the applicable specification.
7. Implement the CKMS Context Builder: construct the validated educational execution context from the resolved LES according to the CKMS specification (`11 – CKMS`). No engine may start until this is valid.
8. Implement the RuntimeContext Manager: create RuntimeContext on execution start; expose read-only bounded views sized for each engine and component; perform controlled merges from engine results into the context; freeze the context for finalization; snapshot the context for Audit Log; destroy the context after finalization.
9. Implement safe failure and destruction behaviour: on `FAILED`, preserve all available audit information, write what can be written to the Audit Log, then destroy temporary state.
10. Implement learner-safe progress projection for intake states: `RESOLVING_LES` maps to "Understanding Learning Goal"; `AWAITING_CLARIFICATION` maps to a safe clarification guidance message.

**Contracts produced.** No new contracts; this milestone implements Runtime contracts from M01.

**Contracts consumed.** LES contracts, execution-state contracts, RuntimeContext contracts, all ports from M01; Identifier and Clock ports from M02; Knowledge Resource port from M03.

**Tests and failure cases.**
- One request creates exactly one execution ID and one RuntimeContext (never two for one request).
- Clarification continues the same execution: submit a request needing clarification, answer, confirm the same execution ID and same context.
- Only mandatory clarification is requested: submit a request with all optional fields absent; confirm no optional fields are asked about.
- Explicit optional field preserved: submit a request with an explicit optional field; confirm it is not overridden by inference.
- Unsupported Studio format: submit a request with an unsupported Desired Output; confirm a safe validation response without execution proceeding.
- Conflicting mandatory information: submit a self-contradicting request; confirm minimum clarification is produced.
- Illegal state transition: attempt to move from `COMPLETED` to `PIPELINE_RUNNING`; confirm rejection.
- Terminal failure destroys temporary state: force a `FAILED` state; confirm Active Context is destroyed; confirm whatever Audit information is available has been written.
- Every decision is traceable: read the Decision Recorder output; confirm each inference has a rationale reference.
- No educational engine logic exists in intake: confirm no call to engine packages exists.

**Review evidence.** Reviewer confirms: LES fidelity against the LES specification; inference boundaries correctly drawn; clarification is minimal; state transitions are complete; context ownership is correct; execution isolation is demonstrated.

**Deployable unit.** Runtime intake package with a restricted validation interface.

**Deployment validation.** Submit a valid fully structured request; confirm it reaches a valid CKMS execution context. Submit an invalid request; confirm it reaches a safe clarification state. Submit an unsupported format; confirm safe validation response.

**Completion evidence.**
- A valid request reaches a valid CKMS execution context.
- An invalid or incomplete request reaches a safe clarification or failure state.
- No educational engine logic exists in the intake package.

**Rollback approach.** Undeploy Runtime intake package. M01–M04 packages are unaffected.

**Handoff instructions.** Record Runtime core package version, LES resolver version, state machine version, any LES inference decisions made, any CKMS context construction decisions made.

---

### M06 — Misconception Engine

**Prerequisites.** M01 through M05 complete.

**Exact scope.** Implement the Misconception Engine, its bounded RuntimeContext view, the stage Quality checkpoint integration, and the complete Q0–Q2 feedback and revision loop for this stage.

**Out of scope.** No other engine. No Pipeline assembly. No Studio. The Misconception Engine identifies misconceptions; it does not produce lessons, scenarios, Studio artifacts, or any other output.

**Files and modules expected.**
- `software/engines/misconception/` — complete Misconception Engine implementation.
- `software/tests/engines/` — Misconception Engine tests.

**Work sequence.**
1. Implement the Misconception Engine input envelope handler: accept the bounded RuntimeContext view (resolved LES, objective, audience, prerequisites), the output schema from M01, and optional revision feedback.
2. Implement the Misconception Profile generation: produce a prioritised list of misconceptions, each with a cause, probability level, severity, teaching risk, and correction strategy, following the Misconception Engine specification (`03 - Misconception Engine.docx.md`) and Learning Science (`02 - Learning Science.docx.md`).
3. Implement output schema validation: confirm the result satisfies the Misconception artifact contract from M01 before returning.
4. Implement stage Quality checkpoint integration: pass the result to the Stage Checkpoint evaluator; if Q0–Q2, receive structured feedback, create a new artifact revision, and re-execute; if Q3, merge into RuntimeContext as the current Misconception Profile.
5. Implement traceability: the result must record the artifact ID, revision, producer, specification versions consumed, and execution metadata.
6. Implement the engine scope constraint: the engine must not produce scenarios, episodes, Studio artifacts, or anything outside the Misconception Profile contract.

**Contracts produced.** Misconception Profile artifact (first live artifact of type, consuming the engine result contract from M01).

**Contracts consumed.** Engine input/result envelopes, artifact identity/revision contracts, stage Quality checkpoint contract from M01; RuntimeContext bounded view from M05; Quality Foundation from M04; AI Reasoning Port from M03.

**Tests and failure cases.**
- Profiles are objective-, audience-, and prerequisite-specific: run two fixtures with different audiences and confirm different misconception profiles.
- Duplicate or irrelevant misconceptions are rejected by the Quality checkpoint.
- Every misconception has priority and correction strategy: verify output schema validation.
- The engine cannot produce a lesson, scenario, or Studio artifact: confirm the result contract enforces this.
- Only Q3 profiles become current RuntimeContext artifacts: simulate a Q1 result; confirm it does not become current until a Q3 revision is produced.
- Revision creates a new artifact revision: confirm revision numbers increment and old revisions remain in history.

**Review evidence.** Reviewer confirms: educational fidelity against Misconception Engine, Learning Science, Constitution, and Quality specifications; scope constraint enforced; traceability complete.

**Deployable unit.** Misconception Engine package versioned and deployed through engine contract.

**Deployment validation.** Submit a probe with a resolved CKMS context; confirm a Q3 Misconception Profile is produced with no downstream processing.

**Completion evidence.**
A resolved CKMS context can produce one traceable Q3 Misconception Profile with no downstream processing.

**Rollback approach.** Undeploy Misconception Engine package. M01–M05 packages are unaffected.

**Handoff instructions.** Record engine package version, specification versions consumed, any educational scope decisions made during implementation.

---

### M07 — Mental Model Engine

**Prerequisites.** M01 through M06 complete with a Q3 Misconception Profile available.

**Exact scope.** Implement the Mental Model Engine using the approved Misconception Profile as a required input. Include complete stage Quality loop and revision integration.

**Out of scope.** No other engine. No scenarios, episodes, or production artifacts.

**Files and modules expected.**
- `software/engines/mental-model/` — complete Mental Model Engine implementation.
- `software/tests/engines/` — Mental Model Engine tests.

**Work sequence.**
1. Implement the bounded context view: objective, audience, prerequisites, and the exact approved Misconception Profile revision.
2. Implement the Mental Model Specification generation: entities, relationships, rules, behaviours, and analogies or visualisation support where educationally valid, following `04 - Mental Model Engine.docx.md`.
3. Implement the dependency guard: the engine must reject execution if no Q3 Misconception Profile exists in its bounded view.
4. Implement the scope constraint: the engine must not generate scenarios, episodes, or production artifacts.
5. Integrate stage Quality checkpoint as per M06 pattern. A new artifact revision is created on each retry; old revisions are preserved.
6. Implement traceability: result must reference the exact Misconception Profile revision consumed.

**Contracts produced.** Mental Model Specification artifact.

**Contracts consumed.** All prior engine contracts; Mental Model engine contract from M01; Q3 Misconception Profile from M06.

**Tests and failure cases.**
- Mental Model cannot run without a Q3 Misconception Profile: simulate a missing profile; confirm safe failure.
- Model addresses approved misconceptions: verify educational fixture confirms misconception coverage.
- Abstraction level matches the resolved audience: test two audience fixtures and confirm different abstraction levels.
- Engine cannot generate scenarios, episodes, or production artifacts: schema enforcement test.
- Revision creates a new artifact revision and preserves trace history.

**Review evidence.** Reviewer confirms: conceptual correctness, misconception alignment, cognitive-load discipline, contract boundaries, traceability.

**Deployable unit.** Mental Model Engine package.

**Deployment validation.** Runtime can progress from resolved LES through Q3 Misconception and Q3 Mental Model.

**Completion evidence.** Runtime produces Q3 Misconception + Q3 Mental Model artifacts from a valid CKMS context.

**Rollback approach.** Undeploy Mental Model Engine package. Prior milestones unaffected.

**Handoff instructions.** Record engine version, specification versions consumed.

---

### M08 — Scenario Intelligence Engine

**Prerequisites.** M01 through M07 complete with Q3 Mental Model available.

**Exact scope.** Implement the Scenario Intelligence Engine including Educational Context handling, nonrandom Surprise Me resolution, stage Quality loop, and revision integration.

**Out of scope.** No complete episode generation. No Studio format selection. No representation decisions.

**Files and modules expected.**
- `software/engines/scenario-intelligence/` — complete Scenario Intelligence Engine implementation.

**Work sequence.**
1. Implement the bounded context view: objective, audience, approved Mental Model, and Educational Context preference.
2. Implement Scenario Specification generation: observable events, context mapping, educational mapping, following `05 – Scenario Intelligence Engine.docx.md`.
3. Implement Educational Context handling: when the learner selects a specific context, use it faithfully. When the learner selects "Surprise Me", the Runtime must select the educational context most likely to maximise conceptual understanding — not at random. This is an educational decision, not a randomness function.
4. Implement the scope constraint: the engine must not generate a complete episode or select a Studio format.
5. Integrate stage Quality checkpoint as per prior engines.
6. Implement traceability to the exact Mental Model revision consumed.

**Tests and failure cases.**
- Scenario requires a Q3 Mental Model: missing Mental Model produces safe failure.
- Surprise Me is educationally selected: run Surprise Me on the same topic multiple times with the same educational context; confirm the selection is deterministic and educationally reasoned, not random.
- Scenario preserves the approved model and misconception strategy.
- Engine cannot generate a complete episode or select a Studio format.

**Review evidence.** Reviewer confirms: scenario authenticity, Context purpose, model preservation, strict module scope.

**Deployable unit.** Scenario Intelligence Engine package.

**Deployment validation.** Runtime produces Q3 Scenario Specification linked to exact Mental Model revision consumed.

**Completion evidence.** Q3 Scenario Specification produced with traceable upstream revision reference.

**Rollback approach.** Undeploy Scenario Engine package.

**Handoff instructions.** Record engine version, Educational Context handling decisions.

---

### M09 — Pattern Mapping Engine

**Prerequisites.** M01 through M08 complete with Q3 Scenario Specification available.

**Exact scope.** Implement the Pattern Mapping Engine connecting observable scenario behaviour to abstract and programming patterns. Include transfer opportunities and generalisation rules.

**Out of scope.** No episode. No production. No new scenario or mental model.

**Files and modules expected.**
- `software/engines/pattern-mapping/` — complete Pattern Mapping Engine implementation.

**Work sequence.**
1. Implement bounded context view: approved Mental Model, Scenario, objective, and audience.
2. Implement Pattern Mapping Specification generation: observable-to-abstract-to-programming transition, transfer opportunities, generalisation rules, following `06 – Pattern Mapping Engine.docx.md`.
3. Implement the dependency guard: both Q3 Mental Model and Q3 Scenario are required.
4. Implement scope constraint: must not invent a replacement scenario or mental model.
5. Integrate stage Quality checkpoint.
6. Implement downstream invalidation: if a consumed upstream revision changes, this artifact is invalidated.

**Tests and failure cases.**
- Pattern mapping requires Q3 Mental Model and Q3 Scenario: missing either produces safe failure.
- Patterns are accurate, recognisable, generalisable, and transferable.
- Mapping does not invent a replacement scenario or mental model.
- Downstream invalidation: change the Scenario revision; confirm Pattern Mapping is invalidated.

**Review evidence.** Reviewer confirms: transition logic, technical correctness, transfer value, traceability, module scope.

**Deployable unit.** Pattern Mapping Engine package.

**Deployment validation.** Runtime produces Q3 Pattern Mapping Specification without episode or production behaviour.

**Completion evidence.** Q3 Pattern Mapping Specification with full upstream traceability.

**Rollback approach.** Undeploy Pattern Mapping Engine package.

**Handoff instructions.** Record engine version.

---

### M10 — Episode Generation Engine

**Prerequisites.** M01 through M09 complete with all four upstream artifacts at Q3.

**Exact scope.** Implement the Episode Generation Engine converting approved educational reasoning into a complete platform-neutral instructional sequence.

**Out of scope.** No Pipeline assembly. No Studio. No production. No changes to upstream educational artifacts.

**Files and modules expected.**
- `software/engines/episode-generation/` — complete Episode Generation Engine implementation.

**Work sequence.**
1. Implement bounded context view: all four upstream Q3 artifacts (Misconception, Mental Model, Scenario, Pattern Mapping), duration constraints, and audience.
2. Implement Episode Specification generation: learning objectives, episode progression, transitions, pacing, practice activities, assessment, reflection, and transfer, following `07 – Episode Generation Engine.docx.md`.
3. Implement the dependency guard: all four upstream artifacts must be Q3.
4. Implement scope constraint: must not alter approved misconceptions, Mental Model, Scenario, or Pattern Mapping; must remain platform- and Studio-independent.
5. Integrate stage Quality checkpoint.
6. Implement downstream invalidation for all four upstream dependencies.

**Tests and failure cases.**
- Generation requires all four upstream artifacts at Q3.
- Progression is coherent and increases appropriately in complexity.
- Practice and assessment map to the objective.
- Episode remains platform- and Studio-independent.
- Cannot alter approved upstream artifacts.

**Review evidence.** Reviewer confirms: instructional progression, completeness, assessment alignment, representation independence, dependency integrity.

**Deployable unit.** Episode Generation Engine package completing the internal educational pipeline.

**Deployment validation.** Runtime produces a full Q3 artifact chain ending in a Q3 Episode Specification.

**Completion evidence.** Complete chain: Q3 Misconception → Q3 Mental Model → Q3 Scenario → Q3 Pattern → Q3 Episode.

**Rollback approach.** Undeploy Episode Engine package.

**Handoff instructions.** Record engine version, educational completeness criteria applied.

---

### M11 — Pipeline Outcome and Pipeline Quality Gate

**Prerequisites.** M01 through M10 complete with Q3 Episode Specification available.

**Exact scope.** Implement the Pipeline Outcome Assembler, the Pipeline Quality Gate, cross-engine consistency checking, root-cause routing to the earliest responsible stage, downstream invalidation of the complete pipeline on revision, and the learner-safe Q3 approval summary.

**Out of scope.** No Studio. No finalization. No learner-facing delivery. The Pipeline Outcome is an internal generic educational blueprint until finalization.

**Files and modules expected.**
- `software/production/pipeline-outcome/` — Pipeline Outcome Assembler and serializer.
- `software/quality/pipeline-gate/` — Pipeline Quality Gate (already structurally present from M04; integrate with Pipeline Outcome here).
- `software/tests/production/` — Pipeline Outcome tests.

**Work sequence.**
1. Implement the Pipeline Outcome Assembler: accept all current Q3 educational artifact revisions; verify each is present and Q3 before assembly; assemble into the complete Pipeline Outcome schema from M01. Required contents per the frozen architecture Section 3.6: execution and specification metadata; resolved educational intent and one primary learning objective; audience and prior-knowledge assumptions; Misconception Profile; Mental Model Specification; Scenario Specification; Pattern Mapping Specification; Episode Specification with progression, practice, assessment, and reflection; generic production blueprint and traceability; Q3 approval summary safe for delivery.
2. Implement exclusion rule: the assembled Pipeline Outcome must not include private Quality reports, prompts, raw provider exchanges, hidden reasoning, or revision details.
3. Implement the Pipeline Quality Gate: validate the complete Pipeline Outcome for cross-engine consistency (are learning objectives consistent across all engines? are misconceptions addressed throughout the episode? is the Episode Specification's audience consistent with the Mental Model's audience?). Generate a Quality Report. If Q0–Q2, attribute failure to the earliest responsible stage, generate structured feedback, and return the execution to that stage for revision. Downstream artifacts must be invalidated and regenerated.
4. Implement root-cause routing: when a cross-engine consistency failure is found, the Pipeline Gate must identify which engine produced the earliest-stage contributing artifact and route feedback there, not to the assembler.
5. Implement complete pipeline revision: when an upstream engine is revised due to a Pipeline Gate failure, every downstream artifact (later engines, Pipeline Outcome) must be invalidated and regenerated in normal order.
6. Confirm that Studio processing cannot begin until Pipeline Quality Gate returns Q3.

**Tests and failure cases.**
- Assembler accepts only current Q3 artifact revisions: attempt assembly with a Q2 artifact; confirm rejection.
- Every required educational artifact appears exactly once.
- Private prompts, reports, and provider data are excluded from the assembled Pipeline Outcome.
- Cross-engine inconsistency: create a fixture where Episode audience mismatches Mental Model audience; confirm Pipeline Gate detects it and routes to the responsible engine.
- Revised upstream artifacts regenerate every dependent downstream artifact.
- Studio processing cannot begin before Pipeline Q3: attempt to invoke Studio Router before Pipeline Gate passes; confirm rejection.

**Review evidence.** Reviewer confirms: completeness of Pipeline Outcome, representation independence, cross-engine consistency detection, revision graph correctness, public/private data separation.

**Deployable unit.** Complete generic CKLIS pipeline as an internal service capable of producing a Q3 Pipeline Outcome.

**Deployment validation.** Valid request produces one complete Q3 Pipeline Outcome with full traceability. Q2 Pipeline Outcome does not advance to Studio.

**Completion evidence.** A valid request can produce one complete Q3 Pipeline Outcome with full traceability.

**Rollback approach.** Undeploy Pipeline Outcome package. M01–M10 unaffected.

**Handoff instructions.** Record Pipeline Outcome version, cross-engine consistency rules applied.

---

### M12 — Studio Framework and Router

**Prerequisites.** M01 through M11 complete with Q3 Pipeline Outcome available.

**Exact scope.** Implement the shared Studio orchestration framework, the Studio Router, the shared Studio Quality Gate integration point, and shared traceability, resource-version tracking, and fidelity-evidence handling. No format-specific generation.

**Out of scope.** No Comic. No One-Page Comic. No Video. No Audio/Podcast. All format routes are disabled until their processors are installed in M13–M16.

**Files and modules expected.**
- `software/production/studio/router/` — Studio Router.
- `software/production/studio/` — shared Studio framework (contract, traceability, fidelity evidence, resource version tracking, revision handling).
- `software/quality/studio-gate/` — Studio Quality Gate (structurally present from M04; integrate with Studio framework here).

**Work sequence.**
1. Implement the Studio Router: accept the resolved Desired Studio Format from the LES; map exactly to one of the four approved processors. No silent mapping of unsupported formats. Reject unsupported formats with a safe validation response. Reject ambiguous or unmapped formats with minimum clarification.
2. Implement the processor registration mechanism: processors (M13–M16) register themselves with the Router. The Router must not expose a route as available until the processor is fully installed.
3. Implement shared Studio traceability: every Studio stage result must record its source Pipeline Outcome revision and the Studio resource versions consumed.
4. Implement the Studio Quality Gate integration point: the gate is already implemented in M04; this milestone integrates it into the Studio execution flow. Q0–Q2 Studio results route through the Revision Coordinator; Q3 results advance to finalization.
5. Implement the Studio revision routing rule: a Studio-only presentation failure reruns the affected Studio stage and Studio gate. A Studio finding caused by educational reasoning (e.g., the Mental Model was wrong) must return to the responsible educational stage, which causes the Pipeline Outcome and Studio Outcome to be rebuilt.
6. Confirm that the Router contains no educational reasoning.

**Tests and failure cases.**
- Exactly one Studio path is selected from a resolved LES format field.
- Unsupported formats never silently map to a supported path.
- Studio cannot run without a Q3 Pipeline Outcome.
- Router contains no educational reasoning: code review and architecture check.
- No incomplete processor is exposed as a supported route (all routes disabled at M12).

**Review evidence.** Reviewer confirms: routing exclusivity, four-format scope, Pipeline dependency, shared Studio contracts, absence of educational mutation.

**Deployable unit.** Studio orchestration package with all format routes disabled.

**Deployment validation.** Router validates and rejects an unsupported format. Router confirms registered processors (none at this point) without exposing placeholder routes.

**Completion evidence.** Router validates and selects installed processors without producing a placeholder outcome.

**Rollback approach.** Undeploy Studio Framework package.

**Handoff instructions.** Record Studio framework version, processor registration mechanism.

---

### M13 — Comic Studio Path

**Prerequisites.** M01 through M12 complete. CP1.md and CP2.md available and versioned in Knowledge Resource / Prompt Resource adapter.

**Exact scope.** Implement the complete Comic Studio path from Q3 Pipeline Outcome through CP1 and CP2 to a final Markdown Comic Studio Outcome. Enable the Comic route in the Studio Router.

**Out of scope.** No One-Page Comic. No Video. No Audio. No educational reasoning changes.

**Files and modules expected.**
- `software/production/studio/comic/` — CP1 blueprint stage processor and CP2 final prompt stage processor.

**Work sequence.**
1. Implement CP1: accept the Q3 Pipeline Outcome and versioned CP1 resource; produce a comic production blueprint as defined by CP1.md. The blueprint covers: learning summary, story structure, comic page plan, character bible, environment bible, and historical/accuracy notes (adapted to the educational content, not historical content). Record intermediate stage result and resource version.
2. Implement CP1 scope constraint: CP1 produces a blueprint, not the final Markdown. CP1 must not change the educational identity of the Pipeline Outcome.
3. Implement CP2: accept the CP1 result and versioned CP2 resource; produce the complete final Markdown comic production prompt as defined by CP2.md. CP2 cannot run without a valid CP1 result.
4. Implement comic representation-fidelity evaluation: the Studio Quality Gate must verify that the Comic output preserves objective, misconceptions, Mental Model, Scenario purpose, Pattern Mapping, episode progression, assessment, and reflection.
5. Implement Studio Quality revision loop: a Comic-only presentation failure reruns only the responsible Comic stage (CP1 or CP2). An educational failure routes upstream and rebuilds the Pipeline before Comic reruns.
6. Enable the Comic route in the Studio Router.

**Tests and failure cases.**
- CP2 cannot run without a valid CP1 result.
- Comic output preserves all required educational elements.
- Output is complete Markdown.
- Comic-only failures rerun only the responsible Comic stage.
- Educational failures route upstream and rebuild Pipeline before Comic reruns.
- CP1 and CP2 resource versions are recorded in the Studio Outcome traceability.

**Review evidence.** Reviewer confirms: CP1/CP2 fidelity against CP1.md and CP2.md, comic production completeness, educational preservation, traceability, Quality revision behaviour.

**Deployable unit.** Comic Studio processor package with Comic route enabled.

**Deployment validation.** Q3 Pipeline Outcome produces a Q3 Comic Studio Outcome.

**Completion evidence.** Q3 Pipeline Outcome → Q3 Comic Studio Outcome with full traceability.

**Rollback approach.** Undeploy Comic processor; disable Comic route.

**Handoff instructions.** Record processor version, CP1/CP2 resource versions used.

---

### M14 — One-Page Comic Studio Path

**Prerequisites.** M01 through M12 complete. `1_Page_Comic_Example.md` available and versioned.

**Exact scope.** Implement the complete One-Page Comic path using the authoritative reference example. Enable the One-Page Comic route.

**Out of scope.** No Comic (CP1/CP2). No Video. No Audio.

**Files and modules expected.**
- `software/production/studio/one-page-comic/` — One-Page Comic processor.

**Work sequence.**
1. Implement the one-page transformation processor: accept the Q3 Pipeline Outcome and the versioned `1_Page_Comic_Example.md` resource; produce a one-page Markdown deliverable that fits the one-page format constraint without dropping mandatory educational stages.
2. Implement completeness and constraint validation: the output must represent all required educational components within the one-page constraint. If a component cannot fit, this is a Quality failure, not a silent omission.
3. Implement representation-fidelity Quality loop as per M13 pattern.
4. Confirm the processor does not invoke CP1/CP2 unless the approved one-page contract explicitly requires it. The one-page path has an independent resource (`1_Page_Comic_Example.md`) and does not share stages with the multi-page Comic path.
5. Enable the One-Page Comic route in the Studio Router.

**Tests and failure cases.**
- Output fits the one-page format without dropping mandatory educational stages.
- Output preserves the exact source Pipeline revision.
- Output is complete Markdown.
- Failures route correctly without affecting the Comic path.

**Review evidence.** Reviewer confirms: one-page constraints met, educational completeness, reference fidelity, isolation from Comic path.

**Deployable unit.** One-Page Comic processor package.

**Deployment validation.** Q3 Pipeline Outcome produces a Q3 One-Page Comic Studio Outcome.

**Completion evidence.** Q3 Pipeline Outcome → Q3 One-Page Comic Studio Outcome.

**Rollback approach.** Undeploy processor; disable One-Page Comic route.

**Handoff instructions.** Record processor version, reference resource version.

---

### M15 — Video Studio Path

**Prerequisites.** M01 through M12 complete. VP1.md and VP2.md available and versioned.

**Exact scope.** Implement the complete Video path through VP1 and VP2 to a final Markdown Video Studio Outcome. Enable the Video route.

**Out of scope.** No binary video generation. No Comic. No Audio.

**Files and modules expected.**
- `software/production/studio/video/` — VP1 production blueprint stage and VP2 final production prompt stage.

**Work sequence.**
1. Implement VP1: accept the Q3 Pipeline Outcome and versioned VP1 resource; produce a video production blueprint as defined by VP1.md. Covers: learning summary, story overview, scene breakdown (each 6–10 seconds), character bible, environment bible, prop bible, visual style guide, global production rules. Record intermediate stage result and resource version.
2. Implement VP1 scope constraint: VP1 produces a blueprint; it must not change the educational identity of the Pipeline Outcome.
3. Implement VP2: accept the VP1 result and versioned VP2 resource; produce the complete final Markdown video production prompt. VP2 cannot run without a valid VP1 result.
4. Implement video representation-fidelity evaluation: scene/pacing/narration/visual/transition validation. Output is complete Markdown, not binary video.
5. Implement Studio Quality revision loop as per M13 pattern.
6. Enable the Video route.

**Tests and failure cases.**
- VP2 cannot run without a valid VP1 result.
- Output preserves the complete educational chain.
- Timing and production directions are internally coherent.
- Output is complete Markdown.
- Video-only revision does not mutate Pipeline artifacts.

**Review evidence.** Reviewer confirms: VP1/VP2 compliance against VP1.md and VP2.md, pacing, production completeness, fidelity, revision scope.

**Deployable unit.** Video Studio processor package.

**Deployment validation.** Q3 Pipeline Outcome → Q3 Video Studio Outcome.

**Completion evidence.** Q3 Pipeline Outcome → Q3 Video Studio Outcome with traceability.

**Rollback approach.** Undeploy processor; disable Video route.

**Handoff instructions.** Record processor version, VP1/VP2 resource versions.

---

### M16 — Audio/Podcast Studio Path

**Prerequisites.** M01 through M12 complete. Audio/Podcast script resource available and versioned.

**Exact scope.** Implement the complete Audio/Podcast final-script path to a Markdown audio script Studio Outcome. Enable the Audio/Podcast route.

**Out of scope.** No binary audio. No Comic. No Video.

**Files and modules expected.**
- `software/production/studio/audio-podcast/` — Audio/Podcast script processor.

**Work sequence.**
1. Implement the Audio/Podcast processor: accept the Q3 Pipeline Outcome and versioned audio resource; produce a complete Markdown audio/podcast script. The script must be suitable for spoken delivery.
2. Implement audio-suitability validation: spoken-language clarity, pacing, cue/transition/recap markers, practice sections, and reflection sections must be represented through narration. Visual dependence must be absent or adapted into audio narration. Output is complete Markdown, not binary audio.
3. Implement educational intent and progression preservation: assessment, reflection, and success criteria must remain unchanged.
4. Implement Studio Quality revision loop: Audio-only failures remain isolated to this processor unless caused by an upstream educational error.
5. Enable the Audio/Podcast route.

**Tests and failure cases.**
- Output is suitable for spoken delivery: no visual-only instructions without audio equivalent.
- Educational intent and progression remain unchanged.
- Output is complete Markdown.
- Audio-only failures remain isolated unless caused upstream.

**Review evidence.** Reviewer confirms: spoken clarity, pacing, completeness, fidelity, strict medium scope.

**Deployable unit.** Audio/Podcast Studio processor package.

**Deployment validation.** Q3 Pipeline Outcome → Q3 Audio/Podcast Studio Outcome.

**Completion evidence.** Q3 Pipeline Outcome → Q3 Audio/Podcast Studio Outcome with traceability.

**Rollback approach.** Undeploy processor; disable Audio/Podcast route.

**Handoff instructions.** Record processor version, audio resource version.

---

### M17 — Finalization and Dual-Outcome Publication

**Prerequisites.** M01 through M16 complete. All four Studio paths operational. M02 Final Outcome Port and Audit Log Port operational.

**Exact scope.** Implement the guarded finalization transaction: precondition validation, immutable dual-outcome envelope creation, atomic persistence, Audit Log serialization and persistence, completion publication, RuntimeContext freeze and destruction, and safe failure behaviour for persistence errors.

**Out of scope.** No new engine. No new Studio path. No public API. No frontend.

**Files and modules expected.**
- `software/runtime/finalization/` — Finalizer, precondition validator, context freeze and destruction logic.

**Work sequence.**
1. Implement the finalization precondition validator: verify Pipeline Outcome is Q3 and references only current Q3 artifacts. Verify Studio Outcome is Q3 and references that exact Pipeline Outcome revision. If either check fails, finalization must not proceed.
2. Implement RuntimeContext freeze: mark the context against further educational mutation. The frozen context is used to build the Audit Log snapshot; no changes may be made to RuntimeContext after freeze.
3. Implement the immutable dual-outcome envelope builder: combine Pipeline Outcome and Studio Outcome into one finalized envelope. Assign a finalization timestamp. The envelope is immutable once built.
4. Implement atomic outcome persistence: persist the dual-outcome envelope through the Final Outcome Port. The entire envelope must be committed atomically. If persistence fails, the execution does not advance to `COMPLETED`. Retry according to operational policy; on exhaustion, fail safely.
5. Implement Audit Log serialization: build the full execution record from the frozen RuntimeContext snapshot — original and resolved request, initiator metadata, runtime decisions, artifact revisions with Q-levels, stage and gate checkpoint results, Quality feedback, revision history, execution order, final outcome references, failures, and all timestamps. Exclude secrets, credentials, private chain-of-thought, and undocumented provider internals.
6. Implement Audit Log persistence: persist through the Audit Log Port before marking the execution `COMPLETED`. If Audit Log persistence fails, completion is not published. Retry according to operational policy.
7. Implement completion publication: after both outcome and Audit Log are durably written, transition execution to `COMPLETED`, make the outcome envelope publicly retrievable, and publish the completion event.
8. Implement RuntimeContext destruction: after publication, destroy RuntimeContext and clear all temporary provider and prompt state. Active Context Port must confirm destruction.
9. Implement safe failure behaviour: if any finalization step fails after retries, the execution moves to `FAILED`. Partial outcome delivery is prohibited. Any written Audit information is preserved.

**Tests and failure cases.**
- Finalization rejects any Q0–Q2 outcome (Pipeline or Studio): attempt finalization with a Q2 Studio Outcome; confirm rejection.
- Studio source revision must equal the finalized Pipeline revision: create a mismatch; confirm rejection.
- Neither outcome is readable before the complete envelope is committed: simulate a mid-write interruption; confirm partial read returns not-found.
- Audit persistence succeeds before completion is published: confirm execution cannot reach `COMPLETED` without Audit Log written.
- RuntimeContext is available during finalization and destroyed afterward: probe the Active Context adapter before and after finalization.
- Failed finalization never exposes partial success: force a persistence failure after envelope build; confirm no partial outcome is readable.
- Audit Log remains readable after context destruction.

**Review evidence.** Reviewer confirms: atomicity, ordering, lifecycle guarantees, failure recovery, public/private boundaries, Audit Log completeness.

**Deployable unit.** Complete Runtime and finalization stack; can now complete all four Version 2 execution paths through internal interfaces.

**Deployment validation.** Execute one complete internal execution through each Studio path. Confirm: two linked Q3 outcomes, one Audit Log, no surviving active RuntimeContext for each.

**Completion evidence.**
Every successful internal execution produces two linked Q3 outcomes, one Audit Log, and no surviving active RuntimeContext.

**Rollback approach.** Undeploy Finalization component. Internal executions revert to M16 state (can produce Q3 outcomes but cannot finalize).

**Handoff instructions.** Record Finalizer version, atomicity mechanism, Audit Log schema version, any retry policy decisions.

---

### M18 — Public Backend API

**Prerequisites.** M01 through M17 complete with full internal execution stack operational.

**Exact scope.** Expose the complete Runtime through the approved Version 2 API without leaking internals. Implement all six approved public operations, public error translation, and the backend composition root.

**Out of scope.** No frontend. No new Runtime logic. No additional operations beyond the six approved.

**Files and modules expected.**
- `software/apps/api/` — API controllers, Execution Application Service, Runtime Host, Composition Root, and all backend infrastructure wiring.

**Work sequence.**
1. Implement `POST /api/v2/executions`: accept natural-language, partial-structured, or fully-structured request bodies; validate required fields (Educational Intent, Desired Studio Format); submit to Runtime; return execution ID, public status, clarification requirement if known, status resource URL, event resource URL, and outcome resource URL.
2. Implement `POST /api/v2/executions/{executionId}/clarifications`: accept answers to Runtime-requested fields only; validate; submit to the same execution and RuntimeContext; return public status and any remaining mandatory clarification.
3. Implement `GET /api/v2/executions/{executionId}`: return execution ID, public status (one of the six approved values only), current learner-safe progress stage and message, clarification requirement, completion/failure information, and outcome availability flag.
4. Implement `GET /api/v2/executions/{executionId}/events`: return learner-safe progress events using the nine approved stage labels only. Support polling or streaming as chosen by the implementation. Event content: execution ID, stage, safe message, optional percentage reflecting real state, timestamp.
5. Implement `GET /api/v2/executions/{executionId}/outcomes`: available only when status is `completed`; return the immutable finalized dual-outcome envelope (execution metadata, Pipeline Outcome, Studio Outcome in Markdown, source relationship, Q3 approval summaries). Optionally expose separate Pipeline or Studio member routes that still return only from the same finalized envelope.
6. Implement public error translation: all failures must produce a learner-safe error response in the four approved categories (invalid request, unsupported output, clarification required, execution unavailable). No stack traces, prompts, provider errors, Quality reports, internal artifacts, credentials, or Audit Log details.
7. Confirm that controllers never call individual engines, Studio processors, Quality evaluators, or providers directly. Controllers delegate to the Execution Application Service, which delegates to the Runtime.
8. Implement backend composition root: bind all contracts and ports to their implementations; wire the Runtime, domain modules, and infrastructure adapters.
9. Implement deployment health and readiness endpoints for operational use.
10. Confirm that these operations do not exist: Regenerate, manual Improve, representation conversion, direct engine invocation, prompt editing, RuntimeContext retrieval, internal Quality Report retrieval, Audit Log retrieval.

**Tests and failure cases.**
- API contracts match M01 public-api contract exactly: schema conformance test.
- Controllers never call engines directly: architecture check.
- Public statuses limited to approved values: inject an internal state value; confirm it does not appear in any API response.
- Q0/Q2/revision details never appear in API responses.
- Outcome endpoint unavailable before atomic finalization.
- Prohibited operations return 404/405 rather than executing.
- All four Studio formats complete through the same public execution lifecycle.
- Error responses contain only approved safe category and message fields.

**Review evidence.** Reviewer confirms: transport thinness, contract compatibility, error safety, composition correctness, full delegation to Runtime.

**Deployable unit.** Complete backend service in staging, independently usable through API clients.

**Deployment validation.** Submit all four Studio format requests through the API. Each must complete with both outcomes available. Attempt a Regenerate operation; confirm 404/405 response.

**Completion evidence.** The entire Version 2 backend is production-complete and externally testable through approved API contracts.

**Rollback approach.** Undeploy backend service. Redeploy previous version (M17 internal stack).

**Handoff instructions.** Record API package version, composition root configuration, any operational policy decisions made (retry limits, abandoned-execution cleanup, outcome retention).

---

### M19 — Web Request and Clarification Experience

**Prerequisites.** M01 through M18 complete with backend staging deployment operational.

**Exact scope.** Implement the first learner-facing UI: application shell, branding, request workspace (simple and advanced), Studio format selection, Educational Context and Surprise Me controls, and clarification panel. No result presentation.

**Out of scope.** No result or progress experience (M20). No new backend logic. No Regenerate or Improve controls. No accessibility-standard compliance work.

**Files and modules expected.**
- `software/apps/web/` — PyBe web application: shell, branding, request workspace, clarification panel.

**Work sequence.**
1. Implement the application shell: PyBe branding and identity, responsive layout, light/dark theme foundation, learner-safe error boundary.
2. Implement the simple request mode: Learning Goal (Educational Intent), Desired Studio Format selector (exactly four options), Target Audience, and Educational Context or Surprise Me control. These are the default visible controls per the frozen architecture Section 8.2.
3. Implement progressive disclosure: Advanced Preferences section (collapsed by default) containing programming language, duration, Production Profile or platform, experience hints, experience constraints, additional output notes. These are all optional.
4. Implement frontend validation: only syntactic required-field checks (is Learning Goal non-empty? is a Studio format selected?). The frontend must not perform semantic sufficiency, inference, defaults, Context selection, or compatibility checking. Those belong to the Runtime.
5. Implement Surprise Me: pass the learner's "Surprise Me" selection as an intent to the backend. The frontend must not randomly select a context on behalf of the learner.
6. Implement the request submission flow: call `POST /api/v2/executions`, receive the execution ID, transition to the execution state.
7. Implement the clarification panel: display only the clarification fields returned by the Runtime; do not invent additional questions; submit answers to `POST /api/v2/executions/{id}/clarifications`; preserve the execution ID across clarification rounds.
8. Implement safe request and validation error display: use the four approved safe error categories; never display stack traces or technical details.
9. Confirm no educational inference exists in the frontend.

**Tests and failure cases.**
- Required inputs and labels match the public API contract.
- Advanced controls remain optional and progressively disclosed.
- Frontend performs no educational inference: code review.
- Surprise Me is passed as intent, not randomly resolved by the frontend.
- Clarification remains attached to the same execution ID.
- No unsupported output option, Improve control, or Regenerate control appears.
- Responsive and theme behaviour is consistent across viewports.

**Review evidence.** Reviewer confirms: cognitive load reduction, PyBe product identity, API-only state ownership, progressive disclosure, no educational logic.

**Deployable unit.** Request UI deployed against staging backend. Result presentation not publicly released.

**Deployment validation.** Submit each of the four Studio format types through the UI. Trigger a clarification flow. Confirm answers are submitted to the same execution. Confirm no unsupported operation is available.

**Completion evidence.** The learner can correctly create every supported Version 2 request and answer required clarification through the web application.

**Rollback approach.** Undeploy web application. Backend (M18) remains operational.

**Handoff instructions.** Record web application version, any UX decisions made, any theme or branding decisions.

---

### M20 — Web Progress and Dual-Outcome Experience

**Prerequisites.** M01 through M19 complete.

**Exact scope.** Complete the learner-facing application with meaningful progress display and full Pipeline/Studio result presentation.

**Out of scope.** No new backend logic. No Regenerate or Improve controls. No accessibility-standard compliance work.

**Files and modules expected.**
- `software/apps/web/` — extended with progress timeline, Pipeline Outcome renderer, Studio Markdown renderer, dual-outcome result workspace, copy/download actions.

**Work sequence.**
1. Implement the educational progress timeline: subscribe to `GET /api/v2/executions/{id}/events` (polling or streaming); display only the nine approved learner-safe stage labels; use educational language rather than generic "thinking" or "generating" text; remain responsive during long execution; display nothing that reveals internal engine names, Q0–Q2, revision counts, or attempt numbers.
2. Implement long-running execution behaviour: handle executions that take multiple minutes without timing out the frontend; show meaningful progress at each stage; handle gracefully the case where no progress event has arrived for an extended period.
3. Implement the Pipeline Outcome renderer: display the Q3-approved educational blueprint — objective, misconception profile, mental model, scenario, pattern mapping, episode plan, generic production blueprint, and safe approval summary. This must feel like an educational artifact, not a chat message.
4. Implement the Studio Outcome renderer: render the complete final Markdown deliverable for the selected Studio format. The Markdown renderer must be safe (no script injection, no external resource loading without intent).
5. Implement the unified dual-outcome result workspace: both Pipeline and Studio views available in the same result experience. The result workspace must present both outcomes from the same finalized envelope — never independently fetched before finalization is complete.
6. Implement copy and download actions: operate only on Q3 finalized outcomes. Copy must copy the full content of the selected outcome. Download must produce a well-formed file.
7. Implement the safe failure experience: display the learner-safe failure message from the API; offer the option to start again (new request); do not display a Regenerate option.
8. Implement the new-request path: starting again navigates back to the request workspace and creates a fresh execution; it does not reuse or continue the previous execution.
9. Confirm results are not presented as a chat transcript.

**Tests and failure cases.**
- Progress uses only public backend events.
- No internal engine output, prompt, Q0–Q2 report, revision, or provider detail appears.
- Results remain unavailable until both outcomes are finalized.
- Pipeline and Studio views render from the same finalized envelope.
- Copy/download operate only on Q3 outcomes.
- Starting again creates a new execution, not a continuation.
- Safe failure experience is educational and does not reveal technical details.

**Review evidence.** Reviewer confirms: learning-focused presentation, dual-outcome clarity, Markdown rendering safety, progress semantics, responsive behaviour, strict public-data boundaries.

**Deployable unit.** Complete PyBe web application against Version 2 backend.

**Deployment validation.** Execute the complete learner journey for all four Studio formats: request, clarification (if triggered), progress display, dual-outcome result, copy/download. Confirm no internal detail leaks into the UI at any point.

**Completion evidence.** The complete learner journey works from request through clarification, progress, and delivery of both approved outcomes.

**Rollback approach.** Redeploy previous web application version (M19). Backend (M18) remains operational.

**Handoff instructions.** Record web application version, any UX decisions made for result presentation, any Markdown rendering configuration.

---

### M21 — Version 2 Release Candidate

**Prerequisites.** M01 through M20 all complete with exit criteria satisfied.

**Exact scope.** Produce the first complete, reviewable, and deployable Version 2 release candidate. Conduct final compliance verification, operational verification, cross-format verification, and release documentation. No new feature work.

**Out of scope.** No new architecture. No new functionality. No architectural changes (those require Evolution Engine). This milestone verifies and packages existing work.

**Files and modules expected.**
- Complete backend and web deployment manifests.
- CKLIS Validation Suite execution report.
- Architecture dependency and forbidden-feature audit report.
- Release notes with traceability from milestone deliverables to Architecture Version 2.0.0.
- Operational verification report.

**Work sequence.**
1. Verify all M01–M20 exit criteria are still satisfied together. Run each milestone's independent tests in the production-equivalent environment.
2. Execute the full CKLIS Validation Suite v2.0 (all sections: LES, Runtime, Misconception, Mental Model, Scenario, Pattern, Episode, Production, Quality, Output Schema, Representation Fidelity, Regression Tests, End-to-End Pipeline, Stress Tests) for all four Studio paths.
3. Execute cross-provider conformance evidence where more than one AI provider is configured: confirm the same educational input produces Q3 outcomes from both providers and that provider identity does not leak.
4. Execute operational failure and recovery verification: simulate storage failure during finalization; simulate AI provider timeout; simulate mid-execution failure; confirm all fail safely, write available Audit information, and destroy RuntimeContext.
5. Verify Audit Log completeness for each failure mode: confirm developer can reconstruct what happened from the Audit Log alone.
6. Execute the architecture dependency and forbidden-feature audit: run architecture checks; confirm no prohibited product capability (Regenerate, Improve, direct engine invocation, prompt editing, RuntimeContext retrieval, Audit Log public retrieval) exists; confirm no reverse dependency exists.
7. Conduct separate reviews: architecture review, educational-quality review, backend review, frontend review, operational review, product-scope review. Any architectural change request discovered during this milestone must be routed through the Evolution Engine rather than resolved inline.
8. Produce deployment manifests for backend and web application covering all required configuration, port bindings, environment variables (names only, not values), health and readiness endpoint configuration, and rollback procedure.
9. Produce release notes: version table for all components; traceability from each milestone deliverable to the frozen architecture section(s) it implements; list of all fixed Version 2 product decisions confirmed in the release; list of intentionally out-of-scope items.
10. Tag the release candidate in source control.

**Tests and failure cases.**
- End-to-end tests for natural-language, structured, partial, conflicting, and clarification-required requests across all four Studio formats.
- Every educational engine and Quality revision path exercised.
- Every Studio format reaches Q3 and returns both outcomes.
- Finalization is atomic under storage and provider failure conditions.
- RuntimeContext is destroyed after success and terminal failure.
- No forbidden product capability or dependency.
- CKLIS Validation Suite score meets the agreed production-readiness threshold.
- Cross-provider evidence produced.

**Review evidence.** All six separate reviews (architecture, educational-quality, backend, frontend, operational, product-scope) have been conducted. Each produces a written verdict. Any open concern that touches the frozen architecture is recorded as an Evolution Engine referral, not as a release blocker for unchanged scope.

**Deployable unit.** Complete Version 2 release candidate to the production-equivalent environment as one versioned system. Production promotion requires explicit product owner release approval.

**Deployment validation.** Full end-to-end validation across all four Studio formats in the production-equivalent environment. All tests pass. Validation Suite score meets the threshold. Operational failure scenarios behave safely.

**Completion evidence.**
- All milestone exit criteria remain satisfied together.
- Architecture Version 2.0.0 compliance is proven.
- No placeholders, incomplete paths, or hidden scope additions remain.
- System is ready for production approval.

**Rollback approach.** Redeploy the previous stable deployment of all backend and web components together. Because M21 introduces no new features, rollback is equivalent to returning to the M20 deployment state.

**Handoff instructions.** Record release candidate version, Validation Suite results, six review verdicts, deployment manifest versions, any Evolution Engine referrals generated, explicit product owner release approval decision.

---

## 16. Inter-Milestone Dependencies Summary

```
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
           ↓ (all four must be complete)
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

M13–M16 may be developed in parallel after M12 is complete because they share contracts but do not depend on one another. Their files and processor ownership must remain separate. All four must be complete before M17 begins, because M17 must validate all four Studio paths through the finalization transaction.

---

## 17. Specification Compliance Quick Reference

| Specification | Primary consumption milestone(s) |
|---|---|
| Project Charter | M01 (contract philosophy), M21 (compliance audit) |
| Constitution | M04 (Quality), M06–M10 (every engine), M21 |
| Learning Science | M06–M10 (every engine), M04 (Quality), M21 |
| Misconception Engine | M06 |
| Mental Model Engine | M07 |
| Scenario Intelligence Engine | M08 |
| Pattern Mapping Engine | M09 |
| Episode Generation Engine | M10 |
| Production Engine | M11–M16 |
| Quality Engine | M04, M06–M16 (stage checkpoints), M17 (finalization gate) |
| Evolution Engine | Any milestone where an architectural concern is discovered |
| CKMS | M05 (CKMS Context Builder), M06–M10 |
| LES | M05 (LES Resolver and Clarification) |
| SPRS | M18 (API), M19–M20 (frontend), M21 |
| AI-01 Runtime | M05–M17 |
| AI-02 Master Prompt | M03 (Prompt Composer) |
| AI-03 Output Schema | M01 (artifact contracts), M06–M11 |
| AI-04 Prompt Library | M03 (Prompt Composer), M13–M16 |
| CP1, CP2 | M13 |
| 1_Page_Comic_Example | M14 |
| VP1, VP2 | M15 |
| Audio/Podcast resource | M16 |
| CKLIS Validation Suite | M04, M21 (full suite) |

---

*End of Technical Implementation Playbook Version 1.0.0*
