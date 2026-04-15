# Plan: Modern Tooling Migration

**Risk class:** MEDIUM — phased approach, each phase is independently shippable
**Owner:** brianmhunt

## Progress

| Phase | Status | PR | Notes |
|-------|--------|-----|-------|
| 1. Bun + Vitest | Merged | #303 | Bun replaces npm. Vitest replaces Karma. 2679 tests, 143 files, ~4s. Chromium+Firefox+WebKit in CI. |
| 2. moduleResolution: bundler | Merged | #305 | bundler resolution, bunfig.toml with 48h minimumReleaseAge. |
| 2b. Package fixes | Merged | #308 | Fix broken module paths, remove helpers from published packages, delete repackage.mjs. |
| 3. Makefiles → Bun | Merged | #309 | tools/build.ts replaces Make+lerna. 0.3s clean build. All Makefiles, build.mk, lerna.json deleted. |
| 4. Biome | Merged | #310 | Replaces ESLint + Prettier. 27x faster. 5 deps removed, 6 new lint rules. |
| 5. knip | Not started | — | |
| 6. knip findings | Not started | — | |

## Context

TKO's build tooling was dated: Makefiles orchestrated esbuild, npm was the
package manager, TypeScript 6 the checker, and Karma ran browser tests. Recent
attempts to modernize (knip, moduleResolution changes) were reverted because
they were merged without review and broke the mocha migration.

This plan lays out a phased migration to a modern stack.

## Target stack

| Tool | Current | Target | Why |
|------|---------|--------|-----|
| Package manager | npm | Bun | 10-25x faster installs, built-in script runner |
| TypeScript checker | tsc (TS 6, JS) | tsgo (TS 7, Go-native) | 3-10x faster typechecking |
| Build orchestrator | Make + esbuild | Bun scripts + esbuild | Standard package.json scripts, no Make knowledge needed |
| Linter + formatter | ESLint + Prettier | Biome | Single tool, Rust-native, 10-100x faster |
| Linter (unused exports) | none | knip | Catches dead code, unused deps |
| Test runner | ~~Karma~~ Vitest | Vitest browser mode | Playwright (Chromium, Firefox, WebKit), ~4s for full suite |
| Version pinning | none | mise/asdf via `.tool-versions` | Reproducible environments |

## Security policy

- **minimumReleaseAge**: Enforced via `bunfig.toml` (`minimumReleaseAge = 172800`).
  Rejects package versions published less than 48 hours ago.
  Protects against supply-chain attacks via compromised fresh releases.
- Pin exact versions in `.tool-versions` (currently `bun 1.3.12`).
- Pin dev preview packages to exact versions (no `^`).
- Use `bun.lock` (committed) for deterministic installs.
- Use `bun install --frozen-lockfile` in CI.

## Phases

### Phase 1: Bun + Vitest (PR #303 — done)

Replaced npm with Bun and Karma with Vitest in a single PR:

- `.tool-versions` pins `bun 1.3.12`
- `bun.lock` replaces `package-lock.json`
- `vitest.config.ts` with Playwright browser mode (headless)
- CI runs Chromium + Firefox + WebKit via `VITEST_BROWSERS` env var
- Makefile and CI workflows updated to use `bunx` everywhere
- `tools/karma.conf.js` deleted, 7 karma deps removed
- `builds/knockout/helpers/mocha-test-helpers.js` converted to ESM
- `builds/knockout/helpers/vitest-setup.js` loads ko build + globals
- All 143 files, 2679 tests pass, 42 skipped, 0 failures

### Phase 2: tsgo (TypeScript 7)

**Blocked on Phase 1 merge.** Karma-esbuild read tsconfig, so changing
`moduleResolution` broke test builds. With Karma gone, this is unblocked.

tsgo requires `moduleResolution: "bundler"` (it removed `"node10"`). Under
`"bundler"`, TypeScript strictly follows `package.json` `exports` fields. TKO's
inter-package `@tko/*` imports resolve to `dist/index.js` (no types) instead of
`index.ts` (full types), causing 257 type errors.

**Root cause**: The `exports` field in each package.json points to `dist/` JS
files but has no `"types"` condition. Under `"node10"` this works because TS
ignores `exports` and finds `index.ts` directly.

**Fix** (verified — reduces 257 errors to 0):
- Add `"@tko/*": ["./packages/*/index.ts", "./builds/*/index.ts"]` to tsconfig
  `paths` so TS resolves to source during development
- Add `"types": "./index.ts"` to `exports` in each package.json (belt and suspenders)
- Export `Subscription` type from `@tko/observable` (fixes one deep import)
- Add type annotation to `bindings` const in `binding.core` (fixes inference issue)

Speed: tsc 0.96s → tsgo 0.35s (2.7x).

### Phase 3: Replace Makefiles with Bun scripts

**One PR per concern. Medium risk — touches shared infra.**

The Makefile currently does: build (esbuild), test (vitest), lint (eslint),
format (prettier), typecheck (tsc), dts generation, sweep/clean.

Migration:
- Move each Make target to a `package.json` script using `bun run`
- Use `bun --filter` for workspace-wide operations (replaces `lerna exec`)
- Delete `tools/build.mk` includes from per-package Makefiles
- Delete root Makefile last
- Update CI workflows to use `bun run build`, `bun run test`, etc.
- Update AGENTS.md build commands section

### Phase 4: Biome (replaces ESLint + Prettier)

**One PR. Medium risk — touches all linted files, but output should be identical.**

Biome is a single Rust-native tool that replaces both ESLint and Prettier.
10-100x faster, one config file (`biome.json`), one command.

Changes:
- Add `@biomejs/biome` as devDependency
- Create `biome.json` matching current ESLint + Prettier rules
- Run `biome check --write` to migrate all files
- Remove `eslint.config.js`, `.prettierrc`, eslint/prettier devDependencies
- Update CI: single `biome ci` command

### Phase 5: knip

**One PR. Low risk — linter only, no source changes.**

- Add `knip.json` config
- Add CI workflow for knip checks
- Fix any findings in follow-up PRs (separate from the linter setup)

### Phase 6 (future): knip findings

**One PR per category of finding.**

- Unused export cleanup
- Unused dependency removal
- `verbatimModuleSyntax` + import type fixes
- Dead IE code removal (detectIEVersion, browserSupportsProtoAssignment, etc.)

## Known follow-ups from Phase 1

- **`globalThis.after` shadows Vitest's `afterAll`** — rename to `addCleanup` across 25 spec files
- **setupFiles loads knockout build for all specs** — split into Vitest projects config
- **Helper duplication** (JS vs TS mocha-test-helpers) — extract shared module
- **CI workflow duplication** (test-headless.yml vs main-build.yml) — reusable workflow
- **jQuery test toggle** — need env var mechanism to enable jQuery path
- **Coverage** — add `@vitest/coverage-v8` when needed
- **Governance files** (AI_COMPLIANCE.md, AI_GLOSSARY.md, skills/) — review and likely remove

## Future considerations

- **esbuild → Bun bundler** — evaluate when Bun supports IIFE `globalName`

## Verification

Each phase must:
1. Pass all CI checks
2. Be verified locally before pushing
3. Be reviewed and approved before merge
