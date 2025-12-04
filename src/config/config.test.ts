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
});
