/**
 * INTENTIONAL ARCHITECTURE VIOLATION — probe fixture (NOT compiled, NOT a test).
 *
 * This file simulates a contract-layer source file that illegally imports an
 * OUTER layer (`software/runtime/`). Architecture §10.4 forbids the contracts
 * layer from depending on runtime/engines/production/quality/infrastructure/apps.
 *
 * The dependency-direction checker in `../dependency-direction.test.ts` must
 * DETECT and REJECT this import. It exists solely to prove the checker rejects a
 * known violation (Playbook M01 completion evidence + deployment validation).
 *
 * It is excluded from the TypeScript program and from Vitest's test glob, so the
 * broken import below never actually resolves or runs.
 */

// eslint-disable-next-line
import { InternalExecutionStateSchema } from "../../../runtime/execution/index.js";

export const __probe = InternalExecutionStateSchema;
