# Plan: Add knip for dead code detection

## Context

knip detects unused files, dependencies, exports, and types in the codebase.
A previous attempt (PR #234) was reverted because it mixed the linter setup
with code changes (verbatimModuleSyntax, type refactoring, export cleanup)
in a single 56-file PR.

This time: Phase 5 adds the linter config + CI only. Phase 6 fixes findings
in separate, focused PRs.

## Findings (with config)

| Category | Count | Notes |
|---|---|---|
| Unused files | 3 | `builds/*/src/common.ts`, `tools/template/index.ts` |
| Unused dependencies | 8 | `@tko/*` packages not imported, declared in package.json |
| Unused devDependencies | 1 | `fs-extra` (leftover from old tooling) |
| Unlisted dependencies | 10 | `@tko/*` imports missing from package.json |
| Unused exports | 10 | Functions/classes exported but never imported |
| Unused exported types | 19 | Type-only exports never imported |
| Duplicate exports | 2 | Same symbol exported under two names |

## What this PR does

1. Add `knip.json` config with workspace awareness
2. Add `bun run knip` script to package.json
3. Add knip to CI (warn-only, non-blocking initially)
4. Remove `fs-extra` from devDependencies (genuinely unused)
5. Update AGENTS.md and plans/

## What this PR does NOT do

- No source code changes (no removing exports, deps, or files)
- No `verbatimModuleSyntax`
- No type refactoring
- Those come in Phase 6, one category per PR

## Verification

1. `bunx knip` runs cleanly with known findings
2. `bun run build` still works
3. `bunx vitest run` still passes
4. CI workflow runs and reports findings
