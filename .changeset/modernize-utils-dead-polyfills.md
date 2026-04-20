---
"@tko/utils": patch
"@tko/utils.parser": patch
"@tko/observable": patch
---

Drop dead polyfill probes from `@tko/utils`

Removes runtime feature detection for capabilities that all supported runtimes
(modern browsers, Node, Bun, happy-dom) already expose unconditionally:

- `functionSupportsLengthOverwrite` + `overwriteLengthPropertyIfSupported` —
  `Object.defineProperty(fn, 'length', …)` has worked since IE9. Call sites
  in `@tko/observable` now invoke `Object.defineProperty` directly.
- `useSymbols` — `Symbol` is always defined; `createSymbolOrString` always
  returns a `Symbol`.
- `stringTrim` — `String.prototype.trim` is always defined; simplified to
  `String(value).trim()`.
- `stringStartsWith` — delegates to `String.prototype.startsWith`.
- `toggleDomNodeCssClass` SVGAnimatedString fallback — `classList` is
  available on every supported `Element` (including SVG since SVG2).
- `parseJson` no longer routes through `stringTrim`; it trims inline when the
  input is a string.

`packages/utils.parser/src/preparse.ts` also guards `str.match(bindingToken)`
against the `null` return case using `?? []` — previously relied on the match
never returning `null` for the transformed input.
