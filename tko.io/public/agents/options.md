# `ko.options.*` — Configurable Runtime Options

`ko.options` is TKO's runtime configuration singleton, defined in `packages/utils/src/options.ts`. Two mechanisms for adding options — this page explains which to reach for.

## Two mechanisms — when to use which

### `defineOption` (default — almost always use this)

For options that belong to a specific package (batch sizes, feature toggles,
plugin behavior), register via `defineOption` inside the owning package.

```ts
// packages/utils.jsx/src/jsxClean.ts
import { defineOption, options } from '@tko/utils'

// Extend the Options type so ko.options.<name> is strongly typed.
declare module '@tko/utils' {
  interface Options {
    jsxCleanBatchSize: number
  }
}

// Register at module load, with an optional side-effect setter.
defineOption('jsxCleanBatchSize', { default: 1000 })

// Read wherever the option applies.
if (options.jsxCleanBatchSize === 0) { /* sync path */ }
```

Rules:

- The `declare module '@tko/utils' { interface Options { ... } }` augmentation
  lives in the same file (or at least the same package) that defines the option.
- `defineOption` registers at module-side-effect time; the option is available
  as soon as the owning package is imported.
- An optional `set(value)` runs side effects at configuration time (not
  retroactively on already-parsed bindings) — use for options that swap
  implementations or rebuild internal state.

**Canonical example with a side-effect setter:**
`packages/utils.parser/src/operators.ts` → `strictEquality` swaps the `==`
and `!=` operator implementations when the option flips.

### Core `Options` class field (rare — only for `@tko/utils` intrinsics)

Add a field directly to the `Options` class in `packages/utils/src/options.ts`
**only** when the option is intrinsic to `@tko/utils` itself — something that
`@tko/utils` uses or enforces without knowing about any downstream package.

Current core fields include `templateSizeLimit`, `deferUpdates`,
`useOnlyNativeEvents`, `onError`, `sanitizeHtmlTemplate`.

Never add a core-class field for an option that belongs to another package.
Doing so forces `@tko/utils` to carry concepts from downstream packages and
creates a wrong-way dependency.

## Quick test

> Is the option intrinsic to `@tko/utils`?

- Yes → core class field.
- No → `defineOption` in the owning package.

In practice, new options are almost always the second case.
