# @tko/utils.jsx

## 4.1.0

### Minor Changes

- 7938c43: Add `options.jsxCleanBatchSize` (default `1000`) controlling JSX node cleanup
  batching. Setting it to `0` runs cleanup synchronously on detach. Registered
  via `defineOption` — the hardcoded `MAX_CLEAN_AT_ONCE` constant is gone, but
  the new default matches it so production behavior is unchanged.

  Fixes a `ReferenceError: Element is not defined` in the `cli-happy-dom` test
  project where the 25ms batch timer could fire after happy-dom had torn down
  DOM globals.

### Patch Changes

- Updated dependencies [bdac39c]
- Updated dependencies [3aea21c]
- Updated dependencies [49576cb]
  - @tko/computed@4.1.0
  - @tko/utils@4.1.0
  - @tko/observable@4.1.0
  - @tko/lifecycle@4.1.0
  - @tko/bind@4.1.0
  - @tko/provider.native@4.1.0

## 4.0.1

### Patch Changes

- 5598b3d: Add .js extensions to ESM dist imports for Node ESM compatibility

  Relative imports in ESM dist files now include `.js` extensions, fixing `ERR_MODULE_NOT_FOUND` in Node's strict ESM resolver and tools like vitest that use it.

- f5e3efc: Fix broken ESM module paths and remove test helpers from published packages

  The `module` field in 22 packages pointed to non-existent files (e.g., `dist/bind.js`). Fixed to `dist/index.js`. Test helpers are no longer included in published packages.

- Updated dependencies [5598b3d]
- Updated dependencies [f5e3efc]
- Updated dependencies [5598b3d]
  - @tko/bind@4.0.1
  - @tko/computed@4.0.1
  - @tko/lifecycle@4.0.1
  - @tko/observable@4.0.1
  - @tko/provider.native@4.0.1
  - @tko/utils@4.0.1

## 4.0.0

### Patch Changes

- Stabilize the full public TKO package set for the 4.0.0 release.
- Updated dependencies
  - @tko/bind@4.0.0
  - @tko/computed@4.0.0
  - @tko/lifecycle@4.0.0
  - @tko/observable@4.0.0
  - @tko/provider.native@4.0.0
  - @tko/utils@4.0.0
