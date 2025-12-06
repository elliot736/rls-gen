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

  return errors;
}
