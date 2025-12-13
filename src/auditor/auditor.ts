import type { TenantConfig } from "../config/config.js";

/** An audit finding representing a potential RLS pitfall. */
export interface AuditFinding {
  severity: "error" | "warning" | "info";
  rule: string;
  message: string;
  table: string;
}

interface ParsedTable {
  schema: string;
  name: string;
  columns: string[];
}

/**
 * Parses CREATE TABLE statements from a SQL schema dump using regex.
 * Returns an array of parsed table metadata.
 */
function parseTables(schemaSql: string): ParsedTable[] {
  const tables: ParsedTable[] = [];
  const tableRegex =
    /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:(\w+)\.)?(\w+)\s*\(([\s\S]*?)\);/gi;

  let match: RegExpExecArray | null;
  while ((match = tableRegex.exec(schemaSql)) !== null) {
    const schema = match[1] ?? "public";
    const name = match[2];
    const body = match[3];

    const columns: string[] = [];
    const lines = body.split(",");
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^(PRIMARY|FOREIGN|UNIQUE|CHECK|CONSTRAINT)\b/i.test(trimmed)) {
        continue;
      }
      const colMatch = trimmed.match(/^(\w+)\s+/);
      if (colMatch) {
        columns.push(colMatch[1]);
      }
    }

    tables.push({ schema, name, columns });
  }

  return tables;
}

/**
 * Checks for existing indexes in a SQL schema dump.
 * Returns a set of "schema.table.column" strings that have indexes.
 */
function parseIndexes(schemaSql: string): Set<string> {
  const indexes = new Set<string>();
  const indexRegex =
    /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?\w+\s+ON\s+(?:(\w+)\.)?(\w+)\s*\((\w+)/gi;

  let match: RegExpExecArray | null;
  while ((match = indexRegex.exec(schemaSql)) !== null) {
    const schema = match[1] ?? "public";
    const table = match[2];
    const column = match[3];
    indexes.add(`${schema}.${table}.${column}`);
  }

  return indexes;
}

/**
 * Audits a SQL schema dump against the tenant config to detect
 * common RLS pitfalls and potential security issues.
 *
 * Returns an array of AuditFinding objects.
 */
export function audit(schemaSql: string, config: TenantConfig): AuditFinding[] {
  const findings: AuditFinding[] = [];
  const schemaTables = parseTables(schemaSql);
  const existingIndexes = parseIndexes(schemaSql);

  // Build a set of configured table keys
  const configuredKeys = new Set(
    config.tables.map((t) => `${t.schema}.${t.name}`)
  );

  // 1. Tables in schema not in config
  if (config.settings.warn_missing_tables) {
    for (const st of schemaTables) {
      const key = `${st.schema}.${st.name}`;
      if (!configuredKeys.has(key)) {
        findings.push({
          severity: "warning",
          rule: "missing-from-config",
          message: `Table '${key}' exists in schema but is not in the RLS config — it may be missing row-level security`,
          table: st.name,
        });
      }
    }
  }

  // 2. Inconsistent tenant column names
  const defaultCol = config.tenant.column;
  for (const table of config.tables) {
    if (table.tenant_column && table.tenant_column !== defaultCol) {
      findings.push({
        severity: "warning",
        rule: "inconsistent-tenant-column",
        message: `Table '${table.name}' uses tenant column '${table.tenant_column}' instead of the default '${defaultCol}'`,
        table: table.name,
      });
    }
  }

  return findings;
}
