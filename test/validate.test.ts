import { describe, test, expect } from "bun:test";
import { parseDoctrine } from "../src/parser/yaml";
import { validateDoctrine } from "../src/schema/loader";

describe("doctrine validate", () => {
  test("valid doctrine passes validation", () => {
    const parsed = parseDoctrine("test/fixtures/valid-doctrine.yaml");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const result = validateDoctrine(parsed.data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("invalid doctrine fails with errors", () => {
    const parsed = parseDoctrine("test/fixtures/invalid-doctrine.yaml");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const result = validateDoctrine(parsed.data);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test("file not found returns error", () => {
    const parsed = parseDoctrine("nonexistent.yaml");
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toContain("not found");
  });

  test("empty file returns error", () => {
    // Write a temp empty file
    const path = "/tmp/empty-doctrine.yaml";
    require("fs").writeFileSync(path, "");
    const parsed = parseDoctrine(path);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toContain("empty");
  });

  test("invalid YAML returns error with details", () => {
    const path = "/tmp/bad-yaml.yaml";
    require("fs").writeFileSync(path, "doctrine: [\ninvalid yaml{{{");
    const parsed = parseDoctrine(path);
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.error).toContain("Invalid YAML");
  });

  test("structural value requires enforcement", () => {
    const data = {
      doctrine: "@test/core",
      version: "1.0.0",
      extends: null,
      values: [
        {
          id: "test-value",
          type: "structural",
          rule: "This is a structural value without enforcement",
        },
      ],
    };
    const result = validateDoctrine(data);
    expect(result.valid).toBe(false);
  });

  test("judgment value requires example", () => {
    const data = {
      doctrine: "@test/core",
      version: "1.0.0",
      extends: null,
      values: [
        {
          id: "test-value",
          type: "judgment",
          rule: "This is a judgment value without an example",
        },
      ],
    };
    const result = validateDoctrine(data);
    expect(result.valid).toBe(false);
  });

  test("doctrine name must be @org/name format", () => {
    const data = {
      doctrine: "no-at-prefix",
      version: "1.0.0",
      extends: null,
      values: [
        {
          id: "test",
          type: "behavioral",
          rule: "This is a long enough behavioral rule",
        },
      ],
    };
    const result = validateDoctrine(data);
    expect(result.valid).toBe(false);
  });

  test("version must be semver", () => {
    const data = {
      doctrine: "@test/core",
      version: "not-semver",
      extends: null,
      values: [
        {
          id: "test",
          type: "behavioral",
          rule: "This is a long enough behavioral rule",
        },
      ],
    };
    const result = validateDoctrine(data);
    expect(result.valid).toBe(false);
  });

  test("value IDs must be kebab-case", () => {
    const data = {
      doctrine: "@test/core",
      version: "1.0.0",
      extends: null,
      values: [
        {
          id: "UPPER_CASE",
          type: "behavioral",
          rule: "This is a long enough behavioral rule",
        },
      ],
    };
    const result = validateDoctrine(data);
    expect(result.valid).toBe(false);
  });

  test("all three value types validate correctly", () => {
    const data = {
      doctrine: "@test/core",
      version: "1.0.0",
      extends: null,
      values: [
        {
          id: "structural-val",
          type: "structural",
          rule: "Never access unauthorized resources in any context",
          enforcement: "tool-call-audit",
        },
        {
          id: "behavioral-val",
          type: "behavioral",
          rule: "Do not fabricate information or citations ever",
        },
        {
          id: "judgment-val",
          type: "judgment",
          rule: "Prefer privacy over convenience when in tension",
          example: "Choose the local API over the cloud API when PII is involved in the request",
        },
      ],
    };
    const result = validateDoctrine(data);
    expect(result.valid).toBe(true);
  });
});
