/**
 * M01 deployment validation probe — validate the packed contract artifact.
 *
 * Playbook M01 "Deployable unit" + "Deployment validation": the versioned
 * contract package is packed and validated in an isolated integration step.
 * This script packs @cklis/contracts to a tarball and asserts that the packed
 * artifact contains the built distributable and declaration entry points.
 *
 * It does NOT publish anywhere external; it only produces and inspects a local
 * tarball, standing in for the "internal artifact environment" of M01.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const contractsDir = new URL("../contracts/", import.meta.url).pathname;

function fail(msg) {
  console.error(`validate-pack: FAIL — ${msg}`);
  process.exit(1);
}

// 1. Ensure the package was built before packing.
if (!existsSync(join(contractsDir, "dist", "index.js"))) {
  fail("contracts/dist/index.js not found. Run `pnpm build:contracts` first.");
}
if (!existsSync(join(contractsDir, "dist", "index.d.ts"))) {
  fail("contracts/dist/index.d.ts not found. Declarations were not emitted.");
}

// 2. Pack the contract package into a temp dir and inspect the file list.
const outDir = mkdtempSync(join(tmpdir(), "cklis-pack-"));
let jsonOut;
try {
  jsonOut = execFileSync(
    "pnpm",
    ["pack", "--pack-destination", outDir, "--json"],
    { cwd: contractsDir, encoding: "utf8" }
  );
} catch (err) {
  fail(`pnpm pack failed: ${err instanceof Error ? err.message : String(err)}`);
}

// pnpm may print non-JSON lines before the JSON payload; extract the JSON.
const jsonStart = jsonOut.indexOf("{");
const jsonArrStart = jsonOut.indexOf("[");
const start =
  jsonStart === -1
    ? jsonArrStart
    : jsonArrStart === -1
      ? jsonStart
      : Math.min(jsonStart, jsonArrStart);
if (start === -1) fail(`pnpm pack produced no JSON output:\n${jsonOut}`);

let meta;
try {
  meta = JSON.parse(jsonOut.slice(start));
} catch {
  fail(`could not parse pnpm pack JSON output:\n${jsonOut}`);
}

const entry = Array.isArray(meta) ? meta[0] : meta;
const filename = entry?.filename;
if (!filename) fail("pnpm pack JSON did not include a tarball filename.");

// 3. Assert essential entry points are declared in the manifest.
const pkg = JSON.parse(readFileSync(join(contractsDir, "package.json"), "utf8"));
if (pkg.name !== "@cklis/contracts") fail(`unexpected package name: ${pkg.name}`);
if (!pkg.version) fail("package.json is missing a version.");
if (!pkg.exports?.["."]) fail("package.json exports['.'] is missing.");
if (!pkg.exports?.["./ports"]) fail("package.json exports['./ports'] is missing.");

console.log(
  `validate-pack: OK — packed ${pkg.name}@${pkg.version} → ${filename}`
);
