# @cklis/contracts

CKLIS Version 2 domain contracts — framework-neutral, provider-neutral type
definitions, Zod schemas, and infrastructure port interfaces.

**Architecture baseline:** Software Architecture Version 2.0.0 (frozen 2026-07-26).
This package is produced by **Milestone M01 — Contract and Repository Foundation**
and is consumed unchanged by every later milestone (additions require a version
bump per Playbook §8.2).

## Modules

| Subpath | Purpose | Architecture ref |
|---|---|---|
| `./versions` | System version registry + semver compatibility utilities | §7.3, Playbook §8.2 |
| `./public-api` | Stable learner-facing execution envelopes (6 operations) | §7 |
| `./les` | Learning Experience Specification request + normalization | §3.3, doc 13 |
| `./execution` | Internal execution state machine + progress/error contracts | §3.2, §7.1 |
| `./runtime-context` | RuntimeContext section definitions + lifecycle (internal) | §4 |
| `./engines` | Common engine envelopes + 5 bounded-context views/artifacts | §6.1–6.2 |
| `./artifacts` | Artifact identity, revision, status, Q-level, traceability | §9.1–9.5 |
| `./outcomes` | Pipeline Outcome, Studio Outcome, finalized dual envelope | §3.6–3.8 |
| `./quality` | Quality Report, Q-levels, evidence, feedback (internal) | §3.5, §5.7 |
| `./ports` | 10 infrastructure port interfaces (AI, knowledge, prompt, …) | §6.6 |

## Prohibited contents (Playbook §8.4)

Public contracts (`public-api`, `outcomes`) must never contain RuntimeContext
fields, internal engine names, Q0/Q1/Q2 levels, prompt text, provider details,
private Quality reports, or Audit Log contents. This is enforced by the contract
tests under `../tests/contracts/`.

## Scripts

- `pnpm build` — emit `dist/` (JS + `.d.ts`) via `tsconfig.build.json`.
- `pnpm typecheck` — strict type check with no emit.

Traceability from each contract to its frozen-architecture section and
specification lives in [`TRACEABILITY.md`](./TRACEABILITY.md).
