import { describe, test, expect } from "bun:test";
import { lint } from "../src/commands/lint";

// Capture console output for assertions
function captureOutput(fn: () => number): { exitCode: number; output: string } {
  const logs: string[] = [];
  const origLog = console.log;
  const origErr = console.error;
  console.log = (...args: unknown[]) => logs.push(args.join(" "));
  console.error = (...args: unknown[]) => logs.push(args.join(" "));
  const exitCode = fn();
  console.log = origLog;
  console.error = origErr;
  return { exitCode, output: logs.join("\n") };
}

describe("doctrine lint", () => {
  test("clean doctrine produces no warnings", () => {
    const { exitCode, output } = captureOutput(() =>
      lint("test/fixtures/valid-doctrine.yaml"),
    );
    expect(exitCode).toBe(0);
    expect(output).toContain("no lint warnings");
  });

  test("detects duplicate value IDs", () => {
    const { output } = captureOutput(() =>
      lint("test/fixtures/lint-warnings.yaml"),
    );
    expect(output).toContain("no-duplicate-ids");
    expect(output).toContain("Duplicate value ID");
  });

  test("detects behavioral values that should be structural", () => {
    const { output } = captureOutput(() =>
      lint("test/fixtures/lint-warnings.yaml"),
    );
    expect(output).toContain("prefer-structural");
  });

  test("detects secrets in rule text", () => {
    const { output } = captureOutput(() =>
      lint("test/fixtures/lint-warnings.yaml"),
    );
    expect(output).toContain("no-secrets-in-rules");
  });

  test("lint warnings return exit code 0 (advisory)", () => {
    const { exitCode } = captureOutput(() =>
      lint("test/fixtures/lint-warnings.yaml"),
    );
    expect(exitCode).toBe(0);
  });

  test("file not found returns exit code 1", () => {
    const { exitCode } = captureOutput(() => lint("nonexistent.yaml"));
    expect(exitCode).toBe(1);
  });
});
