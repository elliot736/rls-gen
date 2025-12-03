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
