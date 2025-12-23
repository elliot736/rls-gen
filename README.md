# rls-gen

Generate PostgreSQL Row-Level Security policies from a simple config file. Stop relying on `WHERE tenant_id = ?` scattered across your codebase and start enforcing tenant isolation where it actually matters — at the database level.

## The problem

Every multi-tenant app starts the same way: you add `tenant_id` to your tables and make sure every query filters by it. Then someone forgets. Or a new hire writes a reporting query without the filter. Or an ORM-generated join leaks rows. I've seen this happen across teams at different scales — 50 tenants, 5,000 tenants, doesn't matter. The bug is always the same: one tenant sees another tenant's data.

PostgreSQL's Row-Level Security fixes this at the right layer. But setting it up correctly is tedious and error-prone: you need to enable RLS on every table, write policies, remember `FORCE ROW LEVEL SECURITY` so table owners don't bypass it, add indexes so filtered queries don't tank performance, and keep all of this in sync as your schema evolves.

`rls-gen` takes a YAML config describing your tenant model and generates all the SQL you need. It also audits your existing schema to catch tables you forgot to cover.

## Install

```bash
npm install -g rls-gen
```

Or run directly:

```bash
npx rls-gen generate --config rls.yaml
```

## Usage

### 1. Define your tenant model

```yaml
tenant:
  column: tenant_id
  type: uuid

tables:
  - name: users
    schema: public
    enable_rls: true
  - name: orders
    schema: public
    enable_rls: true
  - name: audit_logs
    schema: public
    tenant_column: org_id # some tables use a different column
    enable_rls: true

policies:
  default_role: app_user
  force_rls_on_owner: true # don't let table owners bypass RLS

settings:
  add_indexes: true # generate indexes on tenant columns
  warn_missing_tables: true # flag tables missing from this config
```

### 2. Generate SQL

```bash
rls-gen generate --config rls.yaml
```

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_users ON public.users
  TO app_user
  USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);

-- ... repeated for each table
```

Pipe it into your migration tool, review it, apply it. The output is plain SQL — no lock-in.

### 3. Validate your config

```bash
rls-gen validate --config rls.yaml
```

Catches issues before you generate anything:

- Invalid column types (only `uuid`, `integer`, `bigint`, `text`)
- Duplicate table entries
- Missing required fields
- Tables with RLS disabled (warns you in case it's unintentional)

### 4. Audit your schema

```bash
pg_dump --schema-only mydb > schema.sql
rls-gen audit --config rls.yaml --schema schema.sql
```

```
[WARNING] missing-from-config    Table 'public.sessions' exists in schema but is not in the RLS config
[WARNING] inconsistent-tenant-column  Table 'audit_logs' uses 'org_id' instead of the default 'tenant_id'
[WARNING] missing-index           Table 'public.orders' has no index on tenant column 'tenant_id'
```

This is the command you run in CI after every migration. New table without RLS coverage? You'll know before it hits production.
