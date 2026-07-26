/**
 * M01 contract tests — System Version Registry and semver compatibility.
 * Playbook M01 "Tests and failure cases": version compatibility check rejects
 * incompatible version combinations.
 */
import { describe, it, expect } from "vitest";
import {
  ARCHITECTURE_VERSION,
  CONTRACT_VERSIONS,
  ENGINE_CONTRACT_VERSIONS,
  STUDIO_RESOURCE_VERSIONS,
  SYSTEM_VERSION_REGISTRY,
  parseSemver,
  isVersionCompatible,
  checkVersionCompatibility,
} from "@cklis/contracts/versions";

describe("System Version Registry", () => {
  it("pins the frozen architecture baseline at 2.0.0", () => {
    expect(ARCHITECTURE_VERSION).toBe("2.0.0");
    expect(SYSTEM_VERSION_REGISTRY.architecture).toBe("2.0.0");
  });

  it("includes a ports contract version (ports module exists)", () => {
    expect(CONTRACT_VERSIONS.ports).toBe("1.0.0");
  });

  it("registers all five educational engine contract versions", () => {
    expect(Object.keys(ENGINE_CONTRACT_VERSIONS).sort()).toEqual(
      [
        "episodeGeneration",
        "mentalModel",
        "misconception",
        "patternMapping",
        "scenarioIntelligence",
      ].sort()
    );
  });

  it("registers all six Studio resource versions", () => {
    expect(Object.keys(STUDIO_RESOURCE_VERSIONS).sort()).toEqual(
      ["audioPodcast", "cp1", "cp2", "onePageComic", "vp1", "vp2"].sort()
    );
  });
});

describe("semver utilities", () => {
  it("parses a valid semver", () => {
    expect(parseSemver("2.1.3")).toEqual({ major: 2, minor: 1, patch: 3 });
  });

  it("rejects an invalid semver", () => {
    expect(parseSemver("2.1")).toBeNull();
    expect(parseSemver("v2.1.3")).toBeNull();
    expect(parseSemver("latest")).toBeNull();
  });

  it("accepts a compatible version (same major, >= minor/patch)", () => {
    expect(isVersionCompatible("1.2.0", "1.1.0")).toBe(true);
    expect(isVersionCompatible("1.1.1", "1.1.0")).toBe(true);
    expect(isVersionCompatible("1.1.0", "1.1.0")).toBe(true);
  });

  it("rejects an incompatible major version", () => {
    expect(isVersionCompatible("2.0.0", "1.0.0")).toBe(false);
    expect(isVersionCompatible("1.0.0", "2.0.0")).toBe(false);
  });

  it("rejects a lower minor or patch than required", () => {
    expect(isVersionCompatible("1.0.0", "1.1.0")).toBe(false);
    expect(isVersionCompatible("1.1.0", "1.1.5")).toBe(false);
  });

  it("returns a structured reason on incompatibility", () => {
    const r = checkVersionCompatibility("2.0.0", "1.0.0", "Runtime");
    expect(r.compatible).toBe(false);
    expect(r.reason).toContain("Runtime");
    expect(r.reason).toContain("incompatible");
  });
});
