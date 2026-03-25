#!/usr/bin/env bun
import { program } from "commander";
import { validate } from "./commands/validate";
import { lint } from "./commands/lint";
import { apply } from "./commands/apply";

const VERSION = "0.1.0";

program
  .name("doctrine")
  .description("Axiom Alignment Authority — portable values for AI agents")
  .version(VERSION);

program
  .command("validate")
  .description("Validate doctrine.yaml against the schema")
  .argument("[file]", "Path to doctrine.yaml", "doctrine.yaml")
  .action((file: string) => {
    process.exit(validate(file));
  });

program
  .command("lint")
  .description("Check doctrine.yaml for style and best-practice issues")
  .argument("[file]", "Path to doctrine.yaml", "doctrine.yaml")
  .action((file: string) => {
    process.exit(lint(file));
  });

program
  .command("apply")
  .description("Generate CLAUDE.md section from doctrine.yaml")
  .argument("[doctrine]", "Path to doctrine.yaml", "doctrine.yaml")
  .option("-o, --output <file>", "Path to CLAUDE.md", "CLAUDE.md")
  .action((doctrine: string, opts: { output: string }) => {
    process.exit(apply(doctrine, opts.output));
  });

program.parse();
