import { describe, it, expect } from "vitest";
import { generate } from "./generator.js";
import type { TenantConfig } from "../config/config.js";

function makeConfig(overrides: Partial<TenantConfig> = {}): TenantConfig {
  return {
    tenant: { column: "tenant_id", type: "uuid" },
    tables: [
      { name: "orders", schema: "public", enable_rls: true },
    ],
    policies: { default_role: "app_user", force_rls_on_owner: false },
    settings: { add_indexes: false, warn_missing_tables: false },
    ...overrides,
  };
}

describe("generate", () => {
  it("generates ENABLE RLS for a single table", () => {
    const sql = generate(makeConfig());
    expect(sql).toContain("ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;");
  });

  it("generates a CREATE POLICY with correct USING clause", () => {
    const sql = generate(makeConfig());
    expect(sql).toContain(
      "CREATE POLICY tenant_isolation_orders ON public.orders TO app_user USING (tenant_id = current_setting('app.current_tenant')::uuid);"
    );
  });

  it("generates GRANT for default role", () => {
    const sql = generate(makeConfig());
    const policyLine = sql.find((s) => s.startsWith("CREATE POLICY"));
    expect(policyLine).toContain("TO app_user");
  });

  it("generates FORCE RLS when force_rls_on_owner is true", () => {
    const config = makeConfig({
      policies: { default_role: "app_user", force_rls_on_owner: true },
    });
    const sql = generate(config);
    expect(sql).toContain("ALTER TABLE public.orders FORCE ROW LEVEL SECURITY;");
  });

  it("does NOT generate FORCE RLS when force_rls_on_owner is false", () => {
    const sql = generate(makeConfig());
    const forceStatements = sql.filter((s) => s.includes("FORCE ROW LEVEL SECURITY"));
    expect(forceStatements).toHaveLength(0);
  });

  it("generates indexes when add_indexes is true", () => {
    const config = makeConfig({
      settings: { add_indexes: true, warn_missing_tables: false },
    });
    const sql = generate(config);
    expect(sql).toContain(
      "CREATE INDEX IF NOT EXISTS idx_orders_tenant_id ON public.orders(tenant_id);"
    );
  });

  it("does NOT generate indexes when add_indexes is false", () => {
    const sql = generate(makeConfig());
    const indexStatements = sql.filter((s) => s.includes("CREATE INDEX"));
    expect(indexStatements).toHaveLength(0);
  });

  it("uses per-table tenant_column override", () => {
    const config = makeConfig({
      tables: [
        { name: "audit_logs", schema: "public", tenant_column: "org_id", enable_rls: true },
      ],
    });
    const sql = generate(config);
    expect(sql).toContain(
      "CREATE POLICY tenant_isolation_audit_logs ON public.audit_logs TO app_user USING (org_id = current_setting('app.current_tenant')::uuid);"
    );
  });

  it("handles multiple tables", () => {
    const config = makeConfig({
      tables: [
        { name: "orders", schema: "public", enable_rls: true },
        { name: "products", schema: "public", enable_rls: true },
        { name: "audit_logs", schema: "public", tenant_column: "org_id", enable_rls: true },
      ],
    });
    const sql = generate(config);
    expect(sql.filter((s) => s.includes("ENABLE ROW LEVEL SECURITY"))).toHaveLength(3);
    expect(sql.filter((s) => s.startsWith("CREATE POLICY"))).toHaveLength(3);
  });

  it("handles custom schema names", () => {
    const config = makeConfig({
      tables: [
        { name: "orders", schema: "sales", enable_rls: true },
      ],
    });
    const sql = generate(config);
    expect(sql).toContain("ALTER TABLE sales.orders ENABLE ROW LEVEL SECURITY;");
    expect(sql).toContain(
      "CREATE POLICY tenant_isolation_orders ON sales.orders TO app_user USING (tenant_id = current_setting('app.current_tenant')::uuid);"
    );
  });
});
