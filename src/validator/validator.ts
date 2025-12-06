import type { TenantConfig } from "../config/config.js";

/** A validation error or warning found in the config. */
export interface ValidationError {
  severity: "error" | "warning";
  message: string;
}

const VALID_TENANT_TYPES = new Set(["uuid", "integer", "bigint", "text"]);

/**
 * Validates a TenantConfig for correctness and returns an array of
 * ValidationError objects. An empty array means the config is valid.
 */
export function validate(config: TenantConfig): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check tenant column type
  if (!VALID_TENANT_TYPES.has(config.tenant.type)) {
    errors.push({
      severity: "error",
      message: `Invalid tenant column type '${config.tenant.type}'. Must be one of: ${[...VALID_TENANT_TYPES].join(", ")}`,
    });
  }

  // Check for empty default_role
  if (!config.policies.default_role) {
    errors.push({
      severity: "error",
      message: "Policy default_role must not be empty",
    });
  }

  // Check for duplicate table entries (same schema + name)
  const seen = new Set<string>();
  for (const table of config.tables) {
    const key = `${table.schema}.${table.name}`;
    if (seen.has(key)) {
      errors.push({
        severity: "error",
        message: `Duplicate table entry: ${key}`,
      });
    }
    seen.add(key);
  }

  return errors;
}
