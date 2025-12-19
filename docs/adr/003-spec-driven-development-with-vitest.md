# ADR-003: Spec-driven development with Vitest

## Status
Accepted

## Date
2025-12-19

## Context
`rls-gen` generates SQL that enforces security boundaries. Bugs in generated policies could silently expose one tenant's data to another. This makes correctness paramount and demands a rigorous testing strategy established from the start of the project. We needed to choose a test framework and define testing conventions.

## Decision
We adopt a spec-driven (tests-first) development approach using Vitest as the test runner. Tests are colocated with their source files (`generator.test.ts` next to `generator.ts`) rather than placed in a separate `__tests__` directory. The test style is table-driven where applicable -- for example, the validator tests iterate over all valid tenant types (`uuid`, `integer`, `bigint`, `text`) in a single test case.

Each module has a `makeConfig()` helper that produces a valid baseline config, with tests applying targeted overrides via `Partial<TenantConfig>` to isolate the specific behavior under test. Tests assert on the generated SQL strings directly (substring matching via `toContain`) rather than parsing the output, keeping assertions simple and readable.

The `test` script runs `vitest run` (single pass), while `test:watch` runs `vitest` in watch mode for development.

## Consequences
**Positive:** Vitest's native ESM and TypeScript support means zero configuration -- no Babel transforms, no `ts-jest` adapter, no special module resolution hacks. Tests run fast because Vitest uses Vite's transform pipeline. The `makeConfig()` pattern ensures each test is self-contained and makes the default-vs-override relationship explicit. Colocated test files make it easy to see at a glance whether a module has test coverage.

**Negative:** Vitest is newer than Jest and has a smaller ecosystem of plugins and community answers. String-based SQL assertions are fragile to formatting changes (e.g., adding a newline would break `toContain` checks). There are no integration tests that run generated SQL against an actual PostgreSQL instance.

## Alternatives Considered
**Jest:** The established standard, but requires additional configuration for ESM (`--experimental-vm-modules`) and TypeScript (`ts-jest` or `@swc/jest`). The configuration overhead is not justified for a project that already uses Vite-ecosystem tooling.

**`node:test` (built-in):** Zero dependencies, but lacks the ergonomic assertion library and watch mode that accelerate development. The reporting output is also less readable.
