---
name: CKLIS ambiguity-resolution process
description: Apply when reviewing or resolving CKLIS specification questions and Version 2 product decisions.
---

For CKLIS Version 2, eliminate ambiguity without expanding the specification set unnecessarily.

- Prefer interpretations derived from the Constitution, Project Charter, Learning Science, existing Engine Specifications, CKMS, LES, SPRS, `AGENTS.md`, and Sad's explicit decisions.
- Prefer the smallest documentation change: a sentence, definition, cross-reference, paragraph, or table in an existing document.
- Sad is the product authority. Ask him when an unresolved issue is a product choice; once decided, treat it as authoritative for Version 2 and do not keep debating alternatives.
- Keep technical flexibility out of specifications when multiple implementations can satisfy the same observable contract.
- Preserve architectural simplicity; when options are educationally equivalent, prefer the simpler one.

Question triage used during clarification:
- A1: apparent product decision. Before asking Sad, search in this order: Constitution, Project Charter, Learning Science, Engine Specifications, CKMS, LES, Runtime, SPRS, `AGENTS.md`. Mark **A1-Derived** when a high-confidence answer follows; give the answer, sources, reasoning, and smallest wording fix. Use **A1-Owner** only when no consistent answer exists; state the exact decision and consequences of the available product options.
- A2: answerable from existing specifications but needs clearer wording or cross-references.
- A3: genuine gap not answerable from current documents and requiring substantive amendment.
- A4: Runtime implementation decision that should remain unspecified.
