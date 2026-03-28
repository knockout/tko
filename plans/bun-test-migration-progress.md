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

- `@tko/provider.component`
  - Verified with `bun test ./packages/provider.component/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 26 pass, 0 fail.
  - Notes: migrated both provider and custom-element specs to `bun:test`, native fake timers, shared Bun DOM helpers, and direct `DisposableStack` cleanup. Cross-checked against a clean `origin/main` Karma run: `26 SUCCESS`. Also replaced the old string-based unknown-element check in `ComponentProvider` with `instanceof HTMLUnknownElement`, which preserves browser behavior and fixes the Bun/happy-dom mismatch.

- `@tko/provider.mustache`
  - Verified with `bun test ./packages/provider.mustache/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 63 pass, 3 existing skip, 0 fail.
  - Notes: migrated the interpolation specs to `bun:test`, shared Bun DOM helpers, and explicit `it.skip(...)` for the existing legacy skipped coverage. Cross-checked against a clean `origin/main` Karma run: `63 SUCCESS`.

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

- `@tko/binding.if`
  - Verified with `bun test ./packages/binding.if/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 46 pass, 2 existing skip, 0 fail.
  - Notes: converted from Jasmine-style globals to explicit `bun:test` imports and Bun-native DOM helpers.

- `@tko/observable`
  - Verified with `bun test ./packages/observable/spec/*.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 113 pass, 0 fail.
  - Notes: uses native `DisposableStack` directly in migrated specs; updated legacy Jasmine-loose `null == undefined` expectations to reflect actual runtime behavior.

- `@tko/computed`
  - Verified with `bun test ./packages/computed/spec/asyncBehaviors.ts ./packages/computed/spec/computedDomBehaviors.ts ./packages/computed/spec/computedObservableBehaviors.ts ./packages/computed/spec/observableUtilsBehaviors.ts ./packages/computed/spec/pureComputedBehaviors.ts ./packages/computed/spec/proxyBehavior.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 160 pass, 0 fail.
  - Notes: migrated to native Bun fake timers and `mock`, removed dead browser-era compatibility guards, and kept spy assertions explicit instead of collapsing them to arrays. Cross-checked against a clean `origin/main` Karma run: `160 SUCCESS`. The only mismatch found during comparison was a stale `window`-based Proxy capability gate; Bun now checks runtime `Proxy` support directly.

- `@tko/binding.component`
  - Verified with `bun test ./packages/binding.component/spec/componentBindingBehaviors.ts` from `/Users/brianhunt/repos/tko`.
  - Status: 53 pass, 0 fail.
  - Notes: migrated to Bun fake timers, shared Bun DOM helpers, native `mock`, and direct `DisposableStack` cleanup/restore patterns. Cross-checked against a clean `origin/main` Karma run: `53 SUCCESS`.

### Shared Infrastructure

- Added `happy-dom` as a dev dependency at the repo root.
- Added `/Users/brianhunt/repos/tko/bunfig.toml` with a shared test preload.
- Added `/Users/brianhunt/repos/tko/tools/testing/happy-dom.ts` as the shared DOM environment for Bun tests.
- Updated the shared preload to override Bun's built-in DOM event constructors with the `happy-dom` equivalents so dispatched events match the simulated DOM.
- Added `/Users/brianhunt/repos/tko/tools/testing/bun-dom.ts` for Bun-native DOM test helpers and shared custom matchers.
- Added root-level package scripts: `test`, `test:coverage`, currently targeting the converted packages with explicit spec paths.
