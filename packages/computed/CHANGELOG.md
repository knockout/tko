# @tko/computed

## 4.1.0

### Patch Changes

- bdac39c: Fix `ko.proxy` `deleteProperty` trap silently doing nothing

  The `deleteProperty` handler on proxies built by `ko.proxy` declared only one
  parameter, named `property`. Per the Proxy spec, the trap is invoked with
  `(target, property)` — so the handler was receiving `target` (the internal
  `function(){}`) in place of the property key, stringifying it, and attempting
  to delete that bogus key. The actual property remained on both the mirror
  observable store and the underlying object, and its tracked observable stayed
  alive.

  `delete proxied.foo` now correctly removes `foo` from both the proxy and the
  underlying object and returns `true`. Added a regression test to
  `proxyBehavior.ts` — the bug had been present since `ko.proxy` was introduced
  in 2017 and was untested.

- 49576cb: Drop dead polyfill probes from `@tko/utils`

  Removes runtime feature detection for capabilities that all supported runtimes
  (modern browsers, Node, Bun, happy-dom) already expose unconditionally. The
  public API surface is preserved as one-line passthroughs in
  `packages/utils/src/compat.ts` so existing consumers continue to work; these
  shims are slated for removal in the next major.

  - `functionSupportsLengthOverwrite` + `overwriteLengthPropertyIfSupported` —
    `Object.defineProperty(fn, 'length', …)` has worked since IE9. Call sites
    in `@tko/observable` now invoke `Object.defineProperty` directly. The
    internal probe is gone; `overwriteLengthPropertyIfSupported` is preserved
    on `@tko/utils` exports as an inline `Object.defineProperty` call.
  - `useSymbols` + `createSymbolOrString` — `Symbol` is always defined; call
    sites now use `Symbol(identifier)` directly. `createSymbolOrString` is
    preserved as `s => Symbol(s)` on both `@tko/utils` exports and
    `ko.utils.createSymbolOrString`.
  - `stringTrim` + `stringStartsWith` — call sites use `String(value ?? '')
.trim()` / `value.startsWith(prefix)` inline. Both names remain exported
    from `@tko/utils` as inline passthroughs.
  - `toggleDomNodeCssClass` SVGAnimatedString fallback — `classList` is
    available on every supported `Element` (including SVG since SVG2).
  - `parseJson` no longer routes through `stringTrim`; it trims inline when the
    input is a string.

  `packages/utils.parser/src/preparse.ts` also guards `str.match(bindingToken)`
  against the `null` return case using `?? []` — previously relied on the match
  never returning `null` for the transformed input.

  Patch-level for all packages: zero observable surface change for consumers
  not reaching into internal probes (`useSymbols`, `functionSupportsLengthOverwrite`),
  which had no monorepo callers.

- Updated dependencies [3aea21c]
- Updated dependencies [49576cb]
  - @tko/utils@4.1.0
  - @tko/observable@4.1.0

## 4.0.1

### Patch Changes

- 5598b3d: Add .js extensions to ESM dist imports for Node ESM compatibility

  Relative imports in ESM dist files now include `.js` extensions, fixing `ERR_MODULE_NOT_FOUND` in Node's strict ESM resolver and tools like vitest that use it.

- f5e3efc: Fix broken ESM module paths and remove test helpers from published packages

  The `module` field in 22 packages pointed to non-existent files (e.g., `dist/bind.js`). Fixed to `dist/index.js`. Test helpers are no longer included in published packages.

- Updated dependencies [5598b3d]
- Updated dependencies [f5e3efc]
- Updated dependencies [5598b3d]
  - @tko/observable@4.0.1
  - @tko/utils@4.0.1

## 4.0.0

### Patch Changes

- Stabilize the full public TKO package set for the 4.0.0 release.
- Updated dependencies
  - @tko/observable@4.0.0
  - @tko/utils@4.0.0
