import { parse as parseYaml } from "yaml";

/** Configuration for the tenant isolation model. */
export interface TenantConfig {
  tenant: { column: string; type: string };
  tables: TableConfig[];
  policies: PolicySettings;
  settings: GeneratorSettings;
}

/** Per-table configuration for RLS policy generation. */
export interface TableConfig {
  name: string;
  schema: string;
  tenant_column?: string;
  enable_rls: boolean;
}

/** Global policy settings. */
export interface PolicySettings {
  default_role: string;
  force_rls_on_owner: boolean;
}

/** Generator behavior settings. */
export interface GeneratorSettings {
  add_indexes: boolean;
  warn_missing_tables: boolean;
}

/**
 * Parses a raw object (from JSON or already-parsed YAML) into a validated TenantConfig.
 * Applies defaults for optional fields.
 */
export function parseConfig(raw: Record<string, unknown>): TenantConfig {
  if (!raw.tenant || typeof raw.tenant !== "object") {
    throw new Error("Missing required 'tenant' section in config");
  }

  const tenant = raw.tenant as Record<string, unknown>;

  if (!tenant.column || typeof tenant.column !== "string") {
    throw new Error("Missing required 'tenant.column' in config");
  }

  if (!tenant.type || typeof tenant.type !== "string") {
    throw new Error("Missing required 'tenant.type' in config");
  }

  if (!raw.tables || !Array.isArray(raw.tables) || raw.tables.length === 0) {
    throw new Error("Missing or empty 'tables' section in config");
  }

  const tables: TableConfig[] = (raw.tables as Record<string, unknown>[]).map(
    (t, i) => {
      if (!t.name || typeof t.name !== "string") {
        throw new Error(`Table at index ${i} is missing required 'name' field`);
      }
      return {
        name: t.name,
        schema: typeof t.schema === "string" ? t.schema : "public",
        tenant_column: typeof t.tenant_column === "string" ? t.tenant_column : undefined,
        enable_rls: typeof t.enable_rls === "boolean" ? t.enable_rls : true,
      };
    }
  );

  return {
    tenant: { column: tenant.column, type: tenant.type },
    tables,
    policies: { default_role: "app_user", force_rls_on_owner: false },
    settings: { add_indexes: false, warn_missing_tables: false },
  };
}
