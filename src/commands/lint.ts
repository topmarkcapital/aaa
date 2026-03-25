import { parseDoctrine } from "../parser/yaml";
import { validateDoctrine } from "../schema/loader";

interface LintWarning {
  valueId: string;
  rule: string;
  message: string;
  suggestion?: string;
}

const VAGUE_PATTERNS = [
  /^be (good|nice|helpful|ethical|responsible|safe)$/i,
  /^do the right thing$/i,
  /^follow best practices$/i,
  /^act appropriately$/i,
];

const SECRET_PATTERNS = [
  /\b(?:api[_-]?key|secret[_-]?key|access[_-]?token|password|credential)\b/i,
  /(?:sk-|pk_|ghp_|gho_|AKIA|AIza)[A-Za-z0-9]{10,}/,
  /(?:Bearer |Basic )[A-Za-z0-9+/=]{20,}/,
];

interface LintOptions {
  json?: boolean;
}

export function lint(filePath: string, opts: LintOptions = {}): number {
  const parsed = parseDoctrine(filePath);

  if (!parsed.ok) {
    console.error(parsed.error);
    return 1;
  }

  // Schema validation first — lint requires valid doctrine
  const schemaResult = validateDoctrine(parsed.data);
  if (!schemaResult.valid) {
    if (opts.json) {
      console.log(JSON.stringify({ file: filePath, error: "Schema validation failed. Run 'doctrine validate' first.", warnings: [] }));
    } else {
      console.error(
        `✗ ${filePath} has schema errors. Run 'doctrine validate' first.`,
      );
    }
    return 1;
  }

  const warnings: LintWarning[] = [];
  const seenIds = new Set<string>();

  for (const value of parsed.data.values) {
    // Duplicate ID check
    if (seenIds.has(value.id)) {
      warnings.push({
        valueId: value.id,
        rule: "no-duplicate-ids",
        message: `Duplicate value ID: "${value.id}"`,
      });
    }
    seenIds.add(value.id);

    // Kebab-case check
    if (value.id !== value.id.toLowerCase().replace(/[^a-z0-9-]/g, "")) {
      warnings.push({
        valueId: value.id,
        rule: "kebab-case-ids",
        message: `Value ID should be kebab-case: "${value.id}"`,
        suggestion: value.id.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      });
    }

    // Vague rule detection
    for (const pattern of VAGUE_PATTERNS) {
      if (pattern.test(value.rule.trim())) {
        warnings.push({
          valueId: value.id,
          rule: "no-vague-rules",
          message: `Rule is too vague: "${value.rule}"`,
          suggestion:
            "Specify what the agent should concretely do or avoid",
        });
        break;
      }
    }

    // Secret detection in rule text
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.test(value.rule)) {
        warnings.push({
          valueId: value.id,
          rule: "no-secrets-in-rules",
          message: `Possible secret or credential in rule text`,
          suggestion: "Move secrets to environment variables",
        });
        break;
      }
    }

    // Behavioral value that could be structural
    if (value.type === "behavioral") {
      const structuralKeywords = [
        "never access",
        "must not call",
        "block",
        "deny",
        "restrict",
        "prohibit",
        "forbidden",
      ];
      for (const kw of structuralKeywords) {
        if (value.rule.toLowerCase().includes(kw)) {
          warnings.push({
            valueId: value.id,
            rule: "prefer-structural",
            message: `Behavioral value uses enforceable language ("${kw}")`,
            suggestion: `Consider changing type to "structural" with an enforcement method`,
          });
          break;
        }
      }
    }

    // Missing enforcement on behavioral values
    if (value.type === "behavioral" && !("enforcement" in value)) {
      warnings.push({
        valueId: value.id,
        rule: "explicit-enforcement",
        message: `Behavioral value has no enforcement method (defaults to "attestation")`,
        suggestion: `Add 'enforcement: attestation' explicitly`,
      });
    }
  }

  // Output
  if (opts.json) {
    console.log(JSON.stringify({ file: filePath, warnings }));
    return 0;
  }

  if (warnings.length === 0) {
    console.log(`✓ ${filePath} — no lint warnings`);
    return 0;
  }

  console.log(`⚠ ${filePath} — ${warnings.length} warning(s):\n`);
  for (const w of warnings) {
    console.log(`  [${w.rule}] ${w.valueId}: ${w.message}`);
    if (w.suggestion) {
      console.log(`    → ${w.suggestion}`);
    }
  }
  return 0; // Lint warnings don't fail (exit 0)
}
