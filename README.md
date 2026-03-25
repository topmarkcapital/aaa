# AAA — Axiom Alignment Authority

Portable values for AI agents. Define your agent's values once in `doctrine.yaml`, validate them, and inject them into any AI coding tool that reads `CLAUDE.md`.

## Install

Requires [Bun](https://bun.sh).

```bash
git clone https://github.com/topmarkcapital/aaa.git
cd aaa
bun install
```

All commands below use `bun run src/cli.ts` as the entrypoint. If you prefer a shorter alias, run `bun link` to make `doctrine` available globally.

## Quick Start

```bash
# 1. Copy doctrine.yaml into your project
cp doctrine.yaml ~/your-project/
cd ~/your-project/

# 2. Edit the values to fit your project's needs

# 3. Validate it
bun run ~/aaa/src/cli.ts validate doctrine.yaml

# 4. Inject into CLAUDE.md
bun run ~/aaa/src/cli.ts apply doctrine.yaml
```

Your agent now has structured values in its context — structural rules it must follow, behavioral commitments it aspires to, and judgment principles for when things are ambiguous.

## Commands

### `validate [file]`

Validates `doctrine.yaml` against the schema. Checks required fields, value types, naming conventions, and enforcement methods.

```bash
$ bun run src/cli.ts validate
✓ doctrine.yaml is valid (@aaa/core v0.1.0)
  10 values: 3 structural, 2 behavioral, 5 judgment

$ bun run src/cli.ts validate --json
{"valid":true,"file":"doctrine.yaml","doctrine":"@aaa/core","version":"0.1.0","values":{"total":10,"structural":3,"behavioral":2,"judgment":5}}
```

### `lint [file]`

Checks for style and best-practice issues beyond schema validity. Advisory — warnings don't fail the command.

```bash
$ bun run src/cli.ts lint
✓ doctrine.yaml — no lint warnings

$ bun run src/cli.ts lint --json
{"valid":true,"file":"doctrine.yaml","warnings":[]}
```

What it catches:
- Duplicate value IDs
- Vague rules ("be good", "act appropriately")
- Secrets or credentials in rule text
- Behavioral values that should be structural (uses enforceable language like "never", "block", "deny")
- Missing explicit enforcement methods

### `apply [file]`

Generates a managed section in `CLAUDE.md` from `doctrine.yaml`. Safe to re-run — replaces the section between `<!-- DOCTRINE:START -->` and `<!-- DOCTRINE:END -->` markers without touching surrounding content.

```bash
$ bun run src/cli.ts apply
✓ Applied @aaa/core v0.1.0 to CLAUDE.md
  Hash: a0582aa55966

# Preview without writing
$ bun run src/cli.ts apply --dry-run

# Write to a different file
$ bun run src/cli.ts apply -o agents.md
```

### Exit Codes

| Command | 0 | 1 | 2 |
|---------|---|---|---|
| validate | Valid | Schema errors | — |
| lint | Always (warnings are advisory) | File error or schema invalid | — |
| apply | Applied | Error (missing file, bad schema, broken markers) | — |

## The Doctrine Format

`doctrine.yaml` defines three types of values:

**Structural** — mechanically verifiable rules with an enforcement method.
```yaml
- id: "boundaries"
  type: structural
  rule: "Never access resources outside explicitly granted permissions"
  enforcement: tool-call-audit
```

**Behavioral** — aspirational commitments verified through reputation over time.
```yaml
- id: "honesty"
  type: behavioral
  rule: "Do not fabricate information, citations, or data"
  enforcement: attestation
```

**Judgment** — discretionary tradeoffs that require context. Must include a concrete example.
```yaml
- id: "privacy-over-convenience"
  type: judgment
  rule: "When user privacy and convenience are in tension, prioritize privacy"
  example: "If a faster API call requires sending PII to a third party but a slower local alternative exists, choose the local alternative"
```

The spec also includes:
- **Identity** — what kind of agent the doctrine shapes (craftsmanship, trust-as-capability)
- **Erosion** — natural consequences of inconsistency (not punishment, cause and effect)
- **Disclosure** — self-reporting mechanism for violations (builds trust, not erodes it)

### Naming

- Doctrine names use `@org/name` format: `@aaa/core`, `@yourco/backend`
- Versions are semver: `1.0.0`
- Value IDs are kebab-case: `privacy-over-convenience`

## Compatibility

AAA is built for **Bun** and tested exclusively on Bun. Node.js may work for running the CLI but is not officially supported. The compiled binary (`bun build --compile`) runs anywhere without a runtime.

## CI Integration

```yaml
# .github/workflows/doctrine.yml
name: Doctrine Check
on: [push, pull_request]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --cwd path/to/aaa  # will simplify once published to npm
      - run: bun run path/to/aaa/src/cli.ts validate --json doctrine.yaml
      - run: bun run path/to/aaa/src/cli.ts lint --json doctrine.yaml
```

## Roadmap

- **Doctrine composition** (`extends`) — subdoctrines that inherit from and extend a parent doctrine
- **Citizenship registry** — a trust network where agents earn reputation through verified adherence
- **`doctrine init`** — LLM-powered conversion from existing CLAUDE.md to doctrine.yaml

## Development

```bash
bun install    # install deps
bun test       # run tests (31 tests across 4 files)
```

## What This Is

AAA is a values protocol for AI agents. The doctrine spec defines what an agent believes — not just what it's allowed to do (policies), but how it should exercise judgment when rules conflict (values). The CLI validates and distributes those values to any AI tool that reads project config files.

The long-term vision: a trust network where agents that follow the doctrine earn reputation, and other agents can query whether an interaction partner shares their values. The CLI and spec are Layer 1 — the foundation everything else builds on.

## License

Apache 2.0 — see [LICENSE](LICENSE).
