---
name: CKLIS Version 2 implementation handoff
description: Use when starting, resuming, transferring, or reporting implementation work for the frozen PyBe/CKLIS Version 2 architecture.
---

PyBe/CKLIS Architecture Version 2.0.0 was approved and frozen by the product owner on 2026-07-26. Do not change its module boundaries, contracts, lifecycle, dual-outcome model, Quality gates, or dependency rules without the Evolution Engine and a new architecture version.

Canonical implementation control documents in `personal/PyBe/`:

- `Software Architecture.md` — frozen Architecture 2.0.0.
- `Implementation Milestones.md` — ordered M01–M21 milestone plan, Version 1.0.0.
- `Technical Implementation Playbook.md` — detailed execution procedure for a fresh AI agent, Version 1.0.0.
- `Implementation Handoff Ledger.md` — mutable, transferable resume state; verify it against repository files and tests before continuing.
- `AI Continuation Protocol.md` — standing instructions, limit-recovery procedure, and paste-ready bootstrap prompt for another AI.

Current baseline as of 2026-07-27: M01 — Contract and Repository Foundation is Complete — Verified (`@cklis/contracts@1.0.0` built and pack-validated; 84/84 Vitest tests passing; typecheck clean); M02–M21 have not started. Implementation toolchain decision D-001 selects a TypeScript/Node.js pnpm monorepo, runtime schemas, Vitest, and automated boundary checks. The Ledger is authoritative for newer status.

For every future session: read the Continuation Protocol, frozen architecture, playbook, and Ledger; verify claimed completed work from repository files and current tests; work only on the first milestone not `Complete — Verified`; and update the Ledger before ending. Never put secrets in the Ledger or memory.

The durable Version 2 product decisions remain in [CKLIS Version 2 product decisions](cklis_v2_product_decisions.md), and ambiguity handling remains in [CKLIS ambiguity-resolution process](cklis_decision_process.md).
