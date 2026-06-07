# Plan: Node16/Nodenext-Compatible Published Types and Packaging

## Summary

Make the published `@tko/*` packages resolve cleanly across TypeScript's
modern package modes, not just `moduleResolution: "bundler"`.

This plan extends the per-package declaration work from
`plans/2026-06-04-dts-types-layout.md` by aligning the published JS entrypoints
and published declaration entrypoints for both `require` and `import`
consumers, then wiring those guarantees into publish verification.

## Current State

- Public packages publish `types/**/*.d.ts` and expose them through top-level
  `"types"` plus an `exports["."].types` condition.
- Most packages still point `exports["."].import` at `./dist/index.js` even
  though packages without `"type": "module"` also emit `./dist/index.mjs`.
- The generated declarations preserve extensionless relative imports, which are
  fine for bundler/CJS-style resolution but fail under ESM-flavored
  `node16`/`nodenext` declaration resolution.
- `@tko/build.knockout` and `@tko/build.reference` publish default-exported
  declarations that match the ESM surface but not the CommonJS surface.
- `.github/workflows/publish-check.yml` only does `npm pack --dry-run`, so
  published type regressions are not gated today.

## Desired State

- Every public package resolves under `bundler`, `node16`, and `nodenext`
  without ATTW suppressions for TKO's shipped entrypoints.
- Non-`type:module` packages expose ESM through `.mjs`, not `.js`.
- Published declarations are mode-aware:
  `import` consumers get ESM-compatible declarations and `require` consumers
  get CJS-compatible declarations.
- Publish verification fails on broken type/package metadata before merge.

## Implementation Plan

### 1. Generate mode-aware declarations

- Extend `tools/build-dts.ts` so each workspace gets:
  - baseline `.d.ts` output
  - ESM-flavored declaration copies (`.d.mts`) with explicit relative `.js`
    specifiers
  - CJS-flavored declaration copies (`.d.cts`) where needed for `require`
    resolution
- Special-case the build entrypoints so their CJS declaration entry advertises
  `export =` instead of `export default`.

### 2. Align package manifests with runtime output

- Update public package manifests so non-`type:module` packages expose
  `./dist/index.mjs` for the `import` condition.
- Use nested `exports` conditions so TypeScript can pick ESM declarations for
  `import` and CJS declarations for `require`.
- Keep backwards-compatible public entrypoints, especially for
  `@tko/build.knockout`.

### 3. Add publish-time verification

- Add `publint` and `@arethetypeswrong/cli --pack` to the publish-check
  workflow for every public package.
- Mirror the same checks in local scripts so regressions are caught before CI.

## Likely Files Touched

- `package.json`
- `.github/workflows/publish-check.yml`
- `tools/build-dts.ts`
- `packages/*/package.json`
- `builds/*/package.json`

## Verification

1. `bun run dts`
2. `bun run build`
3. `bun run verify:types` plus new node16/nodenext smoke coverage
4. `npx @arethetypeswrong/cli --pack <representative-package>` for leaf,
   utility, and build packages
5. `bun run verify:publish-types` and publish-check workflow parity
