# rls-gen

Generate PostgreSQL Row-Level Security policies from a simple config file. Stop relying on `WHERE tenant_id = ?` scattered across your codebase and start enforcing tenant isolation where it actually matters — at the database level.

## The problem

Every multi-tenant app starts the same way: you add `tenant_id` to your tables and make sure every query filters by it. Then someone forgets. Or a new hire writes a reporting query without the filter. Or an ORM-generated join leaks rows. I’ve seen this happen across teams at different scales — 50 tenants, 5,000 tenants, doesn’t matter. The bug is always the same: one tenant sees another tenant’s data.

PostgreSQL’s Row-Level Security fixes this at the right layer. But setting it up correctly is tedious and error-prone: you need to enable RLS on every table, write policies, remember `FORCE ROW LEVEL SECURITY` so table owners don’t bypass it, add indexes so filtered queries don’t tank performance, and keep all of this in sync as your schema evolves.

`rls-gen` takes a YAML config describing your tenant model and generates all the SQL you need. It also audits your existing schema to catch tables you forgot to cover.

## Install

```bash
npm install -g rls-gen
```

Or run directly:

```bash
npx rls-gen generate --config rls.yaml
```
