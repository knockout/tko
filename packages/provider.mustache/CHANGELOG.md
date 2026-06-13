# @tko/provider.mustache

## 4.1.1

### Patch Changes

- b4f83e7: Fix AttributeMustacheProvider to use the mapped binding name (e.g. `css`) instead of the raw attribute name (e.g. `class`) when looking up and emitting a direct binding. In handler sets that register `css` but not a `class` alias, `class="{{ expr }}"` previously fell through to `attr.class` instead of activating the `css` binding handler.
  - @tko/observable@4.1.1
  - @tko/provider@4.1.1
  - @tko/utils.parser@4.1.1

## 4.1.0

### Patch Changes

- Updated dependencies [49576cb]
  - @tko/utils.parser@4.1.0
  - @tko/observable@4.1.0
  - @tko/provider@4.1.0

## 4.0.1

### Patch Changes

- 5598b3d: Add .js extensions to ESM dist imports for Node ESM compatibility

  Relative imports in ESM dist files now include `.js` extensions, fixing `ERR_MODULE_NOT_FOUND` in Node's strict ESM resolver and tools like vitest that use it.

- f5e3efc: Fix broken ESM module paths and remove test helpers from published packages

  The `module` field in 22 packages pointed to non-existent files (e.g., `dist/bind.js`). Fixed to `dist/index.js`. Test helpers are no longer included in published packages.

- Updated dependencies [5598b3d]
- Updated dependencies [f5e3efc]
- Updated dependencies [5598b3d]
  - @tko/binding.template@4.0.1
  - @tko/observable@4.0.1
  - @tko/provider@4.0.1
  - @tko/utils@4.0.1
  - @tko/utils.parser@4.0.1

## 4.0.0

### Patch Changes

- Stabilize the full public TKO package set for the 4.0.0 release.
- Updated dependencies
  - @tko/binding.template@4.0.0
  - @tko/observable@4.0.0
  - @tko/provider@4.0.0
  - @tko/utils@4.0.0
  - @tko/utils.parser@4.0.0
