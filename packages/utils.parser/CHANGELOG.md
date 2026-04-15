# @tko/utils.parser

## 4.0.1

### Patch Changes

- 5598b3d: Add .js extensions to ESM dist imports for Node ESM compatibility

  Relative imports in ESM dist files now include `.js` extensions, fixing `ERR_MODULE_NOT_FOUND` in Node's strict ESM resolver and tools like vitest that use it.

- f5e3efc: Fix broken ESM module paths and remove test helpers from published packages

  The `module` field in 22 packages pointed to non-existent files (e.g., `dist/bind.js`). Fixed to `dist/index.js`. Test helpers are no longer included in published packages.

- 5598b3d: Fix `==` and `!=` parser error in binding expressions (#290)

  The `==` and `!=` operators in the reference build threw "unexpected nodes remain in shunting yard output stack" because the operator functions were missing `.precedence` metadata. Now all equality operator functions have correct precedence.

  Also adds `ko.options.strictEquality` — a configuration setter that controls whether `==`/`!=` use strict (`===`/`!==`) comparison in binding expressions. `@tko/build.reference` enables this by default.

- Updated dependencies [5598b3d]
- Updated dependencies [f5e3efc]
- Updated dependencies [5598b3d]
  - @tko/bind@4.0.1
  - @tko/binding.core@4.0.1
  - @tko/observable@4.0.1
  - @tko/provider.databind@4.0.1
  - @tko/utils@4.0.1

## 4.0.0

### Patch Changes

- Stabilize the full public TKO package set for the 4.0.0 release.
- Updated dependencies
  - @tko/bind@4.0.0
  - @tko/binding.core@4.0.0
  - @tko/observable@4.0.0
  - @tko/provider.databind@4.0.0
  - @tko/utils@4.0.0
