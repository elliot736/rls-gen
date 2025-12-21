# ADR-006: Separation of validate vs audit concerns

## Status
Accepted

## Date
2025-12-21

## Context
`rls-gen` needs to catch two fundamentally different categories of problems: issues with the configuration file itself (malformed input), and gaps between the configuration and the actual database schema (deployment drift). Early in development, these could have been combined into a single "check" command. We needed to decide whether to keep them separate.

## Decision
We implement two distinct modules with separate commands, data models, and responsibilities:

**Validator** (`validate` command, `validator.ts`): Operates on the `TenantConfig` alone with no external input. Checks for structural correctness -- invalid tenant column types, empty role names, duplicate table entries, and tables with RLS disabled. Returns `ValidationError` objects with `severity` ("error" or "warning") and `message`. This runs without database access.

**Auditor** (`audit` command, `auditor.ts`): Operates on the `TenantConfig` plus a SQL schema dump. Detects security gaps between what is configured and what exists in the database -- uncovered tables, missing indexes on tenant columns, inconsistent tenant column names, and superuser bypass risks. Returns `AuditFinding` objects with `severity` ("error", "warning", or "info"), `rule` (a machine-readable identifier), `message`, and `table`.

The auditor has a richer severity model (three levels vs two) and includes a `rule` field for filtering and suppression. The validator is intentionally simpler because config errors are always actionable.

## Consequences
**Positive:** Users can run `validate` in CI on every config change without needing a database dump. The `audit` command is reserved for deeper analysis during security reviews or deployment pipelines. Each module has a focused test suite. The different return types (`ValidationError` vs `AuditFinding`) make the distinct purposes explicit in the type system. New validation rules and new audit rules can be added independently without cross-contamination.

**Negative:** Users must learn two commands instead of one. Some checks straddle the boundary (e.g., "is this table name valid?" is validation, but "does this table exist?" is auditing). There is minor code duplication in the severity/message pattern between the two modules.

## Alternatives Considered
**Single "check" command with modes:** A unified command with `--config-only` and `--full` flags. Simpler surface area, but conflates two different workflows (quick lint vs deep audit) and makes the output format inconsistent depending on the mode.

**Validator as a prerequisite for auditor:** Having the auditor automatically validate first. This couples the modules and makes it impossible to audit a config that has warnings (which may be intentional, like a table with RLS disabled).
