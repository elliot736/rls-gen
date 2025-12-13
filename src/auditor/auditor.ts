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
