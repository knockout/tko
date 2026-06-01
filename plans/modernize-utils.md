# Plan: Modernize `@tko/utils`

**Risk class:** LOW–MEDIUM — each phase is independently shippable and touches a
leaf package. Public API surface is preserved per phase.
**Owner:** brianmhunt

## Progress

| Phase | Status | PR | Notes |
|-------|--------|-----|-------|
| A. Dead polyfill probes | Ready | TBD | symbol, function, string, css — drop legacy shims. Net -40 lines. Branch `modernize/utils-dead-polyfills` already built and green (2698 browser + 2671 happy-dom tests). |
| B. tasks.ts microtask | Not started | — | Drop MutationObserver fallback; `queueMicrotask` is universally available. |
| C. object.ts | Not started | — | Adopt `Object.hasOwn` (ES2022); delete `@deprecated clonePlainObjectDeep`. |
| D. memoization.ts | Not started | — | Replace prototype-exposed `{}` store with `Map`. |
| E. array.ts idioms | Not started | — | Kill `arguments.length > 2 ? bind(thisArg)` pattern; inline native methods; standardise `[]` over `new Array()`. Public export names preserved. |
| F. ~~deferError bug~~ | Investigated — **not a bug** | — | Initial read claimed `deferError` routed through `options.onError` incorrectly. Existing spec `packages/utils/spec/onErrorBehaviors.ts` codifies this as intentional: when `onError` is installed, all TKO errors (deferred ones included) flow through it and do not re-escape to `window.onerror`. False positive. |

## Context

`@tko/utils` is the leaf dependency of almost every other TKO package. Parts of
it pre-date ES2015 as a baseline:

- `useSymbols = typeof Symbol === 'function'` (always `true` now)
- `functionSupportsLengthOverwrite` runtime probe (ES6 made `Function.length`
  configurable universally)
- `stringTrim` IE `\xa0` regex fallback (`String.prototype.trim` is ES5)
- `stringStartsWith` polyfill (ES6 native)
- `toggleDomNodeCssClass` SVGAnimatedString and string-className fallbacks
  (all `Element`s have `classList`)
- `tasks.ts` MutationObserver fallback (`queueMicrotask` since Safari 12.1 / 2018)
- `clonePlainObjectDeep` — flagged `@deprecated Function is unused`
- Plain-object dictionary stores with string keys (prototype pollution surface)
- `new Array()`, `substring`, `.apply(null, args || [])` — pre-spread idioms

The AGENTS.md rule "TKO is perf-sensitive — keep function bodies lean for
inlining" applies here; most modernization here reduces branching inside
hot-path utilities.

## Scope

**In scope.** Everything listed in the phase table. Public function names,
signatures, and documented behaviour are preserved. Types may be tightened
(e.g. `stringTrim(value: unknown): string` over the inferred `any`).

**Out of scope.**

- The `@tko/lifecycle` refactor (issue #322 — composition over mixins,
  `Symbol.dispose`). That is a separate, larger plan.
- Any public API removal. If a consumer depends on a function name today, it
  still works after this plan.
- The `deferError` swallowing bug — fixed on its own branch to keep this plan's
  scope surgical.

## Phases

### Phase A — Dead polyfill probes

Files: `symbol.ts`, `function.ts`, `string.ts`, `css.ts`, and a follow-on
null-default in `utils.parser/src/preparse.ts` that a tightened return type
surfaces.

- Remove `useSymbols` and `functionSupportsLengthOverwrite` internal probe
  exports. Neither has external consumers in the monorepo.
- `createSymbolOrString(id) -> Symbol(id)`.
- `overwriteLengthPropertyIfSupported` always applies.
- `stringTrim` delegates to `String.prototype.trim`.
- `stringStartsWith` delegates to `String.prototype.startsWith`.
- `toggleDomNodeCssClass` uses only `node.classList`.

Already implemented and green on `modernize/utils-dead-polyfills` —
branch: `f348e975 Drop dead polyfill probes from @tko/utils`.

### Phase B — tasks.ts microtask scheduler

File: `tasks.ts`.

- `queueMicrotask` is available in every supported runtime; drop the
  MutationObserver branch and the `setTimeout` final fallback.
- Collapse the scheduler selection block.
- Keep `schedule`, `cancel`, `runEarly`, `resetForTesting` exports intact.
- Validate against the MutationObserver-specific tests (if any) — `processTasks`
  recursion guard stays untouched.

### Phase C — object.ts

File: `object.ts`.

- Swap `Object.prototype.hasOwnProperty.call(obj, prop)` for `Object.hasOwn`.
  Public `hasOwnProperty` export keeps its name.
- Delete `clonePlainObjectDeep` (already `@deprecated Function is unused`).
  Verify no monorepo consumer first.
- Consider whether `extend` should simply delegate to `Object.assign` (keeps
  existing `hasOwn`-filtering semantics if any consumer relies on it — check
  first).

### Phase D — memoization.ts

File: `memoization.ts`.

- Replace `const memos = {}` dictionary with `new Map<string, Fn>()`.
- Replace `callback.apply(null, params || [])` with `callback(...params ?? [])`.
- Replace `new Array()` with `[]`.
- `generateRandomId` could adopt `crypto.randomUUID().slice(0,16)` but that's a
  values-change — skip for this plan.

### Phase E — array.ts idioms

File: `array.ts`.

- Remove `arguments.length > 2 ? action.bind(owner) : action` pattern; native
  `forEach`/`map`/`filter` accept `thisArg` directly. Public export signatures
  preserved (drop the third "owner" parameter? — API question, discuss in PR).
- Standardise `[]` over `new Array()`.
- Keep `compareArrays` / `findMovesInArrayComparison` — Levenshtein hot path,
  don't touch behaviour. Only cosmetic cleanup.

## Done signal

- All 2698 browser tests (chromium, firefox, webkit) pass.
- All 2671 happy-dom tests pass.
- `bunx tsc --noEmit` clean.
- `bunx @biomejs/biome check .` clean.
- Net line count decreases; public exports unchanged.

## Non-goals

- No changes to `dom/*` beyond what Phase A already covers in `css.ts`.
- No changes to `options.ts` — already well-typed and self-contained.
- No new utilities or abstractions. "Don't add features, refactor, or introduce
  abstractions beyond what the task requires" (AGENTS.md).
