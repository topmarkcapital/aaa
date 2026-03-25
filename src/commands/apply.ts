import { readFileSync, writeFileSync, existsSync } from "fs";
import { createHash } from "crypto";
import { parseDoctrine } from "../parser/yaml";
import { validateDoctrine } from "../schema/loader";
import type { Doctrine, DoctrineValue } from "../types/doctrine";

const MARKER_START = "<!-- DOCTRINE:START -->";
const MARKER_END = "<!-- DOCTRINE:END -->";

function formatValues(values: DoctrineValue[], type: string): string[] {
  return values
    .filter((v) => v.type === type)
    .map((v) => {
      if (v.type === "judgment") {
        return `- **${v.rule}** — e.g., ${v.example}`;
      }
      return `- ${v.rule}`;
    });
}

function generateSection(doctrine: Doctrine, hash: string): string {
  const structural = formatValues(doctrine.values, "structural");
  const behavioral = formatValues(doctrine.values, "behavioral");
  const judgment = formatValues(doctrine.values, "judgment");

  let section = `${MARKER_START}
## Agent Values — ${doctrine.doctrine} v${doctrine.version}

This section is auto-generated from \`doctrine.yaml\`. Do not edit manually.
Run \`doctrine apply\` to regenerate from the source spec.
`;

  if (structural.length > 0) {
    section += `
### Structural Rules (must follow)
${structural.join("\n")}
`;
  }

  if (behavioral.length > 0) {
    section += `
### Behavioral Commitments (aspire to)
${behavioral.join("\n")}
`;
  }

  if (judgment.length > 0) {
    section += `
### Judgment Principles (apply discretion)
${judgment.join("\n")}
`;
  }

  if (doctrine.identity && doctrine.identity.length > 0) {
    section += `
### Identity — What Excellent Agents Do
${doctrine.identity.map((i) => `- **${i.id}:** ${i.description}`).join("\n")}
`;
  }

  if (doctrine.erosion && doctrine.erosion.length > 0) {
    section += `
### Erosion — Natural Consequences of Inconsistency
${doctrine.erosion.map((e) => `- **${e.id}** (${e.severity}): ${e.description}`).join("\n")}
`;
  }

  if (doctrine.disclosure?.enabled) {
    section += `
### Disclosure — Self-Reporting Violations
When you recognize you have violated or nearly violated the doctrine, disclose proactively. Record: which value was violated, what happened, why, your self-assessed severity (minor/moderate/severe), and what corrective action you took or recommend.

${(doctrine.disclosure.principles ?? []).map((p: string) => `- ${p}`).join("\n")}
`;
  }

  section += `
---
*Doctrine hash: ${hash}*
${MARKER_END}`;

  return section;
}

interface ApplyOptions {
  dryRun?: boolean;
}

export function apply(
  doctrinePath: string,
  claudeMdPath: string,
  opts: ApplyOptions = {},
): number {
  const parsed = parseDoctrine(doctrinePath);

  if (!parsed.ok) {
    console.error(parsed.error);
    return 1;
  }

  const result = validateDoctrine(parsed.data);
  if (!result.valid) {
    console.error(
      `✗ ${doctrinePath} has schema errors. Run 'doctrine validate' first.`,
    );
    for (const err of result.errors) {
      console.error(`  ${err.path}: ${err.message}`);
    }
    return 1;
  }

  // Compute hash
  const content = readFileSync(doctrinePath, "utf-8");
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 12);

  const section = generateSection(parsed.data, hash);

  if (opts.dryRun) {
    console.log(section);
    return 0;
  }

  if (existsSync(claudeMdPath)) {
    let existing = readFileSync(claudeMdPath, "utf-8");

    if (existing.includes(MARKER_START)) {
      // Replace existing section
      const startIdx = existing.indexOf(MARKER_START);
      const endIdx = existing.indexOf(MARKER_END);
      if (endIdx === -1) {
        console.error(
          `✗ Found ${MARKER_START} but no ${MARKER_END} in ${claudeMdPath}`,
        );
        return 1;
      }
      existing =
        existing.slice(0, startIdx) +
        section +
        existing.slice(endIdx + MARKER_END.length);
    } else {
      // Append
      existing = existing.trimEnd() + "\n\n" + section + "\n";
    }

    writeFileSync(claudeMdPath, existing);
  } else {
    // Create new
    const projectName = process.cwd().split("/").pop() ?? "project";
    writeFileSync(claudeMdPath, `# ${projectName}\n\n${section}\n`);
  }

  console.log(
    `✓ Applied ${parsed.data.doctrine} v${parsed.data.version} to ${claudeMdPath}`,
  );
  console.log(`  Hash: ${hash}`);
  return 0;
}
