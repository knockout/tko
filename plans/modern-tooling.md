# Plan: Modern Tooling Migration

## Context

TKO's build tooling is dated: Makefiles orchestrate esbuild, npm is the package
manager, TypeScript 6 is the checker, and karma runs browser tests. Recent
attempts to modernize (knip, moduleResolution changes) were reverted because
they were merged without review and broke the mocha migration.

This plan lays out a phased migration to a modern stack: Bun, tsgo (TypeScript 7),
and knip — in an order that delivers value early and avoids the mistakes of the
reverted PRs.

## Target stack

| Tool | Current | Target | Why |
|------|---------|--------|-----|
| Package manager | npm | Bun | 10-25x faster installs, built-in script runner |
| TypeScript checker | tsc (TS 6, JS) | tsgo (TS 7, Go-native) | 3-10x faster typechecking |
| Build orchestrator | Make + esbuild | Bun scripts + esbuild | Standard package.json scripts, no Make knowledge needed |
| Linter + formatter | ESLint + Prettier | Biome | Single tool, Rust-native, 10-100x faster |
| Linter (unused exports) | none | knip | Catches dead code, unused deps |
| Test runner | Karma + browser | Karma (unchanged for now) | Works, not worth migrating yet |
| Version pinning | none | mise/asdf via `.tool-versions` | Reproducible environments |

## Phases

### Phase 1: `.tool-versions` + Bun

**One PR. Low risk.**

- Add `.tool-versions` with `bun latest` (and `node 24` for compatibility)
- Add `bun.lock` alongside `package-lock.json` (transitional)
- Verify `bun install` works, `make test-headless` still passes
- Update CI to use `bun install` instead of `npm install`
- Update AGENTS.md to mention Bun

No Makefile changes yet — Bun just replaces npm as the package manager.

### Phase 2: tsgo (TypeScript 7)

**One PR. Low risk — additive, not replacing.**

Verified locally: tsgo passes with zero errors on TKO source using:
```json
{
  "module": "es2022",
  "moduleResolution": "bundler",
  "typeRoots": ["node_modules/@types"]
}
```

Changes:
- Add `@typescript/native-preview` as devDependency
- Update `tsconfig.json`:
  - `moduleResolution`: `"node10"` → `"bundler"` (required — tsgo removed `node10`)
  - Add `typeRoots: ["node_modules/@types"]` (tsgo doesn't support `types` field yet — [microsoft/typescript-go#3023](https://github.com/microsoft/typescript-go/issues/3023))
  - Remove `types: ["mocha", "jquery"]` (redundant with `typeRoots`)
- Add `make tsgo` target (or `bun run tsgo` script) for fast local checks
- Keep `tsc` (TS 6) in CI until tsgo reaches stable — both coexist
- Verify: `npx tsgo` passes, `npx tsc` still passes, all tests pass

Speed: tsc 1.17s → tsgo 0.41s (3x on TKO, likely more on larger projects).

### Phase 3: Replace Makefiles with Bun scripts

**One PR per concern. Medium risk — touches shared infra.**

The Makefile currently does: build (esbuild), test (karma), lint (eslint),
format (prettier), typecheck (tsc), dts generation, sweep/clean.

Migration:
- Move each Make target to a `package.json` script using `bun run`
- Use `bun --filter` for workspace-wide operations (replaces `lerna exec`)
- Delete `tools/build.mk` includes from per-package Makefiles
- Delete root Makefile last
- Update CI workflows to use `bun run build`, `bun run test`, etc.
- Update AGENTS.md build commands section

This is the biggest phase. Can be split into sub-PRs:
1. Add `bun run` scripts alongside Make targets (both work)
2. Migrate CI to use `bun run`
3. Remove Makefiles

### Phase 4: Biome (replaces ESLint + Prettier)

**One PR. Medium risk — touches all linted files, but output should be identical.**

Biome is a single Rust-native tool that replaces both ESLint and Prettier.
10-100x faster, one config file (`biome.json`), one command.

Changes:
- Add `@biomejs/biome` as devDependency
- Create `biome.json` matching current ESLint + Prettier rules:
  - No semicolons, single quotes, trailing commas: none, 120 char width
  - typescript-eslint equivalent rules
- Run `biome check --write` to migrate all files
- Remove `eslint.config.js`, `.prettierrc`, eslint/prettier devDependencies
- Update Make targets (or Bun scripts if Phase 3 is done): `make lint` → `biome check`
- Update CI workflow: single `biome ci` command replaces separate prettier + eslint steps
- Update AGENTS.md

Verify: `biome ci` passes, all tests pass, diff is formatting-only.

### Phase 5: knip

**One PR. Low risk — linter only, no source changes.**

- Add `knip.json` config
- Add CI workflow for knip checks
- Add `bun run knip` script
- Fix any findings in a follow-up PR (separate from the linter setup)

This was the main issue with the reverted PR #234 — it bundled the linter setup
with `verbatimModuleSyntax`, type refactoring, and export cleanup all in one
56-file PR. This time: just the linter. Findings get fixed in focused follow-ups.

### Phase 6 (future): knip findings

**One PR per category of finding.**

- Unused export cleanup
- Unused dependency removal
- `verbatimModuleSyntax` + import type fixes
- New shared type interfaces (if needed)

Each is a small, reviewable PR. None bundles concerns.

## Future considerations

- **Karma → Vitest** — if Karma becomes painful. Not urgent.
- **esbuild → Bun bundler** — evaluate during Phase 3. Bun's bundler is esbuild-compatible and eliminates a dependency. Test with `bun build` on a few packages to compare output.
- **Lerna → Bun workspaces** — evaluate during Phase 3. `bun --filter` replaces `lerna exec`, `bun install` already handles workspace resolution. Lerna may become unnecessary once Makefiles are gone.

## Verification

Each phase must:
1. Pass all CI checks (lint, typecheck, test-headless x3, publish-dry-run)
2. Be verified in a clean worktree before pushing
3. Be reviewed and approved before merge
