# Bun Test Migration Progress

## Shared Strategy

- Run tests directly with `bun test`. Do not add a Karma adapter or workspace runner.
- Use one shared Bun DOM preload at `/Users/brianhunt/repos/tko/tools/testing/happy-dom.ts` so DOM-capable packages do not duplicate environment setup.
- Keep existing spec filenames. Do not rename files just to satisfy Bun discovery.
- Use explicit spec paths from the repo root, for example `bun test ./packages/utils.parser/spec/*.ts`.
- Verify converted packages from the repo root with explicit spec paths. Do not add package-local Bun command complexity during this phase.
- Keep package write scopes isolated during parallel conversion: avoid package-level runner churn unless a package truly needs code changes for Bun compatibility.

## Progress

### Completed

- `@tko/utils.parser`
  - Verified with `bun test ./packages/utils.parser/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 191 pass, 1 existing skip, 0 fail.

- `@tko/lifecycle`
  - Verified with `bun test ./packages/lifecycle/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 16 pass, 0 fail.

- `@tko/provider.attr`
  - Verified with `bun test ./packages/provider.attr/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 3 pass, 0 fail.

- `@tko/utils.functionrewrite`
  - Verified with `bun test ./packages/utils.functionrewrite/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 11 pass, 0 fail.

- `@tko/provider.bindingstring`
  - Verified with `bun test ./packages/provider.bindingstring/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 2 pass, 0 fail.

- `@tko/provider.multi`
  - Verified with `bun test ./packages/provider.multi/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 9 pass, 0 fail.

- `@tko/provider.native`
  - Verified with `bun test ./packages/provider.native/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 10 pass, 0 fail.

- `@tko/provider`
  - Verified with `bun test ./packages/provider/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 3 pass, 0 fail.

- `@tko/provider.databind`
  - Verified with `bun test ./packages/provider.databind/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 31 pass, 0 fail.

- `@tko/provider.virtual`
  - Verified with `bun test ./packages/provider.virtual/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 6 pass, 0 fail.

- `@tko/utils.jsx`
  - Verified with `bun test ./packages/utils.jsx/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 121 pass, 0 fail.

- `@tko/builder`
  - Verified with `bun test ./packages/builder/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 1 pass, 0 fail.

- `@tko/filter.punches`
  - Verified with `bun test ./packages/filter.punches/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 6 pass, 6 existing skip, 0 fail.

- `@tko/binding.foreach`
  - Verified with `bun test ./packages/binding.foreach/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 81 pass, 0 fail.

### Shared Infrastructure

- Added `happy-dom` as a dev dependency at the repo root.
- Added `/Users/brianhunt/repos/tko/bunfig.toml` with a shared test preload.
- Added `/Users/brianhunt/repos/tko/tools/testing/happy-dom.ts` as the shared DOM environment for Bun tests.
- Updated the shared preload to override Bun's built-in DOM event constructors with the `happy-dom` equivalents so dispatched events match the simulated DOM.
- Added root-level package scripts: `test`, `test:coverage`, currently targeting the converted packages with explicit spec paths.
