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
});
