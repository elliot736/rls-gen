import { readFileSync } from "node:fs";
import { parseConfigFromYaml } from "./config/config.js";
import { generate } from "./generator/generator.js";
import { validate } from "./validator/validator.js";
import { audit } from "./auditor/auditor.js";

/** Parses CLI arguments and executes the appropriate subcommand. */
export function run(argv: string[]): void {
  const args = argv.slice(2);
  const command = args[0];

  if (!command || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  switch (command) {
    case "generate":
      runGenerate(args.slice(1));
      break;
    case "validate":
      runValidate(args.slice(1));
      break;
    case "audit":
      runAudit(args.slice(1));
      break;
    default:
      console.error(`Unknown command: ${command}. Run rls-gen --help for usage.`);
      printUsage();
      process.exit(1);
  }
}

function getFlag(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  if (idx === -1 || idx + 1 >= args.length) return undefined;
  return args[idx + 1];
}

function loadConfig(configPath: string) {
  const content = readFileSync(configPath, "utf-8");
  return parseConfigFromYaml(content);
}

function requireFlag(args: string[], flag: string, label: string): string {
  const value = getFlag(args, flag);
  if (!value) {
    console.error(`Error: ${flag} flag is required`);
    process.exit(1);
  }
  return value;
}

function runGenerate(args: string[]): void {
  const configPath = requireFlag(args, "--config", "config");
  const config = loadConfig(configPath);
  const statements = generate(config);
  console.log(statements.join("\n\n"));
}

function runValidate(args: string[]): void {
  const configPath = requireFlag(args, "--config", "config");
  const config = loadConfig(configPath);
  const errors = validate(config);

  if (errors.length === 0) {
    console.log("Config is valid. No issues found.");
    return;
  }

  for (const err of errors) {
    const prefix = err.severity === "error" ? "ERROR" : "WARNING";
    console.log(`[${prefix}] ${err.message}`);
  }

  if (errors.some((e) => e.severity === "error")) {
    process.exit(1);
  }
}

function runAudit(args: string[]): void {
  const configPath = requireFlag(args, "--config", "config");
  const schemaPath = requireFlag(args, "--schema", "schema");
  const config = loadConfig(configPath);
  const schemaSql = readFileSync(schemaPath, "utf-8");
  const findings = audit(schemaSql, config);

  if (findings.length === 0) {
    console.log("Audit passed. No issues found.");
    return;
  }

  for (const f of findings) {
    const prefix =
      f.severity === "error"
        ? "ERROR"
        : f.severity === "warning"
          ? "WARNING"
          : "INFO";
    console.log(`[${prefix}] [${f.rule}] ${f.message}`);
  }

  if (findings.some((f) => f.severity === "error")) {
    process.exit(1);
  }
}

function printUsage(): void {
  console.log(`
rls-gen — PostgreSQL Row-Level Security Policy Generator

Usage:
  rls-gen generate --config <config.yaml>    Generate RLS SQL statements
  rls-gen validate --config <config.yaml>    Validate config for errors
  rls-gen audit --config <config.yaml> --schema <schema.sql>
                                             Audit schema for RLS pitfalls

Options:
  --help, -h    Show this help message
`);
}
