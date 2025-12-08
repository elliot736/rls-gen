import { describe, it, expect } from "vitest";
import { validate, ValidationError } from "./validator.js";
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

describe("validate", () => {
  it("returns no errors for a valid config", () => {
    const errors = validate(makeConfig());
    expect(errors).toHaveLength(0);
  });

  it("reports invalid tenant column type", () => {
    const config = makeConfig({
      tenant: { column: "tenant_id", type: "varchar(255)" },
    });
    const errors = validate(config);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toMatch(/type/i);
  });
});
