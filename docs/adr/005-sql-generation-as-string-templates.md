# ADR-005: SQL generation as string templates

## Status
Accepted

## Date
2025-12-21

## Context
The core function of `rls-gen` is producing SQL statements that enable and configure Row-Level Security. We needed to decide how to construct these SQL statements: via string interpolation, an AST/builder library, or a templating engine. The output must be deterministic, readable, and safe to pipe directly into `psql` or include in migration files.

## Decision
We generate SQL using TypeScript template literals (string interpolation). The `generate()` function iterates over configured tables and pushes individual SQL statement strings into an array. Each statement is a self-contained string built by interpolating config values (schema name, table name, tenant column, role, type) into fixed SQL patterns.

Statements are ordered per table in a deliberate sequence: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, then `ALTER TABLE ... FORCE ROW LEVEL SECURITY` (if enabled), then `CREATE POLICY`, then `CREATE INDEX` (if enabled). The function returns `string[]` rather than a single concatenated string, giving callers control over formatting (the CLI joins with `\n\n`).

## Consequences
**Positive:** The generation code is 35 lines and immediately readable by anyone who knows SQL. The output is predictable -- what you see in the template is exactly what gets generated. Returning an array of statements makes it easy to test individual statements with `toContain()` and to reorder or filter output in the future. No abstraction layer obscures the SQL being produced.

**Negative:** String interpolation has no built-in protection against SQL injection from config values (e.g., a table name containing a semicolon or single quote). We rely on validation to catch these cases rather than structural guarantees. If we later need conditional clauses, `WITH CHECK` expressions, or multi-dialect support, the template approach will become unwieldy and may need to be replaced with a builder pattern.

## Alternatives Considered
**SQL AST builder (e.g., `squel`, `knex` raw builder):** Provides structural correctness guarantees and handles identifier quoting. However, PostgreSQL RLS statements (`CREATE POLICY ... USING (...)`) are not supported by any mainstream query builder. We would still need raw SQL for the core functionality, making the builder a leaky abstraction.

**Template engine (Handlebars, EJS):** Useful for complex multi-line templates with conditionals and loops. But our templates are simple one-liners -- template syntax would add noise without adding value. Also introduces another dependency.

**SQL file templates with placeholder replacement:** Store `.sql` files with `{{table_name}}` markers. More familiar to DBAs but harder to test, requires file I/O, and makes conditional logic (skip index, skip force) awkward.
