# ADR-001: Use YAML for tenant model configuration

## Status
Accepted

## Date
2025-12-19

## Context
`rls-gen` needs a configuration format for users to declare their tenant isolation model: which tables to protect, what tenant column to use, and what policy settings to apply. The format must be easy for platform engineers to read, write, and review in pull requests. It also needs to support comments so teams can document why certain tables are excluded or why a non-default tenant column is used.

## Decision
We use YAML as the sole configuration format, parsed via the `yaml` npm package. The config schema is structured into four top-level sections (`tenant`, `tables`, `policies`, `settings`), each with sensible defaults applied at parse time. Only `tenant.column`, `tenant.type`, and at least one table entry with a `name` are required. Optional fields like `schema` default to `"public"`, `enable_rls` defaults to `true`, `force_rls_on_owner` defaults to `false`, and `add_indexes` defaults to `false`. Defaults are applied in `parseConfig()` during parsing rather than at generation time, ensuring every downstream consumer sees a fully-resolved config object.

## Consequences
**Positive:** YAML's support for comments makes configs self-documenting and review-friendly. The hierarchical structure maps naturally to the domain model. Sensible defaults keep simple configs short -- a basic two-table setup is under 10 lines. The `yaml` library is well-maintained and handles edge cases (anchors, multiline strings) that a hand-rolled parser would miss.

**Negative:** YAML's whitespace sensitivity can cause subtle parse errors. Users unfamiliar with YAML may be tripped up by indentation rules. We cannot trivially support JSON configs without adding a detection layer (though `parseConfig()` already accepts raw objects, making this possible later).

## Alternatives Considered
**JSON:** No comments, verbose syntax with required quoting. Poor ergonomics for a config file that humans edit frequently.

**TOML:** Better than JSON for human editing, but less common in the Node.js ecosystem. The `tables` array-of-objects pattern is awkward in TOML's `[[tables]]` syntax. Fewer npm libraries available.

**TypeScript config (a la `vite.config.ts`):** Offers type safety and autocompletion, but requires a build step or dynamic import, adds complexity, and makes the config harder to validate statically.
