/**
 * CKLIS Version 2 — Contracts Package Barrel
 *
 * Single published entry point for the @cklis/contracts package.
 *
 * Architecture reference: Software Architecture.md §2 (contracts layer),
 * Playbook §8 (contract-first development). Every later milestone consumes
 * these contracts through this barrel or the per-module subpath exports; no
 * milestone modifies a published interface without a version bump.
 *
 * Several modules intentionally re-export shared symbols (e.g. StudioFormat is
 * defined in public-api and re-exported by les; Q3ApprovalSummary appears in
 * both public-api and quality). To avoid ambiguous star-export collisions, the
 * modules that re-export shared symbols are exposed under a namespace, while
 * the canonical definitions are surfaced flat from their owning module.
 */

// Canonical flat exports (owning modules) --------------------------------
export * from "./versions/index.js";
export * from "./public-api/index.js";
export * from "./artifacts/index.js";
export * from "./ports/index.js";

// Modules that re-export shared symbols are namespaced to avoid collisions
export * as les from "./les/index.js";
export * as execution from "./execution/index.js";
export * as engines from "./engines/index.js";
export * as outcomes from "./outcomes/index.js";
export * as quality from "./quality/index.js";
export * as runtimeContext from "./runtime-context/index.js";
