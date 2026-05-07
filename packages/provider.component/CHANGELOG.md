# @tko/provider.component

## 4.1.0

### Patch Changes

- 3aea21c: Modernize synthetic event construction

  `triggerEvent` (exported from `@tko/utils`) now builds synthetic events using
  `new MouseEvent`/`KeyboardEvent`/`Event` constructors instead of the
  deprecated `document.createEvent('HTMLEvents')` + `initEvent(...)` path. This
  restores native side-effects in modern DOM implementations (e.g. synthetic
  clicks toggle checkbox `.checked` in happy-dom) without changing behavior in
  real browsers. `relatedTarget` is still set to the target element for mouse
  events to match the previous init-event argument list.

  `@tko/binding.core` event handler no longer assigns the legacy
  `event.cancelBubble = true` before calling `event.stopPropagation()` — the
  assignment is redundant on modern events and readonly on some implementations.

  `@tko/provider.component` now uses `Object.prototype.toString.call(node)` to
  detect `HTMLUnknownElement` rather than `'' + node`, which is immune to
  user-land `toString` overrides on custom elements.

- Updated dependencies [bdac39c]
- Updated dependencies [3aea21c]
- Updated dependencies [49576cb]
  - @tko/computed@4.1.0
  - @tko/utils@4.1.0
  - @tko/utils.parser@4.1.0
  - @tko/observable@4.1.0
  - @tko/provider@4.1.0
  - @tko/utils.component@4.1.0

## 4.0.1

### Patch Changes

- 5598b3d: Add .js extensions to ESM dist imports for Node ESM compatibility

  Relative imports in ESM dist files now include `.js` extensions, fixing `ERR_MODULE_NOT_FOUND` in Node's strict ESM resolver and tools like vitest that use it.

- f5e3efc: Fix broken ESM module paths and remove test helpers from published packages

  The `module` field in 22 packages pointed to non-existent files (e.g., `dist/bind.js`). Fixed to `dist/index.js`. Test helpers are no longer included in published packages.

- Updated dependencies [5598b3d]
- Updated dependencies [f5e3efc]
- Updated dependencies [5598b3d]
  - @tko/computed@4.0.1
  - @tko/observable@4.0.1
  - @tko/provider@4.0.1
  - @tko/utils@4.0.1
  - @tko/utils.component@4.0.1
  - @tko/utils.parser@4.0.1

## 4.0.0

### Patch Changes

- Stabilize the full public TKO package set for the 4.0.0 release.
- Updated dependencies
  - @tko/computed@4.0.0
  - @tko/observable@4.0.0
  - @tko/provider@4.0.0
  - @tko/utils@4.0.0
  - @tko/utils.component@4.0.0
  - @tko/utils.parser@4.0.0
