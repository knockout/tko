---
"@tko/utils": minor
"@tko/utils.parser": patch
"@tko/observable": patch
"@tko/binding.core": patch
"@tko/binding.foreach": patch
"@tko/computed": patch
"@tko/lifecycle": patch
"@tko/builder": minor
---

Drop dead polyfill probes from `@tko/utils`

Removes runtime feature detection for capabilities that all supported runtimes
(modern browsers, Node, Bun, happy-dom) already expose unconditionally:

- `functionSupportsLengthOverwrite` + `overwriteLengthPropertyIfSupported` —
  `Object.defineProperty(fn, 'length', …)` has worked since IE9. Call sites
  in `@tko/observable` now invoke `Object.defineProperty` directly.
- `useSymbols` + `createSymbolOrString` — `Symbol` is always defined; call
  sites now use `Symbol(identifier)` directly. `createSymbolOrString` is no
  longer exposed on `ko.utils` (public API removal — minor bump for
  `@tko/utils` and `@tko/builder`).
- `stringTrim` + `stringStartsWith` — removed; call sites use
  `String(value ?? '').trim()` / `value.startsWith(prefix)` inline.
- `toggleDomNodeCssClass` SVGAnimatedString fallback — `classList` is
  available on every supported `Element` (including SVG since SVG2).
- `parseJson` no longer routes through `stringTrim`; it trims inline when the
  input is a string.

`packages/utils.parser/src/preparse.ts` also guards `str.match(bindingToken)`
against the `null` return case using `?? []` — previously relied on the match
never returning `null` for the transformed input.
