# PyBe / CKLIS Version 2 — AI Continuation Protocol

**Document version:** 1.0.0  
**Status:** Active operating instruction  
**Architecture baseline:** Software Architecture Version 2.0.0, frozen 2026-07-26  
**Purpose:** Ensure any AI agent can continue implementation safely after a context limit, model switch, tool switch, or interrupted session.

---

# 1. Standing Instruction to Every AI Agent

You are implementing PyBe / CKLIS Version 2 one milestone at a time.

You must:

1. Work only on the first milestone that is not `Complete — Verified` in `Implementation Handoff Ledger.md`.
2. Complete, test, review, and deploy that milestone within its declared scope before starting another milestone.
3. Follow the frozen architecture and the milestone's exact procedure in `Technical Implementation Playbook.md`.
4. Never silently change architecture, product scope, contracts, or Version 2 decisions.
5. Route any required architectural change through the Evolution Engine before implementation continues.
6. Update the Handoff Ledger at the start and end of every work session.
7. Update Core Memory after each completed milestone with only durable handoff facts and canonical document pointers; do not store secrets or transient debugging details.
8. Verify repository state and test evidence directly. Never trust a prose claim that work is complete when files or passing tests are missing.
9. Never start the next milestone in the same session unless the current milestone is `Complete — Verified`, all required records are updated, and sufficient context remains to finish the next milestone safely.
10. When context or execution limits are near, stop at a safe boundary and perform the limit-recovery procedure in this document.

---

# 2. Canonical Control Files

Read these files before implementation work:

1. `Software Architecture.md` — frozen architecture and immutable boundaries.
2. `Implementation Milestones.md` — milestone order and completion criteria.
3. `Technical Implementation Playbook.md` — detailed procedure for M01–M21.
4. `Implementation Handoff Ledger.md` — current status, versions, evidence, blockers, and exact next action.
5. `AI Continuation Protocol.md` — this operating instruction.
6. The official project specifications required by the current milestone.

The Handoff Ledger is the mutable resume point. The repository and current test results are the proof of truth.

---

# 3. What the Current AI Must Do

## 3.1 At the beginning of a session

1. Read this protocol.
2. Read the Handoff Ledger completely.
3. Identify the first milestone not marked `Complete — Verified`.
4. Inspect the repository for that milestone's claimed artifacts.
5. Rerun relevant existing tests before relying on prior completion claims.
6. Read the complete milestone procedure in the Playbook.
7. Read the specification files listed for that milestone.
8. Check blockers, open decisions, and Evolution Engine referrals.
9. Mark the milestone `In Progress` if implementation work begins.
10. Add or update its Milestone Detail Record with the start date and session intent.

## 3.2 While working

1. Stay inside the current milestone's exact scope.
2. Do not implement later-milestone behavior early.
3. Record nontrivial implementation choices in the Ledger Decision / Change Log.
4. Do not record secret values anywhere.
5. Add complete tests alongside the implementation.
6. Keep architecture dependency checks passing.
7. If a specification conflict appears, use the CKLIS ambiguity-resolution process. Do not guess.
8. If the conflict requires changing frozen architecture, stop and create an Evolution Engine referral.

## 3.3 Before declaring a milestone complete

1. Verify every deliverable in the Playbook exists.
2. Run all milestone tests in the current environment.
3. Run architecture and contract checks.
4. Run applicable specification-compliance and Validation Suite checks.
5. Perform the milestone-specific review.
6. Deploy the milestone's declared deployable unit to its required environment.
7. Run deployment validation.
8. Record artifact versions, exact test evidence, review outcome, deployment evidence, decisions, and blockers in the Ledger.
9. Mark the milestone `Complete — Verified` only after all evidence exists.
10. Update the component version registry.
11. Update the Last Session Summary.
12. Update the durable implementation-handoff memory card with the completed milestone and next milestone pointer.

---

# 4. Limit-Recovery Procedure

Use this procedure whenever the AI warns that its context, message, execution, or tool limit is close.

## 4.1 Stop safely

- Do not begin another large edit or another milestone.
- Finish the smallest currently open atomic change if it can be completed and tested safely.
- If it cannot be completed safely, leave the milestone `In Progress`; do not mark it complete.
- Do not claim tests passed unless they were actually run and evidence was recorded.

## 4.2 Preserve exact state

Update `Implementation Handoff Ledger.md` with:

- Current milestone and status.
- Files created or modified.
- Commands/tests run and their results.
- Artifact versions, if any.
- Completed work.
- Incomplete work.
- Exact next action, including the file and section to continue from.
- Decisions made.
- Active blockers or risks.
- Whether the working tree is currently expected to pass tests.

Update the relevant Milestone Detail Record and Last Session Summary.

## 4.3 Update memory

Update the CKLIS implementation-handoff memory card with only:

- Last milestone verified complete.
- Current milestone and status.
- Exact canonical Ledger and Playbook pointers.
- Any durable accepted implementation decision that future sessions must know and that is not already obvious from repository documentation.

Do not copy logs, secret values, temporary failures, or large status tables into memory.

## 4.4 Message the user

Tell the user:

1. Why work stopped.
2. Last verified milestone.
3. Current milestone and status.
4. Whether tests currently pass.
5. Exact file to give the next AI: `AI Continuation Protocol.md`.
6. Exact additional state file: `Implementation Handoff Ledger.md`.
7. Whether the next AI has workspace access or requires copied/downloaded files.

---

# 5. What the User Must Do When Switching AI

## If the new AI has access to this workspace

The user only needs to say:

> Continue the PyBe / CKLIS Version 2 implementation. Read `personal/PyBe/AI Continuation Protocol.md` first and follow it exactly. Then read `personal/PyBe/Implementation Handoff Ledger.md`, verify the repository and tests, and continue only the first milestone not marked `Complete — Verified`.

No conversation transcript is required.

## If the new AI does not have access to this workspace

The user should provide or upload these files:

1. `AI Continuation Protocol.md`.
2. `Implementation Handoff Ledger.md`.
3. `Technical Implementation Playbook.md`.
4. `Implementation Milestones.md`.
5. `Software Architecture.md`.
6. The complete current project repository, including all official specifications and the `software/` directory.
7. Any test/deployment evidence referenced by the Ledger but stored outside the repository.

Then paste the bootstrap prompt in Section 6.

Do not paste API keys, tokens, passwords, environment values, or private credentials.

---

# 6. Paste-Ready Bootstrap Prompt for Another AI

Copy and paste this message into the new AI tool:

```text
You are continuing implementation of PyBe / CKLIS Version 2.

The architecture is frozen. Do not redesign it.

First read these files in order:
1. AI Continuation Protocol.md
2. Implementation Handoff Ledger.md
3. Software Architecture.md
4. Implementation Milestones.md
5. Technical Implementation Playbook.md
6. The official specification files required by the current milestone

Then:
- Inspect the repository and rerun the current milestone's relevant tests.
- Do not trust completion claims from prose unless files and passing tests verify them.
- Identify the first milestone not marked “Complete — Verified”.
- Work only on that milestone.
- Follow its complete Playbook procedure, scope, tests, review, deployment validation, and handoff requirements.
- Never add placeholders or implement later milestones early.
- Never change frozen architecture without the Evolution Engine and a new approved architecture version.
- Never expose or record secrets.
- Before stopping, update the Handoff Ledger, Milestone Detail Record, Component Version Registry, Last Session Summary, and durable implementation-handoff memory/pointer.
- If your context limit approaches, follow the Limit-Recovery Procedure in AI Continuation Protocol.md and leave an exact next action.

Start by reporting:
1. Last verified milestone.
2. Current milestone.
3. Repository/test verification result.
4. Exact work you will perform next.
```

---

# 7. Mandatory End-of-Milestone Updates

After every verified milestone, update all applicable items below:

| Item | Required update |
|---|---|
| `Implementation Handoff Ledger.md` status table | Mark milestone `Complete — Verified`; identify next milestone |
| Milestone Detail Record | Artifacts, versions, tests, compliance, review, deployment, decisions, blockers, handoff |
| Component Version Registry | Add or update every published component version |
| Decision / Change Log | Record accepted implementation choices |
| Blockers and Risks | Resolve or carry forward accurately |
| Last Session Summary | State exactly what completed and what comes next |
| Core Memory implementation-handoff card | Compact durable milestone and next-action pointer |
| User-facing completion message | Links, evidence summary, next milestone, transfer instructions |

The frozen architecture is not edited merely because a milestone completed.

---

# 8. Required User-Facing Milestone Completion Message

At milestone completion, use this structure:

```text
Milestone MXX — [Name] is Complete — Verified.

Implemented:
- [bounded deliverables]

Verification:
- Tests: [exact suite/result]
- Architecture checks: [result]
- Specification compliance: [result]
- Review: [result]
- Deployment validation: [environment/result]

Records updated:
- Implementation Handoff Ledger
- Component Version Registry
- Decision/Blocker records as applicable
- Durable implementation-handoff memory

Next milestone:
- MYY — [Name]

If switching AI now:
- Give the next AI `AI Continuation Protocol.md` and `Implementation Handoff Ledger.md`.
- If it lacks workspace access, also provide the frozen architecture, milestone plan, playbook, repository, specifications, and referenced evidence.
- Paste the bootstrap prompt from Section 6 of the Continuation Protocol.
```

---

# 9. Current Baseline

As of 2026-07-26:

- Architecture Version 2.0.0 is approved and frozen.
- Implementation Milestones Plan Version 1.0.0 is active.
- Technical Implementation Playbook Version 1.0.0 is active.
- Handoff Ledger Version 1.0.0 is the current resume point.
- No implementation milestone is yet `Complete — Verified`.
- No implementation code has begun.
- Next milestone: **M01 — Contract and Repository Foundation**.

Always read the Handoff Ledger for newer state. This baseline section is informative; the Ledger is the mutable status authority.
