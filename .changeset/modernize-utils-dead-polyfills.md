---
"@tko/utils": patch
"@tko/utils.parser": patch
"@tko/observable": patch
"@tko/binding.core": patch
"@tko/binding.foreach": patch
"@tko/computed": patch
"@tko/lifecycle": patch
"@tko/builder": patch
---

Drop dead polyfill probes from `@tko/utils`

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
