import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { apply } from "../src/commands/apply";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "fs";

const TEST_CLAUDE_MD = "/tmp/test-claude.md";
const FIXTURE = "test/fixtures/valid-doctrine.yaml";

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

beforeEach(() => {
  if (existsSync(TEST_CLAUDE_MD)) unlinkSync(TEST_CLAUDE_MD);
});

afterEach(() => {
  if (existsSync(TEST_CLAUDE_MD)) unlinkSync(TEST_CLAUDE_MD);
});

describe("doctrine apply", () => {
  test("creates new CLAUDE.md with doctrine section", () => {
    const { exitCode } = captureOutput(() =>
      apply(FIXTURE, TEST_CLAUDE_MD),
    );
    expect(exitCode).toBe(0);
    const content = readFileSync(TEST_CLAUDE_MD, "utf-8");
    expect(content).toContain("<!-- DOCTRINE:START -->");
    expect(content).toContain("<!-- DOCTRINE:END -->");
    expect(content).toContain("@test/core v1.0.0");
    expect(content).toContain("Structural Rules");
    expect(content).toContain("Behavioral Commitments");
    expect(content).toContain("Judgment Principles");
  });

  test("replaces existing doctrine section", () => {
    writeFileSync(
      TEST_CLAUDE_MD,
      `# Project\n\nSome content\n\n<!-- DOCTRINE:START -->\nOLD CONTENT\n<!-- DOCTRINE:END -->\n\nMore content`,
    );
    const { exitCode } = captureOutput(() =>
      apply(FIXTURE, TEST_CLAUDE_MD),
    );
    expect(exitCode).toBe(0);
    const content = readFileSync(TEST_CLAUDE_MD, "utf-8");
    expect(content).not.toContain("OLD CONTENT");
    expect(content).toContain("@test/core v1.0.0");
    expect(content).toContain("Some content");
    expect(content).toContain("More content");
  });

  test("appends to existing CLAUDE.md without doctrine section", () => {
    writeFileSync(TEST_CLAUDE_MD, "# Existing Project\n\nSome rules here.\n");
    const { exitCode } = captureOutput(() =>
      apply(FIXTURE, TEST_CLAUDE_MD),
    );
    expect(exitCode).toBe(0);
    const content = readFileSync(TEST_CLAUDE_MD, "utf-8");
    expect(content).toContain("Existing Project");
    expect(content).toContain("Some rules here");
    expect(content).toContain("<!-- DOCTRINE:START -->");
  });

  test("includes doctrine hash", () => {
    const { exitCode } = captureOutput(() =>
      apply(FIXTURE, TEST_CLAUDE_MD),
    );
    expect(exitCode).toBe(0);
    const content = readFileSync(TEST_CLAUDE_MD, "utf-8");
    expect(content).toMatch(/Doctrine hash: [a-f0-9]{12}/);
  });

  test("fails on invalid doctrine file", () => {
    const { exitCode, output } = captureOutput(() =>
      apply("test/fixtures/invalid-doctrine.yaml", TEST_CLAUDE_MD),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("schema errors");
  });

  test("fails on missing doctrine file", () => {
    const { exitCode, output } = captureOutput(() =>
      apply("nonexistent.yaml", TEST_CLAUDE_MD),
    );
    expect(exitCode).toBe(1);
    expect(output).toContain("not found");
  });
});
