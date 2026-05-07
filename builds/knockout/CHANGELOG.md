# @tko/build.knockout

## 4.1.0

### Patch Changes

- Updated dependencies [3aea21c]
- Updated dependencies [49576cb]
  - @tko/utils@4.1.0
  - @tko/binding.core@4.1.0
  - @tko/provider.component@4.1.0
  - @tko/binding.foreach@4.1.0
  - @tko/builder@4.1.0
  - @tko/binding.component@4.1.0
  - @tko/binding.if@4.1.0
  - @tko/binding.template@4.1.0
  - @tko/filter.punches@4.1.0
  - @tko/provider.attr@4.1.0
  - @tko/provider.databind@4.1.0
  - @tko/provider.multi@4.1.0
  - @tko/provider.virtual@4.1.0
  - @tko/utils.component@4.1.0
  - @tko/utils.functionrewrite@4.1.0

## 4.0.1

### Patch Changes

- 5598b3d: Add .js extensions to ESM dist imports for Node ESM compatibility

  Relative imports in ESM dist files now include `.js` extensions, fixing `ERR_MODULE_NOT_FOUND` in Node's strict ESM resolver and tools like vitest that use it.

- f5e3efc: Fix broken ESM module paths and remove test helpers from published packages

  The `module` field in 22 packages pointed to non-existent files (e.g., `dist/bind.js`). Fixed to `dist/index.js`. Test helpers are no longer included in published packages.

- Updated dependencies [5598b3d]
- Updated dependencies [f5e3efc]
  - @tko/binding.component@4.0.1
  - @tko/binding.core@4.0.1
  - @tko/binding.foreach@4.0.1
  - @tko/binding.if@4.0.1
  - @tko/binding.template@4.0.1
  - @tko/builder@4.0.1
  - @tko/filter.punches@4.0.1
  - @tko/provider.attr@4.0.1
  - @tko/provider.bindingstring@4.0.1
  - @tko/provider.component@4.0.1
  - @tko/provider.databind@4.0.1
  - @tko/provider.multi@4.0.1
  - @tko/provider.virtual@4.0.1
  - @tko/utils.component@4.0.1
  - @tko/utils.functionrewrite@4.0.1

## 4.0.0

### Patch Changes

- Stabilize the full public TKO package set for the 4.0.0 release.
- Updated dependencies
  - @tko/binding.component@4.0.0
  - @tko/binding.core@4.0.0
  - @tko/binding.foreach@4.0.0
  - @tko/binding.if@4.0.0
  - @tko/binding.template@4.0.0
  - @tko/builder@4.0.0
  - @tko/filter.punches@4.0.0
  - @tko/provider.attr@4.0.0
  - @tko/provider.bindingstring@4.0.0
  - @tko/provider.component@4.0.0
  - @tko/provider.databind@4.0.0
  - @tko/provider.multi@4.0.0
  - @tko/provider.virtual@4.0.0
  - @tko/utils.component@4.0.0
  - @tko/utils.functionrewrite@4.0.0
