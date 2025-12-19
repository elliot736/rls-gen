# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the `rls-gen` project.

| ADR | Title | Description |
|-----|-------|-------------|
| [ADR-001](001-yaml-for-tenant-model-configuration.md) | Use YAML for tenant model configuration | Why YAML was chosen over JSON or TOML, and how the config schema and defaults strategy work |
| [ADR-002](002-regex-based-sql-schema-parsing.md) | Regex-based SQL schema parsing in auditor | Why simple regex extraction was chosen over a proper SQL parser for schema analysis |
| [ADR-003](003-spec-driven-development-with-vitest.md) | Spec-driven development with Vitest | Why tests-first development with Vitest, colocated test files, and table-driven test patterns |
