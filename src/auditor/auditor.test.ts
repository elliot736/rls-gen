import { describe, it, expect } from "vitest";
import { audit, AuditFinding } from "./auditor.js";
import type { TenantConfig } from "../config/config.js";

const basicSchema = `
CREATE TABLE public.orders (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  amount numeric(10,2)
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  name text
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY,
  org_id uuid NOT NULL,
  action text
);

CREATE TABLE public.migrations (
  id serial PRIMARY KEY,
  name text,
  applied_at timestamp
);
`;

function makeConfig(overrides: Partial<TenantConfig> = {}): TenantConfig {
  return {
    tenant: { column: "tenant_id", type: "uuid" },
    tables: [
      { name: "orders", schema: "public", enable_rls: true },
      { name: "products", schema: "public", enable_rls: true },
      { name: "audit_logs", schema: "public", tenant_column: "org_id", enable_rls: true },
    ],
    policies: { default_role: "app_user", force_rls_on_owner: false },
    settings: { add_indexes: false, warn_missing_tables: true },
    ...overrides,
  };
}

describe("audit", () => {
  it("detects tables in schema not present in config", () => {
    const findings = audit(basicSchema, makeConfig());
    const missing = findings.filter(
      (f) => f.rule === "missing-from-config" && f.table === "migrations"
    );
    expect(missing.length).toBeGreaterThan(0);
  });

  it("does not warn about missing tables when warn_missing_tables is false", () => {
    const config = makeConfig({
      settings: { add_indexes: false, warn_missing_tables: false },
    });
    const findings = audit(basicSchema, config);
    const missing = findings.filter((f) => f.rule === "missing-from-config");
    expect(missing).toHaveLength(0);
  });

  it("detects inconsistent tenant column names", () => {
    const findings = audit(basicSchema, makeConfig());
    const inconsistent = findings.filter((f) => f.rule === "inconsistent-tenant-column");
    expect(inconsistent.length).toBeGreaterThan(0);
    expect(inconsistent.some((f) => f.table === "audit_logs")).toBe(true);
  });

  it("warns about superuser bypass when force_rls_on_owner is false", () => {
    const findings = audit(basicSchema, makeConfig());
    const bypass = findings.filter((f) => f.rule === "superuser-bypass");
    expect(bypass.length).toBeGreaterThan(0);
  });

  it("does not warn about superuser bypass when force_rls_on_owner is true", () => {
    const config = makeConfig({
      policies: { default_role: "app_user", force_rls_on_owner: true },
    });
    const findings = audit(basicSchema, config);
    const bypass = findings.filter((f) => f.rule === "superuser-bypass");
    expect(bypass).toHaveLength(0);
  });
});
