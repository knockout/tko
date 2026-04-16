# Plan: Replace Make + lerna with Bun

## Context

TKO uses Makefiles + lerna for build orchestration. This adds two unnecessary
toolchain dependencies (`make`, `lerna`) and splits build config between
Makefiles and package.json. With Bun workspaces already handling dependency
resolution and `bun run --filter` supporting cross-workspace script execution,
Make and lerna are redundant.

Keep esbuild as the compiler — Bun's IIFE format doesn't support `globalName`
yet, which the builds/ packages need.

## What gets deleted

- `Makefile` (root — 70 lines)
- `tools/build.mk` (shared build config — 110 lines)
- 26 `packages/*/Makefile` files (each just `include ../../tools/build.mk`)
- 2 `builds/*/Makefile` files (include build.mk + override default/global-name)
- `lerna.json`
- `lerna` from devDependencies

## What gets created

### `tools/build.ts` (~45 lines)

Shared build script using native Bun APIs (`Bun.file`, `Bun.Glob`, `Bun.spawn`).
Reads package.json for name, version, and optional TKO-specific config.
Runs esbuild via `bunx esbuild`.

Reads from `package.json`:
- `name` and `version` — for banner and BUILD_VERSION define
- `tko.iifeGlobalName` — optional, defaults to `"tko"` (knockout uses `"ko"`)
- `tko.buildMode` — optional, `"browser-only"` for builds/, default builds ESM+CJS+MJS

Build modes:
- **Default** (packages): ESM (`dist/*.js` from all src), MJS (`dist/index.mjs`), CJS (`dist/index.cjs` bundled)
- **`browser-only`** (builds): IIFE minified (`dist/browser.min.js`), IIFE unminified (`dist/browser.js`)

All builds: `--sourcemap=external`, `--log-level=warning`, `--define:BUILD_VERSION`, version banner.

CJS bundles: `--bundle --format=cjs` with `@tko/*` as external.
IIFE bundles: `--bundle --format=iife --global-name={name}` with footer assigning to `self`/`window`/`global`.

### Per-package `package.json` changes

Add to each of 28 packages:
```json
"scripts": {
  "build": "bun ../../tools/build.ts"
}
```

Add to `builds/knockout/package.json`:
```json
"tko": { "iifeGlobalName": "ko", "buildMode": "browser-only" }
```

Add to `builds/reference/package.json`:
```json
"tko": { "buildMode": "browser-only" }
```

### Root `package.json` scripts

```json
"scripts": {
  "build": "bun run --filter '*' build",
  "test": "bunx vitest run",
  "test:ff": "VITEST_BROWSERS=firefox bunx vitest run",
  "tsc": "bunx tsc",
  "dts": "bunx tsc --build tsconfig.dts.json",
  "format": "bunx prettier . --check",
  "format:fix": "bunx prettier . --write",
  "lint": "bunx eslint .",
  "lint:fix": "bunx eslint . --fix",
  "clean": "rm -rf packages/*/dist builds/*/dist coverage"
}
```

Remove `lerna` from devDependencies. Delete `lerna.json`.

## CI workflow updates

Replace `make` with `bun run build` in:
- `.github/workflows/test-headless.yml`
- `.github/workflows/main-build.yml`
- `.github/workflows/lint-and-typecheck.yml`
- `.github/workflows/publish-check.yml`

Replace `make test-headless` / `make test` with `bun run test`.

## AGENTS.md updates

Replace build commands section with `bun run` equivalents.

## Execution order

0. Create branch `modern-tooling/phase-3-replace-make-lerna` from main
1. Copy this plan to `plans/replace-make-lerna.md`
2. Create `tools/build.ts` — test on one package manually
3. Add `"build"` scripts to all 28 package.json files
4. Add `tko` config to builds/knockout and builds/reference
5. Add root scripts to `package.json`, remove lerna
6. Run `bun run build` — verify all 27 packages build
7. Run `bunx vitest run` — verify tests pass
8. Update CI workflows
9. Delete all Makefiles, `tools/build.mk`, `lerna.json`
10. Update AGENTS.md and plans/modern-tooling.md

## Verification

1. `bun run build` — 27 packages build successfully
2. `bun run test` — 2679 tests pass
3. `bun run tsc` — 0 errors
4. `bun run format` — passes
5. `bun run lint` — passes
6. Verify `dist/` output matches current make output (spot-check a few packages)
