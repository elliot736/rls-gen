# ADR-004: Minimal dependency approach

## Status
Accepted

## Date
2025-12-19

## Context
`rls-gen` is a security-sensitive tool that generates SQL controlling data access boundaries. Every dependency is a potential supply chain risk and a maintenance burden. We needed to decide what to build ourselves versus what to pull from npm, balancing development speed against long-term maintainability and security posture.

## Decision
We limit runtime dependencies to a single package: `yaml` (for YAML parsing). The CLI argument parser, help text formatter, and all business logic are implemented from scratch using only Node.js built-in modules (`node:fs`, `process`).

The CLI is built with a simple `switch` statement over the command name (`generate`, `validate`, `audit`) and a hand-rolled `getFlag()` function that extracts `--flag value` pairs from `argv`. Help text is a plain template string in `printUsage()`.

Dev dependencies are limited to `typescript`, `vitest`, and `@types/node` -- the minimum needed for type-checked development and testing.

## Consequences
**Positive:** The install footprint is tiny. Supply chain attack surface is minimal -- `yaml` is a well-audited, widely-used package with no transitive dependencies. The tool installs in seconds. There are no version conflicts or peer dependency issues. Users can audit the entire dependency tree in minutes. The CLI code is ~120 lines and fully understandable without framework knowledge.

**Negative:** The CLI lacks features that frameworks provide for free: subcommand help (`rls-gen generate --help`), tab completion, colored output, automatic error formatting, and flag validation. The `getFlag()` function does not handle edge cases like `--config=value` (equals syntax) or boolean flags. Adding new commands requires manual wiring in the `switch` statement. As the tool grows, the argument parsing code may become harder to maintain.

## Alternatives Considered
**Commander.js:** The most popular CLI framework. Provides subcommands, auto-generated help, option parsing, and validation. However, it adds ~50KB and brings its own patterns. For a tool with exactly three commands and two flags, the abstraction does not pay for itself yet.

**Yargs:** More feature-rich than Commander (middleware, completion scripts, strict mode). But heavier (~200KB installed) and brings a complex API surface. Overkill for this use case.

**`citty` / `cleye`:** Lightweight modern alternatives, but less battle-tested and would still add dependencies for functionality we can cover in a few dozen lines.
