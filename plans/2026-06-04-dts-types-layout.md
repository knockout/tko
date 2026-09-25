# Plan: Per-Package Types Output and Reference Build Declarations

## Summary

Replace the current repo-wide declaration emit with a published-layout model:

- every publishable workspace gets a generated `types/` folder
- `@tko/build.reference` publishes a bundled declaration entry from its own
  `types/` folder
- `@tko/build.knockout` publishes declarations for the KO-compatible default
  import that consumers already use at runtime
- package manifests advertise the generated declaration files instead of
  relying on source-only resolution

This is a packaging and build-pipeline change, not a runtime API redesign.
The goal is to make the shipped type surface match the shipped JS surface.

This plan addresses GitHub issue #384: the 4.x packages are TypeScript-authored
and ship source maps that point at `.ts` files, but the published packages do
not include `.d.ts` files or `types`/`typings` metadata. Consumers currently
hit missing-declaration errors for `@tko/build.knockout`,
`@tko/build.reference`, and modular `@tko/*` imports.

## Current State

- Root `package.json` runs `bunx tsc --build tsconfig.dts.json`.
- `tsconfig.dts.json` emits one
  repo-level declaration bundle to `builds/dts/dist/tko.d.ts`.
- Published package manifests currently ship only `dist/`.
- Most package manifests expose JS through `exports` and `module`, but do not
  point TypeScript at a published declaration artifact.
- Consumers importing `@tko/build.knockout`, `@tko/build.reference`, or an
  individual `@tko/*` package get missing-declaration errors because no
  package publishes `.d.ts` files.
- `builds/reference/types`
  exists in the tree today but is empty, so there is no established generated
  output contract yet.

## Desired State

- Each published package under `packages/*` generates `types/**/*.d.ts`.
- `@tko/build.reference` generates and publishes `types/index.d.ts` as its
  public declaration entrypoint.
- `@tko/build.knockout` generates and publishes `types/index.d.ts` for the
  backwards-compatible default import surface.
- Package consumers resolve declarations from published artifacts, not from
  repo-only source paths.
- The repo still supports fast local typechecking against source via
  `tsconfig.json` `paths`, but declaration generation uses a packaging-aware
  pipeline.
- Clean/verify scripts remove and rebuild `types/` outputs just like `dist/`.

## Constraints

- Do not weaken the current `moduleResolution: "bundler"` setup or the source
  resolution that keeps local `tsc` fast and accurate.
- Preserve the public JS entrypoints for all packages, especially
  `@tko/build.knockout`.
- Avoid introducing runtime dependencies into framework packages.
- Treat manifest changes as public-package surface changes: the generated type
  layout should be intentional and stable enough to publish.

## Implementation Plan

### 1. Replace the single-bundle d.ts strategy

- Retire the current `outFile`-based `tsconfig.dts.json` flow.
- Introduce a declaration-generation script or tsconfig setup that emits
  workspace-local declarations into `types/`.
- Add the types-folder to .gitignore
- Scope the generator to the 27 publishable workspaces (`packages/*`,
  `builds/reference`, `builds/knockout`) so the output layout mirrors publish
  boundaries.
- Emit declarations for `@tko/build.knockout` and `@tko/build.reference`
  explicitly, because issue #384 reports both build packages as currently
  untyped for consumers.

### 2. Emit per-package declarations

- For each package in `packages/*`, emit declarations rooted at
  `types/index.d.ts` plus any sibling declaration files needed by imports.
- Ensure emitted paths stay self-contained inside each package's `types/`
  folder and do not point back to repo-only source files.
- Verify that packages with re-export-heavy entrypoints still produce usable
  published declarations.

### 3. Bundle declarations for `@tko/build.reference`

- Generate declarations for the reference build from its published entrypoint,
  not from an ad hoc hand-maintained file.
- Bundle or flatten the reference build's public type surface into
  `builds/reference/types/index.d.ts`.
- Make the bundled reference declaration the only public type entry for
  `@tko/build.reference`, while its internal dependencies continue to publish
  their own package-local `types/` folders.
- Confirm the reference declaration captures the builder-created default export
  shape and its re-exported public symbols.

### 4. Generate declarations for `@tko/build.knockout`

- Generate declarations from the knockout build's published entrypoint.
- Preserve the KO-compatible default import surface so
  `import ko from '@tko/build.knockout'` typechecks without depending on the old
  `knockout` package or DefinitelyTyped.
- Verify the declaration output is compatible with the runtime export shape and
  does not accidentally advertise source-only internals.

### 5. Update package manifests

- Update every published workspace `package.json` to ship `types/` alongside
  `dist/`.
- Add top-level `"types"` entries that point at the generated declarations.
- Add `"types"` conditions inside `exports` for the main entrypoint so bundler
  resolution and published consumption agree.
- Update `builds/reference/package.json` to publish its bundled declaration
  entry from `types/index.d.ts`.
- Update `builds/knockout/package.json` to publish its declaration entry from
  `types/index.d.ts`.
- Update the root `package.json`
  scripts so `bun run dts` and `bun run clean` reflect the new output layout.

### 6. Clean up ignored/generated artifacts

- Extend ignore/cleanup rules so generated `types/` directories are treated the
  same way as generated `dist/` output.
- Remove any obsolete references to `builds/dts/dist/tko.d.ts`.
- Decide whether the empty checked-in `builds/reference/types/` directory stays
  as a generated path only or gains committed placeholders. Prefer generated
  output only unless a tool requires the directory to exist.

## Likely Files Touched During Implementation

- `package.json`
- `tsconfig.dts.json`
- `tsconfig.json`
- `.gitignore`
- `builds/reference/package.json`
- `builds/knockout/package.json`
- `packages/*/package.json`
- one new shared declaration-build script or supporting tsconfig files under
  `tools/` and/or repo root

## Verification

1. `bun run dts` creates `types/` folders for every publishable workspace.
2. `find packages builds -maxdepth 2 -name types -type d` shows the expected
   generated directories and no stray `builds/dts` output.
3. Consumer-style TypeScript smoke tests pass for:
   `import ko from '@tko/build.knockout'`,
   `import ko from '@tko/build.reference'`, and at least one modular
   `@tko/*` import.
4. `bun run build` still succeeds after the manifest changes.
5. `bun run tsc` still typechecks against source without published-artifact
   regressions.
6. `bun run verify` passes, since this change touches shared packaging
   infrastructure.
7. Spot-check packed contents for at least one leaf package,
   `@tko/build.knockout`, and `@tko/build.reference` to confirm both `dist/`
   and `types/` would publish.

## Release Notes / Follow-up

- Add a changeset when implementation lands, because this changes the
  published package layout and TypeScript consumption contract.
- If declaration bundling for `@tko/build.reference` needs a new dev-only tool,
  justify it explicitly in the implementation PR and keep it out of runtime
  package dependencies.
