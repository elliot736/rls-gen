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

    // Extract column names (first word on each comma-separated segment)
    const columns: string[] = [];
    const lines = body.split(",");
    for (const line of lines) {
      const trimmed = line.trim();
      // Skip constraints (PRIMARY KEY, FOREIGN KEY, UNIQUE, CHECK, CONSTRAINT)
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
