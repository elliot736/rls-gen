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
