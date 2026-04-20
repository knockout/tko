# Plan: TypeScript Code Review — Address Findings

**Risk class:** `MEDIUM`

**Status:** Draft

## Status Update (2026-04-20)

- Source basis: local `git log` + GitHub API (`knockout/tko`), including
  Issue [#235](https://github.com/knockout/tko/issues/235) (still `open`).
- Marked as done: Steps 1, 2, 3.
- Marked as obsolete: part of Step 14 (`tools/repackage.mjs` no longer exists).

## Summary

A comprehensive TypeScript code review of the full TKO monorepo (25+ packages,
2 builds, tools) identified 6 critical issues, 8 important improvements, and
7 suggestions. The codebase compiles cleanly (`tsc` zero errors on production
source) and has solid modular architecture, but pervasive `any` usage — enabled
by globally disabled ESLint rules — undermines TypeScript's value. One confirmed
bug (wrong binding handler lookup) was found, along with deprecated API usage,
untyped DOM parameters, and unresolved FIXMEs in production code.

## Goals

- Replace deprecated `.substr()` with `.substring()` / `.slice()`
- Gradually re-enable disabled ESLint type-safety rules
- Improve type annotations in the highest-impact locations (Parser, Provider,
  build render functions)
- Harden tooling scripts with proper error handling

## Non-Goals

- Fix the confirmed bug in `AttributeMustacheProvider.getPossibleDirectBinding`
- Resolve or document all FIXME annotations in production source
- Rewriting all `any` types at once (too large; incremental approach preferred)
- Changing runtime behavior or public API surface
- Modifying `tools/build.mk` or `tools/karma.conf.js` (shared infrastructure — needs separate HIGH-risk plan)
- Adding new runtime dependencies

## Current State

### TypeScript Compiler

- `tsc` passes with zero errors on production source
- ~~Skill example files (`skills/typescript-code-review/examples/`) cause `tsc`
  failures — they are not excluded from tsconfig~~ ✅ **Done** (`skills` is now
  excluded in `tsconfig.json`)


### Confirmed Bug (Github-Issue #235)

`packages/provider.mustache/src/AttributeMustacheProvider.ts` line 83:

```typescript
getPossibleDirectBinding(attrName: string) {
  const bindingName = this.ATTRIBUTES_BINDING_MAP[attrName]
  return bindingName && this.bindingHandlers.get(attrName) //FIXME this.bindingHandlers.get(bindingName) ?
}
```

Looks up binding handler by `attrName` instead of `bindingName`. The FIXME
comment confirms this is a known issue.

### Unresolved FIXMEs (5 occurrences)

| File | Line | Description |
|------|------|-------------|
| `packages/provider.mustache/src/AttributeMustacheProvider.ts` | 83 | Wrong binding handler lookup key |
| `packages/provider.attr/src/AttributeProvider.ts` | 45 | Duplicates `Identifier.prototype.lookup_value` |
| `packages/binding.foreach/src/foreach.ts` | 74 | Expensive `cloneNode` — consider iterating |
| `packages/binding.if/src/ifUnless.ts` | 37 | `needsRefresh` condition incomplete |
| `packages/utils.parser/src/preparse.ts` | (charCodes) | Magic numbers instead of named constants |

## Steps

### Phase 1: Quick Wins (LOW risk, no behavior change)

1. ✅ **Replace `.substr()` with `.substring()`** in `packages/binding.core/src/attr.ts:15`.
   Done via commit `9659cf21`.

2. ✅ **Replace magic number** `9007199254740991` with `Number.MAX_SAFE_INTEGER`
   in `packages/binding.foreach/src/foreach.ts:35`.
   Done via commit `1b8a062f`.

3. ✅ **Exclude skill examples from tsc** — Add `skills` to the `exclude` array
   in `tsconfig.json` so `make tsc` stays green.
   Done (see current `tsconfig.json`).

### Phase 2: Type Improvements (MEDIUM risk)

9. **Type the Parser core** — Change `ch: any` → `ch: string`,
   `at: any` → `at: number`, `text: any` → `text: string` in
   `packages/utils.parser/src/Parser.ts`.

10. **Add `LegacyProvider` constructor types** — Type `providerObject` and
    `parentProvider` parameters in `packages/provider/src/Provider.ts:116`.

11. **Type `jsx` parameter** in build render functions — Replace `any` with
    proper JSX element type in `builds/reference/src/index.ts` and
    `builds/knockout/src/index.ts`.

12. **Define `ComponentDefinition` interface** — Replace `any` params in
    `packages/binding.component/src/componentBinding.ts`.

13. **Add named charCode constants** in `packages/utils.parser/src/preparse.ts`.

### Phase 3: Robustness (LOW risk)

14. **Add error handling to tooling scripts** — Wrap `JSON.parse` in
    try-catch in `tools/release-version.cjs`; make `writeFile` failures
    fatal in `tools/repackage.mjs`. ⚠️ **Partially obsolete**: `tools/repackage.mjs`
    is no longer present in the current repo state.

15. **Fix DOM mutation during iteration** — Collect attributes to remove
    in `AttributeMustacheProvider.bindingObjects` before yielding, then
    remove after iteration.

16. **Resolve remaining FIXMEs** — Investigate each, fix or document
    retention reason with a tracking issue number.

## Verification

- `make tsc` — zero errors (currently passes; must remain green)
- `make test-headless` — all tests pass after each step
- `make eslint` — no new errors introduced; warning count tracked
- `make format` — formatting check passes
- Manual verification of `AttributeMustacheProvider` bug fix via
  mustache provider test suite

## AI Evidence

- Risk class: `MEDIUM` — behavior changes in binding/provider logic;
  no CI/CD, release, or shared tooling modification (Phase 2+ ESLint
  changes are config-only)
- Changes and steps: See Steps section above (4 phases, 16 steps)
- Tools/commands: `tsc`, `eslint`, `grep`, subagent code review across
  all packages, manual source verification
- Validation: `tsc` passes with zero production errors; all findings
  verified against actual source code
- Follow-up owner: Maintainer review required before Phase 2+


# Later Steps (NOT in this task)

## ESLint Configuration - Current State

The following type-safety rules are globally disabled in `eslint.config.js`:

```
@typescript-eslint/no-explicit-any: off
@typescript-eslint/no-unused-vars: off
@typescript-eslint/no-unsafe-function-type: off
prefer-const: off
prefer-spread: off
no-useless-escape: off
```

The entire `builds/` directory is excluded from linting.

### DON'T DO THIS NOW: ESLint Rule Re-enablement (MEDIUM risk)

1. **Fix confirmed bug** — Change `this.bindingHandlers.get(attrName)` to
   `this.bindingHandlers.get(bindingName)` in `AttributeMustacheProvider.ts:83`.
   Verify with existing tests (`make test-headless` in `packages/provider.mustache`).

2. **Re-enable `prefer-const` as `warn`** — Run `make eslint` to assess
   violation count; auto-fix with `make eslint-fix`.

3. **Re-enable `@typescript-eslint/no-unused-vars` as `warn`** with
   `argsIgnorePattern: '^_'` — identify dead code across all packages.

4. **Include `builds/` in ESLint scope** — Remove `builds/**/*` from
   `ignores` in `eslint.config.js`. Fix any violations found.

5. **Re-enable `no-explicit-any` as `warn`** per-package, starting with
   smaller packages (`lifecycle`, `filter.punches`, `builder`). Track
   violation count reduction over time.
