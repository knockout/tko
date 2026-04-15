# Plan: Replace ESLint + Prettier with Biome

## Context

TKO uses ESLint (with typescript-eslint) and Prettier for linting and formatting.
Biome is a single Rust-native tool that replaces both — 27x faster on this codebase
(86ms vs 2.4s). 83% of ESLint rules migrate directly.

## Current state

- ESLint: 91 rules configured, most turned off. 23 errors on clean tree.
- Prettier: semi-false, single quotes, 120 width, trailing commas none.
- Both pass in CI via `lint-and-typecheck.yml`.

## What gets deleted

- `eslint.config.js`
- `.prettierrc`
- `.prettierignore`
- `eslint`, `@eslint/js`, `typescript-eslint`, `prettier` from devDependencies

## What gets created

- `biome.json` — migrated config (formatter + linter)
- `@biomejs/biome` as devDependency

## Execution

### Commit 1: Add Biome, auto-fix safe rules

1. Write `biome.json` with migrated config
2. Run `biome format --write` — align formatting (matches Prettier settings)
3. Run `biome check --fix` — apply safe auto-fixes:
   - `useArrowFunction` (~2,599) — `function()` → `() =>` where no `this`/`arguments`
   - `useTemplate` (~123) — string concat → template literals
   - `useLiteralKeys` (~68) — `obj["key"]` → `obj.key`
   - `useOptionalChain` (~44) — `a && a.b` → `a?.b`
   - `useImportType` (~9) — type-only imports
4. Turn off unfixable rules to silence noise:
   - `noArguments` (37) — legacy `arguments` usage
   - `noImplicitAnyLet` (141) — needs type annotations
   - `noUnusedFunctionParameters` (134) — needs `_` prefixes
   - `noGlobalEval` (12) — parser uses eval intentionally
   - `noNonNullAssertion` (59) — needs null checks
   - `noThisInStatic` (12) — deliberate pattern
5. Run `bun run build && bunx vitest run` — verify nothing broke
6. Risk: `useArrowFunction` in KO callbacks where `this` is externally bound.
   Biome skips when `this` is lexically referenced, but can't detect external binding.
   Tests catch this.

### Commit 2: Remove ESLint + Prettier

1. Delete `eslint.config.js`, `.prettierrc`, `.prettierignore`
2. Remove devDependencies: `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`
3. Add devDependency: `@biomejs/biome`
4. Update `package.json` scripts:
   - `"format"` → `"bunx biome format ."`
   - `"format:fix"` → `"bunx biome format --write ."`
   - `"lint"` → `"bunx biome lint ."`
   - `"lint:fix"` → `"bunx biome check --fix ."`
5. Update `.github/workflows/lint-and-typecheck.yml`:
   - Replace Prettier + ESLint steps with single `bunx biome ci .`
6. Update `AGENTS.md` lint/format commands

## Verification

1. `bunx biome ci .` — 0 errors
2. `bun run build` — all packages build
3. `bunx vitest run` — 2679 tests pass
4. `bunx tsc` — 0 type errors
