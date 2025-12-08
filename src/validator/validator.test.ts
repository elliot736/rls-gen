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

  it("accepts valid PostgreSQL types: uuid, integer, bigint, text", () => {
    for (const type of ["uuid", "integer", "bigint", "text"]) {
      const config = makeConfig({ tenant: { column: "tenant_id", type } });
      const errors = validate(config);
      expect(errors).toHaveLength(0);
    }
  });

  it("detects duplicate table entries", () => {
    const config = makeConfig({
      tables: [
        { name: "orders", schema: "public", enable_rls: true },
        { name: "orders", schema: "public", enable_rls: true },
      ],
    });
    const errors = validate(config);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.message.match(/duplicate/i))).toBe(true);
  });

  it("allows same table name in different schemas", () => {
    const config = makeConfig({
      tables: [
        { name: "orders", schema: "public", enable_rls: true },
        { name: "orders", schema: "sales", enable_rls: true },
      ],
    });
    const errors = validate(config);
    expect(errors).toHaveLength(0);
  });

  it("detects policy name conflicts from duplicate schema.table", () => {
    const config = makeConfig({
      tables: [
        { name: "orders", schema: "public", enable_rls: true },
        { name: "orders", schema: "public", enable_rls: true },
      ],
    });
    const errors = validate(config);
    expect(errors.some((e) => e.message.match(/duplicate/i))).toBe(true);
  });
});
