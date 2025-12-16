import { readFileSync } from "node:fs";
import { parseConfigFromYaml } from "./config/config.js";
import { generate } from "./generator/generator.js";

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
