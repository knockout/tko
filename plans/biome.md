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
- `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`, `globals` from devDependencies

## What gets created

- `biome.json` — migrated config (formatter + linter)
- `@biomejs/biome` as devDependency

## Execution

### Commit 1: Add Biome plan and config

- `biome.json` with migrated Prettier + ESLint settings
- `plans/biome.md`

### Commit 2: Apply Biome formatting and safe lint fixes

1. Run `biome format --write` — align formatting (matches Prettier settings)
2. Run `biome check --fix` — apply safe-only auto-fixes
3. Manual fixes:
   - 2x `return` → `return undefined` in getters (useGetterReturn)
   - 2x `biome-ignore` for intentional switch fallthrough
   - 1x `biome-ignore` for intentional `this` alias in ComponentABC
4. Verify: `bunx tsc` 0 errors, `bunx vitest run` 2679 tests pass

**Skipped unsafe fixes** (`biome check --fix --unsafe`):
- `useLiteralKeys` converts `obj["key"]` to `obj.key` — surfaces latent type
  errors (tsc goes from 0 → 29 errors) because bracket notation bypasses type
  checking on loosely-typed objects.
- `useOptionalChain`, `useTemplate` — same issue.

**Skipped organizeImports**: import reordering breaks TS inference in some files.

**Skipped useArrowFunction**: `function()` → `() =>` breaks KO's external
`this` binding and constructor patterns (46 test failures).

**Skipped noThisInStatic**: replaces `this` with class name in static methods,
breaking subclass inheritance in ComponentABC.

### Commit 3: Replace ESLint + Prettier with Biome

1. Delete `eslint.config.js`, `.prettierrc`, `.prettierignore`
2. Remove devDependencies: `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`, `globals`
3. Add devDependency: `@biomejs/biome`
4. Update `package.json` scripts to use `biome`
5. Update `.github/workflows/lint-and-typecheck.yml`: single `biome ci .`
6. Update `AGENTS.md` and `plans/modern-tooling.md`

### Commit 4: Address PR review

- Widen `files.includes` to cover `tools/**` and `vitest.config.ts`
- Fix mismatched HTML tag in eventBehaviors
- Fix typos in test names/comments
- Remove unused variable and function args

## New rules enabled (beyond ESLint parity)

| Rule | Level | What it catches |
|---|---|---|
| `noUnusedImports` | warn | Dead imports from refactors |
| `noUnusedVariables` | warn | Dead code, typos |
| `noUnusedFunctionParameters` | warn | Unused params (no auto-fix) |
| `noRedeclare` | error | Duplicate declarations |
| `noFallthroughSwitchClause` | error | Unintended switch fallthrough |
| `useGetterReturn` | error | Getters missing return |

## Rules kept off (legacy codebase)

`noExplicitAny`, `noArguments`, `useConst`, `noNamespace`, `noNonNullAssertion`,
`useArrowFunction`, `noThisInStatic`, `noBannedTypes`, `noImplicitAnyLet`,
`noGlobalEval`, `noDelete`, and several others. See `biome.json` for full list.

## Verification

1. `bunx @biomejs/biome ci .` — 0 errors
2. `bun run build` — all packages build
3. `bunx vitest run` — 2679 tests pass
4. `bunx tsc` — 0 type errors
