# ADR-002: Regex-based SQL schema parsing in auditor

## Status
Accepted

## Date
2025-12-19

## Context
The `audit` command compares a user's actual database schema (provided as a `pg_dump --schema-only` SQL file) against their RLS config to find security gaps. This requires extracting table names, column names, and index definitions from raw SQL. We needed to decide how to parse this SQL: use a proper SQL parser or use regex-based extraction.

## Decision
We use regex-based parsing in the auditor module. Two functions, `parseTables()` and `parseIndexes()`, use targeted regular expressions to extract `CREATE TABLE` and `CREATE INDEX` statements from pg_dump output. The table parser extracts schema-qualified names and column names (skipping constraint lines like `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `CHECK`, and `CONSTRAINT`). The index parser extracts the schema, table, and leading column from index definitions.

The regexes are designed to handle common pg_dump output patterns including `IF NOT EXISTS` clauses, optional schema qualification (defaulting to `public`), and `UNIQUE` indexes.

## Consequences
**Positive:** Zero additional dependencies. The parsing code is under 50 lines, easy to read, and easy to test. It handles the specific subset of SQL that pg_dump produces, which is highly regular and predictable. The auditor runs instantly even on large schema files since regex matching is fast.

**Negative:** The regexes will not handle every valid SQL syntax -- nested parentheses in column defaults, dollar-quoted strings in CHECK constraints, or unconventional formatting could cause mis-parses. The approach is brittle if users provide hand-written SQL rather than pg_dump output. Edge cases (e.g., column names that are SQL keywords, quoted identifiers) are not handled.

## Alternatives Considered
**`pg-query-parser` / `libpg_query` bindings:** These use PostgreSQL's actual parser and would handle all valid SQL correctly. However, they add a native dependency (C library binding), complicating installation on different platforms. This is heavy for a tool that only needs table and column names from pg_dump output.

**`node-sql-parser`:** A pure-JS SQL parser that supports PostgreSQL dialect. Lighter than native bindings but still a significant dependency (~2MB). It would provide a full AST, which is far more than we need. Overkill for extracting table names and column lists.

**Asking users to provide metadata instead of SQL:** We could require users to list their actual tables in a separate file. This shifts the burden to the user and defeats the purpose of automated gap detection.
