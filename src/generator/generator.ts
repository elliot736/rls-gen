import type { TenantConfig } from "../config/config.js";

/**
 * Generates an array of SQL statements that implement Row-Level Security
 * policies based on the provided tenant configuration.
 *
 * Statements are ordered per table: ENABLE RLS, FORCE RLS (optional),
 * CREATE POLICY, CREATE INDEX (optional).
 */
export function generate(config: TenantConfig): string[] {
  const statements: string[] = [];

  for (const table of config.tables) {
    if (!table.enable_rls) {
      continue;
    }

    const qualifiedName = `${table.schema}.${table.name}`;
    const tenantCol = table.tenant_column ?? config.tenant.column;

    // 1. Enable RLS
    statements.push(
      `ALTER TABLE ${qualifiedName} ENABLE ROW LEVEL SECURITY;`
    );
  }

  return statements;
}
