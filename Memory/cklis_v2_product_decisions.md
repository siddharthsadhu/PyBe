---
name: CKLIS Version 2 product decisions
description: Apply whenever reviewing, implementing, or resolving ambiguity in the PyBe/CKLIS Version 2 project.
---

Authoritative decisions from Sad for CKLIS Version 2:

- `Master_AI_Development_Prompt.md` is the renamed project `AGENTS.md` and governs the implementation AI. `Runtime/AI-02 Master Prompt.md` remains the internal CKLIS Runtime prompt inherited from the previous system; these are distinct documents with distinct roles.
- PyBe and CKLIS are the same system: **CKLIS** is the architectural/developer name; **PyBe** is the external product identity. Learners see only PyBe.
- The active Runtime Context exists only for one complete execution. It is destroyed only after all internal Quality iterations finish and both Pipeline Outcome and Studio Outcome have been produced. A separate persistent developer-readable Audit Log (`.md` or `.json`) retains the complete structured context and execution details so developers can determine who made the request and what occurred. Runtime Context and Audit Log lifecycles are independent; Audit Log retention duration is intentionally unspecified for Version 2.
- Accessibility standards are out of scope for the current Version 2 implementation; do not reopen them.
- Every successful execution first runs the complete generic Version 1 educational workflow and returns its result as the **Pipeline Outcome**. Version 2 then processes that Pipeline Outcome through the selected Studio path to create the **Studio Outcome**. Both are delivered:
  1. **Pipeline Outcome** — the complete structured educational blueprint produced by the generic CKLIS pipeline.
  2. **Studio Outcome** — a processed Markdown deliverable derived from the Pipeline Outcome through the representation-specific Version 2 path.
- Current Studio formats are only:
  - Comic: Pipeline Outcome → CP1 → CP2 → final Markdown prompt.
  - One-Page Comic: Pipeline Outcome → `1_Page_Comic_Example` → final Markdown prompt.
  - Video: Pipeline Outcome → VP1 → VP2 → final Markdown prompt.
  - Audio/Podcast: Pipeline Outcome → final script → Markdown output.
- Q2 Conditional Approval is internal only and is never delivered. Runtime revises until Quality reaches Q3.
- Improve is automatic and driven by existing Quality findings, preserving learner intent, educational reasoning, and requested outcome. The learner provides no additional instructions.
- Regenerate is removed from Version 2. A fresh generation requires a new request/execution.

Use these decisions with the [CKLIS ambiguity-resolution process](cklis_decision_process.md).
