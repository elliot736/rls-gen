import { describe, it, expect } from "vitest";
import { parseConfig, parseConfigFromYaml } from "./config.js";

const validYaml = `
tenant:
  column: tenant_id
  type: uuid

tables:
  - name: orders
    schema: public
    tenant_column: tenant_id
    enable_rls: true
  - name: products
    schema: public
    enable_rls: true

policies:
  default_role: app_user
  force_rls_on_owner: true

settings:
  add_indexes: true
  warn_missing_tables: true
`;

const minimalYaml = `
tenant:
  column: tenant_id
  type: uuid

tables:
  - name: orders
    schema: public
    enable_rls: true
`;

describe("parseConfigFromYaml", () => {
  it("parses a complete valid YAML config", () => {
    const config = parseConfigFromYaml(validYaml);
    expect(config.tenant.column).toBe("tenant_id");
    expect(config.tenant.type).toBe("uuid");
    expect(config.tables).toHaveLength(2);
    expect(config.tables[0].name).toBe("orders");
    expect(config.tables[0].schema).toBe("public");
    expect(config.tables[0].tenant_column).toBe("tenant_id");
    expect(config.tables[0].enable_rls).toBe(true);
    expect(config.tables[1].name).toBe("products");
    expect(config.tables[1].tenant_column).toBeUndefined();
    expect(config.policies.default_role).toBe("app_user");
    expect(config.policies.force_rls_on_owner).toBe(true);
    expect(config.settings.add_indexes).toBe(true);
    expect(config.settings.warn_missing_tables).toBe(true);
  });

  it("applies defaults for optional policies and settings", () => {
    const config = parseConfigFromYaml(minimalYaml);
    expect(config.policies.default_role).toBe("app_user");
    expect(config.policies.force_rls_on_owner).toBe(false);
    expect(config.settings.add_indexes).toBe(false);
    expect(config.settings.warn_missing_tables).toBe(false);
  });

  it("throws on missing tenant section", () => {
    const yaml = `
tables:
  - name: orders
    schema: public
    enable_rls: true
`;
    expect(() => parseConfigFromYaml(yaml)).toThrow(/tenant/i);
  });

  it("throws on missing tenant.column", () => {
    const yaml = `
tenant:
  type: uuid
tables:
  - name: orders
    schema: public
    enable_rls: true
`;
    expect(() => parseConfigFromYaml(yaml)).toThrow(/column/i);
  });

  it("throws on missing tenant.type", () => {
    const yaml = `
tenant:
  column: tenant_id
tables:
  - name: orders
    schema: public
    enable_rls: true
`;
    expect(() => parseConfigFromYaml(yaml)).toThrow(/type/i);
  });

  it("throws on missing tables section", () => {
    const yaml = `
tenant:
  column: tenant_id
  type: uuid
`;
    expect(() => parseConfigFromYaml(yaml)).toThrow(/tables/i);
  });

  it("throws on empty tables array", () => {
    const yaml = `
tenant:
  column: tenant_id
  type: uuid
tables: []
`;
    expect(() => parseConfigFromYaml(yaml)).toThrow(/tables/i);
  });

  it("throws on table missing name", () => {
    const yaml = `
tenant:
  column: tenant_id
  type: uuid
tables:
  - schema: public
    enable_rls: true
`;
    expect(() => parseConfigFromYaml(yaml)).toThrow(/name/i);
  });

  it("defaults table schema to public if not provided", () => {
    const yaml = `
tenant:
  column: tenant_id
  type: uuid
tables:
  - name: orders
    enable_rls: true
`;
    const config = parseConfigFromYaml(yaml);
    expect(config.tables[0].schema).toBe("public");
  });

  it("defaults enable_rls to true if not provided", () => {
    const yaml = `
tenant:
  column: tenant_id
  type: uuid
tables:
  - name: orders
    schema: public
`;
    const config = parseConfigFromYaml(yaml);
    expect(config.tables[0].enable_rls).toBe(true);
  });
});

// JSON/object input parsing
describe("parseConfig", () => {
  it("parses a JSON object input", () => {
    const input = {
      tenant: { column: "tenant_id", type: "uuid" },
      tables: [{ name: "orders", schema: "public", enable_rls: true }],
    };
    const config = parseConfig(input);
    expect(config.tenant.column).toBe("tenant_id");
    expect(config.tables).toHaveLength(1);
  });
});
