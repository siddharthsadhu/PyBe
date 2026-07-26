/**
 * M01 architecture tests — dependency-direction enforcement (Architecture §10.4).
 *
 * The contracts layer is the innermost layer. It must NEVER import from an outer
 * source layer: runtime/, engines/, production/, quality/, infrastructure/, apps/.
 * (Note: `contracts/src/quality` is the contracts' OWN quality module and is
 * distinct from the outer `software/quality/` layer — the checker resolves paths
 * absolutely to avoid a false positive.)
 *
 * Two assertions (Playbook M01):
 *   1. The real contracts source has ZERO prohibited outward imports.
 *   2. The checker DETECTS a known intentional violation (fixtures/), proving it
 *      actually rejects reverse dependencies.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";

const softwareDir = resolve(__dirname, "..", "..");
const contractsSrcDir = resolve(softwareDir, "contracts", "src");

/** Absolute roots of the OUTER source layers the contracts layer may not import. */
const FORBIDDEN_OUTER_ROOTS = [
  resolve(softwareDir, "runtime"),
  resolve(softwareDir, "engines"),
  resolve(softwareDir, "production"),
  resolve(softwareDir, "quality"),
  resolve(softwareDir, "infrastructure"),
  resolve(softwareDir, "apps"),
];

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...listTsFiles(full));
    else if (entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

const IMPORT_RE =
  /(?:import|export)[\s\S]*?from\s*["']([^"']+)["']|import\s*\(\s*["']([^"']+)["']\s*\)/g;

function relativeImportSpecifiers(fileContent: string): string[] {
  const specs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = IMPORT_RE.exec(fileContent)) !== null) {
    const spec = m[1] ?? m[2];
    if (spec && (spec.startsWith("./") || spec.startsWith("../"))) specs.push(spec);
  }
  return specs;
}

/**
 * Returns violations: relative imports in `file` that resolve into a forbidden
 * outer layer root.
 */
function findOutwardViolations(file: string): Array<{ spec: string; resolved: string }> {
  const content = readFileSync(file, "utf8");
  const violations: Array<{ spec: string; resolved: string }> = [];
  for (const spec of relativeImportSpecifiers(content)) {
    const resolved = resolve(dirname(file), spec);
    if (FORBIDDEN_OUTER_ROOTS.some((root) => resolved === root || resolved.startsWith(root + "/"))) {
      violations.push({ spec, resolved });
    }
  }
  return violations;
}

describe("Contracts layer dependency direction (Architecture §10.4)", () => {
  const contractFiles = listTsFiles(contractsSrcDir);

  it("finds contract source files to analyze", () => {
    expect(contractFiles.length).toBeGreaterThan(5);
  });

  it("has ZERO prohibited outward imports across all contract modules", () => {
    const all = contractFiles.flatMap((f) =>
      findOutwardViolations(f).map((v) => ({ file: f, ...v }))
    );
    expect(all).toEqual([]);
  });

  it("does not confuse contracts/src/quality with the outer software/quality layer", () => {
    // outcomes imports '../quality/index.js' which resolves INSIDE contracts/src.
    const outcomes = resolve(contractsSrcDir, "outcomes", "index.ts");
    expect(findOutwardViolations(outcomes)).toEqual([]);
  });
});

describe("Checker rejects a known intentional violation (probe)", () => {
  const fixture = resolve(__dirname, "fixtures", "illegal-contract-import.ts");

  it("DETECTS the planted outward import into runtime/", () => {
    const violations = findOutwardViolations(fixture);
    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0]!.resolved).toContain("/runtime/");
  });
});

describe("Public contracts must not import internal RuntimeContext", () => {
  const runtimeContextRoot = resolve(contractsSrcDir, "runtime-context");
  const publicModules = ["public-api", "outcomes"].map((m) =>
    resolve(contractsSrcDir, m, "index.ts")
  );

  it("public-api and outcomes never import runtime-context", () => {
    for (const file of publicModules) {
      const content = readFileSync(file, "utf8");
      for (const spec of relativeImportSpecifiers(content)) {
        const resolved = resolve(dirname(file), spec);
        expect(resolved.startsWith(runtimeContextRoot)).toBe(false);
      }
    }
  });
});
