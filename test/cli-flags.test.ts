import { describe, test, expect } from "bun:test";
import { spawnSync } from "child_process";

const CLI = "src/cli.ts";

function run(...args: string[]): { exitCode: number; stdout: string; stderr: string } {
  const result = spawnSync("bun", ["run", CLI, ...args], {
    cwd: process.cwd(),
    encoding: "utf-8",
  });
  return {
    exitCode: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

describe("validate --json", () => {
  test("valid doctrine outputs JSON with valid: true", () => {
    const { exitCode, stdout } = run("validate", "--json", "test/fixtures/valid-doctrine.yaml");
    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.valid).toBe(true);
    expect(data.doctrine).toBe("@test/core");
    expect(data.version).toBe("1.0.0");
    expect(data.values.total).toBe(3);
  });

  test("invalid doctrine outputs JSON with valid: false", () => {
    const { exitCode, stdout } = run("validate", "--json", "test/fixtures/invalid-doctrine.yaml");
    expect(exitCode).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.valid).toBe(false);
    expect(data.errors.length).toBeGreaterThan(0);
  });

  test("missing file outputs JSON with valid: false", () => {
    const { exitCode, stdout } = run("validate", "--json", "nonexistent.yaml");
    expect(exitCode).toBe(1);
    const data = JSON.parse(stdout);
    expect(data.valid).toBe(false);
    expect(data.error).toContain("not found");
  });
});

describe("lint --json", () => {
  test("clean doctrine outputs JSON with valid: true and empty warnings", () => {
    const { exitCode, stdout } = run("lint", "--json", "test/fixtures/valid-doctrine.yaml");
    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.valid).toBe(true);
    expect(data.warnings).toHaveLength(0);
  });

  test("doctrine with warnings outputs JSON with valid: true and warnings array", () => {
    const { exitCode, stdout } = run("lint", "--json", "test/fixtures/lint-warnings.yaml");
    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(data.valid).toBe(true);
    expect(data.warnings.length).toBeGreaterThan(0);
    expect(data.warnings[0]).toHaveProperty("valueId");
    expect(data.warnings[0]).toHaveProperty("rule");
    expect(data.warnings[0]).toHaveProperty("message");
  });

  test("lint --json exits 0 even with warnings", () => {
    const { exitCode } = run("lint", "--json", "test/fixtures/lint-warnings.yaml");
    expect(exitCode).toBe(0);
  });
});

describe("apply --dry-run", () => {
  test("prints generated section without writing", () => {
    const { exitCode, stdout } = run("apply", "--dry-run", "test/fixtures/valid-doctrine.yaml");
    expect(exitCode).toBe(0);
    expect(stdout).toContain("<!-- DOCTRINE:START -->");
    expect(stdout).toContain("<!-- DOCTRINE:END -->");
    expect(stdout).toContain("@test/core v1.0.0");
    expect(stdout).toContain("Structural Rules");
  });

  test("dry-run does not create or modify files", () => {
    const testOutput = "/tmp/dry-run-test-claude.md";
    const { existsSync, unlinkSync } = require("fs");
    if (existsSync(testOutput)) unlinkSync(testOutput);

    run("apply", "--dry-run", "-o", testOutput, "test/fixtures/valid-doctrine.yaml");
    expect(existsSync(testOutput)).toBe(false);
  });
});
